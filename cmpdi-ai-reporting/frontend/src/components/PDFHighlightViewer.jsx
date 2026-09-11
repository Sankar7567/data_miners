import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  FileText, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, 
  ChevronRight, Download, Eye, Layers, ShieldCheck, MapPin
} from 'lucide-react';

export default function PDFHighlightViewer({
  selectedFile,
  activeCitation = null,
  citations = [],
  onFileChange,
  onPageChange,
  availableFiles = []
}) {
  const [currentPage, setCurrentPage] = useState(activeCitation?.page_number ? Number(activeCitation.page_number) : 1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [pageSize, setPageSize] = useState({ width: 612, height: 792 });
  const [viewMode, setViewMode] = useState('overlay'); // 'overlay' or 'native'
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const containerRef = useRef(null);

  const rawSelected = typeof selectedFile === 'object' && selectedFile !== null ? selectedFile.filename : selectedFile;
  const firstAvailable = availableFiles.length > 0 ? (typeof availableFiles[0] === 'object' ? availableFiles[0].filename : availableFiles[0]) : '';
  const activeDoc = rawSelected || firstAvailable || 'Coal_Ministry_Mine_Plan_Guidelines.pdf';

  // Fetch document metadata to get accurate total pages and default dimensions
  useEffect(() => {
    let isMounted = true;
    if (!activeDoc) return;
    fetch(`/api/pdf-info?file=${encodeURIComponent(activeDoc)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((info) => {
        if (isMounted && info) {
          if (info.total_pages) setTotalPages(info.total_pages);
          if (info.width && info.height) {
            setPageSize({ width: info.width, height: info.height });
          }
        }
      })
      .catch((e) => console.warn("Failed to fetch pdf info:", e));
    return () => { isMounted = false; };
  }, [activeDoc]);

  // Synchronize incoming active citation jumps
  useEffect(() => {
    if (activeCitation && activeCitation.page_number) {
      const p = Number(activeCitation.page_number);
      if (p !== currentPage) {
        setCurrentPage(p);
      }
    }
  }, [activeCitation]);

  // Reset loading state on file or page change
  useEffect(() => {
    setImageLoading(true);
    setImageError(false);
  }, [activeDoc, currentPage]);

  const changePage = (newPage) => {
    const clamped = Math.max(1, Math.min(totalPages || 1, newPage));
    setCurrentPage(clamped);
    if (onPageChange) onPageChange(clamped);
  };

  // Dynamically resolve citation specifically for the currently viewed page
  const activeCitationForPage = useMemo(() => {
    // 1. If activeCitation matches current document and current page, use it
    if (activeCitation && Number(activeCitation.page_number) === Number(currentPage)) {
      const cDoc = (activeCitation.source || activeCitation.file_id || '').toLowerCase();
      const curDoc = (activeDoc || '').toLowerCase();
      const docMatches = cDoc === curDoc || cDoc.endsWith(curDoc) || curDoc.endsWith(cDoc);
      if (docMatches) {
        return activeCitation;
      }
    }

    // 2. Otherwise check if any citation in the citations array matches this document and this page
    if (citations && citations.length > 0) {
      const match = citations.find((c) => {
        const cDoc = (c?.source || c?.file_id || '').toLowerCase();
        const curDoc = (activeDoc || '').toLowerCase();
        const docMatches = cDoc === curDoc || cDoc.endsWith(curDoc) || curDoc.endsWith(cDoc);
        return docMatches && Number(c?.page_number) === Number(currentPage);
      });
      if (match) return match;
    }

    // 3. Current page has no citation! Clean state.
    return null;
  }, [activeCitation, citations, activeDoc, currentPage]);

  const currentBBox = activeCitationForPage?.bbox || null;
  const currentSnippet = activeCitationForPage?.exact_snippet || activeCitationForPage?.text || null;

  // Compute percentage styles for bounding box highlight
  const getHighlightStyle = () => {
    if (!currentBBox || !Array.isArray(currentBBox) || currentBBox.length < 4) return null;
    const [x0, y0, x1, y1] = currentBBox;
    const w = pageSize.width || 612;
    const h = pageSize.height || 792;

    const leftPct = Math.max(0, Math.min(100, (x0 / w) * 100));
    const topPct = Math.max(0, Math.min(100, (y0 / h) * 100));
    const widthPct = Math.max(2, Math.min(100 - leftPct, ((x1 - x0) / w) * 100));
    const heightPct = Math.max(1.5, Math.min(100 - topPct, ((y1 - y0) / h) * 100));

    return {
      left: `${leftPct}%`,
      top: `${topPct}%`,
      width: `${widthPct}%`,
      height: `${heightPct}%`,
    };
  };

  const highlightStyle = getHighlightStyle();

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Top Controls Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2 max-w-[45%]">
          <FileText className="w-4 h-4 text-blue-400 shrink-0" />
          <select
            value={activeDoc}
            onChange={(e) => {
              if (onFileChange) onFileChange(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-800 text-slate-200 border border-slate-700 rounded px-2 py-1 truncate focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {availableFiles.map((doc, idx) => {
              const fname = typeof doc === 'string' ? doc : (doc?.filename || `Document_${idx}`);
              return (
                <option key={fname || idx} value={fname}>
                  {fname}
                </option>
              );
            })}
          </select>
        </div>

        {/* Page & Zoom Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => changePage(currentPage - 1)}
            className="p-1 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={currentPage <= 1}
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-slate-300 font-mono px-1">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => changePage(currentPage + 1)}
            className="p-1 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={currentPage >= totalPages}
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="h-4 w-[1px] bg-slate-700 mx-1" />

          <button
            onClick={() => setZoom((z) => Math.max(50, z - 15))}
            className="p-1 rounded hover:bg-slate-800 text-slate-300"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-slate-400 font-mono text-[11px] w-8 text-center">{zoom}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(180, z + 15))}
            className="p-1 rounded hover:bg-slate-800 text-slate-300"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(100)}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-[1px] bg-slate-700 mx-1" />

          {/* Toggle view mode */}
          <button
            onClick={() => setViewMode(viewMode === 'overlay' ? 'native' : 'overlay')}
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
              viewMode === 'overlay'
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Switch Between Spatial Overlay & Native Viewer"
          >
            {viewMode === 'overlay' ? <Layers className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{viewMode === 'overlay' ? 'Spatial View' : 'PDF View'}</span>
          </button>

          <a
            href={`/api/pdf-raw/${activeDoc}`}
            download
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 ml-1"
            title="Download PDF"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Spatial Audit Banner: only active if current page has a citation */}
      {currentBBox ? (
        <div className="flex items-center justify-between px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-200 transition-all">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-medium truncate max-w-sm">
              Source Audit Bounding Box Active &bull; Page {currentPage} of {totalPages}
            </span>
          </div>
          <span className="font-mono text-[10px] text-amber-300/80 bg-amber-900/40 px-2 py-0.5 rounded">
            [{currentBBox.join(', ')}]
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-between px-3 py-1 bg-slate-950/60 border-b border-slate-800/80 text-[11px] text-slate-400">
          <span className="truncate">Viewing {activeDoc} &bull; Page {currentPage} of {totalPages}</span>
          <span className="text-slate-500 text-[10px]">No spatial citation on this page</span>
        </div>
      )}

      {/* PDF Content Canvas Container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto p-4 flex items-start justify-center bg-slate-950/90 relative"
      >
        {viewMode === 'overlay' ? (
          <div 
            className="relative shadow-2xl transition-transform duration-150 origin-top bg-white rounded"
            style={{ width: `${zoom}%`, maxWidth: '900px' }}
          >
            {imageLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 text-slate-300 text-xs gap-2 z-20 py-20">
                <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <span>Rasterizing PDF page spatial vectors...</span>
              </div>
            )}

            <img
              src={`/api/pdf-page?file=${encodeURIComponent(activeDoc)}&page=${currentPage}`}
              alt={`Page ${currentPage} of ${activeDoc}`}
              className="w-full h-auto block select-none"
              onLoad={(e) => {
                setImageLoading(false);
              }}
              onError={() => {
                setImageLoading(false);
                setImageError(true);
              }}
            />

            {/* Spatial Highlight Overlay Box (Dynamically rendered only if this page is cited) */}
            {highlightStyle && !imageLoading && !imageError && (
              <div
                style={highlightStyle}
                className="absolute z-10 bg-amber-400/35 border-2 border-amber-500 rounded-sm pointer-events-none transition-all duration-300 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.5)]"
              >
                <div className="absolute -top-6 left-0 bg-amber-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5" /> Cited Source Snippet (Page {currentPage})
                </div>
              </div>
            )}

            {imageError && (
              <div className="p-8 text-center text-slate-400 text-xs">
                Could not render page image. You can switch to Native PDF View above.
              </div>
            )}
          </div>
        ) : (
          <iframe
            src={`/api/pdf-raw/${activeDoc}#page=${currentPage}`}
            className="w-full h-full rounded border-0 bg-white"
            title="Native PDF View"
          />
        )}
      </div>

      {/* Footer Snippet Info Card (Dynamically displayed only when page has a citation) */}
      {currentSnippet && (
        <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 text-xs transition-all">
          <div className="text-slate-400 text-[11px] mb-1 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Grounded Text Ground-Truth (Page {currentPage}):
          </div>
          <p className="text-slate-300 italic line-clamp-2 bg-slate-900/80 p-1.5 rounded border border-slate-800/80 text-[11px]">
            "{currentSnippet}"
          </p>
        </div>
      )}
    </div>
  );
}
