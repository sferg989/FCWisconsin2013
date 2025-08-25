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
