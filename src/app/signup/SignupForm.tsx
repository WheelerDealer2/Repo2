"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { signUpAction, type AuthState } from "@/lib/auth/actions";

const initialState: AuthState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 rounded-md bg-ink px-7 py-3 font-semibold text-white hover:bg-black disabled:opacity-60"
    >
      {pending ? "Creating account…" : "Create account"}
    </button>
  );
}

export function SignupForm() {
  const [state, formAction] = useActionState(signUpAction, initialState);

  if (state.message) {
    return (
      <div className="rounded-md border border-[#a9d4a9] bg-[#E8F4E8] px-4 py-3 text-sm font-semibold text-[#2c5c2c]">
        {state.message}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-md border border-rust/40 bg-rust/10 px-4 py-3 text-sm font-medium text-rust">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="displayName" className="mb-1.5 block text-sm font-semibold text-asphalt">
          Name
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          required
          autoComplete="name"
          placeholder="e.g. Marcus D."
          className="w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-signal"
        />
      </div>

      <div>
        <label htmlFor="location" className="mb-1.5 block text-sm font-semibold text-asphalt">
          Location <span className="font-normal text-[#5a5d61]">(optional)</span>
        </label>
        <input
          id="location"
          name="location"
          type="text"
          autoComplete="address-level2"
          placeholder="City, State"
          className="w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-signal"
        />
      </div>

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-asphalt">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-signal"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-asphalt">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-signal"
        />
        <p className="mt-1 text-xs text-[#5a5d61]">At least 8 characters.</p>
      </div>

      <SubmitButton />

      <p className="text-sm text-[#5a5d61]">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-signal-dark hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
