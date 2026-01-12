import { AutoApplyWorkflow } from './server/agents/AutoApplyWorkflow.js';

// Test the LangGraph workflow
async function testWorkflow() {
    console.log('🚀 Testing AutoApply LangGraph Workflow');

    // Don't set API key to test demo mode
    // process.env.API_KEY = 'dummy-key-for-testing';

    const workflow = new AutoApplyWorkflow();

    // Sample job data
    const sampleJobs = [
        {
            id: 'job1',
            title: 'Senior Software Engineer',
            company: 'Tech Corp',
            location: 'San Francisco, CA',
            salary: '$120k - $160k',
            description: 'We are looking for a senior software engineer with experience in React, Node.js, and cloud technologies.',
            postedAt: new Date().toISOString(),
            tags: ['React', 'Node.js', 'AWS', 'TypeScript'],
            logo: 'https://example.com/logo.png',
            applicationUrl: 'https://careers.techcorp.com/jobs/senior-software-engineer'
        },
        {
            id: 'job2',
            title: 'Full Stack Developer',
            company: 'Startup Inc',
            location: 'Remote',
            salary: '$90k - $120k',
            description: 'Join our fast-growing startup as a full stack developer. Experience with modern web technologies required.',
            postedAt: new Date().toISOString(),
            tags: ['JavaScript', 'Python', 'PostgreSQL', 'Docker'],
            logo: 'https://example.com/logo2.png',
            applicationUrl: 'https://startupinc.bamboohr.com/careers/456'
        }
    ];

    try {
        const result = await workflow.run({
            jobs: sampleJobs,
            maxApplications: 2,
            profile: {
                name: "John Doe",
                title: "Software Engineer",
                experience: "3-5 years",
                skills: ["JavaScript", "React", "Node.js", "Python"],
                resumeText: "Experienced software engineer with 4 years of experience...",
                preferences: {
                    remote: true,
                    minSalary: 80000
                }
            }
        });

        console.log('✅ Workflow completed!');
        console.log('Status:', result.status);
        console.log('Applications created:', result.applications?.length || 0);
        console.log('Errors:', result.errors?.length || 0);

        if (result.logs && result.logs.length > 0) {
            console.log('\n📋 Workflow Logs:');
            result.logs.forEach(log => {
                const timestamp = new Date(log.timestamp).toLocaleTimeString();
                console.log(`[${timestamp}] ${log.type.toUpperCase()}: ${log.message}`);
            });
        }

    } catch (error) {
        console.error('❌ Workflow test failed:', error);
    }
}

// Run the test
testWorkflow();