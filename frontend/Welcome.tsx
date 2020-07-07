import {
  Box,
  Text,
  Link,
  FormField,
  InputSynced,
  useViewport,
  useGlobalConfig,
  Heading,
  Button,
  Icon,
  Loader,
  useSettingsButton,
} from "@airtable/blocks/ui";
import React, { useState } from "react";
import { NANONETS_API_KEY, NANONETS_MODEL_ID, AppStates, useSettings } from "./settings";

export function Welcome({ appData, setAppData, setIsShowingSettings }) {
  const settings = useSettings();

  const viewport = useViewport();

  const close = async (e) => {
    e.preventDefault();
    setIsShowingSettings(false);
  };

  const isValid = settings.isValid;

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      border="default"
      flexDirection="column"
      padding='20px 0'>
      <Box maxWidth="500px">
        <Box marginBottom="15px">
          <Heading size="xlarge">Passport Extraction</Heading>
          <Text size="large" marginBottom="10px" textAlign="justify">
            This block uses models that are built in nanonets. You can setup an
            account in nanonets and add the Passport OCR model to get started.
            Provide below the api key and the id of the model you want to use.
          </Text>
          <Box marginBottom="25px">
            <Link href="https://nanonets.com" target="_blank" icon="hyperlink">
              Nanonets
            </Link>
          </Box>
          <Box>
            <Heading size="large">Nanonets API Settings</Heading>
          </Box>
        </Box>

        <form onSubmit={close}>
          <Box>
            <FormField label="Nanonets API Key">
              <InputSynced
                globalConfigKey={NANONETS_API_KEY}
              />
            </FormField>
            <FormField label="Nanonets Model Id">
              <InputSynced
                globalConfigKey={NANONETS_MODEL_ID}
              />
            </FormField>
          </Box>

          <Box>
            <Button icon='settings' variant="primary" disabled={!isValid} onClick={close}>Close</Button>
          </Box>
        </form>
      </Box>
    </Box>
  );
}
