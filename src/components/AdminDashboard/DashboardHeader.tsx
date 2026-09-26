import React from 'react';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ title, subtitle }) => {
  return (
    <header className="pb-6 border-b border-gray-800">
      <h1 className="text-3xl font-bold text-white">{title}</h1>
      {subtitle && <p className="text-gray-400 mt-1">{subtitle}</p>}
    </header>
  );
};

export default DashboardHeader;
