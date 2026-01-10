export const checkProfileComplete = async (userId: string, supabase: any) => {
  const { data } = await supabase
    .from("profiles")
    .select("full_name, phone, address")
    .eq("id", userId)
    .single();

  return {
    isComplete: !!(data?.full_name && data?.phone && data?.address),
    profile: data
  };
};