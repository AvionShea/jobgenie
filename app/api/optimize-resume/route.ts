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

    const prompt = `IMPORTANT: You MUST respond with valid JSON only, no matter what. If the resume is poorly formatted or missing information, make intelligent assumptions and still complete all sections.

ROLE: You are an expert resume optimizer and recruiter with 20+ years of experience in technical recruiting, hiring strategy, and ATS keyword optimization.

GOAL: Analyze the RESUME and JOB DESCRIPTION below to:
- Identify the candidate’s alignment with the target role.
- Rewrite and optimize content using quantifiable results, strong action verbs, and keywords that increase ATS ranking and recruiter engagement.
- Bridge skill gaps through transferable experience and phrasing that matches the job description.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Respond with this exact JSON structure (replace values appropriately):
{
  "targetJobTitle": "Extract or infer the target job title based on job description",
  "matchScore": 0-100,
  "strengths": [
    "3-7 key strengths from the resume that align with the job description"
  ],
  "gaps": [
    "3-7 missing or underrepresented skills, tools, or experiences"
  ],
  "recommendations": [
    "5-10 specific and actionable improvements to align resume with job description (focus on quantification, phrasing, and keyword integration)"
  ],
  "keywordsToAdd": [
    "10-20 job-specific keywords or technologies from the job description to boost ATS score"
  ],
  "transferableSkills": [
    "5-10 transferable or cross-functional skills from resume that relate to the target job"
  ],
  "optimizedSummary": "Write an optimized 2-3 sentence professional summary using this pattern: 'A [adjective] [target job title or professional] with expertise in [primary domains or technologies], skilled in [key job skills]. Proven success in [achievements or metrics] leading to [positive outcome].'",
  "implementedSuggestions": "Rewrite and expand resume bullet points using the XYZ formula (accomplished [X] as measured by [Y], by doing [Z]) while integrating all recommendations, missing skills, and keywordsToAdd naturally. Maintain clear, concise, professional tone optimized for ATS and recruiters."
}

Rules:
- Always return valid JSON (use quotes around all keys and values)
- Be specific, realistic, and metrics-driven
- Do not include commentary or markdown outside the JSON
- If a section cannot be determined, fill it with 'N/A'
- Keep arrays as string lists, no nested arrays or objects
- Avoid generic or filler phrases
- Assume the goal is to reach Tier I recruiter visibility in ATS parsing`;

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
