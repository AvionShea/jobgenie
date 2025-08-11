import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { rateLimiter } from "@/lib/rate-limiter";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const rateLimitResult = rateLimiter.isAllowed(clientIP);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429 }
      );
    }

    const {
      mode,
      situation,
      task,
      action,
      result,
      freeFormStory,
      questionType,
      // New job context fields
      jobDescription,
      jobTitle,
      companyName,
    } = await request.json();

    if (!mode || (mode !== "guided" && mode !== "freeform")) {
      return NextResponse.json(
        { error: 'Mode must be either "guided" or "freeform"' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Build job context for the prompt
    let jobContext = "";
    if (jobDescription) {
      jobContext = `TARGET JOB DESCRIPTION:
${jobDescription}

Tailor the STAR response to highlight skills and experiences most relevant to this specific role.`;
    } else if (jobTitle) {
      jobContext = `TARGET POSITION: ${jobTitle}${
        companyName ? ` at ${companyName}` : ""
      }

Research typical requirements for this role and tailor the STAR response to highlight relevant skills and experiences that would appeal to hiring managers for this position.`;
    }

    let prompt;

    if (mode === "guided") {
      if (!situation || !task || !action || !result) {
        return NextResponse.json(
          { error: "All STAR components are required for guided mode" },
          { status: 400 }
        );
      }

      prompt = `You are JobGenie's interview coach. Create a compelling STAR method response using the provided components.

${jobContext}

STAR COMPONENTS:
Situation: ${situation}
Task: ${task}
Action: ${action}
Result: ${result}

${questionType ? `INTERVIEW QUESTION TYPE: ${questionType}` : ""}

Create a polished, professional STAR response that:
1. Flows naturally as a story
2. Uses specific details and metrics
3. Demonstrates leadership and problem-solving
4. Is concise but impactful (60-90 seconds when spoken)
5. Shows clear cause-and-effect between actions and results
${
  jobContext
    ? "6. Emphasizes skills and achievements most relevant to the target role"
    : ""
}

Return JSON with:
{
  "starResponse": "The complete, polished STAR method answer",
  "tips": ["3-4 specific tips for delivering this answer"],
  "keyStrengths": ["2-3 key strengths this story demonstrates"],
  "improvementSuggestions": ["2-3 ways to make the story even stronger"],
  "jobRelevance": "${
    jobContext
      ? "How this story specifically relates to the target role"
      : "General applicability of this story"
  }"
}`;
    } else {
      if (!freeFormStory) {
        return NextResponse.json(
          { error: "Free form story is required for freeform mode" },
          { status: 400 }
        );
      }

      prompt = `You are JobGenie's interview coach with 15+ years of experience. Transform this experience into a structured STAR method response.

${jobContext}

USER'S STORY:
${freeFormStory}

${questionType ? `INTERVIEW QUESTION TYPE: ${questionType}` : ""}

Analyze the story and create a polished, professional STAR response that:
1. Flows naturally as a story
2. Clearly separates Situation, Task, Action, and Result
3. Shows clear cause-and-effect between actions and results
4. Adds specific details and metrics where reasonable
5. Demonstrates key professional skills related to the job title or jobContext
6. Is interview-ready and impactful
${jobContext ? "5. Highlights aspects most relevant to the target role" : ""}

Return JSON with:
{
  "situation": "Clear situation description",
  "task": "Specific task or challenge",
  "action": "Detailed actions taken",
  "result": "Quantifiable results achieved",
  "starResponse": "Complete polished answer combining all elements",
  "tips": ["3-4 delivery tips"],
  "keyStrengths": ["2-3 strengths demonstrated"],
  "improvementSuggestions": ["2-3 enhancement suggestions"],
  "jobRelevance": "${
    jobContext
      ? "How this story specifically relates to the target role"
      : "General applicability of this story"
  }"
}`;
    }

    const aiResult = await model.generateContent(prompt);
    const response = await aiResult.response;
    let analysis = response.text();

    // Clean up JSON response
    analysis = analysis
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const firstBrace = analysis.indexOf("{");
    const lastBrace = analysis.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1) {
      analysis = analysis.substring(firstBrace, lastBrace + 1);
    }

    let parsedAnalysis;
    try {
      parsedAnalysis = JSON.parse(analysis);
    } catch (parseError) {
      console.error("Failed to parse STAR response:", parseError);
      return NextResponse.json(
        { error: "Failed to generate STAR response" },
        { status: 500 }
      );
    }

    const status = rateLimiter.getStatus(clientIP);

    return NextResponse.json({
      success: true,
      mode: mode,
      analysis: parsedAnalysis,
      timestamp: new Date().toISOString(),
      rateLimitStatus: {
        remaining: status.remaining,
        dailyRemaining: status.dailyRemaining,
      },
    });
  } catch (error) {
    console.error("Error creating STAR method:", error);
    return NextResponse.json(
      { error: "Failed to create STAR method response" },
      { status: 500 }
    );
  }
}
