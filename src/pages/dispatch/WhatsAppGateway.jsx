import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Send, CheckCheck, FileText, Phone, 
  ExternalLink, Sparkles, CheckCircle2, RefreshCw, User 
} from 'lucide-react';
import { api } from '../../lib/api';

export const WhatsAppGateway = () => {
  const [parties, setParties] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Form
  const [form, setForm] = useState({
    trader_name: 'Rameshwar Fabrics (Surat)',
    phone: '+91 98251 44321',
    lot_no: 'LOT/2026-27/00001',
    challan_no: 'CH-8921',
    finished_meters: '1050',
    total_rolls: '10',
    eway_bill_no: '241890123456'
  });

  // Interactive Simulator State
  const [simText, setSimText] = useState('Status of Lot 1');
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'mill',
      text: '🧵 *SARV UTTAM DYEING & PRINTING MILL*\nNamaste Rameshwar Fabrics,\nYour finished fabric has been packed & dispatched under Challan #CH-8921 (1,050 meters).',
      time: '11:30 AM'
    },
    {
      sender: 'trader',
      text: 'Status of Lot 1',
      time: '11:32 AM'
    },
    {
      sender: 'mill',
      text: '📦 *Live Mill Status:*\nYour Lot *LOT/2026-27/00001* is currently *WAITING FOR STENTER*.\nEstimated ready for folding: Today at 4:30 PM.',
      time: '11:32 AM'
    }
  ]);

  const fetchLogs = async () => {
    try {
      const [p, l] = await Promise.all([
        api.get('/api/v1/parties').catch(() => []),
        api.get('/api/v1/whatsapp/logs').catch(() => ({ logs: [] }))
      ]);
      setParties(Array.isArray(p) ? p : []);
      setLogs(l.logs || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSendDispatch = async () => {
    setSending(true);
    setSuccessMsg('');
    try {
      const res = await api.post('/api/v1/whatsapp/send-dispatch-alert', form);
      setSuccessMsg(`✓ WhatsApp broadcast delivered to ${form.phone}!`);
      
      // Append to simulated chat
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'mill',
          text: res.sent_text,
          time: 'Just now'
        }
      ]);
      fetchLogs();
    } catch (err) {
      alert(err.message || 'Failed to dispatch WhatsApp message');
    } finally {
      setSending(false);
    }
  };

  const handleSimulateReply = async () => {
    if (!simText.trim()) return;
    const currentQ = simText;
    setChatMessages(prev => [...prev, { sender: 'trader', text: currentQ, time: 'Just now' }]);
    setSimText('');

    try {
      const res = await api.post('/api/v1/whatsapp/webhook-simulate', {
        incoming_text: currentQ
      });
      setChatMessages(prev => [
        ...prev,
        { sender: 'mill', text: res.automated_reply, time: 'Just now' }
      ]);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <MessageSquare size={12} className="text-emerald-400" />
              WhatsApp Business Cloud API
            </span>
            <span className="text-xs text-slate-400">Automated Client Gateway</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">WhatsApp Dispatch & Client Gateway</h1>
          <p className="text-xs text-slate-300 mt-0.5">Automated E-Challan alerts, PDF delivery links, and 2-way conversational lot tracking for mill traders</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 px-3.5 py-2 rounded-xl text-center border border-white/10">
            <span className="text-[9px] text-slate-300 font-bold block uppercase">Delivery Rate</span>
            <span className="text-sm font-black text-emerald-400">99.8%</span>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Grid: Form Left + Phone Simulator Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Dispatch Alert Trigger (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800">Trigger WhatsApp Dispatch Notification</h2>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Template: textile_dispatch_v2
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Trader / Broker Name:</label>
                <input 
                  type="text" 
                  value={form.trader_name} 
                  onChange={(e) => setForm({ ...form, trader_name: e.target.value })}
                  className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">WhatsApp Mobile Number:</label>
                <input 
                  type="text" 
                  value={form.phone} 
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Lot Number:</label>
                <input 
                  type="text" 
                  value={form.lot_no} 
                  onChange={(e) => setForm({ ...form, lot_no: e.target.value })}
                  className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Challan Number:</label>
                <input 
                  type="text" 
                  value={form.challan_no} 
                  onChange={(e) => setForm({ ...form, challan_no: e.target.value })}
                  className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Finished Meters:</label>
                <input 
                  type="number" 
                  value={form.finished_meters} 
                  onChange={(e) => setForm({ ...form, finished_meters: e.target.value })}
                  className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">E-Way Bill Number:</label>
                <input 
                  type="text" 
                  value={form.eway_bill_no} 
                  onChange={(e) => setForm({ ...form, eway_bill_no: e.target.value })}
                  className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <button
              onClick={handleSendDispatch}
              disabled={sending}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              {sending ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
              <span>Send Live WhatsApp Notification to Client</span>
            </button>
          </div>

          {/* Recent Broadcasts */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Recent Dispatches Delivered</h3>
            <div className="space-y-2">
              {logs.map(log => (
                <div key={log.log_id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{log.trader_name}</span>
                      <span className="text-[10px] text-slate-400">{log.phone}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{log.message_body}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                    <CheckCheck size={12} />
                    {log.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right: Interactive Phone WhatsApp UI Simulator (5 cols) */}
        <div className="lg:col-span-5">
          <div className="w-full max-w-sm mx-auto bg-slate-900 rounded-[36px] p-3 shadow-2xl border-4 border-slate-800">
            
            {/* Phone Screen Container */}
            <div className="bg-[#0B141A] rounded-[28px] overflow-hidden flex flex-col h-[520px]">
              
              {/* WhatsApp Header */}
              <div className="bg-[#1F2C34] p-3 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#6B4EFF] flex items-center justify-center font-bold text-xs">
                    S
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Sarv Uttam Mill Bot</span>
                    <span className="text-[9px] text-emerald-400 block">online</span>
                  </div>
                </div>
                <Phone size={14} className="text-slate-400" />
              </div>

              {/* Chat Body */}
              <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-[#0B141A]">
                {chatMessages.map((m, idx) => (
                  <div 
                    key={idx} 
                    className={`flex flex-col ${m.sender === 'trader' ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`p-2.5 rounded-xl max-w-[85%] text-xs ${
                      m.sender === 'trader' 
                        ? 'bg-[#005C4B] text-white rounded-tr-none' 
                        : 'bg-[#202C33] text-slate-200 rounded-tl-none'
                    }`}>
                      <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                      <div className="flex justify-end items-center gap-1 mt-1 text-[8px] text-slate-400">
                        <span>{m.time}</span>
                        {m.sender === 'mill' && <CheckCheck size={11} className="text-[#53BDEB]" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Simulator Input Footer */}
              <div className="p-2 bg-[#1F2C34] flex items-center gap-2">
                <input
                  type="text"
                  value={simText}
                  onChange={(e) => setSimText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSimulateReply()}
                  placeholder="Test reply (e.g. Status of Lot 1)..."
                  className="flex-1 text-[11px] p-2 bg-[#2A3942] text-white rounded-full focus:outline-none px-3"
                />
                <button
                  onClick={handleSimulateReply}
                  className="p-2 bg-[#00A884] text-white rounded-full"
                >
                  <Send size={13} />
                </button>
              </div>

            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
