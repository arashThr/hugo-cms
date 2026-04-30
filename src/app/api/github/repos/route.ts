import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { listUserRepositories } from "@/lib/github";

export async function GET() {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // @ts-ignore
    const repos = await listUserRepositories(session.accessToken);
    return NextResponse.json({ repos });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch repos" }, { status: 500 });
  }
}
