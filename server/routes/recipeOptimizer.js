const express = require('express');
const { pool } = require('../db');

const router = express.Router();
const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Standard Textile Shade Formulations Knowledge Base
 */
const SHADE_FORMULATIONS = {
  'Navy Blue': {
    class: 'Reactive Dyeing (Cold/Warm Pad-Batch or Exhaust)',
    temp_profile: '60°C - 80°C (60 Mins)',
    dyes: [
      { name: 'Reactive Blue 21 (Turquoise)', pct_owf: 2.4, rate_per_kg: 480 },
      { name: 'Reactive Black 5 (Base Blue)', pct_owf: 1.8, rate_per_kg: 320 },
      { name: 'Reactive Red 120 (Shading)', pct_owf: 0.35, rate_per_kg: 520 }
    ],
    auxiliaries: [
      { name: 'Glauber Salt (Electrolyte)', g_per_l: 60, rate_per_kg: 18 },
      { name: 'Soda Ash (Alkali Fixation)', g_per_l: 15, rate_per_kg: 34 },
      { name: 'Leveling & Dispersing Agent', g_per_l: 1.5, rate_per_kg: 140 }
    ],
    optimization_tip: 'Replacing Glauber Salt with vacuum-refined sodium sulfate reduces rinsing wash cycles by 1 bath and saves ~₹0.48/m.'
  },
  'Jet Black': {
    class: 'Reactive High-Depth Exhaust',
    temp_profile: '60°C - 85°C (75 Mins)',
    dyes: [
      { name: 'Reactive Black 5 (Concentrated 150%)', pct_owf: 5.5, rate_per_kg: 340 },
      { name: 'Reactive Orange 16 (Toning)', pct_owf: 0.6, rate_per_kg: 410 }
    ],
    auxiliaries: [
      { name: 'Glauber Salt', g_per_l: 80, rate_per_kg: 18 },
      { name: 'Soda Ash', g_per_l: 20, rate_per_kg: 34 },
      { name: 'Sequestering Agent', g_per_l: 1.0, rate_per_kg: 120 }
    ],
    optimization_tip: 'Dividing alkali addition into 3 stages (10%, 20%, 70%) prevents dye hydrolysis and saves 8% dyestuff.'
  },
  'Royal Maroon': {
    class: 'Reactive Hot Dyeing Range',
    temp_profile: '80°C (50 Mins)',
    dyes: [
      { name: 'Reactive Red 195', pct_owf: 3.2, rate_per_kg: 620 },
      { name: 'Reactive Yellow 145', pct_owf: 0.8, rate_per_kg: 450 },
      { name: 'Reactive Blue 222', pct_owf: 0.4, rate_per_kg: 510 }
    ],
    auxiliaries: [
      { name: 'Glauber Salt', g_per_l: 50, rate_per_kg: 18 },
      { name: 'Soda Ash', g_per_l: 15, rate_per_kg: 34 },
      { name: 'Soaping Agent (Washing Off)', g_per_l: 2.0, rate_per_kg: 160 }
    ],
    optimization_tip: 'Use enzymatic soaping agent at 70°C instead of boiling wash to save 180 kg steam per batch.'
  },
  'Sage Green': {
    class: 'Reactive Medium Depth',
    temp_profile: '60°C (45 Mins)',
    dyes: [
      { name: 'Reactive Yellow 145', pct_owf: 1.2, rate_per_kg: 450 },
      { name: 'Reactive Blue 21', pct_owf: 0.9, rate_per_kg: 480 },
      { name: 'Reactive Black 5', pct_owf: 0.1, rate_per_kg: 320 }
    ],
    auxiliaries: [
      { name: 'Glauber Salt', g_per_l: 35, rate_per_kg: 18 },
      { name: 'Soda Ash', g_per_l: 10, rate_per_kg: 34 },
      { name: 'Leveling Agent', g_per_l: 1.0, rate_per_kg: 140 }
    ],
    optimization_tip: 'Low-depth shade recipe: Liquor ratio can be reduced to 1:6 without risking patchy dyeing, cutting water consumption by 15%.'
  }
};

/**
 * POST /api/v1/recipes/optimize
 * Calculate exact chemical recipe, cost per meter, and margin prediction
 */
