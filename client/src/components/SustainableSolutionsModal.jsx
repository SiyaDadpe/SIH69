import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Leaf, Droplet, Wind, Recycle, Factory, Zap, AlertCircle } from 'lucide-react';

const stageIcons = {
  mining: Factory,
  beneficiation: Droplet,
  refining: Wind,
  smelting: Zap,
  manufacturing: Factory,
  recycling: Recycle,
  valorization: Leaf
};

// Rule-based recommendation system
// Rule-based recommendation system
const sustainableSolutionsRules = {
  mining: {
    title: "Sustainable Mining Solutions",
    rules: [
      {
        condition: (formData) => {
          const processes = formData?.applicableProcesses || [];
          return processes.includes('strip') || processes.includes('openPit');
        },
        category: "Waste Material Repurposing",
        recommendation: "Topsoil and overburden removed during strip mining can be repurposed instead of being wasted. Use stripped topsoil for mine road surfacing, embankment creation, and local construction where possible. Utilize overburden and waste rock for backfilling exhausted pits, stabilizing slopes, constructing bunds, and building noise-reduction berms. This approach reduces the demand for fresh raw material, cuts hauling emissions, and supports faster site rehabilitation."
      },
      {
        condition: (formData) => {
          const processes = formData?.applicableProcesses || [];
          // Drilling, open pit, and strip mining all generate high dust
          return processes.includes('drilling') || processes.includes('openPit') || processes.includes('strip');
        },
        category: "Dust Emission Control",
        recommendation: "Dust emissions (PM₁₀ & PM₂.₅) can significantly impact worker health and local air quality. Improve sustainability by using optimized dust-suppression plans (frequent water spraying, chemical suppressants), switching to covered conveyors to reduce airborne dust, and planting vegetative barriers around haul roads and drilling zones to capture fine particles. These measures reduce respiratory hazards and improve local environmental quality."
      },
      {
        condition: (formData) => formData?.waterUsage > 0,
        category: "Water Management",
        recommendation: "Mine drainage often contains suspended solids and may occasionally be alkaline or metal-bearing. To manage this sustainably, create settling ponds or constructed wetlands to naturally remove solids, and reuse the treated drainage water for dust suppression or mining operations to reduce freshwater consumption."
      },
      {
        condition: (formData) => formData?.typeOfEquipment === 'diesel',
        category: "Equipment Emission Reduction",
        recommendation: "Diesel equipment is a major contributor to GHG emissions in mining. Improve sustainability by shifting to hybrid or fully electric haul trucks, optimizing haul routes to reduce fuel consumption, and enforcing idle-time reduction policies for excavators and trucks. This decreases emissions, operational cost, and local air pollution."
      },
      {
        condition: (formData) => {
          const processes = formData?.applicableProcesses || [];
          // "drilling" process ID includes blasting activities
          return processes.includes('drilling');
        },
        category: "Blasting Optimization",
        recommendation: "Blasting generates noise, vibration, and dust. Sustainable improvements include using blast optimization techniques to reduce charge size and frequency, and scheduling blasts during low-impact times to minimize community disturbance."
      },
      {
        condition: (formData) => formData?.biodiversityImpact === 'high',
        category: "Biodiversity Conservation",
        recommendation: "High biodiversity impact areas require additional conservation measures. Create buffer zones around sensitive ecosystems, implement progressive rehabilitation programs during mining operations, establish wildlife corridors to minimize habitat fragmentation, and partner with conservation organizations for offset programs."
      }
    ]
  },
  beneficiation: {
    title: "Sustainable Beneficiation Solutions",
    rules: [
      {
        condition: (formData) => {
          const tailings = formData?.tailings;
          // Check if tailings management is selected (any type) or if tailings quantity exists
          return tailings && tailings !== '' && tailings !== 'none';
        },
        category: "Tailings Management",
        recommendation: "Tailings contain fine clays, silica, and oxides suspended in water. Sustainable handling options include dry stacking or thickened tailings to reduce water loss and improve stability, using dried tailings in road base, tiles, bricks, or construction fill where technically feasible, and backfilling mined-out pits to reduce landscape disturbance."
      },
      {
        condition: (formData) => formData?.waterConsumption > 100,
        category: "Water Conservation",
        recommendation: "Beneficiation involves process water containing reagents like flocculants. Adopt a closed-loop water system to maximize recycling and reduce freshwater intake. This significantly reduces environmental impact and operational costs."
      },
      {
        condition: (formData) => {
          const processes = formData?.processes || [];
          return processes.includes('crushing') || processes.includes('grinding');
        },
        category: "Dust Control",
        recommendation: "Dust from crushing and screening can be mitigated by installing bag filters or dust-collection systems, and using water sprays and enclosures to confine particles. This reduces emissions and improves worker safety."
      },
      {
        condition: (formData) => formData?.noiseLevel === 'High',
        category: "Noise Reduction",
        recommendation: "Use acoustic enclosures or sound-damping panels around mills and crushers to reduce noise pollution and improve site compliance. This protects worker health and reduces community impact."
      },
      {
        condition: (formData) => formData?.electricityUse > 500,
        category: "Energy Efficiency",
        recommendation: "High electricity consumption can be reduced by upgrading to energy-efficient crushing and grinding equipment, implementing variable frequency drives (VFDs) on motors, using waste heat recovery systems, and installing LED lighting throughout the facility."
      }
    ]
  },
  refining: {
    title: "Sustainable Refining Solutions",
    rules: [
      {
        condition: (formData) => formData?.redMudGen > 0,
        category: "Red Mud Valorization",
        recommendation: "Red mud is highly alkaline and rich in Fe₂O₃, TiO₂, and rare earths. Sustainable options include using neutralized red mud as a partial cement/clinker substitute, converting it into brick/ceramic products, extracting iron, TiO₂, or rare earth elements, and applying it in soil stabilization for roads and foundations after proper treatment."
      },
      {
        condition: (formData) => {
          const processes = formData?.processes || [];
          return processes.includes('digestion') || processes.includes('precipitation');
        },
        category: "Caustic Recovery",
        recommendation: "Recover caustic soda through recovery systems or neutralize and reuse it in upstream processes to reduce chemical waste. This significantly reduces operational costs and environmental impact."
      },
      {
        condition: (formData) => {
          const processes = formData?.processes || [];
          return processes.includes('clarification') || processes.includes('calcination');
        },
        category: "Gypsum Recovery",
        recommendation: "Gypsum generated from lime reactions can be sold to the cement or gypsum board industry, reducing waste and adding value. This creates a circular economy opportunity."
      },
      {
        condition: (formData) => formData?.waterUse > 50,
        category: "Water Recycling",
        recommendation: "Reuse evaporator condensates as process water to reduce fresh water consumption. Implement closed-loop systems wherever possible."
      },
      {
        condition: (formData) => {
          // Check if SO2 or NOx emissions exist in the form
          return (formData?.so2 > 0) || (formData?.nox > 0);
        },
        category: "Air Emission Control",
        recommendation: "Install electrostatic precipitators or scrubbers to reduce particulate and gaseous emissions (NOx/SO₂). This improves air quality and ensures regulatory compliance."
      }
    ]
  },
  smelting: {
    title: "Sustainable Smelting Solutions",
    rules: [
      {
        condition: (formData) => formData?.co2Emissions > 1000 || formData?.electricityDemand > 15000,
        category: "Energy & Emissions Reduction",
        recommendation: "Smelting is energy-intensive with significant GHG emissions. Sustainable practices include transitioning to inert anodes where applicable, procuring renewable electricity contracts, and optimizing energy recovery from waste heat. These measures can reduce carbon footprint by up to 50%."
      },
      {
        condition: (formData) => {
          const processes = formData?.processes || [];
          return processes.includes('electrolysis') || processes.includes('casting');
        },
        category: "Dross Recovery",
        recommendation: "Send dross to dross recovery plants to reclaim residual aluminium, reducing material loss. This improves material efficiency and reduces waste."
      },
      {
        condition: (formData) => {
          const processes = formData?.processes || [];
          return processes.includes('electrolysis');
        },
        category: "SPL Management",
        recommendation: "SPL (Spent Pot Lining) contains hazardous fluoride and cyanide compounds. Manage sustainably via encapsulation in cement, high-temperature vitrification, or co-processing in cement kilns. These methods neutralize harmful components and reduce hazardous waste."
      },
      {
        condition: (formData) => {
          // Check if fluoride recovery rate is low or if processes that emit fluoride exist
          const processes = formData?.processes || [];
          return (formData?.fluorideRecovery < 50 && formData?.fluorideRecovery > 0) || processes.includes('electrolysis');
        },
        category: "Fluoride Recovery",
        recommendation: "Use dry/wet scrubbers and recycle recovered fluoride salts back into the smelter bath. This reduces emissions and recovers valuable materials."
      },
      {
        condition: (formData) => {
          // If thermal recovery is low or electricity demand is high, suggest waste heat recovery
          return (formData?.thermalRecovery < 50 && formData?.thermalRecovery >= 0) || formData?.electricityDemand > 10000;
        },
        category: "Waste Heat Recovery",
        recommendation: "Capture and reuse waste heat for preheating combustion air, space heating, and low-temperature process needs. This reduces total energy demand by 10-15%."
      },
      {
        condition: (formData) => formData?.pfcEmissions > 0,
        category: "PFC Reduction",
        recommendation: "Reduce PFC emissions by minimizing anode effects and adopting modern cell monitoring systems. PFCs have extremely high global warming potential."
      }
    ]
  },
  manufacturing: {
    title: "Sustainable Manufacturing Solutions",
    rules: [
      {
        condition: (formData) => {
          // Check if scrap/offcuts/chips are generated (scrapRate > 0) OR machining/cutting/forming processes selected
          const processes = formData?.processes || [];
          const scrapRate = formData?.scrapRate || 0;
          return scrapRate > 0 || processes.includes('rolling') || processes.includes('forging') || processes.includes('joining');
        },
        category: "Scrap Recycling",
        recommendation: "Implement closed-loop recycling within the plant, remelting scrap to make new products. This reduces raw material demand and energy use by up to 95% compared to primary production."
      },
      {
        condition: (formData) => {
          // Check if remelting processes exist (casting/extrusion)
          const processes = formData?.processes || [];
          return processes.includes('casting') || processes.includes('extrusion');
        },
        category: "Dross Recovery",
        recommendation: "Send remelting dross to specialized recovery units to retrieve valuable aluminium. Recovery rates can reach 60-70% of aluminium content."
      },
      {
        condition: (formData) => {
          // Check if surface treatment/chemical processes exist
          const processes = formData?.processes || [];
          return processes.includes('surface_treatment');
        },
        category: "Chemical Recovery",
        recommendation: "Recover aluminium salts from process chemicals used in anodizing, coating, and cleaning. Neutralize sludge and reuse in cement or construction sectors where permitted. This reduces hazardous waste generation."
      },
      {
        condition: (formData) => {
          // Check for any process that might use lubricants (rolling, forging, joining)
          const processes = formData?.processes || [];
          return processes.includes('rolling') || processes.includes('forging') || processes.includes('joining');
        },
        category: "Lubricant Management",
        recommendation: "Adopt regeneration and recovery systems for used lubricants and coolants. Dispose responsibly via approved co-processing facilities to avoid groundwater contamination."
      },
      {
        condition: (formData) => {
          // Check if design for recycling is not enabled or packaging/transport exists
          const hasDesignForRecycling = formData?.sustainabilityParameters?.design_for_recyclability;
          const hasTransport = formData?.transportDistance > 0;
          return !hasDesignForRecycling || hasTransport;
        },
        category: "Circular Design",
        recommendation: "Design products for easy disassembly, use mono-material packaging, and ensure fasteners can be separated without tools. This facilitates end-of-life recycling."
      },
      {
        condition: (formData) => formData?.energyUsePerStep > 0 || formData?.fabricationEmissions > 0,
        category: "Energy Efficiency",
        recommendation: "Upgrade to energy-efficient machinery, implement smart energy management systems, use renewable energy for manufacturing operations, and optimize production schedules to reduce energy peaks."
      }
    ]
  },
  recycling: {
    title: "Sustainable Recycling Solutions",
    rules: [
      {
        condition: (formData) => {
          // Check if remelting process is used (furnaces generate salt slag/black dross)
          const processes = formData?.processes || [];
          return processes.includes('remelting');
        },
        category: "Salt Slag Recovery",
        recommendation: "Salt slag from rotary furnaces can be processed to recover aluminium and salts. Residual inert material can be reused in cement or bricks. This maximizes resource recovery and minimizes landfill."
      },
      {
        condition: (formData) => {
          // Check if remelting exists (generates dust & filter cakes)
          const processes = formData?.processes || [];
          return processes.includes('remelting') || processes.includes('cleaning');
        },
        category: "Dust Utilization",
        recommendation: "Stabilize dust and filter cakes and reuse in cement or brick manufacturing where regulations permit. This converts waste into valuable by-products."
      },
      {
        condition: (formData) => {
          // Check if cleaning process exists (handles painted/coated scrap)
          const processes = formData?.processes || [];
          return processes.includes('cleaning');
        },
        category: "Non-Metallic Fraction",
        recommendation: "Convert the non-metallic fraction (plastics, paints, coatings) into Refuse-Derived Fuel (RDF) or process via pyrolysis to recover energy. This reduces waste and generates value."
      },
      {
        condition: (formData) => {
          // Check if remelting exists (generates off-gases)
          const processes = formData?.processes || [];
          return processes.includes('remelting');
        },
        category: "Off-gas Management",
        recommendation: "Use high-efficiency baghouse filters and integrate heat recovery systems to increase energy efficiency. This captures emissions and recovers valuable energy."
      },
      {
        condition: (formData) => {
          // Check if manual sorting is being used
          const sortingMethods = formData?.sortingMethods || [];
          return sortingMethods.includes('manual');
        },
        category: "Sorting Technology",
        recommendation: "Implement AI-powered sorting systems to improve efficiency and recovery rates. Automated sorting can increase purity by 15-20% compared to manual methods."
      },
      {
        condition: (formData) => {
          // Check if furnace energy demand is high or if remelting process exists
          const furnaceEnergy = formData?.furnaceEnergyDemand || 0;
          const processes = formData?.processes || [];
          return furnaceEnergy > 500 || processes.includes('remelting');
        },
        category: "Energy Optimization",
        recommendation: "Use energy-efficient melting furnaces, implement automated scrap pre-treatment, optimize alloy separation processes, and recover and reuse dross and skimmings."
      }
    ]
  },
  valorization: {
    title: "Sustainable Valorization Solutions",
    rules: [
      {
        condition: (formData) => formData?.redMudQuantity > 0,
        category: "Red Mud Utilization",
        recommendation: "Convert red mud into construction materials (bricks, cement), extract rare earth elements and valuable metals, use as soil amendment in agriculture (after treatment), and develop markets for red mud-based products. Each tonne of red mud valorized prevents environmental liability."
      },
      {
        condition: (formData) => formData?.splQuantity > 0,
        category: "SPL Management",
        recommendation: "Recover fluoride and aluminium from SPL, use in cement kilns as alternative fuel, develop safe storage and treatment facilities, and research innovative SPL valorization technologies. Proper SPL management is critical for environmental safety."
      },
      {
        condition: (formData) => {
          const byproducts = formData?.byproducts || [];
          return byproducts.includes('slag') || byproducts.includes('dross');
        },
        category: "By-product Recovery",
        recommendation: "Extract valuable metals from slag and dross, recover chemicals for reuse in processes, sell by-products to other industries, and implement zero-waste strategies. This creates circular economy opportunities."
      },
      {
        condition: (formData) => formData?.researchBudget > 0 || formData?.innovationFocus,
        category: "Innovation & Research",
        recommendation: "Invest in R&D for new valorization methods, collaborate with universities and research institutions, pilot test emerging technologies, and share knowledge and best practices across the industry. Innovation is key to unlocking new value streams."
      },
      {
        condition: (formData) => formData?.wasteToLandfill > 0,
        category: "Zero Waste Strategy",
        recommendation: "Develop comprehensive waste characterization programs, explore valorization opportunities for all waste streams, create partnerships with industries that can use your by-products, and track progress toward zero-waste-to-landfill goals."
      }
    ]
  }
};

