import React, { useState, useEffect } from "react";
import { 
  BarChart3, Cloud, Layers, Activity, TrendingUp, 
  Sparkles, Pickaxe, MapPin, Database, RefreshCw, ChevronRight,
  FileText, Search, BookOpen, ArrowLeft, ExternalLink, Hash,
  CheckCircle2, Building2, Tag, AlertCircle
} from "lucide-react";

export default function Dashboard({ onAuditDocument }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  // Sub-tab navigation: "cloud" | "occurrences"
  const [subTab, setSubTab] = useState("cloud");

  // Occurrence Exploration State
  const [selectedTerm, setSelectedTerm] = useState("Barakar");
  const [occurrenceData, setOccurrenceData] = useState(null);
  const [loadingOccurrence, setLoadingOccurrence] = useState(false);
  const [searchTermInput, setSearchTermInput] = useState("");

  const fetchAnalytics = async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const resp = await fetch(`/api/analytics${forceRefresh ? "?refresh=true" : ""}`);
      if (resp.ok) {
        const data = await resp.json();
        setAnalytics(data);
      }
    } catch (e) {
      console.error("Failed to load analytics:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchEntityOccurrences = async (term) => {
    if (!term || !term.trim()) return;
    const cleanTerm = term.trim();
    setSelectedTerm(cleanTerm);
    setLoadingOccurrence(true);
    try {
      const resp = await fetch(`/api/entity-occurrences?term=${encodeURIComponent(cleanTerm)}`);
      if (resp.ok) {
        const data = await resp.json();
        setOccurrenceData(data);
      } else {
        setOccurrenceData(null);
      }
    } catch (e) {
      console.error("Failed to fetch entity occurrences:", e);
      setOccurrenceData(null);
    } finally {
      setLoadingOccurrence(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleWordClick = (termText) => {
    setSelectedTerm(termText);
    setSubTab("occurrences");
    fetchEntityOccurrences(termText);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTermInput.trim()) {
      handleWordClick(searchTermInput.trim());
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <span className="text-sm">Calculating geological TF-IDF frequencies & topic clusters...</span>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center p-8 text-slate-400">
        Analytics service unavailable. Please check backend.
      </div>
    );
  }

  const { word_cloud = [], subsidiaries = [], topic_clusters = [], macro_kpis = {} } = analytics;

  // Filter word cloud: strictly exclude any terms with 0 citations or 0 occurrences
  const verifiedWordCloud = word_cloud.filter(w => (w.citations || 0) > 0 && (w.occurrences || 0) > 0);
  const filteredWords = activeCategory === "all" 
    ? verifiedWordCloud 
    : verifiedWordCloud.filter(w => w.category === activeCategory);

  const categoryColors = {
    subsidiaries: "text-blue-400 bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20",
    geological_terms: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20",
    mining_metrics: "text-amber-400 bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20",
    domain_vocabulary: "text-purple-400 bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20",
  };

  const popularEntities = [
    "Barakar", "Raniganj", "Stripping Ratio",
    "Overburden", "Coal Seam", "MCL",
    "SECL", "CMPDI", "Opencast", "CBM"
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Level Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab("cloud")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              subTab === "cloud"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Word Cloud & Field Metrics</span>
          </button>

          <button
            onClick={() => {
              setSubTab("occurrences");
              if (!occurrenceData) {
                fetchEntityOccurrences(selectedTerm);
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              subTab === "occurrences"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Entity Occurrence Explorer</span>
            {selectedTerm && (
              <span className="bg-slate-800 text-blue-300 text-[10px] px-2 py-0.5 rounded-full border border-blue-500/30">
                {selectedTerm}
              </span>
            )}
          </button>
        </div>

        <div className="text-xs text-slate-400 hidden sm:block">
          CMPDI Geological & Operations Intelligence
        </div>
      </div>

      {/* SUB-TAB 1: WORD CLOUD & MACRO KPIS */}
      {subTab === "cloud" && (
        <>
          {/* Top Macro KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Raw Coal Production</div>
                <div className="text-2xl font-bold text-white mt-1">
                  {macro_kpis.total_production_mt || "703.20"} <span className="text-xs text-blue-400 font-medium">MT</span>
                </div>
                <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" /> +{macro_kpis.production_growth_pct || "10.1"}% YoY Growth
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Pickaxe className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">CMPDI Drilling Meterage</div>
                <div className="text-2xl font-bold text-white mt-1">
                  {macro_kpis.total_drilling_lakh_m || "13.82"} <span className="text-xs text-emerald-400 font-medium">Lakh m</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  118 Gondwana Coal Blocks
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Activity className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Overburden Removal (OBR)</div>
                <div className="text-2xl font-bold text-white mt-1">
                  {macro_kpis.total_obr_mcum || "1,650.40"} <span className="text-xs text-amber-400 font-medium">M.Cum</span>
                </div>
                <div className="text-[11px] text-amber-400 mt-1">
                  Avg. Stripping Ratio: 2.48 m³/t
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Layers className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">CBM Gas In Place (GIP)</div>
                <div className="text-2xl font-bold text-white mt-1">
                  {macro_kpis.cbm_gip_bcm || "25.40"} <span className="text-xs text-purple-400 font-medium">BCM</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Jharia & Bokaro Basins
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Database className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Dynamic Interactive Word Cloud Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-blue-400" />
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>Interactive Mining & Geological Entities</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Filtered & Semantic Mapped
                    </span>
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click any entity to open its Occurrence Breakdown showing total frequency, document list, and context snippets.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                {/* Filter Pills */}
                <div className="flex flex-wrap gap-1.5 text-xs">
                  <button
                    onClick={() => setActiveCategory("all")}
                    className={`px-3 py-1 rounded-lg border transition-all ${
                      activeCategory === "all"
                        ? "bg-blue-600 text-white border-blue-500"
                        : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                    }`}
                  >
                    All ({word_cloud.length})
                  </button>
                  <button
                    onClick={() => setActiveCategory("geological_terms")}
                    className={`px-3 py-1 rounded-lg border transition-all ${
                      activeCategory === "geological_terms"
                        ? "bg-emerald-600 text-white border-emerald-500"
                        : "bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-700"
                    }`}
                  >
                    Geology
                  </button>
                  <button
                    onClick={() => setActiveCategory("subsidiaries")}
                    className={`px-3 py-1 rounded-lg border transition-all ${
                      activeCategory === "subsidiaries"
                        ? "bg-blue-600 text-white border-blue-500"
                        : "bg-slate-800 text-blue-400 border-slate-700 hover:bg-slate-700"
                    }`}
                  >
                    Subsidiaries
                  </button>
                  <button
                    onClick={() => setActiveCategory("mining_metrics")}
                    className={`px-3 py-1 rounded-lg border transition-all ${
                      activeCategory === "mining_metrics"
                        ? "bg-amber-600 text-white border-amber-500"
                        : "bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-700"
                    }`}
                  >
                    Operations
                  </button>
                  <button
                    onClick={() => setActiveCategory("domain_vocabulary")}
                    className={`px-3 py-1 rounded-lg border transition-all ${
                      activeCategory === "domain_vocabulary"
                        ? "bg-purple-600 text-white border-purple-500"
                        : "bg-slate-800 text-purple-400 border-slate-700 hover:bg-slate-700"
                    }`}
                  >
                    Technology
                  </button>
                </div>

                <button
                  onClick={() => fetchAnalytics(true)}
                  disabled={refreshing}
                  title="Re-run Semantic Inference to refresh entity frequencies"
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:text-white px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 transition-all shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-blue-400" : ""}`} />
                  <span>{refreshing ? "Extracting..." : "Re-run Inference"}</span>
                </button>
              </div>
            </div>

            {/* Word Cloud Canvas / Tags Container */}
            <div className="p-6 bg-slate-950/60 rounded-xl border border-slate-800/80 min-h-[220px] flex flex-wrap items-center justify-center gap-3 select-none">
              {filteredWords.map((item, idx) => {
                const sizeClass = 
                  item.value > 70 ? "text-2xl font-black" :
                  item.value > 50 ? "text-xl font-bold" :
                  item.value > 30 ? "text-base font-semibold" :
                  "text-xs font-medium";

                const badgeStyle = categoryColors[item.category] || categoryColors.domain_vocabulary;

                return (
                  <button
                    key={idx}
                    onClick={() => handleWordClick(item.text)}
                    className={`px-3.5 py-1.5 rounded-xl border transition-all duration-200 hover:scale-110 shadow-sm cursor-pointer ${sizeClass} ${badgeStyle}`}
                    title={`"${item.text}": ${item.occurrences || item.value} occurrences across ${item.citations || 1} official documents`}
                  >
                    {item.text}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs px-4 py-2.5 bg-slate-950/40 border border-slate-800/80 rounded-xl text-slate-400">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-400" />
                <span>Tip: Click any keyword above to open full document occurrence metrics and exact context quotes.</span>
              </div>
              <button
                onClick={() => {
                  setSubTab("occurrences");
                  fetchEntityOccurrences(selectedTerm);
                }}
                className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
              >
                <span>Open Occurrence Explorer</span> <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Subsidiary Breakdown & Topic Modeling Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subsidiary Production Breakdown */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  <h3 className="text-base font-bold text-white">Subsidiary Coal Production Metrics</h3>
                </div>
                <span className="text-xs text-slate-400">Total: 703.2 MT</span>
              </div>

              <div className="space-y-3">
                {subsidiaries.map((sub, idx) => {
                  const maxProd = 200;
                  const ocWidth = (sub.opencast / maxProd) * 100;
                  const ugWidth = (sub.underground / maxProd) * 100;

                  return (
                    <div 
                      key={idx} 
                      onClick={() => handleWordClick(sub.name)}
                      className="bg-slate-950/60 hover:bg-slate-800/50 p-3 rounded-xl border border-slate-800/80 space-y-1.5 cursor-pointer transition-all"
                      title={`Click to inspect "${sub.name}" occurrences`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-white">{sub.name}</span>
                          <span className="text-slate-400 ml-1.5">({sub.fullName})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-300">{sub.total.toFixed(1)} MT</span>
                          <span className="text-[10px] text-emerald-400 font-medium">+{sub.growth}%</span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
                        <div 
                          style={{ width: `${ocWidth}%` }} 
                          className="bg-blue-500 h-full"
                          title={`Opencast: ${sub.opencast} MT`}
                        />
                        <div 
                          style={{ width: `${ugWidth}%` }} 
                          className="bg-amber-500 h-full"
                          title={`Underground: ${sub.underground} MT`}
                        />
                      </div>

                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>OC: {sub.opencast} MT &bull; UG: {sub.underground} MT</span>
                        <span>Region: {sub.region}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Topic Clusters Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">Stratigraphy & Thematic Clusters</h3>
                </div>
                <span className="text-xs text-slate-400">Corpus Domains</span>
              </div>

              <div className="space-y-3">
                {topic_clusters.map((cluster, idx) => (
                  <div key={idx} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200">{cluster.topic}</span>
                      <span 
                        className="font-bold px-2 py-0.5 rounded text-[11px]"
                        style={{ color: cluster.color, backgroundColor: `${cluster.color}18` }}
                      >
                        {cluster.share}% Corpus Weight
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${cluster.share}%`, backgroundColor: cluster.color }} 
                        className="h-full rounded-full"
                      />
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {cluster.terms.map((term, tIdx) => (
                        <button 
                          key={tIdx} 
                          onClick={() => handleWordClick(term)}
                          className="text-[10px] bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white px-2 py-0.5 rounded-md border border-slate-700/60 transition-colors"
                          title="Click to view occurrences"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* SUB-TAB 2: ENTITY OCCURRENCE EXPLORER (IN-PLACE DRILL-DOWN) */}
      {subTab === "occurrences" && (
        <div className="space-y-6">
          {/* Top Control Bar with Search & Quick Suggestions */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSubTab("cloud")}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Word Cloud</span>
                </button>
                <div className="h-5 w-px bg-slate-800 hidden sm:block" />
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                  <h2 className="text-base font-bold text-white">Entity Occurrence & Context Inspector</h2>
                </div>
              </div>

              {/* In-tab Search for any Term */}
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-80">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTermInput}
                    onChange={(e) => setSearchTermInput(e.target.value)}
                    placeholder="Search any entity or word..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0"
                >
                  Inspect
                </button>
              </form>
            </div>

            {/* Quick Entity Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium mr-1">Popular Entities:</span>
              {popularEntities.map((ent, idx) => (
                <button
                  key={idx}
                  onClick={() => handleWordClick(ent)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                    selectedTerm.toLowerCase() === ent.toLowerCase()
                      ? "bg-blue-600 text-white border-blue-500 font-semibold"
                      : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                  }`}
                >
                  {ent}
                </button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {loadingOccurrence && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
              <div className="text-sm font-semibold text-white">
                Searching 2,000+ chunks across 100 official documents for "{selectedTerm}"...
              </div>
              <p className="text-xs text-slate-400">
                Aggregating occurrences, page locations, and sentence contexts in real-time.
              </p>
            </div>
          )}

          {/* Occurrence Results */}
          {!loadingOccurrence && occurrenceData && (
            <div className="space-y-6">
              {/* Entity Overview Banner */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-black text-white">{occurrenceData.term}</h2>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30">
                        Official Domain Entity
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Repository-wide occurrence audit across active CMPDI & Coal India publications
                    </p>
                  </div>

                  {/* Summary Metric Badges */}
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-center">
                      <div className="text-xs text-slate-400 font-medium">Total Mentions</div>
                      <div className="text-xl font-bold text-blue-400">{occurrenceData.total_occurrences}</div>
                    </div>
                    <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-center">
                      <div className="text-xs text-slate-400 font-medium">Documents Cited</div>
                      <div className="text-xl font-bold text-emerald-400">{occurrenceData.document_count}</div>
                    </div>
                  </div>
                </div>

                {/* Brief AI Synthesis */}
                <div className="bg-blue-950/20 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed text-slate-200">
                    <strong className="text-blue-300 font-semibold block mb-0.5">Domain Synthesis:</strong>
                    {occurrenceData.summary}
                  </div>
                </div>
              </div>

              {/* Document Breakdown List */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-400" />
                    <h3 className="text-base font-bold text-white">
                      Where "{occurrenceData.term}" Appeared in Official Documents
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">
                    Showing top {occurrenceData.documents ? occurrenceData.documents.length : 0} publications
                  </span>
                </div>

                {(!occurrenceData.documents || occurrenceData.documents.length === 0) ? (
                  <div className="p-8 text-center space-y-3 bg-slate-950/40 rounded-xl border border-slate-800">
                    <p className="text-slate-300 text-xs font-semibold">
                      No exact occurrences found for "{occurrenceData.term}".
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                      Try exploring one of our verified, high-frequency geological entities from the official 100+ documents archive:
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
                      {popularEntities.map((ent, eIdx) => (
                        <button
                          key={eIdx}
                          onClick={() => handleWordClick(ent)}
                          className="text-[11px] bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          {ent}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {occurrenceData.documents.map((doc, dIdx) => (
                      <div 
                        key={dIdx} 
                        className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white tracking-wide">
                                {String(doc.source || "Document").replace(".pdf", "").replace(/_/g, " ")}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {doc.source}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                              {doc.count} {doc.count === 1 ? "occurrence" : "occurrences"}
                            </span>
                            {onAuditDocument && (
                              <button
                                onClick={() => {
                                  const firstPage = doc.snippets && doc.snippets.length > 0 ? doc.snippets[0].page : 1;
                                  onAuditDocument(doc.source, firstPage);
                                }}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 font-medium transition-all"
                                title="Open this document in the Split-Screen Audit Viewer on Page 1"
                              >
                                <span>Audit in Split Viewer</span>
                                <ExternalLink className="w-3 h-3 text-slate-400" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Sentence Context Snippets with Page Numbers */}
                        {doc.snippets && doc.snippets.length > 0 && (
                          <div className="space-y-2 pt-1">
                            <div className="text-[11px] font-semibold text-slate-400">Context Excerpts:</div>
                            {doc.snippets.map((snip, sIdx) => (
                              <div 
                                key={sIdx} 
                                className="bg-slate-900/80 rounded-lg p-2.5 border border-slate-800/60 text-xs text-slate-300 flex items-start gap-2.5"
                              >
                                <span className="bg-slate-800 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded shrink-0 border border-amber-500/20">
                                  Page {snip.page}
                                </span>
                                <div className="leading-relaxed text-slate-300 italic">
                                  "{snip.text}"
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
