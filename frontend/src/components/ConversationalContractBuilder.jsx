import React, { useState } from 'react';
import { ChatInterface } from './ChatInterface';
import { ContractVersionHistory } from './ContractVersionHistory';
import { SubscriptionGate, useSubscription } from './SubscriptionGate';
import { ProUpgradeFlow } from './ProUpgradeFlow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  History, 
  FileText, 
  Crown,
  Sparkles
} from 'lucide-react';

export function ConversationalContractBuilder({ onContractGenerate, isLoading }) {
  const [activeTab, setActiveTab] = useState('chat');
  const [contractData, setContractData] = useState(null);
  const [showUpgradeFlow, setShowUpgradeFlow] = useState(false);
  const [contractId, setContractId] = useState(null);
  const { userTier, hasAccess, refreshTier } = useSubscription();

  const handleChatContractGenerate = async (chatData) => {
    console.log('Chat data received for generation:', chatData);
    setContractData(chatData);
    
    // Generate the contract using the existing flow
    if (onContractGenerate) {
      const result = await onContractGenerate(chatData);
      if (result && result.contractId) {
        setContractId(result.contractId);
      }
    }
    
    // Switch to preview tab after generation to show contract details
    setActiveTab('preview');
  };

  // Note: Customization features moved to Enhanced section
  // All customization in AI Chat happens through conversation

  const handleVersionSelect = (version) => {
    console.log('Selected version:', version);
  };

  const handleVersionRestore = async (version) => {
    console.log('Restoring version:', version);
    // Implement version restoration logic
  };

  const handleUpgradeSuccess = () => {
    refreshTier();
    setShowUpgradeFlow(false);
  };

  // For basic users, show upgrade prompts
  if (!hasAccess('conversational_ai')) {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Conversational AI Contract Builder
              <Badge variant="secondary">Pro Feature</Badge>
            </CardTitle>
            <CardDescription>
              Create professional contracts through natural conversation with our AI assistant
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <SubscriptionGate
              feature="Conversational AI Contract Builder"
              userTier={userTier}
              requiredTier="pro"
              onUpgrade={() => setShowUpgradeFlow(true)}
            >
              <ChatInterface 
                onContractGenerate={handleChatContractGenerate}
                isLoading={isLoading}
              />
            </SubscriptionGate>
          </CardContent>
        </Card>

        <ProUpgradeFlow
          isOpen={showUpgradeFlow}
          onClose={() => setShowUpgradeFlow(false)}
          onSuccess={handleUpgradeSuccess}
        />
      </>
    );
  }

  // Pro users get full access
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Conversational AI Contract Builder
            <Badge className="bg-blue-100 text-blue-800">Pro Active</Badge>
          </CardTitle>
          <CardDescription>
            Professional contract generation through AI conversation, with preview and version control
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                AI Chat
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                Versions
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="mt-6">
              <ChatInterface 
                onContractGenerate={handleChatContractGenerate}
                isLoading={isLoading}
              />
            </TabsContent>


            <TabsContent value="history" className="mt-6">
              {contractId ? (
                <ContractVersionHistory
                  contractId={contractId}
                  onVersionSelect={handleVersionSelect}
                  onRestore={handleVersionRestore}
                />
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center justify-center h-32 text-center text-gray-500">
                      <History className="w-12 h-12 mb-3" />
                      <p className="text-sm">Generate a contract first to view version history</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="preview" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contract Preview</CardTitle>
                  <CardDescription>
                    Review your contract before finalizing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {contractData ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2">Contract Details</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Type:</span> {contractData.contractType}
                          </div>
                          <div>
                            <span className="font-medium">Client:</span> {contractData.parameters?.clientName}
                          </div>
                          <div>
                            <span className="font-medium">Employee:</span> {contractData.parameters?.otherPartyName}
                          </div>
                          <div>
                            <span className="font-medium">Jurisdiction:</span> {contractData.parameters?.jurisdiction}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium mb-2">AI Configuration</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Risk Tolerance:</span> {contractData.preferences?.risk_tolerance || 'Moderate'}
                          </div>
                          <div>
                            <span className="font-medium">Legal Stance:</span> {contractData.preferences?.legal_stance || 'Neutral'}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={() => setActiveTab('chat')}>
                          Edit Requirements
                        </Button>
                        <Button onClick={() => setActiveTab('history')} variant="outline">
                          View Versions
                        </Button>
                        <Button 
                          onClick={() => onContractGenerate && onContractGenerate(contractData)}
                          disabled={isLoading}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {isLoading ? 'Generating...' : 'Generate Final Contract'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-32 text-center text-gray-500">
                      <FileText className="w-12 h-12 mb-3" />
                      <p className="text-sm">Start a conversation to see contract preview</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <ProUpgradeFlow
        isOpen={showUpgradeFlow}
        onClose={() => setShowUpgradeFlow(false)}
        onSuccess={handleUpgradeSuccess}
      />
    </div>
  );
}