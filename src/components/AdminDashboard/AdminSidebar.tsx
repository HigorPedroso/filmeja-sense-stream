
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart, 
  Users, 
  FileText, 
  Settings, 
  TrendingUp, 
  Mail, 
  Coins,
  CalendarDays
} from 'lucide-react';

const AdminSidebar = () => {
  return (
    <aside className="bg-black/40 backdrop-blur-lg w-64 border-r border-gray-800 hidden md:flex flex-col h-screen sticky top-0 left-0">
      <div className="p-6">
        <Link to="/super" className="text-2xl font-bold text-filmeja-purple flex items-center">
          <span className="mr-1">Super</span>
          <span className="text-white">Dash</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-6">
        <div className="space-y-1">
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Analytics
          </p>
          <Link to="/super" className="flex items-center px-4 py-3 text-white hover:bg-white/5 rounded-lg group transition-colors">
            <BarChart className="h-5 w-5 mr-3 text-filmeja-purple" />
            <span>Dashboard</span>
          </Link>
          <Link to="/super/users" className="flex items-center px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg group transition-colors">
            <Users className="h-5 w-5 mr-3 text-gray-400 group-hover:text-filmeja-purple" />
            <span>Usuários</span>
          </Link>
          <Link to="/super/analytics" className="flex items-center px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg group transition-colors">
            <TrendingUp className="h-5 w-5 mr-3 text-gray-400 group-hover:text-filmeja-purple" />
            <span>Analytics</span>
          </Link>
          
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-6 mb-2">
            Conteúdo
          </p>
          <Link to="/super/recommendations" className="flex items-center px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg group transition-colors">
            <FileText className="h-5 w-5 mr-3 text-gray-400 group-hover:text-filmeja-purple" />
            <span>Recomendações</span>
          </Link>
          <Link to="/super/calendar" className="flex items-center px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg group transition-colors">
            <CalendarDays className="h-5 w-5 mr-3 text-gray-400 group-hover:text-filmeja-purple" />
            <span>Calendário</span>
          </Link>
          
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-6 mb-2">
            Operacional
          </p>
          <Link to="/super/messages" className="flex items-center px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg group transition-colors">
            <Mail className="h-5 w-5 mr-3 text-gray-400 group-hover:text-filmeja-purple" />
            <span>Mensagens</span>
          </Link>
          <Link to="/super/finances" className="flex items-center px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg group transition-colors">
            <Coins className="h-5 w-5 mr-3 text-gray-400 group-hover:text-filmeja-purple" />
            <span>Financeiro</span>
          </Link>
          <Link to="/super/settings" className="flex items-center px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg group transition-colors">
            <Settings className="h-5 w-5 mr-3 text-gray-400 group-hover:text-filmeja-purple" />
            <span>Configurações</span>
          </Link>
        </div>
      </nav>
      
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-filmeja-purple rounded-full flex items-center justify-center text-white font-medium">
            A
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">Admin</p>
            <p className="text-xs text-gray-400">admin@filmeja.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
