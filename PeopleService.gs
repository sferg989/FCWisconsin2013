/**
 * Service for interacting with Google People API (Contacts)
 */

/**
 * Gets all email addresses from a contact label/group
 */
function getEmailsFromContactLabel(labelName) {
  const contactGroup = findContactGroup_(labelName);
  const emails = extractEmailsFromGroup_(contactGroup);
  
  return Array.from(new Set(emails)); // Remove duplicates
}

/**
 * Finds a contact group by its display name
 */
function findContactGroup_(labelName) {
  const response = People.ContactGroups.list({ pageSize: 200 });
  const groups = response.contactGroups || [];
  
  const targetGroup = groups.find(group => {
    const groupName = (group.formattedName || "").trim();
    return groupName === String(labelName).trim();
  });

  if (!targetGroup) {
    const availableGroups = groups.map(g => g.formattedName).join(", ");
    throw new Error(`Contact group "${labelName}" not found. Available groups: ${availableGroups}`);
  }

  return {
    resourceName: targetGroup.resourceName,
    id: (targetGroup.resourceName || "").split("/")[1]
  };
}

/**
 * Extracts email addresses from all people in a contact group
 */
function extractEmailsFromGroup_(contactGroup) {
  const emails = [];
  let pageToken;

  do {
    const response = People.People.Connections.list("people/me", {
      pageSize: 1000,
      pageToken,
      personFields: "emailAddresses,memberships",
      sources: ["READ_SOURCE_TYPE_CONTACT"],
    });

    const connections = response.connections || [];
    
    for (const person of connections) {
      if (isPersonInGroup_(person, contactGroup)) {
        const email = getPrimaryEmail_(person);
        if (email) emails.push(email);
      }
    }

    pageToken = response.nextPageToken;
  } while (pageToken);

  return emails;
}

/**
 * Checks if a person is a member of the specified contact group
 */
function isPersonInGroup_(person, contactGroup) {
  const memberships = person.memberships || [];
  
  return memberships.some(membership => {
    const groupMembership = membership.contactGroupMembership;
    if (!groupMembership) return false;
    
    return (
      groupMembership.contactGroupResourceName === contactGroup.resourceName ||
      groupMembership.contactGroupId === contactGroup.id
    );
  });
}

/**
 * Gets the primary email address for a person
 */
function getPrimaryEmail_(person) {
  if (!person.emailAddresses || person.emailAddresses.length === 0) {
    return null;
  }
  
  const primaryEmail = person.emailAddresses.find(email => 
    email.metadata && email.metadata.primary
  );
  
  const selectedEmail = primaryEmail || person.emailAddresses[0];
  return selectedEmail.value || null;
}

/**
 * Debug function to list all available contact groups
 * Uncomment and run to see available groups
 */
// function debugListContactGroups() {
//   const response = People.ContactGroups.list({ pageSize: 200 });
//   const groups = response.contactGroups || [];
//   
//   console.log("Available Contact Groups:");
//   groups.forEach(group => {
//     console.log(`- ${group.formattedName} [${group.resourceName}]`);
//   });
// }
