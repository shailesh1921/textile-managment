import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Volume2, VolumeX, Sparkles, X, Send, 
  RefreshCw, Database, AlertCircle, ChevronRight, Activity, Globe, CheckCircle2 
} from 'lucide-react';
import { api } from '../lib/api';
import { useLanguage } from '../context/LanguageContext';

export const AIVoiceCopilotModal = ({ isOpen, onClose }) => {
  const { lang: globalLang } = useLanguage();
  const [selectedLang, setSelectedLang] = useState(globalLang || 'hi'); // 'hi' | 'gu' | 'en'
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [showSql, setShowSql] = useState(false);

  const recognitionRef = useRef(null);
  const scrollRef = useRef(null);

  // Sync with global language if changed
  useEffect(() => {
    if (globalLang) setSelectedLang(globalLang);
  }, [globalLang]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setQuery(transcript);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Update recognition language
  useEffect(() => {
    if (recognitionRef.current) {
      if (selectedLang === 'hi') recognitionRef.current.lang = 'hi-IN';
      else if (selectedLang === 'gu') recognitionRef.current.lang = 'gu-IN';
      else recognitionRef.current.lang = 'en-IN';
    }
  }, [selectedLang]);

  // Auto scroll to bottom of messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation, loading]);

  // Speak aloud via SpeechSynthesis
  const speakText = (text, langCode) => {
    if (isMuted || !window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    if (langCode === 'hi') utterance.lang = 'hi-IN';
    else if (langCode === 'gu') utterance.lang = 'gu-IN';
    else utterance.lang = 'en-IN';

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. You can type your query below.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setQuery('');
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Could not start recognition:', err);
      }
    }
  };

  const handleSend = async (customQuery) => {
    const q = (customQuery || query).trim();
    if (!q) return;

    if (isListening && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    // Add user message to history
    const userMsg = { sender: 'user', text: q, timestamp: new Date() };
    setConversation(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res = await api.post('/api/v1/ai/voice-query', {
        query: q,
        language: selectedLang
      });

      const botMsg = {
        sender: 'bot',
        text: res.voice_text,
        display_card: res.display_card,
        sql: res.sql_executed,
        intent: res.intent,
        lang: res.applied_language,
        timestamp: new Date()
      };

      setConversation(prev => [...prev, botMsg]);
      speakText(res.voice_text, res.applied_language);
    } catch (err) {
      const errorMsg = {
        sender: 'bot',
        text: selectedLang === 'hi' 
          ? 'क्षमा करें, आपके प्रश्न का उत्तर प्राप्त करने में समस्या आई।'
          : selectedLang === 'gu'
          ? 'માફ કરશો, ડેટાબેઝ ક્વેરી કરવામાં ભૂલ આવી છે.'
          : 'Sorry, could not process query against the database.',
        isError: true,
        timestamp: new Date()
      };
      setConversation(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleRunDiagnostics = async () => {
    setLoading(true);
    const diagUserMsg = {
      sender: 'user',
      text: selectedLang === 'hi' ? 'कारखाने की स्थिति और अलर्ट चेक करो' : selectedLang === 'gu' ? 'મિલ ડાયગ્નોસ્ટિક્સ અને એલર્ટ્સ બતાવો' : 'Run mill floor diagnostics and check alerts',
      timestamp: new Date()
    };
    setConversation(prev => [...prev, diagUserMsg]);

    try {
      const res = await api.get('/api/v1/ai/diagnostics');
      const voiceTxt = res.voice_responses?.[selectedLang] || res.display_card?.subtitle || 'Diagnostics complete';
      
      const botMsg = {
        sender: 'bot',
        text: voiceTxt,
        display_card: res.display_card,
        intent: 'PROACTIVE_BOTTLENECK_ALERT',
        lang: selectedLang,
        timestamp: new Date()
      };

      setConversation(prev => [...prev, botMsg]);
      speakText(voiceTxt, selectedLang);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Quick Chips in 3 languages
  const quickPrompts = {
    hi: [
      "लॉट 1 का स्टेटस क्या है?",
      "गोदाम में कितना ग्रे कपड़ा है?",
      "मशीनों की क्या स्थिति है?",
      "कोई बैच लेट चल रहा है?"
    ],
    gu: [
      "લોટ 1 નું સ્ટેટસ શું છે?",
      "ગોડાઉનમાં કેટલું ગ્રે કાપડ છે?",
      "કઈ મશીનો અત્યારે ચાલુ છે?",
      "કોઈ બેચમાં પ્રોબ્લેમ છે?"
    ],
    en: [
      "What is the status of Lot 1?",
      "How much greige stock is left?",
      "Show active machines occupancy",
      "Any delayed production batches?"
    ]
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col h-[640px] max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-[#1E1B4B] to-[#6B4EFF] text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner">
              <Sparkles size={18} className="text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base tracking-wide">VastraAI Copilot</h2>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Live DB Grounded
                </span>
              </div>
              <p className="text-xs text-slate-300">Multilingual Natural Language Voice Assistant (वस्त्र-AI / વસ્ત્ર-AI)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <div className="flex bg-white/10 p-0.5 rounded-lg border border-white/15">
              {[
                { id: 'en', label: 'EN' },
                { id: 'hi', label: 'हिंदी' },
                { id: 'gu', label: 'ગુજ' }
              ].map(l => (
                <button
                  key={l.id}
                  onClick={() => setSelectedLang(l.id)}
                  className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all ${
                    selectedLang === l.id 
                      ? 'bg-white text-slate-900 shadow-xs' 
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            {/* Mute Voice Toggle */}
            <button
              onClick={() => {
                if (window.speechSynthesis) window.speechSynthesis.cancel();
                setIsMuted(!isMuted);
              }}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              title={isMuted ? 'Unmute Audio' : 'Mute Voice'}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} className={isSpeaking ? 'text-emerald-400 animate-bounce' : ''} />}
            </button>

            {/* Close Button */}
            <button
              onClick={() => {
                if (window.speechSynthesis) window.speechSynthesis.cancel();
                onClose();
              }}
              className="p-2 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Message / Conversation History */}
        <div ref={scrollRef} className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/60">
          
          {conversation.length === 0 && (
            <div className="text-center py-6 px-4">
              <div className="w-16 h-16 rounded-2xl bg-[#6B4EFF]/10 text-[#6B4EFF] flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Mic size={28} className="animate-pulse" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-lg mb-1">
                {selectedLang === 'hi' ? 'पूछिए: "लॉट 1 का स्टेटस क्या है?"' : selectedLang === 'gu' ? 'પૂછો: "જેટ મશીનોની શું સ્થિતિ છે?"' : 'Speak or ask any mill operations query'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
                {selectedLang === 'hi' 
                  ? 'कारखाने के कर्मचारी या मालिक सीधे हिंदी, गुजराती या अंग्रेजी में बोलकर लॉट, मशीन, ग्रे कपड़ा, और पेमेंट्स की सटीक जानकारी ले सकते हैं।'
                  : selectedLang === 'gu'
                  ? 'કારખાનાના કારીગર કે માલિક સીધા બોલીને લોટ સ્ટેટસ, જેટ્સ, ગ્રે સ્ટોક અને પેન્ડિંગ પેમેન્ટ જાણી શકે છે.'
                  : 'Floor workers and mill owners can speak naturally to query live batches, grey stock, stenter loads, and receivables in real time.'}
              </p>

              {/* Quick Prompt Chips */}
              <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
                {quickPrompts[selectedLang].map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(prompt)}
                    className="text-xs font-semibold px-3 py-2 bg-white hover:bg-[#6B4EFF]/10 hover:text-[#6B4EFF] hover:border-[#6B4EFF]/30 text-slate-700 rounded-xl border border-slate-200 transition-all shadow-2xs text-left"
                  >
                    💬 {prompt}
                  </button>
                ))}
              </div>

              {/* Proactive Check Button */}
              <div className="mt-5">
                <button
                  onClick={handleRunDiagnostics}
                  className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl shadow-xs transition-all"
                >
                  <Activity size={14} />
                  <span>{selectedLang === 'hi' ? '🚨 अलर्ट्स व विलंबित बैच चेक करें' : selectedLang === 'gu' ? '🚨 મિલ એલર્ટ્સ ચેક કરો' : '🚨 Run Proactive Mill Health Diagnostics'}</span>
                </button>
              </div>
            </div>
          )}

          {conversation.map((msg, index) => (
            <div key={index} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              
              {/* User Bubble */}
              {msg.sender === 'user' ? (
                <div className="bg-[#6B4EFF] text-white px-4 py-2.5 rounded-2xl rounded-tr-xs max-w-[85%] shadow-sm text-sm font-medium">
                  {msg.text}
                </div>
              ) : (
                /* Bot Response Card */
                <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs p-4 max-w-[95%] shadow-sm space-y-3">
                  
                  {/* Spoken Answer Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#6B4EFF]/10 text-[#6B4EFF] flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles size={14} />
                      </div>
                      <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                        {msg.text}
                      </p>
                    </div>

                    <button
                      onClick={() => speakText(msg.text, msg.lang || selectedLang)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[#6B4EFF] hover:bg-slate-100 transition-colors shrink-0"
                      title="Replay Voice"
                    >
                      <Volume2 size={15} />
                    </button>
                  </div>

                  {/* Display Card (Structured UI View) */}
                  {msg.display_card && (
                    <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{msg.display_card.title}</h4>
                          {msg.display_card.subtitle && (
                            <p className="text-[11px] text-slate-500 font-medium">{msg.display_card.subtitle}</p>
                          )}
                        </div>
                        {msg.display_card.status && (
                          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            msg.display_card.badgeVariant === 'danger' 
                              ? 'bg-rose-100 text-rose-700' 
                              : msg.display_card.badgeVariant === 'success' 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {msg.display_card.status}
                          </span>
                        )}
                      </div>

                      {/* Metrics Badges */}
                      {msg.display_card.metrics && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                          {msg.display_card.metrics.map((m, mIdx) => (
                            <div key={mIdx} className="bg-white p-2 rounded-lg border border-slate-200/60 shadow-2xs">
                              <span className="text-[10px] text-slate-400 font-semibold block">{m.label}</span>
                              <span className="text-xs font-black text-slate-800 block truncate">{m.value}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* List Items */}
                      {msg.display_card.list && (
                        <div className="space-y-1.5 pt-1 border-t border-slate-200/60">
                          {msg.display_card.list.map((item, iIdx) => (
                            <div key={iIdx} className="flex items-center justify-between text-xs py-1 px-1.5 rounded hover:bg-white transition-colors">
                              <div>
                                <span className="font-bold text-slate-700 block">{item.name}</span>
                                <span className="text-[10px] text-slate-400 font-normal">{item.sub}</span>
                              </div>
                              <span className="font-extrabold text-[11px] text-slate-800">{item.status}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Grounded SQL Query Toggle */}
                  {msg.sql && (
                    <div className="pt-1">
                      <button
                        onClick={() => setShowSql(!showSql)}
                        className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <Database size={11} />
                        <span>{showSql ? 'Hide SQL' : 'Inspect Grounded SQL Query'}</span>
                      </button>
                      {showSql && (
                        <pre className="mt-1.5 p-2.5 bg-slate-900 text-emerald-400 rounded-lg text-[10px] font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
                          {msg.sql}
                        </pre>
                      )}
                    </div>
                  )}

                </div>
              )}

            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-slate-200 w-fit shadow-xs animate-pulse">
              <RefreshCw size={14} className="animate-spin text-[#6B4EFF]" />
              <span className="text-xs font-semibold text-slate-600">
                {selectedLang === 'hi' ? 'डेटाबेस से उत्तर प्राप्त किया जा रहा है...' : selectedLang === 'gu' ? 'ડેટાબેઝ ક્વેરી પ્રોસેસ થઈ રહી છે...' : 'Executing grounded query on production DB...'}
              </span>
            </div>
          )}

        </div>

        {/* Input & Voice Controls Footer */}
        <div className="p-4 border-t border-slate-100 bg-white shrink-0">
          
          {/* Active Listening Waveform Banner */}
          {isListening && (
            <div className="flex items-center justify-between px-3 py-1.5 mb-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 animate-pulse">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                <span className="font-bold">
                  {selectedLang === 'hi' ? 'सुन रहा हूँ... बोलिए (जैसे: "लॉट 1 का स्टेटस क्या है")' : selectedLang === 'gu' ? 'સાંભળી રહ્યો છું... બોલો...' : 'Listening... Speak your query now'}
                </span>
              </div>
              <button 
                onClick={toggleListening}
                className="text-[10px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded-md"
              >
                Stop
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            
            {/* Big Mic Button */}
            <button
              onClick={toggleListening}
              className={`p-3 rounded-xl flex items-center justify-center transition-all ${
                isListening 
                  ? 'bg-rose-500 text-white ring-4 ring-rose-200 shadow-lg scale-105' 
                  : 'bg-[#6B4EFF] hover:bg-[#583CE0] text-white shadow-md shadow-[#6B4EFF]/20'
              }`}
              title={isListening ? 'Stop Listening' : 'Speak (Voice Query)'}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            {/* Text Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={
                  selectedLang === 'hi' 
                    ? 'पूछिए या बोलिए (जैसे: लॉट 1 का स्टेटस, या मशीन फ्लोर)'
                    : selectedLang === 'gu'
                    ? 'બોલો અથવા લખો (જેમ કે: લોટ 1, મશીન સ્ટેટસ)'
                    : 'Ask anything in English, Hindi, or Gujarati...'
                }
                className="w-full text-xs font-medium px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B4EFF]/30 focus:border-[#6B4EFF] transition-all"
              />
            </div>

            {/* Send Button */}
            <button
              onClick={() => handleSend()}
              disabled={!query.trim() || loading}
              className="p-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl transition-colors shadow-xs"
            >
              <Send size={16} />
            </button>
          </div>

          <div className="flex items-center justify-between mt-2.5 text-[10px] text-slate-400 font-medium px-1">
            <span>Powered by VastraAI • Speaks Hindi, Gujarati & English</span>
            <span>Zero API Key Required</span>
          </div>

        </div>

      </div>
    </div>
  );
};
