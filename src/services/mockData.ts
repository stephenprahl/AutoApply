import type { Job } from '../types.ts';

export const MOCK_JOBS: Job[] = [
  {
    id: 'j1',
    title: 'Senior Frontend Engineer',
    company: 'TechFlow Solutions',
    location: 'Remote',
    salary: '$140k - $180k',
    description: 'We are looking for a React expert with TypeScript experience. You will be building next-gen dashboard applications. Must have 5+ years of experience and deep knowledge of performance optimization.',
    postedAt: '2h ago',
    tags: ['React', 'TypeScript', 'Tailwind'],
    logo: 'https://picsum.photos/48/48?random=1',
    applicationUrl: 'https://www.linkedin.com/jobs/view/senior-frontend-engineer-at-techflow-solutions-1234567890'
  },
  {
    id: 'j2',
    title: 'Product Designer',
    company: 'Creative Arc',
    location: 'New York, NY',
    salary: '$110k - $150k',
    description: 'Join our design team to craft beautiful user experiences. Proficiency in Figma and Adobe Creative Suite required. Experience with design systems is a plus.',
    postedAt: '4h ago',
    tags: ['Figma', 'UI/UX', 'Design Systems'],
    logo: 'https://picsum.photos/48/48?random=2',
    applicationUrl: 'https://www.indeed.com/viewjob?jk=abcdef123456'
  },
  {
    id: 'j3',
    title: 'Full Stack Developer',
    company: 'Nebula Corp',
    location: 'Austin, TX',
    salary: '$130k - $160k',
    description: 'Seeking a full stack developer comfortable with Node.js and React. Experience with cloud infrastructure (AWS/GCP) is highly desirable. We move fast and ship daily.',
    postedAt: '5h ago',
    tags: ['Node.js', 'React', 'AWS'],
    logo: 'https://picsum.photos/48/48?random=3',
    applicationUrl: 'https://careers.nebulacorp.com/jobs/full-stack-developer'
  },
  {
    id: 'j4',
    title: 'AI Research Scientist',
    company: 'DeepMindset',
    location: 'San Francisco, CA',
    salary: '$200k - $300k',
    description: 'Push the boundaries of LLMs. PhD in Computer Science or related field required. Experience with PyTorch and distributed training.',
    postedAt: '1d ago',
    tags: ['Python', 'PyTorch', 'AI'],
    logo: 'https://picsum.photos/48/48?random=4',
    applicationUrl: 'https://boards.greenhouse.io/deepmindset/jobs/987654321'
  },
  {
    id: 'j5',
    title: 'Junior Web Developer',
    company: 'StartUp Inc',
    location: 'Remote',
    salary: '$60k - $80k',
    description: 'Great entry level opportunity. Basic knowledge of HTML, CSS, and JavaScript. Willingness to learn React.',
    postedAt: '1d ago',
    tags: ['HTML', 'CSS', 'JavaScript'],
    logo: 'https://picsum.photos/48/48?random=5',
    applicationUrl: 'https://startupinc.bamboohr.com/careers/123'
  }
];