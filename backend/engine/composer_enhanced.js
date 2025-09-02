const { promises: fs } = require('fs');
const path = require('path');

const CLAUSES_ENHANCED_PATH = path.join(__dirname, '..', 'clause_library_enhanced.json');
const CLAUSES_ORIGINAL_PATH = path.join(__dirname, '..', 'clause_library.json');

function selectClauseVariation(clauseKey, preferences = {}, clauses) {
  const clause = clauses.clauses[clauseKey];
  if (!clause || !clause.variations) {
    return null; // Signal that we need fallback
  }

  const { risk_tolerance = 'low', legal_stance = 'neutral' } = preferences;

  // Find the best matching variation
  for (const [variationKey, variation] of Object.entries(clause.variations)) {
    if (variation.risk_level === risk_tolerance && variation.legal_stance === legal_stance) {
      console.log(`✅ Exact match for ${clauseKey}: ${variationKey} (${variation.risk_level}/${variation.legal_stance})`);
      return variation;
    }
  }

  // Fallback: try to match just risk level
  for (const [variationKey, variation] of Object.entries(clause.variations)) {
    if (variation.risk_level === risk_tolerance) {
      console.log(`🟡 Risk-level match for ${clauseKey}: ${variationKey} (${variation.risk_level})`);
      return variation;
    }
  }

  // Last fallback: return first variation
  const firstVariation = Object.values(clause.variations)[0];
  console.log(`⚪ Using default for ${clauseKey}: ${firstVariation.risk_level}/${firstVariation.legal_stance}`);
  return firstVariation;
}

async function composeContractEnhanced(userInput) {
  try {
    console.log("🚀 Enhanced composer called with preferences:", userInput.preferences);
    const enhancedClauses = JSON.parse(await fs.readFile(CLAUSES_ENHANCED_PATH, 'utf-8'));
    const originalClauses = JSON.parse(await fs.readFile(CLAUSES_ORIGINAL_PATH, 'utf-8'));
    const scaffold = JSON.parse(await fs.readFile(path.join(__dirname, '..', 'contract_employment_agreement.json'), 'utf-8'));

    const clauseMetadata = [];
    const contractBody = scaffold.clauses.map((clauseKey, index) => {
      console.log("🎯 Processing clause:", clauseKey);
      let selectedVariation = selectClauseVariation(clauseKey, userInput.preferences, enhancedClauses);
      let source = 'enhanced';
      
      if (!selectedVariation) {
        console.log("🔄 Using original clause for:", clauseKey);
        selectedVariation = originalClauses.clauses[clauseKey] || { 
          clause: `[Missing clause: ${clauseKey}]`, 
          title: clauseKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        };
        source = 'original';
      } else {
        console.log("✅ Using enhanced clause for:", clauseKey);
      }

      // Track clause metadata
      clauseMetadata.push({
        key: clauseKey,
        title: selectedVariation.title || clauseKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        source: source,
        risk_level: selectedVariation.risk_level || 'unknown',
        legal_stance: selectedVariation.legal_stance || 'unknown',
        legal_justification: selectedVariation.legal_justification || 'Standard legal provision'
      });

      const populatedClause = populatePlaceholders(selectedVariation.clause, userInput.parameters);
      const title = selectedVariation.title || enhancedClauses.clauses[clauseKey]?.title || clauseKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      return `## ${index + 1}. ${title}\n\n${populatedClause}\n\n`;
    }).join('');

    return {
      content: contractBody,
      metadata: {
        version: "enhanced_v3.0.0",
        clause_count: scaffold.clauses.length,
        risk_profile: userInput.preferences?.risk_tolerance || 'low',
        legal_stance: userInput.preferences?.legal_stance || 'neutral',
        enhanced_clauses_used: clauseMetadata.filter(c => c.source === 'enhanced').length,
        original_clauses_used: clauseMetadata.filter(c => c.source === 'original').length,
        clause_breakdown: clauseMetadata,
        jurisdiction: "California",
        contract_type: "Employment Agreement"
      }
    };
  } catch (error) {
    console.log('Enhanced system unavailable, using original');
    const { composeContract } = require('./composer.js');
    return await composeContract(userInput);
  }
}

function populatePlaceholders(text, parameters) {
  return text.replace(/\[([\w\s/]+)\]/g, (match, placeholderName) => {
    const key = placeholderName.trim();
    return parameters[key] !== undefined ? parameters[key] : `[!!MISSING_DATA: ${key}!!]`;
  });
}

module.exports = { composeContractEnhanced };
