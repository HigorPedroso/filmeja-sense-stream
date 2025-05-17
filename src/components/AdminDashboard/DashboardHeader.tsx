
import React from 'react';
import { Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ title, subtitle }) => {
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-800">
      <div>
        <h1 className="text-3xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-gray-400 mt-1">{subtitle}</p>}
      </div>
      
      <div className="mt-4 md:mt-0 flex items-center space-x-4">
        <div className="relative hidden md:block">
          <input
            type="text"
            placeholder="Buscar..."
            className="bg-black/30 border border-gray-700 rounded-lg px-10 py-2 w-64 text-white focus:outline-none focus:border-filmeja-purple transition-colors"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
        </div>
        
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </Button>
        
        <Button className="bg-filmeja-purple hover:bg-filmeja-purple/90">
          Exportar Relatório
        </Button>
      </div>
    </header>
  );
};

export default DashboardHeader;
