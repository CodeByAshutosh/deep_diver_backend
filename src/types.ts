export interface FileChangeSummary {
  filePath: string;
  changeType: "added" | "modified" | "deleted";
  highLevelSummary: string;
  keyPoints: string[];
  risksOrConcerns?: string[];
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
}

