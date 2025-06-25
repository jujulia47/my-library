import supabase from "@/utils/supabaseClient";

export async function deleteQuote(id: number) {
  const { data, error } = await supabase
  .from("quote")
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
