const { pool } = require('../db');

const DEFAULT_TENANT = '00000000-0000-0000-0000-000000000001';

function metersToKg(meters, gsm, widthInches) {
  const widthM = (widthInches || 58) * 0.0254;
  return (parseFloat(meters) * widthM * parseFloat(gsm)) / 1000;
}

function calcShrinkage(greyMeters, finishedMeters) {
  if (!greyMeters || greyMeters <= 0) return 0;
  return (((greyMeters - finishedMeters) / greyMeters) * 100).toFixed(3);
}

function calcDeltaE(l1, a1, b1, l2, a2, b2) {
  return Math.sqrt((l1 - l2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2).toFixed(2);
}

async function nextDocNo(tenantId, prefix, table, column) {
  const year = new Date().getFullYear();
  const fy = `${year}-${String(year + 1).slice(-2)}`;
  const pattern = `${prefix}/${fy}/%`;
  const r = await pool.query(
    `SELECT COUNT(*) FROM ${table} WHERE tenant_id = $1 AND ${column} LIKE $2`,
    [tenantId, pattern]
  );
  const seq = String(parseInt(r.rows[0].count, 10) + 1).padStart(5, '0');
  return `${prefix}/${fy}/${seq}`;
}

async function copyProcessStagesFromTemplate(client, lotId, templateId, greyMeters, greyKg) {
  const steps = await client.query(
    `SELECT * FROM process_template_steps WHERE template_id = $1 ORDER BY sequence_no`,
    [templateId]
  );
  let cumLoss = 0;
  let currentM = greyMeters;
  let currentKg = greyKg;
  for (const step of steps.rows) {
    cumLoss += parseFloat(step.expected_loss_pct || 0);
    await client.query(
      `INSERT INTO lot_process_stages (lot_id, sequence_no, process_name, machine_type, status, input_meters, input_kg, cumulative_shrinkage_pct)
       VALUES ($1, $2, $3, $4, 'PENDING', $5, $6, $7)`,
      [lotId, step.sequence_no, step.process_name, step.machine_type, currentM, currentKg, cumLoss]
    );
  }
}

module.exports = {
  DEFAULT_TENANT,
  metersToKg,
  calcShrinkage,
  calcDeltaE,
  nextDocNo,
  copyProcessStagesFromTemplate,
};
