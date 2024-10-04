import { ActSupabaseClient } from "../../clients/supabase";

export type EditLinkType = "title" | "description" | "url" | "icon" | "order" | "category";

export async function editLink(linkId: number, type: EditLinkType, value: string, supabase: ActSupabaseClient) {
    let actValue: string | number = value;

    if (type === "category") {
        // lowercase
        actValue = value.toLowerCase();
    }

    if (type === "order") actValue = parseInt(value);
    const { error } = await supabase.from("links").update({ [type]: actValue }).eq("link_id", linkId);
    if (error) {
        throw error;
    }
    return;
}