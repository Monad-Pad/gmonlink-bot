import { ActSupabaseClient } from "../../clients/supabase";

export async function getLink(linkId: string, supabase: ActSupabaseClient) {
	const { data, error } = await supabase.from("links").select("*").eq("link_id", linkId).maybeSingle();
	if (error) throw error;
	return data;
}