'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Download, AlertCircle, CheckCircle, Database } from 'lucide-react';
import { useToastStore } from '@/store';
import { apiClient as db } from '@/lib/apiClient';

export type ImportType = 'suppliers' | 'inventory' | 'customers';

interface CsvImportModalProps {
  type: ImportType;
  branchId?: string; // required for inventory
  onClose: () => void;
  onSuccess: () => void;
}

// ─── Column Map Definitions ──────────────────────────────────────────────────
const CONFIG = {
  suppliers: {
    title: 'Import Suppliers',
    columns: ['Name', 'Phone', 'Email', 'Address'],
    required: ['Name'],
    template: 'Name,Phone,Email,Address\nLake House Publishers,+94 11 242 4111,lakehouse@mail.lk,"Colombo, Sri Lanka"\nSarasavi Bookshop,+94 11 282 0820,info@sarasavi.lk,"Nugegoda, Sri Lanka"\n',
    filename: 'suppliers_template.csv'
  },
  inventory: {
    title: 'Import Inventory / Books',
    columns: ['ISBN', 'Barcode', 'Title', 'Author', 'Publisher', 'Category', 'Description', 'Cost Price', 'Selling Price', 'Stock Quantity', 'Reorder Level'],
    required: ['ISBN', 'Barcode', 'Title', 'Author', 'Cost Price', 'Selling Price'],
    template: 'ISBN,Barcode,Title,Author,Publisher,Category,Description,Cost Price,Selling Price,Stock Quantity,Reorder Level\n9780132350884,9780132350884,Clean Code,Robert C. Martin,Prentice Hall,Technology,A Handbook of Agile Software Craftsmanship,1500,2200,10,3\n9780596007126,9780596007126,Head First Design Patterns,Eric Freeman,O\'Reilly Media,Technology,A Brain-Friendly Guide,1800,2600,5,2\n',
    filename: 'inventory_template.csv'
  },
  customers: {
    title: 'Import Customers',
    columns: ['Name', 'Phone', 'Email', 'Total Spent', 'Outstanding Balance'],
    required: ['Name'],
    template: 'Name,Phone,Email,Total Spent,Outstanding Balance\nKasun Perera,+94 77 123 4567,kasun@mail.lk,1500,500\nNimal Silva,+94 77 987 6543,nimal@mail.lk,2500,0\n',
    filename: 'customers_template.csv'
  }
};

// ─── CSV Parser Helper ────────────────────────────────────────────────────────
function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentVal = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++; // skip double quote escape
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      row.push(currentVal.trim());
      currentVal = '';
      if (row.length > 0 && row.some(cell => cell !== '')) {
        lines.push(row);
      }
      row = [];
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n
      }
    } else {
      currentVal += char;
    }
  }
  if (currentVal || row.length > 0) {
    row.push(currentVal.trim());
    if (row.some(cell => cell !== '')) {
      lines.push(row);
    }
  }
  return lines;
}

