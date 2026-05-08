import { redirect } from "next/navigation";

/**
 * Root page - redirects to login
 * This ensures users always start at the login page
 */
export default function Home() {
  redirect("/login");
}
