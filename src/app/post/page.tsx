import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PostForm } from "./PostForm";

export default async function PostPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/post");
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-4xl font-extrabold leading-none">Post a listing</h1>
      <p className="mb-7 mt-1.5 text-[#5a5d61]">
        Fill in the details below. It&apos;s saved right away — payment (coming
        soon) is what makes it visible to buyers.
      </p>
      <PostForm sellerId={user.id} />
    </div>
  );
}
