import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Leaf, Droplet, Wind, Recycle, Factory, Zap, AlertCircle } from 'lucide-react';

const stageIcons = {
  mining: Factory,
  beneficiation: Droplet,
  refining: Wind,
  manufacturing: Factory,
  recycling: Recycle,
  valorization: Leaf
};

// Rule-based recommendation system for Copper
const sustainableSolutionsRules = {
  mining: {
    title: "Sustainable Copper Mining Solutions",
    rules: [
      {
        condition: (formData) => {
          const methods = formData?.miningMethod || '';
          return methods.includes('open-pit') || methods.includes('strip');
        },
        category: "Overburden & Waste Rock Management",
        recommendation: "Repurpose overburden and waste rock for backfilling exhausted pits, creating embankments, using as road base material, or producing construction aggregate. This reduces the need for fresh materials, cuts hauling emissions, and accelerates site rehabilitation."
      },
      {
        condition: (formData) => formData?.tailingsProducedTonnePerTonne > 0,
        category: "Tailings Valorization",
        recommendation: "Reprocess tailings to extract additional metals, use stabilized tailings for brick manufacturing, road base construction, or as cement feed after chemical stabilization. This converts waste into valuable products and reduces environmental liability."
      },
      {
        condition: (formData) => {
          const methods = formData?.miningMethod || '';
          return methods.includes('open-pit') || methods.includes('underground');
        },
        category: "Dust Emission Control (PM10/PM2.5)",
        recommendation: "Install bag filters on conveyors, implement water spray systems at dust generation points, plant vegetative barriers around haul roads, and use enclosed conveyor systems. This protects worker health and reduces environmental impact."
      },
      {
        condition: (formData) => formData?.waterSource === 'natural' || formData?.acidMineDrainage > 0,
        category: "Acid Mine Drainage (AMD) Management",
        recommendation: "Treat AMD with lime neutralization, construct wetlands for passive treatment, and recover metals (Fe, Cu, Zn) from precipitates. This prevents water contamination and creates value from waste streams."
      },
      {
        condition: (formData) => formData?.blastingFrequency > 0 || formData?.explosivesUsed > 0,
        category: "Explosive Residue & Blast Optimization",
        recommendation: "Ensure proper disposal of explosive residue, recycle packaging materials, optimize blast design to reduce charge size and frequency, and schedule blasts during low-impact times to minimize community disturbance."
      },
      {
        condition: (formData) => formData?.mineEffluents > 0 || formData?.waterUsage > 50,
        category: "Mine Effluent Management",
        recommendation: "Use settling ponds to remove suspended solids, reuse treated water for dust suppression and mining operations, and implement advanced treatment systems for contaminated water. This reduces freshwater consumption and prevents pollution."
      },
      {
        condition: (formData) => formData?.equipmentType === 'diesel' || formData?.fuelConsumption > 0,
        category: "Diesel Exhaust Reduction",
        recommendation: "Switch to electric or hybrid mining vehicles, use biodiesel blends where feasible, optimize haul routes to reduce fuel consumption, and implement idle-time reduction policies. This decreases GHG emissions and improves air quality."
      },
      {
        condition: (formData) => formData?.noiseLevel === 'High' || formData?.vibrationLevel > 0,
        category: "Noise & Vibration Control",
        recommendation: "Optimize blast design to reduce vibration impacts, schedule noisy operations during approved times, install noise barriers around high-noise zones, and use vibration monitoring systems to ensure compliance."
      }
    ]
  },
  beneficiation: {
    title: "Sustainable Copper Beneficiation Solutions",
    rules: [
      {
        condition: (formData) => formData?.beneficiation_tailings_t_per_t > 0 || formData?.tailingsProducedTonnePerTonne > 0,
        category: "Tailings Utilization (Silicates & Iron Oxides)",
        recommendation: "Use tailings in brick manufacturing, road base construction, or cement raw feed after chemical stabilization. Implement dry stacking or paste tailings to reduce water loss and improve stability. This converts waste into marketable products."
      },
      {
        condition: (formData) => {
          const flotationType = formData?.flotationCellType || '';
          return flotationType.includes('mechanical') || flotationType.includes('pneumatic') || flotationType.includes('column');
        },
        category: "Chemical-Laden Flotation Residue",
        recommendation: "Implement advanced chemical recovery systems to reclaim reagents, switch to biodegradable reagents where possible (bio-based collectors, depressants), and treat residual chemicals before discharge. This reduces environmental impact and operational costs."
      },
      {
        condition: (formData) => formData?.thickenerUnderflow > 0 || formData?.waterConsumption > 100,
        category: "Thickener Underflow & Water Recovery",
        recommendation: "Use dry stacking technology to reduce water consumption, implement water recovery systems from thickener underflow, and maximize water recycling in closed-loop systems. This significantly reduces freshwater demand."
      },
      {
        condition: (formData) => formData?.filtrationCake > 0 || formData?.concentrateGrade > 0,
        category: "Filtration Cake Management",
        recommendation: "Extract residual copper and valuable metals from filtration cake, stabilize and use in construction materials after metal recovery, and optimize filtration processes to maximize metal recovery rates."
      },
      {
        condition: (formData) => formData?.waterRecycledPercent < 70 || formData?.beneficiation_water_m3_per_t > 2,
        category: "Process Water with Reagents",
        recommendation: "Implement closed-loop water recycling systems, use advanced treatment methods like membrane filtration to remove reagents, and maximize water reuse to reduce freshwater intake by 60-80%."
      },
      {
        condition: (formData) => formData?.dustEmissions > 0 || formData?.airborneParticulateMatter > 0,
        category: "Airborne Dust Control",
        recommendation: "Install bag filters on crushers and conveyors, use electrostatic precipitators for fine particles, enclose dust-generating equipment, and implement continuous monitoring systems. This protects worker health and reduces emissions."
      },
      {
        condition: (formData) => formData?.grindingMediaUsed > 0 || formData?.equipmentAgeYears > 10,
        category: "Spent Grinding Media Recovery",
        recommendation: "Recycle spent grinding media (steel balls, rods) as scrap steel for remanufacturing. This creates a circular economy for wear components and reduces waste."
      },
      {
        condition: (formData) => formData?.noiseLevel === 'High' || formData?.crushingCapacity > 500,
        category: "Noise Pollution Control",
        recommendation: "Install acoustic enclosures around ball mills, rod mills, and crushers. Use sound-damping panels on high-noise equipment to reduce noise pollution and improve worker safety."
      }
    ]
  },
  refining: {
    title: "Sustainable Copper Refining Solutions (Pyrometallurgical)",
    rules: [
      {
        condition: (formData) => formData?.slagGeneration > 0 || formData?.pyro_slagRecyclingRate < 80,
        category: "Copper Slag Valorization (Iron Silicate Rich)",
        recommendation: "Use copper slag as cement additive (replacing clinker), construction aggregate for roads and concrete, abrasive media for sandblasting, or railroad ballast. Slag can replace 15-25% of cement content in concrete mixes."
      },
      {
        condition: (formData) => formData?.so2Emissions > 0 || formData?.refining_energy_kWh_per_t_Cu > 500,
        category: "SO₂ Emissions Capture",
        recommendation: "Capture SO₂ emissions in acid plants to produce sulfuric acid (H₂SO₄). This converts a pollutant into a valuable product that can be sold to chemical industry or reused in leaching operations, achieving >95% SO₂ capture efficiency."
      },
      {
        condition: (formData) => formData?.sulfuricAcidProduced > 0,
        category: "Sulfuric Acid Utilization",
        recommendation: "Sell sulfuric acid to chemical, fertilizer, and battery industries, or reuse internally for heap leaching and SX-EW operations. This creates a valuable revenue stream from emissions control."
      },
      {
        condition: (formData) => formData?.flueDust > 0 || formData?.particulateMatterEmissions > 0,
        category: "Flue Dust Recovery (Cu, Pb, As)",
        recommendation: "Return captured flue dust to smelting furnaces for metal recovery, or use hydrometallurgical treatment to extract copper, lead, and arsenic. This recovers valuable metals and reduces hazardous waste."
      },
      {
        condition: (formData) => formData?.anodeSlime > 0 || formData?.refining_precious_metals_recovery_percent < 90,
        category: "Anode Slime Recovery (Precious Metals)",
        recommendation: "Extract gold (Au), silver (Ag), selenium (Se), tellurium (Te), platinum (Pt), and palladium (Pd) from anode slime through specialized refining. This high-value stream can significantly improve process economics."
      },
      {
        condition: (formData) => formData?.wasteHeatGenerated > 0 || formData.pyro_wasteHeatCapturePercent < 50,
        category: "Waste Heat Recovery",
        recommendation: "Capture waste heat from smelting furnaces for steam generation, electricity production via ORC (Organic Rankine Cycle), or pre-heating of feed materials. This reduces total energy demand by 10-20%."
      },
      {
        condition: (formData) => formData?.refractoryWaste > 0 || formData?.furnaceMaintenance > 0,
        category: "Spent Refractories Management",
        recommendation: "Use spent refractories as low-grade construction material, road base, or aggregate after crushing. Some refractories can be recycled into new refractory products."
      },
      {
        condition: (formData) => formData?.acidPlantBlowdown > 0 || formData?.wastewaterGenerated > 0,
        category: "Acid Plant Blowdown Treatment",
        recommendation: "Neutralize acid plant blowdown and recover dissolved metals (Cu, As, Se) through precipitation. Treat wastewater to meet discharge standards and maximize water recycling."
      }
    ]
  },
  manufacturing: {
    title: "Sustainable Copper Manufacturing Solutions",
    rules: [
      {
        condition: (formData) => {
          const processes = formData?.manufacturingProcesses || [];
          return processes.includes('rolling') || processes.includes('drawing') || processes.includes('forming') || formData?.manufacturing_scrap_recovery_percent > 0;
        },
        category: "Scrap Recovery (Trimmings & Offcuts)",
        recommendation: "Implement closed-loop recycling by remelting scrap (trimmings, offcuts, turnings) in on-site furnaces. Copper scrap recycling uses 85-90% less energy than primary production and maintains material quality."
      },
      {
        condition: (formData) => formData?.drossGeneration > 0 || formData?.meltingLoss > 2,
        category: "Dross Recovery from Melting",
        recommendation: "Send dross to specialized dross processing facilities to recover residual copper through crushing, screening, and gravity separation. Recovery rates can reach 50-70% of copper content."
      },
      {
        condition: (formData) => {
          const treatments = formData?.surfaceTreatment || [];
          return treatments.includes('pickling') || treatments.includes('plating') || treatments.includes('coating');
        },
        category: "Waste Sludges Management (Pickling/Plating)",
        recommendation: "Implement acid regeneration systems to recover and reuse pickling acids, extract copper and other metals from plating sludges through hydrometallurgical methods, and neutralize residual sludge for safe disposal."
      },
      {
        condition: (formData) => formData?.lubricantUsage > 0 || formData?.coolingOilUsage > 0,
        category: "Used Oils & Lubricants Recovery",
        recommendation: "Regenerate used lubricants and cutting fluids through filtration and chemical treatment, recover energy from non-regenerable oils via co-processing in cement kilns, and implement oil-mist collection systems to minimize losses."
      },
      {
        condition: (formData) => formData?.filterWaste > 0 || formData?.particulateCaptured > 0,
        category: "Solid Waste from Filters",
        recommendation: "Recover copper from filter cakes and dust through smelting or hydrometallurgical treatment. Return high-grade filter solids to melting furnaces for metal recovery."
      },
      {
        condition: (formData) => formData?.waterUsage > 100 || formData?.coolingWaterFlow > 500,
        category: "Cooling Wastewater Management",
        recommendation: "Implement closed-circuit cooling systems with heat exchangers to eliminate water discharge, treat and reuse cooling water in multiple cycles, and use cooling towers to maximize water efficiency. This reduces freshwater consumption by 80-95%."
      },
      {
        condition: (formData) => formData?.wasteHeatGenerated > 0 || formData?.furnaceEfficiency < 70,
        category: "Waste Heat Recovery",
        recommendation: "Capture waste heat from melting and casting operations for preheating raw materials, space heating, or electricity generation using ORC systems. This reduces overall energy demand by 10-15%."
      },
      {
        condition: (formData) => formData?.packagingWaste > 0 || formData?.productTransport > 0,
        category: "Packaging Waste Reduction",
        recommendation: "Implement reusable packaging systems (pallets, containers, spools), establish recycling programs for cardboard and plastics, and optimize packaging design to minimize material use."
      },
      {
        condition: (formData) => formData?.wearDebris > 0 || formData?.toolReplacement > 0,
        category: "Wear Debris Management",
        recommendation: "Refurbish worn tools and dies when possible, recycle worn copper components as high-quality scrap, and implement predictive maintenance to extend equipment life."
      }
    ]
  },
  recycling: {
    title: "Sustainable Copper Recycling Solutions",
    rules: [
      {
        condition: (formData) => {
          const scrapSources = formData?.scrapSource || [];
          return scrapSources.includes('industrial') || scrapSources.includes('post-consumer') || scrapSources.includes('demolition');
        },
        category: "Slag from Remelting",
        recommendation: "Use remelting slag as construction material after metal recovery, incorporate into cement as additive, or process for residual copper extraction. Slag can contain 1-5% recoverable copper."
      },
      {
        condition: (formData) => {
          const sortingMethods = formData?.sortingMethod || [];
          return sortingMethods.includes('manual') || sortingMethods.includes('automated');
        },
        category: "Dust & Filter Cake Recovery",
        recommendation: "Return captured dust and filter cakes to smelting furnaces for copper recovery, or use hydrometallurgical treatment for fine materials. This recovers 70-90% of copper content in dust."
      },
      {
        condition: (formData) => {
          const preTreatment = formData?.preTreatmentType || [];
          return preTreatment.includes('paint-removal') || preTreatment.includes('coating-removal') || preTreatment.includes('cleaning');
        },
        category: "Organic Residues (Paint, Coatings)",
        recommendation: "Use thermal treatment to convert organic coatings into Refuse-Derived Fuel (RDF), implement pyrolysis to recover oils and gases, or co-process in cement kilns for energy recovery. This eliminates waste and generates value."
      },
      {
        condition: (formData) => {
          const scrapSources = formData?.scrapSource || [];
          return scrapSources.includes('electrical-wire') || scrapSources.includes('cable') || scrapSources.includes('electronics');
        },
        category: "Plastic/Insulation Waste",
        recommendation: "Separate plastics and use as RDF fuel in cement kilns or power plants, implement chemical recycling (pyrolysis) to recover monomers, or recover energy through controlled incineration with emission controls."
      },
      {
        condition: (formData) => formData?.contaminantLevel > 0 || formData?.alloyMixing === 'yes',
        category: "Contaminants Recovery (Pb, Sn, Zn)",
        recommendation: "Recover lead, tin, and zinc through selective oxidation and slag treatment during refining, separate contaminated alloys through fractional crystallization, and produce specialty alloys from high-purity recovered metals."
      },
      {
        condition: (formData) => formData?.saltSlagGeneration > 0 || formData?.fluxUsage > 0,
        category: "Salt Slag Management",
        recommendation: "Recover salts (NaCl, KCl) from salt slag through washing and crystallization, use inert residue after salt recovery in construction materials, and minimize salt slag generation through optimized flux management."
      },
      {
        condition: (formData) => {
          const sortingMethods = formData?.sortingMethod || [];
          return sortingMethods.length > 0;
        },
        category: "Non-Metallic Fractions",
        recommendation: "Use non-metallic fractions (ceramics, glass, plastics) in construction materials like concrete aggregates, minimize landfill disposal through comprehensive recovery programs, and develop markets for separated non-metallic materials."
      },
      {
        condition: (formData) => formData?.wastewaterGenerated > 0 || formData?.cleaningWater > 0,
        category: "Wastewater from Cleaning",
        recommendation: "Recover dissolved copper from cleaning wastewater through precipitation or ion exchange, recycle treated water in closed-loop systems, and implement zero liquid discharge (ZLD) systems where feasible."
      }
    ]
  },
  valorization: {
    title: "Sustainable Copper Byproduct Valorization",
    rules: [
      {
        condition: (formData) => formData?.slagQuantity > 0 || formData?.slagGeneration > 0,
        category: "Slag Valorization (All Types)",
        recommendation: "Use copper slag as cement additive (10-30% replacement), produce construction aggregate for roads and concrete, manufacture abrasive media for sandblasting, or use as railroad ballast. Global copper slag utilization rate should target >80%."
      },
      {
        condition: (formData) => formData?.tailingsQuantity > 0 || formData?.beneficiationTailings > 0,
        category: "Tailings Reprocessing & Utilization",
        recommendation: "Reprocess old tailings for copper and associated metals (Mo, Au, Ag), use stabilized tailings in construction materials (bricks, blocks, cement), implement paste backfill for mine void filling, and extract rare earth elements where economically viable."
      },
      {
        condition: (formData) => formData?.dustQuantity > 0 || formData?.filterCakeQuantity > 0,
        category: "Dust & Filter Cake Recovery",
        recommendation: "Return dust and filter cakes to pyrometallurgical processes for copper recovery, use hydrometallurgical treatment for fine materials with high copper content, and recover associated metals (As, Pb, Zn) as valuable by-products."
      },
      {
        condition: (formData) => formData?.acidicEffluents > 0 || formData?.wastewaterGenerated > 0,
        category: "Acidic Effluents Management",
        recommendation: "Neutralize acidic effluents with lime or limestone to recover metals as precipitates, extract valuable metals (Cu, Zn, Ni) before neutralization, adjust pH for safe discharge or reuse, and implement water recycling to minimize discharge volumes."
      },
      {
        condition: (formData) => formData?.spentSolutions > 0 || formData?.leachSolutions > 0,
        category: "Spent Solutions Recovery",
        recommendation: "Regenerate sulfuric acid from spent leach solutions through evaporation and crystallization, recover organic solvents from solvent extraction (SX) operations through distillation, implement regeneration systems to extend solution life, and extract metals before disposal."
      },
      {
        condition: (formData) => formData?.anodeSlime > 0 || formData?.preciousMetalsContent > 0,
        category: "Anode Slime Valorization",
        recommendation: "Establish dedicated precious metals recovery facilities for Au, Ag, Se, Te, Pt, and Pd extraction from anode slime. These high-value metals can contribute 5-15% of copper refinery revenues and improve overall process economics."
      },
      {
        condition: (formData) => formData?.organicSolventWaste > 0 || formData?.extractionSolventUsed > 0,
        category: "Organic Solvent Waste Recovery",
        recommendation: "Implement advanced distillation and separation technologies to recover and reuse extraction solvents (LIX, Acorga), minimize solvent losses through improved SX circuit design, and treat degraded solvents through regeneration processes."
      },
      {
        condition: (formData) => formData?.heavyMetalSludge > 0 || formData?.precipitates > 0,
        category: "Heavy-Metal Sludge Management",
        recommendation: "Extract valuable metals (Cu, Ni, Co, Zn) from heavy-metal sludges through selective leaching, stabilize residual sludge for safe disposal using cement or pozzolanic materials, and implement continuous metal recovery to minimize sludge generation."
      },
      {
        condition: (formData) => formData?.wasteHeatAvailable > 0 || formData?.energyIntensity > 2000,
        category: "Waste Heat Recovery (Cross-Stage)",
        recommendation: "Capture waste heat from smelting and refining for steam generation and electricity production using ORC technology, use recovered heat for process preheating and space heating, and integrate waste heat into district heating systems where feasible. This reduces overall energy costs by 15-25%."
      },
      {
        condition: (formData) => formData?.waterConsumption > 100 || formData?.wastewaterVolume > 50,
        category: "Water Streams Management",
        recommendation: "Implement closed-loop water systems to minimize freshwater intake, achieve zero liquid discharge (ZLD) through advanced treatment (RO, evaporation), recycle process water across multiple stages, and use treated water for non-critical applications like dust suppression."
      },
      {
        condition: (formData) => formData?.researchBudget > 0 || formData?.innovationFocus === true,
        category: "Innovation & Technology Development",
        recommendation: "Invest in R&D for new valorization methods (bacterial leaching, electrochemical recovery), collaborate with universities on pilot projects, develop markets for novel by-products, and share knowledge across industry to accelerate circular economy adoption."
      },
      {
        condition: (formData) => formData?.landfillWaste > 0 || formData?.wasteToLandfill > 0,
        category: "Zero Waste Strategy",
        recommendation: "Develop comprehensive waste characterization programs to identify all valorization opportunities, create partnerships with industries that can utilize copper by-products, track progress toward zero-waste-to-landfill goals, and establish take-back programs for end-of-life copper products."
      }
    ]
  }
};

