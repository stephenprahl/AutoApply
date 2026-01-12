export const parseResumeFile = async (file: File): Promise<{ text: string; skills: string[] }> => {
  const fileType = file.type;
  
  if (fileType === 'text/plain') {
    const text = await file.text();
    return { text, skills: extractSkillsFromText(text) };
  }
  
  if (fileType === 'application/pdf') {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      
      // Disable worker for now to avoid CDN issues
      pdfjsLib.GlobalWorkerOptions.workerSrc = '';
      
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer
      });
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      
      // Extract text from all pages
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }
      
      return { text: fullText, skills: extractSkillsFromText(fullText) };
    } catch (error) {
      console.error('Error parsing PDF:', error);
      // Fallback: return a message about PDF parsing being unavailable
      return { 
        text: 'PDF parsing is currently unavailable. Please copy and paste your resume text manually.', 
        skills: [] 
      };
    }
  }
  
  if (fileType.includes('word') || fileType.includes('document')) {
    throw new Error('Word documents not yet supported. Please upload a PDF or text file.');
  }
  
  throw new Error('Unsupported file type. Please upload a PDF or text file.');
};

const extractSkillsFromText = (text: string): string[] => {
  const commonSkills = [
    'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Node.js', 'Python', 'Java', 'C++', 'C#',
    'HTML', 'CSS', 'Sass', 'Tailwind', 'Bootstrap', 'Material-UI', 'Express', 'Django', 'Flask',
    'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP',
    'Git', 'GitHub', 'GitLab', 'CI/CD', 'Jenkins', 'REST API', 'GraphQL', 'Microservices',
    'Machine Learning', 'AI', 'Data Science', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy',
    'Figma', 'Sketch', 'Adobe XD', 'Photoshop', 'Illustrator', 'UI/UX', 'Design Systems',
    'Agile', 'Scrum', 'Kanban', 'JIRA', 'Confluence', 'Slack', 'Microsoft Office',
    'Leadership', 'Project Management', 'Communication', 'Problem Solving', 'Team Work'
  ];
  
  const foundSkills: string[] = [];
  const lowerText = text.toLowerCase();
  
  commonSkills.forEach(skill => {
    if (lowerText.includes(skill.toLowerCase())) {
      foundSkills.push(skill);
    }
  });
  
  return [...new Set(foundSkills)];
};
