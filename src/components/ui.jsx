import React from 'react';

export const Button = ({ children, onClick, type = 'button', variant = 'primary', className = '', disabled = false }) => {
  const base = 'px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500 shadow-sm',
    secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 focus:ring-slate-400 shadow-sm',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500 shadow-sm',
    success: 'bg-teal-600 hover:bg-teal-700 text-white focus:ring-teal-500 shadow-sm'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export const Input = ({ label, name, type = 'text', value, onChange, placeholder, required = false, className = '' }) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{label}</label>}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full bg-white text-slate-800 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all placeholder:text-slate-400 shadow-sm"
      />
    </div>
  );
};

export const Select = ({ label, name, value, onChange, options = [], required = false, className = '' }) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{label}</label>}
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full bg-white text-slate-800 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all shadow-sm"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export const Card = ({ children, title, headerActions, className = '' }) => {
  return (
    <div className={`bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden ${className}`}>
      {(title || headerActions) && (
        <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          {title && <h3 className="font-semibold text-slate-800 text-lg">{title}</h3>}
          {headerActions && <div>{headerActions}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};

export const Table = ({ headers = [], children, className = '' }) => {
  return (
    <div className={`w-full overflow-x-auto border border-slate-200 rounded-lg shadow-sm ${className}`}>
      <table className="w-full text-left border-collapse bg-white">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {headers.map((h, idx) => (
              <th key={idx} className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
          {children}
        </tbody>
      </table>
    </div>
  );
};

export const Badge = ({ children, status }) => {
  const getColors = () => {
    switch (String(status).toLowerCase()) {
      case 'active':
      case 'available':
      case 'passed':
      case 'approved':
      case 'sent':
      case 'completed':
      case 'delivered':
        return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      case 'in_use':
      case 'in_progress':
      case 'confirmed':
      case 'dispatched':
      case 'ordered':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'pending':
      case 'draft':
      case 'planned':
      case 'in_transit':
      case 'maintenance':
        return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'failed':
      case 'rejected':
      case 'cancelled':
      case 'breakdown':
      case 'critical':
      case 'blacklist':
        return 'bg-rose-50 border-rose-200 text-rose-700';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getColors()}`}>
      {children}
    </span>
  );
};

export const Modal = ({ isOpen, onClose, title, children, className = 'max-w-lg' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className={`bg-white rounded-xl shadow-xl border border-slate-200 w-full overflow-hidden transform transition-all z-10 ${className}`}>
        <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 text-lg">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
