const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware');
const twilio = require('twilio');

// Initialize Twilio client if credentials exist
const twilioAccountSid = process.env.TWILIO_SID || process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioFromNumber = process.env.TWILIO_FROM || process.env.TWILIO_PHONE_NUMBER;

let twilioClient = null;
if (twilioAccountSid && twilioAuthToken) {
  try {
    twilioClient = twilio(twilioAccountSid, twilioAuthToken);
  } catch (err) {
    console.warn('Twilio initialization warning:', err.message);
  }
}

// Standard reusable SMS / WhatsApp templates
const TEMPLATES = {
  ORDER_RECEIVED: (orderNo, fabricName) => 
    `[Surat Textile ERP] Order Received: Job Order #${orderNo} for ${fabricName} has been logged. We will notify you when processing begins.`,
  
  DYEING_STARTED: (batchNo, shadeCode) => 
    `[Surat Textile ERP] Processing Alert: Dyeing batch #${batchNo} (Shade: ${shadeCode}) has started on machine.`,
  
  QC_PASSED: (lotNo, deltaE) => 
    `[Surat Textile ERP] Quality Check Passed: Lot #${lotNo} shade approved (Delta-E: ${deltaE || '0.35'}). Ready for finishing.`,
  
  READY_DISPATCH: (orderNo, totalMeters) => 
    `[Surat Textile ERP] Order Ready: Job Order #${orderNo} (${totalMeters}m) is packed and ready for dispatch.`,
  
  DISPATCHED: (challanNo, transporter, trackingNo) => 
    `[Surat Textile ERP] Order Dispatched: Dispatch Challan #${challanNo} via ${transporter || 'Transporter'}. Tracking: ${trackingNo || 'N/A'}.`,
  
  PAYMENT_DUE: (invoiceNo, amountDue, dueDate) => 
    `[Surat Textile ERP] Payment Due Notice: Invoice #${invoiceNo} for Rs.${amountDue} is due on ${dueDate}. Please clear balance.`,
  
  PAYMENT_RECEIVED: (receiptNo, amount) => 
    `[Surat Textile ERP] Payment Received: Thank you! We received Rs.${amount} against Receipt #${receiptNo}.`
};

// Internal helper to send SMS & log delivery
async function sendSMSInternal({ tenantId, recipient, message, templateCode, jobOrderId, batchId }) {
  let status = 'SENT';
  let errorMessage = null;

  let formattedPhone = recipient.trim();
  if (/^\d{10}$/.test(formattedPhone)) {
    formattedPhone = `+91${formattedPhone}`;
  }

  if (twilioClient && twilioFromNumber) {
    try {
      await twilioClient.messages.create({
        body: message,
        from: twilioFromNumber,
        to: formattedPhone
      });
    } catch (err) {
      status = 'FAILED';
      errorMessage = err.message;
      console.error('Twilio SMS Delivery Error:', err.message);
    }
  } else {
    console.log(`[SMS SIMULATION] Tenant: ${tenantId} | To: ${formattedPhone} | Message: ${message}`);
  }

  try {
    await pool.query(
      `INSERT INTO communication_logs 
        (tenant_id, channel, provider, recipient_phone, template_code, message_body, status, error_message, job_order_id, batch_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [tenantId || '00000000-0000-0000-0000-000000000001', 'SMS', twilioClient ? 'TWILIO' : 'SIMULATED', formattedPhone, templateCode || 'CUSTOM', message, status, errorMessage, jobOrderId || null, batchId || null]
    );
  } catch (dbErr) {
    console.error('Failed to log SMS to DB:', dbErr.message);
  }

  return { success: status === 'SENT', status, recipient: formattedPhone, error: errorMessage };
}

// Internal helper for WhatsApp message sending
async function sendWhatsAppInternal({ tenantId, recipient, message, mediaUrl, templateCode, jobOrderId, batchId }) {
  let status = 'SENT';
  let errorMessage = null;

  let formattedPhone = recipient.trim();
  if (/^\d{10}$/.test(formattedPhone)) {
    formattedPhone = `+91${formattedPhone}`;
  }
  const whatsappTo = formattedPhone.startsWith('whatsapp:') ? formattedPhone : `whatsapp:${formattedPhone}`;
  const whatsappFrom = (twilioFromNumber || '').startsWith('whatsapp:') ? twilioFromNumber : `whatsapp:${twilioFromNumber || '+14155238886'}`;

  if (twilioClient && twilioFromNumber) {
    try {
      const payload = {
        body: message,
        from: whatsappFrom,
        to: whatsappTo
      };
      if (mediaUrl) payload.mediaUrl = [mediaUrl];
      await twilioClient.messages.create(payload);
    } catch (err) {
      status = 'FAILED';
      errorMessage = err.message;
      console.error('Twilio WhatsApp Delivery Error:', err.message);
    }
  } else {
    console.log(`[WHATSAPP SIMULATION] Tenant: ${tenantId} | To: ${whatsappTo} | Media: ${mediaUrl || 'None'} | Message: ${message}`);
  }

  try {
    await pool.query(
      `INSERT INTO communication_logs 
        (tenant_id, channel, provider, recipient_phone, template_code, message_body, media_url, status, error_message, job_order_id, batch_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [tenantId || '00000000-0000-0000-0000-000000000001', 'WHATSAPP', twilioClient ? 'TWILIO' : 'SIMULATED', formattedPhone, templateCode || 'CUSTOM', message, mediaUrl || null, status, errorMessage, jobOrderId || null, batchId || null]
    );
  } catch (dbErr) {
    console.error('Failed to log WhatsApp to DB:', dbErr.message);
  }

  return { success: status === 'SENT', status, recipient: formattedPhone, error: errorMessage };
}

// --- API ROUTES ---

router.post('/send-sms', authenticateToken, async (req, res) => {
  try {
    const { recipient, templateKey, params = {}, customMessage, jobOrderId, batchId } = req.body;
    if (!recipient) {
      return res.status(400).json({ error: 'Recipient phone number is required' });
    }

    let message = customMessage;
    if (templateKey && TEMPLATES[templateKey]) {
      const fn = TEMPLATES[templateKey];
      message = fn(params.param1 || '', params.param2 || '', params.param3 || '');
    }

    if (!message) {
      return res.status(400).json({ error: 'Message body or valid template key is required' });
    }

    const result = await sendSMSInternal({ tenantId: req.tenant_id, recipient, message, templateCode: templateKey, jobOrderId, batchId });
    if (!result.success) {
      return res.status(500).json({ error: `SMS delivery failed: ${result.error || 'Gateway error'}` });
    }

    res.json({ success: true, message: 'SMS sent and logged successfully', data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/send-whatsapp', authenticateToken, async (req, res) => {
  try {
    const { recipient, message, mediaUrl, templateKey, jobOrderId, batchId } = req.body;
    if (!recipient || !message) {
      return res.status(400).json({ error: 'Recipient phone and message body are required' });
    }

    const result = await sendWhatsAppInternal({ tenantId: req.tenant_id, recipient, message, mediaUrl, templateCode: templateKey, jobOrderId, batchId });
    if (!result.success) {
      return res.status(500).json({ error: `WhatsApp delivery failed: ${result.error || 'Gateway error'}` });
    }

    res.json({ success: true, message: 'WhatsApp message sent and logged', data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/logs', authenticateToken, async (req, res) => {
  try {
    const logs = await pool.query(
      `SELECT * FROM communication_logs WHERE tenant_id = $1 ORDER BY sent_at DESC LIMIT 100`,
      [req.tenant_id]
    );
    res.json(logs.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
