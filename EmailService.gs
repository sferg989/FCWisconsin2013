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

    <p><strong>Upcoming Games</strong></p>
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

    <p><strong>League Schedule</strong></p>
    <p>Once the league schedule is finalized, I'll upload it to <strong>Sprocket Sports</strong> and send out an update.</p>
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

Upcoming Games
${gamesText || "- No upcoming games scheduled."}
------------------------------

Tournaments
- EBU Select Cup – Sept 19–21
  (Schedule will be added to Sprocket Sports as soon as it's released.)
- Racine Lighthouse Classic – Oct 3–5
------------------------------

League Schedule
Once the league schedule is finalized, I'll upload it to Sprocket Sports and send out an update.
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
