import React, { useState } from "react";
import { 
  FileCheck, Download, Sparkles, FileText, CheckCircle2, 
  Layers, ArrowRight, RefreshCw, FileCode, Shield, Sliders,
  Calendar, Building2, Eye, Code, FileSpreadsheet,
  Activity, Database, Pickaxe, Zap, Compass
} from "lucide-react";

function renderMarkdownBlocks(markdownText) {
  if (!markdownText) return null;
  const lines = markdownText.split("\n");
  const blocks = [];
  let tableBuffer = [];

  const flushTable = (key) => {
    if (tableBuffer.length === 0) return;
    const headerRow = tableBuffer[0];
    const dataRows = tableBuffer.slice(1).filter(row => !row.every(cell => cell.match(/^:?-+:?$/)));
    blocks.push(
      <div key={`tbl-${key}`} className="overflow-x-auto my-3 rounded-xl border border-slate-800 shadow-md">
        <table className="w-full text-left text-xs border-collapse bg-slate-900/90">
          <thead>
            <tr className="bg-slate-950 border-b border-slate-800">
              {headerRow.map((h, i) => (
                <th key={i} className="px-3.5 py-2 font-semibold text-blue-300 text-[11px] uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {dataRows.map((r, rIdx) => (
              <tr key={rIdx} className="hover:bg-slate-800/40 transition-colors odd:bg-slate-900/40 even:bg-slate-950/20">
                {r.map((c, cIdx) => (
                  <td key={cIdx} className="px-3.5 py-2 text-slate-200 text-[11px]">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableBuffer = [];
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const cells = trimmed.split("|").slice(1, -1).map(c => c.trim().replace(/\*\*/g, ''));
      tableBuffer.push(cells);
      return;
    }

    if (tableBuffer.length > 0) {
      flushTable(idx);
    }

    if (!trimmed) {
      blocks.push(<div key={`sp-${idx}`} className="h-1" />);
    } else if (trimmed.startsWith("# ")) {
      blocks.push(<h1 key={`h1-${idx}`} className="text-xl font-bold text-white border-b border-slate-800 pb-2 mb-2">{trimmed.replace("# ", "")}</h1>);
    } else if (trimmed.startsWith("## ")) {
      blocks.push(<h2 key={`h2-${idx}`} className="text-sm font-bold text-blue-300 mt-5 mb-1.5 border-b border-slate-800/80 pb-1 flex items-center gap-1.5">{trimmed.replace("## ", "")}</h2>);
    } else if (trimmed.startsWith("### ")) {
      blocks.push(<h3 key={`h3-${idx}`} className="text-xs font-semibold text-amber-300 mt-3 mb-1">{trimmed.replace("### ", "")}</h3>);
    } else if (trimmed.startsWith("> ")) {
      blocks.push(<blockquote key={`bq-${idx}`} className="border-l-2 border-amber-500/80 pl-3 py-1.5 italic bg-amber-500/5 text-amber-200/90 rounded-r my-2 text-[11.5px]">{trimmed.replace("> ", "")}</blockquote>);
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      blocks.push(<li key={`li-${idx}`} className="ml-4 list-disc text-slate-300 my-0.5 text-[11.5px]">{trimmed.substring(2)}</li>);
    } else if (trimmed.startsWith("---")) {
      blocks.push(<hr key={`hr-${idx}`} className="border-slate-800 my-3" />);
    } else {
      blocks.push(<p key={`p-${idx}`} className="my-1 text-slate-200 text-[11.5px] leading-relaxed">{trimmed}</p>);
    }
  });

  if (tableBuffer.length > 0) {
    flushTable("last");
  }

  return blocks;
}

export default function ReportBuilder({ apiKey, availableFiles = [] }) {
  // Configuration State
  const [reportType, setReportType] = useState("comprehensive_audit");
  const [subsidiary, setSubsidiary] = useState("All CIL Aggregate");
  const [timeframe, setTimeframe] = useState("FY 2023-24");
  const [tone, setTone] = useState("Formal Executive Brief");
  const [customPrompt, setCustomPrompt] = useState("");

  const [generating, setGenerating] = useState(false);
  const [reportResult, setReportResult] = useState(null);
  const [previewTab, setPreviewTab] = useState("rendered"); // "rendered" or "raw"
  const [error, setError] = useState(null);

  const reportArchetypes = [
    {
      id: "comprehensive_audit",
      title: "Executive Subsidiary Performance",
      badge: "Macro & Financial",
      icon: Building2,
      color: "border-blue-500/40 bg-blue-500/10 text-blue-300",
      activeColor: "border-blue-500 bg-blue-600/25 ring-1 ring-blue-400",
      description: "National & subsidiary production volumes, targets, YoY growth rates, rail rake logistics, and First Mile Connectivity."
    },
    {
      id: "production_obr",
      title: "OBR & Stripping Ratio Optimization",
      badge: "Mining Operations",
      icon: Layers,
      color: "border-amber-500/40 bg-amber-500/10 text-amber-300",
      activeColor: "border-amber-500 bg-amber-600/25 ring-1 ring-amber-400",
      description: "Overburden cubic meterage, bench advance dynamics, stripping ratio variances (1.18 to 4.21 m³/t), and HEMM machinery."
    },
    {
      id: "geological_exploration",
      title: "Stratigraphy & Borehole Drilling",
      badge: "CMPDI Exploration",
      icon: Compass,
      color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
      activeColor: "border-emerald-500 bg-emerald-600/25 ring-1 ring-emerald-400",
      description: "Lower Gondwana Barakar & Raniganj formations, CMPDI RI-I to RI-VII drilling meterage (13.82 Lakh m), and 2D/3D seismic profiling."
    },
    {
      id: "cbm_clean_coal",
      title: "CBM Gas & Coal Beneficiation",
      badge: "Clean Energy & Quality",
      icon: Database,
      color: "border-purple-500/40 bg-purple-500/10 text-purple-300",
      activeColor: "border-purple-500 bg-purple-600/25 ring-1 ring-purple-400",
      description: "Coal Bed Methane reserves (25.40 BCM) in Jharia/Bokaro deep seams, coal washery yields, and Gross Calorific Value (GCV) bands."
    },
    {
      id: "custom_inquiry",
      title: "Custom Investigative Audit",
      badge: "Tailored Directives",
      icon: Sparkles,
      color: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
      activeColor: "border-cyan-500 bg-cyan-600/25 ring-1 ring-cyan-400",
      description: "Deep-dive inquiry based on your custom engineering directives, environmental compliance standards, or mine safety parameters."
    }
  ];

  const subsidiariesList = [
    { id: "All CIL Aggregate", name: "All CIL Aggregate (National Totals)" },
    { id: "MCL", name: "Mahanadi Coalfields Ltd (MCL) - Odisha" },
    { id: "SECL", name: "South Eastern Coalfields (SECL) - Bilaspur" },
    { id: "NCL", name: "Northern Coalfields (NCL) - Singrauli" },
    { id: "CCL", name: "Central Coalfields (CCL) - Ranchi" },
    { id: "WCL", name: "Western Coalfields (WCL) - Nagpur" },
    { id: "BCCL", name: "Bharat Coking Coal (BCCL) - Dhanbad" },
    { id: "ECL", name: "Eastern Coalfields (ECL) - Sanctoria" },
    { id: "CMPDI", name: "CMPDI Headquarters & Regional Institutes" }
  ];

  const timeframesList = [
    "FY 2023-24",
    "FY 2024-25",
    "Q1 (April - June)",
    "Q2 (July - September)",
    "Q3 (October - December)",
    "Q4 (January - March)"
  ];

  const tonesList = [
    { id: "Formal Executive Brief", label: "Formal Executive Brief", desc: "Concise, high-level summaries for Board & Ministry review" },
    { id: "Technical Geological Audit", label: "Technical Geological Audit", desc: "In-depth stratigraphic data, drilling logs, precision metrics" },
    { id: "Public Release", label: "Public Release & Dissemination", desc: "Clear, transparent communication for public & investor portals" }
  ];

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);

    try {
      const resp = await fetch("/api/generate-structured-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report_type: reportType,
          subsidiary,
          timeframe,
          tone,
          custom_prompt: customPrompt,
          api_key: apiKey || undefined
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.detail || `Report synthesis failed with status ${resp.status}`);
      }

      const data = await resp.json();
      setReportResult(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900/40 via-slate-900 to-indigo-950/50 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-2 border border-blue-500/30">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Token-Efficient Smart Report Studio
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              CMPDI Multi-Format Autonomous Report Generator
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Select an objective archetype, target subsidiary, and time horizon. The engine performs targeted vector searches across 100+ documents and synthesizes verified Word (<strong className="text-blue-400">.docx</strong>), print PDF (<strong className="text-red-400">.pdf</strong>), and Markdown (<strong className="text-emerald-400">.md</strong>) reports without token waste.
            </p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 disabled:opacity-50 transition-all text-sm shrink-0"
          >
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Synthesizing Report...</span>
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4" />
                <span>Generate Official Report</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-500/40 text-red-200 p-4 rounded-xl text-xs flex items-center gap-2">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Split Pane: Left Config Studio & Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Intuitive Archetype & Parameters Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                1. Select Report Focus
              </h2>
            </div>
            <span className="text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              No Checkboxes Required
            </span>
          </div>

          {/* Archetype Selector Cards */}
          <div className="space-y-2">
            {reportArchetypes.map((arch) => {
              const isSelected = reportType === arch.id;
              const ArchIcon = arch.icon;
              return (
                <div
                  key={arch.id}
                  onClick={() => setReportType(arch.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? arch.activeColor
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${arch.color}`}>
                      <ArchIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-bold ${isSelected ? "text-white" : "text-slate-200"}`}>
                          {arch.title}
                        </span>
                        <span className="text-[9.5px] font-semibold uppercase tracking-wider text-slate-400">
                          {arch.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug line-clamp-2">
                        {arch.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Parameters Section */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              2. Scope & Horizon
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Target Subsidiary */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">
                  Target Subsidiary:
                </label>
                <select
                  value={subsidiary}
                  onChange={(e) => setSubsidiary(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {subsidiariesList.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Period */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">
                  Reporting Period:
                </label>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {timeframesList.map((tf) => (
                    <option key={tf} value={tf}>
                      {tf}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tone */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">
                Analytical Tone:
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {tonesList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label} - {t.desc}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Directives */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                <span>Specific Directives / Focus (Optional):</span>
                <span className="text-[10px] text-slate-500">Searched across docs</span>
              </label>
              <textarea
                rows={2}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. Focus on deep seam permeability, Talcher expansion, or DGMS safety benchmarks..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Split-Pane Live Interactive Preview (7 cols) */}
        <div className="lg:col-span-7 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl min-h-[550px]">
          {/* Preview Header & Export Action Buttons */}
          <div className="px-5 py-3.5 bg-slate-950/90 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Live Interactive Preview
              </span>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px]">
              <button
                onClick={() => setPreviewTab("rendered")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  previewTab === "rendered" ? "bg-blue-600 text-white font-semibold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Rendered Report
              </button>
              <button
                onClick={() => setPreviewTab("pdf")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  previewTab === "pdf" ? "bg-red-600 text-white font-semibold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Official PDF
              </button>
              <button
                onClick={() => setPreviewTab("raw")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  previewTab === "raw" ? "bg-blue-600 text-white font-semibold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Raw Markdown
              </button>
            </div>
          </div>

          {/* Export Actions Bar if Report Generated */}
          {reportResult && (
            <div className="px-5 py-2.5 bg-blue-950/40 border-b border-blue-500/20 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-300 font-semibold text-[11px]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Ready: {reportResult.base_name}</span>
              </div>

              {/* 3 Explicit Format Download Buttons */}
              <div className="flex items-center gap-2">
                <a
                  href={reportResult.files.docx.url}
                  download
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/50 text-blue-200 rounded-lg font-semibold transition-all text-[11px] shadow-sm"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>Word (.docx)</span>
                  <Download className="w-3 h-3 text-blue-300 ml-0.5" />
                </a>

                <a
                  href={reportResult.files.pdf.url}
                  download
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/30 hover:bg-red-600/50 border border-red-500/50 text-red-200 rounded-lg font-semibold transition-all text-[11px] shadow-sm"
                >
                  <Shield className="w-3.5 h-3.5 text-red-400" />
                  <span>PDF (.pdf)</span>
                  <Download className="w-3 h-3 text-red-300 ml-0.5" />
                </a>

                <a
                  href={reportResult.files.markdown.url}
                  download
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/50 text-emerald-200 rounded-lg font-semibold transition-all text-[11px] shadow-sm"
                >
                  <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Markdown (.md)</span>
                  <Download className="w-3 h-3 text-emerald-300 ml-0.5" />
                </a>
              </div>
            </div>
          )}

          {/* Preview Document Area */}
          <div className="flex-1 overflow-hidden flex flex-col bg-slate-950/80 font-sans text-xs leading-relaxed text-slate-200 min-h-[560px]">
            {reportResult ? (
              previewTab === "pdf" ? (
                <div className="flex-1 flex flex-col h-full min-h-[580px]">
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-950 border-b border-slate-800 text-[11px] text-slate-300">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Shield className="w-3.5 h-3.5 text-red-400" />
                      In-Site PDF Preview &bull; {reportResult.files.pdf.filename}
                    </span>
                    <div className="flex items-center gap-3">
                      <a
                        href={reportResult.files.pdf.view_url || `/api/view-report-pdf/${reportResult.files.pdf.filename}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline"
                      >
                        Open In New Tab
                      </a>
                      <a
                        href={reportResult.files.pdf.url}
                        download
                        className="text-red-400 hover:text-red-300 underline"
                      >
                        Direct Download
                      </a>
                    </div>
                  </div>
                  <iframe
                    src={`${reportResult.files.pdf.view_url || `/api/view-report-pdf/${reportResult.files.pdf.filename}`}#toolbar=0`}
                    className="w-full flex-1 min-h-[550px] border-0 bg-white"
                    title="Official PDF Viewer"
                  />
                </div>
              ) : previewTab === "rendered" ? (
                <div className="p-6 overflow-y-auto max-h-[620px] space-y-3">
                  {renderMarkdownBlocks(reportResult.preview_text)}
                </div>
              ) : (
                <div className="p-6 overflow-y-auto max-h-[620px]">
                  <pre className="font-mono text-[11px] text-slate-300 whitespace-pre-wrap selection:bg-blue-600">
                    {reportResult.preview_text}
                  </pre>
                </div>
              )
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3 py-20 text-center">
                <FileSpreadsheet className="w-12 h-12 text-slate-700 stroke-1" />
                <div className="max-w-xs">
                  <p className="font-semibold text-slate-300 text-xs">No Report Synthesized Yet</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Select a report archetype and click <strong>"Generate Official Report"</strong> to prepare full Word, PDF, and Markdown volumes with zero token burn.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