// General sustainability recommendations for each stage (shown when no specific rules match)
const generalRecommendations = {
  mining: [
    { category: "Resource Efficiency", recommendation: "Optimize ore extraction rates and minimize waste rock generation through precise drilling and blasting techniques. Target 95%+ ore recovery rates." },
    { category: "Water Conservation", recommendation: "Implement water recycling systems and monitor water quality to reduce freshwater consumption by 40-60% and prevent contamination of local water sources." },
    { category: "Progressive Rehabilitation", recommendation: "Begin mine site rehabilitation concurrently with operations to reduce long-term environmental impact and closure costs. Establish native vegetation and restore ecosystems." }
  ],
  beneficiation: [
    { category: "Energy Management", recommendation: "Monitor and optimize energy consumption in crushing and grinding operations, which typically account for 50-70% of beneficiation energy use. Implement variable frequency drives (VFDs)." },
    { category: "Chemical Management", recommendation: "Use environmentally friendly reagents where possible (bio-based collectors, biodegradable flocculants) and implement closed-loop systems to minimize chemical discharge." },
    { category: "Tailings Best Practices", recommendation: "Consider dry stacking or paste tailings technologies to reduce water consumption by 30-50% and improve tailings storage facility stability and safety." }
  ],
  refining: [
    { category: "By-product Utilization", recommendation: "Explore markets for all by-products including copper slag (cement industry), sulfuric acid (chemical industry), and anode slime (precious metals refiners) to move toward zero-waste operations." },
    { category: "Energy Optimization", recommendation: "Implement waste heat recovery systems and optimize furnace temperatures to reduce energy consumption per tonne of copper produced by 15-25%." },
    { category: "Emission Control", recommendation: "Install modern acid plants to capture 95%+ of SO₂ emissions and convert to sulfuric acid, ensuring compliance with air quality standards while generating revenue." }
  ],
  manufacturing: [
    { category: "Material Efficiency", recommendation: "Minimize scrap generation through optimized cutting patterns, precision manufacturing, and design for manufacturing principles. Target 95%+ material yield rates." },
    { category: "Circular Economy", recommendation: "Design products for disassembly and recyclability to facilitate end-of-life material recovery and reuse. Use mono-material designs where possible." },
    { category: "Clean Production", recommendation: "Use water-based coatings and non-toxic materials where possible to reduce environmental impact and worker exposure. Eliminate hazardous substances." }
  ],
  recycling: [
    { category: "Collection Infrastructure", recommendation: "Develop comprehensive collection systems and partnerships to increase the availability of high-quality copper scrap. Target 90%+ collection rates for end-of-life copper." },
    { category: "Sorting Technology", recommendation: "Invest in advanced sorting technologies like X-ray fluorescence (XRF), laser-induced breakdown spectroscopy (LIBS), and AI systems to improve alloy separation and purity." },
    { category: "Quality Control", recommendation: "Implement strict quality control procedures to minimize contamination and maximize the value of recycled copper. Copper can be recycled indefinitely without quality loss." }
  ],
  valorization: [
    { category: "Innovation Focus", recommendation: "Invest in research and development to find new uses for industrial waste streams and by-products from copper production. Target 80%+ valorization rate for all waste streams." },
    { category: "Industry Partnerships", recommendation: "Collaborate with cement, construction, and chemical industries that can utilize your waste streams as raw materials, creating industrial symbiosis relationships." },
    { category: "Market Development", recommendation: "Develop markets for valorized products (slag aggregates, sulfuric acid, precious metals) and demonstrate their technical and economic viability to potential customers." }
  ]
};

