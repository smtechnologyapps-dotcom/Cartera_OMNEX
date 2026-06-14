import React, { useState } from 'react';
import { signInWithGoogle } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { Wallet, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const { setDemoUser } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      const user = await signInWithGoogle();
      if (user?.uid === 'demo-user-123') {
        setDemoUser(user);
      }
      navigate('/');
    } catch (err: any) {
      setError('Error al iniciar sesión con Google. Intenta nuevamente.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', position: 'relative', overflow: 'hidden' }}>
      {/* Animated Background Elements */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '24rem', height: '24rem', background: 'var(--color-primary-glow)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none' }}></div>
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '24rem', height: '24rem', background: 'var(--color-accent-omnex-glow)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none' }}></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass-panel"
        style={{ maxWidth: '28rem', width: '100%', padding: '2rem', position: 'relative', zIndex: 10 }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            style={{
              width: '5rem', height: '5rem', margin: '0 auto 1.5rem', background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent-omnex))', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}
          >
            <Wallet size={40} color="white" />
          </motion.div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Cartera <span className="text-gradient">OMNEX</span></h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Gestiona tus ingresos y gastos de forma inteligente.</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.5)', color: '#fca5a5', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.875rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <button 
          onClick={handleGoogleSignIn}
          className="btn-primary"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '0.75rem', fontSize: '1.125rem' }}
        >
          <LogIn size={20} />
          Continuar con Google
        </button>

        <p style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          Plataforma privada para gestión financiera OMNEX & Personal.
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
