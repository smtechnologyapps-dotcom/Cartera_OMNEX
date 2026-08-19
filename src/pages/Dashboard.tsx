import { useState, useMemo, useEffect } from 'react';
import { FileText, TrendingUp, TrendingDown, Users, PieChart as PieChartIcon, BarChart2, Calendar, Trophy, Image as ImageIcon, X, Sparkles, BrainCircuit } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { getUserTransactions, getClients, getInvoices } from '../services/db';
import type { Transaction, Client, Invoice } from '../services/db';

const COLORS = ['#00c896', '#0a3d62', '#8b5cf6', '#ec4899', '#f59e0b', '#3b82f6', '#10b981', '#f43f5e'];

export default function Dashboard() {
  const { currentUser, userProfile } = useAuth();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  const [viewScope, setViewScope] = useState<'All' | 'Empresa' | 'Personal'>('All');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  
  const currentYear = new Date().getFullYear();
  const defaultStart = new Date(currentYear, 0, 1).toISOString().split('T')[0];
  const defaultEnd = new Date(currentYear, 11, 31).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    try {
      const uid = currentUser!.uid || (currentUser as any).id;
      const [txData, clientData, invoiceData] = await Promise.all([
        getUserTransactions(uid),
        getClients(uid),
        getInvoices(uid)
      ]);
      setTransactions(txData);
      setClients(clientData);
      setInvoices(invoiceData);
    } catch (error) {
      console.error("Error loading dashboard data", error);
    }
  };

  const pendingInvoices = invoices.filter(i => i.status === 'Emitted' || i.status === 'Draft').length;

  const dateFilteredTransactions = useMemo(() => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime() + 86400000;
    return transactions.filter(t => {
      // Handle Firebase Timestamp or normal Date
      const tTime = (t.date as any).toMillis ? (t.date as any).toMillis() : new Date(t.date as Date).getTime();
      return tTime >= start && tTime < end;
    });
  }, [transactions, startDate, endDate]);

  const scopedTransactions = useMemo(() => {
    if (viewScope === 'All') return dateFilteredTransactions;
    return dateFilteredTransactions.filter(t => t.scope === viewScope || (!t.scope && viewScope === 'Empresa'));
  }, [dateFilteredTransactions, viewScope]);

  const income = scopedTransactions.filter(t => t.type === 'ingreso').reduce((acc, curr) => acc + curr.amount, 0);
  const expense = scopedTransactions.filter(t => t.type === 'gasto').reduce((acc, curr) => acc + curr.amount, 0);

  const globalIncome = dateFilteredTransactions.filter(t => t.type === 'ingreso').reduce((acc, curr) => acc + curr.amount, 0);
  const globalExpense = dateFilteredTransactions.filter(t => t.type === 'gasto').reduce((acc, curr) => acc + curr.amount, 0);

  const expensePercentage = globalIncome > 0 ? (globalExpense / globalIncome) * 100 : 0;
  const suggestedSalary = globalIncome * 0.50; 
  
  const getHealthStatus = () => {
    if (globalIncome === 0) return { msg: 'Registra tus primeros ingresos para comenzar tu análisis financiero.', color: 'text-omnex-gray', bar: 'bg-omnex-gray' };
    if (expensePercentage <= 50) return { msg: `¡Salud financiera excelente! Tus gastos son solo el ${expensePercentage.toFixed(1)}% de tus ingresos. Tienes un gran margen de ahorro e inversión.`, color: 'text-omnex-teal', bar: 'bg-omnex-teal' };
    if (expensePercentage <= 80) return { msg: `Vas por buen camino, tus gastos representan el ${expensePercentage.toFixed(1)}%. Intenta no superar el 80% para evitar estrés financiero.`, color: 'text-yellow-400', bar: 'bg-yellow-400' };
    return { msg: `¡Cuidado! Estás consumiendo el ${expensePercentage.toFixed(1)}% de lo que generas. Revisa el desglose y considera recortar los "gastos hormiga".`, color: 'text-red-400', bar: 'bg-red-500' };
  };
  const healthStatus = getHealthStatus();

  const expensesByCategory = useMemo(() => {
    const expenses = scopedTransactions.filter(t => t.type === 'gasto');
    const grouped = expenses.reduce((acc, curr) => {
      const cat = curr.category || 'Sin Categoría';
      acc[cat] = (acc[cat] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [scopedTransactions]);

  const monthlyData = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();
    scopedTransactions.forEach(tx => {
      const d = new Date((tx.date as any).toMillis ? (tx.date as any).toMillis() : tx.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map.has(key)) map.set(key, { income: 0, expense: 0 });
      const m = map.get(key)!;
      if (tx.type === 'ingreso') m.income += tx.amount;
      else m.expense += tx.amount;
    });
    return Array.from(map.entries()).sort((a,b) => a[0].localeCompare(b[0])).map(([k, v]) => {
      const [y, m] = k.split('-');
      const name = new Date(parseInt(y), parseInt(m)-1).toLocaleString('es', { month: 'short' }).toUpperCase();
      return { name, Ingresos: v.income, Egresos: v.expense };
    });
  }, [scopedTransactions]);

  const drilldownTransactions = useMemo(() => {
    if (!selectedCategory && !selectedMonth) return [];
    return scopedTransactions.filter(t => {
      if (selectedCategory) return t.category === selectedCategory && t.type === 'gasto';
      if (selectedMonth) {
        const d = new Date((t.date as any).toMillis ? (t.date as any).toMillis() : t.date);
        const m = d.toLocaleString('es', { month: 'short' }).toUpperCase();
        return m === selectedMonth;
      }
      return false;
    }).sort((a, b) => {
      const timeA = (a.date as any).toMillis ? (a.date as any).toMillis() : new Date(a.date as Date).getTime();
      const timeB = (b.date as any).toMillis ? (b.date as any).toMillis() : new Date(b.date as Date).getTime();
      return timeB - timeA;
    });
  }, [scopedTransactions, selectedCategory, selectedMonth]);

  const top5Business = useMemo(() => {
    return dateFilteredTransactions
      .filter(t => t.type === 'gasto' && (t.scope === 'Empresa' || !t.scope))
      .sort((a, b) => b.amount - a.amount).slice(0, 5);
  }, [dateFilteredTransactions]);
  
  const top5Personal = useMemo(() => {
    return dateFilteredTransactions
      .filter(t => t.type === 'gasto' && t.scope === 'Personal')
      .sort((a, b) => b.amount - a.amount).slice(0, 5);
  }, [dateFilteredTransactions]);

  if (!userProfile) return <div className="text-omnex-light text-center py-20">Cargando tablero...</div>;

  return (
    <div className="space-y-6">
      
      {/* HEADER & FILTERS */}
      <header className="mb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-omnex-black/40 p-4 border border-omnex-gray/20 rounded-2xl backdrop-blur-md">
        <div>
          <h1 className="text-3xl font-bold text-omnex-light">Dashboard</h1>
          <p className="text-omnex-gray mt-1 text-sm">Resumen financiero de {userProfile.businessName || userProfile.fullName}</p>
        </div>
        
        <div className="flex flex-wrap lg:flex-nowrap gap-4 items-center">
          
          <div className="flex items-center gap-2 bg-omnex-black/60 p-1.5 rounded-xl border border-omnex-gray/20">
            <Calendar className="text-omnex-teal ml-2" size={16} />
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-sm text-omnex-light outline-none ml-1" />
            <span className="text-omnex-gray">-</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-sm text-omnex-light outline-none mr-1" />
          </div>

          <div className="flex p-1 bg-omnex-black/60 rounded-xl border border-omnex-gray/20">
            <button onClick={() => { setViewScope('All'); setSelectedCategory(null); setSelectedMonth(null); }} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${viewScope === 'All' ? 'bg-omnex-gray/20 text-omnex-light' : 'text-omnex-gray hover:text-omnex-light'}`}>
              Global
            </button>
            <button onClick={() => { setViewScope('Empresa'); setSelectedCategory(null); setSelectedMonth(null); }} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${viewScope === 'Empresa' ? 'bg-blue-500/20 text-blue-400' : 'text-omnex-gray hover:text-omnex-light'}`}>
              🏢 Empresa
            </button>
            <button onClick={() => { setViewScope('Personal'); setSelectedCategory(null); setSelectedMonth(null); }} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${viewScope === 'Personal' ? 'bg-purple-500/20 text-purple-400' : 'text-omnex-gray hover:text-omnex-light'}`}>
              👤 Personal
            </button>
          </div>
        </div>
      </header>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* GLOBAL TOTALS */}
        <div className="bg-gradient-to-br from-omnex-teal/20 to-omnex-black/40 border border-omnex-teal/30 backdrop-blur-md rounded-2xl p-6 flex flex-col hover:shadow-[0_0_20px_rgba(0,200,150,0.15)] transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-omnex-teal/10 rounded-xl">
              <TrendingUp className="text-omnex-teal w-6 h-6" />
            </div>
            <span className="text-[10px] uppercase font-bold bg-omnex-teal/20 text-omnex-teal px-2 py-1 rounded-full">Global</span>
          </div>
          <p className="text-omnex-gray text-sm font-medium">Ingreso Total (Global)</p>
          <h2 className="text-3xl font-black text-omnex-light mt-1">${globalIncome.toFixed(2)}</h2>
        </div>

        <div className="bg-gradient-to-br from-red-500/20 to-omnex-black/40 border border-red-500/30 backdrop-blur-md rounded-2xl p-6 flex flex-col hover:shadow-[0_0_20px_rgba(239,68,68,0.15)] transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-red-500/10 rounded-xl">
              <TrendingDown className="text-red-400 w-6 h-6" />
            </div>
            <span className="text-[10px] uppercase font-bold bg-red-500/20 text-red-400 px-2 py-1 rounded-full">Global</span>
          </div>
          <p className="text-omnex-gray text-sm font-medium">Egreso Total (Global)</p>
          <h2 className="text-3xl font-black text-omnex-light mt-1">${globalExpense.toFixed(2)}</h2>
        </div>

        {/* FACTURAS Y CLIENTES */}
        <div className="grid grid-rows-2 gap-4">
          <div className="bg-omnex-black/40 border border-omnex-green/20 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 hover:border-omnex-green/50 transition-all duration-300">
            <div className="p-3 bg-omnex-green/10 rounded-xl shrink-0">
              <FileText className="text-omnex-green w-6 h-6" />
            </div>
            <div>
              <p className="text-omnex-gray text-xs font-medium">Facturas Pendientes</p>
              <h2 className="text-xl font-bold text-omnex-light">{pendingInvoices}</h2>
            </div>
          </div>
          <div className="bg-omnex-black/40 border border-omnex-gray/20 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 hover:border-omnex-gray/50 transition-all duration-300">
            <div className="p-3 bg-omnex-gray/10 rounded-xl shrink-0">
              <Users className="text-omnex-gray w-6 h-6" />
            </div>
            <div>
              <p className="text-omnex-gray text-xs font-medium">Total Clientes</p>
              <h2 className="text-xl font-bold text-omnex-light">{clients.length}</h2>
            </div>
          </div>
        </div>
        
        {/* SCOPED TOTALS (ONLY IF NOT GLOBAL) */}
        {viewScope !== 'All' && (
          <>
            <div className={`bg-omnex-black/40 border backdrop-blur-md rounded-2xl p-6 flex flex-col transition-all duration-300 ${viewScope === 'Empresa' ? 'border-blue-500/20 hover:border-blue-500/50' : 'border-purple-500/20 hover:border-purple-500/50'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${viewScope === 'Empresa' ? 'bg-blue-500/10' : 'bg-purple-500/10'}`}>
                  <TrendingUp className={`w-6 h-6 ${viewScope === 'Empresa' ? 'text-blue-400' : 'text-purple-400'}`} />
                </div>
                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${viewScope === 'Empresa' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>{viewScope}</span>
              </div>
              <p className="text-omnex-gray text-sm font-medium">Ingresos ({viewScope})</p>
              <h2 className="text-2xl font-bold text-omnex-light mt-1">${income.toFixed(2)}</h2>
            </div>

            <div className={`bg-omnex-black/40 border backdrop-blur-md rounded-2xl p-6 flex flex-col transition-all duration-300 ${viewScope === 'Empresa' ? 'border-blue-500/20 hover:border-blue-500/50' : 'border-purple-500/20 hover:border-purple-500/50'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${viewScope === 'Empresa' ? 'bg-blue-500/10' : 'bg-purple-500/10'}`}>
                  <TrendingDown className={`w-6 h-6 ${viewScope === 'Empresa' ? 'text-blue-400' : 'text-purple-400'}`} />
                </div>
                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${viewScope === 'Empresa' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>{viewScope}</span>
              </div>
              <p className="text-omnex-gray text-sm font-medium">Egresos ({viewScope})</p>
              <h2 className="text-2xl font-bold text-omnex-light mt-1">${expense.toFixed(2)}</h2>
            </div>
          </>
        )}
      </div>

      {/* ASISTENTE FINANCIERO OMNEX */}
      <div className="bg-gradient-to-r from-[#00c896]/10 via-omnex-black/60 to-purple-500/10 border border-omnex-teal/30 backdrop-blur-md rounded-2xl p-6 relative overflow-hidden group hover:border-omnex-teal/50 transition-all duration-500 shadow-[0_0_30px_rgba(0,200,150,0.05)]">
        <div className="absolute -top-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
          <BrainCircuit size={200} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center md:items-start">
          <div className="p-4 bg-gradient-to-br from-omnex-teal/20 to-transparent border border-omnex-teal/20 rounded-2xl shrink-0">
             <Sparkles size={40} className="text-omnex-teal" />
          </div>
          <div className="flex-1 space-y-4 w-full">
            <div>
              <h3 className="text-xl font-bold text-omnex-light flex items-center gap-2">
                Asesor Financiero OMNEX
              </h3>
              <p className={`font-medium mt-1 ${healthStatus.color}`}>{healthStatus.msg}</p>
            </div>
            
            {globalIncome > 0 && (
              <>
                <div className="mt-2 bg-omnex-black/40 rounded-full h-2 overflow-hidden border border-omnex-gray/20">
                  <div 
                    className={`h-full transition-all duration-1000 ease-out ${healthStatus.bar}`}
                    style={{ width: `${Math.min(expensePercentage, 100)}%` }}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="bg-omnex-black/60 border border-omnex-teal/20 p-4 rounded-xl hover:bg-omnex-teal/5 transition-colors">
                    <p className="text-xs text-omnex-gray font-bold uppercase mb-1 tracking-wider">Salario Sugerido (Regla 50/30/20)</p>
                    <p className="text-3xl font-black text-omnex-light">${suggestedSalary.toFixed(2)}</p>
                    <p className="text-xs text-omnex-gray mt-2 leading-relaxed">Presupuesto recomendado para cubrir tus <strong className="text-omnex-light">necesidades personales básicas</strong> (vivienda, comida, transporte).</p>
                  </div>
                  <div className="bg-omnex-black/60 border border-omnex-gray/20 p-4 rounded-xl hover:bg-omnex-gray/5 transition-colors">
                    <p className="text-xs text-omnex-gray font-bold uppercase mb-1 tracking-wider">Margen Disponible (50%)</p>
                    <p className="text-3xl font-black text-omnex-light">${(globalIncome - suggestedSalary).toFixed(2)}</p>
                    <p className="text-xs text-omnex-gray mt-2 leading-relaxed">Divídelo entre <strong className="text-omnex-light">ahorro, inversión de tu negocio y gastos recreativos</strong> o deseos.</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Tendencia Mensual */}
        <div className="bg-omnex-black/30 border border-omnex-gray/10 backdrop-blur-md rounded-2xl p-6 flex flex-col">
          <h3 className="text-xl font-bold text-omnex-light mb-2 flex items-center gap-2">
            <BarChart2 className="text-omnex-teal" size={20}/>
            Flujo Mensual
          </h3>
          <p className="text-omnex-gray text-sm mb-6">Comparativa de ingresos vs egresos mes a mes</p>
          
          <div className="flex-1 min-h-[300px] w-full relative">
            {monthlyData.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-omnex-gray">No hay transacciones en estas fechas.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#121212', borderColor: '#333', borderRadius: '8px' }} formatter={(v: any) => `$${Number(v).toFixed(2)}`} />
                  <Legend verticalAlign="top" height={36}/>
                  <Bar dataKey="Ingresos" fill="#00c896" radius={[4, 4, 0, 0]} barSize={30} className="cursor-pointer hover:opacity-80 transition-opacity" onClick={(data: any) => {
                    setSelectedMonth(prev => prev === data.name ? null : data.name);
                    setSelectedCategory(null);
                  }} />
                  <Bar dataKey="Egresos" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={30} className="cursor-pointer hover:opacity-80 transition-opacity" onClick={(data: any) => {
                    setSelectedMonth(prev => prev === data.name ? null : data.name);
                    setSelectedCategory(null);
                  }} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Distribución de Gastos */}
        <div className="bg-omnex-black/30 border border-omnex-gray/10 backdrop-blur-md rounded-2xl p-6 flex flex-col">
          <h3 className="text-xl font-bold text-omnex-light mb-2 flex items-center gap-2">
            <PieChartIcon className="text-omnex-teal" size={20}/>
            Distribución de Gastos
          </h3>
          <p className="text-omnex-gray text-sm mb-6">Identifica puntos de fuga (Gastos Hormiga)</p>
          
          <div className="flex-1 min-h-[300px] w-full relative">
            {expensesByCategory.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-omnex-gray">No hay gastos registrados en estas fechas.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expensesByCategory} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value" onClick={(data: any) => {
                    setSelectedCategory(prev => prev === data.name ? null : data.name);
                    setSelectedMonth(null);
                  }}>
                    {expensesByCategory.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="cursor-pointer hover:opacity-80 transition-opacity" />)}
                  </Pie>
                  <Tooltip formatter={(value: any) => `$${Number(value).toFixed(2)}`} contentStyle={{ backgroundColor: '#121212', borderColor: '#333', borderRadius: '8px' }} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* DRILLDOWN / DETALLES DE GRAFICO */}
      {(selectedCategory || selectedMonth) && (
        <div className="bg-omnex-black/40 border border-omnex-teal/30 backdrop-blur-md rounded-2xl p-6 shadow-[0_0_20px_rgba(0,200,150,0.05)] transition-all animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-omnex-light flex items-center gap-2">
              <FileText className="text-omnex-teal" size={20}/>
              Desglose: {selectedCategory ? `Categoría "${selectedCategory}"` : `Mes "${selectedMonth}"`}
            </h3>
            <button onClick={() => { setSelectedCategory(null); setSelectedMonth(null); }} className="text-omnex-gray hover:text-omnex-light text-sm px-3 py-1 bg-omnex-gray/10 hover:bg-omnex-gray/20 rounded-full transition-colors">
              ✕ Cerrar
            </button>
          </div>
          
          {drilldownTransactions.length === 0 ? (
            <p className="text-omnex-gray">No hay transacciones que coincidan con la selección.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {drilldownTransactions.map(tx => (
                <div key={tx.id} onClick={() => setSelectedTx(tx)} className="cursor-pointer bg-omnex-black/60 border border-omnex-gray/20 hover:border-omnex-teal/50 hover:shadow-[0_0_15px_rgba(0,200,150,0.1)] rounded-xl p-4 transition-all group">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${tx.type === 'ingreso' ? 'bg-omnex-teal/20 text-omnex-teal' : 'bg-red-500/20 text-red-400'}`}>
                      {tx.type === 'ingreso' ? 'Ingreso' : 'Egreso'}
                    </span>
                    <span className="text-xs text-omnex-gray">{new Date((tx.date as any).toMillis ? (tx.date as any).toMillis() : tx.date).toLocaleDateString()}</span>
                  </div>
                  <h4 className="font-bold text-omnex-light text-sm line-clamp-1 group-hover:text-omnex-teal transition-colors">{tx.description}</h4>
                  <p className="text-xs text-omnex-gray mt-1">{tx.category}</p>
                  <div className="flex justify-between items-center mt-3">
                    <p className={`text-lg font-bold ${tx.type === 'ingreso' ? 'text-omnex-teal' : 'text-red-400'}`}>
                      {tx.type === 'ingreso' ? '+' : '-'}${tx.amount.toFixed(2)}
                    </p>
                    {tx.invoiceUrl && <ImageIcon size={16} className="text-omnex-gray" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TOP 5 EXPENSES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top 5 Empresa */}
        <div className="bg-omnex-black/30 border border-blue-500/20 backdrop-blur-md rounded-2xl p-6">
          <h3 className="text-xl font-bold text-omnex-light mb-4 flex items-center gap-2">
            <Trophy className="text-blue-400" size={20}/>
            Top 5 Mayores Gastos (Empresa)
          </h3>
          {top5Business.length === 0 ? (
            <p className="text-omnex-gray py-4">No hay gastos de empresa en este periodo.</p>
          ) : (
            <div className="space-y-3">
              {top5Business.map((t, idx) => (
                <div key={t.id} className="flex justify-between items-center p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
                  <div className="flex gap-3 items-center">
                    <span className="text-blue-400 font-bold text-lg w-4">{idx + 1}</span>
                    <div className="flex flex-col">
                      <span className="font-medium text-omnex-light text-sm">{t.description}</span>
                      <span className="text-[10px] text-omnex-gray">{new Date((t.date as any).toMillis ? (t.date as any).toMillis() : t.date).toLocaleDateString()} • {t.category}</span>
                    </div>
                  </div>
                  <span className="font-bold text-red-400">-${t.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top 5 Personal */}
        <div className="bg-omnex-black/30 border border-purple-500/20 backdrop-blur-md rounded-2xl p-6">
          <h3 className="text-xl font-bold text-omnex-light mb-4 flex items-center gap-2">
            <Trophy className="text-purple-400" size={20}/>
            Top 5 Mayores Gastos (Personal)
          </h3>
          {top5Personal.length === 0 ? (
            <p className="text-omnex-gray py-4">No hay gastos personales en este periodo.</p>
          ) : (
            <div className="space-y-3">
              {top5Personal.map((t, idx) => (
                <div key={t.id} className="flex justify-between items-center p-3 bg-purple-500/5 rounded-xl border border-purple-500/10">
                  <div className="flex gap-3 items-center">
                    <span className="text-purple-400 font-bold text-lg w-4">{idx + 1}</span>
                    <div className="flex flex-col">
                      <span className="font-medium text-omnex-light text-sm">{t.description}</span>
                      <span className="text-[10px] text-omnex-gray">{new Date((t.date as any).toMillis ? (t.date as any).toMillis() : t.date).toLocaleDateString()} • {t.category}</span>
                    </div>
                  </div>
                  <span className="font-bold text-red-400">-${t.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Modal Detalle de Transacción */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#121212] border border-omnex-teal/30 rounded-2xl w-full max-w-md shadow-2xl shadow-omnex-teal/10 relative flex flex-col">
            <button 
              onClick={() => setSelectedTx(null)}
              className="absolute top-4 right-4 text-omnex-gray hover:text-red-400 transition-all p-1 bg-omnex-black/50 rounded-full"
            >
              <X size={20} />
            </button>
            <div className="p-6 border-b border-omnex-gray/20">
              <h2 className="text-xl font-bold text-omnex-light pr-8">Detalle de {selectedTx.type === 'ingreso' ? 'Ingreso' : 'Egreso'}</h2>
            </div>
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="flex justify-between items-center bg-omnex-black/60 p-4 rounded-xl border border-omnex-gray/20">
                <span className="text-omnex-gray text-sm">Monto Total</span>
                <span className={`text-2xl font-bold ${selectedTx.type === 'ingreso' ? 'text-omnex-teal' : 'text-red-400'}`}>
                  ${selectedTx.amount.toFixed(2)}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs text-omnex-gray mb-1">Fecha</span>
                  <span className="text-omnex-light font-medium">{new Date((selectedTx.date as any).toMillis ? (selectedTx.date as any).toMillis() : selectedTx.date).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="block text-xs text-omnex-gray mb-1">Categoría</span>
                  <span className="text-omnex-light font-medium">{selectedTx.category}</span>
                </div>
              </div>

              <div>
                <span className="block text-xs text-omnex-gray mb-1">Descripción</span>
                <p className="text-omnex-light bg-omnex-black/60 p-3 rounded-xl border border-omnex-gray/20 leading-relaxed">{selectedTx.description}</p>
              </div>

              {selectedTx.invoiceUrl && (
                <div>
                  <span className="block text-xs text-omnex-gray mb-2">Comprobante Adjunto</span>
                  <div className="p-2 border border-omnex-gray/20 rounded-xl bg-black/50">
                    <img src={selectedTx.invoiceUrl} alt="Recibo" className="w-full h-auto max-h-64 object-contain rounded-lg" />
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-omnex-gray/20 bg-omnex-black/30 rounded-b-2xl">
                <button onClick={() => setSelectedTx(null)} className="w-full py-3 bg-omnex-teal/10 hover:bg-omnex-teal/20 text-omnex-teal font-bold rounded-xl transition-colors">
                  Cerrar Detalles
                </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
