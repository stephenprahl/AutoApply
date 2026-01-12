import React from 'react';
import { LayoutDashboard, User, Briefcase, Zap, Building2, Star, Cog } from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'recommendations', label: 'Recommendations', icon: Star },
    { id: 'agent', label: 'AI Agent', icon: Zap },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'history', label: 'Applications', icon: Briefcase },
    { id: 'settings', label: 'Settings', icon: Cog },
  ];

  return (
    <aside className="w-20 lg:w-64 bg-white border-r border-gray-200 h-screen flex flex-col fixed left-0 top-0 z-10 transition-all duration-300">
      {/* Header */}
      <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-gray-100">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-corporate">
          <Building2 className="text-white w-5 h-5" />
        </div>
        <span className="hidden lg:block ml-3 font-semibold text-lg text-gray-900 tracking-tight">CareerFlow Pro</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 flex flex-col gap-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={clsx(
                "flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group font-medium text-sm",
                isActive 
                  ? "bg-blue-50 text-blue-700 border-l-2 border-blue-600" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className={clsx("w-5 h-5", isActive ? "text-blue-600" : "text-gray-500")} />
              <span className={clsx("hidden lg:block ml-3")}>{item.label}</span>
              {isActive && (
                <div className="hidden lg:block ml-auto w-2 h-2 rounded-full bg-blue-600"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center p-3 rounded-lg bg-gray-50 border border-gray-200">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs">
            JD
          </div>
          <div className="hidden lg:block ml-3">
            <p className="text-sm font-medium text-gray-900">John Doe</p>
            <p className="text-xs text-gray-500">Enterprise Plan</p>
          </div>
          <div className="hidden lg:block ml-auto">
            <Cog className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;