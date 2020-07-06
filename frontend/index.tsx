import {
  initializeBlock,
  useViewport,
  useSettingsButton,
  Box,
} from "@airtable/blocks/ui";
import { runInfo } from "@airtable/blocks";

import { useSettings } from "./settings";
import { PassportExtraction } from "./passport";
import { TableStructureBlock } from "./review";
import React, { Fragment, useState, useEffect } from "react";
import { Welcome } from "./Welcome";

export const AppStates = Object.freeze({
  CONFIGURING_SETTINGS: "configuringSettings",
  PASSPORT_EXTRACTION: "passportExtraction",
  EXTRACTION_REVIEW: "extractionReview",
  REVIEW_COMPLETED: "reviewCompleted",
});

function PassportExtractionBlock() {
  const viewport = useViewport();
  const { isValid, message, settings } = useSettings();
  const [isShowingSettings, setIsShowingSettings] = useState(false);
  const [appData, setAppData] = useState({
    // On first run of the block show the settings screen.
    appState: AppStates.CONFIGURING_SETTINGS,
  });

  const { appState } = appData;

  function showSettings() {
    useSettingsButton(function () {
      setIsShowingSettings(isShowingSettings);
    });

    setAppData({
      appState: AppStates.CONFIGURING_SETTINGS,
    });
  }

  switch (appState) {
    case AppStates.CONFIGURING_SETTINGS:
      return (
        <Welcome
          appData={appData}
          setAppData={setAppData}
          onShowSettings={showSettings}
        />
      );
    case AppStates.PASSPORT_EXTRACTION:
      return (
        <PassportExtraction
          setAppData={setAppData}
          onShowSettings={showSettings}
        />
      );
    case AppStates.EXTRACTION_REVIEW:
      return <TableStructureBlock setAppData={setAppData} />;
    //TO-DO Add user review stats
    case AppStates.REVIEW_COMPLETED:
      return <Box />;
  }
}

initializeBlock(() => <PassportExtractionBlock />);
