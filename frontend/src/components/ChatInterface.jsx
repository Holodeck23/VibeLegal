import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Send, User, Bot, CheckCircle, HelpCircle, X } from 'lucide-react';

export function ChatInterface({ onContractGenerate, isLoading }) {
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
          suggestedClauses: aiResponse.suggestedClauses
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
        <CardDescription>
          Let's create your employment contract through conversation
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
                    <div style={{ maxWidth: '280px' }}>
                      <div className="px-4 py-2 rounded-lg bg-gray-100 text-gray-900" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
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
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-blue-600" />
                </div>
                <div className="bg-gray-100 px-4 py-2 rounded-lg rounded-bl-none">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300"></div>
                  </div>
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