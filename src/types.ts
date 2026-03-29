export interface FileChangeSummary {
  filePath: string;
  changeType: "added" | "modified" | "deleted";
  highLevelSummary: string;
  keyPoints: string[];
  risksOrConcerns?: string[];
}

export interface CodeDiff {
  filePath: string;
  before?: string;
  after?: string;
  summary: string;
}

export interface PRSlideSummary {
  title: string;
  overview: string;
  keyChanges: string[];
  fileChanges: {
    filePath: string;
    changeType: "added" | "modified" | "deleted";
    summary: string;
  }[];
  risks: string[];
  testing: string[];
  
  // New comprehensive content
  motivation?: string; // Why this PR was created
  whyChanges?: string[]; // Reasons for key changes
  keyDiffs?: CodeDiff[]; // Top 3-5 code diffs
  dependencies?: {
    added: string[];
    removed: string[];
    updated: string[];
  };
  performanceImpact?: {
    improvements: string[];
    degradations: string[];
  };
  securityConsiderations?: string[];
  breakingChanges?: string[];
  reviewComments?: {
    author: string;
    comment: string;
    resolved: boolean;
  }[];
  learningPoints?: string[]; // What juniors can learn
  checklist?: {
    description: string;
    completed: boolean;
  }[];
  rollbackPlan?: string;
  filesImpactMap?: { [directory: string]: number }; // File count by directory
}

