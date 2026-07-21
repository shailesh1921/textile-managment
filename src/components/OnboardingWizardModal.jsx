import React, { useState } from 'react';
import { Modal, Button, Input, Select } from './ui';
import { CheckCircle2, ArrowRight, Factory, Users, UserCheck } from 'lucide-react';
import { api } from '../lib/api';

export function OnboardingWizardModal({ isOpen, onComplete }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Machine
  const [machineName, setMachineName] = useState('Jet Dyeing #1');
  const [machineType, setMachineType] = useState('JET');

  // Step 2: Customer
  const [customerName, setCustomerName] = useState('Om Fabrics Surat');
  const [customerPhone, setCustomerPhone] = useState('9876543210');

  // Step 3: Staff
  const [staffName, setStaffName] = useState('Rajesh Sharma');

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/v1/machines', {
        machine_code: `MCH-${Date.now().toString().slice(-4)}`,
        machine_name: machineName,
        machine_type: machineType,
        capacity_kg: 250
      }).catch(() => {}); // gracefully degrade if endpoint varies
      setStep(2);
    } catch (err) {
      console.error(err);
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/v1/parties', {
        party_code: `CLI-${Date.now().toString().slice(-4)}`,
        legal_name: customerName,
        party_type: 'TRADER_MERCHANT',
        mobile: customerPhone
      }).catch(() => {});
      setStep(3);
    } catch (err) {
      console.error(err);
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await api.post('/api/auth/complete-onboarding');
      onComplete();
    } catch (err) {
      console.error(err);
      onComplete();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => {}} title="Welcome to Surat Textile ERP (First Time Setup)" className="max-w-xl">
      <div className="flex flex-col gap-6">
        {/* Wizard Steps indicator */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className={`flex items-center gap-2 text-xs font-semibold ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
            <Factory size={16} /> 1. Machine Unit
          </div>
          <div className={`flex items-center gap-2 text-xs font-semibold ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
            <Users size={16} /> 2. Customer Party
          </div>
          <div className={`flex items-center gap-2 text-xs font-semibold ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
            <UserCheck size={16} /> 3. Finish Setup
          </div>
        </div>

        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="flex flex-col gap-4">
            <h4 className="font-bold text-sm">Add Your First Shop Floor Machine</h4>
            <Input label="Machine Name" value={machineName} onChange={(e) => setMachineName(e.target.value)} required />
            <Select 
              label="Machine Type" 
              value={machineType} 
              onChange={(e) => setMachineType(e.target.value)} 
              options={[
                { value: 'JET', label: 'Jet Dyeing' },
                { value: 'JIGGER', label: 'Jigger Machine' },
                { value: 'STENTER', label: 'Stenter Finishing' }
              ]} 
            />
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>Skip Step</Button>
              <Button type="submit" disabled={loading} className="gap-2">
                Next: Add Customer <ArrowRight size={14} />
              </Button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="flex flex-col gap-4">
            <h4 className="font-bold text-sm">Add Your First Client / Fabric Owner</h4>
            <Input label="Party / Client Legal Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
            <Input label="Mobile Number" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required />
            <div className="flex justify-between items-center mt-4 pt-3 border-t">
              <Button type="button" variant="ghost" onClick={() => setStep(1)}>Back</Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep(3)}>Skip Step</Button>
                <Button type="submit" disabled={loading} className="gap-2">
                  Next: Finish Setup <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4 text-center py-4">
            <CheckCircle2 size={48} className="text-emerald-500 mx-auto" />
            <h3 className="font-bold text-lg">Your Mill Workspace is Ready!</h3>
            <p className="text-sm text-muted-foreground">
              You can now manage job orders, dye recipes, production batches, and financial ledgers independently.
            </p>
            <div className="flex justify-center mt-4 pt-3 border-t">
              <Button onClick={handleFinish} disabled={loading} className="w-full sm:w-auto px-8 py-2.5">
                Launch Mill ERP Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
