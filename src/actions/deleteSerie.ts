'use server'

import supabase from "@/utils/supabaseClient";

export async function deleteSerie(id: number) {
  const { data, error } = await supabase
  .from("serie")
  .delete()
  .eq("id", id)
  .select();

  if(error){
    console.log(error);
  }
  if(data){
    console.log(data);
  }
}
