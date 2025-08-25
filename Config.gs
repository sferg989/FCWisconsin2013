/**
 * Configuration constants for FC Wisconsin 2013 RCP weekly email automation
 */

const CONFIG = Object.freeze({
  // Email settings
  contactLabel: "FC WI 2013 RCP",
  useBcc: false,
  subjectPrefix: "Weekly – ",
  timeZone: "America/Chicago",

  // Schedule settings
  sendDay: "MONDAY",
  sendHourLocal: 6,
  sendMinuteLocal: 30,
  weeksTotal: 12,

  // Spreadsheet settings
  spreadsheetId: "1qk3jaFgBlSzbXn737A_-VL7Wn3wk8kuVpkBxxvSorsE",
  sheetName: "Germantown",
  teamName: "13UB RCP",
  weekStartsOn: "SUNDAY",
});

// Property keys for script properties
const PROPERTY_KEYS = Object.freeze({
  WEEKS_CREATED: "weeksCreated"
});
