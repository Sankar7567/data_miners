import React, { useState } from "react";
import { 
  Sparkles, CheckCircle2, ChevronRight, ChevronLeft, 
  X, FolderArchive, MapPin, BarChart3, FileCheck, Layers, Play,
  ArrowRight, MoveRight, CornerDownRight, Zap, Eye, Building2,
  Database, Pickaxe, Compass, MousePointerClick, ShieldCheck,
  Minimize2, Maximize2, ArrowDown
} from "lucide-react";

export default function OnboardingTour({ isOpen, onClose, onNavigateTab }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isOpen) return null;

  const tourSteps = [
    {
      stepNumber: 1,
      tab: "documents",
      title: "Official Repository & Real Data Ingestion",
      badge: "Architecture Phase 1 • Repository & Ingestion",
      icon: FolderArchive,
      color: "from-blue-600 to-indigo-600",
      pointerText: "Look below: Use the Drag & Drop Zone to index new PDFs in real-time, or click 'Audit in Viewer' on any document card.",
      pointerDirection: "down",
      functionalMappings: [
        {
          button: "PDF Drag & Drop Zone",
          arrowLabel: "Instant Vector Indexing",
          action: "Drop or browse local PDFs below. Watch total documents and ChromaDB vectors increment live!"
        },
        {
          button: "Audit in Viewer",
          arrowLabel: "Loads Split-Screen",
          action: "Click on any document card below to jump to Tab 1 with this PDF loaded on Page 1."
        },
        {
          button: "Live Scraper Terminal",
          arrowLabel: "Crawler Monitor",
          action: "Click 'Trigger Web Scraper' above to view live crawler logs across Ministry archives."
        }
      ]
    },
    {
      stepNumber: 2,
      tab: "chat",
      title: "Spatial PDF Audit & Dynamic Citation Highlighting",
      badge: "Architecture Phase 2 • Verification & Citations",
      icon: MapPin,
      color: "from-amber-600 to-orange-600",
      pointerText: "Left Panel: Ask questions in the prompt bar | Right Panel: Click any citation pill (e.g. P.1) to see its bounding box. Switch pages to see highlights dynamically disappear/reappear.",
      pointerDirection: "split",
      functionalMappings: [
        {
          button: "Spatial Citation Pills (P.X)",
          arrowLabel: "Draws Bounding Box",
          action: "Clicking a citation jumps the PDF to that page with an amber bounding box."
        },
        {
          button: "Page Navigation (< / >)",
          arrowLabel: "Dynamic Visibility",
          action: "Navigating to non-cited pages cleanly removes the highlight and snippet card."
        },
        {
          button: "Spatial View / PDF View",
          arrowLabel: "Viewer Toggle",
          action: "Switch between high-precision vector overlay and full inline browser PDF."
        }
      ]
    },
    {
      stepNumber: 3,
      tab: "dashboard",
      title: "Geological Analytics & Semantic Word Cloud",
      badge: "Architecture Phase 3 • Semantic Intelligence",
      icon: BarChart3,
      color: "from-emerald-600 to-teal-600",
      pointerText: "Look below: Click any geological entity (e.g. Barakar, Overburden) in the Word Cloud to open its In-Place Occurrence Inspector with sentence citations.",
      pointerDirection: "down",
      functionalMappings: [
        {
          button: "Word Cloud Entity Chips",
          arrowLabel: "Inspect Occurrences",
          action: "Click any tag to see where it appears across all 100+ documents without leaving the page."
        },
        {
          button: "Semantic Category Pills",
          arrowLabel: "Domain Filters",
          action: "Filter between Stratigraphy, CIL Subsidiaries, Extraction Tech, and Mining Metrics."
        },
        {
          button: "Subsidiary Production Bars",
          arrowLabel: "Operational Audit",
          action: "Compare Opencast vs. Underground production volumes and stripping ratios across subsidiaries."
        }
      ]
    },
    {
      stepNumber: 4,
      tab: "reports",
      title: "Autonomous Report Studio & In-Site PDF Preview",
      badge: "Architecture Phase 4 • Synthesis & Export",
      icon: FileCheck,
      color: "from-purple-600 to-pink-600",
      pointerText: "Look below: Type your custom directives in the text area below, click 'Generate Official Report', and preview the official PDF document directly inside the site!",
      pointerDirection: "down",
      functionalMappings: [
        {
          button: "Specific Directives Input",
          arrowLabel: "Priority Synthesis",
          action: "Your custom engineering comments strictly drive vector retrieval, titles, and section contents."
        },
        {
          button: "Official PDF Preview Tab",
          arrowLabel: "In-Browser Viewer",
          action: "Click the 'Official PDF' tab on the right preview pane to inspect the formatted print PDF."
        },
        {
          button: "Word / PDF / MD Export",
          arrowLabel: "Instant Download",
          action: "Download verified .docx, .pdf, and .md files with zero token burn."
        }
      ]
    }
  ];

  const step = tourSteps[currentStep];
  const StepIcon = step.icon;

  const goToStep = (idx) => {
    setCurrentStep(idx);
    if (onNavigateTab) {
      onNavigateTab(tourSteps[idx].tab);
    }
  };

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      goToStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  };

  // Minimized floating pill bar
  if (isMinimized) {
    return (
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
        <div className="bg-slate-900/95 border border-blue-500/60 shadow-2xl backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-3 text-xs text-slate-200">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping" />
          <span className="font-semibold text-white">
            GeoIntel Core Guide: Step {step.stepNumber} of {tourSteps.length} &bull; {step.title}
          </span>
          <button
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-2.5 py-1 rounded-full text-[11px] transition-colors"
          >
            <Maximize2 className="w-3 h-3" /> Expand
          </button>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-0.5 rounded-full hover:bg-slate-800 transition-colors"
            title="Exit Tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 w-[95%] max-w-5xl z-50 pointer-events-none animate-in fade-in slide-in-from-top-3 duration-200">
      {/* Floating HUD Card (Pointer events enabled on card only, keeping background click-through!) */}
      <div className="pointer-events-auto bg-slate-900/95 border-2 border-blue-500/60 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.85)] backdrop-blur-xl p-4 sm:p-5 text-white space-y-3.5 ring-1 ring-blue-400/20">
        {/* Top Controls Row: Badge, Step Counter, Minimize, Close */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300 bg-blue-500/20 px-2.5 py-0.5 rounded-full border border-blue-500/40 flex items-center gap-1.5 shadow-sm">
              <Play className="w-3 h-3 fill-blue-400 text-blue-400" /> GeoIntel Core Walkthrough &bull; Team Data Miners
            </span>
            <span className="text-xs text-amber-300 font-mono font-bold bg-amber-950/40 border border-amber-500/40 px-2 py-0.5 rounded">
              Step {step.stepNumber} of {tourSteps.length}
            </span>
            <span className="text-xs text-slate-300 font-semibold hidden sm:inline">
              &bull; {step.badge}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsMinimized(true)}
              className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors text-xs flex items-center gap-1"
              title="Minimize to top bar"
            >
              <Minimize2 className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px]">Minimize</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              title="Exit Guide"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feature Title + Live Pointer Callout */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${step.color} flex items-center justify-center text-white shadow-lg shrink-0`}>
              <StepIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                {step.stepNumber}. {step.title}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-amber-300 mt-0.5 font-medium">
                <ArrowDown className="w-3.5 h-3.5 text-amber-400 animate-bounce shrink-0" />
                <span>{step.pointerText}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Functional Controls Callouts Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {step.functionalMappings.map((m, idx) => (
            <div 
              key={idx}
              className="bg-slate-950/85 border border-slate-800 hover:border-blue-500/50 rounded-xl p-2.5 space-y-1 shadow-sm transition-all"
            >
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <span className="text-[10.5px] font-bold text-blue-300 bg-blue-500/15 border border-blue-500/30 px-1.5 py-0.5 rounded">
                  {m.button}
                </span>
                <span className="text-[9.5px] text-amber-400 font-semibold uppercase">
                  &rarr; {m.arrowLabel}
                </span>
              </div>
              <p className="text-[10.5px] text-slate-300 leading-relaxed">
                {m.action}
              </p>
            </div>
          ))}
        </div>

        {/* Footer Controls: Step Dots + Prev / Next Actions */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex items-center gap-1 text-slate-400 hover:text-white px-2.5 py-1 rounded-lg disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev Feature</span>
          </button>

          {/* Clickable Step Dots */}
          <div className="flex items-center gap-2">
            {tourSteps.map((s, idx) => (
              <button
                key={idx}
                onClick={() => goToStep(idx)}
                className={`h-2 rounded-full transition-all ${
                  currentStep === idx ? "w-8 bg-blue-500 shadow-md shadow-blue-500/50" : "w-2 bg-slate-700 hover:bg-slate-500"
                }`}
                title={`Jump to Step ${s.stepNumber}: ${s.title}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg transition-colors text-[11px]"
            >
              Exit Tour
            </button>
            <button
              onClick={handleNext}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-md transition-all"
            >
              <span>{currentStep === tourSteps.length - 1 ? "Finish Tour" : "Next Feature"}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
