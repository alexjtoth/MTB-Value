import { NextResponse } from "next/server";
import { supabase } from "../../lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  const { data } = await supabase
    .from("bike_versions")
    .select(`
      id,
      year,
      bike_models (
        slug,
        name,
        brands (
          name
        )
      )
    `)
    .ilike("search_text", `%${query}%`)
    .limit(8);

  return NextResponse.json(data ?? []);
}