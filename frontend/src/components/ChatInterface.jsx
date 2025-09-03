import React, { useState, useRef, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Send, User, Bot, CheckCircle, HelpCircle, X, Copy, RotateCcw, Square } from 'lucide-react';

export function ChatInterface({ onContractGenerate, isLoading }) {
  const { handleAuthError } = useContext(AuthContext);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hi! I'm your AI legal assistant. I'll help you create a professional employment contract through a simple conversation. Let's start with the basics - what type of employment agreement are you looking to create today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [sessionData, setSessionData] = useState({
    contractType: '',
    clientName: '',
    otherPartyName: '',
    jurisdiction: 'California',
    requirements: '',
    step: 'contract_type',
    extractedParams: {}
  });
  const [isTyping, setIsTyping] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [progressIndicator, setProgressIndicator] = useState('0% complete');
  const [canForceGenerate, setCanForceGenerate] = useState(false);
  const [abortController, setAbortController] = useState(null);
  const scrollRef = useRef(null);

  // Intelligent AI conversation system
  const analyzeUserInput = async (userInput, conversationContext) => {
    try {
      const token = localStorage.getItem('token');
      console.log('Token available:', !!token);
      
      const response = await fetch('/api/ai/analyze-contract-requirements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userInput,
          conversationContext,
          analysisType: 'contract_guidance'
        })
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid, trigger logout
          console.log('Authentication failed, redirecting to login');
          handleAuthError();
          return {
            nextQuestion: "Your session has expired. Please log in again to continue.",
            analysis: null,
            suggestions: [],
            missingInfo: [],
            readyToGenerate: false
          };
        }
        
        const errorData = await response.text();
        console.error('API Error Response:', errorData);
        throw new Error(`API Error: ${response.status} - ${errorData}`);
      }

      const result = await response.json();
      console.log('AI Response:', result);
      return result;
    } catch (error) {
      console.error('AI Analysis Error:', error);
      return {
        nextQuestion: `I'm having trouble with the AI service (${error.message}). Could you tell me more about your employment contract needs?`,
        analysis: null,
        suggestions: [],
        missingInfo: [],
        readyToGenerate: false
      };
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Extract parameters from conversation text using pattern matching
  const extractParametersFromConversation = (conversationText, existingParams = {}) => {
    const params = { ...existingParams };
    const text = conversationText.toLowerCase();
    
    // Extract salary/compensation
    const salaryMatch = text.match(/\$?(\d{2,3}),?(\d{3})|(\d{2,3})k|\$(\d+)/g);
    if (salaryMatch) {
      const salaryStr = salaryMatch[salaryMatch.length - 1]; // Get the last mentioned salary
      let salary = salaryStr.replace(/[$,k]/g, '');
      if (salaryStr.includes('k')) {
        salary = parseInt(salary) * 1000;
      } else {
        salary = parseInt(salary.replace(',', ''));
      }
      if (salary > 20000) { // Reasonable salary check
        params['Annual Salary'] = `$${salary.toLocaleString()}`;
        params['Salary Amount'] = `$${salary.toLocaleString()}`;
      }
    }
    
    // Extract job titles
    const jobTitlePatterns = [
      /software developer/i, /developer/i, /engineer/i, /manager/i, 
      /director/i, /analyst/i, /consultant/i, /designer/i, /architect/i
    ];
    for (const pattern of jobTitlePatterns) {
      const match = conversationText.match(pattern);
      if (match) {
        params['Job Title'] = match[0];
        break;
      }
    }
    
    // Extract company name (look for patterns like "at CompanyName" or "for CompanyName")
    const companyMatch = conversationText.match(/(?:at|for|with|company)\s+([A-Z][a-zA-Z\s&]+)/i);
    if (companyMatch) {
      params['Company Name'] = companyMatch[1].trim();
    }
    
    // Extract employee name
    const nameMatch = conversationText.match(/(?:employee|hire|hiring)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i);
    if (nameMatch) {
      params['Employee Name'] = nameMatch[1];
    }
    
    // Extract work location/arrangement
    if (text.includes('remote')) {
      params['Work Location'] = 'Remote work arrangement';
    } else if (text.includes('hybrid')) {
      params['Work Location'] = 'Hybrid work arrangement';
    } else if (text.includes('office')) {
      params['Work Location'] = 'Office-based';
    }
    
    // Extract benefits info
    if (text.includes('health insurance') || text.includes('health benefits')) {
      params['Health Insurance'] = 'Health insurance benefits included';
    }
    
    if (text.includes('401k') || text.includes('retirement')) {
      params['Retirement Benefits'] = '401(k) retirement plan';
    }
    
    // Extract PTO/vacation
    const ptoMatch = text.match(/(\d+)\s+days?\s+(?:pto|vacation|time off)/i);
    if (ptoMatch) {
      params['PTO'] = `${ptoMatch[1]} days paid time off`;
    }
    
    // Extract probation period
    const probationMatch = text.match(/(\d+)\s*day\s*probation/i);
    if (probationMatch) {
      params['Probation Period'] = `${probationMatch[1]} day probation period`;
    }
    
    console.log('Extracted parameters from conversation:', params);
    return params;
  };

  const addMessage = (type, content) => {
    const newMessage = {
      id: Date.now(),
      type,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const simulateTyping = async (response) => {
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    setIsTyping(false);
    addMessage('bot', response);
  };

  const processUserInput = async (userInput) => {
    setIsTyping(true);
    
    try {
      // Build conversation context
      const conversationContext = {
        previousMessages: messages,
        extractedParams: sessionData.extractedParams,
        contractType: 'employment_agreement',
        jurisdiction: sessionData.jurisdiction
      };

      // Get AI analysis and next steps
      const aiResponse = await analyzeUserInput(userInput, conversationContext);
      
      // Update session data with any extracted information
      const updatedSessionData = {
        ...sessionData,
        extractedParams: {
          ...sessionData.extractedParams,
          ...aiResponse.extractedInfo
        }
      };
      setSessionData(updatedSessionData);

      // Update progress indicator if available
      if (aiResponse.progressIndicator) {
        console.log('Updating progress indicator:', aiResponse.progressIndicator);
        setProgressIndicator(aiResponse.progressIndicator);
      } else {
        // Calculate progress based on conversation length and extracted info
        const baseProgress = Math.min(70, Math.max(5, (messages.length / 12) * 70));
        const parameterBonus = Math.min(20, Object.keys(sessionData.extractedParams).length * 5);
        const progressValue = Math.round(baseProgress + parameterBonus);
        const calculatedProgress = `${progressValue}% complete`;
        console.log('Calculated progress indicator:', calculatedProgress);
        setProgressIndicator(calculatedProgress);
      }
      
      // Enable force generation if conversation has progressed enough
      const progressValue = parseInt((aiResponse.progressIndicator || progressIndicator)?.replace(/[^0-9]/g, '') || '0');
      const shouldEnableGenerate = progressValue >= 30 || messages.length >= 4 || Object.keys(sessionData.extractedParams).length >= 2;
      console.log('Should enable generate:', shouldEnableGenerate, 'Progress:', progressValue, 'Messages:', messages.length, 'Params:', Object.keys(sessionData.extractedParams).length);
      setCanForceGenerate(shouldEnableGenerate);

      setIsTyping(false);

      // If AI suggests contract is ready to generate
      if (aiResponse.readyToGenerate && aiResponse.contractParams) {
        addMessage('bot', "Perfect! I have all the information needed to create your professional employment contract. Let me generate it now with all the details we've discussed, including the specific clauses and protections we identified.");
        
        // Generate contract with AI-extracted parameters
        const contractParams = {
          contractType: "employment_agreement",
          parameters: aiResponse.contractParams,
          preferences: {
            risk_tolerance: aiResponse.recommendedRiskLevel || 'moderate',
            legal_stance: aiResponse.recommendedStance || 'neutral'
          },
          conversationalData: updatedSessionData,
          aiAnalysis: aiResponse.analysis,
          suggestedClauses: aiResponse.suggestedClauses,
          generationMethod: "conversational_ai" // Mark as AI chat generated
        };

        onContractGenerate(contractParams);
      } else {
        // Continue intelligent conversation
        let responseMessage = aiResponse.nextQuestion;
        
        // Add suggestions if AI identified any
        if (aiResponse.suggestions && aiResponse.suggestions.length > 0) {
          responseMessage += "\n\n💡 **Suggestions based on your requirements:**\n";
          aiResponse.suggestions.forEach((suggestion, index) => {
            responseMessage += `• ${suggestion}\n`;
          });
        }

        addMessage('bot', responseMessage);
      }
      
    } catch (error) {
      setIsTyping(false);
      console.error('Error processing user input:', error);
      addMessage('bot', "I apologize, but I'm having trouble processing your request. Could you please rephrase your requirements?");
    }
  };

  // Copy message to clipboard
  const copyToClipboard = async (text, event = null) => {
    try {
      await navigator.clipboard.writeText(text);
      console.log('Copied to clipboard:', text.substring(0, 50) + '...');
    } catch (err) {
      console.error('Failed to copy text:', err);
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        console.log('Copied using fallback method');
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
      }
    }
  };

  // Regenerate the last bot response
  const regenerateResponse = async (messageIndex) => {
    // Find the user message that prompted this bot response
    const userMessage = messages[messageIndex - 1];
    if (userMessage && userMessage.type === 'user') {
      // Remove the bot message and regenerate
      const newMessages = messages.slice(0, messageIndex);
      setMessages(newMessages);
      await processUserInput(userMessage.content);
    }
  };

  // Stop current AI generation
  const stopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsTyping(false);
    addMessage('bot', "Generation stopped. How can I help you with your contract?");
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    addMessage('user', userMessage);
    setInput('');

    await processUserInput(userMessage);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleForceGenerate = async () => {
    if (!canForceGenerate) return;
    
    addMessage('user', 'Generate contract now');
    setIsTyping(true);
    
    try {
      // Build conversation context
      const conversationContext = {
        messages: messages,
        extractedParams: sessionData.extractedParams,
        contractType: 'employment_agreement',
        jurisdiction: sessionData.jurisdiction
      };

      // Force generation by sending "generate" command
      const aiResponse = await analyzeUserInput('generate contract now', conversationContext);
      
      setIsTyping(false);

      if (aiResponse.readyToGenerate && aiResponse.contractParams) {
        addMessage('bot', "Perfect! I'll generate your employment contract now with all the information we've gathered.");
        
        const contractParams = {
          contractType: "employment_agreement",
          parameters: aiResponse.contractParams,
          preferences: {
            risk_tolerance: aiResponse.recommendedRiskLevel || 'moderate',
            legal_stance: aiResponse.recommendedStance || 'neutral'
          },
          conversationalData: sessionData,
          aiAnalysis: aiResponse.analysis,
          suggestedClauses: aiResponse.suggestedClauses
        };

        onContractGenerate(contractParams);
      } else {
        addMessage('bot', "I'm working on generating your contract now. Let me create it with the information we've discussed so far.");
        
        // Extract parameters from conversation messages
        const conversationText = messages.map(m => m.content).join(' ');
        const extractedParams = extractParametersFromConversation(conversationText, sessionData.extractedParams);
        
        // Force generation with extracted parameters
        const contractParams = {
          contractType: "employment_agreement",
          parameters: extractedParams,
          preferences: {
            risk_tolerance: 'moderate',
            legal_stance: 'neutral'
          },
          conversationalData: {
            ...sessionData,
            extractedParams: extractedParams,
            conversationSummary: conversationText
          },
          aiAnalysis: "Force generated by user request",
          suggestedClauses: [],
          generationMethod: "conversational_ai" // Mark as AI chat generated
        };

        console.log('Force generating with parameters:', contractParams);
        onContractGenerate(contractParams);
      }
      
    } catch (error) {
      setIsTyping(false);
      console.error('Force generation error:', error);
      addMessage('bot', "I'll generate the contract with the information we have. Let me create it now.");
      
      // Fallback generation
      const contractParams = {
        contractType: "employment_agreement",
        parameters: sessionData.extractedParams,
        preferences: { risk_tolerance: 'moderate', legal_stance: 'neutral' },
        conversationalData: sessionData
      };

      onContractGenerate(contractParams);
    }
  };

  const getProgressSteps = () => {
    const steps = [
      { id: 'contract_type', label: 'Contract Type', completed: !!sessionData.contractType },
      { id: 'client_name', label: 'Your Info', completed: !!sessionData.clientName },
      { id: 'employee_name', label: 'Employee Info', completed: !!sessionData.otherPartyName },
      { id: 'requirements', label: 'Position Details', completed: !!sessionData.requirements },
      { id: 'complete', label: 'Generate', completed: sessionData.step === 'complete' }
    ];
    return steps;
  };

  return (
    <Card className="h-[700px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-600" />
            AI Contract Assistant
            <Badge variant="secondary">Pro Feature</Badge>
          </div>
          <Dialog open={showHelp} onOpenChange={setShowHelp}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-purple-600 border-purple-200">
                <HelpCircle className="w-4 h-4 mr-1" />
                How it works
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  🤖 Intelligent AI Legal Assistant
                </DialogTitle>
              </DialogHeader>
              <div className="text-sm space-y-3">
                <div className="space-y-2">
                  <p>• <strong>Describe your needs:</strong> Tell me about your employment contract requirements in natural language</p>
                  <p>• <strong>Expert analysis:</strong> I'll analyze what you've provided and identify gaps, risks, and opportunities</p>
                  <p>• <strong>Smart suggestions:</strong> I'll recommend specific clauses, protections, and legal considerations you might miss</p>
                  <p>• <strong>Compliance guidance:</strong> I'll ensure your contract meets legal standards and best practices</p>
                  <p>• <strong>Professional polish:</strong> Final contract includes expert legal language and formatting</p>
                </div>
                <div className="p-3 bg-blue-50 rounded border">
                  <p className="text-sm font-medium text-blue-800 mb-2">Example conversation:</p>
                  <p className="text-sm text-blue-700">
                    <strong>You:</strong> "I need a software developer contract for $85k with remote work."<br/>
                    <strong>AI:</strong> "Great start! I notice you haven't mentioned IP assignment, non-compete terms, or confidentiality clauses. For a software role, I'd recommend..."
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <CardDescription className="flex items-center justify-between">
          <span>Let's create your employment contract through conversation</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {progressIndicator}
            </Badge>
            {canForceGenerate && (
              <Button 
                onClick={handleForceGenerate}
                size="sm" 
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={isTyping}
              >
                Generate Now
              </Button>
            )}
          </div>
        </CardDescription>
        
        {/* Progress Steps */}
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          {getProgressSteps().map((step, index) => (
            <div key={step.id} className="flex items-center gap-1">
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                step.completed 
                  ? 'bg-green-100 text-green-800' 
                  : sessionData.step === step.id 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-600'
              }`}>
                {step.completed ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <div className="w-3 h-3 rounded-full border border-current" />
                )}
                {step.label}
              </div>
              {index < getProgressSteps().length - 1 && (
                <div className="w-2 h-px bg-gray-300" />
              )}
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0 p-4">
        <ScrollArea className="flex-1 h-0">
          <div className="space-y-4 pr-4 pb-4">
            {messages.map((message) => (
              <div key={message.id} className="flex gap-3 mb-4">
                {message.type === 'bot' ? (
                  <>
                    {/* Bot avatar on left */}
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-blue-600" />
                    </div>
                    {/* Bot message */}
                    <div style={{ maxWidth: '280px' }} className="group">
                      <div className="px-4 py-2 rounded-lg bg-gray-100 text-gray-900" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                        <p className="text-sm" style={{ 
                          wordBreak: 'break-word', 
                          overflowWrap: 'break-word',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {message.content}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs opacity-70">
                            {message.timestamp.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-1 text-gray-500 hover:text-gray-700"
                              onClick={() => copyToClipboard(message.content)}
                              title="Copy message"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-1 text-gray-500 hover:text-gray-700"
                              onClick={() => regenerateResponse(messages.findIndex(m => m.id === message.id))}
                              title="Regenerate response"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Spacer to push user message to right */}
                    <div className="flex-1"></div>
                    {/* User message */}
                    <div style={{ maxWidth: '280px' }}>
                      <div className="px-4 py-2 rounded-lg bg-blue-600 text-white" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                        <p className="text-sm" style={{ 
                          wordBreak: 'break-word', 
                          overflowWrap: 'break-word',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {message.content}
                        </p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                    {/* User avatar on right */}
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                  </>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 justify-start items-start">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-blue-600" />
                </div>
                <div className="bg-gray-100 px-4 py-2 rounded-lg rounded-bl-none flex items-center gap-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300"></div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-1 text-gray-500 hover:text-red-600"
                    onClick={stopGeneration}
                    title="Stop generation"
                  >
                    <Square className="w-3 h-3 fill-current" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          <div ref={scrollRef} />
        </ScrollArea>

        <div className="flex gap-2 mt-4 flex-shrink-0">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your response..."
            disabled={isLoading || sessionData.step === 'complete'}
            className="flex-1"
          />
          <Button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading || sessionData.step === 'complete'}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}