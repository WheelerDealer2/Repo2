import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-4xl font-extrabold leading-none">Log in</h1>
      <p className="mb-7 mt-1.5 text-[#5a5d61]">Welcome back to Wheeler Dealer.</p>
      <LoginForm redirectTo={redirect ?? "/"} />
    </div>
  );
}
