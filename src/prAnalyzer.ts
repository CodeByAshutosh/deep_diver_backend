import { getPullRequestWithDiff, commentOnPullRequest } from "./githubClient.js";
import { summarizePRForSlides } from "./llmClient.js";
import { generateHtmlSlides } from "./slideGenerator/htmlSlides.js";

export async function processPullRequestEvent(payload: any) {
  const pr = payload.pull_request;
  const repo = payload.repository;

  const owner = repo.owner.login;
  const repoName = repo.name;
  const prNumber = pr.number;

  const { pr: prData, files } = await getPullRequestWithDiff({
    owner,
    repo: repoName,
    pull_number: prNumber,
  });

  const summary = await summarizePRForSlides({
    title: prData.title,
    description: prData.body || "",
    files: files.map((f: any) => ({
      filename: f.filename,
      status: f.status,
      patch: f.patch,
    })),
  });

  const { publicUrl } = generateHtmlSlides(summary, {
    owner,
    repo: repoName,
    prNumber,
  });

  const body = `
I've generated a slide deck summarizing this PR:

➡️ ${publicUrl}

_This was auto-generated from the PR diff._
`;

  await commentOnPullRequest({
    owner,
    repo: repoName,
    issue_number: prNumber,
    body,
  });
}