import supabase from "@/utils/supabaseClient";

export async function deleteWishlist(id: number) {
  const { data, error } = await supabase
  .from("wishlist")
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
  