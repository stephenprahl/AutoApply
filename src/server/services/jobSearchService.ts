import type { Job } from '../../types.js';

export interface JobSearchParams {
    keywords: string[];
    location: string;
    remote: boolean;
    salaryMin?: number;
    jobType?: string;
    limit?: number;
}

export interface JobSearchResult {
    jobs: Job[];
    totalCount: number;
    source: string;
}

class JobSearchService {
    private readonly sources = [
        'linkedin',
        'indeed',
        'glassdoor',
        'remoteok',
        'weworkremotely'
    ];

    async searchJobs(params: JobSearchParams): Promise<JobSearchResult[]> {
        const results: JobSearchResult[] = [];

        // Search multiple sources in parallel
        const searchPromises = this.sources.map(source =>
            this.searchSource(source, params)
        );

        const searchResults = await Promise.allSettled(searchPromises);

        for (let i = 0; i < searchResults.length; i++) {
            const result = searchResults[i];
            if (result.status === 'fulfilled') {
                results.push(result.value);
            } else {
                console.warn(`Failed to search ${this.sources[i]}:`, result.reason);
            }
        }

        return results;
    }

    private async searchSource(source: string, params: JobSearchParams): Promise<JobSearchResult> {
        try {
            // In a real implementation, you'd use proper APIs or scraping
            // For now, we'll simulate API calls
            const response = await this.simulateApiCall(source, params);

            return {
                jobs: response.jobs.map(job => ({
                    ...job,
                    id: `${source}-${job.id}`,
                    applicationUrl: job.applicationUrl || this.generateApplicationUrl(source, job)
                })) as Job[],
                totalCount: response.totalCount,
                source
            };
        } catch (error) {
            console.error(`Error searching ${source}:`, error);
            return { jobs: [], totalCount: 0, source };
        }
    }

    // private getSourceUrl(source: string): string {
    //   const urls: Record<string, string> = {
    //     linkedin: 'https://api.linkedin.com/v2/jobSearch',
    //     indeed: 'https://api.indeed.com/ads/apisearch',
    //     glassdoor: 'https://api.glassdoor.com/api.htm',
    //     remoteok: 'https://remoteok.com/api',
    //     weworkremotely: 'https://weworkremotely.com/api'
    //   };
    //   return urls[source] || '';
    // }

    // private buildQueryParams(source: string, params: JobSearchParams): Record<string, any> {
    //   const baseParams: Record<string, any> = {
    //     q: params.keywords.join(' '),
    //     limit: params.limit || 50
    //   };

    //   switch (source) {
    //     case 'linkedin':
    //       return {
    //         ...baseParams,
    //         location: params.location,
    //         remote: params.remote,
    //         salary: params.salaryMin
    //       };
    //     case 'indeed':
    //       return {
    //         ...baseParams,
    //         l: params.location,
    //         remote: params.remote ? '1' : '0',
    //         salary: params.salaryMin
    //       };
    //     case 'glassdoor':
    //       return {
    //         ...baseParams,
    //         location: params.location,
    //         remoteWork: params.remote
    //       };
    //     case 'remoteok':
    //       return {
    //         ...baseParams,
    //         location: params.remote ? 'remote' : params.location
    //       };
    //     case 'weworkremotely':
    //       return {
    //         ...baseParams,
    //         region: params.remote ? 'remote' : params.location
    //       };
    //     default:
    //       return baseParams;
    //   }
    // }

    private async simulateApiCall(source: string, params: JobSearchParams): Promise<{ jobs: Partial<Job>[], totalCount: number }> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

        // Generate mock jobs based on search parameters
        const mockJobs: Partial<Job>[] = [];
        const jobTitles = [
            'Senior Frontend Developer',
            'Full Stack Engineer',
            'React Developer',
            'TypeScript Engineer',
            'Node.js Developer',
            'UI/UX Developer',
            'Software Engineer',
            'Web Developer',
            'JavaScript Developer',
            'Frontend Engineer'
        ];

        const companies = [
            'TechCorp', 'StartupXYZ', 'Digital Agency', 'Enterprise Corp',
            'Design Studio', 'InnovateLabs', 'CodeWorks', 'WebSolutions',
            'DevTeam', 'TechStart'
        ];

        const locations = params.remote
            ? ['Remote', 'Remote', 'Remote', 'Remote', 'Remote']
            : [params.location, `${params.location} area`, 'Remote', 'Hybrid'];

        const salaryRanges = [
            '$80k - $110k', '$90k - $120k', '$100k - $140k',
            '$120k - $160k', '$130k - $170k', '$150k - $200k'
        ];

        for (let i = 0; i < Math.min(params.limit || 20, 15); i++) {
            const title = jobTitles[Math.floor(Math.random() * jobTitles.length)];
            const company = companies[Math.floor(Math.random() * companies.length)];
            const location = locations[Math.floor(Math.random() * locations.length)];
            const salary = salaryRanges[Math.floor(Math.random() * salaryRanges.length)];

            // Calculate relevance score based on keyword matching
            let relevanceScore = 0.5;
            const jobKeywords = [title.toLowerCase(), company.toLowerCase()];
            params.keywords.forEach(keyword => {
                if (jobKeywords.some(jobKeyword => jobKeyword.includes(keyword.toLowerCase()))) {
                    relevanceScore += 0.2;
                }
            });

            mockJobs.push({
                id: `${Date.now()}-${i}`,
                title,
                company,
                location,
                salary,
                description: `We are looking for an experienced ${title} to join our team. This is a great opportunity to work with cutting-edge technologies and contribute to exciting projects.`,
                postedAt: `${Math.floor(Math.random() * 7) + 1} days ago`,
                tags: params.keywords.slice(0, 3).concat(['Remote Friendly', 'Benefits']),
                logo: `/api/placeholder/64/64`,
                applicationUrl: `https://${source}.com/jobs/${Date.now()}-${i}`
            });
        }

        return {
            jobs: mockJobs,
            totalCount: mockJobs.length * 2 // Simulate more results available
        };
    }

    private generateApplicationUrl(source: string, job: Partial<Job>): string {
        const baseUrls: Record<string, string> = {
            linkedin: 'https://linkedin.com/jobs/view/',
            indeed: 'https://indeed.com/viewjob?jk=',
            glassdoor: 'https://glassdoor.com/job-listing/',
            remoteok: 'https://remoteok.com/remote-jobs/',
            weworkremotely: 'https://weworkremotely.com/remote-jobs/'
        };

        return `${baseUrls[source]}${job.id}`;
    }

    // Method to get trending jobs
    async getTrendingJobs(limit: number = 10): Promise<Job[]> {
        const params: JobSearchParams = {
            keywords: ['developer', 'engineer', 'software'],
            location: 'Remote',
            remote: true,
            limit
        };

        const results = await this.searchJobs(params);
        const allJobs = results.flatMap(result => result.jobs);

        // Sort by some trending criteria (in real app, this would be based on views/applications)
        return allJobs
            .sort(() => Math.random() - 0.5)
            .slice(0, limit);
    }

    // Method to get jobs similar to a given job
    async getSimilarJobs(job: Job, limit: number = 5): Promise<Job[]> {
        const params: JobSearchParams = {
            keywords: job.tags.slice(0, 3),
            location: job.location,
            remote: job.location.toLowerCase().includes('remote'),
            limit
        };

        const results = await this.searchJobs(params);
        return results
            .flatMap(result => result.jobs)
            .filter(j => j.id !== job.id)
            .slice(0, limit);
    }
}

export const jobSearchService = new JobSearchService();