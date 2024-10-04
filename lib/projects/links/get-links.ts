import { ActSupabaseClient } from "../../clients/supabase";

export async function getLinks(projectId: number, supabase: ActSupabaseClient) {
    const { data, error } = await supabase
        .from("links")
        .select("*")
        .eq("project_id", projectId);

    if (error) {
        throw error;
    }

    return data;
}