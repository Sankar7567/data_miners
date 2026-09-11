import React, { useState, useRef, useEffect } from "react";
import { 
  Send, Bot, User, Sparkles, FileText, ChevronRight, 
  MapPin, Clock, Zap, AlertCircle, HelpCircle, Filter, Key, ArrowUp,
  FileCheck, Download, History, X, Shield, FileCode, CheckCircle2,
  Building2, Layers, Compass, Database, FileSpreadsheet
} from "lucide-react";

export default function ChatAssistant({ 
  onSelectCitation, 
  activeCitation,
  apiKey,
  onOpenKeyModal,
  availableFiles = [],
  selectedFile,
  onFileChange
}) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [reportsHistory, setReportsHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I am **GeoIntel Core**, developed by **Team Data Miners** for CMPDI & Coal India Limited.\n\nI have direct access to **100+ official coal reports, drilling archives, and Detailed Project Reports (DPRs)** indexed in our spatial vector repository.\n\nYou can ask questions about coal production, CMPDI drilling meterage, seam stratigraphy, or stripping ratios with verified spatial citations.",
      citations: [
        {
          source: "Coal_Ministry_Mine_Plan_Guidelines.pdf",
          file_id: "Coal_Ministry_Mine_Plan_Guidelines.pdf",
          page_number: 1,
          bbox: [54.0, 72.0, 558.0, 110.0],
          exact_snippet: "Guidelines for preparation of Mine Plans for Coal and Lignite Blocks across Coal India subsidiaries",
          score: 0.99
        }
      ],
      model: "Groq LLaMA Inference",
      latency_ms: 180
    }
  ]);

  const reportTemplates = [
    {
      id: "comprehensive_audit",
      label: "Executive Performance",
      icon: Building2,
      prompt: "Summarize national coal production, subsidiary growth rates, and FMC logistics for FY 2023-24"
    },
    {
      id: "production_obr",
      label: "OBR & Stripping",
      icon: Layers,
      prompt: "Analyze Overburden Removal (OBR) dynamics, stripping ratios, and HEMM utilization across opencast mines"
    },
    {
      id: "geological_exploration",
      label: "Stratigraphy & Drilling",
      icon: Compass,
      prompt: "Detail CMPDI exploratory drilling meterage, Barakar formation stratigraphy, and 2D/3D seismic survey results"
    },
    {
      id: "cbm_clean_coal",
      label: "CBM & Clean Coal",
      icon: Database,
      prompt: "Provide assessment of Coal Bed Methane reserves in Jharia and Bokaro deep seams and washery beneficiation"
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, generatingReport]);

  const fetchReportsHistory = async () => {
    setLoadingHistory(true);
    try {
      const resp = await fetch("/api/reports-history");
      if (resp.ok) {
        const data = await resp.json();
        setReportsHistory(data.reports || []);
      }
    } catch (e) {
      console.error("Failed to load reports history:", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchReportsHistory();
  }, []);

  const handleSend = async (textToSend) => {
    const q = textToSend || query;
    if (!q.trim() || loading || generatingReport) return;

    if (!apiKey) {
      if (onOpenKeyModal) onOpenKeyModal();
      return;
    }

    const userMessage = { role: "user", content: q };
    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setLoading(true);

    try {
      const resp = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: q, 
          n_results: 4,
          api_key: apiKey,
          source_filter: selectedFile !== "all" ? selectedFile : undefined
        }),
      });

      if (!resp.ok) {
        if (resp.status === 401) {
          if (onOpenKeyModal) onOpenKeyModal();
          throw new Error("Groq API Key Required. Please configure your key to proceed.");
        }
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.detail || `API error: ${resp.status}`);
      }

      const data = await resp.json();
      const assistantMessage = {
        role: "assistant",
        content: data.answer,
        citations: data.citations || [],
        model: data.model || "Groq Dynamic LLaMA",
        latency_ms: data.latency_ms
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (data.citations && data.citations.length > 0) {
        onSelectCitation(data.citations[0], data.citations);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ ${err.message}`,
          citations: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReportDirect = async (promptText, presetType = "comprehensive_audit") => {
    const q = promptText || query || "Comprehensive operational audit and production review";
    if (!apiKey) {
      if (onOpenKeyModal) onOpenKeyModal();
      return;
    }

    const userMessage = { role: "user", content: `📑 Generate Official Technical Report: "${q}"` };
    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setGeneratingReport(true);

    try {
      const rawSelected = typeof selectedFile === 'object' && selectedFile !== null ? (selectedFile.filename || '') : (selectedFile || '');
      const targetSub = rawSelected && rawSelected !== "all" 
        ? String(rawSelected).replace(".pdf", "").replace(/_/g, " ")
        : "All CIL Aggregate";

      const resp = await fetch("/api/generate-structured-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report_type: presetType,
          subsidiary: targetSub,
          timeframe: "FY 2023-24",
          tone: "Formal Executive Brief",
          custom_prompt: q,
          api_key: apiKey
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.detail || `Report synthesis failed: ${resp.status}`);
      }

      const data = await resp.json();
      const reportMessage = {
        role: "assistant",
        isReport: true,
        base_name: data.base_name,
        content: data.preview_text,
        files: data.files,
        model: data.model || "Groq Dynamic LLaMA"
      };

      setMessages((prev) => [...prev, reportMessage]);
      fetchReportsHistory();
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ Failed to generate report: ${err.message}`,
          citations: []
        }
      ]);
    } finally {
      setGeneratingReport(false);
    }
  };

  // Enhanced Markdown parser with real table rendering
  const renderContent = (content) => {
    if (!content) return null;
    const strContent = typeof content === "string" ? content : String(content);
    const lines = strContent.split("\n");
    const elements = [];
    let inTable = false;
    let tableRows = [];

    const flushTable = (key) => {
      if (tableRows.length === 0) return null;
      const headerRow = tableRows[0];
      const bodyRows = tableRows.slice(1);
      const tableEl = (
        <div key={`tbl-${key}`} className="my-3 overflow-x-auto rounded-xl border border-slate-700 bg-slate-950/80">
          <table className="w-full text-[11px] text-left">
            <thead className="bg-slate-800 text-slate-200 border-b border-slate-700">
              <tr>
                {headerRow.map((col, cIdx) => (
                  <th key={cIdx} className="px-3 py-2 font-bold whitespace-nowrap">
                    {col.replace(/\*\*/g, "")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {bodyRows.map((row, rIdx) => (
                <tr key={rIdx} className={rIdx % 2 === 0 ? "bg-slate-900/40" : "bg-transparent"}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3 py-1.5 text-slate-300 font-medium">
                      {cell.replace(/\*\*/g, "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      return tableEl;
    };

    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];
      const lineTrim = line.trim();

      // Table line check
      if (lineTrim.startsWith("|") && lineTrim.endsWith("|")) {
        if (lineTrim.includes("---")) {
          continue; // Separator line
        }
        const cells = lineTrim.split("|").slice(1, -1).map(c => c.trim());
        tableRows.push(cells);
        inTable = true;
        continue;
      } else if (inTable) {
        const tbl = flushTable(idx);
        if (tbl) elements.push(tbl);
        inTable = false;
      }

      if (line.startsWith("### ")) {
        elements.push(<h3 key={idx} className="text-xs font-bold text-blue-300 mt-2.5 mb-1">{line.replace("### ", "")}</h3>);
      } else if (line.startsWith("## ")) {
        elements.push(<h2 key={idx} className="text-sm font-bold text-white mt-3 mb-1 border-b border-slate-800 pb-1">{line.replace("## ", "")}</h2>);
      } else if (line.startsWith("# ")) {
        elements.push(<h1 key={idx} className="text-base font-extrabold text-white mt-3 mb-2">{line.replace("# ", "")}</h1>);
      } else if (line.startsWith("- ") || line.startsWith("* ")) {
        elements.push(
          <li key={idx} className="ml-4 list-disc text-slate-200 text-xs my-0.5 leading-relaxed">
            {renderInlineMarkdown(line.substring(2))}
          </li>
        );
      } else if (/^\d+\.\s/.test(lineTrim)) {
        elements.push(
          <li key={idx} className="ml-4 list-decimal text-slate-200 text-xs my-0.5 leading-relaxed">
            {renderInlineMarkdown(lineTrim.replace(/^\d+\.\s/, ""))}
          </li>
        );
      } else if (lineTrim.startsWith("> ")) {
        elements.push(
          <blockquote key={idx} className="border-l-2 border-blue-500/60 pl-3 py-1 my-1 italic text-slate-300 text-xs bg-slate-950/40 rounded-r">
            {renderInlineMarkdown(lineTrim.replace("> ", ""))}
          </blockquote>
        );
      } else if (!lineTrim) {
        elements.push(<div key={idx} className="h-1" />);
      } else {
        elements.push(<p key={idx} className="text-xs text-slate-200 my-1 leading-relaxed">{renderInlineMarkdown(line)}</p>);
      }
    }

    if (inTable) {
      const tbl = flushTable(lines.length);
      if (tbl) elements.push(tbl);
    }

    return elements;
  };

  const renderInlineMarkdown = (text = "") => {
    if (!text) return "";
    const strText = typeof text === "string" ? text : String(text);
    const parts = strText.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return <code key={i} className="font-mono text-[11px] bg-slate-800 text-amber-300 px-1 py-0.5 rounded">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Top Bar: Minimal ChatGPT style + Document Scope + Report History Button */}
      <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Bot className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-white tracking-wide">
            CMPDI Mining Assistant
          </span>
        </div>

        {/* Document Scope Selector & History Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={typeof selectedFile === 'object' && selectedFile !== null ? (selectedFile.filename || "all") : (selectedFile || "all")}
              onChange={(e) => onFileChange && onFileChange(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer max-w-[180px] truncate"
            >
              <option value="all">Search All 100+ Documents</option>
              {availableFiles.map((f, i) => {
                const fname = typeof f === 'string' ? f : (f?.filename || '');
                if (!fname) return null;
                return (
                  <option key={fname || i} value={fname}>
                    {fname.replace(".pdf", "").replace(/_/g, " ")}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Report History Trigger */}
          <button
            onClick={() => {
              setShowHistory(true);
              fetchReportsHistory();
            }}
            className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-xl border border-slate-700 transition-colors shadow-sm"
            title="View Previously Generated Official Reports"
          >
            <History className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Report History</span>
            <span className="text-[10px] bg-slate-700 px-1.5 py-0.2 rounded-full font-bold text-slate-300">
              {reportsHistory.length}
            </span>
          </button>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans bg-slate-950/40">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex gap-3 max-w-3xl ${m.role === "user" ? "ml-auto justify-end" : "mr-auto justify-start"}`}
          >
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0 mt-1">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`p-4 rounded-2xl text-xs leading-relaxed max-w-2xl ${
                m.role === "user"
                  ? "bg-blue-600 text-white font-medium rounded-tr-none shadow-md"
                  : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-lg"
              }`}
            >
              {/* If message is a structured report */}
              {m.isReport && (
                <div className="mb-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Official Report Prepared
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {m.base_name}
                    </span>
                  </div>

                  {/* 3 Explicit Format Download Buttons */}
                  {m.files && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {m.files.docx && (
                        <a
                          href={typeof m.files.docx === "string" ? m.files.docx : m.files.docx?.url}
                          download
                          className="flex items-center gap-1 px-2.5 py-1 bg-blue-600/25 hover:bg-blue-600/40 border border-blue-500/40 text-blue-200 rounded-lg text-[11px] font-medium transition-colors"
                        >
                          <FileText className="w-3 h-3 text-blue-400" />
                          <span>Word (.docx)</span>
                          <Download className="w-2.5 h-2.5 text-blue-300 ml-0.5" />
                        </a>
                      )}
                      {m.files.pdf && (
                        <a
                          href={typeof m.files.pdf === "string" ? m.files.pdf : m.files.pdf?.url}
                          download
                          className="flex items-center gap-1 px-2.5 py-1 bg-red-600/25 hover:bg-red-600/40 border border-red-500/40 text-red-200 rounded-lg text-[11px] font-medium transition-colors"
                        >
                          <Shield className="w-3 h-3 text-red-400" />
                          <span>PDF (.pdf)</span>
                          <Download className="w-2.5 h-2.5 text-red-300 ml-0.5" />
                        </a>
                      )}
                      {m.files.markdown && (
                        <a
                          href={typeof m.files.markdown === "string" ? m.files.markdown : m.files.markdown?.url}
                          download
                          className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-200 rounded-lg text-[11px] font-medium transition-colors"
                        >
                          <FileCode className="w-3 h-3 text-emerald-400" />
                          <span>Markdown (.md)</span>
                          <Download className="w-2.5 h-2.5 text-emerald-300 ml-0.5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Message text rendering */}
              <div className="space-y-1">
                {renderContent(m.content)}
              </div>

              {/* Citations block */}
              {m.citations && m.citations.length > 0 && (
                <div className="mt-3.5 pt-3 border-t border-slate-800 space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    <span>Verified Official Citations (Click to Audit PDF):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {m.citations.map((c, i) => {
                      const docName = String(c?.source || c?.file_id || "Document.pdf").replace(".pdf", "");
                      const pageNo = c?.page_number || 1;
                      return (
                        <button
                          key={i}
                          onClick={() => onSelectCitation && onSelectCitation(c, m.citations)}
                          className={`text-[10.5px] px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                            activeCitation?.bbox && activeCitation.source === c?.source && activeCitation.page_number === c?.page_number
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm"
                              : "bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border-slate-700"
                          }`}
                          title={c?.exact_snippet || c?.text || docName}
                        >
                          <FileText className="w-3 h-3 text-blue-400 shrink-0" />
                          <span className="font-semibold">{docName}</span>
                          <span className="text-amber-400 font-mono">P.{pageNo}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Model & Latency */}
              {m.role === "assistant" && m.model && (
                <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-800 pt-1.5">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" /> {m.model}
                  </span>
                  {m.latency_ms && (
                    <span className="flex items-center gap-1 text-slate-400 font-mono">
                      <Clock className="w-3 h-3" /> {m.latency_ms} ms
                    </span>
                  )}
                </div>
              )}
            </div>

            {m.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-200 shrink-0 mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 items-center text-slate-400 text-xs p-2">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span>Retrieving official documents & preparing answer...</span>
          </div>
        )}

        {generatingReport && (
          <div className="flex gap-3 items-center text-slate-300 text-xs p-3 bg-blue-950/30 border border-blue-500/30 rounded-xl">
            <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <span>Synthesizing official technical report across 100+ documents and building Word/PDF files...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Built-in Report Templates Bar (Directly Above Prompt Input) */}
      <div className="px-4 py-2 bg-slate-950/70 border-t border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <FileCheck className="w-3 h-3 text-blue-400" /> Report Templates:
        </span>
        {reportTemplates.map((tpl) => {
          const TIcon = tpl.icon;
          return (
            <button
              key={tpl.id}
              onClick={() => {
                setQuery(tpl.prompt);
                handleGenerateReportDirect(tpl.prompt, tpl.id);
              }}
              disabled={loading || generatingReport}
              className="text-[11px] bg-slate-800/90 hover:bg-blue-600/30 hover:border-blue-500/40 text-slate-200 px-2.5 py-1 rounded-lg whitespace-nowrap border border-slate-700 transition-all flex items-center gap-1.5 shrink-0"
              title={`Click to instantly generate ${tpl.label} report`}
            >
              <TIcon className="w-3 h-3 text-blue-400" />
              <span>{tpl.label}</span>
            </button>
          );
        })}
      </div>

      {/* Floating Prompt Bar (With Direct "Generate Report" Button) */}
      <div className="p-3 bg-slate-950 border-t border-slate-800">
        {!apiKey ? (
          <div className="flex items-center justify-between p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              <span>Groq API Key Required for AI inference and report generation.</span>
            </div>
            <button
              onClick={onOpenKeyModal}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1 rounded-lg text-xs transition-colors"
            >
              Set Key
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-full px-3 py-1.5 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 shadow-inner"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question, or type a report topic to generate..."
              className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none py-1 pl-2"
              disabled={loading || generatingReport}
            />

            {/* Direct Generate Report Button */}
            <button
              type="button"
              onClick={() => handleGenerateReportDirect(query)}
              disabled={loading || generatingReport}
              className="px-3 py-1.5 rounded-full bg-slate-800 hover:bg-blue-600/30 text-blue-300 hover:text-white border border-blue-500/30 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm shrink-0"
              title="Generate a full official report (.docx, .pdf, .md) based on this prompt"
            >
              <FileCheck className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Generate Report</span>
            </button>

            {/* Standard Send Button */}
            <button
              type="submit"
              disabled={loading || generatingReport || !query.trim()}
              className="w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center disabled:opacity-40 transition-colors shadow shrink-0"
              title="Send Inquiry"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>

      {/* Report History Modal / Overlay */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Generated Reports History ({reportsHistory.length})
                </h2>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {loadingHistory ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Loading report archives...
                </div>
              ) : reportsHistory.length === 0 ? (
                <div className="text-center py-12 text-slate-500 space-y-2">
                  <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-700 stroke-1" />
                  <p className="text-xs font-semibold text-slate-300">No Generated Reports Yet</p>
                  <p className="text-[11px]">Type a prompt and click "Generate Report" in the chat to synthesize official reports.</p>
                </div>
              ) : (
                reportsHistory.map((rep, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-200">
                        {rep.title}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Generated on {rep.date} • {rep.size_kb} KB
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {rep.files?.docx && (
                        <a
                          href={rep.files.docx}
                          download
                          className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 rounded text-[10.5px] font-medium flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3 text-blue-400" />
                          <span>DOCX</span>
                        </a>
                      )}
                      {rep.files?.pdf && (
                        <a
                          href={rep.files.pdf}
                          download
                          className="px-2 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 rounded text-[10.5px] font-medium flex items-center gap-1"
                        >
                          <Shield className="w-3 h-3 text-red-400" />
                          <span>PDF</span>
                        </a>
                      )}
                      {rep.files?.markdown && (
                        <a
                          href={rep.files.markdown}
                          download
                          className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 rounded text-[10.5px] font-medium flex items-center gap-1"
                        >
                          <FileCode className="w-3 h-3 text-emerald-400" />
                          <span>MD</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowHistory(false)}
                className="text-xs text-slate-300 hover:text-white bg-slate-800 px-3.5 py-1.5 rounded-xl"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
