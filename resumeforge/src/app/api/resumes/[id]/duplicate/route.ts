import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { duplicateResume } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const copy = duplicateResume(id, user.id);
  if (!copy) {
    return NextResponse.json({ error: "Resume not found to duplicate." }, { status: 404 });
  }

  return NextResponse.json({ resume: copy, message: "Resume duplicated successfully." }, { status: 201 });
}
