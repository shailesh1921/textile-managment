import React, { useState } from 'react';
import { Modal, Button, Input, Select } from './ui';
import { Send, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';

const TEMPLATE_OPTIONS = [
  { value: 'ORDER_RECEIVED', label: 'Order Received' },
  { value: 'DYEING_STARTED', label: 'Dyeing Batch Started' },
  { value: 'QC_PASSED', label: 'Quality Check Passed' },
  { value: 'READY_DISPATCH', label: 'Order Ready for Dispatch' },
  { value: 'DISPATCHED', label: 'Dispatched (with Tracking)' },
  { value: 'PAYMENT_DUE', label: 'Payment Due Notice' },
  { value: 'CUSTOM', label: 'Custom Message' }
];

export function SendNotificationModal({ isOpen, onClose, defaultPhone = '', defaultOrderNo = '', jobOrderId, batchId }) {
  const [channel, setChannel] = useState('SMS');
  const [phone, setPhone] = useState(defaultPhone);
  const [templateKey, setTemplateKey] = useState('ORDER_RECEIVED');
  const [customMsg, setCustomMsg] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [param1, setParam1] = useState(defaultOrderNo || 'JO-1001');
  const [param2, setParam2] = useState('');
  const [param3, setParam3] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);

    try {
      const endpoint = channel === 'WHATSAPP' 
        ? '/api/v1/communication/send-whatsapp'
        : '/api/v1/communication/send-sms';

      const payload = {
        recipient: phone,
        jobOrderId,
        batchId,
        templateKey: templateKey !== 'CUSTOM' ? templateKey : undefined,
        customMessage: templateKey === 'CUSTOM' ? customMsg : undefined,
        mediaUrl: channel === 'WHATSAPP' && mediaUrl ? mediaUrl : undefined,
        params: { param1, param2, param3 }
      };

      const res = await api.post(endpoint, payload);
      setStatusMsg({ type: 'success', text: `Message sent via ${channel}!` });
      setTimeout(() => {
        onClose();
        setStatusMsg(null);
      }, 1500);
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Delivery failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Send Client Update (${channel})`} className="max-w-lg">
      <form onSubmit={handleSend} className="flex flex-col gap-4">
        {statusMsg && (
          <div className={`p-3 rounded-lg flex items-center gap-2 text-sm font-medium ${
            statusMsg.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
          }`}>
            {statusMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {statusMsg.text}
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            type="button" 
            variant={channel === 'SMS' ? 'default' : 'outline'} 
            className="flex-1"
            onClick={() => setChannel('SMS')}
          >
            SMS Gateway
          </Button>
          <Button 
            type="button" 
            variant={channel === 'WHATSAPP' ? 'default' : 'outline'} 
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => setChannel('WHATSAPP')}
          >
            WhatsApp Business
          </Button>
        </div>

        <Input 
          label="Client Mobile Number" 
          placeholder="e.g. 9876543210" 
          value={phone} 
          onChange={(e) => setPhone(e.target.value)} 
          required 
        />

        <Select 
          label="Select Message Template" 
          options={TEMPLATE_OPTIONS} 
          value={templateKey} 
          onChange={(e) => setTemplateKey(e.target.value)} 
        />

        {templateKey !== 'CUSTOM' ? (
          <div className="grid grid-cols-2 gap-2">
            <Input label="Order/Batch #" value={param1} onChange={(e) => setParam1(e.target.value)} />
            <Input label="Detail / Value" value={param2} onChange={(e) => setParam2(e.target.value)} placeholder="e.g. Cotton / Shade" />
          </div>
        ) : (
          <Input 
            label="Custom Message Body" 
            value={customMsg} 
            onChange={(e) => setCustomMsg(e.target.value)} 
            placeholder="Type your custom notification message..." 
            required 
          />
        )}

        {channel === 'WHATSAPP' && (
          <Input 
            label="Fabric Photo / Batch Image Link (Optional)" 
            placeholder="https://example.com/batch-photo.jpg" 
            value={mediaUrl} 
            onChange={(e) => setMediaUrl(e.target.value)} 
          />
        )}

        <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading} className="gap-2">
            <Send size={14} /> Send {channel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
