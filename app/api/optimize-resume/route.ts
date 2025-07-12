import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { rateLimiter } from "@/lib/rate-limiter";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  console.log("Resume optimization request received");
  try {
    //rate limiting
    const clientIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const rateLimitResult = rateLimiter.isAllowed(clientIP);
    if (!rateLimitResult.allowed) {
      console.log("Rate limit exceeded for IP:", clientIP);
      return NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429 }
      );
    }

    //Pare request body
    let body;
    try {
      body = await request.json();
      console.log("Request body parsed successfully");
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { resumeText, jobDescription } = body;
    console.log("Resume text length:", resumeText?.length);
    console.log("Job description length:", jobDescription?.length);

    if (!resumeText || !jobDescription) {
      console.error("Missing required fields:", {
        hasResumeText: !!resumeText,
        hasJobDescription: !!jobDescription,
      });
      return NextResponse.json(
        { error: "Both resume text and job description are required" },
        { status: 400 }
      );
    }

    if (resumeText.trim().length === 0 || jobDescription.trim().length === 0) {
      console.error("Empty fields provided");
      return NextResponse.json(
        { error: "Resume text and job description cannot be empty" },
        { status: 400 }
      );
    }

    console.log("Starting AI analysis...");
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are an expert resume optimizer with 20+ years of experience. Analyze the resume and job description and provide specific recommendations utilizing the required skills.
        
        RESUME:
        ${resumeText}

        JOB DESCRIPTION:
        ${jobDescription}

        Please provide a JSON response with:
        1. "targetJobTitle": The job title listed on job description
        2. "matchScore": Overall match percentage (0-100) of resume to job description
        3. "strengths": Array of 3-7 strengths that align with the job
        4. "gaps": Array of 3-7 skills/experiences missing from resume
        5. "recommendations": Array of 5-10 specific improvements to make
        6. "keywordsToAdd": Array of important keywords from job description to include
        7. "transferableSkills": Array of transferable skills, which include keywords from experiences that align with the job description
        8. "optimizedSummary": A rewritten summary section
        9. "implementedSuggestions": A rewritten resume with gaps, recommendations, required skills, suggested XYZ method and keywordsToAdd are implemented

        Format your response as valid JSON only.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let analysis = response.text();

    console.log("AI response received, length:", analysis.length);

    //clean up the response to extract JSON
    analysis = analysis
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const status = rateLimiter.getStatus(clientIP);

    console.log("Sending successful response");
    return NextResponse.json({
      success: true,
      analysis: analysis,
      timeStamp: new Date().toISOString(),
      rateLimitStatus: {
        remaining: status.remaining,
        dailyRemaining: status.dailyRemaining,
      },
    });
  } catch (error) {
    console.error("Error optimizing resume: ", error);
    return NextResponse.json(
      { error: "Failed to optimize resume." + (error as Error).message },
      { status: 500 }
    );
  }
}
