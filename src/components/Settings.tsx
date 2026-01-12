import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Download,
  Eye,
  EyeOff,
  Key,
  Palette,
  Save,
  Settings as SettingsIcon,
  Shield,
  TestTube,
  Trash2,
  Upload,
  Zap
} from 'lucide-react';
import React, { useState } from 'react';
import type { UserSettings } from '../types.ts';

interface SettingsProps {
  settings: UserSettings;
  setSettings: (settings: UserSettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, setSettings }) => {
  const [activeTab, setActiveTab] = useState<'notifications' | 'appearance' | 'privacy' | 'automation' | 'api' | 'data'>('notifications');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [testingApi, setTestingApi] = useState<string | null>(null);

  const handleSave = async () => {
    setSaveStatus('saving');
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const updateSettings = (section: keyof UserSettings, updates: any) => {
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        ...updates
      }
    });
  };

  const exportData = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'settings-backup.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        setSettings(imported);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } catch (error) {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    };
    reader.readAsText(file);
  };

  const resetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to default values? This action cannot be undone.')) {
      const defaultSettings: UserSettings = {
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
      };
      setSettings(defaultSettings);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const testApiKey = async (provider: string) => {
    setTestingApi(provider);
    // Simulate API test
    await new Promise(resolve => setTimeout(resolve, 1500));
    setTestingApi(null);
    // In a real app, you'd make an actual API call here
    alert(`${provider} API key test completed. (This is a demo - actual validation would be implemented here)`);
  };

  const tabs = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'automation', label: 'Automation', icon: Zap },
    { id: 'api', label: 'API Keys', icon: Key },
    { id: 'data', label: 'Data Management', icon: SettingsIcon }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-sm text-gray-600 mt-1">Configure your account preferences and system settings</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saveStatus === 'saving'}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {saveStatus === 'saving' ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : saveStatus === 'saved' ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Saved
                    </>
                  ) : saveStatus === 'error' ? (
                    <>
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Error
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex">
            {/* Sidebar */}
            <div className="w-80 bg-gray-50 border-r border-gray-200">
              <nav className="px-4 py-6 space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors duration-200 ${activeTab === tab.id
                          ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 bg-white">
              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
                    <p className="text-sm text-gray-600 mt-1">Choose how you want to be notified about updates and activities.</p>
                  </div>

                  <div className="space-y-4">
                    {[
                      { key: 'email', label: 'Email Notifications', description: 'Receive updates via email' },
                      { key: 'push', label: 'Push Notifications', description: 'Browser push notifications' },
                      { key: 'applicationUpdates', label: 'Application Updates', description: 'Status changes for your applications' },
                      { key: 'jobRecommendations', label: 'Job Recommendations', description: 'New matching job opportunities' },
                      { key: 'weeklyReports', label: 'Weekly Reports', description: 'Summary of your job search activity' }
                    ].map(({ key, label, description }) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">{label}</h3>
                          <p className="text-xs text-gray-500 mt-1">{description}</p>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.notifications[key as keyof typeof settings.notifications]}
                            onChange={(e) => updateSettings('notifications', { [key]: e.target.checked })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Appearance Settings</h2>
                    <p className="text-sm text-gray-600 mt-1">Customize the look and feel of your interface.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                      <select
                        value={settings.appearance.theme}
                        onChange={(e) => updateSettings('appearance', { theme: e.target.value })}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="system">System Default</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                      <select
                        value={settings.appearance.language}
                        onChange={(e) => updateSettings('appearance', { language: e.target.value })}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                      <select
                        value={settings.appearance.timezone}
                        onChange={(e) => updateSettings('appearance', { timezone: e.target.value })}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Privacy & Security</h2>
                    <p className="text-sm text-gray-600 mt-1">Control your privacy settings and data sharing preferences.</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Profile Visibility</label>
                      <select
                        value={settings.privacy.profileVisibility}
                        onChange={(e) => updateSettings('privacy', { profileVisibility: e.target.value })}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        <option value="public">Public - Anyone can view your profile</option>
                        <option value="private">Private - Only you can view your profile</option>
                      </select>
                    </div>

                    {[
                      { key: 'dataSharing', label: 'Data Sharing', description: 'Share anonymized data to improve our services' },
                      { key: 'analytics', label: 'Analytics', description: 'Help us improve with usage analytics' }
                    ].map(({ key, label, description }) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">{label}</h3>
                          <p className="text-xs text-gray-500 mt-1">{description}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.privacy[key as keyof Omit<typeof settings.privacy, 'profileVisibility'>] as boolean}
                          onChange={(e) => updateSettings('privacy', { [key]: e.target.checked })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Automation Tab */}
              {activeTab === 'automation' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Automation Settings</h2>
                    <p className="text-sm text-gray-600 mt-1">Configure automated job application features.</p>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Auto-Apply</h3>
                        <p className="text-xs text-gray-500 mt-1">Automatically apply to matching jobs</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.automation.autoApply}
                        onChange={(e) => updateSettings('automation', { autoApply: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Web Automation Mode</h3>
                        <p className="text-xs text-gray-600 mt-1">Enable actual web form filling (currently in demo mode)</p>
                        <p className="text-xs text-yellow-600 mt-1">⚠️ Demo mode simulates applications without real web interactions</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={false}
                        disabled={true}
                        className="h-4 w-4 text-yellow-600 opacity-50 cursor-not-allowed"
                        title="Web automation is currently disabled for safety"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Daily Application Limit</label>
                        <input
                          type="number"
                          value={settings.automation.dailyApplicationLimit}
                          onChange={(e) => updateSettings('automation', { dailyApplicationLimit: parseInt(e.target.value) })}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                          min="1"
                          max="50"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Match Threshold (%)</label>
                        <input
                          type="number"
                          value={settings.automation.matchThreshold}
                          onChange={(e) => updateSettings('automation', { matchThreshold: parseInt(e.target.value) })}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                          min="0"
                          max="100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Working Hours</label>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Start Time</label>
                          <input
                            type="time"
                            value={settings.automation.workingHours.start}
                            onChange={(e) => updateSettings('automation', {
                              workingHours: { ...settings.automation.workingHours, start: e.target.value }
                            })}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">End Time</label>
                          <input
                            type="time"
                            value={settings.automation.workingHours.end}
                            onChange={(e) => updateSettings('automation', {
                              workingHours: { ...settings.automation.workingHours, end: e.target.value }
                            })}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* API Keys Tab */}
              {activeTab === 'api' && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">API Keys</h2>
                      <p className="text-sm text-gray-600 mt-1">Manage your API keys for external services.</p>
                    </div>
                    <button
                      onClick={() => setShowApiKeys(!showApiKeys)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {showApiKeys ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                      {showApiKeys ? 'Hide' : 'Show'} Keys
                    </button>
                  </div>

                  <div className="space-y-6">
                    {[
                      { key: 'gemini', label: 'Google Gemini API Key', description: 'For AI-powered features' },
                      { key: 'openai', label: 'OpenAI API Key', description: 'Alternative AI provider' }
                    ].map(({ key, label, description }) => (
                      <div key={key} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">{label}</h3>
                            <p className="text-xs text-gray-500 mt-1">{description}</p>
                          </div>
                          <button
                            onClick={() => testApiKey(key)}
                            disabled={testingApi === key || !settings.apiKeys[key as keyof typeof settings.apiKeys]}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {testingApi === key ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-700 mr-1"></div>
                                Testing...
                              </>
                            ) : (
                              <>
                                <TestTube className="w-3 h-3 mr-1" />
                                Test Key
                              </>
                            )}
                          </button>
                        </div>
                        <input
                          type={showApiKeys ? 'text' : 'password'}
                          value={settings.apiKeys[key as keyof typeof settings.apiKeys] || ''}
                          onChange={(e) => updateSettings('apiKeys', { [key]: e.target.value })}
                          placeholder={`Enter your ${key} API key`}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Management Tab */}
              {activeTab === 'data' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Data Management</h2>
                    <p className="text-sm text-gray-600 mt-1">Export, import, or reset your settings and data.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center mb-3">
                        <Download className="w-5 h-5 text-blue-600 mr-2" />
                        <h3 className="text-sm font-medium text-gray-900">Export Settings</h3>
                      </div>
                      <p className="text-xs text-gray-500 mb-4">Download a backup of your settings</p>
                      <button
                        onClick={exportData}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </button>
                    </div>

                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center mb-3">
                        <Upload className="w-5 h-5 text-green-600 mr-2" />
                        <h3 className="text-sm font-medium text-gray-900">Import Settings</h3>
                      </div>
                      <p className="text-xs text-gray-500 mb-4">Restore settings from a backup file</p>
                      <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 cursor-pointer">
                        <Upload className="w-4 h-4 mr-2" />
                        Import
                        <input
                          type="file"
                          accept=".json"
                          onChange={importData}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="bg-red-50 rounded-lg border border-red-200 p-4 sm:col-span-2 lg:col-span-1">
                      <div className="flex items-center mb-3">
                        <Trash2 className="w-5 h-5 text-red-600 mr-2" />
                        <h3 className="text-sm font-medium text-red-900">Reset Settings</h3>
                      </div>
                      <p className="text-xs text-red-700 mb-4">Restore all settings to default values</p>
                      <button
                        onClick={resetSettings}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
