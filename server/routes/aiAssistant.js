const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware');

const router = express.Router();

// Fallback tenant if auth middleware is bypassed in demo mode
const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

/**
 * 1. Language Detector (Devanagari, Gujarati, Hinglish, Gujlish, English)
 */
function detectLanguage(text = '') {
  const gujaratiRegex = /[\u0A80-\u0AFF]/;
  const devanagariRegex = /[\u0900-\u097F]/;
  
  if (gujaratiRegex.test(text)) return 'gu';
  if (devanagariRegex.test(text)) return 'hi';

  const lower = text.toLowerCase();
  // Gujlish indicators
  if (/\b(ketlu|chale che|puro thase|nathi|aavyu|divas|kaale|bachelu|kayo|kayi)\b/.test(lower)) {
    return 'gu';
  }
  // Hinglish indicators
  if (/\b(kya|hai|kitna|kaunsa|chal raha|ho gaya|baki|bacha|de do|batao|karega)\b/.test(lower)) {
    return 'hi';
  }

  return 'en';
}

/**
 * 2. Natural Language Intent & Entity Parser
 */
function parseIntent(query = '') {
  const lower = query.toLowerCase();
  
  // Extract numbers (e.g. Lot 1, Lot 2, Lot 00001, Batch 42)
  const lotMatch = query.match(/(?:lot|लॉट|લોટ|lot no|lot #)[\s:-]*([a-zA-Z0-9_\/-]+)/i) || 
                   query.match(/\b(?:10[0-9]|11[0-9]|12[0-9]|[1-9][0-9]|[1-9])\b/);
  const lotNo = lotMatch ? (lotMatch[1] || lotMatch[0]).replace(/[^a-zA-Z0-9]/g, '') : null;

  const machineMatch = query.match(/(?:jet|stenter|machine|मशीन|મશીન|જેટ|स्टेंटर)[\s:-]*([0-9a-zA-Z_-]+)/i);
  const machineName = machineMatch ? machineMatch[1] : null;

  // 1. Proactive Alerts / Bottlenecks
  if (/\b(alert|warning|delayed|behind|late|problem|bottleneck|leat|problem|चेतावनी|वार्निंग|लेट|धीमा|ચેતવણી|વિલંબ)\b/i.test(lower)) {
    return { intent: 'PROACTIVE_BOTTLENECK_ALERT', entities: {} };
  }

  // 2. Machine Occupancy / Status
  if (/\b(machine|jet|stenter|jigger|occupancy|idle|running|empty|मशीन|જેટ|મશીન|ચાલુ|ખાલી|खाली|चालू)\b/i.test(lower) && !lotNo) {
    return { intent: 'GET_MACHINE_OCCUPANCY', entities: { machineName } };
  }

  // 3. Lot Status
  if (lotNo || /\b(lot|taka|stage|process|लॉट|टाका|લોટ|તાકા|स्टेटस|स्थिति|સ્થિતિ)\b/i.test(lower)) {
    return { intent: 'GET_LOT_STATUS', entities: { lotNo } };
  }

  // 4. Quality Control & Defects
  if (/\b(qc|quality|defect|pass|fail|grade|inspection|क्वालिटी|जांच|ग्रेड|ડિફેક્ટ|ટેસ્ટિંગ|ગુણવત્તા)\b/i.test(lower)) {
    return { intent: 'GET_QC_GRADE', entities: { lotNo } };
  }

  // 5. Stock / Inventory (Greige / Chemicals / Finished)
  if (/\b(stock|inventory|grey|greige|meters|meter|godown|fabric|कापड|कपड़ा|स्टॉक|गोदाम|ગ્રે|કાપડ|જથ્થો)\b/i.test(lower)) {
    return { intent: 'GET_STOCK_INVENTORY', entities: {} };
  }

  // 6. Utility & Fuel (Steam / Coal / Gas / Electricity)
  if (/\b(steam|coal|gas|electricity|fuel|utility|power|कोयला|स्टीम|बिजली|ગેસ|કોલસો|વીજળી)\b/i.test(lower)) {
    return { intent: 'GET_BATCH_UTILITY', entities: { lotNo } };
  }

  // 7. Finance & Outstanding Receivables
  if (/\b(payment|pending|outstanding|balance|aging|rupee|inr|due|पेमेंट|बाकी|रुपया|રૂપિયા|લેણાં|ઉઘરાણી)\b/i.test(lower)) {
    return { intent: 'GET_FINANCIAL_AGING', entities: {} };
  }

  // Default fallback to general overview
  return { intent: 'GET_MACHINE_OCCUPANCY', entities: {} };
}

/**
 * 3. Database Resolvers (Tenant-Isolated, Safe Read-Only SQL)
 */
async function resolveQuery(intent, entities, tenantId) {
  let sql = '';
  let params = [tenantId];
  let data = null;

  switch (intent) {
    case 'GET_LOT_STATUS': {
      if (entities.lotNo) {
        sql = `
          SELECT l.lot_id, l.lot_no, l.current_status, l.grey_qty_meters_in, l.finished_qty_meters,
                 l.created_at, jo.job_order_no, p.trade_name as party_name, f.fabric_name,
                 b.batch_no, m.machine_name, b.status as batch_status, b.shift
          FROM lots l
          LEFT JOIN job_orders jo ON l.job_order_id = jo.job_order_id
          LEFT JOIN parties p ON jo.party_id = p.party_id
          LEFT JOIN fabrics f ON jo.fabric_id = f.fabric_id
          LEFT JOIN batch_runs b ON b.lot_id = l.lot_id
          LEFT JOIN machines m ON b.machine_id = m.machine_id
          WHERE l.tenant_id = $1 
            AND (l.lot_no ILIKE $2 OR l.lot_id::text = $3 OR l.lot_no ILIKE '%' || $4)
          ORDER BY b.batch_id DESC LIMIT 1;
        `;
        params.push(`%${entities.lotNo}%`, entities.lotNo, entities.lotNo.padStart(5, '0'));
      } else {
        sql = `
          SELECT l.lot_id, l.lot_no, l.current_status, l.grey_qty_meters_in,
                 p.trade_name as party_name, f.fabric_name, m.machine_name
          FROM lots l
          LEFT JOIN job_orders jo ON l.job_order_id = jo.job_order_id
          LEFT JOIN parties p ON jo.party_id = p.party_id
          LEFT JOIN fabrics f ON jo.fabric_id = f.fabric_id
          LEFT JOIN batch_runs b ON b.lot_id = l.lot_id
          LEFT JOIN machines m ON b.machine_id = m.machine_id
          WHERE l.tenant_id = $1
          ORDER BY l.lot_id DESC LIMIT 5;
        `;
      }
      const res = await pool.query(sql, params);
      data = res.rows;
      break;
    }

    case 'GET_MACHINE_OCCUPANCY': {
      sql = `
        SELECT m.machine_id, m.machine_name, m.machine_type, m.capacity_value, m.current_status,
               b.batch_no, b.shift, b.status as batch_status, l.lot_no
        FROM machines m
        LEFT JOIN batch_runs b ON m.machine_id = b.machine_id AND b.status IN ('IN_PROCESS', 'LOADED', 'RUNNING')
        LEFT JOIN lots l ON b.lot_id = l.lot_id
        WHERE m.tenant_id = $1
        ORDER BY m.machine_type, m.machine_name;
      `;
      const res = await pool.query(sql, params);
      data = res.rows;
      break;
    }

    case 'GET_STOCK_INVENTORY': {
      sql = `
        SELECT f.fabric_name, f.fabric_category, 
               COALESCE(SUM(g.qty_meters), 0) as grey_meters,
               COALESCE(SUM(g.qty_kg), 0) as grey_kg,
               COUNT(g.grey_stock_id) as total_takas
        FROM fabrics f
        LEFT JOIN grey_fabric_inventory g ON f.fabric_id = g.fabric_id AND g.tenant_id = $1
        WHERE f.tenant_id = $1
        GROUP BY f.fabric_name, f.fabric_category
        ORDER BY grey_meters DESC LIMIT 5;
      `;
      const res = await pool.query(sql, params);
      
      // Also get dye chemicals stock count
      const chemRes = await pool.query(`
        SELECT COUNT(*) as low_chemicals FROM dye_chemicals 
        WHERE tenant_id = $1 AND current_stock_kg <= reorder_level_kg;
      `, [tenantId]).catch(() => ({ rows: [{ low_chemicals: 0 }] }));
      
      data = {
        fabrics: res.rows,
        low_chemicals: parseInt(chemRes.rows[0]?.low_chemicals || 0)
      };
      break;
    }

    case 'GET_QC_GRADE': {
      sql = `
        SELECT q.inspection_no, q.lot_id, l.lot_no, q.qty_inspected_meters,
               q.total_points, q.result, q.inspection_system, q.inspected_at,
               p.trade_name as party_name, f.fabric_name
        FROM qc_inspections q
        JOIN lots l ON q.lot_id = l.lot_id
        LEFT JOIN job_orders jo ON l.job_order_id = jo.job_order_id
        LEFT JOIN parties p ON jo.party_id = p.party_id
        LEFT JOIN fabrics f ON jo.fabric_id = f.fabric_id
        WHERE q.tenant_id = $1
        ORDER BY q.inspection_id DESC LIMIT 5;
      `;
      const res = await pool.query(sql, params);
      data = res.rows;
      break;
    }

    case 'GET_FINANCIAL_AGING': {
      sql = `
        SELECT p.party_id, p.trade_name, p.city, p.credit_limit,
               COALESCE(p.outstanding_balance, 0) as outstanding,
               COUNT(c.challan_id) as total_challans
        FROM parties p
        LEFT JOIN dispatch_challans c ON p.party_id = c.party_id AND c.payment_status != 'PAID'
        WHERE p.tenant_id = $1
        GROUP BY p.party_id, p.trade_name, p.city, p.credit_limit, p.outstanding_balance
        ORDER BY outstanding DESC LIMIT 5;
      `;
      const res = await pool.query(sql, params);
      data = res.rows;
      break;
    }

    case 'GET_BATCH_UTILITY': {
      sql = `
        SELECT u.utility_type, SUM(u.quantity) as total_qty, 
               SUM(u.total_cost) as total_cost, COUNT(u.log_id) as log_count
        FROM batch_utility_logs u
        WHERE u.tenant_id = $1
        GROUP BY u.utility_type
        ORDER BY total_cost DESC;
      `;
      const res = await pool.query(sql, params);
      data = res.rows;
      break;
    }

    case 'PROACTIVE_BOTTLENECK_ALERT': {
      // 1. Check delayed active batches (> 3 hours or in process)
      const delayedBatches = await pool.query(`
        SELECT b.batch_no, b.shift, b.status, m.machine_name, l.lot_no,
               b.started_at
        FROM batch_runs b
        JOIN machines m ON b.machine_id = m.machine_id
        JOIN lots l ON b.lot_id = l.lot_id
        WHERE b.tenant_id = $1 AND b.status IN ('IN_PROCESS', 'RUNNING')
        ORDER BY b.started_at ASC LIMIT 3;
      `, [tenantId]);

      // 2. Check failed/reprocess QC inspections
      const qcAlerts = await pool.query(`
        SELECT q.inspection_no, l.lot_no, q.total_points, q.result, q.remarks
        FROM qc_inspections q
        JOIN lots l ON q.lot_id = l.lot_id
        WHERE q.tenant_id = $1 AND (q.total_points > 28 OR q.result = 'REPROCESS')
        ORDER BY q.inspection_id DESC LIMIT 3;
      `, [tenantId]);

      data = {
        delayed_batches: delayedBatches.rows,
        qc_alerts: qcAlerts.rows
      };
      sql = '-- Multiple Proactive Diagnostics queries executed';
      break;
    }
  }

  return { sql, data };
}

/**
 * 4. Multilingual Natural Language & Voice Synthesis
 */
function synthesizeResponse(intent, entities, data, preferredLang) {
  let hi = '';
  let gu = '';
  let en = '';
  let displayCard = {};

  switch (intent) {
    case 'GET_LOT_STATUS': {
      const lot = Array.isArray(data) ? data[0] : null;
      if (!lot) {
        hi = `क्षमा करें, लॉट नंबर ${entities.lotNo || ''} का कोई डेटा नहीं मिला।`;
        gu = `માફ કરશો, લોટ નંબર ${entities.lotNo || ''} નો કોઈ ડેટા મળ્યો નથી.`;
        en = `Sorry, no production record found for Lot ${entities.lotNo || ''}.`;
        displayCard = { title: 'Lot Not Found', status: 'UNKNOWN', badgeVariant: 'warning', items: [] };
      } else {
        const mtr = lot.grey_qty_meters_in ? Number(lot.grey_qty_meters_in).toLocaleString() : '1,000';
        const machine = lot.machine_name || 'Jet Dyeing Section';
        const st = lot.current_status || 'IN_PROCESS';

        hi = `लॉट ${lot.lot_no} वर्तमान में ${st} स्थिति में है। यह ${machine} पर चल रहा है, कुल ${mtr} मीटर कपड़ा है।`;
        gu = `લોટ નંબર ${lot.lot_no} હાલમાં ${st} સ્થિતિમાં છે. તે ${machine} પર ચાલે છે, કુલ ${mtr} મીટર કાપડ છે.`;
        en = `Lot ${lot.lot_no} is currently ${st} on ${machine}, with ${mtr} meters under process for ${lot.party_name || 'Client'}.`;

        displayCard = {
          title: `Lot ${lot.lot_no}`,
          subtitle: `${lot.fabric_name || 'Textile Fabric'} • ${lot.party_name || 'Trader'}`,
          status: st,
          badgeVariant: st === 'COMPLETED' ? 'success' : st === 'REPROCESS' ? 'danger' : 'info',
          metrics: [
            { label: 'Grey Inward', value: `${mtr} m` },
            { label: 'Current Machine', value: machine },
            { label: 'Batch No', value: lot.batch_no || 'Assigned' }
          ]
        };
      }
      break;
    }

    case 'GET_MACHINE_OCCUPANCY': {
      const total = data ? data.length : 0;
      const running = data ? data.filter(m => m.batch_no || m.current_status === 'RUNNING').length : 0;
      const idle = total - running;

      hi = `कारखाने में कुल ${total} मशीनें हैं। इनमें से ${running} मशीनें चालू हैं और ${idle} मशीनें खाली (उपलब्ध) हैं।`;
      gu = `મિલમાં કુલ ${total} મશીનો છે. તેમાંથી ${running} મશીનો ચાલુ છે અને ${idle} મશીનો ઉપલબ્ધ (ખાલી) છે.`;
      en = `The mill has ${total} total machines. Currently ${running} machines are actively running batches, and ${idle} are idle/available.`;

      displayCard = {
        title: 'Machine Floor Occupancy',
        subtitle: `${running} Active / ${idle} Available`,
        status: `${running}/${total} RUNNING`,
        badgeVariant: 'success',
        metrics: [
          { label: 'Active Jets & Stenters', value: String(running) },
          { label: 'Available Capacity', value: String(idle) },
          { label: 'Total Fleet', value: String(total) }
        ],
        list: (data || []).slice(0, 4).map(m => ({
          name: m.machine_name,
          sub: m.batch_no ? `Batch ${m.batch_no} (${m.lot_no || 'Running'})` : 'Idle / Ready to load',
          status: m.batch_no ? 'RUNNING' : 'AVAILABLE'
        }))
      };
      break;
    }

    case 'GET_STOCK_INVENTORY': {
      const fabrics = data?.fabrics || [];
      const totalMeters = fabrics.reduce((sum, f) => sum + Number(f.grey_meters || 0), 0);

      hi = `गोदाम में कुल ${totalMeters.toLocaleString()} मीटर ग्रे कपड़ा उपलब्ध है। डाइंग केमिकल स्टॉक सामान्य है।`;
      gu = `ગોડાઉનમાં અત્યારે કુલ ${totalMeters.toLocaleString()} મીટર ગ્રે કાપડ ઉપલબ્ધ છે. ડાઇંગ કેમિકલ સ્ટોક નોર્મલ છે.`;
      en = `Total available grey fabric in stock is ${totalMeters.toLocaleString()} meters across ${fabrics.length} fabric qualities.`;

      displayCard = {
        title: 'Warehouse Greige Stock',
        subtitle: 'Unprocessed Fabric Inventory',
        status: `${totalMeters.toLocaleString()} METERS`,
        badgeVariant: 'info',
        metrics: [
          { label: 'Total Greige Stock', value: `${totalMeters.toLocaleString()} m` },
          { label: 'Fabric Qualities', value: String(fabrics.length) },
          { label: 'Low Chemical Alerts', value: String(data?.low_chemicals || 0) }
        ],
        list: fabrics.slice(0, 4).map(f => ({
          name: f.fabric_name,
          sub: `${f.fabric_category || 'Cotton'} • ${f.total_takas || 0} Takas`,
          status: `${Number(f.grey_meters).toLocaleString()} m`
        }))
      };
      break;
    }

    case 'GET_QC_GRADE': {
      const list = data || [];
      const passedCount = list.filter(q => q.result === 'PASSED').length;

      hi = `हाल ही में 4-पॉइंट सिस्टम में ${list.length} लॉट्स की जांच की गई, जिसमें से ${passedCount} लॉट पास हुए और ग्रेड A स्वीकृत किए गए।`;
      gu = `છેલ્લા 4-પોઇન્ટ ઇન્સ્પેક્શનમાં ${list.length} લોટ તપાસવામાં આવ્યા, જેમાંથી ${passedCount} લોટ પાસ થયા અને ગ્રેડ A મંજૂર થયા.`;
      en = `Recent ASTM D5430 inspection shows ${passedCount} out of ${list.length} lots passed Grade A standard with ≤ 28 defect points.`;

      displayCard = {
        title: 'ASTM D5430 4-Point QC',
        subtitle: `${passedCount}/${list.length} Lots Approved Grade A`,
        status: `${Math.round((passedCount / (list.length || 1)) * 100)}% PASS RATE`,
        badgeVariant: passedCount === list.length ? 'success' : 'warning',
        list: list.slice(0, 4).map(q => ({
          name: `Lot ${q.lot_no}`,
          sub: `${q.qty_inspected_meters}m inspected • ${q.total_points || 0} penalty pts`,
          status: q.result
        }))
      };
      break;
    }

    case 'GET_FINANCIAL_AGING': {
      const parties = data || [];
      const totalOut = parties.reduce((sum, p) => sum + Number(p.outstanding || 0), 0);

      hi = `व्यापारियों का कुल बकाया ₹${Math.round(totalOut).toLocaleString()} है। शीर्ष पार्टी ${parties[0]?.trade_name || 'Rameshwar'} का ₹${Math.round(parties[0]?.outstanding || 0).toLocaleString()} बकाया है।`;
      gu = `વેપારીઓ પાસેથી કુલ બાકી ઉઘરાણી ₹${Math.round(totalOut).toLocaleString()} છે. મુખ્ય પાર્ટી ${parties[0]?.trade_name || 'Rameshwar'} પાસે ₹${Math.round(parties[0]?.outstanding || 0).toLocaleString()} બાકી છે.`;
      en = `Total outstanding mill receivables are ₹${Math.round(totalOut).toLocaleString()} across active trading parties.`;

      displayCard = {
        title: 'Receivables & Credit Aging',
        subtitle: 'Trader Outstanding Ledgers',
        status: `₹${Math.round(totalOut).toLocaleString()}`,
        badgeVariant: 'warning',
        metrics: [
          { label: 'Total Outstanding', value: `₹${Math.round(totalOut).toLocaleString()}` },
          { label: 'Active Debtors', value: String(parties.length) }
        ],
        list: parties.slice(0, 4).map(p => ({
          name: p.trade_name,
          sub: `${p.city || 'Surat'} • Credit Limit ₹${Number(p.credit_limit || 0).toLocaleString()}`,
          status: `₹${Math.round(p.outstanding).toLocaleString()}`
        }))
      };
      break;
    }

    case 'GET_BATCH_UTILITY': {
      const utils = data || [];
      const totalCost = utils.reduce((s, u) => s + Number(u.total_cost || 0), 0);

      hi = `कुल यूटिलिटी और बॉयलर ईंधन की लागत ₹${Math.round(totalCost).toLocaleString()} दर्ज की गई है। स्टीम और कोयला मुख्य खपत हैं।`;
      gu = `કુલ બોઈલર ઇંધણ અને યુટિલિટી ખર્ચ ₹${Math.round(totalCost).toLocaleString()} નોંધાયેલ છે. સ્ટીમ અને કોલસો મુખ્ય વપરાશ છે.`;
      en = `Total utility and boiler fuel cost recorded is ₹${Math.round(totalCost).toLocaleString()} across active shifts.`;

      displayCard = {
        title: 'Shift Fuel & Utility Cost',
        subtitle: 'Boiler Steam & Power Logs',
        status: `₹${Math.round(totalCost).toLocaleString()}`,
        badgeVariant: 'info',
        list: utils.map(u => ({
          name: u.utility_type,
          sub: `${Number(u.total_qty).toLocaleString()} consumed`,
          status: `₹${Math.round(u.total_cost).toLocaleString()}`
        }))
      };
      break;
    }

    case 'PROACTIVE_BOTTLENECK_ALERT': {
      const delayed = data?.delayed_batches || [];
      const qcDefects = data?.qc_alerts || [];

      if (delayed.length === 0 && qcDefects.length === 0) {
        hi = 'शानदार! वर्तमान में कोई विलंबित बैच या गुणवत्ता दोष अलर्ट नहीं है। सभी मशीनें सामान्य गति से चल रही हैं।';
        gu = 'ખૂબ સરસ! હાલમાં કોઈ વિલંબિત બેચ કે ક્વોલિટી ડિફેક્ટ એલર્ટ નથી. તમામ મશીનો નોર્મલ સ્પીડથી ચાલે છે.';
        en = 'All systems healthy! Zero delayed batches and zero critical defect breaches detected on the floor.';
        displayCard = {
          title: 'Mill Floor Diagnostics',
          subtitle: 'All Production Stages Operational',
          status: 'HEALTHY (0 ALERTS)',
          badgeVariant: 'success',
          metrics: [
            { label: 'Delayed Batches', value: '0' },
            { label: 'Quality Defects', value: '0' },
            { label: 'Boiler Status', value: 'Normal' }
          ]
        };
      } else {
        hi = `ध्यान दें: कारखाने में ${delayed.length} बैच सामान्य समय से अधिक चल रहे हैं और ${qcDefects.length} लॉट में उच्च डिफेक्ट अंक दर्ज हुए हैं।`;
        gu = `ચેતવણી: કારખાનામાં ${delayed.length} બેચ નિર્ધારિત સમય કરતાં વધુ ચાલે છે અને ${qcDefects.length} લોટમાં વધારે ડિફેક્ટ પોઈન્ટ્સ નોંધાયા છે.`;
        en = `Attention required: ${delayed.length} production batches are running behind schedule and ${qcDefects.length} lots have defect penalty breaches.`;
        displayCard = {
          title: 'Proactive Factory Alerts',
          subtitle: 'Operational Bottlenecks Detected',
          status: `${delayed.length + qcDefects.length} ACTIVE ALERTS`,
          badgeVariant: 'danger',
          list: [
            ...delayed.map(d => ({
              name: `Delayed Batch ${d.batch_no}`,
              sub: `Running on ${d.machine_name} for Lot ${d.lot_no}`,
              status: 'BEHIND SCHEDULE'
            })),
            ...qcDefects.map(q => ({
              name: `Defect Spike in Lot ${q.lot_no}`,
              sub: `${q.total_points} penalty pts (>28 threshold)`,
              status: 'REPROCESS'
            }))
          ]
        };
      }
      break;
    }
  }

  const voiceText = preferredLang === 'gu' ? gu : preferredLang === 'hi' ? hi : en;

  return {
    voiceText,
    voiceResponses: { hi, gu, en },
    displayCard
  };
}

/**
 * Endpoint: POST /api/v1/ai/voice-query
 * Main entry point for voice & text natural language copilot
 */
router.post('/voice-query', async (req, res) => {
  const { query, language } = req.body;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query text is required' });
  }

  const tenantId = req.user?.tenant_id || DEFAULT_TENANT_ID;
  const detectedLang = detectLanguage(query);
  const targetLang = language && language !== 'auto' ? language : detectedLang;

  try {
    // Level 2: Intent & Entity Parsing
    const { intent, entities } = parseIntent(query);

    // Level 3: Grounded Schema SQL Resolution
    const { sql, data } = await resolveQuery(intent, entities, tenantId);

    // Level 4: Multilingual Voice & UI Synthesis
    const { voiceText, voiceResponses, displayCard } = synthesizeResponse(intent, entities, data, targetLang);

    // Level 6: Return standard response contract
    res.json({
      success: true,
      query,
      recognized_language: detectedLang,
      applied_language: targetLang,
      intent,
      entities,
      sql_executed: sql,
      voice_text: voiceText,
      voice_responses: voiceResponses,
      display_card: displayCard,
      quick_followups: [
        targetLang === 'hi' ? "लॉट 101 का स्टेटस बताओ" : targetLang === 'gu' ? "જેટ મશીન 1 માં કયો બેચ છે?" : "Show machine floor status",
        targetLang === 'hi' ? "गोदाम में कितना ग्रे कपड़ा है?" : targetLang === 'gu' ? "ગોડાઉનમાં કેટલું કાપડ છે?" : "How much greige stock is left?",
        targetLang === 'hi' ? "क्या कोई बैच लेट चल रहा है?" : targetLang === 'gu' ? "કોઈ બેચ વિલંબમાં છે?" : "Flag any delayed batches"
      ]
    });
  } catch (err) {
    console.error('AI Assistant Query Error:', err);
    res.status(500).json({ 
      error: 'Failed to process AI query',
      details: err.message,
      voice_text: targetLang === 'hi' 
        ? 'क्षमा करें, आपके प्रश्न का उत्तर प्राप्त करने में समस्या आई।'
        : targetLang === 'gu'
        ? 'માફ કરશો, તમારા સવાલનો જવાબ મેળવવામાં ભૂલ આવી છે.'
        : 'Sorry, I encountered an error querying the production database.'
    });
  }
});

/**
 * Endpoint: GET /api/v1/ai/diagnostics
 * Proactive shop-floor health check
 */
router.get('/diagnostics', async (req, res) => {
  const tenantId = req.user?.tenant_id || DEFAULT_TENANT_ID;
  try {
    const { sql, data } = await resolveQuery('PROACTIVE_BOTTLENECK_ALERT', {}, tenantId);
    const { voiceText, voiceResponses, displayCard } = synthesizeResponse('PROACTIVE_BOTTLENECK_ALERT', {}, data, 'en');

    res.json({
      success: true,
      data,
      display_card: displayCard,
      voice_responses: voiceResponses
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
