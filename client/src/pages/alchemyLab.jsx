import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { 
  ChevronDown, 
  Beaker, 
  Sparkles, 
  Package,
  GripVertical,
  X,
  FlaskConical
} from 'lucide-react';

// Category configurations with colors and emojis
const CATEGORIES = {
  'Mining': { emoji: '⛏️', color: 'bg-amber-50 border-amber-300', headerColor: 'bg-amber-100' },
  'Beneficiation': { emoji: '🔬', color: 'bg-blue-50 border-blue-300', headerColor: 'bg-blue-100' },
  'Refining': { emoji: '🧪', color: 'bg-red-50 border-red-300', headerColor: 'bg-red-100' },
  'Smelting': { emoji: '🔥', color: 'bg-orange-50 border-orange-300', headerColor: 'bg-orange-100' },
  'Manufacturing': { emoji: '🏭', color: 'bg-purple-50 border-purple-300', headerColor: 'bg-purple-100' },
  'Recycling': { emoji: '♻️', color: 'bg-green-50 border-green-300', headerColor: 'bg-green-100' },
  'Pyrometallurgy': { emoji: '🔥', color: 'bg-orange-50 border-orange-300', headerColor: 'bg-orange-100' },
  'Hydrometallurgy': { emoji: '💧', color: 'bg-cyan-50 border-cyan-300', headerColor: 'bg-cyan-100' },
  'Use Phase': { emoji: '🏘️', color: 'bg-indigo-50 border-indigo-300', headerColor: 'bg-indigo-100' },
  'Cross-Stage': { emoji: '🔄', color: 'bg-slate-50 border-slate-300', headerColor: 'bg-slate-100' },
};

