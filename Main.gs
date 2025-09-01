/**
 * Main entry points for FC Wisconsin 2013 RCP weekly email automation
 * 
 * This file contains the primary functions that Google Apps Script will call.
 * Other functions are organized into separate service files.
 */

/**
 * Main function to create weekly email draft
 * Called automatically by trigger or manually
 */
function createWeeklyDraft() {
  const weeksCreated = getWeeksCreated();
  
  if (weeksCreated >= CONFIG.weeksTotal) {
    deleteTriggers();
    return;
  }

  const emails = getRecipientEmails();
  const subject = generateSubject();
  const practices = getPracticesForCurrentWeek();
  const upcomingGames = getUpcomingGames();
  const { htmlBody, plainText } = generateEmailTemplates(practices, upcomingGames);

  createEmailDraft(emails, subject, plainText, htmlBody);
  incrementWeekCounter(weeksCreated);
}

/**
 * Main function to schedule weekly email for next Monday at 6:30 AM
 * Called manually to schedule an email
 */
function scheduleWeeklyEmail() {
  const emails = getRecipientEmails();
  const subject = generateSubject();
  const practices = getPracticesForCurrentWeek();
  const upcomingGames = getUpcomingGames();
  const { htmlBody, plainText } = generateEmailTemplates(practices, upcomingGames);

  const result = scheduleEmail(emails, subject, plainText, htmlBody);
  
  console.log(`Email scheduled successfully!`);
  console.log(`Draft ID: ${result.draftId}`);
  console.log(`Scheduled to send: ${result.scheduledTime.toLocaleString("en-US", { timeZone: CONFIG.timeZone })}`);
  
  return result;
}

/**
 * Check if there's a scheduled email and when it's set to send
 */
function checkScheduledEmail() {
  const props = PropertiesService.getScriptProperties();
  const draftId = props.getProperty("SCHEDULED_DRAFT_ID");
  const scheduledTime = props.getProperty("SCHEDULED_SEND_TIME");
  
  if (!draftId || !scheduledTime) {
    console.log("No email currently scheduled");
    return null;
  }
  
  const sendTime = new Date(scheduledTime);
  console.log(`Email scheduled to send: ${sendTime.toLocaleString("en-US", { timeZone: CONFIG.timeZone })}`);
  console.log(`Draft ID: ${draftId}`);
  
  return {
    draftId: draftId,
    scheduledTime: sendTime
  };
}

/**
 * Cancel a scheduled email
 */
function cancelScheduledEmail() {
  const props = PropertiesService.getScriptProperties();
  const draftId = props.getProperty("SCHEDULED_DRAFT_ID");
  
  if (!draftId) {
    console.log("No email currently scheduled");
    return false;
  }
  
  // Delete the trigger
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === "sendScheduledDraft") {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Clean up stored properties
  props.deleteProperty("SCHEDULED_DRAFT_ID");
  props.deleteProperty("SCHEDULED_SEND_TIME");
  
  console.log("Scheduled email cancelled successfully");
  return true;
}

/**
 * Test function to verify email scheduling functionality
 * Tests the next Monday calculation and scheduling logic
 */
function testEmailScheduling() {
  console.log("Testing email scheduling functionality...");
  
  try {
    const nextMonday = getNextMondayAt630AM_();
    console.log(`Next Monday at 6:30 AM will be: ${nextMonday.toLocaleString("en-US", { timeZone: CONFIG.timeZone })}`);
    
    const currentScheduled = checkScheduledEmail();
    if (currentScheduled) {
      console.log("There is already a scheduled email. Test completed without scheduling a new one.");
      return {
        success: true,
        nextMondayCalculation: nextMonday,
        existingSchedule: currentScheduled,
        message: "Test completed - email already scheduled"
      };
    }
    
    console.log("No existing scheduled email. Scheduling test would work.");
    console.log("Run scheduleWeeklyEmail() to actually schedule an email.");
    
    return {
      success: true,
      nextMondayCalculation: nextMonday,
      message: "Test completed successfully - ready to schedule"
    };
    
  } catch (error) {
    console.error("Test failed:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Manual function to test email generation without sending
 * Useful for testing and debugging
 */
function testEmailGeneration() {
  console.log("Testing email generation...");
  
  try {
    const emails = getRecipientEmails();
    console.log(`Found ${emails.length} recipients`);
    
    const subject = generateSubject();
    console.log(`Subject: ${subject}`);
    
    const practices = getPracticesForCurrentWeek();
    console.log(`Found ${practices.length} practices this week`);
    
    const upcomingGames = getUpcomingGames();
    console.log(`Found ${upcomingGames.length} upcoming games`);
    
    const { htmlBody, plainText } = generateEmailTemplates(practices, upcomingGames);
    console.log("Email templates generated successfully");
    
    console.log("Test completed successfully!");
    return {
      recipientCount: emails.length,
      subject: subject,
      practiceCount: practices.length,
      gameCount: upcomingGames.length,
      success: true
    };
  } catch (error) {
    console.error("Test failed:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Manual function to check practices for current week
 * Useful for debugging schedule issues
 */
function checkCurrentWeekPractices() {
  try {
    const practices = getPracticesForCurrentWeek();
    const weekWindow = getCurrentWeekWindow_();
    
    console.log(`Week window: ${weekWindow.start.toDateString()} to ${weekWindow.end.toDateString()}`);
    console.log(`Found ${practices.length} practices:`);
    
    practices.forEach((practice, index) => {
      const dateStr = formatLocal_(practice.date, "EEE, MMM d");
      const startTime = formatTimeFromMinutes_(coerceToTimeMinutes_(practice.timeStart));
      const endTime = formatTimeFromMinutes_(coerceToTimeMinutes_(practice.timeEnd));
      const location = practice.location || "No location";
      
      console.log(`${index + 1}. ${dateStr}: ${startTime} - ${endTime} @ ${location}`);
    });
    
    return practices;
  } catch (error) {
    console.error("Error checking practices:", error.message);
    throw error;
  }
}

/**
 * Manual function to check contact label recipients
 * Useful for debugging contact issues
 */
function checkContactLabelRecipients() {
  try {
    const emails = getRecipientEmails();
    console.log(`Found ${emails.length} recipients in label "${CONFIG.contactLabel}":`);
    emails.forEach((email, index) => {
      console.log(`${index + 1}. ${email}`);
    });
    
    return emails;
  } catch (error) {
    console.error("Error checking recipients:", error.message);
    throw error;
  }
}
