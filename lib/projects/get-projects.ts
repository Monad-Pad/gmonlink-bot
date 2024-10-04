import { ActSupabaseClient } from "../clients/supabase";
import { projectRecord } from "../records";

export async function getProjects(userId: number, supabase: ActSupabaseClient) {
    const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", {ascending: true})
        .eq("user_id", userId);

    if (error) {
        throw error;
    }

    projectRecord[userId] = data;

    return data;
}

export async function getProjectBySlug(slug: string, userId: number, supabase: ActSupabaseClient) {
    const { data, error } = await supabase
        .from("projects")
        .select(`*, links!inner(*)`)
        .order("order", { referencedTable: "links", ascending: false })
        .eq("user_id", userId)
        .eq("slug", slug)
        .maybeSingle();

    if (error ) {
        throw error;
    }

    return data;
}