// By-products data organized by category
const BY_PRODUCTS = {
  aluminium: [
    // Mining Stage
    { id: 'al-1', name: 'Overburden & Waste Rock', emoji: '🪨', category: 'Mining' },
    { id: 'al-2', name: 'Topsoil', emoji: '🌱', category: 'Mining' },
    { id: 'al-3', name: 'Dust (PM10/PM2.5)', emoji: '💨', category: 'Mining' },
    { id: 'al-4', name: 'Mine Drainage', emoji: '💧', category: 'Mining' },
    
    // Beneficiation Stage
    { id: 'al-5', name: 'Tailings (clays, silica, iron oxides)', emoji: '🧱', category: 'Beneficiation' },
    { id: 'al-6', name: 'Process Water', emoji: '💦', category: 'Beneficiation' },
    { id: 'al-7', name: 'Dust from crushing/screening', emoji: '🌫️', category: 'Beneficiation' },
    
    // Refining Stage
    { id: 'al-8', name: 'Red Mud / Bauxite Residue', emoji: '🔴', category: 'Refining' },
    { id: 'al-9', name: 'Spent Caustic Liquor', emoji: '⚗️', category: 'Refining' },
    { id: 'al-10', name: 'Gypsum / Scale', emoji: '⚪', category: 'Refining' },
    { id: 'al-11', name: 'Evaporator Condensates', emoji: '💧', category: 'Refining' },
    
    // Smelting Stage
    { id: 'al-12', name: 'Dross & Skim', emoji: '🔶', category: 'Smelting' },
    { id: 'al-13', name: 'Spent Pot Lining (SPL)', emoji: '🧊', category: 'Smelting' },
    { id: 'al-14', name: 'Fluoride Gases', emoji: '☁️', category: 'Smelting' },
    { id: 'al-15', name: 'Waste Heat', emoji: '🌡️', category: 'Smelting' },
    
    // Product Manufacturing
    { id: 'al-16', name: 'Scrap (offcuts, chips)', emoji: '✂️', category: 'Manufacturing' },
    { id: 'al-17', name: 'Dross from remelting', emoji: '🔸', category: 'Manufacturing' },
    { id: 'al-18', name: 'Chemical Sludge (anodizing/coating)', emoji: '🧴', category: 'Manufacturing' },
    { id: 'al-19', name: 'Used lubricants/coolants', emoji: '🛢️', category: 'Manufacturing' },
    { id: 'al-20', name: 'Packaging Waste', emoji: '📦', category: 'Manufacturing' },
    
    // Recycling Stage
    { id: 'al-21', name: 'Salt Slag / Black Dross', emoji: '⚫', category: 'Recycling' },
    { id: 'al-22', name: 'Dust & Filter Cake', emoji: '🌫️', category: 'Recycling' },
    { id: 'al-23', name: 'Non-metallic Fraction (plastics/paint)', emoji: '🎨', category: 'Recycling' },
    { id: 'al-24', name: 'Off-gases', emoji: '💨', category: 'Recycling' },
  ],
  copper: [
    // Mining Stage
    { id: 'cu-1', name: 'Overburden & Waste Rock', emoji: '🪨', category: 'Mining' },
    { id: 'cu-2', name: 'Tailings (ore fines)', emoji: '🧱', category: 'Mining' },
    { id: 'cu-3', name: 'Dust (PM10 / PM2.5)', emoji: '💨', category: 'Mining' },
    { id: 'cu-4', name: 'Acid Mine Drainage (AMD)', emoji: '🧪', category: 'Mining' },
    { id: 'cu-5', name: 'Explosive Residue', emoji: '🧨', category: 'Mining' },
    { id: 'cu-6', name: 'Mine Effluents', emoji: '💧', category: 'Mining' },

    // Beneficiation Stage
    { id: 'cu-7', name: 'Tailings (silicates)', emoji: '🧱', category: 'Beneficiation' },
    { id: 'cu-8', name: 'Flotation Residue', emoji: '🫧', category: 'Beneficiation' },
    { id: 'cu-9', name: 'Thickener Underflow', emoji: '⬇️', category: 'Beneficiation' },
    { id: 'cu-10', name: 'Filtration Cake', emoji: '🍰', category: 'Beneficiation' },
    { id: 'cu-11', name: 'Process Water', emoji: '💦', category: 'Beneficiation' },
    { id: 'cu-12', name: 'Airborne Dust', emoji: '🌫️', category: 'Beneficiation' },
    { id: 'cu-13', name: 'Spent Grinding Media', emoji: '⚙️', category: 'Beneficiation' },

    // Pyrometallurgical Extraction
    { id: 'cu-14', name: 'Copper Slag', emoji: '🔶', category: 'Pyrometallurgy' },
    { id: 'cu-15', name: 'SO₂ Off-gas', emoji: '☁️', category: 'Pyrometallurgy' },
    { id: 'cu-16', name: 'Sulfuric Acid Produced', emoji: '⚗️', category: 'Pyrometallurgy' },
    { id: 'cu-17', name: 'Flue Dust', emoji: '🌫️', category: 'Pyrometallurgy' },
    { id: 'cu-18', name: 'Anode Slime', emoji: '🟤', category: 'Pyrometallurgy' },
    { id: 'cu-19', name: 'Waste Heat', emoji: '🌡️', category: 'Pyrometallurgy' },
    { id: 'cu-20', name: 'Spent Refractories', emoji: '🧱', category: 'Pyrometallurgy' },
    { id: 'cu-21', name: 'Acid Plant Blowdown', emoji: '💧', category: 'Pyrometallurgy' },

    // Hydrometallurgical Extraction
    { id: 'cu-22', name: 'Spent Leach Solutions', emoji: '🧪', category: 'Hydrometallurgy' },
    { id: 'cu-23', name: 'Leach Residues', emoji: '🪨', category: 'Hydrometallurgy' },
    { id: 'cu-24', name: 'Organic Solvent Losses', emoji: '💧', category: 'Hydrometallurgy' },
    { id: 'cu-25', name: 'Gypsum / Calcium Sulfate', emoji: '⚪', category: 'Hydrometallurgy' },
    { id: 'cu-26', name: 'Purge Streams', emoji: '🌊', category: 'Hydrometallurgy' },
    { id: 'cu-27', name: 'Waste Electrolytes', emoji: '🔋', category: 'Hydrometallurgy' },
    { id: 'cu-28', name: 'Acid Mist', emoji: '🌫️', category: 'Hydrometallurgy' },

    // Semi-Fabrication & Manufacturing
    { id: 'cu-29', name: 'Scrap (trimmings)', emoji: '✂️', category: 'Manufacturing' },
    { id: 'cu-30', name: 'Melting Dross', emoji: '🔥', category: 'Manufacturing' },
    { id: 'cu-31', name: 'Pickling / Plating Sludges', emoji: '🧪', category: 'Manufacturing' },
    { id: 'cu-32', name: 'Used Oils & Lubricants', emoji: '🛢️', category: 'Manufacturing' },
    { id: 'cu-33', name: 'Solid Filter Waste', emoji: '🗑️', category: 'Manufacturing' },
    { id: 'cu-34', name: 'Cooling Wastewater', emoji: '❄️', category: 'Manufacturing' },
    { id: 'cu-35', name: 'Waste Heat (mfg)', emoji: '🌡️', category: 'Manufacturing' },
    { id: 'cu-36', name: 'Packaging Waste', emoji: '📦', category: 'Manufacturing' },

    // Use-Phase
    { id: 'cu-37', name: 'Replacement Scrap', emoji: '🔄', category: 'Use Phase' },
    { id: 'cu-38', name: 'Corrosion Products', emoji: '�️', category: 'Use Phase' },
    { id: 'cu-39', name: 'Wear Particles', emoji: '✨', category: 'Use Phase' },

    // End-of-Life Recycling
    { id: 'cu-40', name: 'Slag from Remelting', emoji: '🔶', category: 'Recycling' },
    { id: 'cu-41', name: 'Dust & Filter Cake', emoji: '🌫️', category: 'Recycling' },
    { id: 'cu-42', name: 'Organic Residues', emoji: '🍂', category: 'Recycling' },
    { id: 'cu-43', name: 'Plastic & Insulation Waste', emoji: '🧶', category: 'Recycling' },
    { id: 'cu-44', name: 'Contaminant Metals', emoji: '🔩', category: 'Recycling' },
    { id: 'cu-45', name: 'Salt Slag', emoji: '🧂', category: 'Recycling' },
    { id: 'cu-46', name: 'Non-Metallic Fractions', emoji: '🧱', category: 'Recycling' },
    { id: 'cu-47', name: 'Wastewater from Cleaning', emoji: '�', category: 'Recycling' },

    // Cross-Stage Valorization
    { id: 'cu-48', name: 'Slag (all types)', emoji: '🔶', category: 'Cross-Stage' },
    { id: 'cu-49', name: 'Tailings (all sources)', emoji: '🧱', category: 'Cross-Stage' },
    { id: 'cu-50', name: 'Dust & Filter Cake (all)', emoji: '🌫️', category: 'Cross-Stage' },
    { id: 'cu-51', name: 'Acidic Effluents', emoji: '🧪', category: 'Cross-Stage' },
    { id: 'cu-52', name: 'Spent Solutions', emoji: '⚗️', category: 'Cross-Stage' },
    { id: 'cu-53', name: 'Anode Slime (all)', emoji: '🟤', category: 'Cross-Stage' },
    { id: 'cu-54', name: 'Heavy-Metal Sludge', emoji: '☣️', category: 'Cross-Stage' },
    { id: 'cu-55', name: 'Waste Heat (all)', emoji: '🌡️', category: 'Cross-Stage' },
    { id: 'cu-56', name: 'Water Streams', emoji: '💧', category: 'Cross-Stage' },
  ],
  steel: [
    // Mining Stage
    { id: 'st-1', name: 'Overburden & Waste Rock', emoji: '🪨', category: 'Mining' },
    { id: 'st-2', name: 'Iron Ore Tailings', emoji: '🧱', category: 'Mining' },
    { id: 'st-3', name: 'Mine Dust', emoji: '💨', category: 'Mining' },
    { id: 'st-4', name: 'Mine Water', emoji: '💧', category: 'Mining' },

    // Beneficiation Stage
    { id: 'st-5', name: 'Beneficiation Tailings', emoji: '📉', category: 'Beneficiation' },
    { id: 'st-6', name: 'Slimes', emoji: '🌫️', category: 'Beneficiation' },
    { id: 'st-7', name: 'Process Water', emoji: '💦', category: 'Beneficiation' },

    // Pyrometallurgy (Ironmaking & Steelmaking)
    { id: 'st-8', name: 'Blast Furnace Slag', emoji: '🌋', category: 'Pyrometallurgy' },
    { id: 'st-9', name: 'Steel Slag (BOF/EAF)', emoji: '🌑', category: 'Pyrometallurgy' },
    { id: 'st-10', name: 'Mill Scale', emoji: '⚖️', category: 'Pyrometallurgy' },
    { id: 'st-11', name: 'EAF Dust', emoji: '🌫️', category: 'Pyrometallurgy' },
    { id: 'st-12', name: 'Blast Furnace Gas', emoji: '💨', category: 'Pyrometallurgy' },
    { id: 'st-13', name: 'Coke Oven Gas', emoji: '🔥', category: 'Pyrometallurgy' },
    { id: 'st-14', name: 'Spent Refractories', emoji: '🧱', category: 'Pyrometallurgy' },
    { id: 'st-15', name: 'Desulfurization Slag', emoji: '🧪', category: 'Pyrometallurgy' },

    // Hydrometallurgy (Pickling/Coating)
    { id: 'st-16', name: 'Spent Pickling Liquor', emoji: '🧪', category: 'Hydrometallurgy' },
    { id: 'st-17', name: 'Acid Regeneration Sludge', emoji: '🟤', category: 'Hydrometallurgy' },
    { id: 'st-18', name: 'Plating Sludge (Zn/Sn)', emoji: '🛡️', category: 'Hydrometallurgy' },

    // Manufacturing
    { id: 'st-19', name: 'New Scrap (Offcuts)', emoji: '✂️', category: 'Manufacturing' },
    { id: 'st-20', name: 'Grinding Swarf', emoji: '⚙️', category: 'Manufacturing' },
    { id: 'st-21', name: 'Oily Mill Scale', emoji: '🛢️', category: 'Manufacturing' },
    { id: 'st-22', name: 'Used Lubricants', emoji: '🛢️', category: 'Manufacturing' },
    { id: 'st-23', name: 'Packaging Waste', emoji: '📦', category: 'Manufacturing' },

    // Use Phase
    { id: 'st-24', name: 'Corrosion Products (Rust)', emoji: '🍂', category: 'Use Phase' },
    { id: 'st-25', name: 'Wear Particles', emoji: '✨', category: 'Use Phase' },

    // Recycling
    { id: 'st-26', name: 'Post-consumer Scrap', emoji: '🚗', category: 'Recycling' },
    { id: 'st-27', name: 'Zinc Dross (Galvanizing)', emoji: '🛡️', category: 'Recycling' },
    { id: 'st-28', name: 'Tin Plate Scrap', emoji: '🥫', category: 'Recycling' },
    { id: 'st-29', name: 'Shredder Residue (ASR)', emoji: '🚙', category: 'Recycling' },

    // Cross-Stage
    { id: 'st-30', name: 'Waste Heat', emoji: '🌡️', category: 'Cross-Stage' },
    { id: 'st-31', name: 'Process Water', emoji: '🔄', category: 'Cross-Stage' },
    { id: 'st-32', name: 'Slag (General)', emoji: '🪨', category: 'Cross-Stage' },
  ]
};

