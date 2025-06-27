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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Act as a recruiter and resume writer with 14 years of experience in each role. With knowledge of how recruiters read resumes and before providing any help, analyze and scrutinize the pasted job description and extract:
    1. Top 10 required skills
    2. Top 5 nice-to-have skills
    3. Key responsibilities
    4. Keywords that should be included in a resume to get through the ATS

    Job Description: ${jobDescription}

    Format as JSON with keys: requiredSkills, niceToHave, responsibilities, keywords`;

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
