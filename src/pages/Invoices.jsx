import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE } from '../services/mockApi';
import { 
  FileText, 
  Download, 
  Search, 
  Calendar, 
  Filter, 
  CheckCircle, 
  Clock, 
  IndianRupee 
} from 'lucide-react';
import { jsPDF } from 'jspdf';

const Invoices = () => {
  const { showToast } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem('cookie_accessToken');
      const res = await axios.get(`${API_BASE}/invoices`, {
        headers: token ? { 'Authorization': `Bearer ${JSON.parse(token).value}` } : {}
      });
      setInvoices(res.data);
      setFilteredInvoices(res.data);
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Filter Trigger
  useEffect(() => {
    let result = invoices;

    if (statusFilter !== 'All') {
      result = result.filter(inv => inv.status === statusFilter);
    }

    if (startDate) {
      result = result.filter(inv => inv.date >= startDate);
    }

    if (endDate) {
      result = result.filter(inv => inv.date <= endDate);
    }

    setFilteredInvoices(result);
  }, [statusFilter, startDate, endDate, invoices]);

  // Client-Side PDF Generation (GST Tax Invoice simulation)
  const generatePdf = (invoice) => {
    showToast(`Generating PDF invoice ${invoice.id}...`, 'info');
    
    try {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      // Colors
      const primaryColor = '#0C1B33';
      const secondaryColor = '#185FA5';
      const darkColor = '#1e293b';
      const lightColor = '#f8fafc';

      // Title & Logo
      doc.setFillColor(primaryColor);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor('#ffffff');
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('SwiftHaul Logistics', 15, 20);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Last-Mile Delivery Network (Indore)', 15, 26);
      doc.text('GSTIN: 23AABCS1421D1Z5  |  HSN Code: 9968', 15, 32);

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('TAX INVOICE', 145, 25);

      // Invoice Details
      doc.setTextColor(darkColor);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Invoice Details:', 15, 55);
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Invoice No: ${invoice.id}`, 15, 62);
      doc.text(`Date of Issue: ${invoice.date}`, 15, 68);
      doc.text(`Order reference: ${invoice.orderId}`, 15, 74);
      doc.text(`Place of Supply: Madhya Pradesh (23)`, 15, 80);

      // Customer Details
      doc.setFont('helvetica', 'bold');
      doc.text('Billed To (Recipient):', 115, 55);
      doc.setFont('helvetica', 'normal');
      doc.text('SwiftHaul Partner Store', 115, 62);
      doc.text(`GSTIN: ${invoice.gstin}`, 115, 68);
      doc.text('Indore Commercial Zone, MP', 115, 74);

      // Line items table header
      doc.setFillColor(lightColor);
      doc.rect(15, 95, 180, 10, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('S.No', 18, 101);
      doc.text('Description of Services (HSN 9968)', 35, 101);
      doc.text('Taxable Value', 110, 101);
      doc.text('GST (18%)', 140, 101);
      doc.text('Total (INR)', 170, 101);

      // Line item row
      doc.setFont('helvetica', 'normal');
      doc.text('1', 18, 115);
      doc.text(`Last-mile delivery charges for order ${invoice.orderId}`, 35, 115);
      
      const baseVal = (invoice.amount - invoice.gstAmount).toFixed(2);
      doc.text(`Rs. ${baseVal}`, 110, 115);
      doc.text(`Rs. ${invoice.gstAmount.toFixed(2)}`, 140, 115);
      doc.text(`Rs. ${invoice.amount.toFixed(2)}`, 170, 115);

      doc.line(15, 122, 195, 122); // separator

      // Calculation breakdown
      const cgstVal = (invoice.gstAmount / 2).toFixed(2);
      const sgstVal = (invoice.gstAmount / 2).toFixed(2);
      
      doc.setFontSize(10);
      doc.text('Subtotal (Taxable Value):', 115, 135);
      doc.text(`Rs. ${baseVal}`, 170, 135);

      doc.text('CGST (9.0%):', 115, 142);
      doc.text(`Rs. ${cgstVal}`, 170, 142);

      doc.text('SGST (9.0%):', 115, 149);
      doc.text(`Rs. ${sgstVal}`, 170, 149);

      doc.line(115, 153, 195, 153);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(secondaryColor);
      doc.text('Grand Total:', 115, 160);
      doc.text(`Rs. ${invoice.amount.toFixed(2)}`, 170, 160);

      // Footer
      doc.setTextColor('#94a3b8');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('This is a computer-generated tax invoice and requires no physical signature.', 15, 270);
      doc.text('Thank you for choosing SwiftHaul - Indore pilot logistics coordinating provider.', 15, 275);

      // Save PDF
      doc.save(`Invoice_${invoice.id}.pdf`);
      showToast('Invoice PDF downloaded successfully!', 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed to generate PDF download', 'error');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Filters Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">GST Bills & Invoices</h2>
            <p className="text-xs text-slate-400 font-medium">Download GSTIN-compliant receipt statements (HSN: 9968)</p>
          </div>
          <div className="p-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl flex items-center gap-1.5 text-xs font-bold">
            <Filter className="h-4 w-4" />
            Filters Applied
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          
          {/* Status Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Invoice Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-brand-blue"
            >
              <option value="All">All Invoices</option>
              <option value="Paid">Paid Only</option>
              <option value="Pending">Pending Only</option>
            </select>
          </div>

          {/* Date range picker */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Start Date</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Calendar className="h-3.5 w-3.5" />
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-brand-blue"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">End Date</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Calendar className="h-3.5 w-3.5" />
              </span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-brand-blue"
              />
            </div>
          </div>

          {/* Reset button */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setStatusFilter('All');
                setStartDate('');
                setEndDate('');
              }}
              className="w-full py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-500 transition-colors"
            >
              Clear Filters
            </button>
          </div>

        </div>
      </div>

      {/* Invoice list table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="p-4 font-semibold">Invoice ID</th>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Shipment Ref</th>
                <th className="p-4 font-semibold">Tax Metadata</th>
                <th className="p-4 font-semibold text-center">Status</th>
                <th className="p-4 font-semibold text-right">Taxable base</th>
                <th className="p-4 font-semibold text-right">Grand Total (₹)</th>
                <th className="p-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((invoice) => {
                const baseValue = (invoice.amount - invoice.gstAmount).toFixed(2);
                return (
                  <tr key={invoice.id} className="hover:bg-slate-50/30 transition-all font-medium">
                    <td className="p-4 font-extrabold text-slate-900">{invoice.id}</td>
                    <td className="p-4 text-slate-500">{invoice.date}</td>
                    <td className="p-4 text-slate-600 font-bold">{invoice.orderId}</td>
                    <td className="p-4">
                      <span className="block text-[10px] text-slate-400 font-medium">GSTIN: {invoice.gstin}</span>
                      <span className="block text-[10px] text-slate-400 font-medium mt-0.5">HSN: {invoice.hsn}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-flex items-center gap-1 ${
                        invoice.status === 'Paid' 
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                          : 'bg-amber-50 border-amber-100 text-amber-700'
                      }`}>
                        {invoice.status === 'Paid' ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        {invoice.status}
                      </span>
                    </td>
                    <td className="p-4 text-right text-slate-500 font-mono">₹{baseValue}</td>
                    <td className="p-4 text-right font-extrabold text-slate-900 font-mono">₹{invoice.amount}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => generatePdf(invoice)}
                        className="p-2 text-brand-blue hover:text-white hover:bg-brand-blue rounded-lg border border-sky-100 hover:border-brand-blue transition-all"
                        title="Download PDF Invoice"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400 font-bold">
                    No invoices matching current filters found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Invoices;
