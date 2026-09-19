import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Button, Input, Select, Card, Badge, Table, TableRow, TableCell } from '../../components/ui';
import { Building, Shield, User, Users, Mail, Phone, MapPin, Hash, Plus, Check, Save, Sparkles, Key, CheckCircle2 } from 'lucide-react';

export default function MillProfile() {
  const [profile, setProfile] = useState(null);
  const [staff, setStaff] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Add staff modal state
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({
    username: '',
    full_name: '',
    email: '',
    password: '',
    role_id: ''
  });
  const [staffLoading, setStaffLoading] = useState(false);

  const fetchProfile = async () => {
    try {
      const data = await api.get('/api/settings/mill-profile');
      setProfile(data.tenant);
      setStaff(data.staff || []);
      setRoles(data.roles || []);
      if (data.roles?.length > 0 && !newStaff.role_id) {
        setNewStaff(prev => ({ ...prev, role_id: data.roles[0].role_id }));
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to load mill profile' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ type: '', text: '' });
    try {
      await api.put('/api/settings/mill-profile', {
        mill_name: profile.mill_name,
        gstin: profile.gstin,
        state_code: profile.state_code,
        address: profile.address,
        city: profile.city,
        pincode: profile.pincode
      });
      setMsg({ type: 'success', text: 'Mill profile updated successfully!' });
      setTimeout(() => setMsg({ type: '', text: '' }), 4000);
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setStaffLoading(true);
    setMsg({ type: '', text: '' });
    try {
      await api.post('/api/settings/staff', newStaff);
      setMsg({ type: 'success', text: `Staff user "${newStaff.username}" created successfully!` });
      setShowAddStaff(false);
      setNewStaff({ username: '', full_name: '', email: '', password: '', role_id: roles[0]?.role_id || '' });
      fetchProfile();
      setTimeout(() => setMsg({ type: '', text: '' }), 4000);
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to add staff member' });
    } finally {
      setStaffLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-sm text-slate-500">
        <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin mr-2" />
        Loading Mill Settings & Staff Directory...
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Building className="text-primary" size={24} />
            Mill Workspace & Multi-Tenant Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your mill profile, GST credentials, isolated database tenant, and staff operator access.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge status="PASS" className="font-bold text-xs uppercase px-3 py-1">
            {profile?.plan_type || 'STARTER'} PLAN
          </Badge>
          <div className="text-[11px] text-slate-400 font-mono bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
            Tenant: {profile?.subdomain_or_slug}
          </div>
        </div>
      </div>

      {msg.text && (
        <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
          msg.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-rose-50 border border-rose-200 text-rose-700'
        }`}>
          {msg.type === 'success' ? <CheckCircle2 size={16} /> : null}
          {msg.text}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Tenant Identity & Security */}
        <div className="space-y-6">
          <Card title="Workspace Identity" description="Dedicated tenant configuration & isolation boundary">
            <div className="space-y-3.5 text-xs text-slate-600">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tenant UUID (Private Key)</span>
                <p className="font-mono font-medium text-[11px] text-slate-800 break-all select-all">{profile?.tenant_id}</p>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="font-semibold text-slate-500">Domain / Subdomain</span>
                <span className="font-mono font-bold text-primary">{profile?.subdomain_or_slug}.vastraerp.com</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="font-semibold text-slate-500">Data Isolation</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <Shield size={13} /> Strict Row-Level Multi-Tenant
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="font-semibold text-slate-500">Cluster Location</span>
                <span className="font-bold text-slate-700">{profile?.city || 'Surat'}, India</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="font-semibold text-slate-500">Onboarding Status</span>
                <Badge status={profile?.onboarding_completed ? 'PASS' : 'IN_PROGRESS'}>
                  {profile?.onboarding_completed ? 'Completed' : 'Setup Pending'}
                </Badge>
              </div>
            </div>
          </Card>

          <Card title="Security & Compliance" description="Textile manufacturing cluster standards">
            <ul className="text-xs space-y-2 text-slate-600">
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-500" /> GST Rule 55 Delivery Challan isolation
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-500" /> ASTM D5430 private defect records
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-500" /> Encrypted bcrypt password hashing
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-500" /> JWT server-derived tenant enforcement
              </li>
            </ul>
          </Card>
        </div>

        {/* Right 2 Columns: Editable Mill Profile & Staff Directory */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Edit Mill Details Form */}
          <Card title="Mill Business Profile" description="Used on invoices, delivery challans, and tax filings">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Registered Mill Name"
                  value={profile?.mill_name || ''}
                  onChange={e => setProfile({ ...profile, mill_name: e.target.value })}
                  required
                />
                <Input
                  label="GSTIN (15-character)"
                  value={profile?.gstin || ''}
                  onChange={e => setProfile({ ...profile, gstin: e.target.value.toUpperCase() })}
                  placeholder="24AAACS1234A1Z0"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="City / Hub"
                  value={profile?.city || ''}
                  onChange={e => setProfile({ ...profile, city: e.target.value })}
                />
                <Input
                  label="State Code (e.g. 24 for Gujarat)"
                  value={profile?.state_code || ''}
                  onChange={e => setProfile({ ...profile, state_code: e.target.value })}
                  maxLength={2}
                />
                <Input
                  label="Pincode"
                  value={profile?.pincode || ''}
                  onChange={e => setProfile({ ...profile, pincode: e.target.value })}
                />
              </div>

              <Input
                label="Physical Address / GIDC Zone"
                value={profile?.address || ''}
                onChange={e => setProfile({ ...profile, address: e.target.value })}
                placeholder="Plot No. 124, Road No. 8, Pandesara GIDC, Surat"
              />

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={saving} className="flex items-center gap-1.5">
                  <Save size={15} />
                  {saving ? 'Saving Changes...' : 'Save Mill Details'}
                </Button>
              </div>
            </form>
          </Card>

          {/* Staff Directory Table */}
          <Card 
            title={`Staff & Operator Directory (${staff.length})`} 
            description="Users with isolated access to this mill workspace"
            headerActions={
              <Button size="sm" onClick={() => setShowAddStaff(true)} className="flex items-center gap-1">
                <Plus size={14} /> Add Staff User
              </Button>
            }
          >
            {showAddStaff && (
              <form onSubmit={handleCreateStaff} className="mb-5 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Add New Mill User / Operator</span>
                  <button type="button" onClick={() => setShowAddStaff(false)} className="text-xs text-slate-400 hover:text-slate-600 font-bold">Cancel</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Username (Login handle)"
                    placeholder="e.g. op_dyeing1"
                    value={newStaff.username}
                    onChange={e => setNewStaff({ ...newStaff, username: e.target.value })}
                    required
                  />
                  <Input
                    label="Full Name"
                    placeholder="e.g. Manoj Sharma"
                    value={newStaff.full_name}
                    onChange={e => setNewStaff({ ...newStaff, full_name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="Email (Optional)"
                    type="email"
                    placeholder="manoj@mill.com"
                    value={newStaff.email}
                    onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
                  />
                  <Input
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    value={newStaff.password}
                    onChange={e => setNewStaff({ ...newStaff, password: e.target.value })}
                    required
                  />
                  <Select
                    label="Assigned Role"
                    value={newStaff.role_id}
                    onChange={e => setNewStaff({ ...newStaff, role_id: e.target.value })}
                    options={roles.map(r => ({ value: r.role_id, label: `${r.role_name} (${r.role_code})` }))}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAddStaff(false)}>Cancel</Button>
                  <Button type="submit" size="sm" disabled={staffLoading}>
                    {staffLoading ? 'Adding...' : 'Create User'}
                  </Button>
                </div>
              </form>
            )}

            <Table headers={['Staff Member', 'Role', 'Username / Email', 'Status', 'Last Active']}>
              {staff.map((u, i) => (
                <TableRow key={u.user_id || i}>
                  <TableCell className="font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600">
                        {u.full_name?.charAt(0) || 'U'}
                      </div>
                      <span>{u.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-bold text-[10px]">
                      {u.role_name}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-600">
                    <div>{u.username}</div>
                    {u.email && <div className="text-[10px] text-slate-400">{u.email}</div>}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-400 text-xs">
                    {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          </Card>

        </div>
      </div>
    </div>
  );
}
