export const ALLOWED_ADMIN_EMAILS = ["siddhantsaini098@gmail.com"];

export function isAllowedAdminEmail(email) {
  if (!email) return false;
  return ALLOWED_ADMIN_EMAILS.includes(email.toLowerCase());
}

