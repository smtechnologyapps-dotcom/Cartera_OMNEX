import React, { useState } from 'react';
import { 
  Zap, 
  RefreshCw, 
  DollarSign, 
  BarChart3, 
  Cpu, 
  Radar, 
  Sparkles
} from 'lucide-react';

interface MarketAsset {
  symbol: string;
  name: string;
  category: 'RWA / Token' | 'Wall Street' | 'Crypto Infra';
  price: number;
  change24h: number;
  verdict: 'COMPRA FUERTE' | 'ACUMULAR' | 'VIGILANCIA';
  entryZone: string;
  targetPrice: string;
  stopLoss: string;
  potentialReturn: string;
  riskLevel: 'Bajo' | 'Moderado' | 'Alto';
  advisorVerdict: string;
  catalyst: string;
}

export const MarketRadar: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'RWA' | 'EQUITIES'>('ALL');
  const [investCapital, setInvestCapital] = useState<number>(500);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Hoy, en tiempo real');

  const assets: MarketAsset[] = [
    {
      symbol: 'ONDO',
      name: 'Ondo Finance (Líder RWA Tokenización)',
      category: 'RWA / Token',
      price: 0.88,
      change24h: 4.8,
      verdict: 'COMPRA FUERTE',
      entryZone: '$0.82 - $0.88',
      targetPrice: '$1.45 - $2.10',
      stopLoss: '$0.74',
      potentialReturn: '+65% a +140%',
      riskLevel: 'Moderado',
      advisorVerdict: 'Es la opción de compra número 1 en tokenización. Tienen alianza directa con el fondo BUIDL de BlackRock y custodian deuda soberana de EE.UU. en la blockchain. Si el mercado de RWA sigue creciendo hacia los $50,000 millones, ONDO multiplicará su valor por captura de liquidez institucional.',
      catalyst: 'Adopción bancaria de Wall Street y entrada masiva de fondos institucionales a bonos tokenizados.'
    },
    {
      symbol: 'HOOD',
      name: 'Robinhood Markets Inc.',
      category: 'Wall Street',
      price: 34.50,
      change24h: 3.2,
      verdict: 'COMPRA FUERTE',
      entryZone: '$32.00 - $34.50',
      targetPrice: '$48.00 - $60.00',
      stopLoss: '$29.50',
      potentialReturn: '+40% a +75%',
      riskLevel: 'Moderado',
      advisorVerdict: 'Robinhood es la pasarela que está democratizando las acciones 24/7 y la tokenización para millones de inversionistas jóvenes en EE.UU. y Europa. Sus volúmenes de transacción rompieron récords este trimestre y sus ingresos por custodia crecen a doble dígito.',
      catalyst: 'Expansión de la red Robinhood Chain para acciones fraccionales negociables las 24 horas.'
    },
    {
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      category: 'Wall Street',
      price: 138.20,
      change24h: 1.9,
      verdict: 'ACUMULAR',
      entryZone: '$130.00 - $138.00',
      targetPrice: '$175.00 - $190.00',
      stopLoss: '$122.00',
      potentialReturn: '+28% a +38%',
      riskLevel: 'Bajo',
      advisorVerdict: 'El rey indiscutible de los centros de datos de IA a nivel global. Los chips Blackwell tienen su producción vendida para los próximos 12 meses. Es una opción de compra sólida de crecimiento patrimonial seguro para proteger su capital.',
      catalyst: 'Demanda insaciable de computación por parte de Microsoft, Google, Meta y OpenAI.'
    },
    {
      symbol: 'LINK',
      name: 'Chainlink (Oráculo Global de Bancos)',
      category: 'Crypto Infra',
      price: 14.10,
      change24h: 2.7,
      verdict: 'ACUMULAR',
      entryZone: '$13.20 - $14.10',
      targetPrice: '$24.00 - $32.00',
      stopLoss: '$11.80',
      potentialReturn: '+70% a +125%',
      riskLevel: 'Moderado',
      advisorVerdict: 'Ningún banco o bolsa (incluyendo SWIFT y DTCC) puede tokenizar activos sin usar Chainlink como puente de datos y verificación de reservas. Es la infraestructura silenciosa que cobra peaje por cada dólar tokenizado en el mundo.',
      catalyst: 'Integración en producción del protocolo CCIP con las mayores redes interbancarias.'
    }
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastUpdated(new Date().toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' }) + ' (Actualizado)');
    }, 1200);
  };

  const filteredAssets = assets.filter(asset => {
    if (selectedFilter === 'RWA') return asset.category === 'RWA / Token';
    if (selectedFilter === 'EQUITIES') return asset.category === 'Wall Street';
    return true;
  });

  return (
    <div className="space-y-8 animate-fadeIn text-omnex-light">
      {/* 🏛️ Encabezado Ejecutivo del Espía */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-omnex-teal/10 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-omnex-teal/10 border border-omnex-teal/30 flex items-center justify-center text-omnex-teal shadow-[0_0_15px_rgba(0,200,150,0.2)]">
              <Radar className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-wide flex items-center gap-2 text-white">
                Radar Espía & Asesor de Inversión
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-omnex-teal/20 text-omnex-teal border border-omnex-teal/40">
                  En Vivo 24/7
                </span>
              </h1>
              <p className="text-xs md:text-sm text-omnex-gray">
                Inteligencia de movimientos internacionales y opciones de compra reales con su capital.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-omnex-dark border border-omnex-teal/20 text-sm font-semibold text-omnex-teal hover:bg-omnex-teal/10 transition-all shadow-sm"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Escaneando...' : 'Escanear Mercado'}</span>
          </button>
          <div className="text-right text-xs text-omnex-gray hidden sm:block">
            <span>Sincronización:</span>
            <p className="font-mono text-omnex-teal">{lastUpdated}</p>
          </div>
        </div>
      </div>

      {/* 🤖 Dictamen del Asesor Comercial OMNEX */}
      <div className="rounded-3xl p-6 md:p-8 bg-gradient-to-br from-[#0c1e2a] via-omnex-dark to-[#091522] border border-omnex-teal/30 shadow-[0_10px_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-omnex-teal/5 blur-[90px] rounded-full pointer-events-none"></div>
        <div className="flex items-start gap-4 md:gap-6 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-omnex-teal text-omnex-black flex items-center justify-center font-black text-2xl shadow-[0_0_20px_rgba(0,200,150,0.4)] shrink-0">
            Ω
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-omnex-teal bg-omnex-teal/10 px-3 py-1 rounded-full border border-omnex-teal/20">
                Dictamen Ejecutivo del Asesor
              </span>
              <span className="text-xs text-omnex-gray font-mono">• Para el Señor Omar</span>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-white leading-snug">
              "El mercado está en fase de acumulación alcista. La mayor oportunidad con sus $500 está en la convergencia de Wall Street con la Tokenización (RWA)."
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              No estamos en momento de perseguir apuestas dudosas. Las opciones de compra reales con mayor ratio beneficio/riesgo son <strong>Ondo Finance (ONDO)</strong> y <strong>Robinhood (HOOD)</strong>, complementadas con <strong>NVIDIA (NVDA)</strong> para estabilidad. Los datos en cadena indican que las tesorerías de Wall Street siguen volcando liquidez hacia bonos y acciones tokenizadas.
            </p>
          </div>
        </div>
      </div>

      {/* 💡 Simulador de Asignación Táctica para sus $500 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 rounded-2xl p-6 bg-omnex-dark border border-omnex-teal/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-bold text-omnex-gray tracking-wider">Fondo de Inversión Táctico</span>
              <DollarSign className="w-5 h-5 text-omnex-teal" />
            </div>
            <div className="text-3xl font-black text-white font-mono tracking-tight mb-2">
              ${investCapital.toFixed(2)}
            </div>
            <p className="text-xs text-omnex-gray leading-relaxed mb-4">
              Capital disponible para desplegar con la estrategia de diversificación agresiva y bola de nieve.
            </p>
          </div>
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-omnex-gray">Ajustar capital para simular:</span>
            <div className="flex gap-2">
              {[300, 500, 1000].map(val => (
                <button
                  key={val}
                  onClick={() => setInvestCapital(val)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    investCapital === val 
                      ? 'bg-omnex-teal text-omnex-black shadow-sm' 
                      : 'bg-omnex-black/60 text-omnex-gray border border-white/5 hover:text-white'
                  }`}
                >
                  ${val}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 rounded-2xl p-6 bg-omnex-dark border border-omnex-teal/10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-omnex-teal" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">
              Asignación Recomendada por el Asesor (Diversificación Óptima)
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-omnex-black/60 border border-omnex-teal/20">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-bold text-omnex-teal">40% Asalto RWA</span>
                <span className="text-gray-400 font-mono">${(investCapital * 0.40).toFixed(2)}</span>
              </div>
              <p className="text-[11px] text-gray-300 font-medium">Ondo Finance (ONDO)</p>
              <span className="text-[10px] text-gray-500 block mt-1">Multiplicador por superciclo</span>
            </div>

            <div className="p-4 rounded-xl bg-omnex-black/60 border border-omnex-teal/20">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-bold text-omnex-teal">35% Wall Street 24/7</span>
                <span className="text-gray-400 font-mono">${(investCapital * 0.35).toFixed(2)}</span>
              </div>
              <p className="text-[11px] text-gray-300 font-medium">Robinhood (HOOD)</p>
              <span className="text-[10px] text-gray-500 block mt-1">Crecimiento en bolsa real</span>
            </div>

            <div className="p-4 rounded-xl bg-omnex-black/60 border border-omnex-teal/20">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-bold text-omnex-teal">25% Ancla Tecnológica</span>
                <span className="text-gray-400 font-mono">${(investCapital * 0.25).toFixed(2)}</span>
              </div>
              <p className="text-[11px] text-gray-300 font-medium">NVIDIA (NVDA)</p>
              <span className="text-[10px] text-gray-500 block mt-1">Seguridad patrimonial</span>
            </div>
          </div>
        </div>
      </div>

      {/* 🎯 Selector de Filtros */}
      <div className="flex items-center gap-2 border-b border-omnex-gray/10 pb-4">
        {[
          { id: 'ALL', label: 'Todas las Opciones' },
          { id: 'RWA', label: 'Tokens RWA / Deuda' },
          { id: 'EQUITIES', label: 'Acciones de Bolsa' }
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setSelectedFilter(filter.id as any)}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
              selectedFilter === filter.id
                ? 'bg-omnex-teal text-omnex-black shadow-[0_0_15px_rgba(0,200,150,0.3)]'
                : 'bg-omnex-dark text-omnex-gray hover:text-white border border-omnex-gray/10'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* 📊 Fichas de Opciones de Compra Reales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAssets.map(asset => (
          <div 
            key={asset.symbol} 
            className="rounded-2xl p-6 bg-omnex-dark border border-omnex-teal/20 hover:border-omnex-teal/50 transition-all shadow-lg flex flex-col justify-between group"
          >
            <div className="space-y-4">
              {/* Encabezado del Activo */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl font-black text-white">{asset.symbol}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-white/5 text-gray-300 border border-white/10">
                      {asset.category}
                    </span>
                  </div>
                  <h4 className="text-xs text-omnex-gray font-medium">{asset.name}</h4>
                </div>

                <div className="text-right">
                  <div className="text-xl font-mono font-bold text-white">
                    ${asset.price.toFixed(asset.price < 5 ? 3 : 2)}
                  </div>
                  <span className={`text-xs font-semibold ${asset.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {asset.change24h >= 0 ? '+' : ''}{asset.change24h}% (24h)
                  </span>
                </div>
              </div>

              {/* Dictamen del Asesor */}
              <div className="p-4 rounded-xl bg-omnex-black/80 border border-omnex-gray/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-omnex-teal flex items-center gap-1.5 mb-1.5">
                  <Cpu size={13} />
                  Dictamen Comercial del Asesor
                </span>
                <p className="text-xs text-gray-200 leading-relaxed font-normal">
                  {asset.advisorVerdict}
                </p>
              </div>

              {/* Parámetros Técnicos de Compra */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <div className="p-2.5 rounded-lg bg-omnex-black/40 border border-white/5">
                  <span className="text-[10px] text-gray-400 block">Veredicto</span>
                  <span className="text-xs font-bold text-emerald-400">{asset.verdict}</span>
                </div>

                <div className="p-2.5 rounded-lg bg-omnex-black/40 border border-white/5">
                  <span className="text-[10px] text-gray-400 block">Zona de Entrada</span>
                  <span className="text-xs font-bold text-white font-mono">{asset.entryZone}</span>
                </div>

                <div className="p-2.5 rounded-lg bg-omnex-black/40 border border-white/5">
                  <span className="text-[10px] text-gray-400 block">Precio Objetivo</span>
                  <span className="text-xs font-bold text-omnex-teal font-mono">{asset.targetPrice}</span>
                </div>

                <div className="p-2.5 rounded-lg bg-omnex-black/40 border border-white/5">
                  <span className="text-[10px] text-gray-400 block">Stop Loss</span>
                  <span className="text-xs font-bold text-rose-400 font-mono">{asset.stopLoss}</span>
                </div>
              </div>

              {/* Catalizador de Mercado */}
              <div className="text-[11px] text-gray-400 flex items-start gap-1.5 pt-1">
                <Zap size={13} className="text-amber-400 shrink-0 mt-0.5" />
                <span><strong className="text-gray-300">Catalizador:</strong> {asset.catalyst}</span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-omnex-gray/10 flex items-center justify-between text-xs">
              <span className="text-gray-400">
                Potencial Estimado: <strong className="text-emerald-400 font-mono">{asset.potentialReturn}</strong>
              </span>
              <span className="text-gray-400">
                Riesgo: <strong className="text-omnex-teal">{asset.riskLevel}</strong>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 📡 Noticias & Alertas de Alto Impacto del Espía Web */}
      <div className="rounded-2xl p-6 bg-omnex-dark border border-omnex-teal/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-omnex-teal" />
            <h3 className="text-base font-bold text-white uppercase tracking-wider">
              Alertas del Espía Web en Tiempo Real
            </h3>
          </div>
          <span className="text-xs text-omnex-gray font-mono">Filtro Antirruido Activo</span>
        </div>

        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-omnex-black/50 border border-omnex-gray/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Favorable RWA
                </span>
                <span className="text-xs font-semibold text-white">
                  BlackRock expande su fondo BUIDL a nuevas redes blockchain para colateral de préstamos
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Aumenta la demanda institucional directa sobre los activos de tokenización y los oráculos de datos.
              </p>
            </div>
            <span className="text-[11px] text-gray-500 font-mono shrink-0">Hace 25 min</span>
          </div>

          <div className="p-4 rounded-xl bg-omnex-black/50 border border-omnex-gray/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Bolsa Wall Street
                </span>
                <span className="text-xs font-semibold text-white">
                  Robinhood reporta más de 5 millones de cuentas activas operando acciones fraccionales
                </span>
              </div>
              <p className="text-xs text-gray-400">
                La liquidez minorista se consolida en plataformas que operan fuera del horario tradicional bancario.
              </p>
            </div>
            <span className="text-[11px] text-gray-500 font-mono shrink-0">Hace 1h</span>
          </div>

          <div className="p-4 rounded-xl bg-omnex-black/50 border border-omnex-gray/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Reserva Federal (FED)
                </span>
                <span className="text-xs font-semibold text-white">
                  Tasas de interés se mantienen estables, favoreciendo el flujo de capital hacia activos de riesgo
                </span>
              </div>
              <p className="text-xs text-gray-400">
                El entorno macroeconómico permanece positivo para inversiones tácticas a mediano y largo plazo.
              </p>
            </div>
            <span className="text-[11px] text-gray-500 font-mono shrink-0">Hoy</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketRadar;
