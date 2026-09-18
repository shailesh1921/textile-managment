import { api } from './client';

export const ApiService = {
  // Auth
  login: (data: { username: string; password: string }): Promise<any> => api.post('/api/auth/login', data),
  getMe: (): Promise<any> => api.get('/api/auth/me'),

  // Masters
  getParties: (): Promise<any> => api.get('/api/v1/parties'),
  getFabrics: (): Promise<any> => api.get('/api/v1/fabrics'),
  getShades: (): Promise<any> => api.get('/api/v1/shades'),
  getChemicals: (): Promise<any> => api.get('/api/v1/dye-chemicals'),
  getMachines: (): Promise<any> => api.get('/api/v1/production/machines/dashboard'),

  // Job Orders & Lots
  getJobOrders: (): Promise<any> => api.get('/api/v1/job-orders'),
  createJobOrder: (data: any): Promise<any> => api.post('/api/v1/job-orders', data),
  getLots: (): Promise<any> => api.get('/api/v1/lots'),
  getLotTakas: (lotId: number): Promise<any> => api.get(`/api/v1/lots/${lotId}/takas`),
  addLotTakas: (lotId: number, takas: any[]): Promise<any> => api.post(`/api/v1/lots/${lotId}/takas`, { takas }),

  // Production & Batches
  getBatches: (): Promise<any> => api.get('/api/v1/production/batches'),
  createBatch: (data: any): Promise<any> => api.post('/api/v1/production/batches', data),
  updateBatchStatus: (batchId: number, status: string): Promise<any> => api.patch(`/api/v1/production/batches/${batchId}/status`, { status }),
  getUtilityLogs: (batchId: number): Promise<any> => api.get(`/api/v1/production/batches/${batchId}/utility-log`),
  addUtilityLog: (batchId: number, data: any): Promise<any> => api.post(`/api/v1/production/batches/${batchId}/utility-log`, data),
  checkChemicalStock: (data: any): Promise<any> => api.post('/api/v1/production/check-chemical-stock', data),

  // Quality Control
  getQCQueue: (): Promise<any> => api.get('/api/v1/qc/queue'),
  submitQCInspection: (data: any): Promise<any> => api.post('/api/v1/qc/inspections', data),

  // Inventory & Stock
  getMaterials: (): Promise<any> => api.get('/api/v1/inventory/materials'),

  // Dispatch & Packing
  getPackingLists: (): Promise<any> => api.get('/api/v1/dispatch/packing-lists'),
  createPackingList: (data: any): Promise<any> => api.post('/api/v1/dispatch/packing-lists', data),
  getChallans: (): Promise<any> => api.get('/api/v1/dispatch/challans'),

  // Finance & Executive Reports
  getSummaryReports: (): Promise<any> => api.get('/api/v1/reports/summary'),
  getAgingReport: (): Promise<any> => api.get('/api/v1/finance/aging-report'),
  getLotCost: (lotId: number): Promise<any> => api.get(`/api/v1/finance/lot-cost/${lotId}`),

  // VastraAI Voice Copilot & Operations Assistant
  queryVoiceAssistant: (data: { query: string; language?: string }): Promise<any> => api.post('/api/v1/ai/voice-query', data),
  getAIDiagnostics: (): Promise<any> => api.get('/api/v1/ai/diagnostics'),

  // Next-Gen Innovations
  getFloorLayout: (): Promise<any> => api.get('/api/v1/digital-twin/floor-layout'),
  analyzeFabricImage: (data: any): Promise<any> => api.post('/api/v1/qc/analyze-fabric-image', data),
  sendWhatsAppAlert: (data: any): Promise<any> => api.post('/api/v1/whatsapp/send-dispatch-alert', data),
  optimizeRecipe: (data: any): Promise<any> => api.post('/api/v1/recipes/optimize', data),
  getESGMetrics: (): Promise<any> => api.get('/api/v1/esg/metrics'),
};
