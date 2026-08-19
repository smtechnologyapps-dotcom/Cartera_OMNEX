import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Send, ArrowLeft, FileText, FileSpreadsheet, Plus, Trash2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useAuth } from '../contexts/AuthContext';
import { getClients, getInvoices, addInvoice, type Client, type InvoiceItem } from '../services/db';

export default function InvoiceBuilder() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  
  const [selectedClientId, setSelectedClientId] = useState('');
  
  // Soporte Multi-Ítem
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, total: 0 }
  ]);

  const [docType, setDocType] = useState<'Invoice' | 'Quote'>('Invoice');
  const [businessLine, setBusinessLine] = useState<'consultoria' | 'auditoria' | 'app' | 'web' | 'automatizacion'>('consultoria');
  
  const termsConsultoria = `💳 FORMA DE PAGO: 50% de anticipo para iniciar el servicio • 50% contra entrega del informe o certificación final. (PAGO ÚNICO)\n🏦 DATOS BANCARIOS: Omar Gutiérrez • Banco General • Cuenta Ahorro: 04-25-97-603245-9\n📝 NOTA: Los gastos de viáticos fuera de la provincia aplican cargos adicionales pre-aprobados.`;
  const termsAuditoria = `💳 FORMA DE PAGO: 50% de anticipo para agendar auditoría (ISO 9001/14001/45001) • 50% contra entrega del reporte de hallazgos. (PAGO ÚNICO)\n🏦 DATOS BANCARIOS: Omar Gutiérrez • Banco General • Cuenta Ahorro: 04-25-97-603245-9`;
  const termsApp = `💳 FORMA DE PAGO: 50% anticipo al inicio y aprobación • 50% restante previo a la publicación. (PAGO ÚNICO POR DESARROLLO)\n⏱️ MANTENIMIENTO: Se facturará una mensualidad recurrente por hosting y soporte posterior a la entrega.\n🏦 DATOS BANCARIOS: Omar Gutiérrez • Banco General • Cuenta Ahorro: 04-25-97-603245-9`;
  const termsWeb = `💳 FORMA DE PAGO: 50% anticipo al inicio y aprobación • 50% restante previo a la entrega final. (PAGO ÚNICO POR DESARROLLO)\n⏱️ HOSTING: Renovación anual de dominio y hosting (recurrente).\n🏦 DATOS BANCARIOS: Omar Gutiérrez • Banco General • Cuenta Ahorro: 04-25-97-603245-9`;
  const termsAutomatizacion = `💳 FORMA DE PAGO: 50% de anticipo al diseño del flujo • 50% al despliegue en producción. (PAGO ÚNICO POR DESARROLLO)\n⏱️ PLATAFORMAS: El cliente asume costos recurrentes de licencias de terceros (ej. Make, n8n, Supabase).\n🏦 DATOS BANCARIOS: Omar Gutiérrez • Banco General • Cuenta Ahorro: 04-25-97-603245-9`;
  
  const [terms, setTerms] = useState(termsConsultoria);

  useEffect(() => {
    if (userProfile?.userId) {
      getClients(userProfile.userId).then(setClients);
    }
  }, [userProfile?.userId]);

  useEffect(() => {
    if (businessLine === 'consultoria') setTerms(termsConsultoria);
    if (businessLine === 'auditoria') setTerms(termsAuditoria);
    if (businessLine === 'app') setTerms(termsApp);
    if (businessLine === 'web') setTerms(termsWeb);
    if (businessLine === 'automatizacion') setTerms(termsAutomatizacion);
  }, [businessLine]);

  const invoiceRef = useRef<HTMLDivElement>(null);

  const activeClient = clients.find(c => c.id === selectedClientId);

  const grandTotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  const generateAndSave = async (emit: boolean = false) => {
    if (!activeClient) return alert('Seleccione un cliente');
    if (!userProfile?.userId) return alert('Error de autenticación');

    try {
      // Calcular siguiente ID
      const existingInvoices = await getInvoices(userProfile.userId);
      const invNumber = 109 + existingInvoices.length;
      
      const dateObj = new Date();
      const month = dateObj.toLocaleString('es-ES', { month: 'short' }).replace('.', '').toUpperCase();
      const year = dateObj.getFullYear();
      
      // Nomenclatura dinámica (Cotización vs Factura)
      const prefix = docType === 'Invoice' ? `Fact-${invNumber}` : `Cotiz-026-${invNumber}`;
      const safeEmpresa = activeClient.empresa ? activeClient.empresa.replace(/[\/\\?%*:|"<>]/g, '') : 'CLIENTE';
      const fileName = `${prefix}-${month}_${year}_${safeEmpresa}`;
      const invoiceId = docType === 'Invoice' ? `FACT-${invNumber}` : `OMNEX-026-${invNumber}`;

      let pdfBlobUrl = '';

      if (emit) {
        alert('Generando PDF, por favor espera un momento...');
        const canvas = await html2canvas(invoiceRef.current!, { scale: 2, useCORS: true });
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdfBlobUrl = pdf.output('datauristring').toString();

        pdf.save(fileName + '.pdf');
      }

      const finalItems = items.map(item => ({...item, total: item.quantity * item.unitPrice}));

      // Registrar en BD Firebase
      await addInvoice({
        userId: userProfile.userId,
        invoiceNumber: invoiceId,
        clientId: activeClient.id!,
        clientName: activeClient.empresa || 'Sin Nombre',
        date: Date.now(),
        amount: grandTotal,
        items: finalItems,
        status: emit ? 'Emitted' : 'Draft',
        description: finalItems[0]?.description || '',
        pdfUrl: pdfBlobUrl,
        docType: docType,
        terms: terms
      });

      if (emit) {
        alert(`${docType === 'Invoice' ? 'Factura' : 'Cotización'} ${invoiceId} emitida y guardada.`);
        setTimeout(() => {
          navigate('/invoices');
        }, 1500);
      } else {
        alert('Borrador guardado.');
        navigate('/invoices');
      }
      
    } catch (error: any) {
      console.error('Error generando PDF:', error);
      alert('Hubo un error al generar el PDF: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/invoices')} className="p-2 text-gray-400 hover:text-white bg-black/40 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold text-white">
            Crear {docType === 'Invoice' ? 'Factura' : 'Cotización'}
          </h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => generateAndSave(false)} className="px-6 py-3 rounded-xl border border-white/20 text-white font-bold hover:bg-white/10 transition-all flex items-center gap-2">
            <Save size={20} /> Borrador
          </button>
          <button onClick={() => generateAndSave(true)} style={{ backgroundColor: 'var(--color-primary)' }} className="px-6 py-3 rounded-xl text-white font-bold hover:brightness-110 transition-all shadow-lg flex items-center gap-2">
            <Send size={20} /> Generar PDF
          </button>
        </div>
      </header>

      {/* Selector de Tipo de Documento */}
      <div className="flex flex-wrap gap-4 p-2 bg-black/40 border border-white/10 rounded-2xl w-fit">
        <button 
          onClick={() => setDocType('Invoice')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${docType === 'Invoice' ? 'shadow-md text-white' : 'text-gray-400 hover:text-white'}`}
          style={docType === 'Invoice' ? { backgroundColor: 'var(--color-primary)' } : {}}
        >
          <FileText size={18} /> Factura
        </button>
        <button 
          onClick={() => setDocType('Quote')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${docType === 'Quote' ? 'shadow-md text-white' : 'text-gray-400 hover:text-white'}`}
          style={docType === 'Quote' ? { backgroundColor: 'var(--color-primary)' } : {}}
        >
          <FileSpreadsheet size={18} /> Cotización
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Editor Form */}
        <div className="lg:col-span-4 bg-black/40 border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
          <h2 className="text-xl font-bold text-white border-b border-white/10 pb-4">Detalles del Documento</h2>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Cliente</label>
            <select
              className="w-full bg-black/60 border border-white/20 text-white rounded-xl p-3 focus:outline-none focus:ring-1"
              style={{ '--tw-ring-color': 'var(--color-primary)' } as any}
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
            >
              <option value="">-- Seleccionar --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.empresa}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Línea de Negocio (Términos)</label>
            <select
              className="w-full bg-black/60 border border-white/20 text-white rounded-xl p-3 focus:outline-none focus:ring-1"
              style={{ '--tw-ring-color': 'var(--color-primary)' } as any}
              value={businessLine}
              onChange={(e) => setBusinessLine(e.target.value as any)}
            >
              <option value="consultoria">Consultoría Ambiental</option>
              <option value="auditoria">Auditoría Tri-normas ISO</option>
              <option value="app">Creación de App</option>
              <option value="web">Creación de Web</option>
              <option value="automatizacion">Automatizaciones</option>
            </select>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end border-b border-white/10 pb-2">
              <label className="block text-sm font-medium text-white">Conceptos a Facturar</label>
              <button 
                onClick={() => setItems([...items, { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, total: 0 }])}
                style={{ color: 'var(--color-primary)' }}
                className="text-xs flex items-center gap-1 hover:brightness-125 transition-colors font-bold"
              >
                <Plus size={14} /> Añadir Concepto
              </button>
            </div>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {items.map((item, index) => (
                <div key={item.id} className="p-3 bg-black/60 border border-white/10 rounded-xl relative group">
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {items.length > 1 && (
                      <button 
                        onClick={() => setItems(items.filter(i => i.id !== item.id))}
                        className="text-red-400 hover:text-red-300 p-1 bg-red-400/10 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  
                  <div className="mb-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Descripción</label>
                    <textarea
                      rows={2}
                      className="w-full bg-transparent border-b border-white/20 text-white p-1 text-sm focus:outline-none"
                      style={{ borderBottomColor: 'var(--color-primary)' }}
                      value={item.description}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[index].description = e.target.value;
                        setItems(newItems);
                      }}
                      placeholder="Ej. Diseño web..."
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="w-1/3">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Cant.</label>
                      <input
                        type="number" min="1"
                        className="w-full bg-transparent border-b border-white/20 text-white p-1 text-sm focus:outline-none"
                        style={{ borderBottomColor: 'var(--color-primary)' }}
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[index].quantity = Number(e.target.value);
                          setItems(newItems);
                        }}
                      />
                    </div>
                    <div className="w-2/3">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">P. Unitario ($)</label>
                      <input
                        type="number" step="0.01"
                        className="w-full bg-transparent border-b border-white/20 text-white p-1 text-sm focus:outline-none"
                        style={{ borderBottomColor: 'var(--color-primary)' }}
                        value={item.unitPrice}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[index].unitPrice = Number(e.target.value);
                          setItems(newItems);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-white/10 flex justify-between items-center text-white">
              <span className="font-bold">Total a Facturar:</span>
              <span className="text-xl font-black" style={{ color: 'var(--color-primary)' }}>${grandTotal.toFixed(2)}</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Condiciones / Notas (Aparece abajo)</label>
            <textarea
              rows={6}
              className="w-full bg-black/60 border border-white/20 text-gray-300 rounded-xl p-3 focus:outline-none focus:ring-1 text-xs"
              style={{ '--tw-ring-color': 'var(--color-primary)' } as any}
              value={terms} onChange={(e) => setTerms(e.target.value)}
            />
          </div>
        </div>

        {/* Visual Preview (HTML that will be converted to PDF) */}
        <div className="lg:col-span-8 flex justify-center bg-[#1e1e1e] rounded-2xl p-4 overflow-x-auto shadow-xl">
          <div
            ref={invoiceRef}
            className="bg-[#ffffff] w-[210mm] min-h-[297mm] shadow-2xl relative text-[#000000]"
          >
            {/* Cabecera superior (Header) */}
            <div className="px-12 pt-12 pb-6 flex justify-between items-end border-b-2" style={{ borderColor: 'rgba(0, 200, 150, 0.2)' }}>
              <div>
                <div className="font-sans text-3xl font-bold text-[#0a3d62] tracking-widest mb-1">
                  <span className="text-[#00a87a]">OMN</span>EX
                </div>
                <div className="text-[10px] text-[#6b7280] tracking-[0.2em] font-semibold">AUTOMATIZACIÓN · IA · DIGITAL</div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-[#9ca3af] mb-1">{docType === 'Invoice' ? 'FACTURA #:' : 'COTIZACIÓN #:'}</p>
                <h1 className="text-2xl font-black text-[#0a3d62] uppercase leading-none">
                  {docType === 'Invoice' ? `FACT-XXX-PENDIENTE` : `OMNEX-026-PENDIENTE`}
                </h1>
                <p className="text-[10px] text-[#6b7280] mt-2">Fecha: {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                {docType === 'Quote' && <p className="text-[10px] text-[#6b7280]">Validez: 15 DÍAS</p>}
              </div>
            </div>

            {/* Bloque de Información: Cliente y Emisor */}
            <div className="px-12 py-8 grid grid-cols-2 gap-8 text-sm">
              {/* Cliente */}
              <div>
                <h3 className="text-xs font-bold text-[#00c896] uppercase tracking-wider mb-2">CLIENTE</h3>
                {activeClient ? (
                  <div className="space-y-1 text-[#374151]">
                    <p><span className="font-bold text-[#0a3d62]">Razón Social:</span> {activeClient.empresa}</p>
                    <p><span className="font-bold text-[#0a3d62]">Contacto:</span> {activeClient.contacto}</p>
                    <p><span className="font-bold text-[#0a3d62]">Tel:</span> {activeClient.telefono}</p>
                    <p><span className="font-bold text-[#0a3d62]">RUC:</span> {activeClient.ruc || 'N/A'}</p>
                  </div>
                ) : (
                  <p className="text-[#9ca3af] italic text-xs">Selecciona un cliente para visualizar</p>
                )}
              </div>
              
              {/* Emisor */}
              <div>
                <h3 className="text-xs font-bold text-[#00c896] uppercase tracking-wider mb-2">EMISOR</h3>
                <div className="space-y-1 text-[#374151]">
                  <p><span className="font-bold text-[#0a3d62]">Razón Social:</span> {userProfile?.businessName || 'Soluciones Integrales y Globales SM'}</p>
                  <p><span className="font-bold text-[#0a3d62]">Marca:</span> OMNEX</p>
                  <p><span className="font-bold text-[#0a3d62]">RUC:</span> 8-829-1163 DV 20</p>
                  <p><span className="font-bold text-[#0a3d62]">Representante:</span> {userProfile?.fullName || 'Ing. Omar Gutiérrez'}</p>
                  <p><span className="font-bold text-[#0a3d62]">Email:</span> smtechnologyapps@gmail.com</p>
                  <p><span className="font-bold text-[#0a3d62]">Tel:</span> 6509-1352</p>
                  <p><span className="font-bold text-[#0a3d62]">Dirección:</span> Panamá Oeste, La Chorrera, Las Arboledas, Las Magnolias, casa 27</p>
                </div>
              </div>
            </div>

            {/* Tabla de Conceptos */}
            <div className="px-12 min-h-[120mm]">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-[#0a0a0a] text-[#ffffff]">
                    <th className="py-2 px-4 font-bold uppercase tracking-wider text-xs">DESCRIPCIÓN DEL SERVICIO</th>
                    <th className="py-2 px-4 font-bold uppercase tracking-wider text-xs text-center w-16">CANT</th>
                    <th className="py-2 px-4 font-bold uppercase tracking-wider text-xs text-right w-24">P. UNIT.</th>
                    <th className="py-2 px-4 font-bold uppercase tracking-wider text-xs text-right w-28">P. TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id} className="border-b border-[#e5e7eb]">
                      <td className="py-6 px-4">
                         <p className="font-bold text-[#0a3d62] uppercase whitespace-pre-wrap">{item.description || `Concepto ${index + 1}`}</p>
                      </td>
                      <td className="py-6 px-4 text-center text-[#374151]">{item.quantity}</td>
                      <td className="py-6 px-4 text-right text-[#374151]">B/. {item.unitPrice.toFixed(2)}</td>
                      <td className="py-6 px-4 text-right font-bold text-[#0a3d62]">B/. {(item.quantity * item.unitPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totales */}
              <div className="mt-8 flex justify-end">
                <div className="w-1/3 space-y-2 text-sm">
                  <div className="flex justify-between text-[#4b5563]">
                    <span>SUBTOTAL:</span>
                    <span>B/. {grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#4b5563] border-b border-[#e5e7eb] pb-2">
                    <span>ITBMS (0%):</span>
                    <span>B/. 0.00</span>
                  </div>
                  <div className="flex justify-between font-black text-lg text-[#00c896] pt-2">
                    <span>TOTAL USD:</span>
                    <span>B/. {grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              {/* Divider de línea verde estilo PDF */}
              <div className="w-full h-0.5 bg-[#00c896] mt-4 mb-8"></div>

              {/* Términos y Condiciones */}
              <div className="bg-[#f9fafb] p-6 rounded-lg text-xs text-[#374151] leading-relaxed whitespace-pre-wrap border border-[#f3f4f6]">
                {terms}
              </div>
            </div>

            {/* Footer estilo oscuro PDF */}
            <div className="absolute bottom-6 w-full px-12">
              <div className="bg-[#080808] text-[#ffffff] p-6 rounded-xl flex justify-between items-center shadow-lg">
                <div>
                  <div className="font-sans text-xl font-bold tracking-widest mb-1">
                    <span className="text-[#00c896]">OMN</span>EX
                  </div>
                  <div className="text-[8px] text-[#9ca3af] tracking-[0.1em]">AUTOMATIZACIÓN · IA · DIGITAL</div>
                </div>
                <div className="text-right text-[9px] text-[#9ca3af] space-y-1">
                  <p>© {new Date().getFullYear()} OMNEX. Todos los derechos reservados.</p>
                  <p>Hecho con orgullo en Panamá | RUC: 8-829-1163 DV 20</p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
