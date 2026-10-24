import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, toPublicProfile } from "@/lib/auth";
import { updateUser } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ user: toPublicProfile(user) });
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, university, degree, graduationYear, targetRole } = body;

    const updated = await updateUser(user.id, {
      name: name?.trim() || user.name,
      university: university?.trim() || user.university,
      degree: degree?.trim() || user.degree,
      graduationYear: Number(graduationYear) || user.graduationYear,
      targetRole: targetRole?.trim() || user.targetRole,
    });

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: toPublicProfile(updated), message: "Profile updated successfully." });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}
