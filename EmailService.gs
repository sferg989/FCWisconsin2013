/**
 * Service for email template generation and Gmail draft creation
 */

/**
 * Gets recipient email addresses from the configured contact label
 */
function getRecipientEmails() {
  const emails = getEmailsFromContactLabel(CONFIG.contactLabel);
  if (emails.length === 0) {
    throw new Error(`No email addresses found in contact label: ${CONFIG.contactLabel}`);
  }
  return emails;
}

/**
 * Generates email subject with current date
 */
function generateSubject() {
  const today = new Date();
  const dateString = Utilities.formatDate(today, CONFIG.timeZone, "MMMM d, yyyy");
  return CONFIG.subjectPrefix + dateString;
}

/**
 * Generates both HTML and plain text email templates
 */
function generateEmailTemplates(practices, upcomingGames) {
  const { htmlList, textList } = renderPractices(practices);
  const { htmlList: gamesHtml, textList: gamesText } = renderUpcomingGames(upcomingGames);
  
  return {
    htmlBody: createHtmlTemplate(htmlList, gamesHtml),
    plainText: createPlainTextTemplate(textList, gamesText)
  };
}

/**
 * Creates the HTML email template
 */
function createHtmlTemplate(practicesHtml, gamesHtml) {
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; line-height:1.5; color:#111; max-width:680px">
    <p>Hi All,</p>
    <p>A few quick reminders and important dates to help everyone stay organized.</p>
    <hr>

    <p><strong>Training Reminders</strong></p>
    <ul>
      <li><strong>Training Jersey:</strong> Please ensure the boys wear their training jersey to each session.</li>
      <li><strong>Equipment:</strong> Bring a <strong>fully inflated size 5 ball</strong>, enough water, and their bag to keep gear organized.</li>
    </ul>
    <hr>

    <p><strong>Goalkeeper Training</strong></p>
    <ul>
      <li><strong>Thursdays:</strong> 5:00 PM – 6:30 PM</li>
    </ul>
    <hr>

    <p><strong>This Week's Practices</strong></p>
    ${practicesHtml || `<p><em>No practices found for this week.</em></p>`}
    <hr>

    <p><strong>League Schedule</strong></p>
    ${gamesHtml || `<p><em>No upcoming games scheduled.</em></p>`}
    <hr>

    <p><strong>Tournaments</strong></p>
    <ul>
      <li><strong>EBU Select Cup</strong> – <strong>Sept 19–21</strong><br>
        <em>(Schedule will be added to Sprocket Sports as soon as it's released.)</em>
      </li>
      <li><strong>Racine Lighthouse Classic</strong> – <strong>Oct 3–5</strong></li>
    </ul>
    <hr>

    <p>If you have any questions, feel free to reach out.<br>
    Otherwise, I hope everyone has a great week!</p>

    <p>Thanks,<br>Steve Ferguson</p>
  </div>`;
}

/**
 * Creates the plain text email template
 */
function createPlainTextTemplate(practicesText, gamesText) {
  return `Hi All,

A few quick reminders and important dates to help everyone stay organized.
------------------------------

Training Reminders
- Training Jersey: Please ensure the boys wear their training jersey to each session.
- Equipment: Bring a fully inflated size 5 ball, enough water, and their bag to keep gear organized.
------------------------------

Goalkeeper Training
- Thursdays: 5:00 PM – 6:30 PM
------------------------------

This Week's Practices
${practicesText || "- No practices found for this week."}
------------------------------

League Schedule
${gamesText || "- No upcoming games scheduled."}
------------------------------

Tournaments
- EBU Select Cup – Sept 19–21
  (Schedule will be added to Sprocket Sports as soon as it's released.)
- Racine Lighthouse Classic – Oct 3–5
------------------------------

If you have any questions, feel free to reach out.
Otherwise, I hope everyone has a great week.

Thanks,
Steve Ferguson`.trim();
}

/**
 * Creates a Gmail draft with the provided content
 */
function createEmailDraft(emails, subject, plainText, htmlBody) {
  const recipients = emails.join(",");
  
  if (CONFIG.useBcc) {
    GmailApp.createDraft("", subject, plainText, { 
      bcc: recipients, 
      htmlBody 
    });
  } else {
    GmailApp.createDraft(recipients, subject, plainText, { htmlBody });
  }
}

/**
 * Schedules an email to be sent at the next Monday at 6:30 AM
 */
function scheduleEmail(emails, subject, plainText, htmlBody) {
  const scheduledTime = getNextMondayAt630AM_();
  const recipients = emails.join(",");
  
  // Create a draft first
  let draft;
  if (CONFIG.useBcc) {
    draft = GmailApp.createDraft("", subject, plainText, { 
      bcc: recipients, 
      htmlBody 
    });
  } else {
    draft = GmailApp.createDraft(recipients, subject, plainText, { htmlBody });
  }
  
  // Schedule the draft to be sent
  const draftId = draft.getId();
  
  // Create a time-based trigger to send the email at the scheduled time
  ScriptApp.newTrigger("sendScheduledDraft")
    .timeBased()
    .at(scheduledTime)
    .create();
  
  // Store the draft ID so we can send it later
  const props = PropertiesService.getScriptProperties();
  props.setProperty("SCHEDULED_DRAFT_ID", draftId);
  props.setProperty("SCHEDULED_SEND_TIME", scheduledTime.toISOString());
  
  console.log(`Email scheduled to send on ${scheduledTime.toLocaleString("en-US", { timeZone: CONFIG.timeZone })}`);
  
  return {
    draftId: draftId,
    scheduledTime: scheduledTime
  };
}

/**
 * Sends the scheduled draft email
 * Called automatically by trigger at the scheduled time
 */
function sendScheduledDraft() {
  const props = PropertiesService.getScriptProperties();
  const draftId = props.getProperty("SCHEDULED_DRAFT_ID");
  
  if (!draftId) {
    console.error("No scheduled draft ID found");
    return;
  }
  
  try {
    const draft = GmailApp.getDraft(draftId);
    draft.send();
    
    console.log(`Scheduled email sent successfully at ${new Date().toLocaleString("en-US", { timeZone: CONFIG.timeZone })}`);
    
    // Clean up stored properties
    props.deleteProperty("SCHEDULED_DRAFT_ID");
    props.deleteProperty("SCHEDULED_SEND_TIME");
    
  } catch (error) {
    console.error("Error sending scheduled draft:", error.message);
    throw error;
  }
}
