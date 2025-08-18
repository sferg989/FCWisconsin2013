/*** ====== CONFIG ====== ***/
const CONFIG = {
  // Email / contacts
  contactLabel: "FC WI 2013 RCP",  // EXACT Google Contacts label name
  useBcc: false,                   // true = draft has recipients in BCC
  subjectPrefix: "Weekly – ",      // subject will be prefix + today's date
  timeZone: "America/Chicago",

  // Schedule for draft creation
  sendDay: "MONDAY",               // MONDAY, TUESDAY, ... SUNDAY
  sendHourLocal: 6,                // hour part: 6 AM
  sendMinuteLocal: 30,             // minute part: :30
  weeksTotal: 12,                  // stop after 12 drafts

  // Spreadsheet settings
  spreadsheetId: "1qk3jaFgBlSzbXn737A_-VL7Wn3wk8kuVpkBxxvSorsE",
  sheetName: "Germantown",
  teamName: "13UB RCP",            // match Column D (FCW TEAM)
  weekStartsOn: "SUNDAY",          // SUNDAY → SATURDAY week window
};

/*** ====== MAIN: CREATE WEEKLY DRAFT ====== ***/
function createWeeklyDraft() {
  const props = PropertiesService.getScriptProperties();
  const weeksCreated = Number(props.getProperty("weeksCreated") || 0);

  if (weeksCreated >= CONFIG.weeksTotal) {
    deleteTriggers();
    return;
  }

  // Build recipient list from People API contact label
  const emails = getEmailsFromContactLabelPeople_(CONFIG.contactLabel);
  if (emails.length === 0) throw new Error("No email addresses found in contact label: " + CONFIG.contactLabel);

  // Subject with local date (e.g., "Weekly – August 11, 2025")
  const now = new Date();
  const subjectDate = Utilities.formatDate(now, CONFIG.timeZone, "MMMM d, yyyy");
  const subject = CONFIG.subjectPrefix + subjectDate;

  // Build the practices list for the current week
  const practices = getPracticesForCurrentWeek_();
  const { htmlList, textList } = renderPractices_(practices);

  // ---------- HTML BODY (with <hr> formatting) ----------
  const htmlBody = `
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

    <p><strong>This Week’s Practices</strong></p>
    ${htmlList || `<p><em>No practices found for this week.</em></p>`}
    <hr>

    <p><strong>Tournaments</strong></p>
    <ul>
      <li><strong>EBU Select Cup</strong> – <strong>Sept 19–21</strong><br>
        <em>(Schedule will be added to Sprocket Sports as soon as it’s released.)</em>
      </li>
      <li><strong>Racine Lighthouse Classic</strong> – <strong>Oct 3–5</strong></li>
    </ul>
    <hr>

    <p><strong>League Schedule</strong></p>
    <p>Once the league schedule is finalized, I’ll upload it to <strong>Sprocket Sports</strong> and send out an update.</p>
    <hr>

    <p>If you have any questions, feel free to reach out.<br>
    Otherwise, I hope everyone has a great week — looking forward to seeing you all next week!</p>

    <p>Thanks,<br>Steve Ferguson</p>
  </div>
  `;

  // ---------- PLAIN TEXT (mirrors HR as dashed lines) ----------
  const plainText = `
Hi All,

A few quick reminders and important dates to help everyone stay organized.
------------------------------

Training Reminders
- Training Jersey: Please ensure the boys wear their training jersey to each session.
- Equipment: Bring a fully inflated size 5 ball, enough water, and their bag to keep gear organized.
------------------------------

Goalkeeper Training
- Thursdays: 5:00 PM – 6:30 PM
------------------------------

This Week’s Practices
${textList || "- No practices found for this week."}
------------------------------

Tournaments
- EBU Select Cup – Sept 19–21
  (Schedule will be added to Sprocket Sports as soon as it’s released.)
- Racine Lighthouse Classic – Oct 3–5
------------------------------

League Schedule
Once the league schedule is finalized, I’ll upload it to Sprocket Sports and send out an update.
------------------------------

If you have any questions, feel free to reach out.
Otherwise, I hope everyone has a great week — looking forward to seeing you all next week!

Thanks,
Steve Ferguson
  `.trim();

  // Create the draft
  if (CONFIG.useBcc) {
    GmailApp.createDraft(
      "", // leave "To" empty so you can add notes if needed
      subject,
      plainText,
      { bcc: emails.join(","), htmlBody }
    );
  } else {
    GmailApp.createDraft(
      emails.join(","),
      subject,
      plainText,
      { htmlBody }
    );
  }

  // Persist counter and stop when done
  PropertiesService.getScriptProperties().setProperty("weeksCreated", String(weeksCreated + 1));
  if (weeksCreated + 1 >= CONFIG.weeksTotal) deleteTriggers();
}

