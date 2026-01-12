import React, { useState } from 'react';
import type { UserSettings } from '../types.ts';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Palette, 
  Shield, 
  Zap, 
  Key, 
  Save, 
  Download, 
  Upload, 
  Trash2, 
  Eye, 
  EyeOff,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface SettingsProps {
  settings: UserSettings;
  setSettings: (settings: UserSettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, setSettings }) => {
  const [activeTab, setActiveTab] = useState<'notifications' | 'appearance' | 'privacy' | 'automation' | 'api' | 'data'>('notifications');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showApiKeys, setShowApiKeys] = useState(false);

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
    if (confirm('Are you sure you want to reset all settings to default values?')) {
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

  const tabs = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'automation', label: 'Automation', icon: Zap },
    { id: 'api', label: 'API Keys', icon: Key },
    { id: 'data', label: 'Data Management', icon: SettingsIcon }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your preferences and account settings</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm disabled:opacity-50"
          >
            {saveStatus === 'saving' ? (
              <>Saving...</>
            ) : saveStatus === 'saved' ? (
              <><CheckCircle className="w-4 h-4" /> Saved!</>
            ) : saveStatus === 'error' ? (
              <><AlertTriangle className="w-4 h-4" /> Error!</>
            ) : (
              <><Save className="w-4 h-4" /> Save Changes</>
            )}
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200">
          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="p-6 space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Preferences</h2>
              
              <div className="space-y-4">
                {[
                  { key: 'email', label: 'Email Notifications', description: 'Receive updates via email' },
                  { key: 'push', label: 'Push Notifications', description: 'Browser push notifications' },
                  { key: 'applicationUpdates', label: 'Application Updates', description: 'Status changes for your applications' },
                  { key: 'jobRecommendations', label: 'Job Recommendations', description: 'New matching job opportunities' },
                  { key: 'weeklyReports', label: 'Weekly Reports', description: 'Summary of your job search activity' }
                ].map(({ key, label, description }) => (
                  <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">{label}</h3>
                      <p className="text-sm text-gray-500">{description}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.notifications[key as keyof typeof settings.notifications]}
                      onChange={(e) => updateSettings('notifications', { [key]: e.target.checked })}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="p-6 space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Appearance</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                  <select
                    value={settings.appearance.theme}
                    onChange={(e) => updateSettings('appearance', { theme: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                  <select
                    value={settings.appearance.timezone}
                    onChange={(e) => updateSettings('appearance', { timezone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
            <div className="p-6 space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Privacy & Security</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Profile Visibility</label>
                  <select
                    value={settings.privacy.profileVisibility}
                    onChange={(e) => updateSettings('privacy', { profileVisibility: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="public">Public - Anyone can view your profile</option>
                    <option value="private">Private - Only you can view your profile</option>
                  </select>
                </div>

                {[
                  { key: 'dataSharing', label: 'Data Sharing', description: 'Share anonymized data to improve our services' },
                  { key: 'analytics', label: 'Analytics', description: 'Help us improve with usage analytics' }
                ].map(({ key, label, description }) => (
                  <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">{label}</h3>
                      <p className="text-sm text-gray-500">{description}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.privacy[key as keyof Omit<typeof settings.privacy, 'profileVisibility'>] as boolean}
                      onChange={(e) => updateSettings('privacy', { [key]: e.target.checked })}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Automation Tab */}
          {activeTab === 'automation' && (
            <div className="p-6 space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Automation Settings</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Auto-Apply</h3>
                    <p className="text-sm text-gray-500">Automatically apply to matching jobs</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.automation.autoApply}
                    onChange={(e) => updateSettings('automation', { autoApply: e.target.checked })}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Daily Application Limit</label>
                  <input
                    type="number"
                    value={settings.automation.dailyApplicationLimit}
                    onChange={(e) => updateSettings('automation', { dailyApplicationLimit: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Working Hours</label>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={settings.automation.workingHours.start}
                        onChange={(e) => updateSettings('automation', { 
                          workingHours: { ...settings.automation.workingHours, start: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">End Time</label>
                      <input
                        type="time"
                        value={settings.automation.workingHours.end}
                        onChange={(e) => updateSettings('automation', { 
                          workingHours: { ...settings.automation.workingHours, end: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* API Keys Tab */}
          {activeTab === 'api' && (
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">API Keys</h2>
                <button
                  onClick={() => setShowApiKeys(!showApiKeys)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  {showApiKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showApiKeys ? 'Hide' : 'Show'} Keys
                </button>
              </div>
              
              <div className="space-y-4">
                {[
                  { key: 'gemini', label: 'Google Gemini API Key', description: 'For AI-powered features' },
                  { key: 'openai', label: 'OpenAI API Key', description: 'Alternative AI provider' }
                ].map(({ key, label, description }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <p className="text-xs text-gray-500 mb-2">{description}</p>
                    <input
                      type={showApiKeys ? 'text' : 'password'}
                      value={settings.apiKeys[key as keyof typeof settings.apiKeys] || ''}
                      onChange={(e) => updateSettings('apiKeys', { [key]: e.target.value })}
                      placeholder={`Enter your ${key} API key`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Management Tab */}
          {activeTab === 'data' && (
            <div className="p-6 space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Data Management</h2>
              
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Export Settings</h3>
                  <p className="text-sm text-gray-500 mb-4">Download a backup of your settings</p>
                  <button
                    onClick={exportData}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export Settings
                  </button>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Import Settings</h3>
                  <p className="text-sm text-gray-500 mb-4">Restore settings from a backup file</p>
                  <label className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                    <Upload className="w-4 h-4" />
                    Import Settings
                    <input
                      type="file"
                      accept=".json"
                      onChange={importData}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="border border-red-200 rounded-lg p-4">
                  <h3 className="font-medium text-red-900 mb-2">Reset Settings</h3>
                  <p className="text-sm text-red-700 mb-4">Restore all settings to default values</p>
                  <button
                    onClick={resetSettings}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Reset to Defaults
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
