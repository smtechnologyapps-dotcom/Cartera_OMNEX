import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, List, LogOut, Wallet, ShieldAlert } from 'lucide-react';
import { logout } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC = () => {
  const { currentUser, setDemoUser } = useAuth();

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

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar Desktop / Bottom Nav Mobile */}
      <nav className="glass-panel" style={{ 
        display: 'flex', flexDirection: 'column', padding: '1.5rem 1rem', 
        width: '250px', borderLeft: 'none', borderTop: 'none', borderBottom: 'none', 
        borderRadius: '0 24px 24px 0', zIndex: 10,
        position: 'fixed', top: 0, bottom: 0, left: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem', padding: '0 1rem' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent-omnex))', padding: '0.5rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wallet size={24} color="white" />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>OMNEX <span style={{color: 'var(--color-primary)'}}>Wallet</span></span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <NavLink to="/" style={({isActive}) => ({
            display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', 
            borderRadius: 'var(--radius-md)', textDecoration: 'none',
            color: isActive ? 'white' : 'var(--color-text-muted)',
            background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
            borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
            fontWeight: isActive ? 600 : 500,
            transition: 'all 0.2s ease'
          })}>
            <LayoutDashboard size={20} />
            Tablero
          </NavLink>
          
          <NavLink to="/add" style={({isActive}) => ({
            display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', 
            borderRadius: 'var(--radius-md)', textDecoration: 'none',
            color: isActive ? 'white' : 'var(--color-text-muted)',
            background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
            borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
            fontWeight: isActive ? 600 : 500,
            transition: 'all 0.2s ease'
          })}>
            <PlusCircle size={20} />
            Nueva Transacción
          </NavLink>

          <NavLink to="/transactions" style={({isActive}) => ({
            display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', 
            borderRadius: 'var(--radius-md)', textDecoration: 'none',
            color: isActive ? 'white' : 'var(--color-text-muted)',
            background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
            borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
            fontWeight: isActive ? 600 : 500,
            transition: 'all 0.2s ease'
          })}>
            <List size={20} />
            Historial
          </NavLink>

          <NavLink to="/audit" style={({isActive}) => ({
            display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', 
            borderRadius: 'var(--radius-md)', textDecoration: 'none',
            color: isActive ? 'white' : 'var(--color-text-muted)',
            background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
            borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
            fontWeight: isActive ? 600 : 500,
            transition: 'all 0.2s ease'
          })}>
            <ShieldAlert size={20} />
            Auditoría
          </NavLink>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 1rem', marginBottom: '1rem' }}>
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="Profile" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
            ) : (
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-bg-light)' }}></div>
            )}
            <div style={{ fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentUser?.displayName || 'Usuario'}
            </div>
          </div>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', padding: '0.75rem 1rem', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', transition: 'background 0.2s ease' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main style={{ marginLeft: '250px', flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
