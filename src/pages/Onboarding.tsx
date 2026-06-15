import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { saveUserProfile } from '../services/db';
import type { UserProfile } from '../services/db';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const Onboarding: React.FC = () => {
  const { currentUser, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: currentUser?.displayName || '',
    businessName: '',
    phone: '',
    country: 'Panamá',
    themeColor: '#8b5cf6', // Default purple
    monthlyBudget: '2000'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSubmitting(true);
    try {
      const newProfile: UserProfile = {
        userId: currentUser.uid || currentUser.id,
        fullName: formData.fullName,
        businessName: formData.businessName,
        phone: formData.phone,
        country: formData.country,
        themeColor: formData.themeColor,
        monthlyBudget: Number(formData.monthlyBudget),
        categories: [
          { id: '1', name: 'Negocio', type: 'gasto', color: formData.themeColor, subCategories: ['Inventario', 'Suscripciones', 'Marketing'] },
          { id: '2', name: 'Personal', type: 'gasto', color: '#ec4899', subCategories: ['Hogar', 'Comida', 'Transporte'] },
          { id: '3', name: 'Ventas', type: 'ingreso', color: '#10b981', subCategories: ['Productos', 'Servicios'] }
        ]
      };

      await saveUserProfile(newProfile);
      await refreshProfile();
      navigate('/');
    } catch (error) {
      console.error(error);
      alert('Error guardando perfil');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-dark p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full opacity-20 blur-[100px]" style={{ background: formData.themeColor }}></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-500 rounded-full opacity-10 blur-[100px]"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel w-full max-w-md p-8 relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: `linear-gradient(135deg, ${formData.themeColor}, #000)` }}>
            <span className="text-2xl font-bold text-white">O</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Bienvenido a tu Billetera</h1>
          <p className="text-text-muted text-sm">Vamos a configurar tu espacio de trabajo para empezar a gestionar tus finanzas.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Nombre Completo</label>
            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="form-input" required placeholder="Ej. Juan Pérez" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Nombre de tu Negocio / Emprendimiento</label>
            <input type="text" name="businessName" value={formData.businessName} onChange={handleChange} className="form-input" required placeholder="Ej. Mi Tienda" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Teléfono</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="form-input" placeholder="+507..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">País</label>
              <select name="country" value={formData.country} onChange={handleChange} className="form-input">
                <option value="Panamá">Panamá</option>
                <option value="Colombia">Colombia</option>
                <option value="México">México</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Presupuesto Mensual Base (USD)</label>
            <input type="number" name="monthlyBudget" value={formData.monthlyBudget} onChange={handleChange} className="form-input" required min="1" step="0.01" />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Color de Tema (Personalización)</label>
            <div className="flex justify-between">
              {['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'].map(color => (
                <div 
                  key={color}
                  onClick={() => setFormData(prev => ({ ...prev, themeColor: color }))}
                  className="w-10 h-10 rounded-full cursor-pointer transition-transform border-2"
                  style={{ 
                    background: color, 
                    borderColor: formData.themeColor === color ? 'white' : 'transparent',
                    transform: formData.themeColor === color ? 'scale(1.1)' : 'scale(1)'
                  }}
                />
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full text-white font-bold py-3 rounded-xl transition-all hover-relief mt-6 flex justify-center items-center gap-2"
            style={{ background: formData.themeColor }}
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Comenzar'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Onboarding;
