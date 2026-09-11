import { SignupForm } from "./SignupForm";

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-4xl font-extrabold leading-none">Sign up</h1>
      <p className="mb-7 mt-1.5 text-[#5a5d61]">
        Create an account to post listings and message sellers.
      </p>
      <SignupForm />
    </div>
  );
}
