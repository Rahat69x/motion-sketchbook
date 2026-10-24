import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getInterviewSessionById, updateInterviewSession } from "@/lib/db";
import { evaluateAnswer } from "@/lib/interviewEngine";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const session = getInterviewSessionById(id, user.id);
  if (!session) {
    return NextResponse.json({ error: "Interview session not found." }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { questionId, answer, timeSpentSeconds } = body;

    if (!questionId || typeof answer !== "string") {
      return NextResponse.json({ error: "questionId and answer string are required." }, { status: 400 });
    }

    const qIdx = session.questions.findIndex((q) => q.id === questionId);
    if (qIdx === -1) {
      return NextResponse.json({ error: "Question not found in this session." }, { status: 404 });
    }

    const targetQuestion = session.questions[qIdx];
    const evaluation = evaluateAnswer(targetQuestion, answer);

    // Update question in session
    session.questions[qIdx] = {
      ...targetQuestion,
      userAnswer: answer.trim(),
      timeSpentSeconds: Number(timeSpentSeconds) || 0,
      score: evaluation.score,
      rubricFeedback: {
        relevanceScore: evaluation.relevanceScore,
        clarityScore: evaluation.clarityScore,
        technicalDepthScore: evaluation.technicalDepthScore,
        starAdherence: evaluation.starAdherence,
        critique: evaluation.critique,
        modelAnswerSnippet: evaluation.modelAnswerSnippet,
        actionableTip: evaluation.actionableTip,
      },
    };

    // Check if all questions are answered
    const answeredCount = session.questions.filter((q) => q.userAnswer !== undefined).length;
    const isCompleted = answeredCount === session.questions.length;

    if (isCompleted) {
      session.status = "completed";
      session.completedAt = new Date().toISOString();
      const avg = Math.round(session.questions.reduce((sum, q) => sum + (q.score || 0), 0) / session.questions.length);
      session.overallScore = avg;

      if (avg >= 85) {
        session.feedbackSummary = "Outstanding performance! Structured answers, high technical precision, and strong quantifiable outcomes.";
      } else if (avg >= 70) {
        session.feedbackSummary = "Good performance overall. Solid foundational answers with opportunity to incorporate deeper trade-off discussions.";
      } else {
        session.feedbackSummary = "Practice session completed. Focus on adopting the STAR framework and detailing specific technical actions taken.";
      }
    }

    updateInterviewSession(session);

    return NextResponse.json({
      session,
      evaluation,
      isCompleted,
      message: "Answer evaluated successfully.",
    });
  } catch (error) {
    console.error("Submit interview answer error:", error);
    return NextResponse.json({ error: "Failed to evaluate answer." }, { status: 500 });
  }
}