// Evaluate rules and return matching recommendations
const evaluateRules = (stage, formData) => {
  const stageRules = sustainableSolutionsRules[stage];
  if (!stageRules) return { title: '', recommendations: [] };

  const matchingRecommendations = stageRules.rules
    .filter(rule => {
      try {
        return rule.condition(formData || {});
      } catch (error) {
        console.error('Error evaluating rule:', error);
        return false;
      }
    })
    .map(rule => ({
      category: rule.category,
      recommendation: rule.recommendation
    }));

  // If no specific recommendations match, return general recommendations for the stage
  if (matchingRecommendations.length === 0 && generalRecommendations[stage]) {
    return {
      title: stageRules.title,
      recommendations: generalRecommendations[stage],
      isGeneral: true
    };
  }

  return {
    title: stageRules.title,
    recommendations: matchingRecommendations,
    isGeneral: false
  };
};

export default function CopperSustainableSolutionsModal({ open, onClose, stage, formData }) {
  if (!stage || !sustainableSolutionsRules[stage]) {
    return null;
  }

  const { title, recommendations, isGeneral } = evaluateRules(stage, formData);
  const IconComponent = stageIcons[stage] || Leaf;
  const hasRecommendations = recommendations.length > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-100">
              <IconComponent className="w-6 h-6 text-orange-600" />
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              {title}
            </DialogTitle>
          </div>
        </DialogHeader>
        
        <ScrollArea className="h-[calc(85vh-120px)] pr-4">
          {isGeneral && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-2xl">ℹ️</span>
                <div>
                  <h4 className="font-semibold text-amber-900 mb-1">General Recommendations</h4>
                  <p className="text-sm text-amber-800">
                    Fill in more form fields to receive specific recommendations tailored to your copper operations. 
                    Below are general best practices for this stage.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-6 mt-4">
            {recommendations.map((item, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 px-3 py-1">
                    {item.category}
                  </Badge>
                </div>
                <div className="flex items-start gap-3 text-gray-700">
                  <span className="text-orange-600 mt-1 shrink-0">🔶</span>
                  <span className="text-sm leading-relaxed">{item.recommendation}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-5 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Implementation Tip</h4>
                <p className="text-sm text-blue-800 leading-relaxed">
                  Start with quick wins that require minimal investment but provide immediate benefits. 
                  For copper operations, prioritize sulfuric acid production from SO₂ capture and copper slag valorization. 
                  Gradually implement more complex solutions as you build capacity and demonstrate ROI. 
                  Measure and track the impact of each initiative to justify further investment in sustainability.
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