router.post('/optimize', async (req, res) => {
  const {
    shade_name = 'Navy Blue',
    weight_kg = 350,
    liquor_ratio = 7, // 1:7
    meters = 2500,
    agreed_rate_per_meter = 14.50
  } = req.body;

  const wKg = parseFloat(weight_kg) || 350;
  const ratio = parseFloat(liquor_ratio) || 7;
  const mtrs = parseFloat(meters) || 2500;
  const rate = parseFloat(agreed_rate_per_meter) || 14.50;

  const totalWaterLiters = wKg * ratio;
  const shade = SHADE_FORMULATIONS[shade_name] || SHADE_FORMULATIONS['Navy Blue'];

  // 1. Calculate Dyes Dosage & Cost
  let totalDyeCost = 0;
  const dyesBreakdown = shade.dyes.map(d => {
    const qtyKg = parseFloat(((wKg * d.pct_owf) / 100).toFixed(3));
    const cost = parseFloat((qtyKg * d.rate_per_kg).toFixed(2));
    totalDyeCost += cost;
    return {
      name: d.name,
      pct_owf: d.pct_owf,
      dosage_grams: Math.round(qtyKg * 1000),
      qty_kg: qtyKg,
      rate_per_kg: d.rate_per_kg,
      cost
    };
  });

  // 2. Calculate Auxiliaries Dosage & Cost
  let totalAuxCost = 0;
  const auxBreakdown = shade.auxiliaries.map(a => {
    const qtyKg = parseFloat(((totalWaterLiters * a.g_per_l) / 1000).toFixed(2));
    const cost = parseFloat((qtyKg * a.rate_per_kg).toFixed(2));
    totalAuxCost += cost;
    return {
      name: a.name,
      g_per_l: a.g_per_l,
      qty_kg: qtyKg,
      rate_per_kg: a.rate_per_kg,
      cost
    };
  });

  const totalChemicalCost = totalDyeCost + totalAuxCost;
  const steamCostEstimate = wKg * 4.2; // ~4.2 kg steam/kg fabric @ ₹1.8/kg
  const powerCostEstimate = wKg * 2.1; // electricity
  const totalBatchCost = totalChemicalCost + steamCostEstimate + powerCostEstimate;

  const costPerMeter = parseFloat((totalBatchCost / mtrs).toFixed(2));
  const chemicalCostPerMeter = parseFloat((totalChemicalCost / mtrs).toFixed(2));
  const netProfitPerMeter = parseFloat((rate - costPerMeter).toFixed(2));
  const profitMarginPct = parseFloat(((netProfitPerMeter / rate) * 100).toFixed(1));

  res.json({
    success: true,
    input_parameters: {
      shade_name,
      fabric_weight_kg: wKg,
      liquor_ratio: `1:${ratio}`,
      water_volume_liters: totalWaterLiters,
      lot_meters: mtrs,
      job_rate_per_meter: rate
    },
    cost_summary: {
      total_batch_cost: Math.round(totalBatchCost),
      total_chemical_cost: Math.round(totalChemicalCost),
      cost_per_meter: costPerMeter,
      chemical_cost_per_meter: chemicalCostPerMeter,
      utility_cost_per_meter: parseFloat(((steamCostEstimate + powerCostEstimate) / mtrs).toFixed(2)),
      net_margin_per_meter: netProfitPerMeter,
      profit_margin_pct: profitMarginPct,
      rating: profitMarginPct > 35 ? 'HIGH_PROFIT' : profitMarginPct > 20 ? 'NORMAL_PROFIT' : 'LOW_MARGIN'
    },
    recipe_lines: {
      dyes: dyesBreakdown,
      auxiliaries: auxBreakdown
    },
    ai_optimization: {
      class: shade.class,
      temp_profile: shade.temp_profile,
      recommendation: shade.optimization_tip,
      potential_savings_per_meter: '₹0.45 - ₹0.65'
    }
  });
});

/**
 * GET /api/v1/recipes/shade-library
 * List predefined textile shades
 */
router.get('/shade-library', (req, res) => {
  res.json({
    success: true,
    shades: Object.keys(SHADE_FORMULATIONS).map(k => ({
      name: k,
      class: SHADE_FORMULATIONS[k].class,
      temp_profile: SHADE_FORMULATIONS[k].temp_profile
    }))
  });
});

module.exports = router;
