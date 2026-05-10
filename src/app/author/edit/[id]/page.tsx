import AppShell from "@/components/AppShell";
import AuthorForm from "@/components/forms/AuthorForm";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: author } = await supabase
    .from("author")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!author) notFound();

  return (
    <AppShell>
      <AuthorForm mode="edit" author={author} />
    </AppShell>
  );
}
