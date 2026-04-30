import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getRepositoryTree } from "@/lib/github";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");

  if (!owner || !repo) {
    return NextResponse.json({ error: "Missing owner or repo" }, { status: 400 });
  }

  try {
    // @ts-ignore
    const tree = await getRepositoryTree(session.accessToken, owner, repo);
    return NextResponse.json({ tree });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tree" }, { status: 500 });
  }
}
