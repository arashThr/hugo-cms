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
    const { repository, contentPath, imagePath, title, slug: customSlug, layout, date, tags, markdown, images, featuredImage } = body;

    if (!repository || !title || !markdown) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [owner, repo] = repository.split("/");

    // 2. Prepare files array
    const resolvedSlug = customSlug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    const filename = `${resolvedSlug}.md`;
    const fullPostPath = `${contentPath.replace(/\/$/, "")}/${filename}`;

    const filesToCommit: { path: string; content: string; encoding: "utf-8" | "base64" }[] = [];

    // Process featured image if exists
    let frontmatterImage = "";
    if (featuredImage && featuredImage.startsWith("data:image")) {
       const imgFilename = `featured-${Date.now()}.webp`;
       const base64Data = featuredImage.split(",")[1];
       filesToCommit.push({
         path: `${imagePath.replace(/\/$/, "")}/${imgFilename}`,
         content: base64Data,
         encoding: "base64"
       });
       frontmatterImage = `/${imagePath.replace(/^static\//, "")}/${imgFilename}`.replace(/\/\//g, "/");
    } else if (featuredImage) {
       // If it's just a URL string (from an existing post)
       frontmatterImage = featuredImage;
    }

    // 1. Generate Frontmatter
    const frontmatterObj = {
      title,
      date: new Date(date).toISOString(),
      ...(layout && layout !== 'Single Post (Default)' ? { layout } : {}),
      tags: tags ? tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
      ...(frontmatterImage && { image: frontmatterImage })
    };

    const tomlString = toml.stringify(frontmatterObj as any);
    const fileContent = `+++\n${tomlString}+++\n\n${markdown}`;

    filesToCommit.push({
      path: fullPostPath,
      content: fileContent,
      encoding: "utf-8",
    });

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
