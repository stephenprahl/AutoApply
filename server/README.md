# AutoJob Backend Server

This is the Express.js backend server for the AutoJob application.

## Features

- **Profile Management**: Save and retrieve user profiles
- **Resume Parsing**: Parse PDF and text files to extract resume content and skills
- **Job Analysis**: Analyze job fit between user profiles and job descriptions
- **Cover Letter Generation**: Generate tailored cover letters using AI
- **Profile Optimization**: Optimize profile summaries and extract skills
- **Application Tracking**: Manage job applications with status tracking

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

## Environment Variables

- `API_KEY` - Google Gemini API key for AI features
- `PORT` - Server port (default: 3001)

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
