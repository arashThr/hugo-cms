import { Octokit } from "@octokit/rest";

export function getOctokit(accessToken: string) {
  return new Octokit({ auth: accessToken });
}

export async function listUserRepositories(accessToken: string) {
  const octokit = getOctokit(accessToken);
  const response = await octokit.rest.repos.listForAuthenticatedUser({
    sort: "updated",
    per_page: 100,
  });
  return response.data;
}

export async function getRepositoryTree(
  accessToken: string,
  owner: string,
  repo: string,
  branch: string = "main"
) {
  const octokit = getOctokit(accessToken);
  try {
    const { data: refData } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });
    const commitSha = refData.object.sha;

    const { data: commitData } = await octokit.rest.git.getCommit({
      owner,
      repo,
      commit_sha: commitSha,
    });

    const { data: treeData } = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: commitData.tree.sha,
      recursive: "true",
    });

    return treeData.tree;
  } catch (error) {
    console.error("Error fetching repository tree:", error);
    return [];
  }
}

export async function commitFiles(
  accessToken: string,
  owner: string,
  repo: string,
  branch: string = "main",
  message: string,
  files: { path: string; content: string; encoding: "utf-8" | "base64" }[]
) {
  const octokit = getOctokit(accessToken);

  // 1. Get current commit
  const { data: refData } = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${branch}`,
  });
  const commitSha = refData.object.sha;

  const { data: commitData } = await octokit.rest.git.getCommit({
    owner,
    repo,
    commit_sha: commitSha,
  });
  const baseTreeSha = commitData.tree.sha;

  // 2. Create blobs
  const treeItems = await Promise.all(
    files.map(async (file) => {
      const { data: blobData } = await octokit.rest.git.createBlob({
        owner,
        repo,
        content: file.content,
        encoding: file.encoding,
      });

      return {
        path: file.path,
        mode: "100644" as const,
        type: "blob" as const,
        sha: blobData.sha,
      };
    })
  );

  // 3. Create a new tree
  const { data: newTreeData } = await octokit.rest.git.createTree({
    owner,
    repo,
    base_tree: baseTreeSha,
    tree: treeItems,
  });

  // 4. Create a new commit
  const { data: newCommitData } = await octokit.rest.git.createCommit({
    owner,
    repo,
    message,
    tree: newTreeData.sha,
    parents: [commitSha],
  });

  // 5. Update ref
  await octokit.rest.git.updateRef({
    owner,
    repo,
    ref: `heads/${branch}`,
    sha: newCommitData.sha,
  });

  return newCommitData.html_url;
}
