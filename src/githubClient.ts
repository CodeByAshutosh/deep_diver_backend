import { Octokit } from "@octokit/rest";


const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export async function listPullRequests(owner: string, repo: string) {
  const { data } = await octokit.pulls.list({
    owner,
    repo,
    state: "open",
    per_page: 20,
  });

  return data.map((pr) => ({
    number: pr.number,
    title: pr.title,
    user: pr.user?.login || "unknown",
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
    labels: pr.labels?.map((l: any) => l.name) || [],
  }));
}


export async function getPullRequestWithDiff(params: {
  owner: string;
  repo: string;
  pull_number: number;
}) {
  const [pr, files] = await Promise.all([
    octokit.pulls.get(params),
    octokit.pulls.listFiles(params),
  ]);

  return { pr: pr.data, files: files.data };
}

export async function commentOnPullRequest(params: {
  owner: string;
  repo: string;
  issue_number: number;
  body: string;
}) {
  await octokit.issues.createComment(params);
}

export async function fetchPullRequestDetails(owner: string, repo: string, prNumber: number) {
  // Fetch PR metadata + file diffs
  const { pr, files } = await getPullRequestWithDiff({
    owner,
    repo,
    pull_number: prNumber,
  });

  return {
    title: pr.title,
    body: pr.body || "",
    files: files.map((f) => ({
      filename: f.filename,
      status: f.status,
      patch: f.patch || "",
    })),
  };
}
