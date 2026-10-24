import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getResumeById, saveATSAnalysis } from "@/lib/db";
import { analyzeResumeForJob } from "@/lib/atsEngine";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { resumeId, rawResumeText, jobTitle, jobCompany, jobDescription } = body;

    // 1. Input Type and Upper Boundary Checks (Denial of Service prevention)
    if (typeof jobDescription !== "string") {
      return NextResponse.json(
        { error: "Invalid job description format. Expected text." },
        { status: 400 }
      );
    }

    if (jobDescription.length > 25000) {
      return NextResponse.json(
        { error: "Job description exceeds maximum allowed length of 25,000 characters." },
        { status: 413 }
      );
    }

    if (rawResumeText !== undefined && rawResumeText !== null) {
      if (typeof rawResumeText !== "string") {
        return NextResponse.json(
          { error: "Invalid resume text format. Expected text." },
          { status: 400 }
        );
      }
      if (rawResumeText.length > 35000) {
        return NextResponse.json(
          { error: "Resume text exceeds maximum allowed length of 35,000 characters." },
          { status: 413 }
        );
      }
    }

    // 2. Minimum Length Requirements
    if (jobDescription.trim().length < 20) {
      return NextResponse.json(
        { error: "Please provide a detailed job description (minimum 20 characters) for accurate ATS matching." },
        { status: 400 }
      );
    }

    let resume = null;
    if (resumeId) {
      resume = getResumeById(resumeId, user.id) || null;
    }

    if (!resume && (!rawResumeText || rawResumeText.trim().length < 30)) {
      return NextResponse.json(
        { error: "Please select an existing resume from your builder or paste resume text (minimum 30 characters)." },
        { status: 400 }
      );
    }

    const analysis = analyzeResumeForJob(
      resume,
      rawResumeText || "",
      jobTitle?.trim() || "Target Role",
      jobCompany?.trim() || "Company",
      jobDescription.trim(),
      user.id
    );

    saveATSAnalysis(analysis);

    return NextResponse.json({ analysis, message: "ATS compatibility analysis completed successfully." });
  } catch (error) {
    console.error("ATS analysis error:", error);
    return NextResponse.json({ error: "Failed to perform ATS analysis." }, { status: 500 });
  }
}
