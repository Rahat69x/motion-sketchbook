import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getATSAnalysesByUserId } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const history = getATSAnalysesByUserId(user.id);
  return NextResponse.json({ history });
}
