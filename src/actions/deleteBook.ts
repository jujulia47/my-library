import supabase from "@/utils/supabaseClient";

export async function deleteBook(id: number) {
  const { data, error } = await supabase
  .from("book")
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