import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getResumeById, saveResume, deleteResume } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const resume = getResumeById(id, user.id);
  if (!resume) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  return NextResponse.json({ resume });
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = getResumeById(id, user.id);
  if (!existing) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const updated = {
      ...existing,
      ...body,
      id: existing.id,
      userId: user.id, // Enforce tenant isolation
      updatedAt: new Date().toISOString(),
    };

    saveResume(updated);
    return NextResponse.json({ resume: updated, message: "Resume saved successfully." });
  } catch (error) {
    console.error("Update resume error:", error);
    return NextResponse.json({ error: "Failed to update resume." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const success = deleteResume(id, user.id);
  if (!success) {
    return NextResponse.json({ error: "Resume not found or already deleted." }, { status: 404 });
  }

  return NextResponse.json({ message: "Resume deleted successfully." });
}
