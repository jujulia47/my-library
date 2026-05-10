import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-ivory px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-ivory-light p-8 shadow-sm">
        <h1 className="font-display text-4xl font-medium text-ink-deep text-center mb-2">
          My Library
        </h1>
        <p className="text-center text-ink-fade italic mb-8 font-body">
          Entre para acessar sua biblioteca
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
