import { supabase } from "@/integrations/supabase/client";

// Permanently deletes the logged-in user's account: all rows tied to
// their user_id/id across the app's tables, then the auth.users row
// itself (via the delete-account Edge Function, which runs with the
// service role). Signs the user out locally afterwards since their
// session token is no longer valid anyway.
export async function deleteAccount() {
  const { error } = await supabase.functions.invoke("delete-account");
  if (error) throw error;
  await supabase.auth.signOut();
}
