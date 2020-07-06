import {
  Box,
  useRecords,
  Text,
  useBase,
  useViewport,
  useViewMetadata,
  useWatchable,
  FieldIcon,
  Button,
  Icon,
  Select,
} from "@airtable/blocks/ui";
import { cursor, viewport } from "@airtable/blocks";
import { FieldType } from "@airtable/blocks/models";
import React, { useState } from "react";
import { AppStates } from ".";
import Image from "react-image-resizer";
import { PASSPORT_ATTACHMENT_FIELD_NAME, REVIEW_FIELD_NAME } from "./passport";

const FIELD_CELL_WIDTH_PERCENTAGE = "35%";
const FIELD_DESCRIPTION_CELL_WIDTH_PERCENTAGE = "65%";

export function TableStructureBlock({ setAppData }) {
  const base = useBase();
  const viewport = useViewport();

  useWatchable(cursor, ["activeTableId", "activeViewId"]);

  // table can be null if it's a new table being created and activeViewId can be null while the
  // table is loading, so we use "ifExists" to allow for these situations.
  const table = base.getTableByIdIfExists(cursor.activeTableId);
  const view = table && table.getViewByIdIfExists(cursor.activeViewId);
  viewport.enterFullscreenIfPossible();
  if (table && view) {
    return (
      <ReviewScreen
        base={base}
        table={table}
        view={view}
        setAppData={setAppData}
      />
    );
  } else {
    // Still loading table and/or view.
    return null;
  }
}

function ReviewScreen({ base, table, view, setAppData }) {
  const viewMetadata = useViewMetadata(view);
  const records = useRecords(table).filter(
    (record, idx, arr) =>
      record.getCellValue(PASSPORT_ATTACHMENT_FIELD_NAME) != null
  );
  const length = records.length;
  const [recordNumber, setRecordNumber] = useState(0);
  const options = [
    { value: "Not verified", label: "Not verified" },
    { value: "Approve", label: "Approve" },
    { value: "Reject", label: "Reject" },
  ];
  const [value, setValue] = useState(options[0].value);

  async function showNextRecord() {
    setRecordNumber(recordNumber + 1);
    displayRecord();
  }

  async function markReviewComplete() {
    viewport.exitFullscreen();
    setAppData({ appState: AppStates.CONFIGURING_SETTINGS });
  }

  async function updateReview({ newValue }) {
    setValue(newValue);
    const obj = {
      id: records[recordNumber].id,
      fields: { Review: { name: newValue } },
    };
    await table.updateRecordsAsync([obj]);
  }

  function showReviewComplete() {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        border="default"
        flexDirection="column"
        width={viewport.size.width}
        height={viewport.size.height}
        padding={0}
      >
        <Text size="xlarge">Review Complete!</Text>
        <Button
          icon={<Icon name="check" />}
          variant="primary"
          onClick={markReviewComplete}
        >
          Back to Base
        </Button>
      </Box>
    );
  }

  //TO-DO: Add Prev and Exit Buttons For Review
  function displayRecord() {
    const record = records[recordNumber];
    if (recordNumber < length)
      return (
        <Box>
          <Box display="flex" alignItems="center">
            <Box min-width={500} margin="5px">
              <Image
                height={500}
                width={500}
                src={record.getCellValue(PASSPORT_ATTACHMENT_FIELD_NAME)[0].url}
                fluid
              ></Image>
            </Box>
            <Box margin="20px 15px" overflow="scroll" maxHeight="650px">
              <HeaderRow />
              {viewMetadata.visibleFields.map((field) => {
                return (
                  <FieldRow
                    base={base}
                    table={table}
                    field={field}
                    key={field.id}
                    value={record.getCellValueAsString(field.id)}
                  />
                );
              })}
            </Box>
          </Box>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexDirection="column"
            marginBottom="15px"
          >
            <Text size="large">Review</Text>
            <Select
              options={options}
              value={record.getCellValueAsString(REVIEW_FIELD_NAME)}
              onChange={(newValue) => updateReview({ newValue })}
              width="320px"
            />
          </Box>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexDirection="column"
          >
            <Button
              icon={<Icon name="right" />}
              variant="primary"
              onClick={showNextRecord}
            >
              Next
            </Button>
          </Box>
        </Box>
      );
    else {
      return showReviewComplete();
    }
  }

  return displayRecord();
}

// Presentational header row helper component.
function HeaderRow() {
  return (
    <Row hasThickBorderBottom={true}>
      <Cell width={FIELD_CELL_WIDTH_PERCENTAGE}>
        <Text textColor="light">Field</Text>
      </Cell>
      <Cell width={FIELD_DESCRIPTION_CELL_WIDTH_PERCENTAGE}>
        <Text textColor="light">Field value</Text>
      </Cell>
    </Row>
  );
}

function FieldRow({ field, value }) {
  const fieldType = getHumanReadableFieldType(field);

  return (
    <Row>
      <Cell width={FIELD_CELL_WIDTH_PERCENTAGE}>
        <Text fontWeight="strong">{field.name}</Text>
        <Text
          textColor="light"
          display="flex"
          alignItems="center"
          marginTop={1}
        >
          <FieldIcon field={field} marginRight={1} /> {fieldType}
        </Text>
      </Cell>
      <Cell width={FIELD_DESCRIPTION_CELL_WIDTH_PERCENTAGE}>
        <Text variant="paragraph" margin={0} style={{ whiteSpace: "pre" }}>
          {value}
        </Text>
      </Cell>
    </Row>
  );
}

function getHumanReadableFieldType(field) {
  // Format the field types to more closely match those in Airtable's UI
  switch (field.type) {
    case FieldType.DATE_TIME:
      return "Date with time";
    case FieldType.MULTILINE_TEXT:
      return "Long text";
    case FieldType.MULTIPLE_ATTACHMENTS:
      return "Attachments";
    case FieldType.MULTIPLE_RECORD_LINKS:
      return "Linked records";
    case FieldType.MULTIPLE_SELECTS:
      return "Multiple select";
    case FieldType.URL:
      return "URL";
    default:
      // For everything else, just convert it from camel case
      // https://stackoverflow.com/questions/4149276/how-to-convert-camelcase-to-camel-case
      return field.type
        .replace(/([A-Z])/g, " $1")
        .toLowerCase()
        .replace(/^./, function (str) {
          return str.toUpperCase();
        });
  }
}

// Renders the content in a horizontal row.
function Row({ children, isHeader }) {
  return (
    <Box
      display="flex"
      borderBottom={isHeader ? "thick" : "default"}
      paddingY={2}
    >
      {children}
    </Box>
  );
}

// Renders a table cell with border and children.
function Cell({ children, width }) {
  return (
    <Box flex="none" width={width} paddingRight={1}>
      {children}
    </Box>
  );
}
