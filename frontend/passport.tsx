import {
  useBase,
  useRecords,
  Loader,
  Button,
  Box,
  useGlobalConfig,
  useWatchable,
  useSettingsButton,
  Heading,
  ProgressBar,
} from "@airtable/blocks/ui";
import _ from 'lodash';
import { NANONETS_API_KEY, NANONETS_MODEL_ID } from "./settings";
import { FieldType } from "@airtable/blocks/models";

import * as querystring from "qs";
import { cursor, viewport } from "@airtable/blocks";

// export const PASSPORT_ATTACHMENT_FIELD_NAME = "Attachments";
export const REVIEW_FIELD_NAME = "Review";

const MAX_RECORDS_PER_UPDATE = 50;

import React, { Fragment, useState } from "react";
import { AppStates } from "./settings";

export function PassportExtraction({ appData, setAppData }) {
  const base = useBase();
  const globalConfig = useGlobalConfig();
  const apiKey = globalConfig.get(NANONETS_API_KEY) as string;
  const modelId = globalConfig.get(NANONETS_MODEL_ID) as string;
  const tableNameAsStr = appData.source.table;
  const fieldNameAsStr = appData.source.passportField;
  const [currentStep, setCurrentStep] = useState('Initializing');
  const [progress, setProgress] = useState(0.0);

  const table = base.getTableByNameIfExists(tableNameAsStr);
  const passportAttachments = table.getFieldByName(fieldNameAsStr);
  const records = useRecords(table, {
    fields: [passportAttachments],
  });
  const [isUpdateInProgress, setIsUpdateInProgress] = useState(false);

  const permissionCheck = table.checkPermissionsForUpdateRecord(undefined, {
    [fieldNameAsStr]: undefined,
  });

  async function onButtonClick() {
    setIsUpdateInProgress(true);
    await extractAndUpdatePassportDetails(
      apiKey,
      modelId,
      table,
      passportAttachments,
      records,
      setProgress,
      setCurrentStep
    );
    // await updateRecordsInBatchesAsync(table, recordUpdates);
    setIsUpdateInProgress(false);
    const updatedAppData = { ...appData };
    updatedAppData.appState = AppStates.EXTRACTION_REVIEW;
    setAppData(updatedAppData);
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      width={viewport.size.width}
      height={viewport.size.height}
    >
      <Box maxWidth='580px'>
        {isUpdateInProgress ? (
          <Box>
            <Box display='flex'>
              <Heading size='xsmall'>{currentStep}</Heading>
            </Box>
            <ProgressBar progress={progress} />
          </Box>
        ) : (
            <Fragment>
              <Button variant="primary" onClick={onButtonClick} disabled={!permissionCheck.hasPermission} marginBottom={3}>Start Extraction</Button>
              {!permissionCheck.hasPermission}
            </Fragment>
          )}
      </Box>
    </Box>
  );
}

async function extractAndUpdatePassportDetails(
  apiKey,
  modelId,
  table,
  passportAttachment,
  records,
  setProgress,
  setCurrentStep
) {
  const totalRecords = records.length;
  // for (const record of records) {
  const allPromises = _.take(records, 1).map(async function (record, index) {
    setCurrentStep("Extracting Data - " + (index + 1) + " of " + totalRecords);
    const passport = record.getCellValue(passportAttachment);
    if (passport) {
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
      setProgress((index + 1) / totalRecords);
      setCurrentStep("Extracted Data - " + (index + 1) + " of " + totalRecords);
    }
  });

  await Promise.all(allPromises);
}

async function extractPassportFields(apiKey, modelId, url) {
  const API_ENDPOINT = `https://app.nanonets.com/api/v2/OCR/Model/${modelId}/LabelUrls/`;
  const formData = { urls: url };
  try {
    const fetchParams = {
      body: querystring.stringify(formData),
      headers: {
        Authorization: "Basic " + Buffer.from(apiKey + ":").toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    };
    console.log(fetchParams);
    console.log(API_ENDPOINT);
    const response = await fetch(API_ENDPOINT, fetchParams);
    return response.json();
  } catch (e) {
    console.error(e);
    return {};
  }
}
