import { createClient } from "../supabase/server";
export async function getCurrentUser() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      console.error("Error fetching supabase user:", error);
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from("app_users")
      .select("user_id, full_name, email, role,status")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("Error loading user profile:", error);
      return null;
    }

    return {
      user,
      profile,
      role: profile.role,
    };
  } catch (error) {
    console.error("Error retrieving User on server:", error);
  }
}
