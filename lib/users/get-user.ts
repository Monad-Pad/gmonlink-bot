import { Bot } from "grammy";
import { MyContext } from "../../bot";
import { createUser } from "./create-user";
import { ActSupabaseClient } from "../clients/supabase";


export async function getUser(userId: number, supabase: ActSupabaseClient, bot: Bot<MyContext>) {
    const { data, error } = await supabase.from("users").select("*").eq("user_id", userId).maybeSingle();

    if (error || !data) {
        const data = await createUser(userId, supabase, bot);
        const returnData = {
            ...data,
            new: true
        }
        return returnData;
    }

    return data;
}