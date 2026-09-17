import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type LanguageCode = 'en' | 'hi' | 'gu';

export const translations = {
  en: {
    mill_name: 'Sarv Uttam Mill',
    search: 'Search index...',
    sign_out: 'Sign Out',
    switch_workspace: 'Switch Workspace',
    
    // Roles
    owner_myself: '👑 Myself (Owner)',
    owner_title: 'Mill Owner (Myself)',
    owner_sub: 'EXECUTIVE OVERVIEW',
    
    admin_role: '⚙️ Mill Admin',
    admin_title: 'Mill Administrator',
    admin_sub: 'FULL CONTROL',
    
    staff_role: '👷‍♂️ Staff Entry',
    staff_title: 'Floor Staff',
    staff_sub: 'DATA ENTRY',

    // Tabs
    tab_owner: 'Owner',
    tab_staff: 'Staff Entry',
    tab_dashboard: 'Dashboard',
    tab_jobs: 'Job Orders',
    tab_production: 'Production',
    tab_qc: 'QC',
    tab_finance: 'Finance',

    // Staff Console
    staff_banner_title: 'Floor Operator Console',
    staff_banner_sub: 'Quickly log inward fabric, batches, QC inspection & packing.',
    tab_inward_greige: '1. Inward Greige',
    tab_load_batch: '2. Load Machine',
    tab_qc_inspect: '3. 4-Point QC',
    tab_packing_dispatch: '4. Packing List',

    customer_trader: 'Customer / Trader',
    select_customer: '-- Select Customer / Trader --',
    fabric_quality: 'Fabric Quality',
    select_fabric: '-- Select Fabric Quality --',
    challan_no: 'Trader Challan No.',
    received_meters: 'Received Meters (m)',
    job_rate: 'Job Rate (₹ / Meter)',
    submit_inward: '+ Submit & Create Inward Lot',

    select_lot: 'Select Inward Lot',
    select_machine: 'Dyeing Machine / Stenter',
    shift: 'Shift',
    shift_a: 'A Shift (06:00 - 14:00)',
    shift_b: 'B Shift (14:00 - 22:00)',
    shift_c: 'C Shift (22:00 - 06:00)',
    fabric_weight_kg: 'Fabric Weight (KG)',
    submit_batch: '+ Start Machine Batch Run',

    meters_inspected: 'Meters Inspected',
    defect_points: 'Total Defect Points (ASTM 4-Point)',
    inspector_remarks: 'Inspector Remarks',
    submit_qc: '+ Record QC Audit Result',

    total_rolls: 'Total Rolls (Takas)',
    finished_meters: 'Finished Meters',
    finished_kg: 'Finished Weight (KG)',
    submit_dispatch: '+ Create Finished Packing List',

    // Owner Cockpit
    owner_overview_title: 'Executive Overview',
    owner_overview_sub: 'Real-time high-level visibility over mill profits, machine utilization & receivables.',
    total_revenue: 'Total Revenue Generated',
    active_machines: 'Active Machines in Run',
    qc_pass_rate: 'QC Pass First-Time Rate',
    trader_receivables: 'Trader Receivables',
    receivables_aging: 'Trader Receivables Aging',

    // Innovations
    innovations_title: 'Next-Gen Mill Innovations',
    innovations_sub: 'Digital Twin, AI Recipe, Vision QC, WhatsApp & ESG',
    nav_digital_twin: 'Mill Digital Twin',
    nav_recipe_optimizer: 'AI Recipe Lab',
    nav_ai_vision_qc: 'AI Defect Vision',
    nav_whatsapp_gateway: 'WhatsApp Bot',
    nav_esg_sustainability: 'ESG Green Mill',

    // General
    loading: 'Loading data...',
    pull_to_refresh: 'Pull down to refresh',
    no_data: 'No records found.',
  },

  hi: {
    mill_name: 'सर्व उत्तम मिल',
    search: 'खोजें...',
    sign_out: 'साइन आउट',
    switch_workspace: 'कार्यक्षेत्र बदलें (Workspace)',

    // Roles
    owner_myself: '👑 खुद (मालिक)',
    owner_title: 'मिल मालिक (खुद)',
    owner_sub: 'कार्यकारी अवलोकन',

    admin_role: '⚙️ मिल एडमिन',
    admin_title: 'मिल एडमिनिस्ट्रेटर',
    admin_sub: 'पूर्ण नियंत्रण',

    staff_role: '👷‍♂️ स्टाफ एंट्री',
    staff_title: 'फ्लोर स्टाफ ऑपरेटर',
    staff_sub: 'डेटा एंट्री',

    // Tabs
    tab_owner: 'मालिक',
    tab_staff: 'स्टाफ एंट्री',
    tab_dashboard: 'डैशबोर्ड',
    tab_jobs: 'जॉब ऑर्डर्स',
    tab_production: 'उत्पादन',
    tab_qc: 'QC जांच',
    tab_finance: 'वित्त',

    // Staff Console
    staff_banner_title: 'फ्लोर ऑपरेटर कंसोल',
    staff_banner_sub: 'ग्रे फैब्रिक आवक, मशीन लोडिंग, QC और पैकिंग आसानी से दर्ज करें।',
    tab_inward_greige: '1. ग्रे फैब्रिक आवक',
    tab_load_batch: '2. मशीन लोड करें',
    tab_qc_inspect: '3. 4-पॉइंट QC',
    tab_packing_dispatch: '4. पैकिंग लिस्ट',

    customer_trader: 'ग्राहक / व्यापारी (पार्टी)',
    select_customer: '-- ग्राहक / व्यापारी चुनें --',
    fabric_quality: 'कपड़े की क्वालिटी',
    select_fabric: '-- कपड़े की क्वालिटी चुनें --',
    challan_no: 'व्यापारी चालान नंबर',
    received_meters: 'प्राप्त मीटर (Meters)',
    job_rate: 'जॉब दर (₹ / मीटर)',
    submit_inward: '+ सबमिट करें और लॉट बनाएं',

    select_lot: 'इनवर्ड लॉट चुनें',
    select_machine: 'डाईंग मशीन / स्टेंटर',
    shift: 'काम की शिफ्ट',
    shift_a: 'A शिफ्ट (सुबह 06:00 - दोपहर 14:00)',
    shift_b: 'B शिफ्ट (दोपहर 14:00 - रात 22:00)',
    shift_c: 'C शिफ्ट (रात 22:00 - सुबह 06:00)',
    fabric_weight_kg: 'कपड़े का वजन (KG)',
    submit_batch: '+ मशीन बैच उत्पादन शुरू करें',

    meters_inspected: 'निरीक्षण किए गए मीटर',
    defect_points: 'कुल दोष अंक (ASTM 4-Point)',
    inspector_remarks: 'टिप्पणी',
    submit_qc: '+ QC ऑडिट परिणाम दर्ज करें',

    total_rolls: 'कुल रोल (ताका संख्या)',
    finished_meters: 'तैयार फिनिश्ड मीटर',
    finished_kg: 'तैयार फिनिश्ड वजन (KG)',
    submit_dispatch: '+ पैकिंग लिस्ट बनाएं',

    // Owner Cockpit
    owner_overview_title: 'कार्यकारी प्रबंधन अवलोकन',
    owner_overview_sub: 'मिल मुनाफा, मार्जिन, मशीन उपयोगिता और व्यापारी बकाया का लाइव विवरण।',
    total_revenue: 'कुल उत्पन्न राजस्व',
    active_machines: 'सक्रिय मशीनें (Running)',
    qc_pass_rate: 'QC पास दर',
    trader_receivables: 'व्यापारी कुल बकाया',
    receivables_aging: 'व्यापारी बकाया (Aging Breakdown)',

    // Innovations
    innovations_title: 'नेक्स्ट-जेन मिल नवाचार',
    innovations_sub: 'डिजिटल ट्विन, एआई रेसिपी, विजन QC, व्हाट्सएप व ESG',
    nav_digital_twin: '🏭 मिल डिजिटल ट्विन',
    nav_recipe_optimizer: '🧪 एआई कलर लैब व रेसिपी',
    nav_ai_vision_qc: '🔍 एआई डिफेक्ट विजन (QC)',
    nav_whatsapp_gateway: '💬 व्हाट्सएप क्लाइंट बॉट',
    nav_esg_sustainability: '🌿 ग्रीन मिल व ऊर्जा ऑडिट',

    // General
    loading: 'डेटा लोड हो रहा है...',
    pull_to_refresh: 'रिफ्रेश करने के लिए नीचे खींचें',
    no_data: 'कोई रिकॉर्ड नहीं मिला।',
  },

  gu: {
    mill_name: 'સર્વ ઉત્તમ મિલ',
    search: 'શોધો...',
    sign_out: 'સાઇન આઉટ',
    switch_workspace: 'કાર્યક્ષેત્ર બદલો (Workspace)',

    // Roles
    owner_myself: '👑 પોતે (માલિક)',
    owner_title: 'મિલ માલિક (પોતે)',
    owner_sub: 'કારોબારી વિહંગાવલોકન',

    admin_role: '⚙️ મિલ એડમિન',
    admin_title: 'મિલ એડમિનિસ્ટ્રેટર',
    admin_sub: 'સંપૂર્ણ નિયંત્રણ',

    staff_role: '👷‍♂️ સ્ટાફ એન્ટ્રી',
    staff_title: 'ફ્લોર સ્ટાફ ઓપરેટર',
    staff_sub: 'ડેટા એન્ટ્રી',

    // Tabs
    tab_owner: 'માલિક',
    tab_staff: 'સ્ટાફ એન્ટ્રી',
    tab_dashboard: 'ડેશબોર્ડ',
    tab_jobs: 'જોબ ઓર્ડર્સ',
    tab_production: 'ઉત્પાદન',
    tab_qc: 'QC તપાસ',
    tab_finance: 'નાણાં',

    // Staff Console
    staff_banner_title: 'ફ્લોર ઓપરેટર કન્સોલ',
    staff_banner_sub: 'ગ્રે કાપડ આવક, મશીન લોડિંગ, QC અને પેકિંગ લિસ્ટ ઝડપથી દાખલ કરો.',
    tab_inward_greige: '1. ગ્રે કાપડ આવક',
    tab_load_batch: '2. મશીન લોડ કરો',
    tab_qc_inspect: '3. 4-પોઇન્ટ QC',
    tab_packing_dispatch: '4. પેકિંગ લિસ્ટ',

    customer_trader: 'ગ્રાહક / વેપારી (પાર્ટી)',
    select_customer: '-- ગ્રાહક / વેપારી પસંદ કરો --',
    fabric_quality: 'કાપડની ગુણવત્તા',
    select_fabric: '-- કાપડની ક્વોલિટી પસંદ કરો --',
    challan_no: 'વેપારી ચલણ નંબર',
    received_meters: 'પ્રાપ્ત મીટર (Meters)',
    job_rate: 'જોબ દર (₹ / મીટર)',
    submit_inward: '+ સબમિટ કરો અને લોટ બનાવો',

    select_lot: 'ઇનવર્ડ લોટ પસંદ કરો',
    select_machine: 'ડાઇંગ મશીન / સ્ટેન્ટર',
    shift: 'કામની શિફ્ટ',
    shift_a: 'A શિફ્ટ (સવારે 06:00 - બપોરે 14:00)',
    shift_b: 'B શિફ્ટ (બપોરે 14:00 - રાત્રે 22:00)',
    shift_c: 'C શિફ્ટ (રાત્રે 22:00 - સવારે 06:00)',
    fabric_weight_kg: 'કાપડનું વજન (KG)',
    submit_batch: '+ મશીન બેચ ઉત્પાદન શરૂ કરો',

    meters_inspected: 'તપાસાયેલા મીટર',
    defect_points: 'કુલ ખામી પોઇન્ટ્સ (ASTM 4-Point)',
    inspector_remarks: 'નોંધ',
    submit_qc: '+ QC ઓડિટ પરિણામ નોંધો',

    total_rolls: 'કુલ રોલ (તાકા સંખ્યા)',
    finished_meters: 'તૈયાર ફિનિશ્ડ મીટર',
    finished_kg: 'તૈયાર ફિનિશ્ડ વજન (KG)',
    submit_dispatch: '+ પેકિંગ લિસ્ટ બનાવો',

    // Owner Cockpit
    owner_overview_title: 'કારોબારી સંચાલન વિહંગાવલોકન',
    owner_overview_sub: 'મિલ નફો, માર્જિન, મશીન ક્ષમતા અને વેપારી બાકી રકમનું લાઇવ વિશ્લેષણ.',
    total_revenue: 'કુલ ઉત્પાદિત આવક',
    active_machines: 'ચાલુ સક્રિય મશીનો',
    qc_pass_rate: 'QC પાસ દર',
    trader_receivables: 'વેપારી કુલ બાકી રકમ',
    receivables_aging: 'વેપારી બાકી વિભાજન (Aging)',

    // Innovations
    innovations_title: 'નેક્સ્ટ-જેન મિલ નવીનતાઓ',
    innovations_sub: 'ડિજિટલ ટ્વિન, એઆઈ રેસિપી, વિઝન QC, વોટ્સએપ અને ESG',
    nav_digital_twin: '🏭 મિલ ડિજિટલ ટ્વિન',
    nav_recipe_optimizer: '🧪 એઆઈ રેસિપી લેબ',
    nav_ai_vision_qc: '🔍 એઆઈ ડિફેક્ટ વિઝન (QC)',
    nav_whatsapp_gateway: '💬 વોટ્સએપ ક્લાયન્ટ બોટ',
    nav_esg_sustainability: '🌿 ગ્રીન મિલ અને ઊર્જા ઓડિટ',

    // General
    loading: 'ડેટા લોડ થઈ રહ્યો છે...',
    pull_to_refresh: 'રિફ્રેશ કરવા નીચે ખેંચો',
    no_data: 'કોઈ રેકોર્ડ મળ્યો નથી.',
  }
};

interface LanguageContextType {
  lang: LanguageCode;
  setLang: (lang: LanguageCode) => void;
  t: (key: keyof typeof translations['en']) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key as string,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<LanguageCode>('en');

  useEffect(() => {
    AsyncStorage.getItem('mobile_lang').then((saved) => {
      if (saved && (saved === 'en' || saved === 'hi' || saved === 'gu')) {
        setLangState(saved as LanguageCode);
      }
    });
  }, []);

  const setLang = (newLang: LanguageCode) => {
    setLangState(newLang);
    AsyncStorage.setItem('mobile_lang', newLang);
  };

  const t = (key: keyof typeof translations['en']) => {
    return translations[lang]?.[key] || translations['en']?.[key] || (key as string);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
