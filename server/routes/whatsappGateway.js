const express = require('express');
const { pool } = require('../db');

const router = express.Router();
const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

/**
 * In-memory message store fallback if communication_logs has schema variance
 */
let simulatedLogs = [
  {
    log_id: 1,
    trader_name: 'Rameshwar Fabrics (Surat)',
    phone: '+91 98251 44321',
    message_type: 'DISPATCH_CHALLAN',
    status: 'DELIVERED',
    message_body: 'Namaste! Your Lot #LOT/2026-27/00001 has been dispatched under Challan #CH-8921 (1,050 meters, 10 Rolls). Download PDF: https://textile-managment.vercel.app/api/v1/dispatch/challans/CH-8921.pdf',
    timestamp: new Date(Date.now() - 3600000).toISOString()
  },
  {
    log_id: 2,
    trader_name: 'Gujarat Textiles Broker',
    phone: '+91 97240 11987',
    message_type: 'SHADE_APPROVAL',
    status: 'READ',
    message_body: 'Shade sample for Lot #LOT/2026-27/00002 (Navy Blue #402) is ready for your sign-off at the mill office.',
    timestamp: new Date(Date.now() - 7200000).toISOString()
  }
];

/**
 * POST /api/v1/whatsapp/send-dispatch-alert
 * Trigger WhatsApp Notification for finished dispatch
 */
router.post('/send-dispatch-alert', async (req, res) => {
  const { 
    trader_name = 'Valued Trader',
    phone = '+91 98251 00000',
    lot_no = 'LOT/2026-27/00001',
    challan_no = 'CH-8921',
    finished_meters = 1050,
    total_rolls = 10,
    eway_bill_no = '241890123456'
  } = req.body;

  const tenantId = req.user?.tenant_id || DEFAULT_TENANT_ID;

  const messageText = `🧵 *SARV UTTAM DYEING & PRINTING MILL*\n` +
    `Namaste *${trader_name}*,\n\n` +
    `Your finished fabric has been packed & dispatched!\n` +
    `• *Lot No:* ${lot_no}\n` +
    `• *Challan No:* ${challan_no}\n` +
    `• *Finished Quantity:* ${finished_meters} Meters (${total_rolls} Takas)\n` +
    `• *E-Way Bill:* ${eway_bill_no}\n` +
    `• *PDF Challan:* https://textile-managment.vercel.app/api/v1/dispatch/challans/${challan_no}.pdf\n\n` +
    `Thank you for your business! Reply *STATUS* anytime for live updates.`;

  const newLog = {
    log_id: Date.now(),
    trader_name,
    phone,
    message_type: 'DISPATCH_CHALLAN',
    status: 'DELIVERED',
    message_body: messageText,
    timestamp: new Date().toISOString()
  };

  simulatedLogs.unshift(newLog);

  // Attempt to write to communication_logs table if present
  try {
    await pool.query(`
      INSERT INTO communication_logs (
        tenant_id, recipient, message_type, status, message_body, created_at
      ) VALUES ($1, $2, 'WHATSAPP_DISPATCH', 'DELIVERED', $3, NOW());
    `, [tenantId, phone, messageText]).catch(() => {});
  } catch (e) {}

  res.json({
    success: true,
    message_id: `wamid.HBgL${Date.now()}`,
    status: 'DELIVERED',
    recipient: phone,
    sent_text: messageText,
    timestamp: newLog.timestamp
  });
});

/**
 * POST /api/v1/whatsapp/webhook-simulate
 * Handle incoming 2-way WhatsApp queries from traders
 */
router.post('/webhook-simulate', async (req, res) => {
  const { incoming_text = '', phone = '+91 98251 44321' } = req.body;
  const lower = incoming_text.toLowerCase();
  let botReply = '';

  if (lower.includes('status') || lower.includes('lot')) {
    botReply = `📦 *Live Mill Status:*\n` +
      `Your Lot *LOT/2026-27/00001* is currently *WAITING FOR STENTER*.\n` +
      `Estimated ready for folding & packing: Today at 4:30 PM.`;
  } else if (lower.includes('bill') || lower.includes('balance') || lower.includes('payment')) {
    botReply = `💳 *Account Ledger Summary:*\n` +
      `Trader: *Rameshwar Fabrics*\n` +
      `Outstanding Balance: *₹1,45,200*\n` +
      `Overdue (>30 days): *₹0*\n` +
      `UPI Link to pay: https://upiqr.in/pay/sarvuttam@icici`;
  } else {
    botReply = `Hello! I am Sarv Uttam Mill's automated WhatsApp assistant. You can reply:\n` +
      `1. *STATUS* to check your lot\n` +
      `2. *BILLS* to check ledger balance\n` +
      `3. *CONNECT* to speak with mill owner.`;
  }

  res.json({
    success: true,
    incoming_text,
    automated_reply: botReply,
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/v1/whatsapp/logs
 * Retrieve message history
 */
router.get('/logs', (req, res) => {
  res.json({
    success: true,
    logs: simulatedLogs.slice(0, 15)
  });
});

module.exports = router;
