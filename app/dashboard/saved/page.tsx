import { redirect } from "next/navigation"

// Navbar links here — the saved list lives in a dashboard tab
export default function SavedPage() {
  redirect("/dashboard?tab=saved")
}
