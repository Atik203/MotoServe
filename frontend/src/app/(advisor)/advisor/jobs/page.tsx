import { redirect } from "next/navigation";

export default function AdvisorJobsPageRedirect() {
  redirect("/advisor/tasks");
}