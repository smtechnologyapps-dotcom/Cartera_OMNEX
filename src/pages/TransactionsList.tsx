import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserTransactions } from '../services/db';
import type { Transaction } from '../services/db';
import { motion } from 'framer-motion';
import { Search, Filter, ExternalLink } from 'lucide-react';

const TransactionsList: React.FC = () => {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

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
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>Factura</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s ease' }} className="hover:bg-white/5">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TransactionsList;