export default function CsvImportModal({ type, branchId, onClose, onSuccess }: CsvImportModalProps) {
  const { addToast } = useToastStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [errors, setErrors] = useState<{ row: number; col: string; message: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const config = CONFIG[type];

  // ─── Download CSV Template ────────────────────────────────────────────────
  const downloadTemplate = () => {
    const blob = new Blob([config.template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', config.filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ─── File Parsing & Validation ──────────────────────────────────────────
  const processFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      addToast({
        type: 'error',
        title: 'Invalid File Type',
        message: 'Please select a valid CSV file (.csv).'
      });
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const rows = parseCSV(text);
      if (rows.length < 2) {
        addToast({
          type: 'warning',
          title: 'Empty File',
          message: 'The uploaded file has no data rows.'
        });
        return;
      }

      // Read Header Row
      const fileHeaders = rows[0].map(h => h.toLowerCase().trim());

      // Validate Header Row matches expected Columns
      const missingHeaders = config.columns.filter(col => 
        !fileHeaders.includes(col.toLowerCase().trim()) && config.required.includes(col)
      );

      if (missingHeaders.length > 0) {
        addToast({
          type: 'error',
          title: 'Template Mismatch',
          message: `Missing required columns: ${missingHeaders.join(', ')}`
        });
        return;
      }

      // Map file headers to indices
      const headerIndexMap: Record<string, number> = {};
      config.columns.forEach(col => {
        headerIndexMap[col] = fileHeaders.indexOf(col.toLowerCase().trim());
      });

      const items: any[] = [];
      const newErrors: { row: number; col: string; message: string }[] = [];

      // Loop through data rows (index 1+)
      for (let r = 1; r < rows.length; r++) {
        const rowData = rows[r];
        const record: Record<string, any> = {};
        
        // Map raw values
        config.columns.forEach(col => {
          const fileIndex = headerIndexMap[col];
          record[col] = fileIndex !== -1 && fileIndex < rowData.length ? rowData[fileIndex] : '';
        });

        // Validate values
        const rowNum = r;
        
        // 1. Required fields checks
        config.required.forEach(req => {
          if (!record[req]) {
            newErrors.push({ row: rowNum, col: req, message: `"${req}" is a required field.` });
          }
        });

        // 2. Specific validations per import type
        if (type === 'suppliers') {
          items.push({
            name: record['Name'],
            phone: record['Phone'],
            email: record['Email'],
            address: record['Address']
          });
        } 
        else if (type === 'inventory') {
          const cost = parseFloat(record['Cost Price']);
          const selling = parseFloat(record['Selling Price']);
          const quantity = record['Stock Quantity'] ? parseInt(record['Stock Quantity'], 10) : 0;
          const reorder = record['Reorder Level'] ? parseInt(record['Reorder Level'], 10) : 3;

          if (isNaN(cost) || cost < 0) {
            newErrors.push({ row: rowNum, col: 'Cost Price', message: 'Cost Price must be a valid positive number.' });
          }
          if (isNaN(selling) || selling < 0) {
            newErrors.push({ row: rowNum, col: 'Selling Price', message: 'Selling Price must be a valid positive number.' });
          }
          if (isNaN(quantity) || quantity < 0) {
            newErrors.push({ row: rowNum, col: 'Stock Quantity', message: 'Stock Quantity must be a positive integer.' });
          }
          if (isNaN(reorder) || reorder < 0) {
            newErrors.push({ row: rowNum, col: 'Reorder Level', message: 'Reorder Level must be a positive integer.' });
          }

          items.push({
            isbn: record['ISBN'],
            barcode: record['Barcode'],
            title: record['Title'],
            author: record['Author'],
            publisher: record['Publisher'],
            category: record['Category'] || 'Fiction',
            description: record['Description'],
            cost_price: cost,
            selling_price: selling,
            quantity: quantity,
            reorder_level: reorder
          });
        } 
        else if (type === 'customers') {
          const totalSpent = record['Total Spent'] ? parseFloat(record['Total Spent']) : 0;
          const totalDue = record['Outstanding Balance'] ? parseFloat(record['Outstanding Balance']) : 0;

          if (isNaN(totalSpent) || totalSpent < 0) {
            newErrors.push({ row: rowNum, col: 'Total Spent', message: 'Total Spent must be a valid number.' });
          }
          if (isNaN(totalDue) || totalDue < 0) {
            newErrors.push({ row: rowNum, col: 'Outstanding Balance', message: 'Outstanding Balance must be a valid number.' });
          }
          if (totalDue > 0 && !record['Phone']) {
            newErrors.push({ row: rowNum, col: 'Phone', message: 'Phone is required for tracking outstanding balance ledger.' });
          }

          items.push({
            name: record['Name'],
            phone: record['Phone'],
            email: record['Email'],
            totalSpent,
            totalDue
          });
        }
      }

      setErrors(newErrors);
      setParsedData(items);
    };

    reader.readAsText(file);
  };

  // ─── Drag & Drop Event Handlers ────────────────────────────────────────────
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // ─── Submit bulk import to server ──────────────────────────────────────────
  const handleImport = async () => {
    if (parsedData.length === 0 || errors.length > 0) return;

    setLoading(true);
    try {
      if (type === 'suppliers') {
        await db.importSuppliers(parsedData);
      } else if (type === 'inventory') {
        if (!branchId) throw new Error('Branch assignment is required to import stock.');
        await db.importInventory(branchId, parsedData);
      } else if (type === 'customers') {
        await db.importCustomers(parsedData);
      }

      addToast({
        type: 'success',
        title: 'Import Successful',
        message: `Successfully imported ${parsedData.length} records into the system.`
      });
      onSuccess();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Import Failed',
        message: err.message || 'Database error occurred during import transaction.'
      });
    } finally {
      setLoading(false);
    }
  };

  const hasCriticalErrors = errors.length > 0;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="glass-card w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">{config.title}</h2>
            <p className="text-sm text-white/50 mt-1">Upload and preview CSV data format below</p>
          </div>
          <button onClick={onClose} disabled={loading} className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-2 p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white/60 space-y-2">
            <p className="font-semibold text-white">Expected Columns Layout:</p>
            <div className="flex flex-wrap gap-1.5 font-mono text-xs">
              {config.columns.map(col => {
                const isReq = config.required.includes(col);
                return (
                  <span key={col} className={`px-2 py-0.5 rounded ${isReq ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-white/5 text-white/40'}`}>
                    {col}{isReq && '*'}
                  </span>
                );
              })}
            </div>
            <p className="text-xs text-white/40">* required fields</p>
          </div>
          <button
            onClick={downloadTemplate}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white hover:text-indigo-400 transition-all text-sm font-medium"
          >
            <Download size={20} />
            <span>Download CSV Template</span>
          </button>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300
            ${dragActive ? 'border-brand-500 bg-brand-500/10' : 'border-white/15 hover:border-white/30 bg-white/[0.02]'}
            ${fileName ? 'border-emerald-500/30 bg-emerald-500/[0.01]' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          {fileName ? (
            <>
              <CheckCircle className="w-10 h-10 text-emerald-400" />
              <p className="text-sm font-semibold text-white">{fileName}</p>
              <p className="text-xs text-white/40">Click to change or select another CSV file</p>
            </>
          ) : (
            <>
              <Upload className="w-10 h-10 text-white/40" />
              <p className="text-sm font-semibold text-white">Drag & drop your CSV file here</p>
              <p className="text-xs text-white/40">or click to browse local files</p>
            </>
          )}
        </div>

        {/* Validation & Preview Panel */}
        {parsedData.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">Parsed Rows: {parsedData.length}</span>
                {hasCriticalErrors ? (
                  <span className="inline-flex items-center gap-1 text-rose-400 text-xs px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                    <AlertCircle size={12} /> {errors.length} validation errors found
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-emerald-400 text-xs px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle size={12} /> Ready to import (no errors)
                  </span>
                )}
              </div>
            </div>

            {/* Error logs */}
            {hasCriticalErrors && (
              <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/10 text-xs text-rose-300 font-mono space-y-1 max-h-32 overflow-y-auto">
                <p className="font-bold text-rose-400 mb-1">Row Validation Log:</p>
                {errors.slice(0, 20).map((err, i) => (
                  <div key={i}>• [Row {err.row}] [{err.col}]: {err.message}</div>
                ))}
                {errors.length > 20 && <div>• And {errors.length - 20} more errors...</div>}
              </div>
            )}

            {/* Data grid preview */}
            <div className="border border-white/10 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#12121A] text-white/40 border-b border-white/10 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 font-medium">Row</th>
                    {config.columns.map(col => <th key={col} className="px-3 py-2 font-medium">{col}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-white/[0.01]">
                  {parsedData.slice(0, 10).map((item, idx) => {
                    const rowNum = idx + 1;
                    return (
                      <tr key={idx} className="hover:bg-white/[0.02]">
                        <td className="px-3 py-2 text-white/40">{rowNum}</td>
                        {config.columns.map(col => {
                          const val = item[col] || item[col.toLowerCase().replace(' ', '_')];
                          const cellErr = errors.find(err => err.row === rowNum && err.col === col);
                          return (
                            <td key={col} className={`px-3 py-2 ${cellErr ? 'bg-rose-500/10 text-rose-400 font-semibold' : 'text-white/70'}`}>
                              {val !== undefined ? String(val) : ''}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {parsedData.length > 10 && (
                <div className="text-center py-2 text-white/30 text-xs border-t border-white/5 bg-[#12121A]">
                  And {parsedData.length - 10} more rows...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer controls */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={loading || parsedData.length === 0 || hasCriticalErrors}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-brand-600 transition-all text-sm font-medium shadow-lg shadow-brand-600/25"
          >
            <Database size={15} />
            {loading ? 'Importing...' : 'Confirm Import'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
