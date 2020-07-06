import {
  useBase,
  useRecords,
  Loader,
  Button,
  Box,
  useGlobalConfig,
  useWatchable,
  useSettingsButton,
} from "@airtable/blocks/ui";
import { NANONETS_API_KEY, NANONETS_MODEL_ID } from "./settings";
import { FieldType } from "@airtable/blocks/models";

import * as querystring from "querystring";
import { cursor, viewport } from "@airtable/blocks";

export const PASSPORT_ATTACHMENT_FIELD_NAME = "Attachments";
export const REVIEW_FIELD_NAME = "Review";

const MAX_RECORDS_PER_UPDATE = 50;

import React, { Fragment, useState } from "react";
import { AppStates } from ".";

export function PassportExtraction({ setAppData, onShowSettings }) {
  const base = useBase();
  const globalConfig = useGlobalConfig();
  const apiKey = globalConfig.get(NANONETS_API_KEY) as string;
  const modelId = globalConfig.get(NANONETS_MODEL_ID) as string;

  useWatchable(cursor, ["activeTableId", "activeViewId"]);

  const table = base.getTableByIdIfExists(cursor.activeTableId);
  const passportAttachments = table.getFieldByName(
    PASSPORT_ATTACHMENT_FIELD_NAME
  );
  const records = useRecords(table, {
    fields: [passportAttachments],
  });
  const [isUpdateInProgress, setIsUpdateInProgress] = useState(false);

  const permissionCheck = table.checkPermissionsForUpdateRecord(undefined, {
    [PASSPORT_ATTACHMENT_FIELD_NAME]: undefined,
  });

  useSettingsButton(() => {
    viewport.enterFullscreenIfPossible();
  });

  async function onButtonClick() {
    setIsUpdateInProgress(true);
    await extractAndUpdatePassportDetails(
      apiKey,
      modelId,
      table,
      passportAttachments,
      records
    );
    // await updateRecordsInBatchesAsync(table, recordUpdates);
    setIsUpdateInProgress(false);
    setAppData({ appState: AppStates.EXTRACTION_REVIEW });
  }

  return (
    <Box
      position="absolute"
      top="0"
      bottom="0"
      left="0"
      right="0"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      {isUpdateInProgress ? (
        <Loader />
      ) : (
        <Fragment>
          <Button
            variant="primary"
            onClick={onButtonClick}
            disabled={!permissionCheck.hasPermission}
            marginBottom={3}
          >
            Extract passport details
          </Button>
          {!permissionCheck.hasPermission}
        </Fragment>
      )}
    </Box>
  );
}

async function extractAndUpdatePassportDetails(
  apiKey,
  modelId,
  table,
  passportAttachment,
  records
) {
  const recordUpdates = [];
  for (const record of records) {
    const passport = record.getCellValue(passportAttachment);
    if (passport === null) continue;
    const imageUrl = passport[0].url;

    const response = await extractPassportFields(apiKey, modelId, imageUrl);
    console.log(response);
    const result = response.result[0];
    var obj = {};
    for (const prediction of result.prediction) {
      let key = prediction.label;
      let value = prediction.ocr_text;
      obj[key] = value;
      if (table.getFieldByNameIfExists(key) == null) {
        await table.unstable_createFieldAsync(key, FieldType.SINGLE_LINE_TEXT);
      }
    }
    const options = {
      choices: [
        {
          name: "Not verified",
        },
        {
          name: "Approve",
        },
        {
          name: "Reject",
        },
      ],
    };
    if (table.getFieldByNameIfExists(REVIEW_FIELD_NAME) == null) {
      await table.unstable_createFieldAsync(
        REVIEW_FIELD_NAME,
        FieldType.SINGLE_SELECT,
        options
      );
      obj[REVIEW_FIELD_NAME] = options.choices[0];
    }

    const recordUpdate = {
      id: record.id,
      fields: obj,
    };
    await table.updateRecordsAsync([recordUpdate]);
    recordUpdates.push(recordUpdate);
  }
  return recordUpdates;
}

async function extractPassportFields(apiKey, modelId, url) {
  const API_ENDPOINT = `https://app.nanonets.com/api/v2/OCR/Model/${modelId}/LabelUrls/`;
  const formData = { urls: [url] };
  const response = fetch(API_ENDPOINT, {
    body: querystring.stringify(formData),
    headers: {
      Authorization: "Basic " + Buffer.from(apiKey + ":").toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  })
    .then((response) => response.json())
    .catch(function (error) {
      console.log(error);
    });
  return response;
}
