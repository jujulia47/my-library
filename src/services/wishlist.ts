import { createClient } from "@/utils/supabase/server";
import type { Database } from "@/utils/typings/supabase";

type WishlistRow = Database["public"]["Tables"]["wishlist"]["Row"];

export async function wishlistList() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("wishlist").select();
  if (error) return null;
  return data ?? null;
}

export async function wishlistById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("wishlist").select().eq("id", id);
  if (error) return null;
  return (data ?? []) as WishlistRow[];
}
