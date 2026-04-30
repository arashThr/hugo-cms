import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getOctokit } from "@/lib/github";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const path = searchParams.get("path");

  if (!owner || !repo || !path) {
    return NextResponse.json({ error: "Missing required params" }, { status: 400 });
  }

  try {
    // @ts-ignore
    const octokit = getOctokit(session.accessToken);
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
    });

    if (!Array.isArray(data) && data.type === "file") {
      const content = Buffer.from(data.content, "base64").toString("utf-8");
      return NextResponse.json({ content, sha: data.sha });
    } else {
      return NextResponse.json({ error: "Not a file" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Failed to fetch file:", error);
    return NextResponse.json({ error: "Failed to fetch file" }, { status: 500 });
  }
}
