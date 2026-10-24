import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { evaluateAptitudeTest } from "@/lib/aptitudeEngine";
import { AptitudeCategory } from "@/lib/types";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { category, mode, answers } = body;

    if (!Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json({ error: "Answers array is required." }, { status: 400 });
    }

    const targetCategory: AptitudeCategory | "all" = category || "all";
    const targetMode: "practice" | "timed" = mode || "practice";

    const { attempt, results } = await evaluateAptitudeTest(user.id, targetCategory, targetMode, answers);

    return NextResponse.json({
      attempt,
      results,
      message: "Test submitted and evaluated successfully.",
    });
  } catch (error) {
    console.error("Aptitude submit error:", error);
    return NextResponse.json({ error: "Failed to evaluate aptitude test." }, { status: 500 });
  }
}
