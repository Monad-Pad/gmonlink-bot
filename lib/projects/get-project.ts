import { ActSupabaseClient } from "../clients/supabase";

export async function getProject(slug: string, userId: number, supabase: ActSupabaseClient) {
    const { data, error } = await supabase
        .from("projects")
        .select(`*, links(*)`)
        .eq("slug", slug)
        .eq("user_id", userId)
        .order("order", { referencedTable: "links", ascending: false })
        .maybeSingle();

    if (error) {
        console.error("Error fetching project:", error);
        return null;
    }

    return data;
}

export async function getProjectById(id: number, userId: number, supabase: ActSupabaseClient) {
    const { data, error } = await supabase
        .from("projects")
        .select(`*, links(*)`)
        .eq("project_id", id)
        .eq("user_id", userId)
        .order("order", { referencedTable: "links", ascending: false })
        .maybeSingle();

    if (error) {
        console.error("Error fetching project:", error);
        return null;
    }

    return data;
}