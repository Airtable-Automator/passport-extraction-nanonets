import {
  initializeBlock,
  useViewport,
  useSettingsButton,
  Box,
} from "@airtable/blocks/ui";

import { useSettings, AppStates } from "./settings";
import { PassportExtraction } from "./passport";
import { TableStructureBlock } from "./review";
import React, { Fragment, useState, useEffect } from "react";
import { Welcome } from "./Welcome";
import { ChooseSource } from "./ChooseSource";

function PassportExtractionBlock() {
  const viewport = useViewport();
  const { isValid, message, settings } = useSettings();
  const [isShowingSettings, setIsShowingSettings] = useState(false);
  const [appData, setAppData] = useState({
    appState: AppStates.CHOOSE_SOURCE,
    source: {}
  });

  useSettingsButton(function () {
    setIsShowingSettings(!isShowingSettings);
  });

  if (!isValid || isShowingSettings) {
    return (<Welcome appData={appData} setAppData={setAppData} setIsShowingSettings={setIsShowingSettings} />);
  }

  switch (appData.appState) {
    case AppStates.CHOOSE_SOURCE:
      return (
        <ChooseSource
          appData={appData}
          setAppData={setAppData}
        />
      );
    case AppStates.PASSPORT_EXTRACTION:
      return (
        <PassportExtraction
          appData={appData}
          setAppData={setAppData}
        />
      );
    case AppStates.EXTRACTION_REVIEW:
      return <TableStructureBlock appData={appData} setAppData={setAppData} />;
    //TO-DO Add user review stats
    case AppStates.REVIEW_COMPLETED:
      return <Box />;
  }
}

initializeBlock(() => <PassportExtractionBlock />);
