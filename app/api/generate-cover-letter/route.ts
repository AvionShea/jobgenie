import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { rateLimiter } from "@/lib/rate-limiter";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    //Rate limiting
    const clientIP =
      request.headers.get("x-forward-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const rateLimitResult = rateLimiter.isAllowed(clientIP);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429 }
      );
    }

    const { resumeText, jobDescription, tone, companyName, hiringManager } =
      await request.json();

    if (!resumeText || !jobDescription) {
      return NextResponse.json(
        { error: "Resume text and job description are required" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const toneInstructions = {
      professional:
        "Use a formal, business-appropriate tone that demonstrates professionalism and competence.",
      enthusiastic:
        "Use an energetic, passionate tone that shows genuine excitement about the opportunity.",
      creative:
        "Use a more unique, creative approach that stands out while remaining professional.",
      direct:
        "Use a clear, concise, and straightforward tone that gets to the point quickly.",
    };

    const selectedTone =
      toneInstructions[tone as keyof typeof toneInstructions] ||
      toneInstructions.professional;

    const prompt = `Write a compelling cover letter based on the following information:
    
    RESUME SUMMARY:
    ${resumeText}

    JOB DESCRIPTION:
    ${jobDescription}

    TONE: ${selectedTone}

    ${companyName ? `COMPANY NAME: ${companyName}` : ""}
    ${hiringManager ? `HIRING MANAGER: ${hiringManager}` : ""}

    Create a cover letter with:
    1. Professional header (if company name is provided)
    2. Strong opening paragraph that grabs attention
    3. Body paragraph highlighting relevant experience and skills (or transferable skills)
    4. Body paragraph showing knowledge of company/role
    5. Strong closing with call to action

    Make it specific to this job posting and demonstrate clear value proposition. Keep it to 3-5 paragraphs and under 300 words.

    Return only the cover letter text, no additional formatting or explanations.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const coverLetter = response.text();

    const status = rateLimiter.getStatus(clientIP);

    return NextResponse.json({
      success: true,
      coverLetter: coverLetter,
      timeStamp: new Date().toISOString(),
      rateLimitStatus: {
        remaining: status.remaining,
        dailyRemaining: status.dailyRemaining,
      },
    });
  } catch (error) {
    console.error("Error generating cover letter:", error);
    return NextResponse.json(
      { error: "Failed to generate cover letter" },
      { status: 500 }
    );
  }
}
