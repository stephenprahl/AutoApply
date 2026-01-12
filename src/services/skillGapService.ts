import { GoogleGenAI, Type } from "@google/genai";
import type { UserProfile, Job, SkillGap } from '../types.ts';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY || '' });

export const analyzeSkillGap = async (
  profile: UserProfile,
  targetJobs?: Job[]
): Promise<SkillGap> => {
  if (!import.meta.env.VITE_API_KEY) {
    return getDemoSkillGap(profile);
  }

  try {
    const jobContext = targetJobs 
      ? targetJobs.map(job => `${job.title} at ${job.company}: ${job.tags.join(', ')}`).join('\n')
      : 'Senior Frontend Engineer, Full Stack Developer roles in tech industry';

    const prompt = `
      Analyze the skill gap between this candidate's profile and target job requirements.
      
      Candidate Profile:
      - Title: ${profile.title}
      - Experience: ${profile.experience} years
      - Current Skills: ${profile.skills.join(', ')}
      - Resume: ${profile.resumeText.slice(0, 1000)}...
      
      Target Job Context:
      ${jobContext}
      
      Return a JSON object with:
      - missing: array of skills the candidate needs to learn (max 5)
      - strong: array of skills the candidate already has that are in high demand (max 5)
      - recommended: array of skills to learn next for best ROI (max 3)
      - analysis: string explaining the skill gap analysis (2-3 sentences)
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            missing: { type: Type.ARRAY, items: { type: Type.STRING } },
            strong: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommended: { type: Type.ARRAY, items: { type: Type.STRING } },
            analysis: { type: Type.STRING },
          },
          required: ['missing', 'strong', 'recommended', 'analysis'],
        },
      },
    });

    const result = JSON.parse(response.text || '{}');
    return result as SkillGap;
  } catch (error) {
    console.error("Error analyzing skill gap:", error);
    return getDemoSkillGap(profile);
  }
};

const getDemoSkillGap = (profile: UserProfile): SkillGap => {
  const commonMissing = ['Docker', 'Kubernetes', 'AWS', 'GraphQL', 'TypeScript'];
  const commonStrong = ['JavaScript', 'React', 'CSS', 'HTML', 'Git'];
  const commonRecommended = ['TypeScript', 'Docker', 'AWS'];
  
  return {
    missing: commonMissing.filter(skill => !profile.skills.includes(skill)),
    strong: commonStrong.filter(skill => profile.skills.includes(skill)),
    recommended: commonRecommended,
    analysis: "Your profile shows strong frontend fundamentals. Consider learning cloud technologies and TypeScript to increase marketability."
  };
};

export const getMarketTrends = async (): Promise<string[]> => {
  if (!import.meta.env.VITE_API_KEY) {
    return [
      'AI/ML integration in web development',
      'Cloud-native application development',
      'Microservices architecture',
      'Progressive Web Apps (PWA)',
      'Serverless computing'
    ];
  }

  try {
    const prompt = `
      List the top 5 current technology trends for software developers in 2024.
      Return as a JSON array of strings.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      },
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Error getting market trends:", error);
    return [];
  }
};
