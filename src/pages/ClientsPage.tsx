import { useState, useEffect } from 'react';
import { Users, Plus, Search, Mail, Phone, Briefcase } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getClients, addClient, type Client } from '../services/db';

export default function ClientsPage() {
  const { userProfile } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userProfile?.userId) {
      loadClients();
    }
  }, [userProfile?.userId]);

  const loadClients = async () => {
    if (!userProfile?.userId) return;
    try {
      const data = await getClients(userProfile.userId);
      setClients(data);
    } catch (error) {
      console.error("Error cargando clientes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredClients = clients.filter(c =>
    c.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contacto.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userProfile?.userId) return;

    const formData = new FormData(e.currentTarget);

    const newClient: Client = {
      userId: userProfile.userId,
      fechaRegistro: Date.now(),
      email: formData.get('email') as string,
      emailSecundario: formData.get('emailSecundario') as string || '',
      empresa: formData.get('empresa') as string,
      ruc: formData.get('ruc') as string || '',
      contacto: formData.get('contacto') as string,
      telefono: formData.get('telefono') as string,
      descripcion: formData.get('descripcion') as string || '',
      logo: '',
      generarPolitica: false,
      sexo: formData.get('sexo') as string || '',
      nombreApp: formData.get('nombreApp') as string || '',
      mensualidad: Number(formData.get('mensualidad') || 0),
      activo: formData.get('activo') === 'on'
    };

    try {
      await addClient(newClient);
      setIsModalOpen(false);
      loadClients();
    } catch (error) {
      alert("Error al guardar el cliente.");
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Users style={{ color: 'var(--color-primary)' }} />
            Directorio de Clientes
          </h1>
          <p className="text-gray-400 mt-2">Gestiona el acceso y datos de tus cuentas</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{ backgroundColor: 'var(--color-primary)' }}
          className="text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all hover:brightness-110 shadow-lg"
        >
          <Plus size={20} />
          Nuevo Cliente
        </button>
      </header>

      <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por empresa o contacto..."
            className="w-full bg-black/40 border border-white/10 text-white rounded-xl py-3 pl-12 pr-4 focus:outline-none transition-all focus:ring-1"
            style={{ '--tw-ring-color': 'var(--color-primary)' } as any}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="text-center text-gray-400 py-12">Cargando clientes...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map(client => (
              <div key={client.id} className="bg-black/40 border border-white/10 rounded-xl p-5 hover:border-white/30 transition-all cursor-pointer group shadow-lg">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg text-white transition-colors line-clamp-1 group-hover:opacity-80" style={{ color: 'var(--color-primary)' }}>
                    {client.empresa}
                  </h3>
                  {client.activo ? (
                    <span className="w-3 h-3 rounded-full bg-green-500 shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                  ) : (
                    <span className="w-3 h-3 rounded-full bg-red-500 shrink-0"></span>
                  )}
                </div>

                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Briefcase size={14} style={{ color: 'var(--color-primary)' }} />
                    <span className="line-clamp-1">{client.contacto}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={14} style={{ color: 'var(--color-primary)' }} />
                    <span className="line-clamp-1">{client.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} style={{ color: 'var(--color-primary)' }} />
                    <span>{client.telefono}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center text-xs">
                  <span className="text-gray-400">RUC: {client.ruc || 'N/A'}</span>
                  <span className="font-bold text-white">${client.mensualidad}/mes</span>
                </div>
              </div>
            ))}
            {filteredClients.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-400">
                No se encontraron clientes
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Nuevo Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#121212] z-10">
              <h2 className="text-xl font-bold text-white">Registrar Nuevo Cliente</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddClient} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Nombre de la Empresa</label>
                  <input required name="empresa" type="text" className="form-input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">RUC o Cédula</label>
                  <input name="ruc" type="text" className="form-input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Nombre Contacto</label>
                  <input required name="contacto" type="text" className="form-input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Teléfono</label>
                  <input required name="telefono" type="text" className="form-input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Correo Electrónico</label>
                  <input required name="email" type="email" className="form-input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Costo Mensualidad ($)</label>
                  <input name="mensualidad" type="number" step="0.01" className="form-input" defaultValue="0" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Descripción del Proyecto</label>
                <textarea name="descripcion" rows={3} className="form-input"></textarea>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" name="activo" id="activo" defaultChecked className="w-4 h-4" style={{ accentColor: 'var(--color-primary)' }} />
                <label htmlFor="activo" className="text-sm font-medium text-white">Cliente Activo</label>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-colors">Cancelar</button>
                <button type="submit" className="btn-primary">Crear Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
