"use server";

import supabase from "@/utils/supabaseClient";
import { Database } from "@/utils/typings/supabase";

type Serie = Database["public"]["Tables"]["serie"]["Row"];

export async function serieList() {
  const { data, error } = await supabase
    .from("serie")
    .select()
    .overrideTypes<Serie[]>();

  if (error) {
    console.log(error);
  }
  if (data) {
    console.log(data);
  }

  return data
}

