/**
 * Service for retrieving and processing practice schedules from Google Sheets
 */

/**
 * Gets practices for the current week from the configured spreadsheet
 */
function getPracticesForCurrentWeek() {
  const weekWindow = getCurrentWeekWindow_();
  const practiceData = getSheetData_();
  const teamPractices = filterPracticesForTeamAndWeek_(practiceData, weekWindow);
  
  return sortPracticesByDateTime_(teamPractices);
}

/**
 * Retrieves raw data from the configured Google Sheet
 */
function getSheetData_() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  const sheet = spreadsheet.getSheetByName(CONFIG.sheetName);
  
  if (!sheet) {
    throw new Error(`Sheet "${CONFIG.sheetName}" not found`);
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  // Get data from row 2 onwards, columns A through H
  return sheet.getRange(2, 1, lastRow - 1, 8).getValues();
}

/**
 * Filters practice data for the configured team and specified week
 */
function filterPracticesForTeamAndWeek_(sheetData, weekWindow) {
  const practices = [];
  
  sheetData.forEach(row => {
    const [dateCell, startTime, endTime, teamName, , , , fieldLocation] = row;
    
    if (String(teamName || "").trim() !== CONFIG.teamName) return;
    
    const practiceDate = coerceToDate_(dateCell, CONFIG.timeZone);
    if (!practiceDate) return;
    
    if (practiceDate >= weekWindow.start && practiceDate <= weekWindow.end) {
      practices.push({
        date: new Date(practiceDate),
        timeStart: startTime,
        timeEnd: endTime,
        location: String(fieldLocation || "").trim()
      });
    }
  });
  
  return practices;
}

/**
 * Sorts practices by date and time
 */
function sortPracticesByDateTime_(practices) {
  return practices.sort((a, b) => {
    const dateComparison = a.date - b.date;
    if (dateComparison !== 0) return dateComparison;
    
    const timeA = coerceToTimeMinutes_(a.timeStart) ?? 0;
    const timeB = coerceToTimeMinutes_(b.timeStart) ?? 0;
    return timeA - timeB;
  });
}

/**
 * Renders practices into HTML and text formats for email
 */
function renderPractices(practices) {
  if (!practices || practices.length === 0) {
    return { htmlList: "", textList: "" };
  }

  const htmlItems = [];
  const textItems = [];

  practices.forEach(practice => {
    const dateString = formatLocal_(practice.date, "EEE, MMM d");
    const startTime = formatTimeFromMinutes_(coerceToTimeMinutes_(practice.timeStart));
    const endTime = formatTimeFromMinutes_(coerceToTimeMinutes_(practice.timeEnd));
    const location = practice.location || "";

    const timeRange = `${startTime || "?"} – ${endTime || "?"}`;
    const locationText = location ? ` @ ${location}` : "";
    
    const htmlItem = `<li><strong>${dateString}</strong>: ${timeRange}${locationText}</li>`;
    const textItem = `- ${dateString}: ${timeRange}${locationText}`;

    htmlItems.push(htmlItem);
    textItems.push(textItem);
  });

  return {
    htmlList: `<ul>${htmlItems.join("\n")}</ul>`,
    textList: textItems.join("\n")
  };
}
