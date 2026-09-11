import React, { useState, useEffect } from 'react';
import { Key, AlertTriangle, CheckCircle2, RefreshCw, X, ShieldAlert, Zap } from 'lucide-react';

import Header from './components/Header';
import ChatAssistant from './components/ChatAssistant';
import PDFHighlightViewer from './components/PDFHighlightViewer';
import Dashboard from './components/Dashboard';
import ReportBuilder from './components/ReportBuilder';
import Repository from './components/Repository';
import OnboardingTour from './components/OnboardingTour';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'dashboard', 'reports', 'documents'
  const [availableFiles, setAvailableFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('Coal_Ministry_Mine_Plan_Guidelines.pdf');
  const [activePage, setActivePage] = useState(1);
  const [activeBBox, setActiveBBox] = useState([54.0, 72.0, 558.0, 110.0]);
  const [activeSnippet, setActiveSnippet] = useState('Guidelines for preparation of Mine Plans for Coal and Lignite Blocks');
  const [activeCitation, setActiveCitation] = useState({
    source: 'Coal_Ministry_Mine_Plan_Guidelines.pdf',
    page_number: 1,
    bbox: [54.0, 72.0, 558.0, 110.0],
    exact_snippet: 'Guidelines for preparation of Mine Plans for Coal and Lignite Blocks'
  });
  const [activeCitations, setActiveCitations] = useState([]);
  const getStoredKey = () => {
    try {
      return localStorage.getItem('groq_api_key') || '';
    } catch (e) {
      return '';
    }
  };

  const [apiKey, setApiKey] = useState(getStoredKey());
  const [showKeyModal, setShowKeyModal] = useState(!getStoredKey());
  const [keyInput, setKeyInput] = useState(getStoredKey());
  const [validatingKey, setValidatingKey] = useState(false);
  const [keyValidationStatus, setKeyValidationStatus] = useState(null);

  const [isTourOpen, setIsTourOpen] = useState(false);

  const fetchDocuments = async () => {
    try {
      const resp = await fetch('/api/documents');
      if (resp.ok) {
        const data = await resp.json();
        setAvailableFiles(data.documents || []);
        if (data.documents && data.documents.length > 0 && !selectedFile) {
          setSelectedFile(data.documents[0].filename);
        }
      }
    } catch (e) {
      console.error("Failed to load documents:", e);
    }
  };

  useEffect(() => {
    fetchDocuments();

    if (!apiKey) {
      fetch('/api/config')
        .then((r) => (r.ok ? r.json() : null))
        .then((cfg) => {
          if (cfg && cfg.default_api_key) {
            setApiKey(cfg.default_api_key);
            setKeyInput(cfg.default_api_key);
            setShowKeyModal(false);
            try {
              localStorage.setItem('groq_api_key', cfg.default_api_key);
            } catch (e) {}
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleSelectCitation = (citation, allCitations = null) => {
    if (!citation) return;
    setActiveCitation(citation);
    if (allCitations && Array.isArray(allCitations)) {
      setActiveCitations(allCitations);
    } else if (citation) {
      setActiveCitations([citation]);
    }
    if (citation.source || citation.file_id) {
      setSelectedFile(citation.source || citation.file_id);
    }
    if (citation.page_number) {
      setActivePage(Number(citation.page_number));
    }
    if (citation.bbox) {
      setActiveBBox(citation.bbox);
    }
    if (citation.exact_snippet || citation.text) {
      setActiveSnippet(citation.exact_snippet || citation.text);
    }
  };

  const handleAuditDocument = (filename, page = 1) => {
    setSelectedFile(filename);
    setActivePage(Number(page) || 1);
    setActiveCitation(null);
    setActiveBBox(null);
    setActiveSnippet('');
    setActiveCitations([]);
    setActiveTab('chat');
  };

  const handleValidateAndSaveKey = async () => {
    const k = keyInput.trim();
    if (!k) {
      setKeyValidationStatus({ valid: false, message: "Please enter a valid Groq API key." });
      return;
    }

    setValidatingKey(true);
    setKeyValidationStatus(null);

    try {
      const resp = await fetch('/api/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: k })
      });

      if (resp.ok) {
        const data = await resp.json().catch(() => ({}));
        setApiKey(k);
        localStorage.setItem('groq_api_key', k);
        const modelLabel = data.model ? ` (${data.model} active)` : ' (Hardware Acceleration Active)';
        setKeyValidationStatus({ valid: true, message: `Groq API Key verified!${modelLabel}` });
        setTimeout(() => setShowKeyModal(false), 1200);
      } else {
        const err = await resp.json().catch(() => ({}));
        setKeyValidationStatus({ valid: false, message: err.detail || "Invalid Groq API key or network error." });
      }
    } catch (e) {
      // If network probe fails, allow saving key anyway
      setApiKey(k);
      localStorage.setItem('groq_api_key', k);
      setKeyValidationStatus({ valid: true, message: "Key saved to local session." });
      setTimeout(() => setShowKeyModal(false), 1000);
    } finally {
      setValidatingKey(false);
    }
  };

  const handleClearKey = () => {
    setApiKey('');
    setKeyInput('');
    localStorage.removeItem('groq_api_key');
    setKeyValidationStatus(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Refactored Clean Header Bar */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        documentCount={availableFiles.length}
        apiKey={apiKey}
        onOpenKeyModal={() => setShowKeyModal(true)}
        onStartTour={() => setIsTourOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        {/* TAB 1: RAG Q&A Split-Screen with PDF Highlight Viewer */}
        {activeTab === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] min-h-[620px]">
            {/* Left Panel: Minimal ChatGPT-style Assistant */}
            <div className="lg:col-span-5 h-full">
              <ChatAssistant
                onSelectCitation={handleSelectCitation}
                activeCitation={activeCitation}
                apiKey={apiKey}
                onOpenKeyModal={() => setShowKeyModal(true)}
                availableFiles={availableFiles}
                selectedFile={selectedFile}
                onFileChange={(f) => {
                  setSelectedFile(f);
                  setActivePage(1);
                  setActiveBBox(null);
                  setActiveSnippet('');
                }}
              />
            </div>

            {/* Right Panel: High-Precision PDF Viewer with Bounding-Box Overlay */}
            <div className="lg:col-span-7 h-full">
              <PDFHighlightViewer
                selectedFile={selectedFile}
                activeCitation={activeCitation}
                citations={activeCitations}
                availableFiles={availableFiles}
                onFileChange={(f) => {
                  setSelectedFile(f);
                  setActiveCitation(null);
                  setActiveCitations([]);
                  setActiveBBox(null);
                  setActiveSnippet('');
                }}
                onPageChange={(p) => {
                  setActivePage(p);
                }}
              />
            </div>
          </div>
        )}

        {/* TAB 2: Geological Analytics & Word Cloud */}
        {activeTab === 'dashboard' && (
          <Dashboard 
            onAuditDocument={(filename, page) => {
              setSelectedFile(filename);
              setActivePage(page || 1);
              setActiveBBox(null);
              setActiveSnippet('');
              setActiveTab('chat');
            }} 
          />
        )}

        {/* TAB 3: Multi-Format Report Studio */}
        {activeTab === 'reports' && (
          <ReportBuilder 
            apiKey={apiKey} 
            availableFiles={availableFiles} 
          />
        )}

        {/* TAB 4: Document Repository (100+) */}
        {activeTab === 'documents' && (
          <Repository
            availableFiles={availableFiles}
            onRefresh={fetchDocuments}
            onSelectForAudit={handleAuditDocument}
          />
        )}
      </main>

      {/* Interactive Onboarding Tour for Evaluators / Judges */}
      <OnboardingTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onNavigateTab={(t) => setActiveTab(t)}
      />

      {/* Mandatory Groq API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Key className="w-4 h-4" />
                </div>
                <span>Configure Groq API Key</span>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                title="Dismiss modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This platform uses high-throughput LLaMA models via the <strong className="text-amber-400">Groq SDK</strong> with hardware acceleration. A valid key is required to ensure authentic, unhallucinated responses.
            </p>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Groq API Key:
              </label>
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="gsk_..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            {keyValidationStatus && (
              <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                keyValidationStatus.valid
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-red-950/40 border-red-500/40 text-red-300'
              }`}>
                {keyValidationStatus.valid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span>{keyValidationStatus.message}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              {apiKey ? (
                <button
                  onClick={handleClearKey}
                  className="text-xs text-slate-400 hover:text-red-400 transition-colors"
                >
                  Clear Stored Key
                </button>
              ) : (
                <button
                  onClick={() => setShowKeyModal(false)}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Explore Portal (Read-Only)
                </button>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={handleValidateAndSaveKey}
                  disabled={validatingKey || !keyInput.trim()}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow transition-all disabled:opacity-40"
                >
                  {validatingKey ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Validating...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>Save & Activate</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
