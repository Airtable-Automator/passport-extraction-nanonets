import {
  Box,
  useRecords,
  Text,
  useBase,
  useViewport,
  FieldIcon,
  Button,
  Icon,
  Select,
} from "@airtable/blocks/ui";
import { viewport } from "@airtable/blocks";
import { FieldType } from "@airtable/blocks/models";
import React, { useState } from "react";
import { AppStates } from "./settings";
import { REVIEW_FIELD_NAME } from "./passport";

const FIELD_CELL_WIDTH_PERCENTAGE = "35%";
const FIELD_DESCRIPTION_CELL_WIDTH_PERCENTAGE = "65%";

export function TableStructureBlock({ appData, setAppData }) {
  const base = useBase();
  const viewport = useViewport();
  const fieldNameAsStr = appData.source.passportField;
  const tableNameAsStr = appData.source.table;

  const table = base.getTableByNameIfExists(tableNameAsStr);
  viewport.enterFullscreenIfPossible();
  if (table) {
    return (
      <ReviewScreen
        fieldName={fieldNameAsStr}
        base={base}
        table={table}
        appData={appData}
        setAppData={setAppData}
      />
    );
  } else {
    // Still loading table and/or view.
    return null;
  }
}

function ReviewScreen({ fieldName, base, table, appData, setAppData }) {
  const records = useRecords(table).filter(
    (record, idx, arr) =>
      record.getCellValue(fieldName) != null
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
    const updatedAppData = { ...appData };
    updatedAppData.appState = AppStates.CHOOSE_SOURCE;
    setAppData(updatedAppData);
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
              <img
                height={500}
                width={500}
                src={record.getCellValue(fieldName)[0].url}
              />
            </Box>
            <Box margin="20px 15px" overflow="scroll" maxHeight="650px">
              <HeaderRow />
              {table.fields.map((field) => {
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
