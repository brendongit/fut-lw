import { createClient } from "@/lib/supabase/client";
import type { Player } from "@/types";

export async function getPlayers(): Promise<Player[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .order("name");
  if (error) throw error;
  return data;
}

export async function createPlayer(input: {
  name: string;
  phone?: string;
  photo_url?: string;
}): Promise<Player> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("players")
    .insert({ ...input, owner_id: user!.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePlayer(
  id: string,
  input: { name?: string; phone?: string; photo_url?: string }
): Promise<Player> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("players")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePlayer(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("players").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadPlayerPhoto(
  playerId: string,
  file: File
): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop();
  const path = `players/${playerId}.${ext}`;
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}
