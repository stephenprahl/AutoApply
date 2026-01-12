import cors from 'cors';
import express from 'express';
import multer from 'multer';
import type { ApplicationRecord, Job, UserProfile } from '../src/types.js';
import { AutoApplyWorkflow } from './agents/AutoApplyWorkflow.js';
import { analyzeJobFit, generateCoverLetter, optimizeProfileSummary } from './services/geminiService.js';
import { jobSearchService } from './services/jobSearchService.js';
import { analyzeJobFit as analyzeResumeJobFit, optimizeResumeAdvanced } from './services/resumeOptimizer.js';
import { parseResumeFile } from './services/resumeParser.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'));
    }
  }
});

// Initialize the LangGraph workflow (demo mode by default for safety)
const autoApplyWorkflow = new AutoApplyWorkflow(process.env.API_KEY, process.env.DEMO_MODE !== 'false');

// In-memory storage (replace with database in production)
let userProfile: UserProfile | null = null;
let applications: ApplicationRecord[] = [];

// Routes

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: Date.now() });
});

// Profile management
app.get('/api/profile', (_req, res) => {
  if (!userProfile) {
    return res.status(404).json({ error: 'No profile found' });
  }
  res.json(userProfile);
});

app.post('/api/profile', (req, res) => {
  userProfile = req.body;
  res.json({ success: true, profile: userProfile });
});

// Resume parsing
app.post('/api/parse-resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Convert buffer to File object for the existing parser
    const arrayBuffer = req.file!.buffer.buffer.slice(req.file!.buffer.byteOffset, req.file!.buffer.byteOffset + req.file!.buffer.byteLength);
    const file = new File([arrayBuffer as ArrayBuffer], req.file!.originalname, {
      type: req.file!.mimetype
    });

    const result = await parseResumeFile(file);
    res.json(result);
  } catch (error) {
    console.error('Resume parsing error:', error);
    res.status(500).json({ error: 'Failed to parse resume' });
  }
});

// Job analysis
app.post('/api/analyze-job-fit', async (req, res) => {
  try {
    const { profile, job } = req.body;

    if (!profile || !job) {
      return res.status(400).json({ error: 'Profile and job are required' });
    }

    const result = await analyzeJobFit(profile, job);
    res.json(result);
  } catch (error) {
    console.error('Job analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze job fit' });
  }
});

// Cover letter generation
app.post('/api/generate-cover-letter', async (req, res) => {
  try {
    const { profile, job } = req.body;

    if (!profile || !job) {
      return res.status(400).json({ error: 'Profile and job are required' });
    }

    const coverLetter = await generateCoverLetter(profile, job);
    res.json({ coverLetter });
  } catch (error) {
    console.error('Cover letter generation error:', error);
    res.status(500).json({ error: 'Failed to generate cover letter' });
  }
});

// Profile optimization
app.post('/api/optimize-profile', async (req, res) => {
  try {
    const { rawText } = req.body;

    if (!rawText) {
      return res.status(400).json({ error: 'Raw text is required' });
    }

    const result = await optimizeProfileSummary(rawText);
    res.json(result);
  } catch (error) {
    console.error('Profile optimization error:', error);
    res.status(500).json({ error: 'Failed to optimize profile' });
  }
});

// Advanced resume optimization
app.post('/api/optimize-resume-advanced', async (req, res) => {
  try {
    const { resumeText, targetJob, industry } = req.body;

    if (!resumeText) {
      return res.status(400).json({ error: 'Resume text is required' });
    }

    const result = await optimizeResumeAdvanced(resumeText, targetJob, industry);
    res.json(result);
  } catch (error) {
    console.error('Advanced resume optimization error:', error);
    res.status(500).json({ error: 'Failed to optimize resume' });
  }
});

// Resume job fit analysis
app.post('/api/analyze-resume-job-fit', async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;

    if (!resumeText || !jobDescription) {
      return res.status(400).json({ error: 'Resume text and job description are required' });
    }

    const result = await analyzeResumeJobFit(resumeText, jobDescription);
    res.json(result);
  } catch (error) {
    console.error('Resume job fit analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze job fit' });
  }
});

// Application management
app.get('/api/applications', (_req, res) => {
  res.json(applications);
});

app.post('/api/applications', (req, res) => {
  const application: ApplicationRecord = {
    id: Date.now().toString(),
    timestamp: Date.now(),
    ...req.body
  };

  applications.push(application);
  res.json({ success: true, application });
});

