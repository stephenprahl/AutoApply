import type { ApplicationRecord, Job, UserProfile } from "../../src/types.js";
import { ApplicationOrchestratorAgent } from "./ApplicationOrchestratorAgent.js";
import { CoverLetterAgent } from "./CoverLetterAgent.js";
import { GoogleJobSearchAgent, type GoogleJobSearchState } from "./GoogleJobSearchAgent.js";
import { JobAnalyzerAgent } from "./JobAnalyzerAgent.js";
import { ResumeParserAgent } from "./ResumeParserAgent.js";
import { WebAutomationAgent } from "./WebAutomationAgent.js";

// Combined state for the entire workflow
export interface AutoApplyWorkflowState {
    // Input data
    resumeFile?: File;
    jobs?: Job[];
    maxApplications?: number;

    // Processed data
    profile?: UserProfile;
    currentJob?: Job;
    applications?: ApplicationRecord[];

    // Analysis results
    matchScore?: number;
    matchReason?: string;
    isMatch?: boolean;
    skillGap?: any;
    coverLetter?: string;

    // Google search workflow
    useGoogleSearch?: boolean;
    searchQuery?: string;

    // Workflow control
    currentJobIndex?: number;
    status?: 'idle' | 'processing' | 'completed' | 'error';
    errors?: string[];
    logs?: Array<{
        timestamp: number;
        message: string;
        type: 'info' | 'success' | 'warning' | 'error';
    }>;
}

export class AutoApplyWorkflow {
    private resumeParser: ResumeParserAgent;
    private jobAnalyzer: JobAnalyzerAgent;
    private coverLetterAgent: CoverLetterAgent;
    private orchestrator: ApplicationOrchestratorAgent;
    private webAutomation: WebAutomationAgent;
    private googleJobSearch: GoogleJobSearchAgent;

    constructor(apiKey?: string, demoMode: boolean = true) {
        // Initialize agents
        this.resumeParser = new ResumeParserAgent(apiKey);
        this.jobAnalyzer = new JobAnalyzerAgent(apiKey);
        this.coverLetterAgent = new CoverLetterAgent(apiKey);
        this.orchestrator = new ApplicationOrchestratorAgent(apiKey);
        this.webAutomation = new WebAutomationAgent(demoMode);
        this.googleJobSearch = new GoogleJobSearchAgent(demoMode);
    }

    /**
     * Run Google Search workflow - searches Google for jobs and auto-applies
     */
    async runGoogleSearchWorkflow(state: Partial<AutoApplyWorkflowState>): Promise<AutoApplyWorkflowState> {
        const workflowState: AutoApplyWorkflowState = {
            status: 'idle',
            errors: [],
            logs: [],
            ...state
        };

        try {
            // Step 1: Parse resume if provided
            if (state.resumeFile) {
                workflowState.logs!.push({
                    timestamp: Date.now(),
                    message: "Starting resume parsing for Google search workflow",
                    type: "info"
                });

                const parseResult = await this.resumeParser.process({
                    resumeFile: state.resumeFile,
                    errors: workflowState.errors
                });

                workflowState.profile = parseResult.parsedProfile;
                workflowState.errors = parseResult.errors;
            }

            // Create demo profile if no profile exists
            if (!workflowState.profile) {
                workflowState.profile = {
                    name: "Demo User",
                    email: "demo@example.com",
                    phone: "+1-555-0123",
                    title: "Software Engineer",
                    experience: "3-5 years",
                    skills: ["JavaScript", "React", "Node.js", "Python", "TypeScript"],
                    resumeText: "Experienced software engineer with 4 years of experience in full-stack development...",
                    preferences: {
                        remote: true,
                        minSalary: 80000
                    }
                };
                workflowState.logs!.push({
                    timestamp: Date.now(),
                    message: "Using demo profile for Google search workflow",
                    type: "info"
                });
            }

            workflowState.logs!.push({
                timestamp: Date.now(),
                message: "Starting Google job search and auto-apply workflow",
                type: "info"
            });

            // Step 2: Run Google search and apply workflow
            const searchState: GoogleJobSearchState = {
                profile: workflowState.profile,
                searchQuery: state.searchQuery,
                status: 'idle',
                errors: [],
                logs: []
            };

            const searchResult = await this.googleJobSearch.searchAndApply(searchState);

            // Merge logs
            if (searchResult.logs) {
                workflowState.logs = workflowState.logs!.concat(searchResult.logs);
            }
            if (searchResult.errors) {
                workflowState.errors = workflowState.errors!.concat(searchResult.errors);
            }

            workflowState.status = searchResult.status === 'completed' ? 'completed' : 'error';

            workflowState.logs!.push({
                timestamp: Date.now(),
                message: "Google search auto-apply workflow completed",
                type: workflowState.status === 'completed' ? "success" : "error"
            });

            // Cleanup
            await this.googleJobSearch.close();

            return workflowState;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error("Google search workflow error:", error);

            try {
                await this.googleJobSearch.close();
            } catch (cleanupError) {
                console.error("Error during cleanup:", cleanupError);
            }

            return {
                ...workflowState,
                status: 'error',
                errors: [...(workflowState.errors || []), `Google search workflow failed: ${errorMessage}`],
                logs: [...(workflowState.logs || []), {
                    timestamp: Date.now(),
                    message: `Google search workflow failed: ${errorMessage}`,
                    type: "error"
                }]
            };
        }
    }

