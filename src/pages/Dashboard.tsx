import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserTransactions } from '../services/db';
import type { Transaction } from '../services/db';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, ChevronRight, Award, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (currentUser && userProfile) {
      loadData();
    }
  }, [currentUser, userProfile]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getUserTransactions(currentUser!.uid || currentUser!.id);
      setTransactions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !userProfile) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>Cargando tablero...</div>;
  }

  // Calculate Metrics
  const totalIncome = transactions.filter(t => t.type === 'ingreso').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'gasto').reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Dynamic Expenses by Category
  const expenseCategories = userProfile.categories.filter(c => c.type === 'gasto');
  const expensesByCategory = expenseCategories.map(cat => ({
    ...cat,
    total: transactions.filter(t => t.type === 'gasto' && t.category === cat.name).reduce((acc, t) => acc + t.amount, 0)
  }));

  // Budget Calculations
  const budget = userProfile.monthlyBudget || 2000;
  // Solo consideramos los gastos del mes actual para el presupuesto
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const currentMonthExpenses = transactions
    .filter(t => t.type === 'gasto' && (t.date instanceof Date ? t.date : t.date.toDate()).getMonth() === currentMonth && (t.date instanceof Date ? t.date : t.date.toDate()).getFullYear() === currentYear)
    .reduce((acc, t) => acc + t.amount, 0);

  const budgetPercent = Math.min((currentMonthExpenses / budget) * 100, 100);
  let budgetColor = 'var(--color-success)';
  let budgetMessage = 'Tu presupuesto está bajo control. ¡Buen trabajo!';
  if (budgetPercent >= 90) {
    budgetColor = 'var(--color-danger)';
    budgetMessage = '¡Peligro! Has consumido casi todo tu presupuesto. Verifica cada compra y su urgencia.';
  } else if (budgetPercent >= 70) {
    budgetColor = 'var(--color-warning)';
    budgetMessage = 'Precaución: Tu presupuesto está llegando a su límite.';
  }

  // Calculate Top 5 Expenses for the current month
  const topExpenses = transactions
    .filter(t => {
      const d = t.date instanceof Date ? t.date : t.date.toDate();
      return t.type === 'gasto' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Chart Data preparation
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
  })).reverse();

  const pieData = expensesByCategory.map(cat => ({
    name: cat.name,
    value: cat.total,
    color: cat.color
  }));

  const dateFormatter = new Intl.DateTimeFormat('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="flex flex-col md:flex-row md:justify-between md:align-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Hola {userProfile.fullName.split(' ')[0]} <span className="text-text-muted font-normal">({userProfile.businessName})</span> 👋
          </h1>
          <p className="text-text-muted text-lg">Vamos a revisar cómo están las finanzas hoy.</p>
        </div>
        <div className="flex items-center gap-2 text-text-muted bg-white/5 px-4 py-2 rounded-full self-start">
          <Clock size={16} />
          <span className="capitalize">{dateFormatter.format(currentDate)}</span>
        </div>
      </div>

      {/* Budget Section */}
      <div className="glass-panel mb-8 p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full" style={{ background: budgetColor }}></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <div>
            <h3 className="text-xl font-bold mb-1">Presupuesto Mensual</h3>
            <p className="text-text-muted text-sm" style={{ color: budgetPercent >= 90 ? budgetColor : 'var(--color-text-muted)' }}>{budgetMessage}</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold">${currentMonthExpenses.toFixed(2)}</span>
            <span className="text-text-muted"> / ${budget.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="w-full bg-bg-dark h-4 rounded-full overflow-hidden mb-2">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${budgetPercent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: budgetColor }}
          />
        </div>
        <div className="flex justify-between text-xs text-text-muted">
          <span>0%</span>
          <span style={{ color: budgetPercent >= 90 ? budgetColor : 'var(--color-text-muted)', fontWeight: budgetPercent >= 90 ? 'bold' : 'normal' }}>
            {budgetPercent.toFixed(1)}% Consumido
          </span>
          <span>100%</span>
        </div>
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
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Ingresos Totales</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>${totalIncome.toFixed(2)}</h3>
          </div>
          <ChevronRight size={16} className="text-text-muted absolute right-4 top-1/2 -translate-y-1/2" />
        </div>

        {expensesByCategory.map(cat => (
          <div 
            key={cat.id}
            className="glass-panel hover:bg-white/5 cursor-pointer hover-relief" 
            style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}
            onClick={() => navigate(`/transactions?filter=${encodeURIComponent(cat.name)}`)}
          >
            <div style={{ background: `${cat.color}33`, padding: '1rem', borderRadius: '50%', color: cat.color }}>
              <TrendingDown size={24} />
            </div>
            <div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Gastos {cat.name}</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>${cat.total.toFixed(2)}</h3>
            </div>
            <ChevronRight size={16} className="text-text-muted absolute right-4 top-1/2 -translate-y-1/2" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div className="flex justify-between items-center mb-6">
            <h3 style={{ fontWeight: 600 }}>Tendencia de Gastos</h3>
            {activeCategoryFilter && (
              <button 
                onClick={() => setActiveCategoryFilter(null)}
                className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition-colors flex items-center gap-1"
              >
                Viendo: {activeCategoryFilter} <span className="ml-1">✕</span>
              </button>
            )}
          </div>
          
          {areaData.length > 0 ? (
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaData}>
                  <defs>
                    <linearGradient id="colorGasto" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={activeCategoryFilter ? expensesByCategory.find(c => c.name === activeCategoryFilter)?.color : userProfile.themeColor} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={activeCategoryFilter ? expensesByCategory.find(c => c.name === activeCategoryFilter)?.color : userProfile.themeColor} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={12} tickMargin={10} />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickFormatter={(val) => `$${val}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-bg-light)', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Gasto" 
                    stroke={activeCategoryFilter ? expensesByCategory.find(c => c.name === activeCategoryFilter)?.color : userProfile.themeColor} 
                    fillOpacity={1} 
                    fill="url(#colorGasto)" 
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', color: 'var(--color-text-muted)' }}>
              No hay datos para esta vista
            </div>
          )}
        </div>

        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontWeight: 600, textAlign: 'center' }}>Distribución (Clickea para filtrar tendencia)</h3>
          {pieData.some(d => d.value > 0) ? (
            <div style={{ height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    onClick={(data) => {
                      if (data && data.name) {
                        setActiveCategoryFilter(activeCategoryFilter === data.name ? null : data.name);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {pieData.filter(d => d.value > 0).map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        style={{ 
                          outline: 'none', 
                          opacity: (activeCategoryFilter && activeCategoryFilter !== entry.name) ? 0.3 : 1,
                          transition: 'opacity 0.3s ease'
                        }} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-bg-light)', border: 'none', borderRadius: '8px' }}
                    formatter={(value: any) => `$${Number(value).toFixed(2)}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '250px', color: 'var(--color-text-muted)' }}>No hay suficientes datos.</div>
          )}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            {expensesByCategory.map(cat => (
              <div 
                key={cat.id}
                className={`flex items-center gap-2 cursor-pointer transition-opacity ${activeCategoryFilter && activeCategoryFilter !== cat.name ? 'opacity-50' : 'opacity-100'}`}
                onClick={() => setActiveCategoryFilter(activeCategoryFilter === cat.name ? null : cat.name)}
              >
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: cat.color }}></div>
                <span style={{ fontSize: '0.875rem' }}>{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top 5 Expenses Ranking */}
      <div className="glass-panel" style={{ marginTop: '2rem', padding: '1.5rem', overflowX: 'auto' }}>
        <h3 style={{ marginBottom: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem' }}>
          <Award color="#eab308" size={20} /> Top 5 Gastos del Mes
        </h3>
        
        {topExpenses.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '400px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                <th style={{ padding: '0.75rem 1rem', width: '50px' }}>#</th>
                <th style={{ padding: '0.75rem 1rem' }}>Descripción</th>
                <th style={{ padding: '0.75rem 1rem' }}>Categoría</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {topExpenses.map((tx, idx) => {
                const cat = userProfile.categories.find(c => c.name === tx.category);
                return (
                  <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s ease' }} className="hover:bg-white/5">
                    <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>{idx + 1}</td>
                    <td style={{ padding: '1rem', fontWeight: 500 }}>{tx.description}</td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '1rem', 
                          fontSize: '0.75rem',
                          background: cat ? `${cat.color}33` : 'rgba(255,255,255,0.1)',
                          color: cat ? cat.color : '#fff'
                        }}>
                          {tx.category}
                        </span>
                        {tx.subCategory && <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{tx.subCategory}</span>}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--color-danger)', textAlign: 'right' }}>
                      ${tx.amount.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '1rem 0' }}>Aún no hay gastos registrados este mes.</p>
        )}
      </div>

    </motion.div>
  );
};

export default Dashboard;
