import { AlertTriangle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import AgentView from './components/AgentView.tsx';
import ApplicationHistory from './components/ApplicationHistory.tsx';
import Dashboard from './components/Dashboard.tsx';
import { GoogleSearchApply } from './components/GoogleSearchApply.tsx';
import JobRecommendations from './components/JobRecommendations.tsx';
import ProfileSetup from './components/ProfileSetup.tsx';
import Settings from './components/Settings.tsx';
import Sidebar from './components/Sidebar.tsx';
import { backendApi } from './services/backendService.ts';
import type { ApplicationRecord, UserProfile, UserSettings } from './types.ts';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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

  // Load data from backend on startup
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        // Load profile
        try {
          const profileData = await backendApi.getProfile();
          // Only update profile if it has actual data (not empty object)
          if (profileData && Object.keys(profileData).length > 0 && profileData.name) {
            setProfile(profileData);
          }
        } catch (error) {
          console.warn('Failed to load profile from backend, using defaults:', error);
        }

        // Load applications
        try {
          const applicationsData = await backendApi.getApplications();
          setApplications(applicationsData);
        } catch (error) {
          console.warn('Failed to load applications from backend:', error);
        }

        // Load settings
        try {
          const settingsData = await backendApi.getSettings();
          setSettings(prevSettings => ({
            ...prevSettings,
            ...settingsData
          }));
        } catch (error) {
          console.warn('Failed to load settings from backend:', error);
        }

      } catch (error) {
        console.error('Failed to load data from backend:', error);
        setLoadError('Failed to load data from backend. Some features may not work properly.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const addApplication = (app: ApplicationRecord) => {
    setApplications(prev => [...prev, app]);
    // Save to backend
    backendApi.createApplication(app).catch(error => {
      console.error('Failed to save application to backend:', error);
    });
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard applications={applications} />;
      case 'agent':
        return <AgentView profile={profile} applications={applications} addApplication={addApplication} />;
      case 'google-search':
        return <GoogleSearchApply />;
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

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your data...</p>
            </div>
          </div>
        ) : loadError ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Loading Error</h3>
                <div className="mt-2 text-sm text-red-700">{loadError}</div>
              </div>
            </div>
          </div>
        ) : (
          renderContent()
        )}
      </main>
    </div>
  );
};

export default App;