import { PRSlideSummary } from "./types.js";

// Mock summarizer for testing when LLM APIs are unavailable
export async function mockSummarizePRForSlides(input: {
  title: string;
  description: string;
  files: {
    filename: string;
    status: string;
    patch?: string;
  }[];
}): Promise<PRSlideSummary> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const numFiles = input.files.length;
  const summary: PRSlideSummary = {
    title: input.title || "PR Summary",
    overview: `This pull request introduces significant improvements to system behavior and performance. The changes affect ${numFiles} files and represent a coordinated effort to enhance reliability, maintainability, and user experience. The implementation follows established patterns and includes comprehensive testing to ensure stability.`,
    keyChanges: [
      `Updated core logic to improve performance by optimizing data flow`,
      `Refactored ${Math.min(3, numFiles)} major components for better separation of concerns`,
      `Added error handling and validation for edge cases`,
      `Improved documentation and code clarity for future maintainers`,
      `Enhanced testing coverage to ensure stability and reliability`,
    ],
    fileChanges: input.files.slice(0, 8).map((file, idx) => ({
      filePath: file.filename,
      changeType: file.status as "added" | "modified" | "deleted",
      summary: [
        `Core business logic implementation - handles data processing and transformation`,
        `API endpoint definition and request/response handling`,
        `Database schema and migration logic`,
        `Configuration and environment setup`,
        `Test suite for feature validation`,
        `Documentation and type definitions`,
        `Utility functions and helpers`,
        `Build and deployment configuration`,
      ][idx % 8],
    })),
    risks: [
      `Database migration may impact systems with large datasets - should be tested in staging`,
      `API changes could affect dependent services - ensure backward compatibility`,
      `Performance implications on systems with high load - monitor metrics post-deployment`,
      `Potential data loss if rollback is needed - ensure backups are in place`,
    ],
    testing: [
      `Unit tests cover all new functionality with >90% code coverage`,
      `Integration tests verify interaction with dependent systems`,
      `Performance tests confirm <5% impact on response times`,
      `Manual testing in staging environment completed`,
      `Rollback procedure tested and documented`,
    ],
  };

  return summary;
}
