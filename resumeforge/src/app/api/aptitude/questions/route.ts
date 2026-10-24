import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getAptitudeQuestions } from "@/lib/db";
import { sanitizeQuestionForClient } from "@/lib/aptitudeEngine";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "all";
  const limit = Number(searchParams.get("limit")) || 10;

  const rawQuestions = getAptitudeQuestions(category, limit);
  // Ensure answers and explanations are protected before student submits
  const questions = rawQuestions.map(sanitizeQuestionForClient);

  return NextResponse.json({ questions, total: questions.length });
}
