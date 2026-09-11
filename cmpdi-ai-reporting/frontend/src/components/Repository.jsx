import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderArchive, Upload, RefreshCw, FileText, Download, 
  CheckCircle2, Terminal, AlertCircle, Eye, Layers, ShieldCheck,
  HardDrive, FileSpreadsheet, Plus, X, ArrowUpRight
} from 'lucide-react';

export default function Repository({ 
  availableFiles = [], 
  onRefresh, 
  onSelectForAudit 
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Scraper Modal & Logs
  const [showScrapeModal, setShowScrapeModal] = useState(false);
  const [scrapeLogs, setScrapeLogs] = useState([]);
  const [isScrapingActive, setIsScrapingActive] = useState(false);
  const logsEndRef = useRef(null);

  // Fetch scrape logs periodically if modal open
  useEffect(() => {
    let interval = null;
    if (showScrapeModal) {
      const fetchLogs = async () => {
        try {
          const resp = await fetch('/api/scrape-logs');
          if (resp.ok) {
            const data = await resp.json();
            setScrapeLogs(data.logs || []);
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchLogs();
      interval = setInterval(fetchLogs, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showScrapeModal]);

  // Autoscroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [scrapeLogs]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFile(e.dataTransfer.files[0]);
    }
  };

  const uploadFile = async (file) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError("Only standard .pdf geological/mining documents are accepted.");
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const resp = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!resp.ok) {
        throw new Error(`Upload failed with status ${resp.status}`);
      }

      const res = await resp.json();
      setUploadSuccess(`Successfully ingested "${res.filename}" (${res.pages} pages, ${res.chunks_indexed} spatial vectors indexed) • Library updated to ${res.total_documents} documents (${res.total_vectors} vectors)`);
      if (onRefresh) await onRefresh();
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const triggerLiveScraper = async () => {
    setShowScrapeModal(true);
    setIsScrapingActive(true);
    try {
      await fetch('/api/trigger-scrape', { method: 'POST' });
    } catch (e) {
      console.error("Trigger scrape failed:", e);
    } finally {
      setTimeout(() => setIsScrapingActive(false), 8000);
    }
  };

  const totalPages = availableFiles.reduce((acc, f) => acc + (typeof f === 'object' && f !== null ? (f.pages || 0) : 0), 0);
  const totalChunks = availableFiles.reduce((acc, f) => acc + (typeof f === 'object' && f !== null ? (f.chunks || 0) : 0), 0);
  const totalSizeKB = availableFiles.reduce((acc, f) => acc + (typeof f === 'object' && f !== null ? (f.size_kb || 0) : 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner with Stats & Action Buttons */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-2 border border-blue-500/30">
              <HardDrive className="w-3.5 h-3.5" /> Ministry & CMPDI Ingestion Harness
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Official Document Repository & Ingestion Hub
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Houses full-length public annual reports, mine plan guidelines, and geological volumes. All documents are parsed into high-dimensional ChromaDB vectors with PyMuPDF spatial coordinates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={triggerLiveScraper}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 text-xs transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Trigger Web Scraper</span>
            </button>
          </div>
        </div>

        {/* Repository Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Documents</div>
            <div className="text-xl font-extrabold text-white mt-0.5">{availableFiles.length}</div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Scanned Pages</div>
            <div className="text-xl font-extrabold text-blue-400 mt-0.5">{totalPages}</div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400">Indexed ChromaDB Vectors</div>
            <div className="text-xl font-extrabold text-emerald-400 mt-0.5">{totalChunks}</div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400">Repository Volume</div>
            <div className="text-xl font-extrabold text-amber-400 mt-0.5">{(totalSizeKB / 1024).toFixed(2)} MB</div>
          </div>
        </div>
      </div>

      {/* Drag and Drop Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
          dragActive
            ? 'border-blue-500 bg-blue-600/10 scale-[1.01]'
            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
        }`}
      >
        <input
          type="file"
          id="pdfUploadInput"
          accept=".pdf"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              uploadFile(e.target.files[0]);
              e.target.value = '';
            }
          }}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            {uploading ? (
              <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
            ) : (
              <Upload className="w-6 h-6" />
            )}
          </div>

          <div>
            <h3 className="text-sm font-bold text-white">
              {uploading ? 'Parsing PDF & Building Spatial Vectors...' : 'Drag & Drop Manual PDF Documents Here'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Supports CIL annual reports, mine plans, EIA studies, and DGMS circulars.
            </p>
          </div>

          <label
            htmlFor="pdfUploadInput"
            className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-700 transition-colors shadow-sm"
          >
            Browse Files from Computer
          </label>
        </div>
      </div>

      {uploadSuccess && (
        <div className="flex items-center gap-2 p-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {uploadError && (
        <div className="flex items-center gap-2 p-3 bg-red-950/40 border border-red-500/40 text-red-300 rounded-xl text-xs">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Grid of All Scraped & Uploaded Documents */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-400" /> Ingested PDF Library ({availableFiles.length})
          </span>
          <span>Click "Audit in PDF Viewer" to inspect spatial text coordinates</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableFiles.map((doc, idx) => {
            const fname = typeof doc === 'string' ? doc : (doc?.filename || `Document_${idx}`);
            const pages = typeof doc === 'object' && doc !== null ? (doc?.pages || 1) : 1;
            const size_kb = typeof doc === 'object' && doc !== null ? (doc?.size_kb || 0) : 0;
            const chunks = typeof doc === 'object' && doc !== null ? (doc?.chunks || 0) : 0;
            const upload_date = typeof doc === 'object' && doc !== null ? (doc?.upload_date || 'Ready') : 'Ready';
            const url = typeof doc === 'object' && doc !== null ? (doc?.url || `/api/pdf-raw/${fname}`) : `/api/pdf-raw/${fname}`;
            return (
              <div
                key={fname || idx}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] bg-emerald-500/15 text-emerald-300 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Indexed
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-white line-clamp-2" title={fname}>
                      {fname}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                      <span className="text-blue-300 font-semibold">{pages} Pages</span>
                      <span>&bull;</span>
                      <span>{size_kb > 1024 ? `${(size_kb/1024).toFixed(1)} MB` : `${size_kb} KB`}</span>
                      <span>&bull;</span>
                      <span className="text-emerald-400 font-medium">{chunks} vectors</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500">
                    Last Updated: {upload_date}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => onSelectForAudit && onSelectForAudit(fname)}
                    className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs py-1.5 rounded-lg font-medium transition-colors text-center flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Audit in Viewer</span>
                  </button>
                  <a
                    href={url}
                    download
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                    title="Download Raw PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Web Scraper Progress & Terminal Modal */}
      {showScrapeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Automated Coal Portal Scraper & Spatial Ingestion Terminal</span>
              </div>
              <button
                onClick={() => setShowScrapeModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isScrapingActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                <span>{isScrapingActive ? 'Scraping & Vector Ingestion in progress...' : 'Harness Idle / Ready'}</span>
              </div>
              <span className="text-[11px] text-slate-500">Auto-refreshing live logs</span>
            </div>

            {/* Terminal Window */}
            <div className="bg-slate-950 rounded-xl p-4 font-mono text-[11px] text-slate-300 h-80 overflow-y-auto space-y-1.5 border border-slate-800">
              {scrapeLogs.length === 0 ? (
                <div className="text-slate-500 italic">Connecting to scraper harness log stream...</div>
              ) : (
                scrapeLogs.map((log, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-slate-500 select-none">[{log.time}]</span>
                    <span className={
                      log.level === 'SUCCESS' ? 'text-emerald-400 font-semibold' :
                      log.level === 'WARNING' ? 'text-amber-400' :
                      'text-slate-300'
                    }>
                      {log.message}
                    </span>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setShowScrapeModal(false);
                  if (onRefresh) onRefresh();
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-semibold"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
