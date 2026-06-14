import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { addTransaction, uploadInvoice } from '../services/db';
import type { Transaction } from '../services/db';
import Tesseract from 'tesseract.js';
import { Html5Qrcode } from 'html5-qrcode';
import { motion } from 'framer-motion';
import { Camera, Upload, Loader2, CheckCircle2, QrCode, X } from 'lucide-react';

const OMNEX_SUBCATEGORIES = ["Alquiler", "Combustible", "Pago de internet", "Teléfono", "Plataforma digital", "Comida con clientes", "Mantenimiento del vehículo"];
const HIJOS_SUBCATEGORIES = ["Gastos de fútbol", "Salidas de recreación", "Ropa", "Útiles escolares", "Transporte", "Mensualidad de fútbol de Sebas", "Prácticas de fútbol de Sebas", "Torneos de fútbol de Sebas", "Uniforme de fútbol de Sebas", "Comida en tiempo compartido"];
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
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  React.useEffect(() => {
    if (isScanningQRCode) {
      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;
      
      html5QrCode.start(
        { facingMode: "environment" }, // prefer back camera
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScanSuccess,
        onScanFailure
      ).catch(err => {
        console.error("Error starting camera", err);
        setScanResult("Error al iniciar cámara. Asegúrate de dar permisos.");
      });
    } else {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().then(() => {
          html5QrCodeRef.current?.clear();
          html5QrCodeRef.current = null;
        }).catch(e => console.error("Failed to stop scanner", e));
      }
    }

    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().then(() => {
          html5QrCodeRef.current?.clear();
          html5QrCodeRef.current = null;
        }).catch(e => console.error("Failed to clear scanner on unmount", e));
      }
    };
  }, [isScanningQRCode]);

  const onScanSuccess = async (decodedText: string, decodedResult: any) => {
    if (html5QrCodeRef.current) {
      await html5QrCodeRef.current.stop().catch(e => console.error(e));
      html5QrCodeRef.current.clear();
      html5QrCodeRef.current = null;
    }
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

  const onScanFailure = (error: any) => {
    // Ignorar errores de escaneo continuos
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

  const performOCR = async (imageFile: File) => {
    setIsScanning(true);
    setScanResult('');
    try {
      const result = await Tesseract.recognize(imageFile, 'spa');
      const text = result.data.text;
      console.log("Texto extraído:", text); // Para debug en consola
      
      // Regex más inteligente para capturar formatos con o sin $, con o sin decimales.
      // Ej: $25.00, $ 25.00, 25, 25.50
      const regex = /(?:\$)?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?)/g;
      
      let match;
      let possibleAmounts: number[] = [];
      
      while ((match = regex.exec(text)) !== null) {
         let valStr = match[1];
         // Limpiar el string
         valStr = valStr.replace(/[^0-9.,]/g, '');
         // Si tiene coma y punto, asumimos que el punto es decimal y la coma separador de miles
         if (valStr.includes(',') && valStr.includes('.')) {
             valStr = valStr.replace(/,/g, '');
         } else if (valStr.includes(',')) {
             // Si solo tiene coma, asumimos que es el decimal
             valStr = valStr.replace(',', '.');
         }
         const val = parseFloat(valStr);
         // Filtramos valores 0, o números gigantes (como números de teléfono que Yappy a veces muestra)
         // Un pago de yappy rara vez excede 10,000, y los teléfonos en Panamá no tienen punto decimal.
         if (!isNaN(val) && val > 0 && val < 50000) { 
             // Penalizar números enteros que parecen teléfonos (8 dígitos en Panamá, ej 61234567)
             if (val.toString().length === 8 && !valStr.includes('.')) continue;
             
             possibleAmounts.push(val);
         }
      }

      if (possibleAmounts.length > 0) {
        // En un recibo el Total suele ser el número más grande, excepto si hay un balance previo.
        // Pero como es un comprobante de pago, el mayor número suele ser el monto pagado.
        const maxAmount = Math.max(...possibleAmounts);
        setFormData(prev => ({ ...prev, amount: maxAmount.toString() }));
        setScanResult('¡Monto detectado! Por favor, verifica que sea correcto.');
      } else {
        setScanResult('No se detectó un monto claro. Revisa la imagen o ingrésalo manualmente.');
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
      navigate('/transactions');
    } catch (error) {
      console.error(error);
      alert('Error al guardar la transacción');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
              required 
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
      </div>

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
            <div id="qr-reader" style={{ width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}></div>
            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Apunta la cámara al código QR de la factura impresa.</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AddTransaction;
