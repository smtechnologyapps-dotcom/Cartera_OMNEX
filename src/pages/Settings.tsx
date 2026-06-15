import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { saveUserProfile } from '../services/db';
import type { CustomCategory } from '../services/db';
import { motion } from 'framer-motion';
import { Save, Plus, Trash2, Loader2, Edit2, X } from 'lucide-react';

const Settings: React.FC = () => {
  const { userProfile, refreshProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Profile State
  const [formData, setFormData] = useState({
    fullName: userProfile?.fullName || '',
    businessName: userProfile?.businessName || '',
    phone: userProfile?.phone || '',
    country: userProfile?.country || 'Panamá',
    themeColor: userProfile?.themeColor || '#8b5cf6',
    monthlyBudget: userProfile?.monthlyBudget?.toString() || '2000'
  });

  // Categories State
  const [categories, setCategories] = useState<CustomCategory[]>(userProfile?.categories || []);
  const [editingCategory, setEditingCategory] = useState<CustomCategory | null>(null);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setIsSubmitting(true);
    try {
      await saveUserProfile({
        ...userProfile,
        fullName: formData.fullName,
        businessName: formData.businessName,
        phone: formData.phone,
        country: formData.country,
        themeColor: formData.themeColor,
        monthlyBudget: Number(formData.monthlyBudget),
        categories: categories // save updated categories too
      });
      await refreshProfile();
      alert('Configuración guardada exitosamente');
    } catch (error) {
      console.error(error);
      alert('Error al guardar la configuración');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addNewCategory = () => {
    const newCat: CustomCategory = {
      id: Date.now().toString(),
      name: 'Nueva Categoría',
      type: 'gasto',
      color: '#3b82f6',
      subCategories: []
    };
    setCategories([...categories, newCat]);
    setEditingCategory(newCat);
  };

  const deleteCategory = (id: string) => {
    if(window.confirm('¿Estás seguro de eliminar esta categoría? Las transacciones previas la conservarán como texto.')) {
      setCategories(categories.filter(c => c.id !== id));
      if (editingCategory?.id === id) setEditingCategory(null);
    }
  };

  const updateCategory = (id: string, updates: Partial<CustomCategory>) => {
    setCategories(categories.map(c => c.id === id ? { ...c, ...updates } : c));
    if (editingCategory?.id === id) {
      setEditingCategory({ ...editingCategory, ...updates });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto w-full pb-10"
    >
      <h1 className="text-3xl font-bold mb-8">Configuración</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Profile Settings */}
        <div className="glass-panel p-6">
          <h2 className="text-xl font-bold mb-6 border-b border-white/10 pb-4">Perfil y Negocio</h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Nombre Completo</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleProfileChange} className="form-input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Nombre del Negocio</label>
              <input type="text" name="businessName" value={formData.businessName} onChange={handleProfileChange} className="form-input" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Teléfono</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleProfileChange} className="form-input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">País</label>
                <select name="country" value={formData.country} onChange={handleProfileChange} className="form-input">
                  <option value="Panamá">Panamá</option>
                  <option value="Colombia">Colombia</option>
                  <option value="México">México</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Presupuesto Mensual (USD)</label>
              <input type="number" name="monthlyBudget" value={formData.monthlyBudget} onChange={handleProfileChange} className="form-input" required min="1" step="0.01" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Color del Tema</label>
              <div className="flex gap-4 flex-wrap">
                {['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'].map(color => (
                  <div 
                    key={color}
                    onClick={() => setFormData(prev => ({ ...prev, themeColor: color }))}
                    className="w-8 h-8 rounded-full cursor-pointer transition-transform border-2"
                    style={{ 
                      background: color, 
                      borderColor: formData.themeColor === color ? 'white' : 'transparent',
                      transform: formData.themeColor === color ? 'scale(1.2)' : 'scale(1)'
                    }}
                  />
                ))}
              </div>
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="btn-primary w-full mt-6 flex justify-center items-center gap-2 hover-relief"
              style={{ background: formData.themeColor }}
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              Guardar Perfil
            </button>
          </form>
        </div>

        {/* Categories Settings */}
        <div className="glass-panel p-6 flex flex-col h-[600px]">
          <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
            <h2 className="text-xl font-bold">Tus Categorías</h2>
            <button 
              onClick={addNewCategory}
              className="text-xs flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus size={14} /> Nueva
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {categories.map(cat => (
              <div key={cat.id} className="bg-white/5 border border-white/5 p-3 rounded-lg flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ background: cat.color }}></div>
                  <div>
                    <p className="font-semibold">{cat.name}</p>
                    <p className="text-xs text-text-muted">{cat.type === 'ingreso' ? 'Ingreso' : 'Gasto'} • {cat.subCategories.length} subcategorías</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingCategory(cat)} className="p-2 hover:bg-white/10 rounded-lg text-blue-400 transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => deleteCategory(cat.id)} className="p-2 hover:bg-white/10 rounded-lg text-red-400 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel w-full max-w-md p-6 relative"
          >
            <button onClick={() => setEditingCategory(null)} className="absolute top-4 right-4 text-text-muted hover:text-white">
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold mb-6">Editar Categoría</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Nombre</label>
                <input 
                  type="text" 
                  value={editingCategory.name} 
                  onChange={(e) => updateCategory(editingCategory.id, { name: e.target.value })} 
                  className="form-input" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Tipo</label>
                  <select 
                    value={editingCategory.type} 
                    onChange={(e) => updateCategory(editingCategory.id, { type: e.target.value as 'ingreso' | 'gasto' })}
                    className="form-input"
                  >
                    <option value="gasto">Gasto</option>
                    <option value="ingreso">Ingreso</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Color</label>
                  <input 
                    type="color" 
                    value={editingCategory.color} 
                    onChange={(e) => updateCategory(editingCategory.id, { color: e.target.value })} 
                    className="w-full h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Subcategorías (separadas por coma)</label>
                <textarea 
                  value={editingCategory.subCategories.join(', ')} 
                  onChange={(e) => updateCategory(editingCategory.id, { subCategories: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  className="form-input h-24"
                  placeholder="Ej. Ropa, Comida, Transporte"
                />
              </div>

              <button 
                onClick={() => setEditingCategory(null)}
                className="w-full btn-primary mt-4"
                style={{ background: formData.themeColor }}
              >
                Hecho
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default Settings;
