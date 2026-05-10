import AppShell from "@/components/AppShell";
import AuthorForm from "@/components/forms/AuthorForm";

export default function CreateAuthorPage() {
  return (
    <AppShell>
      <AuthorForm mode="create" />
    </AppShell>
  );
}
