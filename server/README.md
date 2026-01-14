# AutoJob Backend Server

This is the Express.js backend server for the AutoJob application.

## Features

- **Profile Management**: Save and retrieve user profiles
- **Resume Parsing**: Parse PDF and text files to extract resume content and skills
- **Job Analysis**: Analyze job fit between user profiles and job descriptions
- **Cover Letter Generation**: Generate tailored cover letters using AI
- **Profile Optimization**: Optimize profile summaries and extract skills
- **Application Tracking**: Manage job applications with status tracking
- **Google Search Auto-Apply**: Automated job search and application workflow

## Google Search Auto-Apply Workflow

The new Google Search Auto-Apply feature automates the entire job application process:

### How It Works

1. **Google Search**: Navigates to Google and searches for "hiring jobs" + keywords from your resume
2. **Keyword Matching**: Analyzes search results for keywords matching your resume skills
3. **Company Navigation**: Opens matching company websites
4. **Careers Page Discovery**: Automatically finds careers/jobs pages
5. **Form Filling**: Fills out ALL fields on ALL pages of the application form
6. **Submission**: Submits the application
7. **Reporting**: Reports success/failure for each application

### Supported Form Fields

The automation can fill:
- Name (full, first, last)
- Email
- Phone
- Location/Address
- LinkedIn URL
- GitHub/Portfolio URLs
- Years of experience
- Salary expectations
- Cover letter/About me sections
- Skills descriptions
- Dropdown selections (country, education, work authorization, etc.)
- Required checkboxes (terms, consent, etc.)

### API Endpoint

```
POST /api/google-search-apply
```

**Form Data Parameters:**
- `searchQuery` (optional): Custom search query (auto-generated from profile if not provided)
- `maxApplications` (optional): Maximum number of applications to submit (default: 5)
- `resume` (optional): Resume file to use for keyword extraction

**Response:**
```json
{
  "success": true,
  "status": "completed",
  "summary": {
    "totalLogged": 15,
    "successfulActions": 3,
    "errors": 1,
    "message": "Google search auto-apply workflow completed successfully"
  },
  "logs": [...],
  "errors": [...]
}
```

## API Endpoints

### Health Check
- `GET /api/health` - Check if the server is running

### Profile Management
- `GET /api/profile` - Get user profile
- `POST /api/profile` - Save/update user profile

### Resume Processing
- `POST /api/parse-resume` - Parse resume file (multipart/form-data)

### Job Analysis
- `POST /api/analyze-job-fit` - Analyze job fit score
- `POST /api/generate-cover-letter` - Generate cover letter
- `POST /api/optimize-profile` - Optimize profile summary

### Application Management
- `GET /api/applications` - Get all applications
- `POST /api/applications` - Create new application
- `PUT /api/applications/:id` - Update application status
- `DELETE /api/applications/:id` - Delete application

### Auto-Apply Workflows
- `POST /api/auto-apply` - Run auto-apply workflow with provided jobs
- `POST /api/google-search-apply` - Run Google search auto-apply workflow

## Environment Variables

- `API_KEY` - Google Gemini API key for AI features
- `PORT` - Server port (default: 3001)
- `DEMO_MODE` - Set to 'false' to enable real web automation (default: true)

## Running the Server

### Development
```bash
bun run server:dev
```

### Production
```bash
bun run server
```

### Full Stack Development
```bash
bun run dev:full
```

## Dependencies

- Express.js for web server
- Multer for file uploads
- CORS for cross-origin requests
- Google Gemini AI for analysis features

## Notes

- Uses in-memory storage (replace with database in production)
- Supports PDF and text file parsing
- AI features require API key configuration
