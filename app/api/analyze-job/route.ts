import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { rateLimiter } from "@/lib/rate-limiter";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    //Check rate limit
    const rateLimitResult = rateLimiter.isAllowed(clientIP);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429 }
      );
    }
    const { jobDescription } = await request.json();

    if (!jobDescription) {
      return NextResponse.json(
        { error: "Job description is required" },
        { status: 400 }
      );
    }

    // Use Gemini for analysis
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Act as a recruiter and resume writer with 15 years of experience in each role. Analyze the pasted job description like a hiring manager and extract ONLY what is essential for ATS and recruiter screening.

Job Description:
${jobDescription}

Instructions:
- Output valid JSON only. No commentary or markdown.
- Return four arrays of strings: requiredSkills, niceToHave, responsibilities, keywords.
- Keep items concise (single words or short phrases). No sentences.
- Remove duplicates, plural/singular variants, and near-synonyms. Use the most common ATS term.
- Prefer skills explicitly listed in the job description. If unclear, infer from domain context.
- For responsibilities, extract action-oriented phrases starting with a verb (present tense).
- For keywords, include exact phrasing used in the job description where possible (e.g., “customer SLAs”, “incident management”).
- Normalize capitalization (e.g., AWS, SQL, API, CI/CD) and keep technology names accurate.
- Maximum lengths:
  • requiredSkills: top 10
  • niceToHave: top 5
  • responsibilities: 6–12
  • keywords: 12–20

Output JSON schema (use only these keys):
{
  "requiredSkills": ["..."],
  "niceToHave": ["..."],
  "responsibilities": ["..."],
  "keywords": ["..."]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysis = response.text();

    //Get current rate limit status
    const status = rateLimiter.getStatus(clientIP);

    return NextResponse.json({
      success: true,
      analysis: analysis,
      timestamp: new Date().toISOString(),
      rateLimitStatus: {
        remaining: status.remaining,
        dailyRemaining: status.dailyRemaining,
      },
    });
  } catch (error) {
    console.error("Error analyzing job:", error);
    return NextResponse.json(
      { error: "Failed to analyze job description" },
      { status: 500 }
    );
  }
}
