import { NextResponse } from "next/server";

export async function GET() {
  console.log("Environment check:");
  console.log("CLAUDE_API_KEY exists:", !!process.env.CLAUDE_API_KEY);
  console.log("GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);
  console.log(
    "SUPABASE_URL exists:",
    !!process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL
  );

  return NextResponse.json({
    message: "API route is working!",
    timestamp: new Date().toISOString(),
    envCheck: {
      anthropic: !!process.env.CLAUDE_API_KEY,
      google: !!process.env.GEMINI_API_KEY,
      supabase: !!process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL,
    },
  });
}
