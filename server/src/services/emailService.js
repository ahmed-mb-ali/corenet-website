// TODO (Phase 3): Real Gmail API integration
// Placeholder functions — will be implemented in Phase 3

export async function sendConfirmationEmail(googleToken, { to, firstName, date, time, duration }) {
  console.log("[emailService] sendConfirmationEmail (mock)", { to, firstName, date, time });
}

export async function sendReminderEmail(googleToken, { to, firstName, date, time }) {
  console.log("[emailService] sendReminderEmail (mock)", { to, firstName, date, time });
}

export async function sendInternalNotification(googleToken, { to, lead, booking }) {
  console.log("[emailService] sendInternalNotification (mock)", { to, lead: lead.email });
}
