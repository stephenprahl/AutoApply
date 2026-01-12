import React, { useState } from 'react';
import Sidebar from './components/Sidebar.tsx';
import Dashboard from './components/Dashboard.tsx';
import AgentView from './components/AgentView.tsx';
import ProfileSetup from './components/ProfileSetup.tsx';
import ApplicationHistory from './components/ApplicationHistory.tsx';
import JobRecommendations from './components/JobRecommendations.tsx';
import Settings from './components/Settings.tsx';
import type { UserProfile, ApplicationRecord, UserSettings } from './types.ts';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  
  // Central State
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Alex Developer',
    title: 'Frontend Engineer',
    experience: '4',
    skills: ['React', 'JavaScript', 'CSS', 'Node.js'],
    resumeText: 'Experienced Frontend Engineer specializing in React and modern web technologies. 4 years of experience building responsive web applications. Proficient in Tailwind CSS, TypeScript, and state management.',
    preferences: { remote: true, minSalary: 100000 },
    workExperience: [
      {
        id: '1',
        company: 'Tech Corp',
        position: 'Frontend Developer',
        startDate: '2020-06',
        endDate: '2022-08',
        current: false,
        description: 'Developed responsive web applications using React and TypeScript. Led the implementation of a new design system that improved development efficiency by 30%.',
        location: 'San Francisco, CA'
      }
    ],
    education: [
      {
        id: '1',
        institution: 'University of Technology',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        startDate: '2016-09',
        endDate: '2020-05',
        current: false,
        gpa: '3.8'
      }
    ],
    portfolio: {
      github: 'https://github.com/alexdeveloper',
      linkedin: 'https://linkedin.com/in/alexdeveloper',
      portfolio: 'https://alexdev.com'
    }
  });

  const [applications, setApplications] = useState<ApplicationRecord[]>([]);

  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      email: true,
      push: true,
      applicationUpdates: true,
      jobRecommendations: true,
      weeklyReports: false
    },
    appearance: {
      theme: 'system',
      language: 'en',
      timezone: 'UTC'
    },
    privacy: {
      profileVisibility: 'private',
      dataSharing: false,
      analytics: true
    },
    automation: {
      autoApply: false,
      dailyApplicationLimit: 10,
      workingHours: { start: '09:00', end: '17:00' },
      matchThreshold: 70
    },
    apiKeys: {}
  });

  const addApplication = (app: ApplicationRecord) => {
    setApplications(prev => [...prev, app]);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard applications={applications} />;
      case 'agent':
        return <AgentView profile={profile} applications={applications} addApplication={addApplication} />;
      case 'profile':
        return <ProfileSetup profile={profile} setProfile={setProfile} />;
      case 'history':
        return <ApplicationHistory applications={applications} />;
      case 'recommendations':
        return <JobRecommendations profile={profile} applications={applications} onSelectJob={(job) => {
          // Handle job selection - could navigate to agent view with pre-selected job
          console.log('Selected job:', job);
        }} />;
      case 'settings':
        return <Settings settings={settings} setSettings={setSettings} />;
      default:
        return <Dashboard applications={applications} />;
    }
  };

  return (
    <div className="flex bg-gray-50 min-h-screen font-sans">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      
      <main className="flex-1 ml-20 lg:ml-64 p-6 lg:p-8 transition-all duration-300">
        <header className="mb-8 flex justify-between items-center lg:hidden">
             <div className="text-xl font-semibold text-gray-900">CareerFlow Pro</div>
        </header>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;