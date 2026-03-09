// Only these two Gmail accounts can be treated as admins via allow-list.
// Update this list if you want to add/remove admin email access.
export const ALLOWED_ADMIN_EMAILS = [
  "siddhantsaini098@gmail.com",
  "ashokdevra517@gmail.com",
  
];

export function isAllowedAdminEmail(email) {
  if (!email) return false;
  return ALLOWED_ADMIN_EMAILS.includes(email.toLowerCase());
}

