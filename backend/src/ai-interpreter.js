const express = require('express');
const { GoogleAIProvider } = require('./ai-providers/google-ai-provider.js');
const { pool } = require('./db/pool');

const router = express.Router();

/**
 * AI Interpreter Endpoint
 * Converts natural language input to structured contract JSON
 * POST /api/ai/interpret
 * 
 * Body options:
 * - useAI: true/false (default: true)
 * - model: "gemini-2.5-pro" | "gemini-2.5-flash" (default: "gemini-2.5-pro")
 * - userInput: string (required when useAI: true)
 * - contractSpec: object (required when useAI: false)
 */
router.post('/interpret', async (req, res) => {
  try {
    const { 
      userInput, 
      contractSpec,
      context = {}, 
      useAI = true,
      model = 'gemini-2.5-pro'
    } = req.body;

    // Direct mode (bypass AI)
    if (!useAI) {
      if (!contractSpec || typeof contractSpec !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'contractSpec is required when useAI is false'
        });
      }

      return res.json({
        success: true,
        contractSpec: contractSpec,
        userInput: userInput || '[Direct Mode]',
        provider: { name: 'DirectMode', type: 'local', model: 'none' }
      });
    }

    // AI mode - validate input
    if (!userInput || typeof userInput !== 'string' || userInput.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'userInput is required and must be a non-empty string when useAI is true'
      });
    }

    // Initialize AI provider with selected model
    const aiProvider = new GoogleAIProvider({ model });
    
    // Generate contract specification using AI
    const aiGeneratedSpec = await aiProvider.generateContractSpec(userInput, context);

    res.json({
      success: true,
      contractSpec: aiGeneratedSpec,
      userInput: userInput,
      provider: aiProvider.getProviderInfo()
    });

  } catch (error) {
    console.error('AI Interpreter Error:', error);
    res.status(500).json({
      success: false,
      error: `AI interpretation failed: ${error.message}`
    });
  }
});

/**
 * Chat Session Management for Conversational AI
 * POST /api/ai/chat/start - Start new chat session
 * POST /api/ai/chat/message - Send message to existing session
 * GET /api/ai/chat/:sessionId - Get chat history
 */

// Start new chat session
router.post('/chat/start', async (req, res) => {
  try {
    const { contractType = 'employment_agreement' } = req.body;
    const userId = req.user.userId;

    const sessionData = {
      user_id: userId,
      contract_type: contractType,
      conversation_state: JSON.stringify({
        step: 'contract_type',
        extractedParams: {},
        messages: [
          {
            id: 1,
            type: 'bot',
            content: "Hi! I'm your AI legal assistant. I'll help you create a professional employment contract through a simple conversation. What type of employment agreement do you need?",
            timestamp: new Date().toISOString()
          }
        ]
      })
    };

    const result = await pool.query(
      `INSERT INTO chat_sessions (user_id, contract_type, conversation_state, created_at) 
       VALUES ($1, $2, $3, NOW()) 
       RETURNING id, created_at`,
      [sessionData.user_id, sessionData.contract_type, sessionData.conversation_state]
    );

    res.json({
      success: true,
      sessionId: result.rows[0].id,
      conversationState: JSON.parse(sessionData.conversation_state),
      createdAt: result.rows[0].created_at
    });

  } catch (error) {
    console.error('Chat session start error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start chat session'
    });
  }
});

// Send message to chat session
router.post('/chat/message', async (req, res) => {
  try {
    const { sessionId, message, conversationState } = req.body;
    const userId = req.user.userId;

    // Verify session belongs to user
    const sessionResult = await pool.query(
      'SELECT id FROM chat_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Chat session not found'
      });
    }

    // Update conversation state
    await pool.query(
      'UPDATE chat_sessions SET conversation_state = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(conversationState), sessionId]
    );

    // Process message with AI if needed
    const aiProvider = new GoogleAIProvider({ model: 'gemini-2.0-flash-exp' });
    
    // Enhanced conversational prompt for natural contract parameter extraction
    const conversationalPrompt = `You are an AI legal assistant helping extract contract parameters through natural conversation. 

Current conversation state: ${JSON.stringify(conversationState)}
User message: "${message}"

Based on the conversation, extract any relevant contract parameters and provide a natural, helpful response to continue the conversation. Focus on gathering:
- Company/client name
- Employee name
- Job title and duties
- Compensation details
- Benefits
- Work arrangement (remote/hybrid/onsite)
- Specific contract requirements

Respond in a conversational, professional tone. Ask follow-up questions to gather missing information.`;

    res.json({
      success: true,
      sessionId,
      conversationState,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process chat message'
    });
  }
});

