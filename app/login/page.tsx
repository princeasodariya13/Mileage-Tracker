import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import AuthForm from "@/components/AuthForm";

export const metadata = {
  title: "Log In · Mileage-Tracker",
  description: "Log in to your Mileage-Tracker garage to track fuel fills and calculate mileage.",
};

export default async function LoginPage() {
  const user = await getUser();
  if (user) redirect("/app");

  return <AuthForm mode="login" />;
}
