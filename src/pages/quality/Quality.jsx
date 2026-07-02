import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Card, Table, Button, Badge, Modal, Input, Select } from '../../components/ui';
import { Plus, CheckSquare, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function Quality() {
  const [inspections, setInspections] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [defectTypes, setDefectTypes] = useState([]);
  
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState(null);

  // Form states
  const [inspectionForm, setInspectionForm] = useState({
    wo_id: '', batch_number: '', quantity_inspected: '', quantity_accepted: '', quantity_rejected: '', result: 'pending', remarks: ''
  });

  const [approvalForm, setApprovalForm] = useState({
    status: 'approved', remarks: ''
  });

  const fetchData = async () => {
    try {
      const insps = await api.get('/api/quality/inspections');
      setInspections(insps || []);
      const wos = await api.get('/api/production/work-orders');
      setWorkOrders(wos || []);
      const defects = await api.get('/api/quality/defect-types');
      setDefectTypes(defects || []);
    } catch (err) {
      console.error('Error fetching quality checks:', err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddInspection = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/quality/inspections', inspectionForm);
      setIsInspectionModalOpen(false);
      setInspectionForm({ wo_id: '', batch_number: '', quantity_inspected: '', quantity_accepted: '', quantity_rejected: '', result: 'pending', remarks: '' });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenApproval = (inspection) => {
    setSelectedInspection(inspection);
    setIsApprovalModalOpen(true);
  };

  const handlePostApproval = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/quality/inspections/${selectedInspection.inspection_id}/approve`, approvalForm);
      setIsApprovalModalOpen(false);
      setApprovalForm({ status: 'approved', remarks: '' });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Upper header section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inspections Table card */}
        <div className="lg:col-span-2">
          <Card 
            title="Quality Auditing Records" 
            headerActions={
              <Button onClick={() => setIsInspectionModalOpen(true)} className="flex items-center gap-1.5 bg-emerald-600">
                <Plus size={16} /> Audit Batch
              </Button>
            }
          >
            <div className="mt-4">
              <Table headers={['Audit Ref', 'WO Number', 'Batch No.', 'Inspected', 'Passed', 'Result', 'Workflow']}>
                {inspections.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-slate-400">
                      No quality audits registered. Click 'Audit Batch' to log evaluations.
                    </td>
                  </tr>
                ) : (
                  inspections.map((ins) => (
                    <tr key={ins.inspection_id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-mono font-bold text-xs">{ins.inspection_number}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{ins.wo_number || 'N/A'}</td>
                      <td className="px-6 py-4 font-mono text-xs">{ins.batch_number}</td>
                      <td className="px-6 py-4 font-semibold">{parseFloat(ins.quantity_inspected)} m</td>
                      <td className="px-6 py-4 text-slate-500">{parseFloat(ins.quantity_accepted)} m</td>
                      <td className="px-6 py-4">
                        <Badge status={ins.result}>{ins.result}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        {ins.result === 'pending' ? (
                          <button
                            onClick={() => handleOpenApproval(ins)}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"
                          >
                            <CheckSquare size={12} /> Sign Off
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                            <ShieldCheck size={12} className="text-emerald-500" /> Audited
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </Table>
            </div>
          </Card>
        </div>

        {/* Defect types index */}
        <div className="lg:col-span-1">
          <Card title="Defects Threshold Index">
            <div className="flex flex-col gap-4 mt-2 max-h-[480px] overflow-y-auto pr-1">
              {defectTypes.map((def) => (
                <div key={def.type_id} className="p-3.5 border border-slate-200 rounded-xl bg-white shadow-sm flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 text-sm">{def.name}</span>
                    <Badge status={def.severity}>{def.severity}</Badge>
                  </div>
                  <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{def.category} Module</div>
                  <p className="text-xs text-slate-400 leading-normal">{def.description}</p>
                  <div className="text-[10px] text-slate-400 font-bold border-t border-slate-100 pt-2 flex justify-between">
                    <span>Code: {def.code}</span>
                    <span className="text-rose-600">Tolerance Limit: {parseFloat(def.threshold_percentage)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* QC Audit Modal */}
      <Modal isOpen={isInspectionModalOpen} onClose={() => setIsInspectionModalOpen(false)} title="Audit Product Batch">
        <form onSubmit={handleAddInspection} className="flex flex-col gap-4">
          <Select
            label="Target Work Order"
            value={inspectionForm.wo_id}
            onChange={(e) => setInspectionForm({...inspectionForm, wo_id: e.target.value})}
            options={[{ value: '', label: '-- Select Run --' }, ...workOrders.map(w => ({ value: w.wo_id, label: `${w.wo_number} - ${w.product_name}` }))]}
            required
          />
          <Input label="Batch Number" placeholder="e.g. BATCH-PRD-COT-01" value={inspectionForm.batch_number} onChange={(e) => setInspectionForm({...inspectionForm, batch_number: e.target.value})} required />
          <div className="grid grid-cols-3 gap-4">
            <Input label="Total Audited (m)" type="number" value={inspectionForm.quantity_inspected} onChange={(e) => setInspectionForm({...inspectionForm, quantity_inspected: e.target.value})} required />
            <Input label="Passed Yardage (m)" type="number" value={inspectionForm.quantity_accepted} onChange={(e) => setInspectionForm({...inspectionForm, quantity_accepted: e.target.value})} required />
            <Input label="Defects Yield (m)" type="number" value={inspectionForm.quantity_rejected} onChange={(e) => setInspectionForm({...inspectionForm, quantity_rejected: e.target.value})} required />
          </div>
          <Input label="Quality Inspector Remarks" placeholder="Warp count, print alignment checks, shrinkage notes..." value={inspectionForm.remarks} onChange={(e) => setInspectionForm({...inspectionForm, remarks: e.target.value})} />

          <div className="flex justify-end gap-3 mt-4 border-t pt-4">
            <Button variant="secondary" onClick={() => setIsInspectionModalOpen(false)}>Discard</Button>
            <Button type="submit" variant="primary">Submit Audit</Button>
          </div>
        </form>
      </Modal>

      {/* Sign Off Modal */}
      <Modal isOpen={isApprovalModalOpen} onClose={() => setIsApprovalModalOpen(false)} title="Batch Release & Sign-off">
        <form onSubmit={handlePostApproval} className="flex flex-col gap-4">
          <div className="p-4 bg-slate-50 border rounded-lg flex flex-col gap-1 text-sm mb-2">
            <div>Batch: <strong className="text-slate-800 font-bold">{selectedInspection?.batch_number}</strong></div>
            <div>Inspected: <strong className="text-slate-800 font-bold">{selectedInspection ? parseFloat(selectedInspection.quantity_inspected) : 0} m</strong></div>
            <div>Good Fabric Yielded: <strong className="text-emerald-600 font-bold">{selectedInspection ? parseFloat(selectedInspection.quantity_accepted) : 0} m</strong></div>
          </div>
          <Select
            label="Approval Release Status"
            value={approvalForm.status}
            onChange={(e) => setApprovalForm({...approvalForm, status: e.target.value})}
            options={[
              { value: 'approved', label: 'APPROVED (Release Batch for Dispatch)' },
              { value: 'rejected', label: 'REJECTED (Hold / Recut Fabric)' },
              { value: 'rework', label: 'REWORK (Re-dye / Dyeing treatment)' }
            ]}
            required
          />
          <Input label="Verification & Sign-off Comments" placeholder="Verification report, releases details..." value={approvalForm.remarks} onChange={(e) => setApprovalForm({...approvalForm, remarks: e.target.value})} required />

          <div className="flex justify-end gap-3 mt-4 border-t pt-4">
            <Button variant="secondary" onClick={() => setIsApprovalModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Submit Release</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
