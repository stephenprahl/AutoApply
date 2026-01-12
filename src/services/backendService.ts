const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const backendApi = {
  // Profile management
  async getProfile() {
    const response = await fetch(`${API_BASE_URL}/profile`);
    if (!response.ok) throw new Error('Failed to fetch profile');
    return response.json();
  },

  async saveProfile(profile: any) {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (!response.ok) throw new Error('Failed to save profile');
    return response.json();
  },

  // Resume parsing
  async parseResume(file: File) {
    const formData = new FormData();
    formData.append('resume', file);

    const response = await fetch(`${API_BASE_URL}/parse-resume`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to parse resume');
    return response.json();
  },

  // Job analysis
  async analyzeJobFit(profile: any, job: any) {
    const response = await fetch(`${API_BASE_URL}/analyze-job-fit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, job }),
    });
    if (!response.ok) throw new Error('Failed to analyze job fit');
    return response.json();
  },

  // Cover letter generation
  async generateCoverLetter(profile: any, job: any) {
    const response = await fetch(`${API_BASE_URL}/generate-cover-letter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, job }),
    });
    if (!response.ok) throw new Error('Failed to generate cover letter');
    return response.json();
  },

  // Profile optimization
  async optimizeProfile(rawText: string) {
    const response = await fetch(`${API_BASE_URL}/optimize-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawText }),
    });
    if (!response.ok) throw new Error('Failed to optimize profile');
    return response.json();
  },

  // Advanced resume optimization
  async optimizeResumeAdvanced(resumeText: string, targetJob?: string, industry?: string) {
    const response = await fetch(`${API_BASE_URL}/optimize-resume-advanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeText, targetJob, industry }),
    });
    if (!response.ok) throw new Error('Failed to optimize resume');
    return response.json();
  },

  // Resume job fit analysis
  async analyzeResumeJobFit(resumeText: string, jobDescription: string) {
    const response = await fetch(`${API_BASE_URL}/analyze-resume-job-fit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeText, jobDescription }),
    });
    if (!response.ok) throw new Error('Failed to analyze job fit');
    return response.json();
  },

  // Application management
  async getApplications() {
    const response = await fetch(`${API_BASE_URL}/applications`);
    if (!response.ok) throw new Error('Failed to fetch applications');
    return response.json();
  },

  async createApplication(application: any) {
    const response = await fetch(`${API_BASE_URL}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(application),
    });
    if (!response.ok) throw new Error('Failed to create application');
    return response.json();
  },

  async updateApplication(id: string, updates: any) {
    const response = await fetch(`${API_BASE_URL}/applications/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update application');
    return response.json();
  },

  async deleteApplication(id: string) {
    const response = await fetch(`${API_BASE_URL}/applications/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete application');
    return response.json();
  },

  // Auto-apply workflow
  async runAutoApply(jobs: any[], maxApplications?: number, resume?: File) {
    const formData = new FormData();
    formData.append('jobs', JSON.stringify(jobs));
    if (maxApplications) formData.append('maxApplications', maxApplications.toString());
    if (resume) formData.append('resume', resume);

    const response = await fetch(`${API_BASE_URL}/auto-apply`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to run auto-apply workflow');
    return response.json();
  },

  // Settings management
  async getSettings() {
    const response = await fetch(`${API_BASE_URL}/settings`);
    if (!response.ok) throw new Error('Failed to fetch settings');
    return response.json();
  },

  async updateSettings(settings: any) {
    const response = await fetch(`${API_BASE_URL}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!response.ok) throw new Error('Failed to update settings');
    return response.json();
  },

  // Job search
  async searchJobs(params: { keywords: string[]; location: string; remote: boolean; salaryMin?: number; jobType?: string; limit?: number }) {
    const response = await fetch(`${API_BASE_URL}/jobs/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!response.ok) throw new Error('Failed to search jobs');
    return response.json();
  },

  async getTrendingJobs(limit?: number) {
    const url = new URL(`${API_BASE_URL}/jobs/trending`);
    if (limit) url.searchParams.set('limit', limit.toString());

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Failed to fetch trending jobs');
    return response.json();
  },

  async getSimilarJobs(jobId: string, limit?: number) {
    const url = new URL(`${API_BASE_URL}/jobs/similar/${jobId}`);
    if (limit) url.searchParams.set('limit', limit.toString());

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Failed to fetch similar jobs');
    return response.json();
  },

  // Health check
  async healthCheck() {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) throw new Error('Backend is not responding');
    return response.json();
  },
};
