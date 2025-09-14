
import React, { useState } from 'react';
import TrainingOverview from './components/TrainingOverview';
import Management from './components/Management';
import Statistics from './components/Statistics';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';

const App = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const logoSetting = useLiveQuery(() => db.settings?.get('logo'), []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <TrainingOverview />;
      case 'management':
        return <Management />;
      case 'statistics':
        return <Statistics />;
      default:
        return <TrainingOverview />;
    }
  };

  const TabButton = ({ tabName, label, icon }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`flex-1 sm:flex-none sm:px-6 py-3 text-sm font-medium text-center rounded-t-lg transition-colors duration-200 ${
        activeTab === tabName
          ? 'text-white bg-primary'
          : 'text-on-surface hover:bg-surface'
      }`}
    >
      <i className={`fa ${icon} mr-2 hidden sm:inline-block`}></i>
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col">
      <header className="bg-surface shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
             {logoSetting?.value ? (
               <img src={logoSetting.value} alt="Logo" className="h-8 w-auto object-contain" />
             ) : (
               <i className="fa-solid fa-chart-line text-primary text-3xl"></i>
             )}
            <h1 className="text-2xl font-bold text-white">Trainingsstatistik</h1>
          </div>
        </div>
        <nav className="flex justify-around sm:justify-start sm:px-4 border-b border-gray-600">
          <TabButton tabName="overview" label="Trainings" icon="fa-calendar-days" />
          <TabButton tabName="management" label="Verwaltung" icon="fa-users-cog" />
          <TabButton tabName="statistics" label="Statistiken" icon="fa-chart-pie" />
        </nav>
      </header>

      <main className="flex-grow container mx-auto p-4 sm:p-6">
        {renderTabContent()}
      </main>
    </div>
  );
};

export default App;