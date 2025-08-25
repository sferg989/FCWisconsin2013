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
 * Gets upcoming games for the 13UB RCP team from the team schedules sheet
 */
function getUpcomingGames() {
  const gameData = getTeamScheduleData_();
  const upcomingGames = filterUpcomingGamesForTeam_(gameData);
  
  return sortGamesByDate_(upcomingGames);
}

/**
 * Retrieves raw data from the team schedules sheet
 */
function getTeamScheduleData_() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  const sheet = spreadsheet.getSheetByName("Team Schedules");
  
  if (!sheet) {
    throw new Error('Sheet "Team Schedules" not found');
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  // Get data from row 2 onwards, columns A through H
  return sheet.getRange(2, 1, lastRow - 1, 8).getValues();
}

/**
 * Filters game data for upcoming games of the 13UB RCP team that have an opponent
 */
function filterUpcomingGamesForTeam_(sheetData) {
  const games = [];
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  sheetData.forEach(row => {
    const [dateCell, startTime, , teamName, opponent, , location, field] = row;
    
    // Filter for 13UB RCP team
    if (String(teamName || "").trim() !== CONFIG.teamName) return;
    
    // Must have an opponent (VS. column)
    const opponentName = String(opponent || "").trim();
    if (!opponentName) return;
    
    const gameDate = coerceToDate_(dateCell, CONFIG.timeZone);
    if (!gameDate) return;
    
    // Only include upcoming games (today or later)
    if (gameDate >= todayMidnight) {
      games.push({
        date: new Date(gameDate),
        time: startTime,
        opponent: opponentName,
        location: String(location || "").trim(),
        field: String(field || "").trim()
      });
    }
  });
  
  return games;
}

/**
 * Sorts games by date
 */
function sortGamesByDate_(games) {
  return games.sort((a, b) => a.date - b.date);
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

/**
 * Renders upcoming games into HTML and text formats for email
 */
function renderUpcomingGames(games) {
  if (!games || games.length === 0) {
    return { htmlList: "", textList: "" };
  }

  const htmlItems = [];
  const textItems = [];

  games.forEach(game => {
    const dateString = formatLocal_(game.date, "EEE, MMM d");
    const timeString = game.time ? formatTimeFromMinutes_(coerceToTimeMinutes_(game.time)) : "TBA";
    const opponent = game.opponent;
    const location = game.location || "TBA";
    const field = game.field ? ` (${game.field})` : "";
    
    const htmlItem = `<li><strong>${dateString}</strong> at ${timeString} vs ${opponent}<br><em>${location}${field}</em></li>`;
    const textItem = `- ${dateString} at ${timeString} vs ${opponent}\n  ${location}${field}`;

    htmlItems.push(htmlItem);
    textItems.push(textItem);
  });

  return {
    htmlList: `<ul>${htmlItems.join("\n")}</ul>`,
    textList: textItems.join("\n")
  };
}