// Get recent chat sessions for the user
router.get('/chat/recent', async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      'SELECT id, contract_type, created_at, updated_at FROM chat_sessions WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 10',
      [userId]
    );

    res.json({
      success: true,
      sessions: result.rows
    });
  } catch (error) {
    console.error('Get recent sessions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve recent sessions'
    });
  }
});

// Get chat history
router.get('/chat/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(
      'SELECT * FROM chat_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Chat session not found'
      });
    }

    const session = result.rows[0];
    res.json({
      success: true,
      session: {
        id: session.id,
        contractType: session.contract_type,
        conversationState: JSON.parse(session.conversation_state),
        createdAt: session.created_at,
        updatedAt: session.updated_at
      }
    });

  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve chat history'
    });
  }
});

// Intelligent contract requirements analysis
router.post('/analyze-contract-requirements', async (req, res) => {
  try {
    const { userInput, conversationContext, analysisType } = req.body;
    const userId = req.user.userId;

    const aiProvider = new GoogleAIProvider({ model: 'gemini-2.0-flash-exp' });
    
    // Check for force generation keywords
    const forceGenerationKeywords = [
      'generate', 'generate now', 'create contract', 'create the contract', 
      'proceed with contract', 'finish', 'done', 'complete', 'that\'s enough',
      'generate contract now', 'create it', 'proceed', 'move forward',
      'let\'s generate', 'ready to generate', 'create now'
    ];
    
    const shouldForceGenerate = forceGenerationKeywords.some(keyword => 
      userInput.toLowerCase().includes(keyword.toLowerCase())
    );

    // Count conversation turns to prevent endless loops
    const messages = conversationContext.messages || [];
    const conversationTurns = Math.floor(messages.length / 2); // Divide by 2 for user/bot pairs
    const maxTurns = 8; // Maximum 8 back-and-forth exchanges
    const shouldAutoGenerate = conversationTurns >= maxTurns;

    // Build intelligent analysis prompt with strategic employer protections focus
    const analysisPrompt = `You are an expert employment law attorney and legal AI assistant specializing in comprehensive, employer-protective employment contracts. Your role is to guide users through creating strategic, compliant employment contracts by:

1. **Strategic Analysis**: Analyze what they've provided vs. critical employer protections missing
2. **Risk Assessment**: Identify potential legal risks, compliance issues, and vulnerabilities  
3. **Protective Measures**: Suggest specific clauses for IP protection, non-compete, confidentiality, severance terms
4. **Compliance Assurance**: Ensure California employment law compliance and best practices
5. **Comprehensive Coverage**: Don't just collect basics - ensure strategic employer protections

**STRATEGIC EMPLOYER PROTECTIONS TO IDENTIFY:**
- IP assignment and invention clauses
- Non-compete and non-solicitation terms (where legally enforceable)
- Confidentiality and trade secret protection
- Termination procedures and severance terms
- Performance review processes and probation periods
- PTO payout policies and accrual rules
- Remote work security and equipment policies
- Expense reimbursement timelines and procedures
- Equity vesting schedules and treatment upon termination
- Background check and reference requirements
- Dispute resolution and arbitration clauses

**CRITICAL INSTRUCTIONS:**
- If user says words like "generate", "create contract", "proceed", "done", or similar - SET readyToGenerate to true
- After 6+ exchanges, prioritize generation over more questions
- Focus on strategic elements, not just basics - ask about protections they might not consider
- Suggest protective clauses they haven't mentioned
- Always consider California employment law requirements

**Current conversation context:**
${JSON.stringify(conversationContext, null, 2)}

**User's latest input:** "${userInput}"
**Force generation requested:** ${shouldForceGenerate}
**Conversation turns:** ${conversationTurns}/${maxTurns}
**Should auto-generate:** ${shouldAutoGenerate}

**Your task:** As a strategic employment law expert, analyze this input and respond with a JSON object containing:

RESPOND ONLY WITH VALID JSON:
{
  "nextQuestion": "Your strategic legal guidance or intelligent follow-up question (or generation confirmation)",
  "extractedInfo": {"key": "value"}, // Any contract parameters you can extract using comprehensive patterns
  "analysis": "Your legal analysis of what they've provided, strategic gaps, and employer protection needs",
  "suggestions": ["Strategic legal suggestion 1 with rationale", "Employer protection suggestion 2"], 
  "missingInfo": ["Critical missing element 1", "Strategic protection gap 2"],
  "riskAssessment": "Detailed legal risk analysis including compliance and strategic vulnerabilities",
  "recommendedClauses": ["ip_assignment", "confidentiality_2_years", "performance_reviews", "severance_standard"],
  "recommendedRiskLevel": "conservative|moderate|aggressive", 
  "recommendedStance": "pro_employee|neutral|pro_employer",
  "strategicProtections": ["Specific employer protection 1", "Legal safeguard 2"],
  "complianceNotes": ["CA law requirement 1", "Employment standard 2"],
  "readyToGenerate": ${shouldForceGenerate || shouldAutoGenerate}, // Force true if user requested or max turns reached
  "contractParams": {
    // When readyToGenerate is true, extract ALL available parameters from the conversation using the comprehensive Master Input Brief framework:
    // CORE DETAILS:
    // "Company Name": "extracted company name",
    // "Client Name": "extracted company name (same as Company Name)",
    // "Employee Name": "extracted employee name", 
    // "Other Party Name": "extracted employee name (same as Employee Name)",
    // "Job Title": "extracted job title/position",
    // "Annual Salary": "$XX,XXX extracted salary amount",
    // "Salary Amount": "numeric salary without $",
    // "Hourly Rate": "$XX/hour if applicable",
    // "Employment Type": "Full-time|Part-time|Contract",
    // "Work Hours": "XX hours per week",
    // "Start Date": "extracted start date",
    // "Work Arrangement": "Remote|Hybrid|On-site details",
    // "Work Location": "specific location or remote arrangement",
    // "Reports To": "manager/supervisor name or title",
    // 
    // BENEFITS & COMPENSATION:
    // "Health Insurance": "coverage details",
    // "Dental Insurance": "dental coverage if mentioned",
    // "Vision Insurance": "vision coverage if mentioned",
    // "Retirement Benefits": "401k details with match %",
    // "PTO Policy": "XX days/weeks paid time off",
    // "Annual PTO Days": "numeric PTO amount",
    // "Sick Leave": "sick leave policy",
    // "Bonus Structure": "bonus details and %",
    // "Equity Compensation": "stock options, shares, equity %",
    // "Vesting Schedule": "equity vesting details",
    // 
    // EMPLOYMENT TERMS:
    // "Probation Period": "XX days/months probationary period",
    // "Probationary Period Length": "XX days/months",
    // "Performance Reviews": "review schedule and process",
    // "Notice Period": "termination notice requirements",
    // "Severance Policy": "severance terms and duration",
    // 
    // LEGAL PROTECTIONS:
    // "Confidentiality": "confidentiality requirements",
    // "Confidentiality Duration": "duration of confidentiality post-termination",
    // "IP Assignment": "intellectual property assignment details",
    // "Non-Compete Period": "non-compete duration and scope",
    // "Non-Compete": "non-compete restrictions",
    // "Non-Solicitation Period": "non-solicitation duration",
    // "Non-Solicitation": "non-solicitation restrictions",
    // "Expense Reimbursement": "expense reimbursement policy and timeline",
    // 
    // JURISDICTION:
    // "Governing Law": "California (default) or specified jurisdiction",
    // "Jurisdiction": "legal jurisdiction for the contract"
  }, // Include all available parameters if readyToGenerate is true
  "suggestedClauses": ["Specific clause recommendations based on role and situation"],
  "progressIndicator": "${shouldForceGenerate || shouldAutoGenerate ? '100' : Math.min(90, Math.round(15 + (conversationTurns / maxTurns) * 75))}% complete"
}

${shouldForceGenerate ? `**USER REQUESTED GENERATION - SET readyToGenerate to true and extract contractParams from conversation context**

EXTRACT THESE PARAMETERS FROM THE CONVERSATION CONTEXT:
${JSON.stringify(conversationContext, null, 2)}

Look for and EXTRACT using Master Input Brief patterns:
- Company/employer name and client details
- Employee name and personal information  
- Job title/position and reporting structure
- Salary/compensation amount (annual, hourly, bonus)
- Work location and arrangement (remote/office/hybrid)
- Benefits mentioned (health, dental, vision, 401k, PTO, sick leave)
- Employment terms (start date, probation, performance reviews)
- Equity and stock options (shares, vesting schedule)
- Legal protections (IP, confidentiality, non-compete, non-solicitation)
- Termination terms (notice period, severance policy)
- Expense reimbursement and work policies
- Strategic employer protections discussed
- Any other contract details, clauses, or requirements mentioned

Use comprehensive pattern matching to extract maximum detail.
` : ''}
${shouldAutoGenerate ? `**MAX TURNS REACHED - SET readyToGenerate to true and extract contractParams from conversation**

EXTRACT COMPREHENSIVE PARAMETERS using Master Input Brief framework from CONVERSATION: 
${JSON.stringify(conversationContext, null, 2)}

Apply strategic legal analysis to identify:
1. All basic employment terms
2. Compensation and benefits details  
3. Strategic employer protection gaps
4. California employment law compliance needs
5. Risk mitigation clauses required
6. Professional development and review processes
7. Termination and post-employment restrictions
` : ''}

Focus on being an intelligent legal consultant, not a form-filler. Ask smart questions about gaps, suggest protective clauses they might not have considered, and ensure legal compliance.`;

    // Get AI analysis using direct model access
    const model = aiProvider.genAI.getGenerativeModel({ model: aiProvider.model });
    const aiResult = await model.generateContent(analysisPrompt);
    const aiText = await aiResult.response.text();
    
    // Parse the AI response
    let aiResponse;
    try {
      const cleanText = aiText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      aiResponse = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiText);
      // Fallback response
      aiResponse = {
        nextQuestion: "I'd be happy to help you create a professional employment contract. Could you tell me more about the position you're hiring for - including job title, compensation, and any specific requirements?",
        analysis: "Initial contract requirements needed",
        suggestions: [],
        missingInfo: ["Job title", "Compensation details", "Work arrangement"],
        readyToGenerate: false
      };
    }

    res.json({
      success: true,
      ...aiResponse
    });

  } catch (error) {
    console.error('Contract analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze contract requirements',
      nextQuestion: "I apologize for the technical issue. Could you describe your employment contract needs, and I'll do my best to help?"
    });
  }
});

