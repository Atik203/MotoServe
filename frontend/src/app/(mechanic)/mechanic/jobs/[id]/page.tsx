import { redirect } from "next/navigation";

export default async function MechanicJobDetailsRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/mechanic/tasks/${id}`);
}
