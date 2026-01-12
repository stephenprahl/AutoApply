import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOllama } from "@langchain/ollama";
import type { UserProfile } from "../../src/types.js";
import { parseResumeFile } from "../services/resumeParser.js";

export interface ResumeParserAgentState {
    resumeFile?: File;
    parsedProfile?: UserProfile;
    errors?: string[];
}

export class ResumeParserAgent {
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

    async parseResume(file: File): Promise<UserProfile> {
        try {
            // Use existing resume parser service
            const parsedData = await parseResumeFile(file);

            // If no LLM available, return basic parsed data
            if (!this.llm) {
                return {
                    name: "Candidate",
                    title: "Professional",
                    experience: "0-2 years",
                    skills: parsedData.skills || [],
                    resumeText: parsedData.text,
                    preferences: {
                        remote: false,
                        minSalary: 50000
                    }
                };
            }

            // Enhance with LLM for better extraction
            const enhancementPrompt = `
        Analyze this parsed resume data and enhance it with better categorization and insights:

        Raw Resume Text:
        ${parsedData.text}

        Extracted Skills: ${parsedData.skills.join(', ')}

        Please provide:
        1. A professional title/summary (2-3 sentences)
        2. Enhanced skills list (top 8-10 most relevant)
        3. Years of experience estimate
        4. Key achievements or highlights

        Return as JSON with: title, skills (array), experience, summary, achievements (array)
      `;

            const messages = [
                new SystemMessage("You are an expert resume analyzer. Extract and enhance professional information from resumes."),
                new HumanMessage(enhancementPrompt)
            ];

            const response = await this.llm.invoke(messages);
            const enhancedData = JSON.parse(response.content as string);

            return {
                name: "Candidate", // Placeholder - would need to extract from resume
                title: enhancedData.title || "Professional",
                experience: enhancedData.experience || "0-2 years",
                skills: enhancedData.skills || parsedData.skills || [],
                resumeText: parsedData.text,
                preferences: {
                    remote: false,
                    minSalary: 50000
                }
            };
        } catch (error) {
            console.error("Resume parsing error:", error);
            throw new Error("Failed to parse resume");
        }
    }

    async process(state: ResumeParserAgentState): Promise<ResumeParserAgentState> {
        if (!state.resumeFile) {
            return {
                ...state,
                errors: [...(state.errors || []), "No resume file provided"]
            };
        }

        try {
            const parsedProfile = await this.parseResume(state.resumeFile);
            return {
                ...state,
                parsedProfile,
                errors: state.errors?.filter(e => e !== "No resume file provided")
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                ...state,
                errors: [...(state.errors || []), `Resume parsing failed: ${errorMessage}`]
            };
        }
    }
}