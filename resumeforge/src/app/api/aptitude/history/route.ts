import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getAptitudeAttemptsByUserId } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const history = getAptitudeAttemptsByUserId(user.id);
  return NextResponse.json({ history });
}
