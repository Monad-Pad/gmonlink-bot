import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

export type ActSupabaseClient = SupabaseClient<any, "gmonlink", any>;

export function createApiClient(): ActSupabaseClient {
	const supabaseUrl = process.env.SUPABASE_URL;
	const supabaseKey = process.env.SUPABASE_KEY;

	return createClient(supabaseUrl!, supabaseKey!, { db: { schema: "gmonlink" } });
}
