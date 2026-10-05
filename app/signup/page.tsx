import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import AuthForm from "@/components/AuthForm";

export const metadata = {
  title: "Create Account · Mileage-Tracker",
  description: "Create your free account to track vehicle mileage and fuel spend effortlessly with Mileage-Tracker.",
};

export default async function SignupPage() {
  const user = await getUser();
  if (user) redirect("/app");

  return <AuthForm mode="signup" />;
}
