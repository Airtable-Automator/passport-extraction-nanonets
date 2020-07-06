import { useGlobalConfig } from "@airtable/blocks/ui";
export const NANONETS_API_KEY = "nanonetsApiKey";
export const NANONETS_MODEL_ID = "nanonetsModelId";

export const AppStates = Object.freeze({
  CONFIGURING_SETTINGS: "configuringSettings",
  CHOOSE_SOURCE: "chooseSource",
  PASSPORT_EXTRACTION: "passportExtraction",
  EXTRACTION_REVIEW: "extractionReview",
  REVIEW_COMPLETED: "reviewCompleted",
});

export function useSettings() {
  const globalConfig = useGlobalConfig();
  const apiKey = globalConfig.get(NANONETS_API_KEY);
  const modelId = globalConfig.get(NANONETS_MODEL_ID);
  const settings = {
    apiKey,
    modelId,
  };

  if (!apiKey || apiKey === "") {
    return {
      isValid: false,
      message: "Enter an API Key for Nanonets",
      settings,
    };
  }
  if (!modelId || modelId === "") {
    return {
      isValid: false,
      message: "Provide model id to use from Nanonets",
    };
  }
  return {
    isValid: true,
    settings,
  };
}