// General sustainability recommendations for each stage (shown when no specific rules match)
const generalRecommendations = {
  mining: [
    { category: "Resource Efficiency", recommendation: "Optimize ore extraction rates and minimize waste rock generation through precise drilling and blasting techniques." },
    { category: "Water Conservation", recommendation: "Implement water recycling systems and monitor water quality to reduce freshwater consumption and prevent contamination." },
    { category: "Progressive Rehabilitation", recommendation: "Begin mine site rehabilitation concurrently with operations to reduce long-term environmental impact and closure costs." }
  ],
  beneficiation: [
    { category: "Energy Management", recommendation: "Monitor and optimize energy consumption in crushing and grinding operations, which typically account for 50-70% of beneficiation energy use." },
    { category: "Chemical Management", recommendation: "Use environmentally friendly reagents where possible and implement closed-loop systems to minimize chemical discharge." },
    { category: "Tailings Best Practices", recommendation: "Consider dry stacking or paste tailings technologies to reduce water consumption and improve tailings storage stability." }
  ],
  refining: [
    { category: "By-product Utilization", recommendation: "Explore markets for all by-products including red mud, gypsum, and other residues to move toward zero-waste operations." },
    { category: "Energy Optimization", recommendation: "Implement heat recovery systems and optimize process temperatures to reduce energy consumption per tonne of alumina produced." },
    { category: "Emission Control", recommendation: "Install modern scrubbing systems to capture particulate matter and gaseous emissions, ensuring compliance with air quality standards." }
  ],
  smelting: [
    { category: "Carbon Footprint Reduction", recommendation: "Transition to renewable energy sources and explore low-carbon technologies like inert anodes to significantly reduce CO₂ emissions." },
    { category: "Process Efficiency", recommendation: "Optimize cell operations and reduce energy consumption through advanced process control and monitoring systems." },
    { category: "Hazardous Waste Management", recommendation: "Implement safe handling and disposal methods for spent pot lining (SPL) and other hazardous wastes generated during electrolysis." }
  ],
  manufacturing: [
    { category: "Material Efficiency", recommendation: "Minimize scrap generation through optimized cutting patterns, precision manufacturing, and design for manufacturing principles." },
    { category: "Circular Economy", recommendation: "Design products for disassembly and recyclability to facilitate end-of-life material recovery and reuse." },
    { category: "Clean Production", recommendation: "Use water-based coatings and non-toxic materials where possible to reduce environmental impact and worker exposure." }
  ],
  recycling: [
    { category: "Collection Infrastructure", recommendation: "Develop comprehensive collection systems and partnerships to increase the availability of high-quality aluminium scrap." },
    { category: "Sorting Technology", recommendation: "Invest in advanced sorting technologies like optical sorting and AI systems to improve alloy separation and purity." },
    { category: "Quality Control", recommendation: "Implement strict quality control procedures to minimize contamination and maximize the value of recycled aluminium." }
  ],
  valorization: [
    { category: "Innovation Focus", recommendation: "Invest in research and development to find new uses for industrial waste streams and by-products from aluminium production." },
    { category: "Industry Partnerships", recommendation: "Collaborate with other industries that can utilize your waste streams as raw materials, creating symbiotic relationships." },
    { category: "Market Development", recommendation: "Develop markets for valorized products and demonstrate their technical and economic viability to potential customers." }
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

export default function SustainableSolutionsModal({ open, onClose, stage, formData }) {
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
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100">
              <IconComponent className="w-6 h-6 text-green-600" />
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
                    Fill in more form fields to receive specific recommendations tailored to your operations. 
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
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1">
                    {item.category}
                  </Badge>
                </div>
                <div className="flex items-start gap-3 text-gray-700">
                  <span className="text-green-600 mt-1 shrink-0">🌱</span>
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
