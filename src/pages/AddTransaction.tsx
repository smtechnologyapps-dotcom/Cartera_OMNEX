import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { addTransaction, uploadInvoice } from '../services/db';
import type { Transaction } from '../services/db';
import Tesseract from 'tesseract.js';
import { Scanner } from '@yudiel/react-qr-scanner';
import { motion } from 'framer-motion';
import { Camera, Upload, Loader2, CheckCircle2, QrCode, X, PlusCircle } from 'lucide-react';

const OMNEX_SUBCATEGORIES = ["Alquiler", "Combustible", "Pago de internet", "Teléfono", "Plataforma digital", "Comida con clientes", "Mantenimiento del vehículo"];
const HIJOS_SUBCATEGORIES = ["Lotería", "Comida mía", "Gastos de fútbol", "Salidas de recreación", "Ropa", "Útiles escolares", "Transporte", "Mensualidad de fútbol de Sebas", "Prácticas de fútbol de Sebas", "Torneos de fútbol de Sebas", "Uniforme de fútbol de Sebas", "Comida en tiempo compartido"];
const INGRESO_SOURCES = ["Plataformas digitales", "Trader Service", "Dr. José", "Auditorias", "Pago de trabajo de Gym", "Otro"];

const AddTransaction: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    type: 'gasto' as 'ingreso' | 'gasto',
    category: 'OMNEX' as 'OMNEX' | 'Personal/Hijos' | 'Ingreso',
    subCategory: OMNEX_SUBCATEGORIES[0],
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const [file, setFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanResult, setScanResult] = useState<string>('');
  
  const [isScanningQRCode, setIsScanningQRCode] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const resetForm = () => {
    setFormData({
      type: 'gasto',
      category: 'OMNEX',
      subCategory: OMNEX_SUBCATEGORIES[0],
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
    });
    setFile(null);
    setScanResult('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setShowSuccessModal(false);
  };

  const onScanSuccess = async (decodedText: string) => {
    setIsScanningQRCode(false);
    setScanResult('QR detectado. Obteniendo datos de la DGI...');
    setIsScanning(true);
    try {
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(decodedText)}`;
      const response = await fetch(proxyUrl);
      const html = await response.text();
      
      let newAmount = '';
      let newMerchant = '';

      const amountMatch = html.match(/TOTAL PAGADO:[\s\S]*?<div[^>]*>([\d.,]+)<\/div>/i);
      if (amountMatch && amountMatch[1]) {
        newAmount = amountMatch[1].replace(',', '');
      }

      const emisorMatch = html.match(/EMISOR[\s\S]*?<dt[^>]*>NOMBRE<\/dt>\s*<dd>(.*?)<\/dd>/i);
      if (emisorMatch && emisorMatch[1]) {
        newMerchant = emisorMatch[1].trim();
      }

      if (newAmount || newMerchant) {
        setFormData(prev => ({ 
          ...prev, 
          amount: newAmount || prev.amount,
          description: newMerchant || prev.description 
        }));
        setScanResult('¡Datos de la factura fiscal extraídos con éxito!');
      } else {
        setScanResult('QR leído, pero no se encontraron los datos esperados en la página.');
      }
    } catch (error) {
      console.error(error);
      setScanResult('Error al obtener datos de la factura fiscal. Asegúrate de tener internet.');
    } finally {
      setIsScanning(false);
    }
  };



  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'type') {
      if (value === 'ingreso') {
        setFormData({ ...formData, type: 'ingreso', category: 'Ingreso', subCategory: INGRESO_SOURCES[0] });
      } else {
        setFormData({ ...formData, type: 'gasto', category: 'OMNEX', subCategory: OMNEX_SUBCATEGORIES[0] });
      }
    } else if (name === 'category') {
      const newCat = value as 'OMNEX' | 'Personal/Hijos' | 'Ingreso';
      let newSub = formData.subCategory;
      if (newCat === 'OMNEX') newSub = OMNEX_SUBCATEGORIES[0];
      else if (newCat === 'Personal/Hijos') newSub = HIJOS_SUBCATEGORIES[0];
      setFormData({ ...formData, category: newCat, subCategory: newSub });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      await performOCR(selectedFile);
    }
  };

  const preprocessImage = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(URL.createObjectURL(file));
        
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i+1];
          const b = data[i+2];
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          
          if (gray > 200) {
            // Lo blanco o muy claro se vuelve negro
            data[i] = data[i+1] = data[i+2] = 0;
          } else {
            // El fondo azul o letras negras se vuelven blanco
            data[i] = data[i+1] = data[i+2] = 255;
          }
        }
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 1.0));
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const performOCR = async (imageFile: File) => {
    setIsScanning(true);
    setScanResult('');
    try {
      const processedImageUrl = await preprocessImage(imageFile);
      const result = await Tesseract.recognize(processedImageUrl, 'spa');
      const text = result.data.text;
      console.log("Texto extraído:", text); // Para debug en consola
      
      let finalAmount = 0;
      let merchantName = '';

      // 1. Intentar extraer nombre (Yappy: "Enviado a" o "Recibido de")
      // Buscamos la línea siguiente a "Enviado a" o "Recibido de"
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      const targetIndex = lines.findIndex(l => l.toLowerCase().includes('enviado a') || l.toLowerCase().includes('recibido de'));
      if (targetIndex !== -1 && lines.length > targetIndex + 1) {
        // La siguiente línea suele ser el nombre. Si es muy corta, probamos la siguiente.
        let possibleName = lines[targetIndex + 1].replace(/[^a-zA-Z\s]/g, '').trim();
        if (possibleName.length < 3 && lines.length > targetIndex + 2) {
            possibleName = lines[targetIndex + 2].replace(/[^a-zA-Z\s]/g, '').trim();
        }
        if (possibleName.length >= 3) merchantName = possibleName;
      }

      // 2. Extraer monto (Buscar patrones que parezcan dinero: con 2 decimales explícitos)
      // Tesseract a veces agrega espacios: "1. 25" o "1 .25".
      const moneyRegex = /(?:[\$S5])?\s*(\d+)\s*[.,]\s*(\d{2})\b/g;
      let match;
      let possibleAmounts: number[] = [];
      
      while ((match = moneyRegex.exec(text)) !== null) {
         const valStr = match[1] + '.' + match[2];
         const val = parseFloat(valStr);
         if (!isNaN(val) && val > 0 && val < 50000) { 
            possibleAmounts.push(val);
         }
      }

      // Fallback: Si no encuentra con 2 decimales, busca cualquier número precedido por $ o S
      if (possibleAmounts.length === 0) {
          const fallbackRegex = /(?:[\$S])\s*(\d+)(?:\s*[.,]\s*(\d+))?\b/g;
          while ((match = fallbackRegex.exec(text)) !== null) {
             const dec = match[2] ? '.' + match[2] : '';
             const valStr = match[1] + dec;
             const val = parseFloat(valStr);
             if (!isNaN(val) && val > 0 && val < 50000) { 
                possibleAmounts.push(val);
             }
          }
      }

      if (possibleAmounts.length > 0) {
         finalAmount = Math.max(...possibleAmounts);
      }

      if (finalAmount > 0) {
        setFormData(prev => ({ 
          ...prev, 
          amount: finalAmount.toString(),
          description: merchantName || prev.description
        }));
        setScanResult(merchantName ? '¡Monto y contacto detectados!' : '¡Monto detectado! Verifica los datos.');
      } else {
        // Mostrar los primeros 100 caracteres del texto extraído para poder hacer debug
        setScanResult(`No se detectó el monto. Texto leído: ${text.substring(0, 100).replace(/\n/g, ' ')}`);
      }
    } catch (error) {
      console.error("OCR Error", error);
      setScanResult('Error al escanear la imagen.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!formData.amount || isNaN(Number(formData.amount))) {
      alert('Por favor ingresa un monto válido.');
      return;
    }

    setIsSubmitting(true);
    try {
      let invoiceUrl = undefined;
      if (file) {
        invoiceUrl = await uploadInvoice(currentUser.uid, file);
      }

      const tx: Transaction = {
        userId: currentUser.uid,
        type: formData.type,
        category: formData.category,
        subCategory: formData.subCategory,
        amount: Number(formData.amount),
        date: new Date(formData.date),
        description: formData.description,
        invoiceUrl
      };

      await addTransaction(tx);
      setShowSuccessModal(true);
    } catch (error) {
      console.error(error);
      alert('Error al guardar la transacción');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto w-full"
      >
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Nueva Transacción</h1>
      
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Tipo</label>
              <select name="type" value={formData.type} onChange={handleInputChange} className="form-input">
                <option value="gasto">Gasto</option>
                <option value="ingreso">Ingreso</option>
              </select>
            </div>
            
            {formData.type === 'gasto' && (
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Categoría</label>
                <select name="category" value={formData.category} onChange={handleInputChange} className="form-input">
                  <option value="OMNEX">Negocio OMNEX</option>
                  <option value="Personal/Hijos">Personal / Hijos</option>
                </select>
              </div>
            )}

            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>
                {formData.type === 'ingreso' ? 'Fuente de Ingreso' : 'Subcategoría'}
              </label>
              <select name="subCategory" value={formData.subCategory} onChange={handleInputChange} className="form-input">
                {formData.type === 'ingreso' ? (
                  INGRESO_SOURCES.map(s => <option key={s} value={s}>{s}</option>)
                ) : formData.category === 'OMNEX' ? (
                  OMNEX_SUBCATEGORIES.map(s => <option key={s} value={s}>{s}</option>)
                ) : (
                  HIJOS_SUBCATEGORIES.map(s => <option key={s} value={s}>{s}</option>)
                )}
              </select>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ display: 'block', color: 'var(--color-text-muted)' }}>Captura de Factura (Opcional)</label>
              <button 
                type="button" 
                onClick={() => setIsScanningQRCode(true)}
                style={{ background: 'rgba(139, 92, 246, 0.2)', color: 'var(--color-accent-omnex)', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(139, 92, 246, 0.5)' }}
              >
                <QrCode size={16} /> Escanear QR Fiscal DGI
              </button>
            </div>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed rgba(255,255,255,0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '2rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.02)',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />
              {isScanning ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: 'var(--color-primary)' }}>
                  <Loader2 className="animate-spin" size={32} />
                  <span>Analizando factura con IA...</span>
                </div>
              ) : file ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: 'var(--color-success)' }}>
                  <CheckCircle2 size={32} />
                  <span>Imagen seleccionada: {file.name}</span>
                  {scanResult && <span style={{ fontSize: '0.875rem' }}>{scanResult}</span>}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: 'var(--color-text-muted)' }}>
                  <Camera size={32} />
                  <span>Haz clic para tomar una foto o subir la factura</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Monto Total</label>
            <input 
              type="number" 
              name="amount" 
              value={formData.amount} 
              onChange={handleInputChange} 
              className="form-input" 
              placeholder="0.00" 
              step="0.01" 
              required 
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Fecha</label>
            <input 
              type="date" 
              name="date" 
              value={formData.date} 
              onChange={handleInputChange} 
              className="form-input" 
              required 
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Descripción</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleInputChange} 
              className="form-input" 
              placeholder="Ej. Compra de suministros" 
              rows={3} 
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={isSubmitting || isScanning}
            style={{ 
              opacity: (isSubmitting || isScanning) ? 0.7 : 1, 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '0.5rem',
              marginTop: '1rem'
            }}
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
            {isSubmitting ? 'Guardando...' : 'Guardar Transacción'}
          </button>
        </form>
      </motion.div>

      {/* QR Scanner Modal */}
      {isScanningQRCode && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--color-bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '500px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Escanear QR Fiscal</h3>
              <button onClick={() => setIsScanningQRCode(false)} style={{ color: 'var(--color-text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            <div style={{ width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: '#000' }}>
               <Scanner 
                 onScan={(result) => {
                   if (result && result.length > 0) {
                     onScanSuccess(result[0].rawValue);
                   }
                 }} 
               />
            </div>
            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Apunta la cámara al código QR de la factura impresa.</p>
          </div>
        </div>
      )}
      
      {/* Success Modal */}
      {showSuccessModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ background: 'var(--color-bg-light)', padding: '2rem', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '400px', border: '1px solid rgba(16, 185, 129, 0.3)', textAlign: 'center' }}
          >
            <div className="flex justify-center mb-4 text-green-500">
              <CheckCircle2 size={48} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Transacción Guardada</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              Los datos se han guardado exitosamente en tu billetera. ¿Qué deseas hacer ahora?
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={resetForm}
                className="btn-primary w-full hover-relief flex items-center justify-center gap-2"
              >
                <PlusCircle size={18} /> Agregar Otra
              </button>
              <button 
                onClick={() => navigate('/')}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-xl transition-colors hover-relief flex items-center justify-center gap-2"
              >
                Ir al Menú Principal
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default AddTransaction;
