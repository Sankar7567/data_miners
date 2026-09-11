import React from "react";
import { 
  Building, Bot, BarChart3, FileCheck, FolderArchive, 
  Compass, Key, ShieldCheck, Play
} from "lucide-react";

export default function Header({
  activeTab,
  onSelectTab,
  documentCount = 100,
  apiKey,
  onOpenKeyModal,
  onStartTour
}) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 px-4 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Institutional Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 shrink-0">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-white">
                GeoIntel Core
              </h1>
              <span className="text-[10px] bg-blue-900/60 text-blue-300 font-semibold px-2 py-0.5 rounded border border-blue-700/50">
                Team Data Miners
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              CMPDI & Coal India Geological Intelligence • Autonomous Multimodal Reporting
            </p>
          </div>
        </div>

        {/* Fixed Navigation (No scrollbar, fixed 4 modules) */}
        <nav className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => onSelectTab("chat")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "chat"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Chat & Audit</span>
          </button>

          <button
            onClick={() => onSelectTab("dashboard")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "dashboard"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Geological Analytics</span>
          </button>

          <button
            onClick={() => onSelectTab("reports")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "reports"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Report Studio</span>
          </button>

          <button
            onClick={() => onSelectTab("documents")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "documents"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>Archive ({documentCount})</span>
          </button>
        </nav>

        {/* Action Controls: Tour + Groq Hardware */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <button
            onClick={onStartTour}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition-all"
            title="Start Interactive Walkthrough"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" />
            <span>Guide Tour</span>
          </button>

          <button
            onClick={onOpenKeyModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
              apiKey
                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40"
                : "bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/40"
            }`}
            title="Configure Groq Inference Key"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>{apiKey ? "Inference Ready" : "Set API Key"}</span>
            <span className={`w-2 h-2 rounded-full ${apiKey ? "bg-emerald-400" : "bg-amber-400"}`} />
          </button>
        </div>
      </div>
    </header>
  );
}
