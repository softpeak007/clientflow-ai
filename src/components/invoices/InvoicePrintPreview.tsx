import React, { useState, useEffect } from 'react';
import { Invoice, Client, Project, User } from '../../types';
import { formatCurrency, cn } from '../../lib/utils';
import { format } from 'date-fns';
import { Printer, X, Plus, Trash2, Edit3, Check, Palette, FileSpreadsheet, Share2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InvoicePrintPreviewProps {
  invoice: Invoice;
  project?: Project;
  client?: Client;
  user: User | null;
  onClose: () => void;
  autoDownload?: boolean;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

export default function InvoicePrintPreview({
  invoice,
  project,
  client,
  user,
  onClose,
  autoDownload = false
}: InvoicePrintPreviewProps) {
  // Geometric Balance Accents
  const themes = [
    { name: 'Slate Deep', bg: 'bg-[#0A192F]', text: 'text-[#0A192F]', border: 'border-[#0A192F]', hoverBg: 'hover:bg-[#162a4a]', hex: '#0A192F' },
    { name: 'Emerald Balance', bg: 'bg-[#064E3B]', text: 'text-[#064E3B]', border: 'border-[#064E3B]', hoverBg: 'hover:bg-[#065F46]', hex: '#064E3B' },
    { name: 'Indigo Core', bg: 'bg-[#312E81]', text: 'text-[#312E81]', border: 'border-[#312E81]', hoverBg: 'hover:bg-[#3730A3]', hex: '#312E81' },
    { name: 'Brutalist Ebony', bg: 'bg-[#111827]', text: 'text-[#111827]', border: 'border-[#111827]', hoverBg: 'hover:bg-[#1F2937]', hex: '#111827' },
  ];

  const [activeTheme, setActiveTheme] = useState(themes[0]);
  const [taxRate, setTaxRate] = useState<number>(5); // percentage
  const [showEditor, setShowEditor] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Editable Freelancer Info
  const [fromName, setFromName] = useState(user?.displayName || 'Sarah Connor');
  const [fromEmail, setFromEmail] = useState(user?.email || 'sarah.freelancer@example.com');
  const [fromCompany, setFromCompany] = useState('ClientFlow Corporate Services');
  const [fromAddress, setFromAddress] = useState('100 Innovation Parkway, Suite 500\nSan Jose, CA 95110');
  const [paymentTerms, setPaymentTerms] = useState('Net 30 days. Please include invoice number in payment description.');
  const [bankDetails, setBankDetails] = useState('Silicon Valley Bank\nRouting: 121122334\nAccount: 9988776655');

  // Dynamic Item List (breakdown the main amount)
  const [items, setItems] = useState<InvoiceItem[]>([]);

  useEffect(() => {
    // Generate default line item breakdown based on total invoice amount
    const amt = invoice.amount || 1000;
    const item1 = {
      id: 'item-1',
      description: `${project?.name || 'Milestone'} - Primary Development & Architecture Setups`,
      quantity: 1,
      rate: Math.round(amt * 0.7)
    };
    const item2 = {
      id: 'item-2',
      description: `Premium UI/UX Iterations & Interactive Prototypes`,
      quantity: 1,
      rate: Math.round(amt * 0.2)
    };
    const item3 = {
      id: 'item-3',
      description: `Deployment Setup, Domain Linking, and Testing Support`,
      quantity: 1,
      rate: Math.round(amt * 0.1)
    };

    // Keep item3 to avoid roundoff differences
    const currentSum = item1.rate + item2.rate;
    item3.rate = Math.max(0, amt - currentSum);

    setItems([item1, item2, item3]);
  }, [invoice, project]);

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: 'item-' + Math.random().toString(36).substr(2, 9),
      description: 'New Deliverable / Service Milestone',
      quantity: 1,
      rate: 150
    };
    setItems([...items, newItem]);
  };

  const handleUpdateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        if (field === 'rate' || field === 'quantity') {
          return { ...item, [field]: Number(value) };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  // Computations
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const grandTotal = subtotal + taxAmount;

  const [isDownloading, setIsDownloading] = useState(false);
  const [hasAutoDownloaded, setHasAutoDownloaded] = useState(false);

  const handleDownloadPDF = async () => {
    const element = document.getElementById('invoice-print-paper');
    if (!element) return;

    setIsDownloading(true);
    try {
      const [html2canvasModule, jspdfModule] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ]);
      const html2canvas = html2canvasModule.default;
      const jsPDF = jspdfModule.jsPDF;

      const canvas = await html2canvas(element, {
        scale: 2, // Capture at double resolution for crisp text/borders
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`invoice-${invoice.id.slice(0, 8).toUpperCase()}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    if (autoDownload && items.length > 0 && !isDownloading && !hasAutoDownloaded) {
      setHasAutoDownloaded(true);
      const timer = setTimeout(() => {
        handleDownloadPDF();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [autoDownload, items, hasAutoDownloaded]);

  const handleTriggerPrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    const url = window.location.origin + `/invoices`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[120] flex flex-col md:flex-row bg-slate-900/80 backdrop-blur-md overflow-y-auto">
      {/* Sidebar Controls (Hidden during print) */}
      <div className="w-full md:w-80 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-6 space-y-6 flex flex-col shrink-0 print:hidden justify-between">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-850 text-sm leading-tight">Print Sandbox</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Geometric Balance System</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Theme selection */}
          <div className="space-y-2">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" />
              Geometric Theme
            </span>
            <div className="grid grid-cols-2 gap-2">
              {themes.map((th) => (
                <button
                  key={th.name}
                  onClick={() => setActiveTheme(th)}
                  className={cn(
                    "flex flex-col items-start p-2.5 rounded-xl border text-left transition-all",
                    activeTheme.name === th.name 
                      ? "border-blue-600 bg-blue-50/20 ring-1 ring-blue-600" 
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className={cn("w-3 h-3 rounded-md shadow-sm", th.bg)}></span>
                    <span className="text-[11px] font-bold text-slate-700 leading-none">{th.name.split(' ')[0]}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Editor Switcher */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5" />
                Customize Details
              </span>
              <button
                onClick={() => setShowEditor(!showEditor)}
                className="text-[10px] bg-slate-100 text-slate-700 hover:bg-[#0A192F] hover:text-white px-2.5 py-1 rounded-md font-bold transition-all"
              >
                {showEditor ? 'Collapse Form' : 'Expand Form'}
              </button>
            </div>

            {showEditor && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3 pt-1 text-left bg-slate-50 p-4 rounded-xl border border-slate-200 overflow-hidden"
              >
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Sender Name</label>
                  <input
                    type="text"
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Sender Company</label>
                  <input
                    type="text"
                    value={fromCompany}
                    onChange={(e) => setFromCompany(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Sender Address</label>
                  <textarea
                    rows={2}
                    value={fromAddress}
                    onChange={(e) => setFromAddress(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-600 resize-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Tax Rate (%)</label>
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Payment Bank Info</label>
                  <textarea
                    rows={2}
                    value={bankDetails}
                    onChange={(e) => setBankDetails(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-600 resize-none font-mono"
                  />
                </div>
              </motion.div>
            )}
          </div>

          <hr className="border-slate-100" />

          {/* Quick Line-Item Customization */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Line Item Breakdowns
              </span>
              <button
                onClick={handleAddItem}
                className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-0.5 rounded-md font-bold transition-all"
              >
                <Plus className="w-3 h-3" />
                Add Item
              </button>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {items.map((item) => (
                <div key={item.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1.5">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                    className="w-full bg-white border border-slate-100 px-2 py-1 rounded text-slate-700 font-medium"
                    placeholder="Describe item..."
                  />
                  <div className="flex gap-2">
                    <div className="w-1/3">
                      <label className="text-[9px] text-slate-400 font-bold uppercase block">Qty</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(item.id, 'quantity', e.target.value)}
                        className="w-full bg-white border border-slate-100 px-1 py-0.5 rounded text-center"
                      />
                    </div>
                    <div className="w-2/3 flex items-end gap-1">
                      <div className="flex-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase block">Rate ($)</label>
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => handleUpdateItem(item.id, 'rate', e.target.value)}
                          className="w-full bg-white border border-slate-100 px-1 py-0.5 rounded"
                        />
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1 text-slate-400 hover:text-red-500 rounded bg-white border border-slate-100 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all transform hover:-translate-y-0.5 disabled:cursor-not-allowed cursor-pointer"
          >
            {isDownloading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Generating PDF...
              </span>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download PDF
              </>
            )}
          </button>

          <button
            onClick={handleTriggerPrint}
            className={cn(
              "w-full py-3 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-transform hover:-translate-y-0.5",
              activeTheme.bg
            )}
          >
            <Printer className="w-4 h-4" />
            Print / Save as PDF
          </button>

          <button
            onClick={handleCopyLink}
            className="w-full py-2.5 bg-white border border-slate-200 hover:border-slate-350 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                Copied Link to Clipboard!
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-slate-400" />
                Copy Sharing Address
              </>
            )}
          </button>

          <p className="text-[10px] text-slate-400 text-center leading-normal">
            Use standard system printing settings to save as an official <strong>PDF document</strong>.
          </p>
        </div>
      </div>

      {/* Main Print Area */}
      <div className="flex-1 bg-slate-100 p-4 md:p-12 overflow-y-auto flex justify-center items-start print:bg-white print:p-0 print:overflow-hidden print:w-full">
        {/* Printable Paper A4 Page */}
        <div 
          id="invoice-print-paper"
          className="w-full max-w-[800px] bg-white rounded-2xl md:rounded-3xl shadow-xl overflow-hidden border border-slate-100 print:shadow-none print:border-none print:rounded-none min-h-[1050px] p-8 md:p-12 flex flex-col justify-between"
        >
          {/**************** HEADER (Geometric Accent) ****************/}
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
              {/* Left Brand Identity */}
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white", activeTheme.bg)}>
                  <div className="w-5 h-5 border-4 border-white rounded-sm"></div>
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">{fromCompany || 'ClientFlow'}</h1>
                  <p className="text-[9px] text-[#0A192F] tracking-widest font-extrabold uppercase opacity-80">INVOICE OFFICE</p>
                </div>
              </div>

              {/* Right Title Block */}
              <div className="text-right sm:text-right">
                <h2 className={cn("text-3xl font-extrabold tracking-tighter uppercase", activeTheme.text)}>
                  INVOICE
                </h2>
                <span className="text-sm text-slate-500 font-mono tracking-tight">
                  #{invoice.id.slice(0, 8).toUpperCase()}
                </span>
                <div className="mt-1">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                    invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                    invoice.status === 'sent' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                  )}>
                    {invoice.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Geometric Slash bar */}
            <div className={cn("w-full h-1.5 rounded-full", activeTheme.bg)} />

            {/**************** SENDER AND RECIPIENT INFORMATION (Grid Pattern) ****************/}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
              {/* Left Details: BILL FROM */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">
                  Bill From
                </h4>
                <div>
                  <p className="font-bold text-slate-900">{fromName}</p>
                  {fromCompany && <p className="text-xs text-slate-500 font-semibold">{fromCompany}</p>}
                  <p className="text-xs text-slate-400 mt-1 whitespace-pre-line leading-relaxed font-medium">
                    {fromAddress}
                  </p>
                  <p className="text-xs text-slate-400 font-mono mt-1">{fromEmail}</p>
                </div>
              </div>

              {/* Right Details: BILL TO */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">
                    Bill To
                  </h4>
                  <div>
                    <p className="font-bold text-slate-900">{client?.name || 'Valued Client'}</p>
                    {client?.company && <p className="text-xs text-slate-500 font-semibold">{client?.company}</p>}
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{client?.email || 'client@example.com'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Date Issued</span>
                    <span className="text-xs font-bold text-slate-800 font-mono">
                      {format(new Date(invoice.createdAt || new Date()), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Due Date</span>
                    <span className="text-xs font-bold text-slate-800 font-mono">
                      {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {project && (
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div>
                  <span className="text-[9px] text-blue-700 font-black uppercase tracking-widest block">Associated Project</span>
                  <p className="text-xs font-extrabold text-blue-950">{project.name}</p>
                </div>
                {project.deadline && (
                  <div className="text-left md:text-right">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Deadline</span>
                    <span className="text-xs font-bold text-slate-700">{format(new Date(project.deadline), 'MMM dd, yyyy')}</span>
                  </div>
                )}
              </div>
            )}

            {/**************** TABLE (Letterhead grid system) ****************/}
            <div className="mt-8">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[60%]">
                      Service Deliverable / Milestone Description
                    </th>
                    <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-[10%]">
                      Qty
                    </th>
                    <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-[15%]">
                      Rate / Price
                    </th>
                    <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-[15%]">
                      Line Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-4">
                        <span className="text-xs font-bold text-slate-800 block">
                          {idx + 1}. {item.description}
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <span className="text-xs font-bold text-slate-700 font-mono">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <span className="text-xs text-slate-600 font-mono">
                          {formatCurrency(item.rate)}
                        </span>
                      </td>
                      <td className="py-4 text-right font-bold text-slate-900 font-mono">
                        {formatCurrency(item.quantity * item.rate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/**************** FINANCIAL SUMMARY PANEL ****************/}
            <div className="flex flex-col md:flex-row justify-between items-start gap-8 pt-6 border-t-2 border-slate-100">
              {/* Payment Details */}
              <div className="w-full md:w-[50%] space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                  <span className="text-[9px] text-[#0A192F] font-black uppercase tracking-widest block">Bank Wire Instructions</span>
                  <p className="text-[11px] font-bold text-slate-700 font-mono whitespace-pre-line leading-relaxed">
                    {bankDetails}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Payment Terms Notes</span>
                  <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                    {paymentTerms}
                  </p>
                </div>
              </div>

              {/* Aggregates block */}
              <div className="w-full md:w-[40%] space-y-3 shrink-0">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold uppercase">Subtotal</span>
                  <span className="font-bold text-slate-800 font-mono">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold uppercase">Estimated Taxes ({taxRate}%)</span>
                  <span className="font-semibold text-slate-700 font-mono">{formatCurrency(taxAmount)}</span>
                </div>
                
                {/* Grand Total banner */}
                <div className={cn("p-4 rounded-xl flex justify-between items-center text-white", activeTheme.bg)}>
                  <span className="text-xs font-black uppercase tracking-wider">Grand Total (USD)</span>
                  <span className="text-lg font-black font-mono">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/**************** FOOTER BRANDING (Geometric Accent) ****************/}
          <div className="pt-10 border-t border-slate-100 text-center space-y-2">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Thank you for choosing {fromCompany || 'ClientFlow Corporate Services'}. We appreciate your business!
            </p>
            <p className="text-[9px] text-slate-300 font-mono">
              Computer Generated Document • No handwritten signature required • Registered Workspace
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
