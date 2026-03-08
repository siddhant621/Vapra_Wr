export default function ServicesPage() {
  // Match doctors-appointment-platform functionality: services page redirects to mechanics
  const { redirect } = require("next/navigation");
  redirect("/mechanics");
}
