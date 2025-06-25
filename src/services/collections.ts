import supabase from "@/utils/supabaseClient";
import { Database } from "@/utils/typings/supabase";

type CollectionRead = Database["public"]["Tables"]["collection"]["Row"];

export async function collectionList() {
  const { data, error } = await supabase
    .from("collection")
    .select()
    .overrideTypes<CollectionRead[]>();

  if (error) {
    console.log(error);
  }
  if (data) {
    console.log(data);
  }

  return data
}