import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { PlusCircle, ArrowLeftRight, LogOut, ShieldAlert, Settings as SettingsIcon, Users, FileText, Home } from 'lucide-react';
import { logout } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC = () => {
  const { currentUser, setDemoUser } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      if (currentUser?.uid === 'demo-user-123') {
        setDemoUser(null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const navItems = [
    { name: 'Inicio', path: '/', icon: Home },
    { name: 'Nueva', path: '/add', icon: PlusCircle },
    { name: 'Caja', path: '/transactions', icon: ArrowLeftRight },
    { name: 'Clientes', path: '/clients', icon: Users },
    { name: 'Documentos', path: '/invoices', icon: FileText },
    { name: 'Auditoría', path: '/audit', icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen bg-omnex-black flex flex-col md:flex-row text-omnex-light font-sans">
      
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-72 bg-omnex-dark border-r border-omnex-teal/10">
        <div className="p-8 flex items-center justify-start">
          <div className="font-sans text-3xl font-bold text-omnex-light tracking-widest flex items-center gap-2">
            <div className="w-8 h-8 bg-omnex-teal rounded-lg flex items-center justify-center text-omnex-black text-xl">O</div>
            <span><span className="text-omnex-teal">OMN</span>EX</span>
          </div>
        </div>
        <nav className="flex-1 px-4 py-2 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${
                  isActive 
                    ? 'bg-omnex-teal text-omnex-black shadow-[0_0_20px_rgba(0,200,150,0.3)] font-bold' 
                    : 'text-omnex-gray hover:bg-omnex-teal/10 hover:text-omnex-teal'
                }`}
              >
                <item.icon size={22} className={isActive ? 'text-omnex-black' : 'group-hover:scale-110 transition-transform'} />
                <span className="text-lg">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="p-6 border-t border-omnex-gray/10 flex flex-col gap-2">
          <NavLink to="/settings" className="flex items-center gap-4 px-6 py-4 rounded-2xl w-full text-omnex-gray hover:bg-omnex-teal/10 hover:text-omnex-teal transition-all group">
            <SettingsIcon size={22} className="group-hover:rotate-90 transition-transform duration-500" />
            <span className="text-lg">Configuración</span>
          </NavLink>
          <button onClick={handleLogout} className="flex items-center gap-4 px-6 py-4 rounded-2xl w-full text-omnex-gray hover:bg-red-500/10 hover:text-red-400 transition-all group">
            <LogOut size={22} className="group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="text-lg">Salir</span>
          </button>
        </div>
      </aside>

      {/* Header (Mobile) */}
      <header className="md:hidden flex items-center justify-between p-6 bg-omnex-dark border-b border-omnex-teal/10 sticky top-0 z-20">
        <div className="font-sans text-2xl font-bold text-omnex-light tracking-widest flex items-center gap-2">
          <div className="w-6 h-6 bg-omnex-teal rounded flex items-center justify-center text-omnex-black text-sm">O</div>
          <span><span className="text-omnex-teal">OMN</span>EX</span>
        </div>
        <NavLink to="/settings" className="p-2 text-omnex-gray hover:text-omnex-light">
          <SettingsIcon size={24} />
        </NavLink>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-0 relative bg-[#0a0a0a]">
        {/* Background Decorative Blur */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-omnex-teal/5 blur-[120px] rounded-full pointer-events-none hidden md:block"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-omnex-navy/10 blur-[120px] rounded-full pointer-events-none hidden md:block"></div>
        
        <div className="p-4 md:p-12 mx-auto max-w-7xl relative">
          <Outlet />
        </div>
      </main>

      {/* Bottom Nav (Mobile) */}
      <nav className="md:hidden fixed bottom-0 w-full bg-omnex-black/90 backdrop-blur-lg border-t border-omnex-gray/20 pb-safe z-20">
        <div className="flex items-center justify-around p-3">
          {navItems.slice(0, 5).map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                  isActive 
                    ? 'text-omnex-teal' 
                    : 'text-omnex-gray hover:text-omnex-light'
                }`}
              >
                <item.icon size={20} className={isActive ? 'animate-bounce' : ''} />
                <span className="text-[10px] uppercase font-bold tracking-wider">{item.name}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

    </div>
  );
};

export default Layout;
