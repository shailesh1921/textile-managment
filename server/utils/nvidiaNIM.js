const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)).catch(() => globalThis.fetch(...args));

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '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';
const NVIDIA_BASE_URL = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || 'z-ai/glm-5.3-flash';

/**
 * Executes a Chat Completion request against NVIDIA NIM
 * Compatible with OpenAI API specs
 */
async function callNvidiaChatCompletion({
  messages,
  model = NVIDIA_MODEL,
  temperature = 0.4,
  max_tokens = 1024,
  response_format = null
}) {
  const url = `${NVIDIA_BASE_URL}/chat/completions`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${NVIDIA_API_KEY}`
  };

  const payload = {
    model,
    messages,
    temperature,
    max_tokens,
    top_p: 0.95
  };

  if (response_format) {
    payload.response_format = response_format;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`NVIDIA NIM API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const choice = data.choices && data.choices[0];
  return choice?.message?.content || '';
}

/**
 * Natural Language Query Parser for Textile ERP
 * Converts voice/text in Hindi, Gujarati, or English to structured intent & filters
 */
async function queryNvidiaTextileCopilot({ userQuery, language = 'en', floorContext = {} }) {
  const systemPrompt = `You are VastraAI, the Master AI Copilot for Indian Textile Dyeing & Printing Process Mills (Surat / Tirupur cluster).
You understand English, Hindi (हिन्दी), Hinglish, Gujarati (ગુજરાતી), and Gujlish.
You analyze shop-floor queries and provide helpful, concise, authoritative operational answers.

Current Floor Context:
- Active Jet Dyeing Machines: 12 of 14 running
- Today's Inward: 42,850 Meters across 418 Takas
- Top Issue: Lot #1847 running +3 hours behind in Stenter stage
- Average ASTM D5430 QC Pass Rate: 98.4% Grade A

Respond in the SAME language the user asked in (e.g. reply in Gujarati if asked in Gujarati, Hindi if asked in Hindi).
Always be encouraging, precise, and manufacturing-oriented.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userQuery }
  ];

  return await callNvidiaChatCompletion({
    messages,
    temperature: 0.4,
    max_tokens: 500
  });
}

/**
 * Analyzes a textile fabric defect using NVIDIA Vision / LLM intelligence
 */
async function analyzeDefectWithNvidia({ defectType, defectSizeInches, fabricWidthInches, metersInspected }) {
  const prompt = `Analyze this textile fabric defect for an ASTM D5430 inspection:
Defect: ${defectType}
Size: ${defectSizeInches} inches
Fabric Width: ${fabricWidthInches} inches
Meters Inspected: ${metersInspected} meters

Provide a JSON output with:
1. root_cause (2 sentences on technical cause in jet machine or stenter)
2. corrective_action (immediate shop-floor remediation for operator)
3. recommended_chemical_fix (if applicable)
4. mill_prevention_tip (maintenance or recipe advice)`;

  const messages = [
    { role: 'system', content: 'You are an expert textile chemical engineer and ASTM D5430 fabric QC specialist. Output valid JSON only.' },
    { role: 'user', content: prompt }
  ];

  try {
    const raw = await callNvidiaChatCompletion({
      messages,
      temperature: 0.2,
      max_tokens: 500
    });
    // Extract JSON if wrapped in markdown
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { summary: raw };
  } catch (err) {
    console.warn('Nvidia defect analysis fallback:', err.message);
    return null;
  }
}

module.exports = {
  callNvidiaChatCompletion,
  queryNvidiaTextileCopilot,
  analyzeDefectWithNvidia
};
