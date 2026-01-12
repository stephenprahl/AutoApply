import type { Browser, BrowserContext, Page } from 'playwright';
import { chromium } from 'playwright';
import type { ApplicationRecord, Job, UserProfile } from '../../types.js';

export interface WebAutomationState {
    application?: ApplicationRecord;
    profile?: UserProfile;
    job?: Job;
    status?: 'idle' | 'processing' | 'completed' | 'error';
    errors?: string[];
    logs?: Array<{
        timestamp: number;
        message: string;
        type: 'info' | 'success' | 'warning' | 'error';
    }>;
}

export class WebAutomationAgent {
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;
    private demoMode: boolean = true; // Set to false for actual web automation

    constructor(demoMode: boolean = true) {
        this.demoMode = demoMode;
    }

    private async initBrowser(): Promise<void> {
        if (!this.browser) {
            this.browser = await chromium.launch({
                headless: false, // Set to true for production
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process', // <- this one doesn't work in Windows
                    '--disable-gpu'
                ]
            });
            this.context = await this.browser.newContext({
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            });
        }
    }

    private log(state: WebAutomationState, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): WebAutomationState {
        const logEntry = {
            timestamp: Date.now(),
            message,
            type
        };

        return {
            ...state,
            logs: [...(state.logs || []), logEntry]
        };
    }

    private async fillLinkedInApplication(page: Page, profile: UserProfile, job: Job): Promise<boolean> {
        try {
            // Navigate to LinkedIn job application page
            await page.goto(job.applicationUrl || `https://www.linkedin.com/jobs/view/${job.id}`, { waitUntil: 'networkidle' });

            // Wait for apply button and click it
            const applyButton = page.locator('button:has-text("Apply")').or(page.locator('button:has-text("Easy Apply")'));
            await applyButton.waitFor({ timeout: 10000 });
            await applyButton.click();

            // Wait for application form to load
            await page.waitForTimeout(2000);

            // Fill out basic information
            if (profile.name) {
                const nameField = page.locator('input[name*="name"]').or(page.locator('input[placeholder*="name"]'));
                if (await nameField.count() > 0) {
                    await nameField.first().fill(profile.name);
                }
            }

            if (profile.email) {
                const emailField = page.locator('input[type="email"]').or(page.locator('input[name*="email"]'));
                if (await emailField.count() > 0) {
                    await emailField.first().fill(profile.email);
                }
            }

            if (profile.phone) {
                const phoneField = page.locator('input[type="tel"]').or(page.locator('input[name*="phone"]'));
                if (await phoneField.count() > 0) {
                    await phoneField.first().fill(profile.phone);
                }
            }

            // Handle file upload for resume if required
            const resumeUpload = page.locator('input[type="file"]').or(page.locator('input[accept*="pdf"]'));
            if (await resumeUpload.count() > 0) {
                // In a real implementation, you'd upload the resume file
                // For now, we'll skip this step
            }

            // Fill additional questions if they appear
            await this.fillAdditionalQuestions(page, profile, job);

            // Submit the application
            const submitButton = page.locator('button:has-text("Submit application")').or(page.locator('button:has-text("Apply")'));
            if (await submitButton.count() > 0) {
                await submitButton.click();
                await page.waitForTimeout(2000);
                return true;
            }

            return false;
        } catch (error) {
            console.error('LinkedIn application error:', error);
            return false;
        }
    }

    private async fillIndeedApplication(page: Page, profile: UserProfile, job: Job): Promise<boolean> {
        try {
            // Navigate to Indeed job application
            await page.goto(job.applicationUrl || `https://www.indeed.com/viewjob?jk=${job.id}`, { waitUntil: 'networkidle' });

            // Click apply button
            const applyButton = page.locator('button:has-text("Apply Now")').or(page.locator('a:has-text("Apply Now")'));
            await applyButton.waitFor({ timeout: 10000 });
            await applyButton.click();

            // Wait for application form
            await page.waitForTimeout(3000);

            // Fill out form fields
            if (profile.name) {
                const nameField = page.locator('input[name*="name"]').or(page.locator('input[id*="name"]'));
                if (await nameField.count() > 0) {
                    await nameField.first().fill(profile.name);
                }
            }

            if (profile.email) {
                const emailField = page.locator('input[type="email"]');
                if (await emailField.count() > 0) {
                    await emailField.first().fill(profile.email);
                }
            }

            if (profile.phone) {
                const phoneField = page.locator('input[type="tel"]');
                if (await phoneField.count() > 0) {
                    await phoneField.first().fill(profile.phone);
                }
            }

            // Handle resume upload
            const resumeUpload = page.locator('input[type="file"]');
            if (await resumeUpload.count() > 0) {
                // Upload resume logic would go here
            }

            // Fill additional questions
            await this.fillAdditionalQuestions(page, profile, job);

            // Submit application
            const submitButton = page.locator('button:has-text("Submit")').or(page.locator('input[type="submit"]'));
            if (await submitButton.count() > 0) {
                await submitButton.click();
                await page.waitForTimeout(2000);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Indeed application error:', error);
            return false;
        }
    }

    private async fillCompanyApplication(page: Page, profile: UserProfile, job: Job): Promise<boolean> {
        try {
            // Navigate to company career page
            await page.goto(job.applicationUrl!, { waitUntil: 'networkidle' });

            // Wait for page to load
            await page.waitForTimeout(2000);

            // Look for application form or apply button
            const applyButton = page.locator('button:has-text("Apply")').or(page.locator('a:has-text("Apply")'))
                .or(page.locator('button:has-text("Join")')).or(page.locator('a:has-text("Join")'));

            if (await applyButton.count() > 0) {
                await applyButton.first().click();
                await page.waitForTimeout(2000);
            }

            // Fill out common form fields
            const formFields = {
                'input[name*="name"]': profile.name,
                'input[name*="email"]': profile.email,
                'input[name*="phone"]': profile.phone,
                'textarea[name*="experience"]': profile.experience ? `${profile.experience} years` : '',
                'textarea[name*="skills"]': profile.skills?.join(', '),
            };

            for (const [selector, value] of Object.entries(formFields)) {
                if (value) {
                    const field = page.locator(selector);
                    if (await field.count() > 0) {
                        await field.first().fill(value);
                    }
                }
            }

            // Handle file uploads
            const fileInputs = page.locator('input[type="file"]');
            if (await fileInputs.count() > 0) {
                // Resume upload logic would go here
            }

            // Fill additional questions
            await this.fillAdditionalQuestions(page, profile, job);

            // Submit form
            const submitButton = page.locator('button[type="submit"]').or(page.locator('input[type="submit"]'))
                .or(page.locator('button:has-text("Submit")')).or(page.locator('button:has-text("Apply")'));

            if (await submitButton.count() > 0) {
                await submitButton.click();
                await page.waitForTimeout(3000);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Company application error:', error);
            return false;
        }
    }

    private async fillAdditionalQuestions(page: Page, profile: UserProfile, job: Job): Promise<void> {
        // Handle common additional questions that might appear
        const questions = [
            {
                patterns: ['Why do you want to work here', 'Why this company', 'Why us'],
                answer: `I am excited about ${job.company} because of its innovative work in the industry and the opportunity to contribute my skills in ${profile.skills?.slice(0, 3).join(', ')} to meaningful projects.`
            },
            {
                patterns: ['experience', 'background', 'previous role'],
                answer: `I have ${profile.experience || 'several years'} of experience in ${profile.title || 'software development'}, with expertise in ${profile.skills?.join(', ')}.`
            },
            {
                patterns: ['salary', 'compensation', 'expectations'],
                answer: 'I am open to discussing competitive compensation based on the role requirements and my experience level.'
            },
            {
                patterns: ['availability', 'start date', 'when can you start'],
                answer: 'I am available to start within 2-4 weeks, depending on the notice period required by my current employer.'
            }
        ];

        for (const question of questions) {
            const textareas = page.locator('textarea');
            const count = await textareas.count();

            for (let i = 0; i < count; i++) {
                const textarea = textareas.nth(i);
                const placeholder = await textarea.getAttribute('placeholder') || '';
                const label = await textarea.locator('..').locator('label').textContent() || '';

                const matches = question.patterns.some(pattern =>
                    placeholder.toLowerCase().includes(pattern.toLowerCase()) ||
                    label.toLowerCase().includes(pattern.toLowerCase())
                );

                if (matches && !(await textarea.inputValue())) {
                    await textarea.fill(question.answer);
                }
            }
        }
    }

    private determinePlatform(url: string): 'linkedin' | 'indeed' | 'company' {
        if (url.includes('linkedin.com')) return 'linkedin';
        if (url.includes('indeed.com')) return 'indeed';
        return 'company';
    }

    async submitApplication(state: WebAutomationState): Promise<WebAutomationState> {
        let currentState: WebAutomationState = { ...state, status: 'processing' };

        try {
            if (!state.application || !state.profile || !state.job) {
                return this.log({ ...currentState, status: 'error' }, "Application, profile, and job data required", "error");
            }

            if (!state.job.applicationUrl) {
                return this.log({
                    ...currentState,
                    application: {
                        ...state.application,
                        status: 'FAILED'
                    },
                    status: 'error'
                }, `No application URL provided for ${state.job.title}`, "error");
            }

            currentState = this.log(currentState, `Starting web automation for ${state.job.title} at ${state.job.company}`);

            // Demo mode: simulate successful application submission
            if (this.demoMode) {
                currentState = this.log(currentState, `Demo mode: Simulating application submission to ${state.job.applicationUrl}`, "info");

                // Simulate processing time
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Simulate success (90% success rate for demo)
                const success = Math.random() > 0.1;

                if (success) {
                    currentState = {
                        ...currentState,
                        application: {
                            ...state.application,
                            status: 'SUBMITTED'
                        },
                        status: 'completed'
                    };
                    currentState = this.log(currentState, `Demo: Successfully submitted application for ${state.job.title}`, "success");
                } else {
                    currentState = {
                        ...currentState,
                        application: {
                            ...state.application,
                            status: 'FAILED'
                        },
                        status: 'error'
                    };
                    currentState = this.log(currentState, `Demo: Failed to submit application for ${state.job.title} (simulated failure)`, "error");
                }

                return currentState;
            }

            // Real web automation logic continues below...
            await this.initBrowser();
            if (!this.context) {
                throw new Error('Failed to initialize browser context');
            }

            const page = await this.context.newPage();

            try {
                const platform = this.determinePlatform(state.job.applicationUrl);
                let success = false;

                currentState = this.log(currentState, `Detected platform: ${platform}`);

                switch (platform) {
                    case 'linkedin':
                        success = await this.fillLinkedInApplication(page, state.profile, state.job);
                        break;
                    case 'indeed':
                        success = await this.fillIndeedApplication(page, state.profile, state.job);
                        break;
                    case 'company':
                        success = await this.fillCompanyApplication(page, state.profile, state.job);
                        break;
                }

                if (success) {
                    currentState = {
                        ...currentState,
                        application: {
                            ...state.application,
                            status: 'SUBMITTED'
                        },
                        status: 'completed'
                    };
                    currentState = this.log(currentState, `Successfully submitted application for ${state.job.title}`, "success");
                } else {
                    currentState = {
                        ...currentState,
                        application: {
                            ...state.application,
                            status: 'FAILED'
                        },
                        status: 'error'
                    };
                    currentState = this.log(currentState, `Failed to submit application for ${state.job.title}`, "error");
                }

            } finally {
                await page.close();
            }

            return currentState;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            currentState = { ...currentState, status: 'error' };
            return this.log(currentState, `Web automation failed: ${errorMessage}`, "error");
        }
    }

    async process(state: WebAutomationState): Promise<WebAutomationState> {
        return this.submitApplication(state);
    }

    async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.context = null;
        }
    }
}