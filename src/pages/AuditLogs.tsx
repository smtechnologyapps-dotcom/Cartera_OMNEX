import React, { useEffect, useState } from 'react';
import { getAuditLogs, AuditLog } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { ShieldAlert, Clock, Info } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

const AuditLogs: React.FC = () => {
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadLogs();
    }
  }, [currentUser]);

  const loadLogs = async () => {
    try {
      const data = await getAuditLogs(currentUser!.uid);
      setLogs(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: Timestamp | Date) => {
    const d = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('es-PA', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(d);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'text-green-500';
      case 'UPDATE': return 'text-blue-500';
      case 'DELETE': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'CREATE': return 'Creado';
      case 'UPDATE': return 'Editado';
      case 'DELETE': return 'Eliminado';
      default: return action;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="flex items-center gap-3 mb-6">
        <ShieldAlert size={28} className="text-red-400" />
        <h2 className="text-2xl font-bold">Bitácora de Auditoría</h2>
      </div>

      <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border/50 bg-background/50">
          <p className="text-sm text-text-muted flex items-center gap-2">
            <Info size={16} /> Este registro mantiene la trazabilidad de todas las modificaciones o eliminaciones de transacciones.
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-text-muted">Cargando bitácora...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-text-muted">No hay registros de auditoría aún.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-background/50 text-text-muted">
                <tr>
                  <th className="p-4 font-medium">Fecha y Hora</th>
                  <th className="p-4 font-medium">Acción</th>
                  <th className="p-4 font-medium">ID Transacción</th>
                  <th className="p-4 font-medium">Motivo / Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-background/30 transition-colors">
                    <td className="p-4 flex items-center gap-2 text-text-muted">
                      <Clock size={14} /> {formatDate(log.timestamp)}
                    </td>
                    <td className={`p-4 font-semibold ${getActionColor(log.action)}`}>
                      {getActionText(log.action)}
                    </td>
                    <td className="p-4 font-mono text-xs text-text-muted">{log.transactionId}</td>
                    <td className="p-4">
                      {log.reason ? (
                        <span className="text-text">{log.reason}</span>
                      ) : (
                        <span className="text-text-muted italic">Sin motivo especificado</span>
                      )}
                      {log.details && log.action === 'UPDATE' && (
                        <div className="text-xs text-text-muted mt-1">
                          Modificaciones: {Object.keys(log.details).filter(k => k !== 'updatedAt').join(', ')}
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
    </motion.div>
  );
};

export default AuditLogs;
