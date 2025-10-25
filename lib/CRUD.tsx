import { supabase } from "./supabase";

export async function GetusernamebyUserId(userId: string) {
  const { data, error } = await supabase
    .from("user")
    .select("name")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching username:", error);
    return null;
  }

  return data?.name || null;
}

// doesn't need i will delete later . leave it for now
export async function UpdateCallStatus(userId: string, status: string) {
  console.log("Updating call status for user:", userId, status);
  const { data, error } = await supabase
    .from("user_presence")
    .update({ call_status: status })
    .eq("userId", userId)
    .select();

  if (error) {
    console.error("Error updating call status:", error);
  }
  console.log("Call status updated:", data);
  return data;
}
