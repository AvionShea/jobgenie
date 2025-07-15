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

    IMPORTANT: You MUST respond with valid JSON only, no matter what. If the resume is poorly formatted, do your best analysis anyway.
        
        RESUME:
        ${resumeText}

        JOB DESCRIPTION:
        ${jobDescription}

        Respond with this exact JSON structure (replace values appropriately):
        {
        "targetJobTitle": "Extract or infer the target job title",
        "matchScore": 75,
        "strengths": [Array of 3-7 strengths from the resume that aligns with the job description],
        "gaps": [Array of 3-7 skills/experiences missing from resume],
        "recommendations": [Array of 5-10 specific improvements],
        "keywordsToAdd": [Array of important keywords from job description],
        "transferableSkills": [Array of transferable skills, which include keywords from experiences that align with the job description],
        "optimizedSummary": "Write an optimized professional summary",
        "implementedSuggestions": "Provide improved resume content with gaps, recommendations, required skills, suggested XYZ method and keywordsToAdd implemented"
        }

        Rules:
- Always return valid JSON
- If information is unclear, make reasonable assumptions
- Keep all array items as strings
- Make matchScore a number 0-100
- Be helpful even with poorly formatted resumes`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let analysis = response.text();

    console.log(
      "AI response received. Response: ",
      analysis,
      "length:",
      analysis.length
    );

    //clean up the response to extract JSON
    analysis = analysis
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    // Remove any text before the first { and after the last }
    const firstBrace = analysis.indexOf("{");
    const lastBrace = analysis.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1) {
      analysis = analysis.substring(firstBrace, lastBrace + 1);
    }

    console.log("Cleaned analysis preview:", analysis.substring(0, 200));

    // Try to parse the JSON
    let parsedAnalysis;
    try {
      parsedAnalysis = JSON.parse(analysis);

      //Validate the structure
      if (!parsedAnalysis.targetJobTitle) {
        parsedAnalysis.targetJobTitle = "Position Analysis";
      }
      if (typeof parsedAnalysis.matchScore !== "number") {
        parsedAnalysis.matchScore = 50;
      }
      if (!Array.isArray(parsedAnalysis.strengths)) {
        parsedAnalysis.strengths = ["Resume analysis completed"];
      }
      console.log(
        "Successfully parsed JSON. Keys:",
        Object.keys(parsedAnalysis)
      );
    } catch (parseError) {
      console.error("Failed to parse cleaned JSON:", parseError);
      console.error("Cleaned analysis was:", analysis);

      // Create a fallback response when AI fails
      parsedAnalysis = {
        targetJobTitle: "Resume Analysis",
        matchScore: 50,
        strengths: ["Resume content received", "Shows work experience"],
        gaps: ["Analysis could not be completed fully"],
        recommendations: [
          "Reformat resume with clear sections",
          "Try submitting again",
        ],
        keywordsToAdd: ["Unable to extract from this format"],
        transferableSkills: [
          "Communication",
          "Problem-solving",
          "Adaptability",
        ],
        optimizedSummary:
          "Resume received but could not be fully analyzed due to formatting.",
        implementedSuggestions:
          "Please resubmit with clearer formatting for better analysis.",
      };
    }

    const status = rateLimiter.getStatus(clientIP);

    console.log("Sending successful response");
    return NextResponse.json({
      success: true,
      analysis: parsedAnalysis, // Send as parsed object
      timestamp: new Date().toISOString(),
      rateLimitStatus: {
        remaining: status.remaining,
        dailyRemaining: status.dailyRemaining,
      },
    });
  } catch (error) {
    console.error("Error optimizing resume:", error);
    return NextResponse.json(
      { error: "Failed to optimize resume: " + (error as Error).message },
      { status: 500 }
    );
  }
}
