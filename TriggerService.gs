/**
 * Service for managing Google Apps Script triggers and week counter
 */

/**
 * Starts the weekly email schedule by setting up triggers
 */
function startSchedule() {
  resetWeekCounter();
  deleteTriggers();
  createWeeklyTrigger();
}

/**
 * Resets the week counter to start fresh
 */
function resetWeekCounter() {
  PropertiesService.getScriptProperties().setProperty(PROPERTY_KEYS.WEEKS_CREATED, "0");
}

/**
 * Gets the current number of weeks created
 */
function getWeeksCreated() {
  const props = PropertiesService.getScriptProperties();
  return Number(props.getProperty(PROPERTY_KEYS.WEEKS_CREATED) || 0);
}

/**
 * Increments the week counter and checks if we should stop
 */
function incrementWeekCounter(currentWeeks) {
  const newCount = currentWeeks + 1;
  PropertiesService.getScriptProperties().setProperty(PROPERTY_KEYS.WEEKS_CREATED, String(newCount));
  
  if (newCount >= CONFIG.weeksTotal) {
    deleteTriggers();
  }
}

/**
 * Creates the weekly trigger for automated email drafts
 */
function createWeeklyTrigger() {
  const weekDay = getWeekDayConstant_(CONFIG.sendDay);
  
  ScriptApp.newTrigger("createWeeklyDraft")
    .timeBased()
    .everyWeeks(1)
    .onWeekDay(weekDay)
    .atHour(CONFIG.sendHourLocal)
    .nearMinute(CONFIG.sendMinuteLocal)
    .create();
}

/**
 * Maps day names to ScriptApp.WeekDay constants
 */
function getWeekDayConstant_(dayName) {
  const dayMapping = {
    "SUNDAY": ScriptApp.WeekDay.SUNDAY,
    "MONDAY": ScriptApp.WeekDay.MONDAY,
    "TUESDAY": ScriptApp.WeekDay.TUESDAY,
    "WEDNESDAY": ScriptApp.WeekDay.WEDNESDAY,
    "THURSDAY": ScriptApp.WeekDay.THURSDAY,
    "FRIDAY": ScriptApp.WeekDay.FRIDAY,
    "SATURDAY": ScriptApp.WeekDay.SATURDAY,
  };
  
  const weekDay = dayMapping[String(dayName).toUpperCase()];
  if (!weekDay) {
    throw new Error(`Invalid day name: ${dayName}. Must be one of: ${Object.keys(dayMapping).join(", ")}`);
  }
  
  return weekDay;
}

/**
 * Deletes all existing triggers for this project
 */
function deleteTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
}
