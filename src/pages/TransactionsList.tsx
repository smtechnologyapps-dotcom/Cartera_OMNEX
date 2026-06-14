import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserTransactions, updateTransaction, softDeleteTransaction } from '../services/db';
import type { Transaction } from '../services/db';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, ExternalLink, MoreVertical, Edit2, Trash2, X, AlertTriangle } from 'lucide-react';

const TransactionsList: React.FC = () => {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [filterType, setFilterType] = useState(searchParams.get('filter') || 'all');
  const [searchTerm, setSearchTerm] = useState('');

  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editReason, setEditReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getUserTransactions(currentUser!.uid);
      setTransactions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || t.type === filterType || t.category === filterType;
    return matchesSearch && matchesType;
  });

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx || !editingTx.id || !currentUser || !editReason.trim()) return;
    setIsSubmitting(true);
    try {
      await updateTransaction(editingTx.id, {
        amount: editingTx.amount,
        description: editingTx.description,
        category: editingTx.category,
        subCategory: editingTx.subCategory
      }, currentUser.uid, editReason);
      setEditingTx(null);
      setEditReason('');
      loadData();
    } catch (error) {
      alert("Error al editar la transacción");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletingTx || !deletingTx.id || !currentUser || !deleteReason.trim()) return;
    setIsSubmitting(true);
    try {
      await softDeleteTransaction(deletingTx.id, currentUser.uid, deleteReason);
      setDeletingTx(null);
      setDeleteReason('');
      loadData();
    } catch (error) {
      alert("Error al eliminar la transacción");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Historial de Transacciones</h1>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.5rem', width: '200px' }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Filter size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
            <select 
              className="form-input" 
              style={{ paddingLeft: '2.5rem', width: '150px', appearance: 'none' }}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">Todas</option>
              <option value="ingreso">Ingresos</option>
              <option value="gasto">Gastos</option>
              <option value="OMNEX">OMNEX</option>
              <option value="Personal/Hijos">Personal</option>
            </select>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Cargando transacciones...</div>
        ) : filteredTransactions.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No se encontraron transacciones.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--color-text-muted)' }}>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>Fecha</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>Descripción</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>Categoría</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>Monto</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s ease' }} className="hover:bg-white/5 relative">
                    <td style={{ padding: '1rem 1.5rem' }}>
                      {tx.date instanceof Date ? tx.date.toLocaleDateString() : tx.date.toDate().toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{tx.description}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
                        <span style={{ 
                          padding: '0.25rem 0.75rem', 
                          borderRadius: '1rem', 
                          fontSize: '0.75rem',
                          background: tx.category === 'OMNEX' ? 'rgba(139, 92, 246, 0.2)' : tx.category === 'Personal/Hijos' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                          color: tx.category === 'OMNEX' ? 'var(--color-accent-omnex)' : tx.category === 'Personal/Hijos' ? 'var(--color-accent-personal)' : 'var(--color-success)'
                        }}>
                          {tx.category}
                        </span>
                        {tx.subCategory && <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{tx.subCategory}</span>}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 600, color: tx.type === 'ingreso' ? 'var(--color-success)' : 'var(--color-text-main)' }}>
                      {tx.type === 'ingreso' ? '+' : '-'}${tx.amount.toFixed(2)}
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      {tx.invoiceUrl ? (
                        <a href={tx.invoiceUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', textDecoration: 'none' }}>
                          <ExternalLink size={16} /> Ver
                        </a>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>N/A</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', position: 'relative' }}>
                      <button 
                        onClick={() => setOpenMenuId(openMenuId === tx.id! ? null : tx.id!)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                      >
                        <MoreVertical size={20} className="text-text-muted" />
                      </button>
                      
                      {openMenuId === tx.id && (
                        <div className="absolute right-8 top-12 bg-card border border-border/50 rounded-lg shadow-xl z-50 overflow-hidden w-40">
                          <button 
                            onClick={() => { setEditingTx({...tx}); setOpenMenuId(null); }}
                            className="w-full flex items-center gap-2 p-3 hover:bg-white/5 text-left transition-colors"
                          >
                            <Edit2 size={16} className="text-blue-400" /> Editar
                          </button>
                          <button 
                            onClick={() => { setDeletingTx({...tx}); setOpenMenuId(null); }}
                            className="w-full flex items-center gap-2 p-3 hover:bg-red-500/20 text-left text-red-400 transition-colors border-t border-border/50"
                          >
                            <Trash2 size={16} /> Eliminar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE EDICIÓN */}
      {editingTx && (
        <div className="fixed inset-0 bg-black/80 z-[999] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card w-full max-w-lg rounded-2xl p-6 border border-border/50 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2"><Edit2 className="text-blue-400"/> Editar Transacción</h3>
              <button onClick={() => setEditingTx(null)} className="text-text-muted hover:text-white"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-text-muted mb-1">Monto ($)</label>
                <input 
                  type="number" step="0.01" required
                  value={editingTx.amount}
                  onChange={(e) => setEditingTx({...editingTx, amount: Number(e.target.value)})}
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1">Descripción</label>
                <input 
                  type="text" required
                  value={editingTx.description}
                  onChange={(e) => setEditingTx({...editingTx, description: e.target.value})}
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1">Motivo de Edición (Auditoría)</label>
                <textarea 
                  required rows={2}
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="Ej. Corrección de monto equivocado"
                  className="form-input border-blue-500/30 focus:border-blue-500"
                />
              </div>
              <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL DE ELIMINACIÓN */}
      {deletingTx && (
        <div className="fixed inset-0 bg-black/80 z-[999] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card w-full max-w-md rounded-2xl p-6 border border-red-500/30 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-red-400 flex items-center gap-2"><AlertTriangle /> Eliminar Transacción</h3>
              <button onClick={() => setDeletingTx(null)} className="text-text-muted hover:text-white"><X size={24}/></button>
            </div>
            
            <p className="text-sm text-text-muted mb-4">
              Estás a punto de eliminar la transacción de <strong>${deletingTx.amount} ({deletingTx.description})</strong>.
              Esta acción quedará registrada en la bitácora de auditoría.
            </p>

            <form onSubmit={handleDeleteSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-text-muted mb-1">Motivo de Eliminación (Requerido)</label>
                <textarea 
                  required rows={2}
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Ej. Transacción duplicada"
                  className="form-input border-red-500/30 focus:border-red-500"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setDeletingTx(null)} className="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors font-medium">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors font-medium flex justify-center">
                  {isSubmitting ? 'Eliminando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default TransactionsList;