// Valorization products - what each by-product can become
const VALORIZATION_PRODUCTS = {
  // Mining Stage
  'al-1': [
    { id: 'vp-1-1', name: 'Backfilling Material', emoji: '🕳️', description: 'Used for mine pit backfilling' },
    { id: 'vp-1-2', name: 'Construction Aggregate', emoji: '🏗️', description: 'Aggregate for construction projects' },
    { id: 'vp-1-3', name: 'Noise-barrier Berms', emoji: '🔇', description: 'Earthen noise barriers' },
  ],
  'al-2': [
    { id: 'vp-2-1', name: 'Embankment Material', emoji: '🛤️', description: 'Road and rail embankments' },
    { id: 'vp-2-2', name: 'Road Base', emoji: '🛣️', description: 'Foundation for road construction' },
    { id: 'vp-2-3', name: 'Building Aggregate', emoji: '🏢', description: 'Construction fill material' },
  ],
  'al-3': [
    { id: 'vp-3-1', name: 'Stabilized Soil Additive', emoji: '🌿', description: 'Soil stabilization agent' },
    { id: 'vp-3-2', name: 'Compressed Dust-brick', emoji: '🧱', description: 'Experimental building blocks' },
  ],
  'al-4': [
    { id: 'vp-4-1', name: 'Reuse Water', emoji: '♻️💧', description: 'Dust suppression & process water' },
  ],
  
  // Beneficiation Stage
  'al-5': [
    { id: 'vp-5-1', name: 'Bricks & Tiles', emoji: '🧱', description: 'Construction bricks and tiles' },
    { id: 'vp-5-2', name: 'Road Base', emoji: '🛣️', description: 'Road construction material' },
    { id: 'vp-5-3', name: 'Cement Raw Mix', emoji: '🏗️', description: 'Cement production feedstock' },
    { id: 'vp-5-4', name: 'Mine Backfill Material', emoji: '🕳️', description: 'Mine pit rehabilitation' },
  ],
  'al-6': [
    { id: 'vp-6-1', name: 'Recycled Closed-loop Water', emoji: '🔄💧', description: 'Water recycling system' },
  ],
  'al-7': [
    { id: 'vp-7-1', name: 'Cement Raw Mix', emoji: '🏗️', description: 'Cement production input' },
    { id: 'vp-7-2', name: 'Soil Conditioning Material', emoji: '🌱', description: 'Agricultural soil improvement' },
  ],
  
  // Refining Stage
  'al-8': [
    { id: 'vp-8-1', name: 'Cement & Clinker Substitute', emoji: '🏗️', description: 'Partial cement replacement' },
    { id: 'vp-8-2', name: 'Bricks & Ceramics', emoji: '🧱', description: 'Building materials production' },
    { id: 'vp-8-3', name: 'Extracted Iron (Magnetite)', emoji: '🧲', description: 'Iron recovery from residue' },
    { id: 'vp-8-4', name: 'TiO₂ Extraction', emoji: '⚪', description: 'Titanium dioxide recovery' },
    { id: 'vp-8-5', name: 'Rare Earth Extraction', emoji: '💎', description: 'Rare earth elements recovery' },
    { id: 'vp-8-6', name: 'Soil Stabilization', emoji: '🌍', description: 'After neutralization treatment' },
  ],
  'al-9': [
    { id: 'vp-9-1', name: 'Recovered NaOH', emoji: '⚗️', description: 'Sodium hydroxide recovery' },
  ],
  'al-10': [
    { id: 'vp-10-1', name: 'Cement Additive', emoji: '🏗️', description: 'Cement production additive' },
    { id: 'vp-10-2', name: 'Gypsum Board Raw Material', emoji: '📋', description: 'Drywall production' },
  ],
  'al-11': [
    { id: 'vp-11-1', name: 'Process Water', emoji: '💧', description: 'Reused in refining process' },
  ],
  
  // Smelting Stage
  'al-12': [
    { id: 'vp-12-1', name: 'Recovered Aluminium Metal', emoji: '🥈', description: 'Metal recovery from dross' },
  ],
  'al-13': [
    { id: 'vp-13-1', name: 'Cement Kiln Feed', emoji: '🔥', description: 'Fuel for cement production' },
    { id: 'vp-13-2', name: 'Vitrified Glass-ceramic Blocks', emoji: '🔷', description: 'Construction blocks' },
    { id: 'vp-13-3', name: 'Encapsulated Construction Filler', emoji: '🏗️', description: 'Safe construction filler' },
  ],
  'al-14': [
    { id: 'vp-14-1', name: 'Fluoride Salts (Cryolite)', emoji: '🧂', description: 'Returned to bath' },
  ],
  'al-15': [
    { id: 'vp-15-1', name: 'Preheating Combustion Air', emoji: '🌬️', description: 'Air preheating system' },
    { id: 'vp-15-2', name: 'Building Heating', emoji: '🏠', description: 'District heating system' },
    { id: 'vp-15-3', name: 'Low-temperature Processes', emoji: '🌡️', description: 'Industrial heat reuse' },
  ],
  
  // Manufacturing Stage
  'al-16': [
    { id: 'vp-16-1', name: 'Same-alloy Recycled Product', emoji: '🔄', description: 'Direct reuse in production' },
    { id: 'vp-16-2', name: 'Remelt Ingots', emoji: '🪙', description: 'Ingot casting for reuse' },
  ],
  'al-17': [
    { id: 'vp-17-1', name: 'Recovered Aluminium', emoji: '🥈', description: 'Metal recovery' },
  ],
  'al-18': [
    { id: 'vp-18-1', name: 'Cement Additives', emoji: '🏗️', description: 'After neutralization' },
  ],
  'al-19': [
    { id: 'vp-19-1', name: 'Regenerated Lubricant', emoji: '🛢️', description: 'Lubricant recycling' },
    { id: 'vp-19-2', name: 'Alternative Fuel', emoji: '⛽', description: 'Energy recovery' },
  ],
  'al-20': [
    { id: 'vp-20-1', name: 'Recycled Packaging Materials', emoji: '📦', description: 'Material recycling' },
    { id: 'vp-20-2', name: 'Mono-material Recyclable Packing', emoji: '♻️', description: 'Improved recyclability' },
  ],
  
  // Recycling Stage
  'al-21': [
    { id: 'vp-21-1', name: 'Recovered Aluminium', emoji: '🥈', description: 'Metal recovery from slag' },
    { id: 'vp-21-2', name: 'Recovered Salts', emoji: '🧂', description: 'Salt flux recovery' },
    { id: 'vp-21-3', name: 'Inert Ceramic Granulate', emoji: '⚪', description: 'Construction material' },
  ],
  'al-22': [
    { id: 'vp-22-1', name: 'Cement Additive', emoji: '🏗️', description: 'Cement production' },
    { id: 'vp-22-2', name: 'Bricks', emoji: '🧱', description: 'Building materials' },
  ],
  'al-23': [
    { id: 'vp-23-1', name: 'RDF Fuel', emoji: '🔥', description: 'Refuse derived fuel' },
    { id: 'vp-23-2', name: 'Pyrolysis Oil/Char', emoji: '🛢️', description: 'Thermal decomposition products' },
  ],
  'al-24': [
    { id: 'vp-24-1', name: 'Heat Recovery Input', emoji: '♨️', description: 'Waste heat utilization' },
  ],
  
  // Copper placeholders
  'cu-1': [
    { id: 'vp-cu-1-1', name: 'Backfill Material', emoji: '🕳️', description: 'For mined-out areas' },
    { id: 'vp-cu-1-2', name: 'Road Base', emoji: '🛣️', description: 'For mine roads' },
    { id: 'vp-cu-1-3', name: 'Construction Aggregate', emoji: '🏗️', description: 'General construction' },
  ],
  'cu-2': [
    { id: 'vp-cu-2-1', name: 'Bricks, Blocks', emoji: '🧱', description: 'Construction materials' },
    { id: 'vp-cu-2-2', name: 'Road Base', emoji: '🛣️', description: 'Road construction' },
    { id: 'vp-cu-2-3', name: 'Cement Feed', emoji: '🏗️', description: 'After chemical stabilization' },
    { id: 'vp-cu-2-4', name: 'Extra Copper', emoji: '🥉', description: 'Reprocessing extraction' },
  ],
  'cu-3': [
    { id: 'vp-cu-3-1', name: 'Soil Additives', emoji: '🌱', description: 'Agricultural use' },
    { id: 'vp-cu-3-2', name: 'Dust Bricks', emoji: '🧱', description: 'Experimental solidification' },
  ],
  'cu-4': [
    { id: 'vp-cu-4-1', name: 'Metal-rich Precipitates', emoji: '🧪', description: 'Recovered Fe, Al, Cu' },
    { id: 'vp-cu-4-2', name: 'Treated Water', emoji: '💧', description: 'Reused in mining' },
  ],
  'cu-5': [
    { id: 'vp-cu-5-1', name: 'Packaging Materials', emoji: '📦', description: 'Sent for recycling' },
  ],
  'cu-6': [
    { id: 'vp-cu-6-1', name: 'Treated Water', emoji: '💧', description: 'Dust suppression / reuse' },
  ],
  'cu-7': [
    { id: 'vp-cu-7-1', name: 'Bricks', emoji: '🧱', description: 'Construction' },
    { id: 'vp-cu-7-2', name: 'Road Material', emoji: '🛣️', description: 'Construction material' },
    { id: 'vp-cu-7-3', name: 'Cement Raw Feed', emoji: '🏗️', description: 'After stabilization' },
  ],
  'cu-8': [
    { id: 'vp-cu-8-1', name: 'Recovered Reagents', emoji: '⚗️', description: 'Chemical recovery' },
    { id: 'vp-cu-8-2', name: 'Lower-toxicity Residues', emoji: '📉', description: 'Safer disposal' },
  ],
  'cu-9': [
    { id: 'vp-cu-9-1', name: 'Dry Stacking Material', emoji: '🧱', description: 'Waste management' },
    { id: 'vp-cu-9-2', name: 'Engineering Fill', emoji: '🏗️', description: 'Construction fill' },
  ],
  'cu-10': [
    { id: 'vp-cu-10-1', name: 'Stabilized Filler', emoji: '🏗️', description: 'For construction' },
    { id: 'vp-cu-10-2', name: 'Secondary Metal Feed', emoji: '🔄', description: 'Metal recovery' },
  ],
  'cu-11': [
    { id: 'vp-cu-11-1', name: 'Recycled Water', emoji: '🔄', description: 'Closed-loop systems' },
  ],
  'cu-12': [
    { id: 'vp-cu-12-1', name: 'Returned to Process', emoji: '↩️', description: 'Internal recycling' },
  ],
  'cu-13': [
    { id: 'vp-cu-13-1', name: 'Steel Scrap', emoji: '🔩', description: 'Sold to steel mills' },
  ],
  'cu-14': [
    { id: 'vp-cu-14-1', name: 'Cement Additive', emoji: '🏗️', description: 'Cement production' },
    { id: 'vp-cu-14-2', name: 'Construction Aggregate', emoji: '🧱', description: 'Building material' },
    { id: 'vp-cu-14-3', name: 'Abrasive Blasting Media', emoji: '💥', description: 'Industrial cleaning' },
  ],
  'cu-15': [
    { id: 'vp-cu-15-1', name: 'Sulfuric Acid', emoji: '🧪', description: 'Industrial grade' },
  ],
  'cu-16': [
    { id: 'vp-cu-16-1', name: 'Sold Externally', emoji: '💰', description: 'Commercial product' },
    { id: 'vp-cu-16-2', name: 'Internal Use', emoji: '🔄', description: 'Hydrometallurgical leaching' },
  ],
  'cu-17': [
    { id: 'vp-cu-17-1', name: 'Returned to Furnace', emoji: '🔥', description: 'Internal recycling' },
    { id: 'vp-cu-17-2', name: 'Metal Extraction', emoji: '⛏️', description: 'Cu, Pb, Ag recovery' },
  ],
  'cu-18': [
    { id: 'vp-cu-18-1', name: 'Gold', emoji: '🥇', description: 'Precious metal recovery' },
    { id: 'vp-cu-18-2', name: 'Silver', emoji: '🥈', description: 'Precious metal recovery' },
    { id: 'vp-cu-18-3', name: 'Selenium', emoji: '🟢', description: 'Rare element recovery' },
    { id: 'vp-cu-18-4', name: 'Tellurium', emoji: '⚪', description: 'Rare element recovery' },
    { id: 'vp-cu-18-5', name: 'PGMs', emoji: '💎', description: 'Platinum group metals' },
  ],
  'cu-19': [
    { id: 'vp-cu-19-1', name: 'Steam Generation', emoji: '💨', description: 'Energy recovery' },
    { id: 'vp-cu-19-2', name: 'Electricity', emoji: '⚡', description: 'Power generation' },
    { id: 'vp-cu-19-3', name: 'Pre-heating', emoji: '🔥', description: 'Furnace feed heating' },
  ],
  'cu-20': [
    { id: 'vp-cu-20-1', name: 'Low-grade Aggregate', emoji: '🧱', description: 'Construction' },
    { id: 'vp-cu-20-2', name: 'Road Base', emoji: '🛣️', description: 'Road construction' },
  ],
  'cu-21': [
    { id: 'vp-cu-21-1', name: 'Metal Recovery', emoji: '⛏️', description: 'Resource recovery' },
    { id: 'vp-cu-21-2', name: 'Neutralized Filler', emoji: '⚪', description: 'Construction filler' },
  ],
  'cu-22': [
    { id: 'vp-cu-22-1', name: 'Regenerated Acid', emoji: '🧪', description: 'Chemical recovery' },
    { id: 'vp-cu-22-2', name: 'Metal Recovery', emoji: '⛏️', description: 'Cu, Fe, Al, Mn' },
  ],
  'cu-23': [
    { id: 'vp-cu-23-1', name: 'Neutralized Filler', emoji: '⚪', description: 'Construction filler' },
  ],
  'cu-24': [
    { id: 'vp-cu-24-1', name: 'Recovered Solvent', emoji: '💧', description: 'Reuse via distillation' },
  ],
  'cu-25': [
    { id: 'vp-cu-25-1', name: 'Cement Gypsum', emoji: '🏗️', description: 'Cement industry' },
    { id: 'vp-cu-25-2', name: 'Wallboard Material', emoji: '🏠', description: 'Construction' },
  ],
  'cu-26': [
    { id: 'vp-cu-26-1', name: 'Metal Salts', emoji: '🧂', description: 'Fe, Al, Mn, Mg' },
  ],
  'cu-27': [
    { id: 'vp-cu-27-1', name: 'Copper Recovery', emoji: '🥉', description: 'Metal extraction' },
    { id: 'vp-cu-27-2', name: 'Acid Recovery', emoji: '🧪', description: 'Chemical recovery' },
  ],
  'cu-28': [
    { id: 'vp-cu-28-1', name: 'Returned to Electrolyte', emoji: '↩️', description: 'Process reuse' },
  ],
  'cu-29': [
    { id: 'vp-cu-29-1', name: 'Recycled Billets', emoji: '🧱', description: 'Copper production' },
    { id: 'vp-cu-29-2', name: 'Direct-melt Feed', emoji: '�', description: 'New products' },
  ],
  'cu-30': [
    { id: 'vp-cu-30-1', name: 'Copper Recovery', emoji: '🥉', description: 'Metal extraction' },
  ],
  'cu-31': [
    { id: 'vp-cu-31-1', name: 'Recovered Metal Salts', emoji: '🧂', description: 'Resource recovery' },
    { id: 'vp-cu-31-2', name: 'Regenerated Acids', emoji: '🧪', description: 'Chemical recovery' },
  ],
  'cu-32': [
    { id: 'vp-cu-32-1', name: 'Regenerated Oil', emoji: '🛢️', description: 'Lubricant reuse' },
    { id: 'vp-cu-32-2', name: 'Co-processing Fuel', emoji: '🔥', description: 'Energy recovery' },
  ],
  'cu-33': [
    { id: 'vp-cu-33-1', name: 'Smelted for Copper', emoji: '🔥', description: 'Metal recovery' },
  ],
  'cu-34': [
    { id: 'vp-cu-34-1', name: 'Reused Water', emoji: '🔄', description: 'After treatment' },
    { id: 'vp-cu-34-2', name: 'Waste Heat Recovery', emoji: '🌡️', description: 'Energy efficiency' },
  ],
  'cu-35': [
    { id: 'vp-cu-35-1', name: 'Preheating', emoji: '🔥', description: 'Process heat' },
    { id: 'vp-cu-35-2', name: 'Space Heating', emoji: '🏠', description: 'Facility heating' },
    { id: 'vp-cu-35-3', name: 'ORC Electricity', emoji: '⚡', description: 'Power generation' },
  ],
  'cu-36': [
    { id: 'vp-cu-36-1', name: 'Recycled Materials', emoji: '📦', description: 'Material recovery' },
  ],
  'cu-37': [
    { id: 'vp-cu-37-1', name: 'Clean Feedstock', emoji: '✨', description: 'Recyclable copper' },
  ],
  'cu-38': [
    { id: 'vp-cu-38-1', name: 'Anti-microbials', emoji: '🦠', description: 'Research area' },
  ],
  'cu-39': [
    { id: 'vp-cu-39-1', name: 'Copper Recovery', emoji: '🥉', description: 'Recycling systems' },
  ],
  'cu-40': [
    { id: 'vp-cu-40-1', name: 'Cement Additive', emoji: '🏗️', description: 'Construction' },
    { id: 'vp-cu-40-2', name: 'Construction Aggregate', emoji: '🧱', description: 'Building material' },
  ],
  'cu-41': [
    { id: 'vp-cu-41-1', name: 'Returned to Smelting', emoji: '�', description: 'Process reuse' },
    { id: 'vp-cu-41-2', name: 'Hydromet Extraction', emoji: '💧', description: 'Metal recovery' },
  ],
  'cu-42': [
    { id: 'vp-cu-42-1', name: 'RDF Fuel', emoji: '🔥', description: 'Energy recovery' },
    { id: 'vp-cu-42-2', name: 'Pyrolysis Oil/Char', emoji: '🛢️', description: 'Chemical recovery' },
  ],
  'cu-43': [
    { id: 'vp-cu-43-1', name: 'RDF', emoji: '🔥', description: 'Refuse derived fuel' },
    { id: 'vp-cu-43-2', name: 'Chemical Feedstock', emoji: '🧪', description: 'Recycling' },
    { id: 'vp-cu-43-3', name: 'Energy Recovery', emoji: '⚡', description: 'Power generation' },
  ],
  'cu-44': [
    { id: 'vp-cu-44-1', name: 'Secondary Metals', emoji: '🔩', description: 'Pb, Sn, Zn recovery' },
  ],
  'cu-45': [
    { id: 'vp-cu-45-1', name: 'Recovered Salts', emoji: '🧂', description: 'Chemical recovery' },
    { id: 'vp-cu-45-2', name: 'Inert Filler', emoji: '⚪', description: 'Construction' },
  ],
  'cu-46': [
    { id: 'vp-cu-46-1', name: 'Construction Materials', emoji: '🏗️', description: 'Building' },
    { id: 'vp-cu-46-2', name: 'Landfill Filler', emoji: '⬇️', description: 'Inert disposal' },
  ],
  'cu-47': [
    { id: 'vp-cu-47-1', name: 'Recovered Metals', emoji: '⛏️', description: 'Resource recovery' },
    { id: 'vp-cu-47-2', name: 'Recycled Water', emoji: '🔄', description: 'Process reuse' },
  ],
  'cu-48': [
    { id: 'vp-cu-48-1', name: 'Cement Additive', emoji: '🏗️', description: 'Construction' },
    { id: 'vp-cu-48-2', name: 'Abrasive Media', emoji: '💥', description: 'Industrial' },
    { id: 'vp-cu-48-3', name: 'Aggregate', emoji: '🧱', description: 'Construction' },
  ],
  'cu-49': [
    { id: 'vp-cu-49-1', name: 'Mine Backfill', emoji: '🕳️', description: 'Mining' },
    { id: 'vp-cu-49-2', name: 'Construction Materials', emoji: '🏗️', description: 'Building' },
    { id: 'vp-cu-49-3', name: 'Secondary Recovery', emoji: '�', description: 'Metal extraction' },
  ],
  'cu-50': [
    { id: 'vp-cu-50-1', name: 'Metal Recovery', emoji: '⛏️', description: 'Resource recovery' },
    { id: 'vp-cu-50-2', name: 'Returned to Process', emoji: '↩️', description: 'Internal reuse' },
  ],
  'cu-51': [
    { id: 'vp-cu-51-1', name: 'Neutralized Solids', emoji: '⚪', description: 'Construction' },
    { id: 'vp-cu-51-2', name: 'Recovered Metals', emoji: '⛏️', description: 'Resource recovery' },
  ],
  'cu-52': [
    { id: 'vp-cu-52-1', name: 'Acid/Solvent Recovery', emoji: '🧪', description: 'Chemical recovery' },
    { id: 'vp-cu-52-2', name: 'Hydromet Reuse', emoji: '🔄', description: 'Process reuse' },
  ],
  'cu-53': [
    { id: 'vp-cu-53-1', name: 'Precious Metals', emoji: '💎', description: 'Extraction' },
  ],
  'cu-54': [
    { id: 'vp-cu-54-1', name: 'Stabilized Filler', emoji: '🏗️', description: 'Construction' },
    { id: 'vp-cu-54-2', name: 'Metal Recovery', emoji: '⛏️', description: 'Resource recovery' },
  ],
  'cu-55': [
    { id: 'vp-cu-55-1', name: 'Steam', emoji: '💨', description: 'Energy' },
    { id: 'vp-cu-55-2', name: 'Electricity', emoji: '⚡', description: 'Power' },
    { id: 'vp-cu-55-3', name: 'Space Heating', emoji: '🏠', description: 'Heating' },
    { id: 'vp-cu-55-4', name: 'Process Integration', emoji: '🔄', description: 'Efficiency' },
  ],
  'cu-56': [
    { id: 'vp-cu-56-1', name: 'Zero Liquid Discharge', emoji: '💧', description: 'Water conservation' },
    { id: 'vp-cu-56-2', name: 'Closed-loop Recycling', emoji: '🔄', description: 'Water reuse' },
  ],
  
  // Steel Valorization
  'st-1': [
    { id: 'vp-st-1-1', name: 'Mine Backfill', emoji: '🕳️', description: 'Pit reclamation' },
    { id: 'vp-st-1-2', name: 'Road Base', emoji: '🛣️', description: 'Construction aggregate' },
  ],
  'st-2': [
    { id: 'vp-st-2-1', name: 'Bricks', emoji: '🧱', description: 'Construction material' },
    { id: 'vp-st-2-2', name: 'Cement Additive', emoji: '🏗️', description: 'After processing' },
  ],
  'st-3': [
    { id: 'vp-st-3-1', name: 'Soil Additive', emoji: '🌱', description: 'Agricultural use' },
  ],
  'st-4': [
    { id: 'vp-st-4-1', name: 'Dust Suppression', emoji: '💦', description: 'Mine site use' },
  ],
  'st-5': [
    { id: 'vp-st-5-1', name: 'Dam Construction', emoji: '🧱', description: 'Tailings dam walls' },
  ],
  'st-6': [
    { id: 'vp-st-6-1', name: 'Ceramics', emoji: '🏺', description: 'Tile production' },
  ],
  'st-7': [
    { id: 'vp-st-7-1', name: 'Recycled Water', emoji: '🔄', description: 'Process reuse' },
  ],
  'st-8': [
    { id: 'vp-st-8-1', name: 'GGBFS (Cement)', emoji: '🏗️', description: 'Cement replacement' },
    { id: 'vp-st-8-2', name: 'Road Aggregate', emoji: '🛣️', description: 'Road construction' },
    { id: 'vp-st-8-3', name: 'Mineral Wool', emoji: '🧶', description: 'Insulation material' },
  ],
  'st-9': [
    { id: 'vp-st-9-1', name: 'Asphalt Aggregate', emoji: '🛣️', description: 'Road paving' },
    { id: 'vp-st-9-2', name: 'Soil Conditioner', emoji: '🌱', description: 'Liming agent' },
    { id: 'vp-st-9-3', name: 'Rail Ballast', emoji: '🛤️', description: 'Railway construction' },
  ],
  'st-10': [
    { id: 'vp-st-10-1', name: 'Sinter Feed', emoji: '🔥', description: 'Iron recovery' },
    { id: 'vp-st-10-2', name: 'Cement Clinker', emoji: '🏗️', description: 'Raw material' },
    { id: 'vp-st-10-3', name: 'Briquettes', emoji: '🧱', description: 'Furnace feed' },
  ],
  'st-11': [
    { id: 'vp-st-11-1', name: 'Zinc Recovery', emoji: '🛡️', description: 'Waelz kiln process' },
    { id: 'vp-st-11-2', name: 'Glazed Tiles', emoji: '🏺', description: 'Ceramic pigment' },
  ],
  'st-12': [
    { id: 'vp-st-12-1', name: 'Electricity', emoji: '⚡', description: 'Power generation' },
    { id: 'vp-st-12-2', name: 'Process Heat', emoji: '🔥', description: 'Stoves heating' },
  ],
  'st-13': [
    { id: 'vp-st-13-1', name: 'Hydrogen Recovery', emoji: '🧪', description: 'Chemical feedstock' },
    { id: 'vp-st-13-2', name: 'Power Generation', emoji: '⚡', description: 'Turbine fuel' },
  ],
  'st-14': [
    { id: 'vp-st-14-1', name: 'Refractory Recycling', emoji: '🧱', description: 'New bricks' },
    { id: 'vp-st-14-2', name: 'Slag Conditioner', emoji: '🧪', description: 'Steelmaking' },
  ],
  'st-15': [
    { id: 'vp-st-15-1', name: 'Gypsum Substitute', emoji: '⚪', description: 'Cement/Wallboard' },
    { id: 'vp-st-15-2', name: 'Road Base', emoji: '🛣️', description: 'Construction' },
  ],
  'st-16': [
    { id: 'vp-st-16-1', name: 'Regenerated Acid', emoji: '🧪', description: 'HCl recovery' },
    { id: 'vp-st-16-2', name: 'Iron Oxide Pigment', emoji: '🎨', description: 'Red pigment' },
    { id: 'vp-st-16-3', name: 'Ferric Chloride', emoji: '💧', description: 'Water treatment' },
  ],
  'st-17': [
    { id: 'vp-st-17-1', name: 'Iron Oxide', emoji: '🔴', description: 'Magnetic material' },
  ],
  'st-18': [
    { id: 'vp-st-18-1', name: 'Metal Recovery', emoji: '⛏️', description: 'Zn/Sn extraction' },
  ],
  'st-19': [
    { id: 'vp-st-19-1', name: 'Remelting', emoji: '🔥', description: 'Internal recycling' },
  ],
  'st-20': [
    { id: 'vp-st-20-1', name: 'Briquettes', emoji: '🧱', description: 'Furnace feed' },
  ],
  'st-21': [
    { id: 'vp-st-21-1', name: 'Sinter Feed', emoji: '🔥', description: 'After deoiling' },
  ],
  'st-22': [
    { id: 'vp-st-22-1', name: 'Energy Recovery', emoji: '⚡', description: 'Fuel source' },
  ],
  'st-23': [
    { id: 'vp-st-23-1', name: 'Recycling', emoji: '♻️', description: 'Material recovery' },
  ],
  'st-24': [
    { id: 'vp-st-24-1', name: 'Scrap Feed', emoji: '🔄', description: 'Remelting' },
  ],
  'st-25': [
    { id: 'vp-st-25-1', name: 'Metal Recovery', emoji: '⛏️', description: 'Collection systems' },
  ],
  'st-26': [
    { id: 'vp-st-26-1', name: 'EAF Feedstock', emoji: '⚡', description: 'Electric steelmaking' },
  ],
  'st-27': [
    { id: 'vp-st-27-1', name: 'Zinc Oxide', emoji: '⚪', description: 'Chemical/Rubber ind.' },
    { id: 'vp-st-27-2', name: 'Zinc Dust', emoji: '🌫️', description: 'Paint/Chemicals' },
  ],
  'st-28': [
    { id: 'vp-st-28-1', name: 'Detinning', emoji: '🥫', description: 'Tin recovery' },
    { id: 'vp-st-28-2', name: 'Steel Scrap', emoji: '🔩', description: 'Clean scrap' },
  ],
  'st-29': [
    { id: 'vp-st-29-1', name: 'Energy Recovery', emoji: '⚡', description: 'Waste-to-energy' },
    { id: 'vp-st-29-2', name: 'Plastics Recycling', emoji: '♻️', description: 'Polymer recovery' },
  ],
  'st-30': [
    { id: 'vp-st-30-1', name: 'District Heating', emoji: '🏠', description: 'Community heat' },
    { id: 'vp-st-30-2', name: 'Power Generation', emoji: '⚡', description: 'Steam turbines' },
  ],
  'st-31': [
    { id: 'vp-st-31-1', name: 'Zero Liquid Discharge', emoji: '💧', description: 'Water conservation' },
  ],
  'st-32': [
    { id: 'vp-st-32-1', name: 'Construction', emoji: '🏗️', description: 'Various uses' },
  ],
};

