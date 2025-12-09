/**
 * Metal Streams Utility Functions
 * These functions handle calculations related to metal composition, melting, manufacturing, recycling, and valorization
 */

/**
 * Get default primary composition based on grade
 * @param {string} primaryGrade - The primary grade (e.g., 'P1020', 'P1050', etc.)
 * @returns {Object} Composition object with Al, Cu, Mg, Si, Others percentages
 */
export function getDefaultPrimaryComposition(primaryGrade) {
  const compositions = {
    'P1020': { Al: 99.2, Cu: 0.05, Mg: 0.05, Si: 0.25, Others: 0.45 },
    'P1050': { Al: 99.5, Cu: 0.05, Mg: 0.05, Si: 0.25, Others: 0.15 },
    'P1070': { Al: 99.7, Cu: 0.03, Mg: 0.03, Si: 0.20, Others: 0.04 },
    'P1080': { Al: 99.8, Cu: 0.02, Mg: 0.02, Si: 0.15, Others: 0.01 },
    'P1090': { Al: 99.9, Cu: 0.01, Mg: 0.01, Si: 0.07, Others: 0.01 },
  };
  
  return compositions[primaryGrade] || compositions['P1020'];
}

/**
 * Compute the combined melt composition from multiple streams
 * @param {Array} meltStreams - Array of stream objects with {id, mass, composition, sourceType}
 * @returns {Object} Combined composition with totalMass and composition percentages
 */
export function computeMeltComposition(meltStreams) {
  if (!meltStreams || meltStreams.length === 0) {
    return {
      totalMass: 0,
      composition: { Al: 0, Cu: 0, Mg: 0, Si: 0, Others: 0 }
    };
  }

  const totalMass = meltStreams.reduce((sum, stream) => sum + (stream.mass || 0), 0);
  
  if (totalMass === 0) {
    return {
      totalMass: 0,
      composition: { Al: 0, Cu: 0, Mg: 0, Si: 0, Others: 0 }
    };
  }

  // Calculate weighted composition
  const elements = ['Al', 'Cu', 'Mg', 'Si', 'Others'];
  const composition = {};
  
  elements.forEach(element => {
    const weightedSum = meltStreams.reduce((sum, stream) => {
      const streamMass = stream.mass || 0;
      const streamComposition = stream.composition || {};
      const elementPercent = streamComposition[element] || 0;
      return sum + (streamMass * elementPercent / 100);
    }, 0);
    
    composition[element] = (weightedSum / totalMass) * 100;
  });

  // Normalize to ensure total is 100%
  const total = Object.values(composition).reduce((sum, val) => sum + val, 0);
  if (total > 0) {
    Object.keys(composition).forEach(element => {
      composition[element] = (composition[element] / total) * 100;
    });
  }

  return {
    totalMass,
    composition
  };
}

/**
 * Compute makeup additions needed to reach target composition
 * @param {Object} target - Target composition with {name, composition, tolerance}
 * @param {Object} current - Current melt with {totalMass, composition}
 * @returns {Object} Additions needed for each element
 */
export function computeMakeupAdditions(target, current) {
  const currentMass = current.totalMass || 0;
  const currentComp = current.composition || {};
  const targetComp = target.composition || {};
  const tolerance = target.tolerance || {};

  if (currentMass === 0) {
    return {
      totalAdditions: 0,
      additions: {},
      finalComposition: targetComp,
      finalMass: 0
    };
  }

  const elements = ['Al', 'Cu', 'Mg', 'Si', 'Others'];
  const additions = {};
  let totalAdditions = 0;

  elements.forEach(element => {
    const currentPct = currentComp[element] || 0;
    const targetPct = targetComp[element] || 0;
    const tolerancePct = tolerance[element] || 0;

    // Calculate the difference considering tolerance
    const difference = targetPct - currentPct;
    
    // Only add if we're below target (minus tolerance)
    if (difference > tolerancePct) {
      // Calculate mass of pure element needed
      const currentElementMass = (currentMass * currentPct) / 100;
      const targetElementMass = (currentMass * targetPct) / 100;
      const additionMass = Math.max(0, targetElementMass - currentElementMass);
      
      additions[element] = additionMass;
      totalAdditions += additionMass;
    } else {
      additions[element] = 0;
    }
  });

  // Calculate final composition after additions
  const finalMass = currentMass + totalAdditions;
  const finalComposition = {};
  
  elements.forEach(element => {
    const currentElementMass = (currentMass * (currentComp[element] || 0)) / 100;
    const addedElementMass = additions[element] || 0;
    finalComposition[element] = ((currentElementMass + addedElementMass) / finalMass) * 100;
  });

  return {
    totalAdditions,
    additions,
    finalComposition,
    finalMass
  };
}

