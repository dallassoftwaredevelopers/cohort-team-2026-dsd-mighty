import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/user";

function apiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_API_URL is missing. Check .env.local");
  }
  return url;
}
export async function getAppUsers(): Promise<Profile[]> {
  const supabase = createClient();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    throw new Error("You must be signed in to view users.");
  }

  const response = await fetch(`${apiUrl()}/admin/users`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(
      typeof error?.detail === "string"
        ? error.detail
        : `Unable to load users (${response.status})`,
    );
  }

  return response.json();
}
