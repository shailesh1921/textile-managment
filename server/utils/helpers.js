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

function calcASTM4Point(totalDefectPoints, inspectedMeters, widthInches = 58) {
  const m = parseFloat(inspectedMeters) || 100;
  const pts = parseFloat(totalDefectPoints) || 0;
  const w = parseFloat(widthInches) || 58;
  // Standard ASTM D5430 formula: (Points * 100) / (Length in Meters * (Width in Inches / 36))
  const pointsPer100 = (pts * 100) / (m * (w / 36));
  const rounded = parseFloat(pointsPer100.toFixed(2));
  const isPassed = rounded <= 28.0;
  return {
    total_points: pts,
    inspected_meters: m,
    fabric_width_inches: w,
    points_per_hundred_sqm: rounded,
    grade: isPassed ? 'GRADE_A' : 'SECONDS',
    result: isPassed ? 'PASSED' : 'REPROCESS',
    is_passed: isPassed
  };
}

function calcElongation(greigeMeters, finishedMeters) {
  const g = parseFloat(greigeMeters) || 0;
  const f = parseFloat(finishedMeters) || 0;
  if (g <= 0) return 0;
  return parseFloat((((f - g) / g) * 100).toFixed(2));
}

function calcNetWeight(grossWeightKg, coreTareKg = 0, polybagTareKg = 0) {
  const gross = parseFloat(grossWeightKg) || 0;
  const core = parseFloat(coreTareKg) || 0;
  const poly = parseFloat(polybagTareKg) || 0;
  const net = Math.max(0, gross - (core + poly));
  return {
    gross_weight_kg: gross,
    core_tare_kg: core,
    polybag_tare_kg: poly,
    total_tare_kg: parseFloat((core + poly).toFixed(3)),
    net_weight_kg: parseFloat(net.toFixed(3))
  };
}

const STANDARD_TEXTILE_STAGES = [
  { sequence_no: 1, process_name: 'Desizing', machine_type: 'WASHER', expected_loss_pct: 1.5 },
  { sequence_no: 2, process_name: 'Scouring', machine_type: 'KIER', expected_loss_pct: 2.0 },
  { sequence_no: 3, process_name: 'Bleaching', machine_type: 'BLEACH_RANGE', expected_loss_pct: 1.0 },
  { sequence_no: 4, process_name: 'Mercerizing', machine_type: 'MERCERIZER', expected_loss_pct: 1.5 },
  { sequence_no: 5, process_name: 'Jet Dyeing', machine_type: 'JET_DYEING', expected_loss_pct: 0.5 },
  { sequence_no: 6, process_name: 'Washing & Soaping', machine_type: 'WASHER', expected_loss_pct: 0.5 },
  { sequence_no: 7, process_name: 'Stenter Finishing', machine_type: 'STENTER', expected_loss_pct: -2.0 },
  { sequence_no: 8, process_name: 'ASTM 4-Point QC', machine_type: 'INSPECTION_TABLE', expected_loss_pct: 0.0 },
  { sequence_no: 9, process_name: 'Folding & Packing', machine_type: 'PACKING_MACHINE', expected_loss_pct: 0.0 },
];

async function createStandardProcessStages(client, tenantId, lotId, greyMeters, greyKg) {
  let currentM = parseFloat(greyMeters) || 0;
  let currentKg = parseFloat(greyKg) || 0;
  let cumLoss = 0;
  for (const step of STANDARD_TEXTILE_STAGES) {
    cumLoss += step.expected_loss_pct;
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
  calcASTM4Point,
  calcElongation,
  calcNetWeight,
  nextDocNo,
  copyProcessStagesFromTemplate,
  createStandardProcessStages,
  STANDARD_TEXTILE_STAGES,
};

