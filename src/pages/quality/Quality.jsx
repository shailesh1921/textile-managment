import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Card, Table, Badge, Button, Modal, Input, Select } from '../../components/ui';
import { Plus, CheckSquare, XCircle, AlertTriangle, ShieldCheck, Palette, FileText } from 'lucide-react';

export default function Quality() {
  const [tab, setTab] = useState('inspections');
  const [inspections, setInspections] = useState([]);
  const [queueLots, setQueueLots] = useState([]);
  const [defectCodes, setDefectCodes] = useState([]);
  
  // Modals
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isShadeModalOpen, setIsShadeModalOpen] = useState(false);
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);

  // Forms
  const [auditForm, setAuditForm] = useState({
    lot_id: '',
    stage_id: '',
    inspection_type: 'FINAL_4PT',
    inspection_system: '4_POINT',
    qty_inspected_meters: '',
    result: 'PASS',
    remarks: '',
    defects: []
  });

  const [shadeForm, setShadeForm] = useState({
    lot_id: '',
    shade_id: '',
    measured_l: '',
    measured_a: '',
    measured_b: ''
  });

  const [labForm, setLabForm] = useState({
    lot_id: '',
    tests: [
      { test_type: 'GSM', required_value: '', actual_value: '', uom: 'G/M2', result: 'PASS' },
      { test_type: 'COLORFASTNESS_WASH', required_value: '4-5', actual_value: '', uom: 'GRADE', result: 'PASS' },
      { test_type: 'SHRINKAGE_PCT', required_value: '< 3%', actual_value: '', uom: 'PERCENTAGE', result: 'PASS' }
    ]
  });

  const fetchData = async () => {
    try {
      const insps = await api.get('/api/v1/qc/inspections');
      setInspections(insps || []);
      const queue = await api.get('/api/v1/qc/queue');
      setQueueLots(queue || []);
      const codes = await api.get('/api/v1/qc/defect-codes');
      setDefectCodes(codes || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tab]);

  // Set shade details when lot changes in shade form
  useEffect(() => {
    if (shadeForm.lot_id) {
      const matchingLot = queueLots.find(l => l.lot_id === parseInt(shadeForm.lot_id));
      if (matchingLot) {
        // Find shade_id from lot job order details
        api.get(`/api/v1/job-orders/${matchingLot.job_order_id}`).then(res => {
          setShadeForm(prev => ({ ...prev, shade_id: res.shade_id }));
        });
      }
    }
  }, [shadeForm.lot_id, queueLots]);

  const handleAddDefectLine = () => {
    setAuditForm(prev => ({
      ...prev,
      defects: [...prev.defects, { defect_code: 'COLOR_PATCH', severity: 'MINOR', points_assigned: 1, location: '' }]
    }));
  };

  const handleRemoveDefectLine = (index) => {
    setAuditForm(prev => {
      const copy = [...prev.defects];
      copy.splice(index, 1);
      return { ...prev, defects: copy };
    });
  };

  const handleCreateAudit = async (e) => {
    e.preventDefault();
    if (!auditForm.lot_id) return;
    try {
      await api.post('/api/v1/qc/inspections', {
        lot_id: parseInt(auditForm.lot_id),
        stage_id: auditForm.stage_id ? parseInt(auditForm.stage_id) : null,
        inspection_type: auditForm.inspection_type,
        inspection_system: auditForm.inspection_system,
        qty_inspected_meters: parseFloat(auditForm.qty_inspected_meters),
        result: auditForm.result,
        remarks: auditForm.remarks,
        defects: auditForm.defects.map(d => ({
          ...d,
          points_assigned: parseFloat(d.points_assigned)
        }))
      });
      setIsAuditModalOpen(false);
      setAuditForm({ lot_id: '', stage_id: '', inspection_type: 'FINAL_4PT', inspection_system: '4_POINT', qty_inspected_meters: '', result: 'PASS', remarks: '', defects: [] });
      fetchData();
      alert('Inspection report registered. Finished goods stock updated.');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateShadeApproval = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/v1/qc/shade-approval', {
        lot_id: parseInt(shadeForm.lot_id),
        shade_id: parseInt(shadeForm.shade_id),
        measured_l: parseFloat(shadeForm.measured_l),
        measured_a: parseFloat(shadeForm.measured_a),
        measured_b: parseFloat(shadeForm.measured_b)
      });
      setIsShadeModalOpen(false);
      alert(`CIELAB delta E color check processed.\nResult: ${res.result} (ΔE: ${parseFloat(res.delta_e)})`);
      setShadeForm({ lot_id: '', shade_id: '', measured_l: '', measured_a: '', measured_b: '' });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateLabTest = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/v1/qc/lab-tests', {
        lot_id: parseInt(labForm.lot_id),
        tests: labForm.tests
      });
      setIsLabModalOpen(false);
      alert('Lab specifications tested and logged.');
      setLabForm({ lot_id: '', tests: [
        { test_type: 'GSM', required_value: '', actual_value: '', uom: 'G/M2', result: 'PASS' },
        { test_type: 'COLORFASTNESS_WASH', required_value: '4-5', actual_value: '', uom: 'GRADE', result: 'PASS' },
        { test_type: 'SHRINKAGE_PCT', required_value: '< 3%', actual_value: '', uom: 'PERCENTAGE', result: 'PASS' }
      ] });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Sub navigation tabs */}
      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-slate-200">
        <div className="flex gap-2">
          {[
            { id: 'inspections', label: 'QC Inspections Ledger' },
            { id: 'queue', label: 'Inspection Queue' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                tab === t.id ? 'border-emerald-600 text-emerald-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-2">
          <Button onClick={() => setIsAuditModalOpen(true)} className="bg-emerald-600 text-xs py-1.5 flex items-center gap-1">
            <CheckSquare size={14} /> Audit Batch
          </Button>
          <Button onClick={() => setIsShadeModalOpen(true)} className="bg-blue-600 text-xs py-1.5 flex items-center gap-1">
            <Palette size={14} /> Shade Approval
          </Button>
          <Button onClick={() => setIsLabModalOpen(true)} className="bg-amber-600 text-xs py-1.5 flex items-center gap-1">
            <FileText size={14} /> Log Lab Spec
          </Button>
        </div>
      </div>

      {/* Inspections Tab */}
      {tab === 'inspections' && (
        <Card title="Inspections & Audits Summary">
          <Table headers={['Inspection Ref', 'Lot No', 'System used', 'Inspected (m)', 'Result', 'Audited Date', 'Inspector']}>
            {inspections.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-10 text-center text-slate-400">
                  No quality audits registered. Click 'Audit Batch' to log evaluations.
                </td>
              </tr>
            ) : (
              inspections.map(i => (
                <tr key={i.inspection_id} className="hover:bg-slate-50 text-xs">
                  <td className="px-6 py-3.5 font-mono font-bold text-slate-800">{i.inspection_no}</td>
                  <td className="px-6 py-3.5 font-mono font-semibold text-slate-600">{i.lot_no}</td>
                  <td className="px-6 py-3.5"><Badge status="pending">{i.inspection_system}</Badge></td>
                  <td className="px-6 py-3.5 font-bold">{parseFloat(i.qty_inspected_meters)} m</td>
                  <td className="px-6 py-3.5"><Badge status={i.result}>{i.result}</Badge></td>
                  <td className="px-6 py-3.5 text-slate-400">{new Date(i.inspected_at).toLocaleString()}</td>
                  <td className="px-6 py-3.5 font-semibold text-slate-700">{i.inspector_name}</td>
                </tr>
              ))
            )}
          </Table>
        </Card>
      )}

      {/* Queue Tab */}
      {tab === 'queue' && (
        <Card title="Pending Quality Inspections (Finished Lots)">
          <Table headers={['Lot Number', 'Job Card Order', 'Fabric Quality', 'Shade Reference', 'Current State', 'Action']}>
            {queueLots.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-10 text-center text-slate-400">
                  All processed lot batches are cleared. No lots waiting for final inspection.
                </td>
              </tr>
            ) : (
              queueLots.map(q => (
                <tr key={q.lot_id} className="hover:bg-slate-50 text-xs">
                  <td className="px-6 py-3.5 font-mono font-bold text-slate-800">{q.lot_no}</td>
                  <td className="px-6 py-3.5 font-mono font-semibold">{q.job_order_no}</td>
                  <td className="px-6 py-3.5 font-medium">{q.fabric_name}</td>
                  <td className="px-6 py-3.5 font-semibold text-slate-500">{q.shade_name || 'RFD'}</td>
                  <td className="px-6 py-3.5"><Badge status={q.current_status}>{q.current_status}</Badge></td>
                  <td className="px-6 py-3.5">
                    <button
                      onClick={() => {
                        setAuditForm(prev => ({ ...prev, lot_id: q.lot_id.toString(), qty_inspected_meters: q.grey_qty_meters_in }));
                        setIsAuditModalOpen(true);
                      }}
                      className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded font-bold"
                    >
                      Audit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </Table>
        </Card>
      )}

      {/* Audit Modal */}
      <Modal isOpen={isAuditModalOpen} onClose={() => setIsAuditModalOpen(false)} title="Audit Lot (4-Point Fabric Inspection)" className="max-w-2xl">
        <form onSubmit={handleCreateAudit} className="flex flex-col gap-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Select Ready Lot"
              value={auditForm.lot_id}
              onChange={e => setAuditForm({ ...auditForm, lot_id: e.target.value })}
              options={[{ value: '', label: '-- Select Lot --' }, ...queueLots.map(l => ({ value: l.lot_id, label: l.lot_no }))]}
              required
            />
            <Input
              label="Audited Length (meters)"
              type="number"
              value={auditForm.qty_inspected_meters}
              onChange={e => setAuditForm({ ...auditForm, qty_inspected_meters: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Inspection standard"
              value={auditForm.inspection_system}
              onChange={e => setAuditForm({ ...auditForm, inspection_system: e.target.value })}
              options={[{ value: '4_POINT', label: '4-Point Inspection System' }, { value: '10_POINT', label: '10-Point Inspection System' }]}
            />
            <Select
              label="Inspection Result"
              value={auditForm.result}
              onChange={e => setAuditForm({ ...auditForm, result: e.target.value })}
              options={[
                { value: 'PASS', label: 'PASS (Release Batch)' },
                { value: 'HOLD', label: 'QC HOLD (Re-dye / Shade correction)' },
                { value: 'FAIL', label: 'FAIL (Sell as seconds grade C)' }
              ]}
            />
          </div>

          {/* Defects list */}
          <div className="border rounded-lg overflow-hidden mt-2">
            <div className="bg-slate-50 p-2.5 flex justify-between items-center border-b">
              <span className="font-bold uppercase text-[10px] text-slate-500">Lot Defects Ledger</span>
              <Button onClick={handleAddDefectLine} className="bg-slate-800 text-[10px] py-1 px-2.5">
                + Add Defect
              </Button>
            </div>
            <div className="max-h-40 overflow-y-auto">
              <Table headers={['Defect Code', 'Severity', 'Points', 'Location (m)', 'Remove']}>
                {auditForm.defects.map((def, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-1.5">
                      <select
                        value={def.defect_code}
                        onChange={e => {
                          const copy = [...auditForm.defects];
                          copy[idx].defect_code = e.target.value;
                          setAuditForm({ ...auditForm, defects: copy });
                        }}
                        className="border rounded px-1.5 py-0.5"
                      >
                        {defectCodes.map(d => (
                          <option key={d.code} value={d.code}>{d.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-1.5">
                      <select
                        value={def.severity}
                        onChange={e => {
                          const copy = [...auditForm.defects];
                          copy[idx].severity = e.target.value;
                          setAuditForm({ ...auditForm, defects: copy });
                        }}
                        className="border rounded px-1.5 py-0.5"
                      >
                        <option value="MINOR">Minor</option>
                        <option value="MAJOR">Major</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </td>
                    <td className="px-6 py-1.5">
                      <input
                        type="number"
                        value={def.points_assigned}
                        onChange={e => {
                          const copy = [...auditForm.defects];
                          copy[idx].points_assigned = e.target.value;
                          setAuditForm({ ...auditForm, defects: copy });
                        }}
                        className="w-12 border rounded text-center"
                      />
                    </td>
                    <td className="px-6 py-1.5">
                      <input
                        value={def.location}
                        onChange={e => {
                          const copy = [...auditForm.defects];
                          copy[idx].location = e.target.value;
                          setAuditForm({ ...auditForm, defects: copy });
                        }}
                        className="border rounded px-1.5 py-0.5 w-24"
                        placeholder="e.g. 50m"
                      />
                    </td>
                    <td className="px-6 py-1.5">
                      <button type="button" onClick={() => handleRemoveDefectLine(idx)} className="text-rose-500 font-bold">
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </Table>
            </div>
          </div>

          <Input
            label="Internal Remarks"
            value={auditForm.remarks}
            onChange={e => setAuditForm({ ...auditForm, remarks: e.target.value })}
          />

          <div className="flex justify-end gap-3 mt-4 border-t pt-4">
            <Button variant="secondary" onClick={() => setIsAuditModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Submit Verification</Button>
          </div>
        </form>
      </Modal>

      {/* Shade Approval Modal */}
      <Modal isOpen={isShadeModalOpen} onClose={() => setIsShadeModalOpen(false)} title="Spectrophotometer Shade matching (Lab L*a*b*)">
        <form onSubmit={handleCreateShadeApproval} className="flex flex-col gap-4 text-xs">
          <Select
            label="Select Dyeing Lot"
            value={shadeForm.lot_id}
            onChange={e => setShadeForm({ ...shadeForm, lot_id: e.target.value })}
            options={[{ value: '', label: '-- Select Lot --' }, ...queueLots.map(l => ({ value: l.lot_id, label: l.lot_no }))]}
            required
          />
          <div className="bg-slate-50 p-3 rounded-lg border flex flex-col gap-1.5">
            <span className="font-bold text-slate-500 uppercase tracking-widest text-[9px]">Enter Measured Spectrophotometer CIELAB Values</span>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <Input
                label="L* (Lightness)"
                type="number"
                step="0.01"
                value={shadeForm.measured_l}
                onChange={e => setShadeForm({ ...shadeForm, measured_l: e.target.value })}
                required
              />
              <Input
                label="a* (Red-Green)"
                type="number"
                step="0.01"
                value={shadeForm.measured_a}
                onChange={e => setShadeForm({ ...shadeForm, measured_a: e.target.value })}
                required
              />
              <Input
                label="b* (Yellow-Blue)"
                type="number"
                step="0.01"
                value={shadeForm.measured_b}
                onChange={e => setShadeForm({ ...shadeForm, measured_b: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4 border-t pt-4">
            <Button variant="secondary" onClick={() => setIsShadeModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Perform Delta-E Match</Button>
          </div>
        </form>
      </Modal>

      {/* Lab Spec Modal */}
      <Modal isOpen={isLabModalOpen} onClose={() => setIsLabModalOpen(false)} title="Log Physical Lab Tests">
        <form onSubmit={handleCreateLabTest} className="flex flex-col gap-4 text-xs">
          <Select
            label="Select Lot"
            value={labForm.lot_id}
            onChange={e => setLabForm({ ...labForm, lot_id: e.target.value })}
            options={[{ value: '', label: '-- Select Lot --' }, ...queueLots.map(l => ({ value: l.lot_id, label: l.lot_no }))]}
            required
          />
          <Table headers={['Test Type', 'Required Specification', 'Actual Measured Spec', 'UOM', 'Result']}>
            {labForm.tests.map((test, index) => (
              <tr key={test.test_type}>
                <td className="px-6 py-2.5 font-bold text-slate-800">{test.test_type}</td>
                <td className="px-6 py-2.5">{test.required_value}</td>
                <td className="px-6 py-2.5">
                  <input
                    value={test.actual_value}
                    onChange={e => {
                      const next = [...labForm.tests];
                      next[index].actual_value = e.target.value;
                      setLabForm({ ...labForm, tests: next });
                    }}
                    className="border rounded px-1.5 py-0.5 text-center font-bold"
                    placeholder="Enter value"
                    required
                  />
                </td>
                <td className="px-6 py-2.5 text-slate-400 font-mono">{test.uom}</td>
                <td className="px-6 py-2.5">
                  <select
                    value={test.result}
                    onChange={e => {
                      const next = [...labForm.tests];
                      next[index].result = e.target.value;
                      setLabForm({ ...labForm, tests: next });
                    }}
                    className="border rounded px-1 py-0.5"
                  >
                    <option value="PASS">Pass</option>
                    <option value="FAIL">Fail</option>
                  </select>
                </td>
              </tr>
            ))}
          </Table>
          <div className="flex justify-end gap-3 mt-4 border-t pt-4">
            <Button variant="secondary" onClick={() => setIsLabModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Record Lab Results</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
