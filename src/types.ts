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
  workExperience?: WorkExperience[];
  education?: Education[];
  portfolio?: PortfolioLinks;
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
  location?: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  gpa?: string;
}

export interface PortfolioLinks {
  github?: string;
  linkedin?: string;
  portfolio?: string;
  website?: string;
  twitter?: string;
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

export interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    applicationUpdates: boolean;
    jobRecommendations: boolean;
    weeklyReports: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
  };
  privacy: {
    profileVisibility: 'public' | 'private';
    dataSharing: boolean;
    analytics: boolean;
  };
  automation: {
    autoApply: boolean;
    dailyApplicationLimit: number;
    workingHours: {
      start: string;
      end: string;
    };
    matchThreshold: number;
  };
  apiKeys: {
    gemini?: string;
    openai?: string;
  };
}