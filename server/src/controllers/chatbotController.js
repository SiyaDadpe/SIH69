/**
 * Chatbot Controller
 * Handles Gemini AI chatbot requests
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Handle chat message
 * POST /chat
 */
exports.chat = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ 
        success: false,
        error: 'Message is required and must be a non-empty string' 
      });
    }

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        success: false,
        error: 'Gemini API key not configured',
        reply: '⚠️ Chatbot is not configured. Please add GEMINI_API_KEY to server environment variables.'
      });
    }

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

    // Extract metal type from message context
    const metalMatch = message.match(/\[Metal: (ALUMINUM|COPPER)\]/i);
    const selectedMetal = metalMatch ? metalMatch[1].toLowerCase() : 'aluminum';
    const userMessage = message.replace(/\[Metal: (ALUMINUM|COPPER)\]\s*/i, '');

    // Create context about the LCA platform
    const systemContext = `You are an expert ${selectedMetal.toUpperCase()} production researcher and Life Cycle Assessment (LCA) specialist for ALVance platform.

Your role is to provide accurate, data-driven insights about ${selectedMetal} production based ONLY on the following verified data also read instructions carefully:

**${selectedMetal.toUpperCase()} PRODUCTION STAGES:**

${selectedMetal === 'aluminum' ? `
1. **Mining** - Bauxite extraction
   - Energy consumption: 50-150 kWh/ton
   - Water usage: 1000-3000 L/ton
   - Land use: 0.5-2 ha/ton
   - Major regions: Australia, China, Guinea, Brazil

2. **Beneficiation** - Bauxite processing to alumina (Bayer process)
   - Energy consumption: 200-400 kWh/ton
   - Chemicals: NaOH (sodium hydroxide), lime
   - Process temperature: 140-180°C
   - Output: Alumina (Al2O3)
   - Waste: Red mud (1-2 tons per ton of alumina)

3. **Refining** - Alumina purification
   - Energy consumption: 50-100 kWh/ton
   - Temperature: 1000-1200°C
   - Purity achieved: 99.5-99.9%

4. **Smelting** - Electrolytic reduction to aluminum (Hall-Héroult process)
   - Energy consumption: 13,000-15,000 kWh/ton (most energy-intensive stage)
   - GHG emissions: 1.5-2 ton CO2e/ton aluminum
   - Temperature: 940-980°C
   - Process: Electrolysis of alumina in molten cryolite
   - Carbon anode consumption: 400-450 kg/ton Al

5. **Manufacturing** - Casting, rolling, extrusion
   - Energy consumption: 500-1,500 kWh/ton
   - Products: Sheets, plates, foils, extrusions, castings
   - Alloys: Various (1000-7000 series)

6. **Recycling** - Scrap remelting
   - Energy consumption: 650-750 kWh/ton (95% energy savings vs primary)
   - Energy savings: Only 5% of primary production energy
   - Quality: Maintains properties indefinitely
   - Recycling rate: 75% for beverage cans, 90% for automotive

7. **Valorization** - Red mud utilization, waste recovery
   - Red mud applications: Construction materials, soil amendment, iron recovery
   - By-product recovery: Gallium, vanadium, scandium
` : `
1. **Mining** - Ore extraction (sulfide/oxide ores)
   - Energy consumption: 100-200 kWh/ton
   - Water usage: 500-2,000 L/ton
   - Ore grades: 0.5-2% Cu (declining globally)
   - Mining methods: Open-pit, underground

2. **Beneficiation** - Crushing, grinding, flotation
   - Energy consumption: 15-30 kWh/ton ore
   - Recovery rate: 85-95%
   - Process: Froth flotation for sulfide ores
   - Output: Copper concentrate (20-30% Cu)

3. **Refining** - Smelting and fire refining
   - Furnace types: Reverberatory, flash, electric
   - Energy consumption: 1,000-2,000 kWh/ton
   - Temperature: 1,200-1,300°C
   - Output: Blister copper (98-99% purity)
   - SO2 capture for sulfuric acid production

4. **Smelting** - Electrolytic refining to 99.99% purity
   - Energy consumption: 250-350 kWh/ton
   - Electrolyte: H2SO4 (sulfuric acid)
   - Purity achieved: 99.99% Cu (cathode copper)
   - Anode slime recovery: Gold, silver, selenium

5. **Manufacturing** - Wire, sheet, tube production
   - Energy consumption: 300-800 kWh/ton
   - Products: Electrical wire, tubes, sheets, rods
   - Alloys: Brass, bronze, copper-nickel

6. **Recycling** - Scrap processing
   - Energy consumption: 10-15 kWh/ton (85% energy savings)
   - Energy savings: 85% compared to primary production
   - Quality: Maintains electrical/thermal properties
   - Recycling rate: >95% for electrical applications

7. **Valorization** - Slag utilization, sulfuric acid recovery
   - Slag applications: Abrasives, roofing granules, concrete aggregate
   - Acid recovery: 2-3 tons H2SO4 per ton Cu
   - Precious metal recovery: Au, Ag from anode slime
`}

**PLATFORM CAPABILITIES:**
- **Wizard**: Step-by-step guided LCA workflow for each production stage
- **Canvas**: Visual drag-and-drop interface to build custom workflows
- **Analytics**: Interactive dashboards, Sankey diagrams, environmental impact visualizations
- **Reports**: Export comprehensive LCA reports in PDF/JSON formats
- **ML Models**: Predictive analytics and optimization recommendations for each stage

**YOUR INSTRUCTIONS:**
1. Give answer in tabular format where applicable
2. Answer questions using only the data provided above or related to it 
3. Be specific with numbers and ranges from the data
4. Cite the production stage when referencing data
5. If asked about data not provided above, clearly state "I don't have specific data on that"
6. Focus on sustainability, energy efficiency, and emissions reduction
7. Keep responses concise (2-4 sentences for simple questions, 5-6 sentences for complex topics)
8. When comparing stages, use the specific energy/emissions values provided
9. Suggest using platform features (Wizard, Canvas, Analytics) when relevant
10. give that answer in tabular form if possible as given below

| Stage | Energy (kWh/ton) | Key Metrics |
|-------|------------------|-------------|
| Mining | 50-150 | Water: 1000-3000 L/ton |
| Smelting | 13,000-15,000 | GHG: 1.5-2 ton CO2e/ton |`;

    // Generate response
    const prompt = `${systemContext}\n\nUser: ${userMessage}\n\nAssistant:`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return res.json({ 
      success: true,
      reply: text 
    });

  } catch (error) {
    console.error('❌ [Chatbot] Error:', error.message);
    
    // Handle specific error cases
    if (error.message?.includes('API key')) {
      return res.status(500).json({ 
        success: false,
        error: 'Invalid or missing API key',
        reply: '⚠️ Chatbot API key is invalid. Please check server configuration.'
      });
    }

    return res.status(500).json({ 
      success: false,
      error: 'Failed to generate response',
      reply: '⚠️ Sorry, I encountered an error. Please try again later.'
    });
  }
};
