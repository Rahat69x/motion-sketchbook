import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDashboardStats } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = getDashboardStats(user.id);
  return NextResponse.json({ stats, user: { name: user.name, targetRole: user.targetRole, university: user.university } });
}
