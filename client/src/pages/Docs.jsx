import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Menu, 
  X, 
  ChevronUp, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Move,
  BookOpen,
  FileText,
  Target,
  Lightbulb,
  BookMarked,
  Puzzle,
  Cog,
  Code,
  AlertTriangle,
  Rocket,
  CheckCircle,
  Link2
} from 'lucide-react';

// Table of Contents data
const tocSections = [
  { id: 'executive-summary', number: '01', title: 'Executive Summary', icon: FileText },
  { id: 'introduction', number: '02', title: 'Introduction', icon: BookOpen },
  { id: 'problem-statement', number: '03', title: 'Problem Statement', icon: AlertTriangle },
  { id: 'objective', number: '04', title: 'Objective', icon: Target },
  { id: 'literature-background', number: '05', title: 'Literature/Background', icon: BookMarked },
  { id: 'proposed-solution', number: '06', title: 'Proposed Solution', icon: Lightbulb },
  { id: 'methodology', number: '07', title: 'Methodology', icon: Cog },
  { id: 'technical-strategy', number: '08', title: 'Technical Strategy', icon: Code },
  { id: 'challenges', number: '09', title: 'Challenges', icon: Puzzle },
  { id: 'future-scope', number: '10', title: 'Future Scope', icon: Rocket },
  { id: 'conclusion', number: '11', title: 'Conclusion', icon: CheckCircle },
  { id: 'references', number: '12', title: 'References', icon: Link2 },
];

