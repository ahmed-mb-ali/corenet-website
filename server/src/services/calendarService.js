// TODO (Phase 3): Real Google Calendar integration
// Placeholder functions — will be implemented in Phase 3

export async function getFreeBusy(userGoogleToken, calendarId, timeMin, timeMax) {
  console.log("[calendarService] getFreeBusy called (mock) — returning empty busy slots");
  return [];
}

export async function createEvent(userGoogleToken, calendarId, { summary, description, start, end, attendeeEmail }) {
  console.log("[calendarService] createEvent called (mock)", { summary, start, end });
  return `mock-event-id-${Date.now()}`;
}

export async function deleteEvent(userGoogleToken, calendarId, eventId) {
  console.log("[calendarService] deleteEvent called (mock)", { eventId });
}
