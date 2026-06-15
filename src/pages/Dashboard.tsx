import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserTransactions } from '../services/db';
import type { Transaction } from '../services/db';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Briefcase, ChevronRight, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(null);

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

  // Calculate Metrics
  const totalIncome = transactions.filter(t => t.type === 'ingreso').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'gasto').reduce((acc, t) => acc + t.amount, 0);
  const omnexExpense = transactions.filter(t => t.type === 'gasto' && t.category === 'OMNEX').reduce((acc, t) => acc + t.amount, 0);
  const personalExpense = transactions.filter(t => t.type === 'gasto' && t.category === 'Personal/Hijos').reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Calculate Top 5 Expenses for the current month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const topExpenses = transactions
    .filter(t => {
      const d = t.date instanceof Date ? t.date : t.date.toDate();
      return t.type === 'gasto' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Chart Data preparation
  // Group by date
  const expensesByDate = transactions
    .filter(t => t.type === 'gasto' && (!activeCategoryFilter || t.category === activeCategoryFilter))
    .reduce((acc: any, t) => {
      const dateStr = (t.date instanceof Date ? t.date : t.date.toDate()).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
      if (!acc[dateStr]) acc[dateStr] = 0;
      acc[dateStr] += t.amount;
      return acc;
    }, {});

  const areaData = Object.keys(expensesByDate).map(date => ({
    date,
    Gasto: expensesByDate[date]
  })).reverse(); // Assuming descending from query, reverse for chronological

  const pieData = [
    { name: 'OMNEX', value: omnexExpense, color: 'var(--color-accent-omnex)' },
    { name: 'Personal/Hijos', value: personalExpense, color: 'var(--color-accent-personal)' }
  ];

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>Cargando tablero...</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Hola, {currentUser?.displayName?.split(' ')[0] || 'Usuario'} 👋</h1>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div 
          className="glass-panel hover:bg-white/5 cursor-pointer hover-relief" 
          style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}
          onClick={() => navigate('/transactions?filter=all')}
        >
          <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '1rem', borderRadius: '50%', color: 'var(--color-primary)' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Balance Total</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>${balance.toFixed(2)}</h3>
          </div>
          <ChevronRight size={16} className="text-text-muted absolute right-4 top-1/2 -translate-y-1/2" />
        </div>

        <div 
          className="glass-panel hover:bg-white/5 cursor-pointer hover-relief" 
          style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}
          onClick={() => navigate('/transactions?filter=ingreso')}
        >
          <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '50%', color: 'var(--color-success)' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Ingresos</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>${totalIncome.toFixed(2)}</h3>
          </div>
          <ChevronRight size={16} className="text-text-muted absolute right-4 top-1/2 -translate-y-1/2" />
        </div>

        <div 
          className="glass-panel hover:bg-white/5 cursor-pointer hover-relief" 
          style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}
          onClick={() => navigate('/transactions?filter=OMNEX')}
        >
          <div style={{ background: 'rgba(139, 92, 246, 0.2)', padding: '1rem', borderRadius: '50%', color: 'var(--color-accent-omnex)' }}>
            <Briefcase size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Gastos OMNEX</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>${omnexExpense.toFixed(2)}</h3>
          </div>
          <ChevronRight size={16} className="text-text-muted absolute right-4 top-1/2 -translate-y-1/2" />
        </div>

        <div 
          className="glass-panel hover:bg-white/5 cursor-pointer hover-relief" 
          style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}
          onClick={() => navigate('/transactions?filter=Personal/Hijos')}
        >
          <div style={{ background: 'rgba(236, 72, 153, 0.2)', padding: '1rem', borderRadius: '50%', color: 'var(--color-accent-personal)' }}>
            <TrendingDown size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Gastos Personales</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>${personalExpense.toFixed(2)}</h3>
          </div>
          <ChevronRight size={16} className="text-text-muted absolute right-4 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', minHeight: '350px' }}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold m-0">Tendencia de Gastos</h3>
            {activeCategoryFilter && (
              <button 
                onClick={() => setActiveCategoryFilter(null)}
                className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full text-text-muted transition-colors hover-relief"
              >
                Viendo: {activeCategoryFilter === 'Personal/Hijos' ? 'Personal' : activeCategoryFilter} ✕
              </button>
            )}
          </div>
          {areaData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="colorGasto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} 
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="Gasto" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorGasto)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
             <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '250px', color: 'var(--color-text-muted)' }}>No hay suficientes datos.</div>
          )}
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', minHeight: '350px' }}>
          <h3 className="mb-6 font-semibold m-0">Distribución (Clickea para filtrar tendencia)</h3>
          {(omnexExpense > 0 || personalExpense > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setActiveCategoryFilter(entry.name)}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} 
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: any) => `$${Number(value).toFixed(2)}`}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '250px', color: 'var(--color-text-muted)' }}>No hay suficientes datos.</div>
          )}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem' }}>
            <div 
              className={`flex items-center gap-2 cursor-pointer transition-opacity ${activeCategoryFilter && activeCategoryFilter !== 'OMNEX' ? 'opacity-50' : 'opacity-100'}`}
              onClick={() => setActiveCategoryFilter(activeCategoryFilter === 'OMNEX' ? null : 'OMNEX')}
            >
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--color-accent-omnex)' }}></div>
              <span style={{ fontSize: '0.875rem' }}>OMNEX</span>
            </div>
            <div 
              className={`flex items-center gap-2 cursor-pointer transition-opacity ${activeCategoryFilter && activeCategoryFilter !== 'Personal/Hijos' ? 'opacity-50' : 'opacity-100'}`}
              onClick={() => setActiveCategoryFilter(activeCategoryFilter === 'Personal/Hijos' ? null : 'Personal/Hijos')}
            >
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--color-accent-personal)' }}></div>
              <span style={{ fontSize: '0.875rem' }}>Personal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top 5 Expenses Ranking */}
      <div className="glass-panel mt-8 p-6">
        <h3 className="mb-4 font-bold flex items-center gap-2 text-lg">
          <Award className="text-yellow-500" /> Top 5 Gastos del Mes
        </h3>
        
        {topExpenses.length > 0 ? (
          <div className="space-y-3">
            {topExpenses.map((tx, idx) => (
              <div key={tx.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm">
                    #{idx + 1}
                  </div>
                  <div>
                    <p className="font-semibold">{tx.description}</p>
                    <p className="text-xs text-text-muted">
                      {tx.category} {tx.subCategory ? `• ${tx.subCategory}` : ''}
                    </p>
                  </div>
                </div>
                <div className="font-bold text-red-400">
                  ${tx.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-text-muted text-center py-4">Aún no hay gastos registrados este mes.</p>
        )}
      </div>

    </motion.div>
  );
};

export default Dashboard;
