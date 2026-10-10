import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("blood_requests")
      .select("id")
      .limit(1);

    if (error) {
      return NextResponse.json(
        {
          status: "error",
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "ok",
      message: "Supabase connection successful",
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Could not connect to Supabase" },
      { status: 500 }
    );
  }
}
