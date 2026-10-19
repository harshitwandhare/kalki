import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// Root route: redirect authenticated users to dashboard, others to sign in.
export default async function Home() {
  const session = await auth();
  if (session) {
    redirect("/dashboard");
  }
  redirect("/auth/signin");
}
