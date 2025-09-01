/**
 * ===================================================================
 * FC WISCONSIN 2013 RCP - EMAIL AUTOMATION CODE STRUCTURE
 * ===================================================================
 * 
 * This Google Apps Script project has been organized into multiple
 * files for better maintainability and code organization.
 * 
 * FILE STRUCTURE:
 * ===============
 * 
 * 📋 Config.gs
 *    - Configuration constants (email settings, schedule, spreadsheet)
 *    - Property keys for script properties
 * 
 * 🛠️ Utils.gs
 *    - Date/time utility functions
 *    - Week window calculations
 *    - Time parsing and formatting
 * 
 * 👥 PeopleService.gs
 *    - Google People API integration
 *    - Contact group email extraction
 *    - Primary email detection
 * 
 * 📅 ScheduleService.gs
 *    - Google Sheets integration for practice schedules
 *    - Practice filtering and sorting
 *    - Practice rendering for emails
 * 
 * 📧 EmailService.gs
 *    - Email template generation (HTML & plain text)
 *    - Gmail draft creation
 *    - Subject line generation
 * 
 * ⏰ TriggerService.gs
 *    - Trigger management (create/delete)
 *    - Week counter management
 *    - Schedule automation
 * 
 * 🎯 Main.gs
 *    - Primary entry points (createWeeklyDraft, scheduleWeeklyEmail, startSchedule)
 *    - Email scheduling and management functions
 *    - Testing and debugging functions
 *    - High-level orchestration
 * 
 * HOW TO USE:
 * ===========
 * 
 * 1. Run startSchedule() to begin automated weekly emails
 * 2. Run createWeeklyDraft() to manually create a draft
 * 3. Run scheduleWeeklyEmail() to schedule email for next Monday at 6:30 AM
 * 4. Run checkScheduledEmail() to see if an email is scheduled
 * 5. Run cancelScheduledEmail() to cancel a scheduled email
 * 6. Run testEmailGeneration() to test without creating drafts
 * 7. Run checkCurrentWeekPractices() to debug schedule issues
 * 8. Run checkContactLabelRecipients() to debug contact issues
 * 
 * BENEFITS OF THIS STRUCTURE:
 * ===========================
 * 
 * ✅ Better organization - each file has a clear purpose
 * ✅ Easier maintenance - find and fix issues quickly
 * ✅ Better testing - test individual components
 * ✅ Clearer dependencies - understand how parts interact
 * ✅ Easier debugging - isolate problems to specific services
 * 
 * NOTE: Google Apps Script doesn't support ES6 imports/exports,
 * but all functions defined in any .gs file are automatically
 * available to all other .gs files in the same project.
 */