// Legal language enhancement and polish
router.post('/enhance-contract-language', async (req, res) => {
  try {
    const { contractContent, contractParams, aiAnalysis } = req.body;
    const userId = req.user.userId;

    const aiProvider = new GoogleAIProvider({ model: 'gemini-2.5-pro' });
    
    // Build legal enhancement prompt
    const enhancementPrompt = `You are a senior legal expert specializing in employment contract drafting. Your task is to enhance and polish the provided contract content with professional legal language, ensuring:

1. **Professional Legal Terminology**: Replace casual language with precise legal terms
2. **Clause Structure**: Ensure proper legal clause formatting and numbering
3. **Enforceability**: Strengthen language for maximum legal enforceability  
4. **Compliance**: Ensure adherence to employment law standards
5. **Clarity**: Maintain readability while adding legal precision

**Original Contract Content:**
${contractContent}

**Contract Parameters:**
${JSON.stringify(contractParams, null, 2)}

**AI Analysis Context:**
${JSON.stringify(aiAnalysis, null, 2)}

**Instructions:**
- Enhance the contract with sophisticated legal language
- Add proper legal formatting and section structure
- Include standard legal provisions and boilerplate language
- Ensure all clauses are professionally worded
- Add appropriate legal disclaimers and enforceability language
- Maintain the original intent while elevating the professional quality

**Return the enhanced contract content as a complete, polished legal document.**`;

    // Get AI enhancement
    const model = aiProvider.genAI.getGenerativeModel({ model: aiProvider.model });
    const aiResult = await model.generateContent(enhancementPrompt);
    const enhancedContract = await aiResult.response.text();

    res.json({
      success: true,
      enhancedContract: enhancedContract.trim(),
      enhancements: [
        "Professional legal terminology applied",
        "Clause structure and formatting improved", 
        "Enforceability language strengthened",
        "Legal compliance verified",
        "Standard legal provisions added"
      ]
    });

  } catch (error) {
    console.error('Contract enhancement error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to enhance contract language',
      enhancedContract: contractContent // Return original as fallback
    });
  }
});

// Get user's recent chat sessions
router.get('/chat/recent', async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await pool.query(
      `SELECT id, contract_type, conversation_state, created_at, updated_at 
       FROM chat_sessions 
       WHERE user_id = $1 
       ORDER BY updated_at DESC 
       LIMIT 5`,
      [userId]
    );
    
    res.json({
      success: true,
      sessions: result.rows
    });
    
  } catch (error) {
    console.error('Recent chat sessions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent chat sessions'
    });
  }
});

module.exports = router;
