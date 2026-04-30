import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { commitFiles } from "@/lib/github";
import * as toml from "@iarna/toml";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { repository, contentPath, imagePath, title, date, tags, markdown, images } = body;

    if (!repository || !title || !markdown) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [owner, repo] = repository.split("/");

    // 1. Generate Frontmatter
    const frontmatterObj = {
      title,
      date: new Date(date).toISOString(),
      tags: tags.split(",").map((t: string) => t.trim()).filter(Boolean),
    };

    const tomlString = toml.stringify(frontmatterObj as any);
    const fileContent = `+++\n${tomlString}+++\n\n${markdown}`;

    // 2. Prepare files array
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    const filename = `${slug}.md`;
    const fullPostPath = `${contentPath.replace(/\/$/, "")}/${filename}`;

    const filesToCommit: { path: string; content: string; encoding: "utf-8" | "base64" }[] = [
      {
        path: fullPostPath,
        content: fileContent,
        encoding: "utf-8",
      },
    ];

    // 3. Add images
    if (images && images.length > 0) {
      for (const img of images) {
        // img.base64 might be "data:image/png;base64,iVBORw0KGgo..."
        const base64Data = img.base64.split(",")[1] || img.base64;
        filesToCommit.push({
          path: `${imagePath.replace(/\/$/, "")}/${img.name}`,
          content: base64Data,
          encoding: "base64",
        });
      }
    }

    // 4. Commit
    // @ts-ignore
    const url = await commitFiles(
      // @ts-ignore
      session.accessToken,
      owner,
      repo,
      "main",
      `Add post: ${title}`,
      filesToCommit
    );

    return NextResponse.json({ success: true, url });
  } catch (error: any) {
    console.error("Publish error:", error);
    return NextResponse.json({ error: error.message || "Failed to publish" }, { status: 500 });
  }
}
