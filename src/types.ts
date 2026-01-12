export interface UserProfile {
  name: string;
  title: string;
  experience: string; // Years of experience
  skills: string[];
  resumeText: string;
  resumeFile?: {
    name: string;
    size: number;
    type: string;
    uploadedAt: number;
  };
  preferences: {
    remote: boolean;
    minSalary: number;
  };
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  postedAt: string;
  tags: string[];
  logo: string;
}

export const ApplicationStatus = {
  PENDING: 'PENDING',
  ANALYZING: 'ANALYZING',
  MATCHED: 'MATCHED',
  REJECTED: 'REJECTED',
  APPLYING: 'APPLYING',
  APPLIED: 'APPLIED',
  FAILED: 'FAILED'
} as const;

export type ApplicationStatus = typeof ApplicationStatus[keyof typeof ApplicationStatus];

export interface ApplicationRecord {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  status: ApplicationStatus;
  matchScore: number;
  matchReason?: string;
  coverLetter?: string;
  timestamp: number;
}

export interface AgentLog {
  timestamp: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface SkillGap {
  missing: string[];
  strong: string[];
  recommended: string[];
  analysis: string;
}