    async run(initialState: Partial<AutoApplyWorkflowState>): Promise<AutoApplyWorkflowState> {
        // If useGoogleSearch is enabled, use the Google search workflow
        if (initialState.useGoogleSearch) {
            return this.runGoogleSearchWorkflow(initialState);
        }

        const state: AutoApplyWorkflowState = {
            status: 'idle',
            errors: [],
            logs: [],
            ...initialState
        };

        try {
            // Step 1: Parse resume if provided
            if (state.resumeFile) {
                state.logs!.push({
                    timestamp: Date.now(),
                    message: "Starting resume parsing",
                    type: "info"
                });

                const parseResult = await this.resumeParser.process({
                    resumeFile: state.resumeFile,
                    errors: state.errors
                });

                state.profile = parseResult.parsedProfile;
                state.errors = parseResult.errors;
                state.logs = state.logs!.concat(parseResult.errors?.map(e => ({
                    timestamp: Date.now(),
                    message: e,
                    type: "error" as const
                })) || []);
            }

            // Create dummy profile for demo mode if no profile exists
            if (!state.profile && !process.env.API_KEY) {
                state.profile = {
                    name: "Demo User",
                    email: "demo@example.com",
                    phone: "+1-555-0123",
                    title: "Software Engineer",
                    experience: "3-5 years",
                    skills: ["JavaScript", "React", "Node.js", "Python", "TypeScript"],
                    resumeText: "Experienced software engineer with 4 years of experience in full-stack development...",
                    preferences: {
                        remote: true,
                        minSalary: 80000
                    }
                };
                state.logs!.push({
                    timestamp: Date.now(),
                    message: "Using demo profile for testing",
                    type: "info"
                });
            }

            // Step 2: Orchestrate applications
            if (state.jobs && state.jobs.length > 0) {
                state.logs!.push({
                    timestamp: Date.now(),
                    message: "Starting application orchestration",
                    type: "info"
                });

                const orchestrateResult = await this.orchestrator.process({
                    profile: state.profile,
                    jobs: state.jobs,
                    maxApplications: state.maxApplications,
                    status: state.status,
                    errors: state.errors,
                    logs: state.logs
                });

                state.jobs = orchestrateResult.jobs;
                state.applications = orchestrateResult.applications;
                state.currentJobIndex = orchestrateResult.currentJobIndex;
                state.status = orchestrateResult.status;
                state.errors = orchestrateResult.errors;
                state.logs = orchestrateResult.logs;
            }

            // Step 3: Process each application (now with actual submission)
            if (state.applications && state.applications.length > 0 && state.profile) {
                for (const application of state.applications) {
                    const job = state.jobs?.find(j => j.id === application.jobId);
                    if (!job) continue;

                    state.logs!.push({
                        timestamp: Date.now(),
                        message: `Processing application for ${job.title} at ${job.company}`,
                        type: "info"
                    });

                    // Analyze job fit
                    const analysisResult = await this.jobAnalyzer.process({
                        profile: state.profile,
                        job: job,
                        errors: state.errors
                    });

                    application.matchScore = analysisResult.matchScore || 0;
                    application.matchReason = analysisResult.matchReason;
                    state.skillGap = analysisResult.skillGap;
                    state.errors = analysisResult.errors;

                    // Generate cover letter
                    const coverLetterResult = await this.coverLetterAgent.process({
                        profile: state.profile,
                        job: job,
                        errors: state.errors
                    });

                    application.coverLetter = coverLetterResult.coverLetter;
                    state.errors = coverLetterResult.errors;

                    // Submit application online using web automation
                    state.logs!.push({
                        timestamp: Date.now(),
                        message: `Submitting application online for ${job.title}`,
                        type: "info"
                    });

                    const automationResult = await this.webAutomation.process({
                        application,
                        profile: state.profile,
                        job,
                        status: 'processing',
                        errors: state.errors,
                        logs: state.logs
                    });

                    // Update application status based on automation result
                    application.status = automationResult.application?.status || 'FAILED';
                    state.errors = automationResult.errors;
                    state.logs = automationResult.logs;

                    state.logs!.push({
                        timestamp: Date.now(),
                        message: `Completed processing for ${job.title} - Status: ${application.status}`,
                        type: application.status === 'SUBMITTED' ? "success" : "warning"
                    });
                }
            }

            state.status = 'completed';
            state.logs!.push({
                timestamp: Date.now(),
                message: "Auto-apply workflow completed successfully",
                type: "success"
            });

            // Cleanup web automation resources
            await this.webAutomation.close();

            return state;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error("Workflow execution error:", error);

            // Cleanup web automation resources even on error
            try {
                await this.webAutomation.close();
            } catch (cleanupError) {
                console.error("Error during cleanup:", cleanupError);
            }

            return {
                ...state,
                status: 'error',
                errors: [...(state.errors || []), `Workflow failed: ${errorMessage}`],
                logs: [...(state.logs || []), {
                    timestamp: Date.now(),
                    message: `Workflow execution failed: ${errorMessage}`,
                    type: "error"
                }]
            };
        }
    }

    // Method to get workflow status
    getStatus(): string {
        return "AutoApply Workflow: Multi-agent orchestration for job applications";
    }
}