app.put('/api/applications/:id', (req, res) => {
  const { id } = req.params;
  const index = applications.findIndex(app => app.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Application not found' });
  }

  applications[index] = { ...applications[index], ...req.body };
  res.json({ success: true, application: applications[index] });
});

app.delete('/api/applications/:id', (req, res) => {
  const { id } = req.params;
  const index = applications.findIndex(app => app.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Application not found' });
  }

  applications.splice(index, 1);
  res.json({ success: true });
});

// Settings management
app.get('/api/settings', (_req, res) => {
  res.json({
    demoMode: process.env.DEMO_MODE !== 'false',
    apiKeyConfigured: !!process.env.API_KEY,
    ollamaUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
  });
});

app.post('/api/settings', (req, res) => {
  const { demoMode } = req.body;
  if (typeof demoMode === 'boolean') {
    process.env.DEMO_MODE = demoMode.toString();
    res.json({ success: true, demoMode });
  } else {
    res.status(400).json({ error: 'Invalid demoMode value' });
  }
});

// Auto-apply workflow orchestration
app.post('/api/auto-apply', upload.single('resume'), async (req, res) => {
  try {
    const { jobs, maxApplications } = req.body;

    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
      return res.status(400).json({ error: 'Jobs array is required' });
    }

    let resumeFile: File | undefined;
    if (req.file) {
      // Convert buffer to File object
      const arrayBuffer = req.file!.buffer.buffer.slice(req.file!.buffer.byteOffset, req.file!.buffer.byteOffset + req.file!.buffer.byteLength);
      resumeFile = new File([arrayBuffer as ArrayBuffer], req.file!.originalname, {
        type: req.file!.mimetype
      });
    }

    // Run the orchestrated workflow
    const result = await autoApplyWorkflow.run({
      resumeFile,
      jobs: jobs as Job[],
      maxApplications: maxApplications || 5,
      profile: userProfile || undefined // Use existing profile if available
    });

    // Update global state with results
    if (result.profile) {
      userProfile = result.profile;
    }
    if (result.applications) {
      // Merge new applications with existing ones
      const existingIds = new Set(applications.map(app => app.id));
      const newApplications = result.applications.filter(app => !existingIds.has(app.id));
      applications.push(...newApplications);
    }

    res.json({
      success: true,
      status: result.status,
      profile: result.profile,
      applications: result.applications,
      logs: result.logs,
      errors: result.errors
    });

  } catch (error) {
    console.error('Auto-apply workflow error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: 'Failed to execute auto-apply workflow',
      details: errorMessage
    });
  }
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Job search endpoints
app.post('/api/jobs/search', async (req, res) => {
  try {
    const { keywords, location, remote, salaryMin, jobType, limit } = req.body;

    const searchParams = {
      keywords: Array.isArray(keywords) ? keywords : [keywords || 'developer'],
      location: location || 'Remote',
      remote: remote || false,
      salaryMin: salaryMin || 0,
      jobType: jobType || 'full-time',
      limit: limit || 50
    };

    const results = await jobSearchService.searchJobs(searchParams);

    // Combine results from all sources
    const allJobs = results.flatMap(result => result.jobs);
    const totalCount = results.reduce((sum, result) => sum + result.totalCount, 0);

    res.json({
      jobs: allJobs,
      totalCount,
      sources: results.map(r => ({ source: r.source, count: r.jobs.length }))
    });
  } catch (error) {
    console.error('Job search error:', error);
    res.status(500).json({ error: 'Failed to search jobs' });
  }
});

app.get('/api/jobs/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const jobs = await jobSearchService.getTrendingJobs(limit);
    res.json({ jobs });
  } catch (error) {
    console.error('Trending jobs error:', error);
    res.status(500).json({ error: 'Failed to get trending jobs' });
  }
});

app.post('/api/jobs/similar/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const limit = parseInt(req.query.limit as string) || 5;

    // Find the job in our stored applications or search results
    // For now, we'll create a mock job based on the ID
    const mockJob: Job = {
      id: jobId,
      title: 'Sample Job',
      company: 'Sample Company',
      location: 'Remote',
      salary: '$100k - $150k',
      description: 'Sample job description',
      postedAt: '1 day ago',
      tags: ['React', 'TypeScript'],
      logo: '/api/placeholder/64/64'
    };

    const similarJobs = await jobSearchService.getSimilarJobs(mockJob, limit);
    res.json({ jobs: similarJobs });
  } catch (error) {
    console.error('Similar jobs error:', error);
    res.status(500).json({ error: 'Failed to get similar jobs' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
});

export default app;
