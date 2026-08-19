import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus, CheckCircle, Clock, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getInvoices, type Invoice } from '../services/db';

export default function InvoicesPage() {
  const { userProfile } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewPdf, setViewPdf] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile?.userId) {
      loadInvoices();
    }
  }, [userProfile?.userId]);

  const loadInvoices = async () => {
    if (!userProfile?.userId) return;
    try {
      const data = await getInvoices(userProfile.userId);
      setInvoices(data);
    } catch (error) {
      console.error("Error cargando facturas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <FileText style={{ color: 'var(--color-primary)' }} />
            Documentos
          </h1>
          <p className="text-gray-400 mt-2">Control de facturas y cotizaciones emitidas</p>
        </div>
        <Link 
          to="/invoices/new"
          style={{ backgroundColor: 'var(--color-primary)' }}
          className="text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all hover:brightness-110 shadow-lg"
        >
          <Plus size={20} />
          Nuevo Documento
        </Link>
      </header>

      <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl">
        <div className="overflow-x-auto">
          {isLoading ? (
             <div className="text-center text-gray-400 py-8">Cargando documentos...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-sm">
                  <th className="p-4 font-medium uppercase tracking-wider">Documento</th>
                  <th className="p-4 font-medium uppercase tracking-wider">Cliente</th>
                  <th className="p-4 font-medium uppercase tracking-wider">Fecha</th>
                  <th className="p-4 font-medium uppercase tracking-wider">Monto</th>
                  <th className="p-4 font-medium uppercase tracking-wider">Estado</th>
                  <th className="p-4 font-medium uppercase tracking-wider text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400">No hay documentos registrados</td>
                  </tr>
                ) : (
                  invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-4 font-bold text-white">{inv.invoiceNumber}</td>
                      <td className="p-4 text-gray-400 group-hover:text-white transition-colors">{inv.clientName}</td>
                      <td className="p-4 text-gray-400">{new Date(inv.date).toLocaleDateString()}</td>
                      <td className="p-4 font-medium text-white">${inv.amount.toFixed(2)}</td>
                      <td className="p-4">
                        {inv.status === 'Paid' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-xs font-bold font-sans">
                            <CheckCircle size={12} /> Pagada
                          </span>
                        )}
                        {inv.status === 'Emitted' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-xs font-bold font-sans">
                            <Clock size={12} /> Emitida
                          </span>
                        )}
                        {inv.status === 'Draft' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs font-bold font-sans">
                            Borrador
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {inv.pdfUrl && (
                          <button 
                            onClick={() => setViewPdf(inv.pdfUrl!)} 
                            style={{ color: 'var(--color-primary)' }}
                            className="font-bold text-sm bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Ver PDF
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Visor de PDF Integrado */}
      {viewPdf && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl h-[90vh] flex flex-col bg-[#121212] rounded-2xl border border-white/20 shadow-2xl">
            <div className="p-4 flex justify-between items-center border-b border-white/20">
              <h3 className="text-white font-bold">Visor de Documento PDF</h3>
              <button onClick={() => setViewPdf(null)} className="text-gray-400 hover:text-red-400 p-1 bg-black/50 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 p-2 bg-black/50 rounded-b-2xl overflow-hidden">
              <iframe src={viewPdf} className="w-full h-full rounded-xl bg-white" title="Documento PDF" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
