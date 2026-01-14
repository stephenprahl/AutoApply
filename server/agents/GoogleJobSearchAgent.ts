import type { Browser, BrowserContext, Page } from 'playwright';
import { chromium } from 'playwright';
import type { ApplicationRecord, Job, UserProfile } from '../../src/types.js';

export interface GoogleJobSearchState {
    profile?: UserProfile;
    searchQuery?: string;
    foundJobs?: Job[];
    applications?: ApplicationRecord[];
    status?: 'idle' | 'searching' | 'processing' | 'applying' | 'completed' | 'error';
    errors?: string[];
    logs?: Array<{
        timestamp: number;
        message: string;
        type: 'info' | 'success' | 'warning' | 'error';
    }>;
}

export interface ApplicationResult {
    jobId: string;
    company: string;
    jobTitle: string;
    success: boolean;
    message: string;
    applicationUrl?: string;
}

export class GoogleJobSearchAgent {
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;
    private demoMode: boolean;

    constructor(demoMode: boolean = true) {
        this.demoMode = demoMode;
    }

    private async initBrowser(): Promise<void> {
        if (!this.browser) {
            this.browser = await chromium.launch({
                headless: false, // Keep visible so user can see the automation
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                    '--window-size=1920,1080'
                ]
            });
            this.context = await this.browser.newContext({
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                viewport: { width: 1920, height: 1080 }
            });
        }
    }

    private log(state: GoogleJobSearchState, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): GoogleJobSearchState {
        const logEntry = {
            timestamp: Date.now(),
            message,
            type
        };
        console.log(`[${type.toUpperCase()}] ${message}`);

        return {
            ...state,
            logs: [...(state.logs || []), logEntry]
        };
    }

    /**
     * Extract keywords from user profile for job matching
     */
    private extractKeywordsFromProfile(profile: UserProfile): string[] {
        const keywords: string[] = [];

        // Add skills
        if (profile.skills) {
            keywords.push(...profile.skills);
        }

        // Add job title keywords
        if (profile.title) {
            keywords.push(...profile.title.split(/\s+/));
        }

        // Add work experience keywords
        if (profile.workExperience) {
            for (const exp of profile.workExperience) {
                keywords.push(...exp.position.split(/\s+/));
                keywords.push(exp.company);
            }
        }

        // Clean and dedupe keywords
        return [...new Set(keywords.map(k => k.toLowerCase().trim()).filter(k => k.length > 2))];
    }

    /**
     * Generate search query based on profile
     */
    private generateSearchQuery(profile: UserProfile): string {
        const baseQuery = 'hiring jobs';
        const titleKeywords = profile.title ? profile.title.split(/\s+/).slice(0, 2).join(' ') : '';
        const topSkills = profile.skills?.slice(0, 3).join(' OR ') || '';

        // Build comprehensive search query
        let query = `${baseQuery} ${titleKeywords}`;
        if (topSkills) {
            query += ` ${topSkills}`;
        }
        if (profile.preferences?.remote) {
            query += ' remote';
        }

        return query.trim();
    }

    /**
     * Navigate to Google and perform job search
     */
    async searchGoogleForJobs(page: Page, searchQuery: string): Promise<string[]> {
        const jobUrls: string[] = [];

        try {
            // Navigate to Google
            await page.goto('https://www.google.com', { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            // Accept cookies if prompted
            const acceptButton = page.locator('button:has-text("Accept all")').or(page.locator('button:has-text("I agree")'));
            if (await acceptButton.count() > 0) {
                await acceptButton.first().click();
                await page.waitForTimeout(500);
            }

            // Find and click on the search bar
            const searchInput = page.locator('textarea[name="q"]').or(page.locator('input[name="q"]'));
            await searchInput.waitFor({ timeout: 10000 });
            await searchInput.click();
            await page.waitForTimeout(300);

            // Type the search query
            await searchInput.fill(searchQuery);
            await page.waitForTimeout(500);

            // Press Enter to search
            await page.keyboard.press('Enter');
            await page.waitForNavigation({ waitUntil: 'networkidle' });
            await page.waitForTimeout(2000);

            // Collect search result URLs
            const searchResults = page.locator('div.g a[href]').or(page.locator('a[data-ved]'));
            const count = await searchResults.count();

            for (let i = 0; i < Math.min(count, 20); i++) {
                const result = searchResults.nth(i);
                const href = await result.getAttribute('href');
                if (href && href.startsWith('http') && !href.includes('google.com') && !href.includes('youtube.com')) {
                    jobUrls.push(href);
                }
            }

            return [...new Set(jobUrls)]; // Remove duplicates
        } catch (error) {
            console.error('Error searching Google:', error);
            return jobUrls;
        }
    }

    /**
     * Check if a URL matches resume keywords
     */
    async checkUrlForKeywordMatch(page: Page, url: string, keywords: string[]): Promise<{ matches: boolean; matchedKeywords: string[]; pageText: string }> {
        try {
            await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
            await page.waitForTimeout(1500);

            // Get page content
            const pageText = await page.evaluate(() => {
                return document.body.innerText.toLowerCase();
            });

            // Check for keyword matches
            const matchedKeywords: string[] = [];
            for (const keyword of keywords) {
                if (pageText.includes(keyword.toLowerCase())) {
                    matchedKeywords.push(keyword);
                }
            }

            // Consider a match if at least 2 keywords match or 30% of keywords
            const threshold = Math.max(2, Math.floor(keywords.length * 0.3));
            const matches = matchedKeywords.length >= threshold;

            return { matches, matchedKeywords, pageText };
        } catch (error) {
            console.error(`Error checking URL ${url}:`, error);
            return { matches: false, matchedKeywords: [], pageText: '' };
        }
    }

    /**
     * Navigate to company careers page from any page
     */
    async navigateToCareersPage(page: Page): Promise<string | null> {
        try {
            // Get current domain
            const currentUrl = page.url();
            const domain = new URL(currentUrl).origin;

            // Common careers page link patterns
            const careersLinkPatterns = [
                /careers/i,
                /jobs/i,
                /join\s*(us|our\s*team)?/i,
                /work\s*(with|for)\s*us/i,
                /opportunities/i,
                /hiring/i,
                /we['']?re\s*hiring/i,
                /open\s*positions/i,
                /employment/i
            ];

            // Try to find careers link on current page
            const allLinks = page.locator('a');
            const linkCount = await allLinks.count();

            for (let i = 0; i < linkCount; i++) {
                const link = allLinks.nth(i);
                const text = await link.textContent() || '';
                const href = await link.getAttribute('href') || '';

                for (const pattern of careersLinkPatterns) {
                    if (pattern.test(text) || pattern.test(href)) {
                        const fullUrl = href.startsWith('http') ? href : `${domain}${href.startsWith('/') ? '' : '/'}${href}`;
                        await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 15000 });
                        await page.waitForTimeout(1500);
                        return page.url();
                    }
                }
            }

            // Try common careers URL patterns directly
            const commonPaths = ['/careers', '/jobs', '/careers/', '/jobs/', '/join-us', '/work-with-us', '/company/careers', '/about/careers'];
            for (const path of commonPaths) {
                try {
                    const careersUrl = `${domain}${path}`;
                    const response = await page.goto(careersUrl, { waitUntil: 'networkidle', timeout: 10000 });
                    if (response?.ok()) {
                        const pageText = await page.evaluate(() => document.body.innerText.toLowerCase());
                        if (pageText.includes('career') || pageText.includes('job') || pageText.includes('position') || pageText.includes('apply')) {
                            return page.url();
                        }
                    }
                } catch (e) {
                    // Continue trying other paths
                }
            }

            return null;
        } catch (error) {
            console.error('Error navigating to careers page:', error);
            return null;
        }
    }

    /**
     * Find and click on a specific job or apply button
     */
    async findAndClickApplyButton(page: Page): Promise<boolean> {
        try {
            // Common apply button patterns
            const applyButtonPatterns = [
                'button:has-text("Apply")',
                'a:has-text("Apply")',
                'button:has-text("Apply Now")',
                'a:has-text("Apply Now")',
                'button:has-text("Apply for this job")',
                'a:has-text("Apply for this job")',
                'button:has-text("Submit Application")',
                'a:has-text("Submit Application")',
                'button:has-text("Start Application")',
                'a:has-text("Start Application")',
                '[class*="apply"]',
                '[id*="apply"]',
                'button:has-text("Apply for position")',
                'a:has-text("Apply for position")'
            ];

            for (const pattern of applyButtonPatterns) {
                const button = page.locator(pattern).first();
                if (await button.isVisible({ timeout: 2000 }).catch(() => false)) {
                    await button.click();
                    await page.waitForTimeout(2000);
                    return true;
                }
            }

            return false;
        } catch (error) {
            console.error('Error finding apply button:', error);
            return false;
        }
    }

    /**
     * Fill out all form fields on the current page
     */
    async fillApplicationForm(page: Page, profile: UserProfile): Promise<{ filled: boolean; fieldsCompleted: number }> {
        let fieldsCompleted = 0;

        try {
            // Wait for form elements to load
            await page.waitForTimeout(1000);

            // === TEXT INPUT FIELDS ===

            // Name fields
            const nameSelectors = [
                'input[name*="name" i]',
                'input[id*="name" i]',
                'input[placeholder*="name" i]',
                'input[aria-label*="name" i]',
                'input[name*="full_name" i]',
                'input[name*="fullname" i]'
            ];
            for (const selector of nameSelectors) {
                const field = page.locator(selector).first();
                if (await field.isVisible({ timeout: 1000 }).catch(() => false)) {
                    const currentValue = await field.inputValue();
                    if (!currentValue && profile.name) {
                        await field.fill(profile.name);
                        fieldsCompleted++;
                    }
                }
            }

            // First name
            const firstNameSelectors = ['input[name*="first" i]', 'input[id*="first" i]', 'input[placeholder*="first" i]'];
            for (const selector of firstNameSelectors) {
                const field = page.locator(selector).first();
                if (await field.isVisible({ timeout: 1000 }).catch(() => false)) {
                    const currentValue = await field.inputValue();
                    if (!currentValue && profile.name) {
                        const firstName = profile.name.split(' ')[0];
                        await field.fill(firstName);
                        fieldsCompleted++;
                    }
                }
            }

            // Last name
            const lastNameSelectors = ['input[name*="last" i]', 'input[id*="last" i]', 'input[placeholder*="last" i]'];
            for (const selector of lastNameSelectors) {
                const field = page.locator(selector).first();
                if (await field.isVisible({ timeout: 1000 }).catch(() => false)) {
                    const currentValue = await field.inputValue();
                    if (!currentValue && profile.name) {
                        const nameParts = profile.name.split(' ');
                        const lastName = nameParts.slice(1).join(' ') || nameParts[0];
                        await field.fill(lastName);
                        fieldsCompleted++;
                    }
                }
            }

            // Email fields
            const emailSelectors = [
                'input[type="email"]',
                'input[name*="email" i]',
                'input[id*="email" i]',
                'input[placeholder*="email" i]'
            ];
            for (const selector of emailSelectors) {
                const field = page.locator(selector).first();
                if (await field.isVisible({ timeout: 1000 }).catch(() => false)) {
                    const currentValue = await field.inputValue();
                    if (!currentValue && profile.email) {
                        await field.fill(profile.email);
                        fieldsCompleted++;
                    }
                }
            }

            // Phone fields
            const phoneSelectors = [
                'input[type="tel"]',
                'input[name*="phone" i]',
                'input[id*="phone" i]',
                'input[placeholder*="phone" i]',
                'input[name*="mobile" i]'
            ];
            for (const selector of phoneSelectors) {
                const field = page.locator(selector).first();
                if (await field.isVisible({ timeout: 1000 }).catch(() => false)) {
                    const currentValue = await field.inputValue();
                    if (!currentValue && profile.phone) {
                        await field.fill(profile.phone);
                        fieldsCompleted++;
                    }
                }
            }

            // Address/Location fields
            const locationSelectors = [
                'input[name*="city" i]',
                'input[name*="location" i]',
                'input[name*="address" i]',
                'input[placeholder*="city" i]',
                'input[placeholder*="location" i]'
            ];
            for (const selector of locationSelectors) {
                const field = page.locator(selector).first();
                if (await field.isVisible({ timeout: 1000 }).catch(() => false)) {
                    const currentValue = await field.inputValue();
                    if (!currentValue) {
                        await field.fill('Open to relocation');
                        fieldsCompleted++;
                    }
                }
            }

            // LinkedIn URL
            const linkedinSelectors = [
                'input[name*="linkedin" i]',
                'input[id*="linkedin" i]',
                'input[placeholder*="linkedin" i]'
            ];
            for (const selector of linkedinSelectors) {
                const field = page.locator(selector).first();
                if (await field.isVisible({ timeout: 1000 }).catch(() => false)) {
                    const currentValue = await field.inputValue();
                    if (!currentValue && profile.portfolio?.linkedin) {
                        await field.fill(profile.portfolio.linkedin);
                        fieldsCompleted++;
                    }
                }
            }

            // GitHub/Portfolio URL
            const portfolioSelectors = [
                'input[name*="github" i]',
                'input[name*="portfolio" i]',
                'input[name*="website" i]',
                'input[placeholder*="portfolio" i]',
                'input[placeholder*="website" i]'
            ];
            for (const selector of portfolioSelectors) {
                const field = page.locator(selector).first();
                if (await field.isVisible({ timeout: 1000 }).catch(() => false)) {
                    const currentValue = await field.inputValue();
                    if (!currentValue) {
                        const url = profile.portfolio?.github || profile.portfolio?.portfolio || profile.portfolio?.website;
                        if (url) {
                            await field.fill(url);
                            fieldsCompleted++;
                        }
                    }
                }
            }

            // Years of experience
            const experienceSelectors = [
                'input[name*="experience" i]',
                'input[name*="years" i]',
                'input[placeholder*="experience" i]'
            ];
            for (const selector of experienceSelectors) {
                const field = page.locator(selector).first();
                if (await field.isVisible({ timeout: 1000 }).catch(() => false)) {
                    const currentValue = await field.inputValue();
                    if (!currentValue && profile.experience) {
                        await field.fill(profile.experience);
                        fieldsCompleted++;
                    }
                }
            }

            // Salary expectation fields
            const salarySelectors = [
                'input[name*="salary" i]',
                'input[name*="compensation" i]',
                'input[placeholder*="salary" i]'
            ];
            for (const selector of salarySelectors) {
                const field = page.locator(selector).first();
                if (await field.isVisible({ timeout: 1000 }).catch(() => false)) {
                    const currentValue = await field.inputValue();
                    if (!currentValue && profile.preferences?.minSalary) {
                        await field.fill(profile.preferences.minSalary.toString());
                        fieldsCompleted++;
                    }
                }
            }

            // === TEXTAREA FIELDS ===

            // Cover letter / About me / Summary
            const textareaSelectors = [
                'textarea[name*="cover" i]',
                'textarea[name*="letter" i]',
                'textarea[name*="about" i]',
                'textarea[name*="summary" i]',
                'textarea[name*="message" i]',
                'textarea[name*="why" i]',
                'textarea[placeholder*="tell us" i]',
                'textarea[placeholder*="about yourself" i]'
            ];
            for (const selector of textareaSelectors) {
                const field = page.locator(selector).first();
                if (await field.isVisible({ timeout: 1000 }).catch(() => false)) {
                    const currentValue = await field.inputValue();
                    if (!currentValue) {
                        const coverLetter = this.generateCoverLetterText(profile);
                        await field.fill(coverLetter);
                        fieldsCompleted++;
                    }
                }
            }

            // Experience / Skills description
            const skillsSelectors = [
                'textarea[name*="skill" i]',
                'textarea[name*="experience" i]',
                'textarea[name*="qualification" i]'
            ];
            for (const selector of skillsSelectors) {
                const field = page.locator(selector).first();
                if (await field.isVisible({ timeout: 1000 }).catch(() => false)) {
                    const currentValue = await field.inputValue();
                    if (!currentValue) {
                        const skillsText = `Skills: ${profile.skills?.join(', ') || 'N/A'}\n\nExperience: ${profile.experience || 'N/A'} years as ${profile.title || 'professional'}`;
                        await field.fill(skillsText);
                        fieldsCompleted++;
                    }
                }
            }

            // === SELECT/DROPDOWN FIELDS ===
            await this.fillSelectFields(page, profile);

            // === CHECKBOX FIELDS ===
            await this.handleCheckboxes(page);

            // === FILE UPLOAD ===
            // Note: File upload requires actual file - skipping in automation
            // but marking any required resume fields
            const fileInputs = page.locator('input[type="file"]');
            const fileCount = await fileInputs.count();
            if (fileCount > 0) {
                console.log(`Found ${fileCount} file upload fields - manual upload may be required`);
            }

            return { filled: fieldsCompleted > 0, fieldsCompleted };
        } catch (error) {
            console.error('Error filling form:', error);
            return { filled: false, fieldsCompleted };
        }
    }

    /**
     * Handle dropdown/select fields
     */
    private async fillSelectFields(page: Page, profile: UserProfile): Promise<void> {
        try {
            const selects = page.locator('select');
            const count = await selects.count();

            for (let i = 0; i < count; i++) {
                const select = selects.nth(i);
                const name = await select.getAttribute('name') || '';
                const id = await select.getAttribute('id') || '';
                const identifier = (name + id).toLowerCase();

                // Get all options
                const options = await select.locator('option').allTextContents();

                // Try to select appropriate option based on field type
                if (identifier.includes('country')) {
                    await this.selectBestOption(select, options, ['united states', 'usa', 'us']);
                } else if (identifier.includes('state') || identifier.includes('region')) {
                    // Skip - too location specific
                } else if (identifier.includes('experience') || identifier.includes('years')) {
                    await this.selectBestOption(select, options, [profile.experience || '3', '3-5', '5+', 'mid']);
                } else if (identifier.includes('education') || identifier.includes('degree')) {
                    await this.selectBestOption(select, options, ['bachelor', 'master', 'graduate', 'college']);
                } else if (identifier.includes('source') || identifier.includes('hear')) {
                    await this.selectBestOption(select, options, ['google', 'search', 'job board', 'online', 'other']);
                } else if (identifier.includes('work') && identifier.includes('auth')) {
                    await this.selectBestOption(select, options, ['yes', 'authorized', 'citizen']);
                } else if (identifier.includes('remote') || identifier.includes('location')) {
                    if (profile.preferences?.remote) {
                        await this.selectBestOption(select, options, ['remote', 'yes', 'flexible']);
                    }
                }
            }
        } catch (error) {
            console.error('Error handling select fields:', error);
        }
    }

    /**
     * Select the best matching option from a dropdown
     */
    private async selectBestOption(select: any, options: string[], preferences: string[]): Promise<void> {
        try {
            for (const pref of preferences) {
                const matchingOption = options.find(opt =>
                    opt.toLowerCase().includes(pref.toLowerCase())
                );
                if (matchingOption) {
                    await select.selectOption({ label: matchingOption });
                    return;
                }
            }
            // If no preference matches, select the first non-empty option
            const firstValid = options.find(opt => opt.trim() && opt !== '--' && opt !== 'Select');
            if (firstValid) {
                await select.selectOption({ label: firstValid });
            }
        } catch (error) {
            // Silent fail for select options
        }
    }

    /**
     * Handle checkbox fields (terms, consent, etc.)
     */
    private async handleCheckboxes(page: Page): Promise<void> {
        try {
            // Check required checkboxes (terms, consent, etc.)
            const checkboxes = page.locator('input[type="checkbox"]');
            const count = await checkboxes.count();

            for (let i = 0; i < count; i++) {
                const checkbox = checkboxes.nth(i);
                const isRequired = await checkbox.getAttribute('required') !== null;
                const name = await checkbox.getAttribute('name') || '';
                const id = await checkbox.getAttribute('id') || '';
                const identifier = (name + id).toLowerCase();

                // Check terms, consent, and legal checkboxes
                const shouldCheck = isRequired ||
                    identifier.includes('agree') ||
                    identifier.includes('terms') ||
                    identifier.includes('consent') ||
                    identifier.includes('acknowledge') ||
                    identifier.includes('confirm') ||
                    identifier.includes('accept');

                if (shouldCheck && !(await checkbox.isChecked())) {
                    await checkbox.check();
                }
            }
        } catch (error) {
            console.error('Error handling checkboxes:', error);
        }
    }

    /**
     * Generate a brief cover letter text
     */
    private generateCoverLetterText(profile: UserProfile): string {
        return `I am excited to apply for this position. With ${profile.experience || 'several years'} of experience as a ${profile.title || 'professional'}, I bring expertise in ${profile.skills?.slice(0, 5).join(', ') || 'various relevant skills'}.

My background has equipped me with strong problem-solving abilities and a proven track record of delivering results. I am passionate about contributing to innovative projects and growing with a dynamic team.

I am confident that my skills and experience make me an excellent fit for this role, and I look forward to the opportunity to discuss how I can contribute to your team's success.`;
    }

    /**
     * Check if there's a next page in multi-page application
     */
    async hasNextPage(page: Page): Promise<boolean> {
        const nextButtonPatterns = [
            'button:has-text("Next")',
            'button:has-text("Continue")',
            'a:has-text("Next")',
            'a:has-text("Continue")',
            'input[value*="Next" i]',
            'input[value*="Continue" i]',
            'button:has-text("Save and Continue")',
            '[class*="next"]',
            '[id*="next"]'
        ];

        for (const pattern of nextButtonPatterns) {
            const button = page.locator(pattern).first();
            if (await button.isVisible({ timeout: 1000 }).catch(() => false)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Click next/continue button
     */
    async clickNextButton(page: Page): Promise<boolean> {
        const nextButtonPatterns = [
            'button:has-text("Next")',
            'button:has-text("Continue")',
            'a:has-text("Next")',
            'a:has-text("Continue")',
            'input[value*="Next" i]',
            'input[value*="Continue" i]',
            'button:has-text("Save and Continue")',
        ];

        for (const pattern of nextButtonPatterns) {
            const button = page.locator(pattern).first();
            if (await button.isVisible({ timeout: 1000 }).catch(() => false)) {
                await button.click();
                await page.waitForTimeout(2000);
                return true;
            }
        }
        return false;
    }

    /**
     * Submit the final application
     */
    async submitApplication(page: Page): Promise<boolean> {
        const submitPatterns = [
            'button:has-text("Submit")',
            'button:has-text("Submit Application")',
            'button:has-text("Apply")',
            'button:has-text("Send Application")',
            'button:has-text("Complete")',
            'button:has-text("Finish")',
            'input[type="submit"]',
            'button[type="submit"]'
        ];

        for (const pattern of submitPatterns) {
            const button = page.locator(pattern).first();
            if (await button.isVisible({ timeout: 2000 }).catch(() => false)) {
                await button.click();
                await page.waitForTimeout(3000);
                return true;
            }
        }
        return false;
    }

    /**
     * Check if application was successful
     */
    async checkApplicationSuccess(page: Page): Promise<boolean> {
        try {
            const pageText = await page.evaluate(() => document.body.innerText.toLowerCase());

            const successIndicators = [
                'thank you for applying',
                'application submitted',
                'application received',
                'successfully submitted',
                'we have received your application',
                'thank you for your interest',
                'application complete',
                'you have successfully applied'
            ];

            for (const indicator of successIndicators) {
                if (pageText.includes(indicator)) {
                    return true;
                }
            }

            // Check for success message elements
            const successElements = page.locator('[class*="success"]').or(page.locator('[class*="confirm"]'));
            if (await successElements.count() > 0) {
                return true;
            }

            return false;
        } catch (error) {
            return false;
        }
    }

    /**
     * Complete full application process for a single company
     */
    async processCompanyApplication(page: Page, profile: UserProfile, companyUrl: string): Promise<ApplicationResult> {
        const result: ApplicationResult = {
            jobId: `job_${Date.now()}`,
            company: '',
            jobTitle: '',
            success: false,
            message: '',
            applicationUrl: companyUrl
        };

        try {
            // Navigate to the URL
            await page.goto(companyUrl, { waitUntil: 'networkidle', timeout: 20000 });
            await page.waitForTimeout(2000);

            // Extract company name from page
            result.company = await page.evaluate(() => {
                const title = document.title;
                const ogSiteName = document.querySelector('meta[property="og:site_name"]')?.getAttribute('content');
                return ogSiteName || title.split('|')[0].split('-')[0].trim();
            });

            // Try to navigate to careers page
            const careersUrl = await this.navigateToCareersPage(page);
            if (careersUrl) {
                console.log(`Found careers page: ${careersUrl}`);
            }

            // Find and click apply button
            const foundApplyButton = await this.findAndClickApplyButton(page);
            if (!foundApplyButton) {
                result.message = 'Could not find apply button on page';
                return result;
            }

            // Fill out multi-page application
            let pageCount = 0;
            const maxPages = 10; // Safety limit

            do {
                pageCount++;
                console.log(`Processing application page ${pageCount}...`);

                // Fill form fields on current page
                const { filled, fieldsCompleted } = await this.fillApplicationForm(page, profile);
                console.log(`Filled ${fieldsCompleted} fields on page ${pageCount}`);

                // Check if there's a next page
                if (await this.hasNextPage(page)) {
                    const clickedNext = await this.clickNextButton(page);
                    if (!clickedNext) break;
                } else {
                    // Try to submit
                    const submitted = await this.submitApplication(page);
                    if (submitted) {
                        // Check for success
                        const success = await this.checkApplicationSuccess(page);
                        result.success = success;
                        result.message = success
                            ? `Successfully submitted application to ${result.company}`
                            : `Submitted form but could not verify success for ${result.company}`;
                    } else {
                        result.message = `Could not find submit button for ${result.company}`;
                    }
                    break;
                }
            } while (pageCount < maxPages);

            return result;
        } catch (error) {
            result.message = `Error processing application: ${error instanceof Error ? error.message : 'Unknown error'}`;
            return result;
        }
    }

    /**
     * Main orchestration method - searches Google and applies to matching jobs
     */
    async searchAndApply(state: GoogleJobSearchState): Promise<GoogleJobSearchState> {
        let currentState: GoogleJobSearchState = {
            ...state,
            status: 'searching',
            foundJobs: [],
            applications: [],
            logs: state.logs || [],
            errors: state.errors || []
        };

        try {
            if (!state.profile) {
                return this.log({ ...currentState, status: 'error' }, 'User profile is required', 'error');
            }

            // Extract keywords from profile
            const keywords = this.extractKeywordsFromProfile(state.profile);
            currentState = this.log(currentState, `Extracted ${keywords.length} keywords from profile: ${keywords.slice(0, 10).join(', ')}...`);

            // Generate search query
            const searchQuery = state.searchQuery || this.generateSearchQuery(state.profile);
            currentState = this.log(currentState, `Search query: "${searchQuery}"`);

            if (this.demoMode) {
                // Demo mode simulation
                currentState = this.log(currentState, 'Running in DEMO MODE - simulating job search and applications');

                const demoResults: ApplicationResult[] = [
                    { jobId: 'demo_1', company: 'TechCorp Inc', jobTitle: 'Software Engineer', success: true, message: 'Demo: Successfully applied' },
                    { jobId: 'demo_2', company: 'InnovateTech', jobTitle: 'Full Stack Developer', success: true, message: 'Demo: Successfully applied' },
                    { jobId: 'demo_3', company: 'DataDriven LLC', jobTitle: 'Backend Engineer', success: false, message: 'Demo: Application form incomplete' }
                ];

                for (const result of demoResults) {
                    currentState = this.log(
                        currentState,
                        `${result.success ? '✓' : '✗'} ${result.company}: ${result.message}`,
                        result.success ? 'success' : 'warning'
                    );
                }

                currentState.status = 'completed';
                return this.log(currentState, `Demo completed: ${demoResults.filter(r => r.success).length}/${demoResults.length} applications successful`, 'success');
            }

            // Real automation mode
            await this.initBrowser();
            if (!this.context) {
                throw new Error('Failed to initialize browser');
            }

            const page = await this.context.newPage();

            try {
                // Step 1: Search Google for jobs
                currentState = this.log(currentState, 'Navigating to Google and searching for jobs...');
                const searchResultUrls = await this.searchGoogleForJobs(page, searchQuery);
                currentState = this.log(currentState, `Found ${searchResultUrls.length} search results`);

                // Step 2: Filter results by keyword matching
                const matchingUrls: string[] = [];
                currentState = this.log(currentState, 'Analyzing search results for keyword matches...');
                currentState.status = 'processing';

                for (const url of searchResultUrls.slice(0, 15)) { // Limit to first 15 results
                    try {
                        const { matches, matchedKeywords } = await this.checkUrlForKeywordMatch(page, url, keywords);
                        if (matches) {
                            matchingUrls.push(url);
                            currentState = this.log(currentState, `Match found: ${url} (Keywords: ${matchedKeywords.slice(0, 5).join(', ')})`);
                        }
                    } catch (e) {
                        // Skip URLs that fail to load
                    }
                }

                currentState = this.log(currentState, `Found ${matchingUrls.length} URLs matching resume keywords`);

                // Step 3: Apply to matching companies
                const applicationResults: ApplicationResult[] = [];
                currentState.status = 'applying';

                for (const url of matchingUrls.slice(0, 5)) { // Limit to 5 applications
                    currentState = this.log(currentState, `Processing application for: ${url}`);

                    const result = await this.processCompanyApplication(page, state.profile, url);
                    applicationResults.push(result);

                    currentState = this.log(
                        currentState,
                        `${result.success ? '✓' : '✗'} ${result.company}: ${result.message}`,
                        result.success ? 'success' : 'warning'
                    );

                    // Small delay between applications
                    await page.waitForTimeout(2000);
                }

                // Generate summary
                const successCount = applicationResults.filter(r => r.success).length;
                const failCount = applicationResults.filter(r => !r.success).length;

                currentState = this.log(
                    currentState,
                    `\n=== APPLICATION SUMMARY ===\nTotal Applications: ${applicationResults.length}\nSuccessful: ${successCount}\nFailed: ${failCount}`,
                    successCount > 0 ? 'success' : 'warning'
                );

                currentState.status = 'completed';

            } finally {
                await page.close();
            }

            return currentState;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            currentState = this.log({ ...currentState, status: 'error' }, `Job search workflow failed: ${errorMessage}`, 'error');
            currentState.errors = [...(currentState.errors || []), errorMessage];
            return currentState;
        }
    }

    async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.context = null;
        }
    }
}