/*** ====== PEOPLE API HELPERS (Advanced Service) ====== ***/
// Get all emails belonging to a contact label (group) by its displayed name.
function getEmailsFromContactLabelPeople_(labelName) {
  // 1) Find the contact group by formattedName
  const groups = People.ContactGroups.list({ pageSize: 200 }).contactGroups || [];
  const group = groups.find(g => (g.formattedName || "").trim() === String(labelName).trim());
  if (!group) {
    throw new Error(`Contact group not found by name "${labelName}". Available groups: ${groups.map(g => g.formattedName).join(", ")}`);
  }

  const groupResourceName = group.resourceName; // e.g., "contactGroups/123abc"
  const groupId = (groupResourceName || "").split("/")[1]; // "123abc"

  // 2) List all connections and filter by membership in that group
  const emails = [];
  let pageToken;
  do {
    const resp = People.People.Connections.list("people/me", {
      pageSize: 1000,
      pageToken,
      personFields: "emailAddresses,memberships",
      sources: ["READ_SOURCE_TYPE_CONTACT"],
    });

    const connections = resp.connections || [];
    for (const person of connections) {
      const memberships = person.memberships || [];
      const inGroup = memberships.some(m => {
        const cg = m.contactGroupMembership;
        if (!cg) return false;
        // Match either the resource name or the id
        return (cg.contactGroupResourceName === groupResourceName) || (cg.contactGroupId === groupId);
      });

      if (inGroup && person.emailAddresses && person.emailAddresses.length) {
        // Pick primary if present, else first
        const primary = person.emailAddresses.find(e => e.metadata && e.metadata.primary) || person.emailAddresses[0];
        if (primary && primary.value) emails.push(primary.value);
      }
    }

    pageToken = resp.nextPageToken;
  } while (pageToken);

  // De-dup just in case
  return Array.from(new Set(emails));
}

/*** ====== PRACTICES FROM SHEET ====== ***/
function getPracticesForCurrentWeek_() {
  const tz = CONFIG.timeZone;
  const today = new Date();
  const { start, end } = getWeekWindow_(today, CONFIG.weekStartsOn, tz);

  const ss = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  const sheet = ss.getSheetByName(CONFIG.sheetName);
  if (!sheet) throw new Error("Sheet not found: " + CONFIG.sheetName);

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return []; // no data

  // We need columns A..H (1..8). Data starts at row 2.
  const range = sheet.getRange(2, 1, lastRow - 1, 8);
  const values = range.getValues();

  // Column mapping:
  // A: Date (0), B: Time-S (1), C: Time-E (2), D: FCW TEAM (3), H: Field (7)
  const rows = [];
  values.forEach(row => {
    const dateCell = row[0];
    const team = String(row[3] || "").trim();
    if (team !== CONFIG.teamName) return;

    const eventDate = coerceToDate_(dateCell, tz);
    if (!eventDate) return;

    if (eventDate >= start && eventDate <= end) {
      const timeS = row[1];
      const timeE = row[2];
      const field = String(row[7] || "").trim(); // Column H (Field)

      rows.push({
        date: new Date(eventDate), // clone
        timeStart: timeS,
        timeEnd: timeE,
        location: field
      });
    }
  });

  // Sort by date then start time
  rows.sort((a, b) => {
    const d = a.date - b.date;
    if (d !== 0) return d;
    const ta = coerceToTimeMinutes_(a.timeStart) ?? 0;
    const tb = coerceToTimeMinutes_(b.timeStart) ?? 0;
    return ta - tb;
  });

  return rows;
}

