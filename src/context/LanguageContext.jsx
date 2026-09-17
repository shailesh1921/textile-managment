import React, { createContext, useContext, useState, useEffect } from 'react';

export const translations = {
  en: {
    // Top Bar & Global
    mill_title: 'Sarv Uttam Mill',
    search_placeholder: 'Search index...',
    language: 'Language',
    sign_out: 'SIGN OUT',
    active_workspace: 'Switch Active Workspace',

    // Role Personas
    owner_myself: '👑 Myself (Owner)',
    owner_title: 'Mill Owner (Myself)',
    owner_sub: 'EXECUTIVE OVERVIEW',
    owner_desc: 'Executive P&L, profit margins & audit',

    admin_role: '⚙️ Mill Admin',
    admin_title: 'Mill Administrator',
    admin_sub: 'FULL ADMIN CONTROL',
    admin_desc: 'All masters, billing, settings & full data',

    staff_role: '👷‍♂️ Staff Entry',
    staff_title: 'Floor Staff',
    staff_sub: 'DATA ENTRY OPERATOR',
    staff_desc: 'Add inwards, batch runs, QC & packing',

    // Navigation Menu
    nav_owner_cockpit: '👑 Owner Cockpit',
    nav_admin_dashboard: '⚙️ Admin Dashboard',
    nav_staff_entry: '👷‍♂️ Staff Data Entry',
    nav_digital_twin: '🏭 Mill Digital Twin',
    nav_recipe_optimizer: '🧪 AI Recipe Lab',
    nav_ai_vision_qc: '🔍 AI Defect Vision',
    nav_whatsapp_gateway: '💬 WhatsApp Bot',
    nav_esg_sustainability: '🌿 ESG Green Mill',
    nav_dashboard: 'Dashboard',
    nav_masters: 'Master Data',
    nav_jobs: 'Job Orders (Takas)',
    nav_production: 'Production (Dyeing)',
    nav_jobwork: 'Job-Work Dispatches',
    nav_quality: 'Quality Control (QC)',
    nav_inventory: 'Inventory & Chemicals',
    nav_procurement: 'Procurement (PO)',
    nav_dispatch: 'Dispatch & GST',
    nav_sales: 'Sales Orders',
    nav_finance: 'Finance & Costing',
    nav_reports: 'Reports & Analytics',

    // Staff Entry Module
    staff_portal_tag: 'STAFF PORTAL • HIGH-SPEED DATA ENTRY',
    staff_console_title: 'Floor Operator & Data Entry Console',
    staff_console_sub: 'Quickly enter inward greige, load production machines, record QC inspection, and generate packing lists.',
    logged_as_staff: 'Logged as Floor Staff',
    
    tab_inward_greige: '1. Inward Greige Fabric',
    tab_inward_sub: 'Log incoming trader challan',
    tab_load_batch: '2. Load Machine Batch',
    tab_load_sub: 'Assign lot to dyeing machine',
    tab_qc_inspect: '3. 4-Point QC Inspection',
    tab_qc_sub: 'Record defect score',
    tab_packing_dispatch: '4. Packing & Dispatch',
    tab_packing_sub: 'Create delivery packing',

    form_customer_trader: 'Customer / Trader',
    form_select_customer: '-- Select Customer / Trader --',
    form_fabric_quality: 'Fabric Quality',
    form_select_fabric: '-- Select Fabric Quality --',
    form_challan_no: 'Trader Challan No.',
    form_received_meters: 'Received Meters',
    form_job_rate: 'Job Rate (₹ / Meter)',
    form_submit_inward: '+ Submit & Create Inward Lot',

    form_select_lot: 'Select Inward Lot',
    form_select_machine: 'Dyeing Machine / Stenter',
    form_shift: 'Operational Shift',
    form_shift_a: 'A Shift (06:00 - 14:00)',
    form_shift_b: 'B Shift (14:00 - 22:00)',
    form_shift_c: 'C Shift (22:00 - 06:00)',
    form_fabric_mass_kg: 'Fabric Mass (Weight in KG)',
    form_submit_batch: '+ Start Machine Batch Execution',

    form_meters_inspected: 'Meters Inspected',
    form_defect_points: 'Total Defect Points (ASTM 4-Point)',
    form_inspector_remarks: 'Inspector Remarks',
    form_submit_qc: '+ Record QC Audit Result',

    form_total_rolls: 'Total Rolls (Takas)',
    form_finished_meters: 'Finished Meters',
    form_finished_kg: 'Finished Weight (KG)',
    form_submit_dispatch: '+ Create Packing List & Ready for Dispatch',

    operator_quick_actions: 'Operator Quick Actions',
    print_qr_traveler: 'Print QR Lot Traveler',
    print_qr_sub: 'Generate barcoded slip',
    log_utility_fuel: 'Log Utility Fuel (Coal/Steam)',
    log_utility_sub: 'Enter shift power readings',
    check_chemical_stock: 'Check Dye Chemical Stock',
    check_chemical_sub: 'View reorder alerts',
    active_lots_floor: 'Current Active Lots on Floor',

    // Owner Cockpit
    owner_cockpit_tag: 'MILL OWNER & EXECUTIVE COCKPIT',
    owner_cockpit_title: 'Executive Management Overview',
    owner_cockpit_sub: 'Real-time high-level visibility over mill profit margins, active machine floor utilization, trader receivables, and staff logs.',
    view_lot_profit_sheets: 'View Lot Profit Sheets',
    total_revenue: 'Total Revenue Generated',
    active_machines: 'Active Machines in Run',
    qc_pass_rate: 'QC Pass First-Time Rate',
    trader_receivables: 'Trader Outstanding Receivables',
    live_machine_ops: 'Live Machine Floor Operations',
    receivables_aging: 'Trader Receivables Aging Breakdown',
    executive_approvals: 'Executive Approvals & Actions'
  },

  hi: {
    // Top Bar & Global
    mill_title: 'सर्व उत्तम मिल',
    search_placeholder: 'इंडेक्स खोजें...',
    language: 'भाषा',
    sign_out: 'साइन आउट',
    active_workspace: 'कार्यक्षेत्र बदलें (Workspace)',

    // Role Personas
    owner_myself: '👑 खुद (मालिक)',
    owner_title: 'मिल मालिक (खुद)',
    owner_sub: 'कार्यकारी अवलोकन (EXECUTIVE)',
    owner_desc: 'मुनाफा, मार्जिन और वित्तीय ऑडिट',

    admin_role: '⚙️ मिल एडमिन',
    admin_title: 'मिल एडमिनिस्ट्रेटर',
    admin_sub: 'पूर्ण एडमिन नियंत्रण',
    admin_desc: 'मास्टर्स, बिलिंग, दरें और समग्र डेटा',

    staff_role: '👷‍♂️ स्टाफ एंट्री',
    staff_title: 'फ्लोर स्टाफ ऑपरेटर',
    staff_sub: 'डेटा एंट्री ऑपरेटर',
    staff_desc: 'ग्रे आवक, मशीन रन, QC और पैकिंग एंट्री',

    // Navigation Menu
    nav_owner_cockpit: '👑 ओनर कॉकपिट (कार्यकारी)',
    nav_admin_dashboard: '⚙️ व्यवस्थापक डैशबोर्ड',
    nav_staff_entry: '👷‍♂️ स्टाफ डेटा एंट्री',
    nav_digital_twin: '🏭 मिल डिजिटल ट्विन (लाइव)',
    nav_recipe_optimizer: '🧪 एआई कलर लैब व रेसिपी',
    nav_ai_vision_qc: '🔍 एआई डिफेक्ट विजन (QC)',
    nav_whatsapp_gateway: '💬 व्हाट्सएप क्लाइंट बॉट',
    nav_esg_sustainability: '🌿 ग्रीन मिल व ऊर्जा ऑडिट',
    nav_dashboard: 'डैशबोर्ड',
    nav_masters: 'मास्टर डेटा',
    nav_jobs: 'जॉब ऑर्डर्स (ताका)',
    nav_production: 'उत्पादन (डाईंग / स्टेंटर)',
    nav_jobwork: 'जॉब-वर्क डिस्पैच',
    nav_quality: 'गुणवत्ता नियंत्रण (QC)',
    nav_inventory: 'इन्वेंटरी और केमिकल',
    nav_procurement: 'खरीद (PO)',
    nav_dispatch: 'डिस्पैच एवं जीएसटी चालान',
    nav_sales: 'बिक्री ऑर्डर्स',
    nav_finance: 'वित्त एवं बिलिंग',
    nav_reports: 'रिपोर्ट्स और एनालिटिक्स',

    // Staff Entry Module
    staff_portal_tag: 'स्टाफ पोर्टल • तीव्र गति डेटा एंट्री',
    staff_console_title: 'फ्लोर ऑपरेटर और डेटा एंट्री कंसोल',
    staff_console_sub: 'ग्रे फैब्रिक आवक, मशीन बैच लोडिंग, 4-पॉइंट QC निरीक्षण और पैकिंग लिस्ट आसानी से दर्ज करें।',
    logged_as_staff: 'फ्लोर स्टाफ के रूप में लॉग इन',

    tab_inward_greige: '1. ग्रे फैब्रिक आवक',
    tab_inward_sub: 'व्यापारी का चालान दर्ज करें',
    tab_load_batch: '2. मशीन बैच लोड करें',
    tab_load_sub: 'डाईंग मशीन में लॉट लगाएं',
    tab_qc_inspect: '3. 4-पॉइंट QC निरीक्षण',
    tab_qc_sub: 'दोष (फॉल्ट) पॉइंट दर्ज करें',
    tab_packing_dispatch: '4. पैकिंग और डिस्पैच',
    tab_packing_sub: 'डिलीवरी पैकिंग तैयार करें',

    form_customer_trader: 'ग्राहक / व्यापारी (पार्टी)',
    form_select_customer: '-- ग्राहक / व्यापारी चुनें --',
    form_fabric_quality: 'कपड़े की क्वालिटी (Fabric)',
    form_select_fabric: '-- कपड़े की क्वालिटी चुनें --',
    form_challan_no: 'व्यापारी चालान नंबर',
    form_received_meters: 'प्राप्त मीटर (Meters)',
    form_job_rate: 'जॉब दर (₹ / मीटर)',
    form_submit_inward: '+ सबमिट करें और नया लॉट बनाएं',

    form_select_lot: 'इनवर्ड लॉट चुनें',
    form_select_machine: 'डाईंग मशीन / स्टेंटर',
    form_shift: 'काम की शिफ्ट',
    form_shift_a: 'A शिफ्ट (सुबह 06:00 - दोपहर 14:00)',
    form_shift_b: 'B शिफ्ट (दोपहर 14:00 - रात 22:00)',
    form_shift_c: 'C शिफ्ट (रात 22:00 - सुबह 06:00)',
    form_fabric_mass_kg: 'कपड़े का वजन (किलोग्राम में)',
    form_submit_batch: '+ मशीन बैच उत्पादन शुरू करें',

    form_meters_inspected: 'निरीक्षण किए गए मीटर',
    form_defect_points: 'कुल दोष अंक (ASTM 4-Point)',
    form_inspector_remarks: 'निरीक्षक की टिप्पणी',
    form_submit_qc: '+ QC ऑडिट परिणाम दर्ज करें',

    form_total_rolls: 'कुल रोल (ताका संख्या)',
    form_finished_meters: 'तैयार फिनिश्ड मीटर',
    form_finished_kg: 'तैयार फिनिश्ड वजन (KG)',
    form_submit_dispatch: '+ पैकिंग लिस्ट बनाएं और डिस्पैच करें',

    operator_quick_actions: 'ऑपरेटर त्वरित कार्य',
    print_qr_traveler: 'QR लॉट कार्ड प्रिंट करें',
    print_qr_sub: 'बारकोडेड ट्रेवलर पर्ची निकालें',
    log_utility_fuel: 'ईंधन (कोयला/भाप) दर्ज करें',
    log_utility_sub: 'शिफ्ट की बिजली व ईंधन रीडिंग',
    check_chemical_stock: 'डाई केमिकल स्टॉक देखें',
    check_chemical_sub: 'री-ऑर्डर अलर्ट चेक करें',
    active_lots_floor: 'फ्लोर पर वर्तमान सक्रिय लॉट',

    // Owner Cockpit
    owner_cockpit_tag: 'मिल मालिक एवं कार्यकारी कॉकपिट',
    owner_cockpit_title: 'कार्यकारी प्रबंधन अवलोकन (Executive Overview)',
    owner_cockpit_sub: 'मिल के मुनाफे, मार्जिन, मशीन उपयोगिता, व्यापारी बकाया और स्टाफ प्रविष्टियों का लाइव विवरण।',
    view_lot_profit_sheets: 'लॉट मुनाफा शीट देखें',
    total_revenue: 'कुल उत्पन्न राजस्व (Revenue)',
    active_machines: 'सक्रिय मशीनें (Running)',
    qc_pass_rate: 'QC प्रथम-बार पास दर',
    trader_receivables: 'व्यापारी कुल बकाया राशि',
    live_machine_ops: 'लाइव मशीन फ्लोर स्थिति',
    receivables_aging: 'व्यापारी बकाया (Aging Breakdown)',
    executive_approvals: 'कार्यकारी अनुमोदन एवं कार्य'
  },

  gu: {
    // Top Bar & Global
    mill_title: 'સર્વ ઉત્તમ મિલ',
    search_placeholder: 'ઇન્ડેક્સ શોધો...',
    language: 'ભાષા',
    sign_out: 'સાઇન આઉટ',
    active_workspace: 'કાર્યક્ષેત્ર બદલો (Workspace)',

    // Role Personas
    owner_myself: '👑 પોતે (માલિક)',
    owner_title: 'મિલ માલિક (પોતે)',
    owner_sub: 'કારોબારી વિહંગાવલોકન',
    owner_desc: 'નફો, માર્જિન અને નાણાકીય ઓડિટ',

    admin_role: '⚙️ મિલ એડમિન',
    admin_title: 'મિલ એડમિનિસ્ટ્રેટર',
    admin_sub: 'સંપૂર્ણ એડમિન નિયંત્રણ',
    admin_desc: 'માસ્ટર્સ, બિલિંગ, દરો અને તમામ ડેટા',

    staff_role: '👷‍♂️ સ્ટાફ એન્ટ્રી',
    staff_title: 'ફ્લોર સ્ટાફ ઓપરેટર',
    staff_sub: 'ડેટા એન્ટ્રી ઓપરેટર',
    staff_desc: 'ગ્રે આવક, મશીન બેચ, QC અને પેકિંગ એન્ટ્રી',

    // Navigation Menu
    nav_owner_cockpit: '👑 માલિક કોકપિટ (વિહંગાવલોકન)',
    nav_admin_dashboard: '⚙️ એડમિન ડેશબોર્ડ',
    nav_staff_entry: '👷‍♂️ સ્ટાફ ડેટા એન્ટ્રી',
    nav_digital_twin: '🏭 મિલ ડિજિટલ ટ્વિન (લાઇવ)',
    nav_recipe_optimizer: '🧪 એઆઈ રેસિપી લેબ',
    nav_ai_vision_qc: '🔍 એઆઈ ડિફેક્ટ વિઝન (QC)',
    nav_whatsapp_gateway: '💬 વોટ્સએપ ક્લાયન્ટ બોટ',
    nav_esg_sustainability: '🌿 ગ્રીન મિલ અને ઊર્જા ઓડિટ',
    nav_dashboard: 'ડેશબોર્ડ',
    nav_masters: 'માસ્ટર ડેટા',
    nav_jobs: 'જોબ ઓર્ડર્સ (તાકા)',
    nav_production: 'ઉત્પાદન (ડાઇંગ / સ્ટેન્ટર)',
    nav_jobwork: 'જોબ-વર્ક ડિસ્પેચ',
    nav_quality: 'ગુણવત્તા નિયંત્રણ (QC)',
    nav_inventory: 'ઇન્વેન્ટરી અને રસાયણો',
    nav_procurement: 'ખરીદી (PO)',
    nav_dispatch: 'ડિસ્પેચ અને જીએસટી ચલણ',
    nav_sales: 'વેચાણ ઓર્ડર્સ',
    nav_finance: 'નાણાં અને બિલિંગ',
    nav_reports: 'રિપોર્ટ્સ અને એનાલિટિક્સ',

    // Staff Entry Module
    staff_portal_tag: 'સ્ટાફ પોર્ટલ • ઝડપી ડેટા એન્ટ્રી',
    staff_console_title: 'ફ્લોર ઓપરેટર અને ડેટા એન્ટ્રી કન્સોલ',
    staff_console_sub: 'ગ્રે કાપડ આવક, મશીન બેચ લોડિંગ, 4-પોઇન્ટ QC તપાસ અને પેકિંગ લિસ્ટ ઝડપથી દાખલ કરો.',
    logged_as_staff: 'ફ્લોર સ્ટાફ તરીકે લોગ ઇન',

    tab_inward_greige: '1. ગ્રે કાપડ આવક',
    tab_inward_sub: 'વેપારીનું ચલણ દાખલ કરો',
    tab_load_batch: '2. મશીન બેચ લોડ કરો',
    tab_load_sub: 'ડાઇંગ મશીનમાં લોટ ચડાવો',
    tab_qc_inspect: '3. 4-પોઇન્ટ QC તપાસ',
    tab_qc_sub: 'ખામી પોઇન્ટ્સ નોંધો',
    tab_packing_dispatch: '4. પેકિંગ અને ડિસ્પેચ',
    tab_packing_sub: 'ડિલિવરી પેકિંગ બનાવો',

    form_customer_trader: 'ગ્રાહક / વેપારી (પાર્ટી)',
    form_select_customer: '-- ગ્રાહક / વેપારી પસંદ કરો --',
    form_fabric_quality: 'કાપડની ગુણવત્તા (ક્વોલિટી)',
    form_select_fabric: '-- કાપડની ક્વોલિટી પસંદ કરો --',
    form_challan_no: 'વેપારી ચલણ નંબર',
    form_received_meters: 'પ્રાપ્ત મીટર (Meters)',
    form_job_rate: 'જોબ દર (₹ / મીટર)',
    form_submit_inward: '+ સબમિટ કરો અને નવો લોટ બનાવો',

    form_select_lot: 'ઇનવર્ડ લોટ પસંદ કરો',
    form_select_machine: 'ડાઇંગ મશીન / સ્ટેન્ટર',
    form_shift: 'કામની શિફ્ટ',
    form_shift_a: 'A શિફ્ટ (સવારે 06:00 - બપોરે 14:00)',
    form_shift_b: 'B શિફ્ટ (બપોરે 14:00 - રાત્રે 22:00)',
    form_shift_c: 'C શિફ્ટ (રાત્રે 22:00 - સવારે 06:00)',
    form_fabric_mass_kg: 'કાપડનું વજન (કિલોગ્રામમાં)',
    form_submit_batch: '+ મશીન બેચ ઉત્પાદન શરૂ કરો',

    form_meters_inspected: 'તપાસાયેલા મીટર',
    form_defect_points: 'કુલ ખામી પોઇન્ટ્સ (ASTM 4-Point)',
    form_inspector_remarks: 'ઇન્સ્પેક્ટર નોંધ',
    form_submit_qc: '+ QC ઓડિટ પરિણામ નોંધો',

    form_total_rolls: 'કુલ રોલ (તાકા સંખ્યા)',
    form_finished_meters: 'તૈયાર ફિનિશ્ડ મીટર',
    form_finished_kg: 'તૈયાર ફિનિશ્ડ વજન (KG)',
    form_submit_dispatch: '+ પેકિંગ લિસ્ટ બનાવો અને ડિસ્પેચ કરો',

    operator_quick_actions: 'ઓપરેટર ઝડપી ક્રિયાઓ',
    print_qr_traveler: 'QR લોટ કાર્ડ પ્રિન્ટ કરો',
    print_qr_sub: 'બારકોડેડ સ્લિપ જનરેટ કરો',
    log_utility_fuel: 'ઇંધણ (કોલસો/વરાળ) નોંધો',
    log_utility_sub: 'શિફ્ટ પાવર અને ફ્યુઅલ રીડિંગ',
    check_chemical_stock: 'ડાઇ કેમિકલ સ્ટોક તપાસો',
    check_chemical_sub: 'રી-ઓર્ડર ચેતવણીઓ જુઓ',
    active_lots_floor: 'ફ્લોર પર ચાલુ સક્રિય લોટ્સ',

    // Owner Cockpit
    owner_cockpit_tag: 'મિલ માલિક અને કારોબારી કોકપિટ',
    owner_cockpit_title: 'કારોબારી સંચાલન વિહંગાવલોકન',
    owner_cockpit_sub: 'મિલ નફો, માર્જિન, મશીન ક્ષમતા ઉપયોગ, વેપારી બાકી રકમ અને સ્ટાફ પ્રવૃત્તિઓનું લાઇવ વિશ્લેષણ.',
    view_lot_profit_sheets: 'લોટ નફા પત્રક જુઓ',
    total_revenue: 'કુલ ઉત્પાદિત આવક (Revenue)',
    active_machines: 'ચાલુ સક્રિય મશીનો',
    qc_pass_rate: 'QC પ્રથમ-વખત પાસ દર',
    trader_receivables: 'વેપારી કુલ બાકી રકમ',
    live_machine_ops: 'લાઇવ મશીન ફ્લોર સ્થિતિ',
    receivables_aging: 'વેપારી બાકી વિભાજન (Aging)',
    executive_approvals: 'કારોબારી મંજૂરી અને કાર્યો'
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('textile_lang') || 'en';
  });

  const changeLanguage = (newLang) => {
    if (translations[newLang]) {
      setLang(newLang);
      localStorage.setItem('textile_lang', newLang);
    }
  };

  const t = (key) => {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
