"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { signInAction, type AuthState } from "@/lib/auth/actions";

const initialState: AuthState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 rounded-md bg-ink px-7 py-3 font-semibold text-white hover:bg-black disabled:opacity-60"
    >
      {pending ? "Logging in…" : "Log in"}
    </button>
  );
}

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [state, formAction] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      {state.error && (
        <div className="rounded-md border border-rust/40 bg-rust/10 px-4 py-3 text-sm font-medium text-rust">
          {state.error}
        </div>
      )}

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
          autoComplete="current-password"
          className="w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-signal"
        />
      </div>

      <SubmitButton />

      <p className="text-sm text-[#5a5d61]">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-signal-dark hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
