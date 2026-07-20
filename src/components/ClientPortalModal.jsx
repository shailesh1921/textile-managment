import React, { useState } from 'react';
import { Modal, Button, Input, Badge } from './ui';
import { Search, ShieldCheck, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';

export function ClientPortalModal({ isOpen, onClose }) {
  const [step, setStep] = useState('REQUEST'); // 'REQUEST' | 'VERIFY' | 'TIMELINE'
  const [mobile, setMobile] = useState('');
  const [jobOrderNo, setJobOrderNo] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [demoOtp, setDemoOtp] = useState(null);
  const [orderResult, setOrderResult] = useState(null);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/api/v1/client-portal/request-otp', { mobile, jobOrderNo });
      setDemoOtp(res.demoOtp);
      setStep('VERIFY');
    } catch (err) {
      setError(err.message || 'Could not verify order or send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/api/v1/client-portal/verify-otp', { mobile, jobOrderNo, otpCode });
      setOrderResult(res);
      setStep('TIMELINE');
    } catch (err) {
      setError(err.message || 'Invalid OTP code');
    } finally {
      setLoading(false);
    }
  };

  const resetPortal = () => {
    setStep('REQUEST');
    setMobile('');
    setJobOrderNo('');
    setOtpCode('');
    setError(null);
    setOrderResult(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { resetPortal(); onClose(); }} title="Client Self-Service Order Tracker" className="max-w-2xl">
      <div className="flex flex-col gap-4">
        {error && (
          <div className="p-3 bg-rose-100 text-rose-700 rounded-lg text-sm flex items-center gap-2">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        {step === 'REQUEST' && (
          <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Enter your Job Order Number and registered Mobile Number to receive a 6-digit OTP code.
            </p>
            <Input 
              label="Job Order Number" 
              placeholder="e.g. JO-1001" 
              value={jobOrderNo} 
              onChange={(e) => setJobOrderNo(e.target.value)} 
              required 
            />
            <Input 
              label="Registered Mobile Number" 
              placeholder="e.g. 9876543210" 
              value={mobile} 
              onChange={(e) => setMobile(e.target.value)} 
              required 
            />
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
              <Button type="button" variant="outline" onClick={onClose}>Close</Button>
              <Button type="submit" disabled={loading} className="gap-2">
                <Search size={14} /> Send OTP & Track
              </Button>
            </div>
          </form>
        )}

        {step === 'VERIFY' && (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-lg text-xs font-mono">
              OTP sent to {mobile}. (Demo OTP: <span className="font-bold text-blue-900">{demoOtp}</span>)
            </div>
            <Input 
              label="Enter 6-Digit OTP Code" 
              placeholder="123456" 
              value={otpCode} 
              onChange={(e) => setOtpCode(e.target.value)} 
              required 
            />
            <div className="flex justify-between items-center mt-4 pt-3 border-t">
              <Button type="button" variant="ghost" onClick={() => setStep('REQUEST')}>Back</Button>
              <Button type="submit" disabled={loading} className="gap-2">
                <ShieldCheck size={14} /> Verify & Access Timeline
              </Button>
            </div>
          </form>
        )}

        {step === 'TIMELINE' && orderResult && (
          <div className="flex flex-col gap-6">
            <div className="bg-card border rounded-lg p-4 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">{orderResult.orderInfo.orderNo}</h3>
                <Badge variant="success">{orderResult.orderInfo.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Client: <span className="font-semibold">{orderResult.orderInfo.clientName}</span></div>
                <div>Fabric: <span className="font-semibold">{orderResult.orderInfo.fabricName}</span></div>
                <div>Meters: <span className="font-semibold">{orderResult.orderInfo.totalMeters} m</span></div>
                <div>Weight: <span className="font-semibold">{orderResult.orderInfo.totalKg} kg</span></div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <h4 className="font-bold text-sm">Shop Floor Production Batches</h4>
              {orderResult.batches.length === 0 ? (
                <p className="text-xs text-muted-foreground">Fabric is queued. Dyeing batch not yet loaded on machine.</p>
              ) : (
                orderResult.batches.map((b) => (
                  <div key={b.batch_id} className="border rounded-lg p-3 flex justify-between items-center text-sm">
                    <div>
                      <div className="font-semibold">{b.batch_no} ({b.process_name})</div>
                      <div className="text-xs text-muted-foreground">Machine: {b.machine_name}</div>
                    </div>
                    <Badge variant={b.status === 'COMPLETED' ? 'success' : 'warning'}>{b.status}</Badge>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t">
              <Button type="button" variant="outline" onClick={resetPortal}>Track Another Order</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
