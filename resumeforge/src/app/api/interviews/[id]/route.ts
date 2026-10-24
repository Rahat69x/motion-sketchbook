import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getInterviewSessionById } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const session = getInterviewSessionById(id, user.id);
  if (!session) {
    return NextResponse.json({ error: "Interview session not found." }, { status: 404 });
  }

  return NextResponse.json({ session });
}
