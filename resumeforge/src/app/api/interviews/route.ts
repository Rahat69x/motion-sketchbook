import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createInterviewSession, getInterviewSessionsByUserId } from "@/lib/db";
import { generateInterviewSession } from "@/lib/interviewEngine";
import { InterviewCategory, InterviewDifficulty } from "@/lib/types";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessions = getInterviewSessionsByUserId(user.id);
  return NextResponse.json({ sessions });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const category: InterviewCategory = body.category || "behavioral";
    const targetRole = body.targetRole?.trim() || user.targetRole || "Software Engineer";
    const difficulty: InterviewDifficulty = body.difficulty || "junior";
    const questionCount = Math.min(7, Math.max(1, Number(body.questionCount) || 3));

    const session = generateInterviewSession(user.id, category, targetRole, difficulty, questionCount);
    createInterviewSession(session);

    return NextResponse.json({ session, message: "Interview session created successfully." }, { status: 201 });
  } catch (error) {
    console.error("Create interview error:", error);
    return NextResponse.json({ error: "Failed to initialize interview session." }, { status: 500 });
  }
}
