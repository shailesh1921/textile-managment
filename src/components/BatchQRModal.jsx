import React, { useState, useEffect } from 'react';
import { Modal, Button } from './ui';
import { QrCode, Printer } from 'lucide-react';
import { api } from '../lib/api';

export function BatchQRModal({ isOpen, onClose, batchId }) {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && batchId) {
      setLoading(true);
      api.get(`/api/v1/production/batches/${batchId}/qr`)
        .then(res => setQrData(res))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, batchId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Shop Floor Batch QR Barcode" className="max-w-md">
      <div className="flex flex-col items-center gap-4 py-2">
        {loading ? (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Generating QR Code...</div>
        ) : qrData ? (
          <div className="flex flex-col items-center gap-3 border p-6 rounded-xl bg-white text-black w-full text-center">
            <h3 className="font-bold text-lg">{qrData.batch.batch_no}</h3>
            <p className="text-xs text-gray-500 font-mono">Lot: {qrData.batch.lot_no}</p>
            <img src={qrData.qrDataUrl} alt="Batch QR Code" className="w-48 h-48 my-2 border rounded p-2" />
            <div className="text-xs font-semibold text-gray-700">
              Stage: {qrData.batch.process_name} | Machine: {qrData.batch.machine_name}
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Unable to load QR data.</div>
        )}

        <div className="flex justify-end gap-2 w-full mt-4 pt-3 border-t">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handlePrint} disabled={!qrData} className="gap-2">
            <Printer size={14} /> Print Label
          </Button>
        </div>
      </div>
    </Modal>
  );
}
