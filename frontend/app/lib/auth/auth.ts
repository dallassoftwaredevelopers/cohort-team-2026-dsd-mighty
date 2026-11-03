import { createClient } from "../supabase/server";
export async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const { data: profile, error: profileError } = await supabase
    .from("app_users")
    .select("user_id, full_name, email, role,status")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) return null;

  return {
    user,
    profile,
    role: profile.role,
  };
}
