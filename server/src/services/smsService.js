// TODO (Phase 3): Real Plivo SMS integration
// Placeholder functions — will be implemented in Phase 3

export async function sendBookingSMS(repPhone, { leadName, company, date, time, phone, leadId }) {
  console.log("[smsService] sendBookingSMS (mock)", { repPhone, leadName, company, date, time });
  return `mock-sms-id-${Date.now()}`;
}