/**
 * Compute manufacturing output including product and internal scrap
 * @param {number} productMass - Target product mass
 * @param {number} scrapPct - Percentage of scrap generated
 * @returns {Object} Manufacturing balance with productMass and internalScrapMass
 */
export function computeManufacturingOutput(productMass, scrapPct) {
  const product = Number(productMass) || 0;
  const scrapPercent = Number(scrapPct) || 0;

  if (product === 0) {
    return {
      productMass: 0,
      internalScrapMass: 0,
      totalOutput: 0
    };
  }

  // If scrapPct is the percentage of total charge that becomes scrap
  // Then: product = totalCharge * (1 - scrapPct/100)
  // So: totalCharge = product / (1 - scrapPct/100)
  // And: scrap = totalCharge * (scrapPct/100)
  
  const scrapRate = scrapPercent / 100;
  const totalCharge = scrapRate >= 1 ? 0 : product / (1 - scrapRate);
  const internalScrapMass = totalCharge * scrapRate;

  return {
    productMass: product,
    internalScrapMass: internalScrapMass,
    totalOutput: product + internalScrapMass
  };
}

/**
 * Compute recycling result from scrap
 * @param {Object} scrapStream - Scrap stream with {id, mass, composition, sourceType}
 * @param {number} recoveryYield - Recovery yield percentage
 * @param {number} slagPercent - Slag percentage
 * @returns {Object} Recycling result with recovered mass, composition, and slag
 */
export function computeRecyclingResult(scrapStream, recoveryYield, slagPercent) {
  const scrapMass = scrapStream?.mass || 0;
  const scrapComposition = scrapStream?.composition || {};
  const yieldRate = Number(recoveryYield) / 100;
  const slagRate = Number(slagPercent) / 100;

  if (scrapMass === 0) {
    return {
      inputMass: 0,
      recoveredMass: 0,
      recoveredComposition: scrapComposition,
      slagMass: 0,
      lossPercent: 0
    };
  }

  const recoveredMass = scrapMass * yieldRate;
  const slagMass = scrapMass * slagRate;
  const lossMass = scrapMass - recoveredMass - slagMass;
  const lossPercent = (lossMass / scrapMass) * 100;

  // Recovered composition is similar to input (simplified assumption)
  const recoveredComposition = { ...scrapComposition };

  return {
    inputMass: scrapMass,
    recoveredMass: recoveredMass,
    recoveredComposition: recoveredComposition,
    slagMass: slagMass,
    lossPercent: lossPercent
  };
}

/**
 * Compute valorization result from slag
 * @param {number} slagMass - Mass of slag
 * @param {number} valorizationRate - Valorization rate percentage
 * @returns {Object} Valorization result with valorized mass and remaining waste
 */
export function computeValorizationResult(slagMass, valorizationRate) {
  const slag = Number(slagMass) || 0;
  const rate = Number(valorizationRate) / 100;

  if (slag === 0) {
    return {
      inputSlagMass: 0,
      valorizedMass: 0,
      remainingWaste: 0,
      valorizationPercent: 0
    };
  }

  const valorizedMass = slag * rate;
  const remainingWaste = slag - valorizedMass;

  return {
    inputSlagMass: slag,
    valorizedMass: valorizedMass,
    remainingWaste: remainingWaste,
    valorizationPercent: rate * 100
  };
}