// Helper function to group by-products by category
const groupByCategory = (products) => {
  const grouped = {};
  products.forEach(product => {
    if (!grouped[product.category]) {
      grouped[product.category] = [];
    }
    grouped[product.category].push(product);
  });
  return grouped;
};

export default function AlchemyLab() {
  const [selectedMetal, setSelectedMetal] = useState('aluminium');
  const [canvasItems, setCanvasItems] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [collapsedCategories, setCollapsedCategories] = useState({});

  const toggleCategory = (category) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Get by-products based on selected metal and group by category
  const byProducts = BY_PRODUCTS[selectedMetal] || [];
  const groupedByProducts = groupByCategory(byProducts);

  // Get valorization products based on canvas items, grouped by source
  const valorizationProductsBySource = canvasItems.map(item => ({
    source: item,
    products: VALORIZATION_PRODUCTS[item.id] || []
  })).filter(group => group.products.length > 0);

  // Handle drag start from library
  const handleDragStart = useCallback((e, item) => {
    setDraggedItem(item);
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  // Handle drag over canvas
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }, []);

  // Handle drag leave canvas
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  // Handle drop on canvas
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    try {
      const data = e.dataTransfer.getData('application/json');
      const item = JSON.parse(data);
      
      // Check if item already exists in canvas
      if (!canvasItems.find(ci => ci.id === item.id)) {
        setCanvasItems(prev => [...prev, item]);
      }
    } catch (error) {
      console.error('Error parsing dropped item:', error);
    }
    
    setDraggedItem(null);
  }, [canvasItems]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setIsDragOver(false);
  }, []);

  // Remove item from canvas
  const removeFromCanvas = useCallback((itemId) => {
    setCanvasItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  // Clear entire canvas
  const clearCanvas = useCallback(() => {
    setCanvasItems([]);
  }, []);

  return (
    <div className="h-screen bg-[#FFFFFF] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <FlaskConical className="w-8 h-8 text-[#BA7967]" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Alchemy Lab</h1>
            <p className="text-sm text-gray-500">Combine by-products to discover valorization opportunities</p>
          </div>
        </div>
      </div>

      {/* Three Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column - By-Product Library */}
        <div className="w-[450px] bg-[#faf8f7] border-r border-gray-200 flex flex-col overflow-hidden">
          {/* Metal Selector */}
          <div className="p-4 border-b border-gray-200 bg-white shrink-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Metal Type
            </label>
            <div className="relative">
              <select
                value={selectedMetal}
                onChange={(e) => {
                  setSelectedMetal(e.target.value);
                  setCanvasItems([]); // Clear canvas when switching metals
                }}
                className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#BA7967] focus:border-transparent cursor-pointer hover:border-[#BA7967] transition-colors"
              >
                <option value="aluminium">🔘 Aluminium</option>
                <option value="copper">🔶 Copper</option>
                <option value="steel">🔩 Steel</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Library Header */}
          <div className="px-4 py-3 bg-[#faf8f7] border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2">
              <Beaker className="w-5 h-5 text-[#BA7967]" />
              <h2 className="font-semibold text-gray-800">By-Product Library</h2>
              <span className="ml-auto text-xs bg-[#BA7967] text-white px-2 py-0.5 rounded-full">
                {byProducts.length}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Drag items to the canvas</p>
          </div>

          {/* Scrollable By-Products List - Categorized */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex gap-4 items-start">
              {[0, 1].map(colIndex => (
                <div key={colIndex} className="flex-1 flex flex-col gap-4 min-w-0">
                  {Object.entries(groupedByProducts)
                    .filter((_, index) => index % 2 === colIndex)
                    .map(([category, items]) => (
                      <div key={category} className="rounded-xl overflow-hidden border border-gray-200 bg-white flex flex-col relative">
                        {/* Category Header */}
                        <div 
                          className={`${CATEGORIES[category]?.headerColor || 'bg-gray-100'} px-3 py-2 border-b border-gray-200 cursor-pointer flex items-center justify-between sticky top-0 z-10`}
                          onClick={() => toggleCategory(category)}
                        >
                          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                            <span className="text-lg">{CATEGORIES[category]?.emoji || '📦'}</span>
                            {category}
                            <span className="ml-2 text-xs bg-white/60 text-gray-600 px-2 py-0.5 rounded-full">
                              {items.length}
                            </span>
                          </h3>
                          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${collapsedCategories[category] ? '-rotate-90' : ''}`} />
                        </div>
                        
                        {/* Items in Category */}
                        {!collapsedCategories[category] && (
                          <div className="p-2 space-y-2">
                            {items.map((item) => {
                              const catConfig = CATEGORIES[item.category] || {};
                              const isInCanvas = canvasItems.find(ci => ci.id === item.id);
                              
                              return (
                                <div
                                  key={item.id}
                                  draggable={!isInCanvas}
                                  onDragStart={(e) => handleDragStart(e, item)}
                                  onDragEnd={handleDragEnd}
                                  className={`
                                    ${catConfig.color || 'bg-gray-50 border-gray-200'} 
                                    border rounded-lg p-2.5 
                                    ${isInCanvas 
                                      ? 'opacity-40 cursor-not-allowed' 
                                      : 'cursor-grab active:cursor-grabbing hover:shadow-md hover:scale-[1.02]'
                                    }
                                    transition-all duration-200
                                    ${draggedItem?.id === item.id ? 'opacity-50 scale-95' : ''}
                                  `}
                                >
                                  <div className="flex items-center gap-2">
                                    {!isInCanvas && (
                                      <GripVertical className="w-4 h-4 text-gray-400 shrink-0" />
                                    )}
                                    <span className="text-base">{item.emoji}</span>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-medium text-gray-800 text-sm truncate" title={item.name}>{item.name}</h4>
                                    </div>
                                    {isInCanvas && (
                                      <span className="text-green-600 text-xs">✓</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              ))}
            </div>

            {Object.keys(groupedByProducts).length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Beaker className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No by-products available</p>
              </div>
            )}
          </div>
        </div>

        {/* Center Column - Valorization Canvas */}
        <div className="flex-1 flex flex-col bg-[#f5f3f2] min-w-0">
          {/* Canvas Header */}
          <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#BA7967]" />
              <h2 className="font-semibold text-gray-800">Valorization Canvas</h2>
              {canvasItems.length > 0 && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {canvasItems.length} item{canvasItems.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {canvasItems.length > 0 && (
              <button
                onClick={clearCanvas}
                className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              flex-1 m-4 rounded-xl border-2 border-dashed transition-all duration-200
              ${isDragOver 
                ? 'border-[#BA7967] bg-[#BA7967]/5 scale-[1.01]' 
                : 'border-gray-300 bg-white/50'
              }
              ${canvasItems.length === 0 ? 'flex items-center justify-center' : 'p-4 overflow-y-auto'}
            `}
          >
            {canvasItems.length === 0 ? (
              <div className="text-center text-gray-400">
                <div className={`
                  w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center
                  ${isDragOver ? 'bg-[#BA7967]/10' : 'bg-gray-100'}
                  transition-colors duration-200
                `}>
                  <Package className={`w-10 h-10 ${isDragOver ? 'text-[#BA7967]' : 'text-gray-300'}`} />
                </div>
                <p className="text-lg font-medium">
                  {isDragOver ? 'Drop here!' : 'Drop by-products here'}
                </p>
                <p className="text-sm mt-1">
                  Drag items from the library to create combinations
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 content-start">
                {canvasItems.map((item) => {
                  const catConfig = CATEGORIES[item.category] || {};
                  return (
                    <div
                      key={item.id}
                      className={`
                        ${catConfig.color || 'bg-gray-50 border-gray-200'} 
                        border-2 rounded-lg p-3 pr-8 relative
                        shadow-sm hover:shadow-md transition-shadow
                        animate-in fade-in zoom-in duration-200
                      `}
                    >
                      <button
                        onClick={() => removeFromCanvas(item.id)}
                        className="absolute top-1 right-1 p-1 rounded-full hover:bg-black/10 transition-colors"
                        title="Remove from canvas"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{item.emoji}</span>
                        <h3 className="font-medium text-gray-800">{item.name}</h3>
                      </div>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        {CATEGORIES[item.category]?.emoji} {item.category}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Valorization Products */}
        <div className="w-80 bg-[#faf8f7] border-l border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-white border-b border-gray-200 shrink-0">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#BA7967]" />
              <h2 className="font-semibold text-gray-800">Valorization Products</h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Products based on your selection
            </p>
          </div>

          {/* Products List - Grouped by Source */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {valorizationProductsBySource.length > 0 ? (
              valorizationProductsBySource.map(({ source, products }) => {
                const catConfig = CATEGORIES[source.category] || {};
                return (
                  <div key={source.id} className="rounded-xl overflow-hidden border border-gray-200 bg-white">
                    {/* Source Header */}
                    <div className={`${catConfig.headerColor || 'bg-gray-100'} px-3 py-2 border-b border-gray-200`}>
                      <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                        <span>{source.emoji}</span>
                        {source.name}
                      </h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        {catConfig.emoji} {source.category} • {products.length} product{products.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    
                    {/* Products */}
                    <div className="p-2 space-y-2">
                      {products.map((product) => (
                        <div
                          key={product.id}
                          className="bg-linear-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-2.5 hover:shadow-md transition-all cursor-pointer"
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-lg shrink-0">{product.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-800 text-sm">{product.name}</h4>
                              <p className="text-xs text-gray-500 mt-0.5">{product.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex items-center justify-center text-center text-gray-400">
                <div>
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="font-medium">No products yet</p>
                  <p className="text-sm mt-1">
                    Add by-products to the canvas<br />to see valorization options
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Summary Footer */}
          {valorizationProductsBySource.length > 0 && (
            <div className="p-4 bg-white border-t border-gray-200 shrink-0">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total Products</span>
                <span className="font-semibold text-[#BA7967]">
                  {valorizationProductsBySource.reduce((acc, g) => acc + g.products.length, 0)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
