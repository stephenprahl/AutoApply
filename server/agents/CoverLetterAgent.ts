import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOllama } from "@langchain/ollama";
import type { Job, UserProfile } from "../../src/types.js";

export interface CoverLetterAgentState {
    profile?: UserProfile;
    job?: Job;
    coverLetter?: string;
    errors?: string[];
}

export class CoverLetterAgent {
    private llm: ChatOllama | null;

    constructor(apiKey?: string) {
        const key = apiKey || process.env.API_KEY;
        if (!key) {
            this.llm = null as any; // Demo mode
        } else {
            this.llm = new ChatOllama({
                model: "gpt-oss:120b-cloud",
                baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
            });
        }
    }

    async generateCoverLetter(profile: UserProfile, job: Job): Promise<string> {
        // Demo mode fallback
        if (!this.llm) {
            return `Dear Hiring Manager,

I am writing to express my interest in the ${job.title} position at ${job.company}. With my background in ${profile.skills.slice(0, 3).join(', ')}, I am excited about the opportunity to contribute to your team.

My experience as a ${profile.title} has equipped me with the skills needed to excel in this role. I am particularly drawn to ${job.company} because of its innovative approach to ${job.tags[0] || 'technology'}.

I would welcome the opportunity to discuss how my background and skills align with the needs of your team.

Best regards,
${profile.name}`;
        }

        const coverLetterPrompt = `
      Write a compelling, professional cover letter for this candidate applying to this position.

      CANDIDATE INFORMATION:
      - Name: ${profile.name}
      - Current Title: ${profile.title}
      - Experience: ${profile.experience} years
      - Key Skills: ${profile.skills.slice(0, 8).join(', ')}
      - Professional Summary: ${profile.resumeText.slice(0, 800)}...

      JOB DETAILS:
      - Position: ${job.title}
      - Company: ${job.company}
      - Location: ${job.location}
      - Job Description: ${job.description}
      - Required Skills: ${job.tags.join(', ')}

      COVER LETTER REQUIREMENTS:
      1. Professional and enthusiastic tone
      2. Highlight 2-3 most relevant skills/experiences
      3. Connect candidate's background to job requirements
      4. Keep under 250 words
      5. Include a strong opening and closing
      6. Use the candidate's name and customize for the specific company/role

      Format as a complete cover letter with proper salutation and sign-off.
    `;

        const messages = [
            new SystemMessage("You are a professional career counselor specializing in crafting compelling cover letters for tech professionals."),
            new HumanMessage(coverLetterPrompt)
        ];

        const response = await this.llm.invoke(messages);
        return response.content as string;
    }

    async process(state: CoverLetterAgentState): Promise<CoverLetterAgentState> {
        if (!state.profile || !state.job) {
            return {
                ...state,
                errors: [...(state.errors || []), "Profile and job data required for cover letter generation"]
            };
        }

        try {
            const coverLetter = await this.generateCoverLetter(state.profile, state.job);
            return {
                ...state,
                coverLetter,
                errors: state.errors?.filter(e => e !== "Profile and job data required for cover letter generation")
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                ...state,
                errors: [...(state.errors || []), `Cover letter generation failed: ${errorMessage}`]
            };
        }
    }
}