// Zoomable Image Component
function ZoomableImage({ src, alt, caption }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 5));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.5, 0.5));
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setScale(prev => Math.min(Math.max(prev + delta, 0.5), 5));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      handleReset();
    }
  };

  const imageContent = (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden rounded-lg border-2 border-[#BA7967]/20 bg-white ${
        isFullscreen ? 'fixed inset-4 z-50 rounded-xl shadow-2xl' : 'w-full'
      }`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Controls */}
      <div className="absolute top-3 right-3 z-10 flex gap-2">
        <button
          onClick={handleZoomOut}
          className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-md hover:bg-[#BA7967] hover:text-white transition-all"
          title="Zoom Out"
        >
          <ZoomOut size={18} />
        </button>
        <button
          onClick={handleZoomIn}
          className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-md hover:bg-[#BA7967] hover:text-white transition-all"
          title="Zoom In"
        >
          <ZoomIn size={18} />
        </button>
        <button
          onClick={handleReset}
          className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-md hover:bg-[#BA7967] hover:text-white transition-all"
          title="Reset"
        >
          <Move size={18} />
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-md hover:bg-[#BA7967] hover:text-white transition-all"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <X size={18} /> : <Maximize2 size={18} />}
        </button>
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-3 left-3 z-10 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 shadow-md">
        {Math.round(scale * 100)}%
      </div>

      {/* Image container */}
      <div 
        className={`${isFullscreen ? 'h-full' : 'h-[400px] md:h-[500px]'} flex items-center justify-center cursor-${scale > 1 ? 'grab' : 'zoom-in'} ${isDragging ? 'cursor-grabbing' : ''}`}
        onMouseDown={handleMouseDown}
      >
        <img
          src={src || "/api/placeholder/800/600"}
          alt={alt}
          className="max-w-full max-h-full object-contain transition-transform duration-200 select-none"
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
          }}
          draggable={false}
        />
      </div>
    </div>
  );

  return (
    <div className="my-6">
      {imageContent}
      {caption && (
        <p className="text-center text-sm text-gray-500 mt-3 italic">{caption}</p>
      )}
      {isFullscreen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={toggleFullscreen}
        />
      )}
    </div>
  );
}

// Section Component
function DocSection({ id, number, title, icon: Icon, children }) {
  return (
    <section id={id} className="scroll-mt-24 mb-12">
      <div className="flex items-center gap-4 mb-6 pb-3 border-b-2 border-[#BA7967]/20">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#BA7967] to-[#6B5B59] text-white shadow-lg">
          <Icon size={24} />
        </div>
        <div>
          <span className="text-sm font-semibold text-[#BA7967] tracking-wide">SECTION {number}</span>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h2>
        </div>
      </div>
      <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
        {children}
      </div>
    </section>
  );
}

// Info Box Component
function InfoBox({ type = 'info', title, children }) {
  const styles = {
    info: 'bg-blue-50 border-blue-300 text-blue-900',
    warning: 'bg-amber-50 border-amber-300 text-amber-900',
    success: 'bg-emerald-50 border-emerald-300 text-emerald-900',
    note: 'bg-[#F3F2EC] border-[#BA7967] text-gray-800',
  };

  return (
    <div className={`p-4 rounded-lg border-l-4 my-4 ${styles[type]}`}>
      {title && <h4 className="font-semibold mb-2">{title}</h4>}
      <div className="text-sm">{children}</div>
    </div>
  );
}

export default function Docs() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('executive-summary');
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);

      const sections = tocSections.map(section => {
        const element = document.getElementById(section.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          return { id: section.id, top: rect.top };
        }
        return null;
      }).filter(Boolean);

      const current = sections.find(section => section.top >= 0 && section.top < 200);
      if (current) {
        setActiveSection(current.id);
      } else if (sections.length > 0 && sections[0].top < 0) {
        const lastAbove = [...sections].reverse().find(section => section.top < 200);
        if (lastAbove) setActiveSection(lastAbove.id);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsTocOpen(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F3F2EC]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-b border-[#BA7967]/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-[#BA7967] transition-colors"
            >
              <ChevronLeft size={20} />
              <span className="hidden sm:inline font-medium">Back</span>
            </button>
            <div className="h-6 w-px bg-gray-300" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#BA7967] to-[#6B5B59] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AL</span>
              </div>
              <span className="font-bold text-xl text-gray-900">ALVance</span>
            </div>
          </div>

          {/* Mobile TOC Toggle */}
          <button
            onClick={() => setIsTocOpen(!isTocOpen)}
            className="lg:hidden p-2 rounded-lg bg-[#BA7967]/10 text-[#BA7967] hover:bg-[#BA7967]/20 transition-colors"
          >
            {isTocOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Desktop: Current section indicator */}
          <div className="hidden lg:flex items-center gap-2 text-sm text-gray-500">
            <BookOpen size={16} className="text-[#BA7967]" />
            <span>Documentation</span>
          </div>
        </div>
      </header>

      {/* Mobile TOC Overlay */}
      {isTocOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsTocOpen(false)}
        />
      )}

      {/* Sidebar TOC */}
      <aside 
        className={`fixed top-[61px] left-0 h-[calc(100vh-61px)] w-72 bg-white border-r border-[#BA7967]/10 z-30 transform transition-transform duration-300 lg:translate-x-0 ${
          isTocOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full overflow-y-auto p-4">
          <div className="mb-4 pb-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Contents</h3>
          </div>
          <nav className="space-y-1">
            {tocSections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group ${
                    activeSection === section.id
                      ? 'bg-gradient-to-r from-[#BA7967] to-[#6B5B59] text-white shadow-md'
                      : 'text-gray-600 hover:bg-[#BA7967]/10 hover:text-[#BA7967]'
                  }`}
                >
                  <span className={`text-xs font-bold ${
                    activeSection === section.id ? 'text-white/80' : 'text-[#BA7967]'
                  }`}>
                    {section.number}
                  </span>
                  <Icon size={16} className={activeSection === section.id ? 'text-white' : 'text-gray-400 group-hover:text-[#BA7967]'} />
                  <span className="text-sm font-medium truncate">{section.title}</span>
                </button>
              );
            })}
          </nav>

          {/* Progress indicator */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 mb-2">Reading Progress</div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#BA7967] to-[#6B5B59] transition-all duration-300"
                style={{ 
                  width: `${((tocSections.findIndex(s => s.id === activeSection) + 1) / tocSections.length) * 100}%` 
                }}
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 pt-[61px]">
        <div className="max-w-4xl lg:max-w-none lg:mr-8 lg:ml-8 xl:mr-16 xl:ml-12 px-4 md:px-8 py-8 md:py-12">
          {/* Hero Section */}
          <div className="text-center lg:text-left mb-12 pb-8 border-b-2 border-[#BA7967]/20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#BA7967]/10 rounded-full text-[#BA7967] text-sm font-medium mb-4">
              <BookOpen size={16} />
              Official Documentation
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              ALVance Documentation
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl lg:max-w-3xl">
              Comprehensive documentation for the AI-Driven Life Cycle Assessment platform. 
              A complete guide to understanding our methodology, technical approach, and implementation 
              for advancing circularity and sustainability in metallurgy and mining.
            </p>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mt-6 text-sm text-gray-500">
              <span className="px-3 py-1 bg-[#BA7967]/10 rounded-full">SIH25069</span>
              <span>•</span>
              <span>Team M_Shark (ID: 50297)</span>
              <span>•</span>
              <span>Smart India Hackathon 2025</span>
            </div>
          </div>

          {/* Sections */}
          <DocSection id="executive-summary" number="01" title="Executive Summary" icon={FileText}>
            <p>
              The Smart India Hackathon 2025 problem statement <strong>SIH25069</strong> addresses the critical need
              for an AI-driven Life Cycle Assessment (LCA) tool to enhance circularity and sustainability in
              the metallurgy and mining sectors, with an initial focus on aluminum production in India.
            </p>
            <p className="mt-4">
              Developed by <strong>Team M_Shark (Team ID: 50297)</strong>, the project proposes an intuitive, AI-powered 
              platform that automates LCA and circularity analysis. Key objectives include simplifying data input 
              through user-friendly templates and drag-and-drop interfaces, enriching datasets with machine learning (ML) 
              models trained on Indian-specific data from sources like the Bureau of Energy Efficiency (BEE), 
              Indian Bureau of Mines (IBM), and Central Electricity Authority (CEA), and providing actionable 
              insights via interactive visualizations and reports.
            </p>
            <InfoBox type="note" title="Core Platform Concept">
              <p>
                The platform calculates environmental impacts using standardized methods like <strong>TRACI 2.1</strong>, 
                visualizes linear versus circular pathways, and generates recommendations for optimization. By targeting 
                aluminum—a high-emission metal—the tool aims to reduce greenhouse gas (GHG) emissions, improve resource 
                efficiency, and support national goals such as <strong>Aatmanirbhar Bharat</strong> and <strong>Net Zero by 2070</strong>.
              </p>
            </InfoBox>
            <p className="mt-4">
              The solution integrates advanced technologies including <strong>React.js</strong> for the frontend, 
              <strong> Node.js/Express FastAPI</strong> for the backend, <strong>XGBoost</strong> for predictive modeling, and 
              <strong> Brightway2</strong> for LCA computations. Feasibility is high due to mature open-source frameworks, 
              with potential challenges like data gaps addressed through industry partnerships and innovative ML techniques. 
              This innovative tool promises significant environmental, economic, strategic, and social benefits, 
              positioning it as a scalable foundation for broader metal sectors.
            </p>
          </DocSection>

          <DocSection id="introduction" number="02" title="Introduction" icon={BookOpen}>
            <p>
              The metallurgy and mining industries are pivotal to India's economic growth, yet they face
              mounting challenges related to environmental sustainability and resource depletion.
              Aluminum production, in particular, is energy-intensive and emission-heavy, contributing
              significantly to India's GHG footprint.
            </p>
            <p className="mt-4">
              The Smart India Hackathon 2025, under the miscellaneous theme and software category, presents 
              problem statement <strong>SIH25069</strong>: <em>"AI-Driven Life Cycle Assessment (LCA) Tool for Advancing 
              Circularity and Sustainability in Metallurgy and Mining."</em>
            </p>
            <p className="mt-4">
              This report synthesizes insights from the project's flowchart diagram, idea submission document 
              (including PPT slides on title, proposed solution, technical approach, feasibility, impacts, and references), 
              and detailed aluminum lifecycle parameters to outline an innovative solution.
            </p>
            <InfoBox type="success" title="Economic Impact">
              <p>
                The proposed platform saves billions globally through reduced virgin mining, lower energy use, 
                and minimized environmental damage. Challenges remain in the form of data privacy, AI model bias, 
                user resistance, and regulatory ambiguities, but these can be overcome through explainable AI techniques, 
                user-friendly interfaces, and policy alignment.
              </p>
            </InfoBox>
          </DocSection>

          <DocSection id="problem-statement" number="03" title="Problem Statement" icon={AlertTriangle}>
            <p>
              India's metallurgy sector, especially aluminum production, is characterized by high energy
              consumption, substantial waste generation (e.g., red mud), and reliance on virgin raw
              materials, exacerbating environmental degradation and import dependencies. Conventional
              LCA tools are complex, data-intensive, and often lack region-specific accuracy, leading to
              inconsistent assessments and suboptimal decision-making.
            </p>
            <InfoBox type="warning" title="Key Issues">
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Data Gaps and Complexity:</strong> Proprietary or incomplete datasets hinder accurate LCA, particularly for cradle-to-grave boundaries.</li>
                <li><strong>Lack of Circularity Focus:</strong> Linear production models dominate, ignoring recycling yields and waste valorization opportunities.</li>
                <li><strong>User Barriers:</strong> Non-technical stakeholders struggle with existing tools, limiting adoption.</li>
                <li><strong>Emission Intensity:</strong> Aluminum accounts for significant GHG emissions, with processes like smelting consuming vast electricity and producing CO₂, PFCs, and SO₂.</li>
              </ul>
            </InfoBox>
            <p className="mt-4">
              These challenges align with national sustainability goals, including Sustainable Development
              Goals (SDGs) like responsible consumption (<strong>SDG 12</strong>) and climate action (<strong>SDG 13</strong>). 
              Without AI-driven tools, achieving circularity—such as optimizing recycling rates and reducing waste—remains inefficient.
            </p>
          </DocSection>

          <DocSection id="objective" number="04" title="Objective" icon={Target}>
            <p>The primary objectives of the project are to:</p>
            <div className="my-6 space-y-3">
              {[
                'Develop an AI-powered LCA tool that automates data input, estimation, and analysis for aluminum production chains.',
                'Enable comparative assessments of linear and circular pathways to promote resource efficiency and emission reductions.',
                'Provide region-specific predictions using ML models trained on Indian datasets (BEE, IBM, CEA) for accurate, actionable insights.',
                'Facilitate user adoption through intuitive interfaces like drag-and-drop canvases and interactive dashboards.',
                'Generate customizable reports and recommendations to support engineers, policymakers, and designers in sustainability decisions.',
                'Lay the foundation for scalability to other metals, contributing to India\'s Net Zero ambitions by 2070.'
              ].map((objective, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-white rounded-lg border border-[#BA7967]/20 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-[#BA7967] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <span className="text-gray-700">{objective}</span>
                </div>
              ))}
            </div>
          </DocSection>

          <DocSection id="literature-background" number="05" title="Literature/Background" icon={BookMarked}>
            <p>
              Life Cycle Assessment (LCA) is a standardized methodology under <strong>ISO 14040:2006</strong> and 
              <strong> ISO 14044:2006</strong>, evaluating environmental impacts across a product's lifecycle—from raw
              material extraction to disposal. In India, studies highlight the urgency of LCA for SDGs, as
              noted in <em>"The need for life cycle assessment in India for achieving the sustainable
              development goals (SDGs)"</em> (DOI: 10.20935/AL1790).
            </p>
            <p className="mt-4">
              A case study on aluminum production in India (Abdollahi Javad, DOI: 10.17352/aest.000038) reveals high impacts in
              mining and smelting stages, with red mud generation posing toxicity risks.
            </p>
            <InfoBox type="info" title="Key Data Sources">
              <ul className="list-disc list-inside space-y-1">
                <li><strong>BEE</strong> - Bureau of Energy Efficiency for grid emissions</li>
                <li><strong>IBM</strong> - Indian Bureau of Mines for mining data</li>
                <li><strong>Brightway2 & OpenLCA</strong> - Frameworks for LCA computations</li>
                <li><strong>International Aluminum Institute</strong> - Global benchmarks</li>
              </ul>
            </InfoBox>
            <p className="mt-4">
              Research underscores circularity benefits: <strong>recycling aluminum uses 5-10% of primary production energy</strong>,
              reducing CO₂ by up to 95%. JNARDDC scientists validate focusing on aluminum due to its
              emission intensity and scalability potential.
            </p>
          </DocSection>

          <DocSection id="proposed-solution" number="06" title="Proposed Solution" icon={Lightbulb}>
            <p>
              The proposed solution is an <strong>intuitive AI-powered platform</strong> that automates LCA and
              circularity analysis for the metals sector, starting with aluminum.
            </p>
            
            <h3 className="text-xl font-semibold mt-8 mb-4">Unique Selling Points</h3>
            <div className="grid md:grid-cols-2 gap-4 my-6">
              <div className="p-4 bg-white rounded-lg border border-[#BA7967]/20 shadow-sm">
                <h4 className="font-semibold text-[#BA7967] mb-2">🎨 Visual Process Canvas</h4>
                <p className="text-sm text-gray-600">A drag-and-drop interface for building custom metal production chains, accessible to non-technical users.</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-[#BA7967]/20 shadow-sm">
                <h4 className="font-semibold text-[#BA7967] mb-2">🇮🇳 India-First AI Engine</h4>
                <p className="text-sm text-gray-600">ML models (XGBoost) trained on local data for predicting over 20 parameters, including energy use, emissions, and recycling yields, with confidence scores.</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-[#BA7967]/20 shadow-sm">
                <h4 className="font-semibold text-[#BA7967] mb-2">📊 Comparative Dashboard</h4>
                <p className="text-sm text-gray-600">Side-by-side analysis of linear vs. circular pathways, using Sankey diagrams and maps for data-driven decisions.</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-[#BA7967]/20 shadow-sm">
                <h4 className="font-semibold text-[#BA7967] mb-2">⚗️ Aluminum-Specific Precision</h4>
                <p className="text-sm text-gray-600">Granular models covering seven lifecycle stages—mining, beneficiation, refining, smelting, fabrication/use, recycling, and waste valorization.</p>
              </div>
            </div>

            <InfoBox type="success" title="Platform Features">
              <p>
                The platform simplifies data input via templates, enriches datasets with AI, calculates
                impacts using <strong>TRACI 2.1</strong> (e.g., global warming potential), visualizes insights, and exports
                reports for benchmarking. Features like AI-powered imputation, wizard-based inputs, and
                customizable boundaries ensure flexibility and accuracy.
              </p>
            </InfoBox>
          </DocSection>

          <DocSection id="methodology" number="07" title="Methodology" icon={Cog}>
            <p>
              The technical approach integrates frontend, backend, AI/ML, and LCA components, as
              illustrated in the system flowchart. Aluminum lifecycle parameters are modeled granularly 
              across seven stages, incorporating methods of extraction/processing, LCA-relevant parameters, 
              and user input fields for AI-driven predictions.
            </p>

            <h3 className="text-xl font-semibold mt-8 mb-4">Detailed Aluminum Lifecycle Stages</h3>

            {/* Stage 1: Mining */}
            <div className="my-6 p-5 bg-white rounded-xl border border-[#BA7967]/20 shadow-sm">
              <h4 className="text-lg font-semibold text-[#BA7967] mb-3">1. Mining (Bauxite Extraction)</h4>
              <p className="text-gray-700">
                Bauxite mining involves extracting aluminum ore, often through surface methods that
                disrupt land and generate waste like red mud precursors. Theoretically, higher ore grades
                reduce energy intensity, while equipment type influences emissions—electric options lower
                CO₂ if powered renewably. Overburden removal contributes to soil erosion and biodiversity
                loss, emphasizing the need for sustainable practices to minimize environmental footprints.
              </p>
            </div>

            {/* Stage 2: Beneficiation */}
            <div className="my-6 p-5 bg-white rounded-xl border border-[#BA7967]/20 shadow-sm">
              <h4 className="text-lg font-semibold text-[#BA7967] mb-3">2. Beneficiation (Ore Washing, Crushing, Sorting)</h4>
              <p className="text-gray-700">
                Beneficiation refines bauxite by removing impurities, enhancing ore quality for
                downstream processes. It is energy- and water-intensive, with mechanical steps like
                crushing contributing to noise/dust pollution and chemical agents risking water
                contamination. Theoretically, dry methods save water but increase energy use, while
                effective tailings management prevents environmental hazards like slurry spills.
              </p>
            </div>

            {/* Stage 3: Alumina Refining */}
            <div className="my-6 p-5 bg-white rounded-xl border border-[#BA7967]/20 shadow-sm">
              <h4 className="text-lg font-semibold text-[#BA7967] mb-3">3. Alumina Refining (Bayer Process)</h4>
              <p className="text-gray-700">
                The Bayer process extracts alumina from bauxite using caustic soda, involving high heat and
                chemicals. Theoretically, it generates significant red mud waste, which is alkaline and toxic,
                but enhancements like heat recovery improve efficiency and reduce emissions. Boundary
                choices (e.g., cradle-to-gate) affect LCA accuracy, highlighting the need for customizable
                models.
              </p>
            </div>

            {/* Stage 4: Smelting */}
            <div className="my-6 p-5 bg-white rounded-xl border border-[#BA7967]/20 shadow-sm">
              <h4 className="text-lg font-semibold text-[#BA7967] mb-3">4. Aluminium Smelting (Hall-Héroult Process)</h4>
              <p className="text-gray-700">
                Smelting uses electrolysis to produce aluminum, consuming massive electricity and
                generating CO₂ from anodes. Theoretically, anode effects spike PFC emissions (potent
                GHGs), but inert anodes could eliminate this. Renewable power integration reduces the grid-dependent 
                carbon footprint, aligning with circularity by minimizing primary production.
              </p>
            </div>

            {/* Stage 5: Manufacturing */}
            <div className="my-6 p-5 bg-white rounded-xl border border-[#BA7967]/20 shadow-sm">
              <h4 className="text-lg font-semibold text-[#BA7967] mb-3">5. Product Manufacturing (Fabrication & Use Phase)</h4>
              <p className="text-gray-700">
                Fabrication shapes aluminum into products, with energy use varying by method. In the use
                phase, lightweighting reduces operational emissions (e.g., in transport). Theoretically,
                design for recycling minimizes end-of-life waste, promoting circularity by extending product
                lifespans and reducing maintenance-related impacts.
              </p>
            </div>

            {/* Stage 6: Recycling */}
            <div className="my-6 p-5 bg-white rounded-xl border border-[#BA7967]/20 shadow-sm">
              <h4 className="text-lg font-semibold text-[#BA7967] mb-3">6. Recycling (End-of-Life Aluminium)</h4>
              <p className="text-gray-700">
                Recycling recovers aluminum scrap, using far less energy than primary production.
                Theoretically, closed-loop systems preserve purity and maximize emission savings (up to
                95% CO₂ reduction), while sorting technologies like ML-based optical methods minimize
                contamination and improve yields.
              </p>
            </div>

            {/* Stage 7: Valorization */}
            <div className="my-6 p-5 bg-white rounded-xl border border-[#BA7967]/20 shadow-sm">
              <h4 className="text-lg font-semibold text-[#BA7967] mb-3">7. Byproduct & Waste Valorization</h4>
              <p className="text-gray-700">
                Valorization transforms wastes like red mud into valuable resources, reducing disposal
                needs. Theoretically, this closes loops by substituting virgin materials (e.g., red mud in
                cement lowers clinker emissions), mitigating toxicity risks and enhancing economic viability
                through new revenue streams.
              </p>
            </div>

            <InfoBox type="note" title="Comprehensive LCA Input Fields">
              <p>
                The platform's ML models predict parameters across stages using comprehensive inputs,
                enabling accurate imputation for all seven lifecycle stages.
              </p>
            </InfoBox>
          </DocSection>

          <DocSection id="technical-strategy" number="08" title="Technical Strategy" icon={Code}>
            <p>
              The technical approach integrates frontend, backend, AI/ML, and LCA components to deliver
              a comprehensive platform for aluminum lifecycle assessment.
            </p>

            <h3 className="text-xl font-semibold mt-8 mb-4">Technology Stack</h3>
            <div className="grid md:grid-cols-2 gap-4 my-6">
              <div className="p-4 bg-white rounded-lg border border-[#BA7967]/20 shadow-sm">
                <h4 className="font-semibold text-[#BA7967] mb-2">🖥️ Frontend</h4>
                <p className="text-sm text-gray-600">React.js with ShadCN/UI and Tailwind CSS for responsive interfaces; D3.js/SankeyChart for material flow diagrams; Mapbox/Leaflet for supply chain mapping.</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-[#BA7967]/20 shadow-sm">
                <h4 className="font-semibold text-[#BA7967] mb-2">⚙️ Backend</h4>
                <p className="text-sm text-gray-600">Express.js (Node.js) for core REST APIs and FastAPI (Python) for LCA calculations and ML model serving.</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-[#BA7967]/20 shadow-sm">
                <h4 className="font-semibold text-[#BA7967] mb-2">🤖 AI/ML Engine</h4>
                <p className="text-sm text-gray-600">Scikit-learn and XGBoost for predictive modeling; SHAP values for explainability.</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-[#BA7967]/20 shadow-sm">
                <h4 className="font-semibold text-[#BA7967] mb-2">🗄️ Database</h4>
                <p className="text-sm text-gray-600">MongoDB for flexible document storage and managing process data.</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-[#BA7967]/20 shadow-sm">
                <h4 className="font-semibold text-[#BA7967] mb-2">📄 Reporting</h4>
                <p className="text-sm text-gray-600">ReportLab/Pandas for PDF/Excel exports.</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-[#BA7967]/20 shadow-sm">
                <h4 className="font-semibold text-[#BA7967] mb-2">🔬 LCA Engine</h4>
                <p className="text-sm text-gray-600">Brightway2/FastAPI for environmental impact and circularity scoring.</p>
              </div>
            </div>

            {/* Schema Diagram with Zoom */}
            <h3 className="text-xl font-semibold mt-8 mb-4">System Architecture</h3>
            <ZoomableImage 
              src="/images/architecture.png"
              alt="ALVance System Architecture Diagram"
              caption="Figure 1: ALVance System Architecture - Use controls to zoom and pan (scroll to zoom, drag to pan)"
            />

            <h3 className="text-xl font-semibold mt-8 mb-4">Workflow</h3>
            <div className="my-6 space-y-3">
              {[
                { step: 1, title: 'User Authentication and Project Setup', desc: 'Login, create projects, select templates.' },
                { step: 2, title: 'Data Processing & AI Estimation', desc: 'Submit data; AI autofills missing fields (e.g., red mud generation) using Indian baselines.' },
                { step: 3, title: 'LCA Calculation & Visualization', desc: 'Run models (regression/classification); compute impacts (CO₂, water use); generate Sankey diagrams, charts, and recommendations.' },
                { step: 4, title: 'Reporting & Sharing', desc: 'Compile data into downloadable reports; share anonymized aggregates.' }
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4 p-4 bg-white rounded-lg border border-[#BA7967]/20 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-[#BA7967] text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{item.title}</h4>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <h3 className="text-xl font-semibold mt-8 mb-4">Expected Outcomes</h3>
            <div className="grid md:grid-cols-2 gap-4 my-6">
              <InfoBox type="success" title="Environmental Benefits">
                <p>Reduced GHG emissions and waste via circular pathways.</p>
              </InfoBox>
              <InfoBox type="success" title="Economic Benefits">
                <p>Lower costs through efficiency; new revenue from waste valorization.</p>
              </InfoBox>
              <InfoBox type="success" title="Strategic Benefits">
                <p>Enhanced supply chain resilience, reduced imports.</p>
              </InfoBox>
              <InfoBox type="success" title="Social Benefits">
                <p>Sustainable practices aligning with national goals.</p>
              </InfoBox>
            </div>

            <h3 className="text-xl font-semibold mt-8 mb-4">Stakeholder Benefits</h3>
            <div className="my-6 space-y-3">
              <div className="p-4 bg-white rounded-lg border border-[#BA7967]/20 shadow-sm">
                <h4 className="font-semibold text-[#BA7967] mb-2">🏭 Metal Producers</h4>
                <p className="text-sm text-gray-600">Optimize operations, cut costs, simplify ESG reporting.</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-[#BA7967]/20 shadow-sm">
                <h4 className="font-semibold text-[#BA7967] mb-2">📋 Policymakers</h4>
                <p className="text-sm text-gray-600">Set targets, model incentives, track circular progress.</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-[#BA7967]/20 shadow-sm">
                <h4 className="font-semibold text-[#BA7967] mb-2">🎨 Product Designers</h4>
                <p className="text-sm text-gray-600">Design for recyclability, lower footprints.</p>
              </div>
            </div>
          </DocSection>

          <DocSection id="challenges" number="09" title="Challenges" icon={Puzzle}>
            <p>
              The project anticipates several challenges in implementation, each addressed through
              strategic solutions backed by research and practical methodologies.
            </p>

            <div className="my-6 space-y-4">
              <div className="p-5 bg-white rounded-xl border border-[#BA7967]/20 shadow-sm">
                <h4 className="text-lg font-semibold text-[#BA7967] mb-3">📊 Data Availability</h4>
                <p className="text-gray-700 mb-3">
                  Proprietary mining and process data often lead to gaps, complicating accurate LCA.
                </p>
                <div className="p-3 bg-emerald-50 rounded-lg border-l-4 border-emerald-400">
                  <p className="text-sm text-emerald-900">
                    <strong>Solution:</strong> Forge partnerships with industry and research institutions for data sharing. 
                    The platform employs AI-powered data imputation using XGBoost models to predict over 20 critical 
                    parameters (e.g., energy use, red mud generation) from existing empirical datasets, incorporating 
                    confidence scores for reliability.
                  </p>
                </div>
              </div>

              <div className="p-5 bg-white rounded-xl border border-[#BA7967]/20 shadow-sm">
                <h4 className="text-lg font-semibold text-[#BA7967] mb-3">🔄 LCA Complexity</h4>
                <p className="text-gray-700 mb-3">
                  Varying system boundaries (e.g., cradle-to-gate vs. cradle-to-grave) can risk misleading results due to inconsistent inclusions.
                </p>
                <div className="p-3 bg-emerald-50 rounded-lg border-l-4 border-emerald-400">
                  <p className="text-sm text-emerald-900">
                    <strong>Solution:</strong> Allow users to customize boundaries and assumptions via the intuitive interface, 
                    ensuring flexibility and reducing uncertainty through explicit definitions. Incorporate hybrid approaches 
                    for boundary selection, combining process-based and input-output methods.
                  </p>
                </div>
              </div>

              <div className="p-5 bg-white rounded-xl border border-[#BA7967]/20 shadow-sm">
                <h4 className="text-lg font-semibold text-[#BA7967] mb-3">👥 User Adoption</h4>
                <p className="text-gray-700 mb-3">
                  Non-tech-savvy metallurgists may resist complex tools.
                </p>
                <div className="p-3 bg-emerald-50 rounded-lg border-l-4 border-emerald-400">
                  <p className="text-sm text-emerald-900">
                    <strong>Solution:</strong> The platform features a Visual Process Canvas with drag-and-drop workflows, 
                    wizard-based inputs, and defaults/templates for easy onboarding. Enhanced UI elements, such as 
                    simplified dashboards, further drive adoption by non-experts.
                  </p>
                </div>
              </div>

              <div className="p-5 bg-white rounded-xl border border-[#BA7967]/20 shadow-sm">
                <h4 className="text-lg font-semibold text-[#BA7967] mb-3">⚡ Scalability</h4>
                <p className="text-gray-700 mb-3">
                  Large datasets and ML computations can slow performance at scale.
                </p>
                <div className="p-3 bg-emerald-50 rounded-lg border-l-4 border-emerald-400">
                  <p className="text-sm text-emerald-900">
                    <strong>Solution:</strong> Implement cloud-based compute (e.g., AWS/Docker) and result caching to optimize 
                    processing. Additionally, surrogate ML models will approximate LCA results for faster iterations, 
                    reducing computational load while maintaining accuracy.
                  </p>
                </div>
              </div>
            </div>

            <InfoBox type="info" title="Feasibility Assessment">
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Technical:</strong> High (mature tools like PyTorch, Plotly.js)</li>
                <li><strong>Economic:</strong> Medium (subscription model offsets costs)</li>
                <li><strong>Operational:</strong> High (easy UI enables adoption)</li>
              </ul>
            </InfoBox>
          </DocSection>

          <DocSection id="future-scope" number="10" title="Future Scope" icon={Rocket}>
            <p>
              The platform's aluminum-focused core provides a validated foundation for expansion to
              other metals like steel or copper. Future enhancements could include real-time data
              integration, blockchain for traceability, and advanced ML for predictive simulations.
            </p>
            <p className="mt-4">
              Integration with government APIs and broader datasets will enhance national scalability,
              supporting India's circular economy transition.
            </p>
            <div className="my-6 space-y-3">
              {[
                { phase: 'Phase 1', title: 'Core Enhancements', desc: 'Real-time data integration and improved ML models' },
                { phase: 'Phase 2', title: 'Advanced Analytics', desc: 'Blockchain for traceability and predictive simulations' },
                { phase: 'Phase 3', title: 'Industry Integration', desc: 'Government API integration and expansion to steel/copper' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-lg border border-[#BA7967]/20 shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#BA7967] to-[#6B5B59] text-white flex items-center justify-center text-sm font-bold">
                    {item.phase.split(' ')[1]}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{item.title}</h4>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </DocSection>

          <DocSection id="conclusion" number="11" title="Conclusion" icon={CheckCircle}>
            <p>
              This AI-driven LCA tool represents an <strong>innovative, feasible, and impactful solution</strong> to
              sustainability challenges in metallurgy and mining. By automating complex assessments and
              providing India-specific insights, it empowers stakeholders to adopt circular practices,
              reduce environmental footprints, and achieve economic gains.
            </p>
            <p className="mt-4">
              Grounded in robust research and technology, the project aligns with global standards and national 
              priorities, paving the way for a greener industrial future.
            </p>
            <InfoBox type="success" title="Project Impact Summary">
              <ul className="list-disc list-inside space-y-1">
                <li>Automates complex LCA assessments with AI</li>
                <li>Provides India-specific insights and predictions</li>
                <li>Empowers stakeholders to adopt circular practices</li>
                <li>Reduces environmental footprints and achieves economic gains</li>
                <li>Aligns with Aatmanirbhar Bharat and Net Zero 2070 goals</li>
              </ul>
            </InfoBox>
          </DocSection>

          <DocSection id="references" number="12" title="References" icon={Link2}>
            <p className="mb-6">
              The following references, citations, and resources were used in developing this project:
            </p>
            <div className="my-4 space-y-3">
              <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                <a 
                  href="https://www.agriscigroup.us/articles/AEST-5-138.php" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block px-2 py-1 bg-[#BA7967]/10 text-[#BA7967] text-xs font-bold rounded mb-2 hover:bg-[#BA7967] hover:text-white transition-colors cursor-pointer"
                >
                  [1] ↗
                </a>
                <p className="text-gray-700">
                  Abdollahi Javad. DOI: 10.17352/aest.000038 (2021). <em>"Life cycle assessment of aluminium production in India: A case study."</em> Science of The Total Environment.
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                <a 
                  href="https://www.researchgate.net/publication/353079734_Environmental_impact_assessment_of_aluminium_production_using_the_life_cycle_assessment_tool_and_multi-criteria_analysis" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block px-2 py-1 bg-[#BA7967]/10 text-[#BA7967] text-xs font-bold rounded mb-2 hover:bg-[#BA7967] hover:text-white transition-colors cursor-pointer"
                >
                  [2] ↗
                </a>
                <p className="text-gray-700">
                  Abhijeet Digalwar. DOI: 10.1108/MBE-09-2012-0046 (2022). <em>"Green Manufacturing Practices and Sustainable Performance: An Empirical Study of the Indian Aluminium Industry."</em> Sustainability.
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                <a 
                  href="https://www.iso.org/standard/37456.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block px-2 py-1 bg-[#BA7967]/10 text-[#BA7967] text-xs font-bold rounded mb-2 hover:bg-[#BA7967] hover:text-white transition-colors cursor-pointer"
                >
                  [3] ↗
                </a>
                <p className="text-gray-700">
                  International Organization for Standardization. (2006). <em>ISO 14040:2006 Environmental management — Life cycle assessment — Principles and framework.</em>
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                <a 
                  href="https://beeindia.gov.in/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block px-2 py-1 bg-[#BA7967]/10 text-[#BA7967] text-xs font-bold rounded mb-2 hover:bg-[#BA7967] hover:text-white transition-colors cursor-pointer"
                >
                  [4] ↗
                </a>
                <p className="text-gray-700">
                  Bureau of Energy Efficiency (BEE), Government of India. (2023). <em>National Energy Data Archive.</em>
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                <a 
                  href="https://ibm.gov.in/IBMPortal/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block px-2 py-1 bg-[#BA7967]/10 text-[#BA7967] text-xs font-bold rounded mb-2 hover:bg-[#BA7967] hover:text-white transition-colors cursor-pointer"
                >
                  [5] ↗
                </a>
                <p className="text-gray-700">
                  Indian Bureau of Mines (IBM), Ministry of Mines. (2023). <em>Indian Minerals Yearbook.</em>
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                <a 
                  href="https://www.icmm.com/en-gb/research/innovation/2025/measuring-circularity-within-metals-values-chains" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block px-2 py-1 bg-[#BA7967]/10 text-[#BA7967] text-xs font-bold rounded mb-2 hover:bg-[#BA7967] hover:text-white transition-colors cursor-pointer"
                >
                  [6] ↗
                </a>
                <p className="text-gray-700">
                  International Council on Mining and Metals (ICMM). (2022). <em>"Measuring Circularity Within Metals Value Chains."</em>
                </p>
              </div>
            </div>
          </DocSection>

          {/* Footer */}
          <footer className="mt-16 pt-8 border-t-2 border-[#BA7967]/20 text-center text-gray-500">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-[#BA7967] to-[#6B5B59] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AL</span>
              </div>
              <span className="font-bold text-lg text-gray-700">ALVance</span>
            </div>
            <p className="text-sm">
              Smart India Hackathon 2025 • Problem Statement SIH25069
            </p>
            <p className="text-sm mt-1">
              AI-Driven Life Cycle Assessment Tool for Metallurgy and Mining
            </p>
            <p className="text-xs mt-3 text-gray-400">
              © 2025 Team M_Shark (ID: 50297). All rights reserved.
            </p>
          </footer>
        </div>
      </main>

      {/* Back to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 p-3 bg-gradient-to-br from-[#BA7967] to-[#6B5B59] text-white rounded-full shadow-lg hover:shadow-xl transform transition-all duration-300 z-50 ${
          showBackToTop ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'
        }`}
      >
        <ChevronUp size={24} />
      </button>
    </div>
  );
}