function getWeekWindow_(date, weekStartsOn, timeZone) {
  // Normalize date in timezone (strip time to local midnight)
  const localStr = Utilities.formatDate(date, timeZone, "yyyy-MM-dd");
  const localMid = new Date(localStr + "T00:00:00");

  const day = localMid.getDay(); // 0 Sun .. 6 Sat
  const startOffset = (String(weekStartsOn || "MONDAY").toUpperCase() === "MONDAY")
    ? ((day + 6) % 7) // days since Monday
    : day;            // days since Sunday

  const start = new Date(localMid);
  start.setDate(start.getDate() - startOffset);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function coerceToDate_(cell, timeZone) {
  if (cell instanceof Date) {
    const y = cell.getFullYear(), m = cell.getMonth(), d = cell.getDate();
    return new Date(y, m, d, 12, 0, 0); // midday to avoid DST edge cases
  }
  if (!cell) return null;
  const s = String(cell).trim();
  const tryDate = new Date(s);
  if (!isNaN(tryDate.getTime())) {
    const y = tryDate.getFullYear(), m = tryDate.getMonth(), d = tryDate.getDate();
    return new Date(y, m, d, 12, 0, 0);
  }
  return null;
}

function coerceToTimeMinutes_(cell) {
  if (cell == null || cell === "") return null;
  if (cell instanceof Date) return cell.getHours() * 60 + cell.getMinutes();
  if (typeof cell === "number") return Math.round(cell * 24 * 60); // Sheets time fraction
  const s = String(cell).trim().toUpperCase();
  const m = s.match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)?$/);
  if (m) {
    let hh = parseInt(m[1], 10);
    let mm = m[2] ? parseInt(m[2], 10) : 0;
    const ampm = m[3];
    if (ampm === "PM" && hh < 12) hh += 12;
    if (ampm === "AM" && hh === 12) hh = 0;
    return hh * 60 + mm;
  }
  return null;
}

function formatLocal_(date, pattern) {
  return Utilities.formatDate(date, CONFIG.timeZone, pattern);
}

function minutesToTimeString_(mins) {
  if (mins == null) return "";
  let hh = Math.floor(mins / 60);
  const mm = mins % 60;
  const ampm = hh >= 12 ? "PM" : "AM";
  if (hh === 0) hh = 12;
  else if (hh > 12) hh -= 12;
  return `${hh}:${mm.toString().padStart(2, "0")} ${ampm}`;
}

function renderPractices_(rows) {
  if (!rows || rows.length === 0) return { htmlList: "", textList: "" };

  const htmlItems = [];
  const textItems = [];

  rows.forEach(r => {
    const dateStr = formatLocal_(r.date, "EEE, MMM d");
    const tS = minutesToTimeString_(coerceToTimeMinutes_(r.timeStart));
    const tE = minutesToTimeString_(coerceToTimeMinutes_(r.timeEnd));
    const loc = r.location || "";

    const lineHTML = `<li><strong>${dateStr}</strong>: ${tS || "?"} – ${tE || "?"}${loc ? ` @ ${loc}` : ""}</li>`;
    const lineText = `- ${dateStr}: ${tS || "?"} – ${tE || "?"}${loc ? ` @ ${loc}` : ""}`;

    htmlItems.push(lineHTML);
    textItems.push(lineText);
  });

  return {
    htmlList: `<ul>${htmlItems.join("\n")}</ul>`,
    textList: textItems.join("\n")
  };
}

/*** ====== SCHEDULING ====== ***/
function startSchedule() {
  // Reset counter
  PropertiesService.getScriptProperties().setProperty("weeksCreated", "0");
  deleteTriggers();

  // Map weekday to ScriptApp.WeekDay
  const dayMap = {
    "SUNDAY": ScriptApp.WeekDay.SUNDAY,
    "MONDAY": ScriptApp.WeekDay.MONDAY,
    "TUESDAY": ScriptApp.WeekDay.TUESDAY,
    "WEDNESDAY": ScriptApp.WeekDay.WEDNESDAY,
    "THURSDAY": ScriptApp.WeekDay.THURSDAY,
    "FRIDAY": ScriptApp.WeekDay.FRIDAY,
    "SATURDAY": ScriptApp.WeekDay.SATURDAY,
  };
  const weekDay = dayMap[String(CONFIG.sendDay).toUpperCase()];
  if (!weekDay) throw new Error("Invalid sendDay in CONFIG.");

  ScriptApp.newTrigger("createWeeklyDraft")
    .timeBased()
    .everyWeeks(1)
    .onWeekDay(weekDay)
    .atHour(CONFIG.sendHourLocal)
    .nearMinute(CONFIG.sendMinuteLocal)
    .create();
}

function deleteTriggers() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
}

/*** ====== (Optional) Debug helper to list groups ====== ***/
// Run this once if you need to confirm the exact label name the People API sees.
// function debugListContactGroups() {
//   const groups = People.ContactGroups.list({ pageSize: 200 }).contactGroups || [];
//   Logger.log("Contact Groups:");
//   groups.forEach(g => Logger.log(`${g.formattedName}  [${g.resourceName}]`));
// }
