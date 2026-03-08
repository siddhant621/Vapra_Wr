import { getCurrentUser } from "@/actions/onboarding";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }) {
  const user = await getCurrentUser();

  // Protect the admin page - only admins can access
  if (!user || user.role !== "ADMIN") {
    redirect("/onboarding");
  }

  return children;
}
