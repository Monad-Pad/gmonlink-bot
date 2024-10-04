import { ActSupabaseClient } from "../../clients/supabase";

export async function getCategories(projectId: number, supabase: ActSupabaseClient): Promise<string[]> {
    const { data, error } = await supabase.from("links").select("category").eq("project_id", projectId);

    if (error) {
        throw error;
    }

    const categories = data.map((link) => link.category).flat();
    const uniqueCategories = [...new Set(categories)];

    console.log(uniqueCategories);
    return uniqueCategories;
}