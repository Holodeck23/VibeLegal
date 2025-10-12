# Codex Implementation Plan: AI Chat Management + Local LLM Support

**Branch:** `feature/ai-chat-management`
**Timeline:** 2-3 days
**Priority:** Local LLM switch (Partner setup) + Save AI Chats

---

## 🎯 PHASE 1: Local LLM Provider Infrastructure (PRIORITY)

### Overview
Enable enterprise users to switch from Google AI to local LLM (Ollama, LM Studio, etc.) for complete data privacy.

### 1.1 Database Schema Updates

**File:** Create new migration or run SQL directly

```sql
-- Add local LLM configuration to users table
ALTER TABLE users ADD COLUMN local_llm_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN local_llm_endpoint VARCHAR(500);
ALTER TABLE users ADD COLUMN local_llm_model VARCHAR(100);
ALTER TABLE users ADD COLUMN local_llm_api_key VARCHAR(255);

-- Example values after setup:
-- local_llm_enabled: true
-- local_llm_endpoint: 'http://localhost:11434/api/generate' (Ollama)
-- local_llm_model: 'llama3.1:70b' or 'mistral' etc.
-- local_llm_api_key: NULL (most local LLMs don't need this)
```

### 1.2 Create Local LLM Provider

**File:** `backend/src/ai-providers/local-llm-provider.js` (NEW FILE)

```javascript
/**
 * Local LLM Provider for Ollama, LM Studio, or any OpenAI-compatible endpoint
 * Supports enterprise users who want complete data privacy
 */

class LocalLLMProvider {
  constructor(config) {
    this.endpoint = config.endpoint; // e.g., 'http://localhost:11434/api/generate'
    this.model = config.model; // e.g., 'llama3.1:70b', 'mistral', 'qwen2.5-coder'
    this.apiKey = config.apiKey || null; // Optional for most local setups
    this.type = 'local';
  }

  /**
   * Generate contract spec from user input (compatible with Google AI interface)
   */
  async generateContractSpec(userInput, context = {}) {
    const prompt = this._buildContractSpecPrompt(userInput, context);

    const response = await this._makeRequest(prompt);

    // Parse JSON response (local LLMs should return structured data)
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse local LLM response:', response);
      // Fallback: return basic structure
      return {
        contractType: 'employment_agreement',
        parties: { client: 'Unknown', otherParty: 'Unknown' },
        parameters: {}
      };
    }
  }

  /**
   * Generate conversational AI response (for chat interface)
   */
  async generateConversationResponse(prompt) {
    return await this._makeRequest(prompt);
  }

  /**
   * Make request to local LLM endpoint
   * Supports both Ollama and OpenAI-compatible APIs
   */
  async _makeRequest(prompt) {
    const isOllama = this.endpoint.includes('ollama') || this.endpoint.includes('11434');

    const requestBody = isOllama ? {
      model: this.model,
      prompt: prompt,
      stream: false,
      format: 'json' // Request JSON output from Ollama
    } : {
      // OpenAI-compatible format (LM Studio, vLLM, etc.)
      model: this.model,
      messages: [
        { role: 'system', content: 'You are a legal AI assistant. Always respond with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    };

    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Local LLM request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Extract response text (format varies by provider)
    if (isOllama) {
      return data.response;
    } else {
      // OpenAI-compatible
      return data.choices[0].message.content;
    }
  }

  _buildContractSpecPrompt(userInput, context) {
    return `You are a legal contract analysis AI. Analyze this user input and extract structured contract information.

User Input: "${userInput}"
Context: ${JSON.stringify(context)}

Respond with ONLY valid JSON in this exact format:
{
  "contractType": "employment_agreement",
  "parties": {
    "client": "Company Name",
    "otherParty": "Employee Name"
  },
  "parameters": {
    "Job Title": "extracted value",
    "Annual Salary": "extracted value",
    "Start Date": "extracted value"
  },
  "jurisdiction": "California"
}`;
  }

  getProviderInfo() {
    return {
      name: 'LocalLLM',
      type: 'local',
      model: this.model,
      endpoint: this.endpoint
    };
  }
}

module.exports = { LocalLLMProvider };
```

### 1.3 Update AI Provider Factory

**File:** `backend/src/ai-interpreter.js`

**Find the line:** `const aiProvider = new GoogleAIProvider({ model: 'gemini-2.0-flash-exp' });`

**Replace with provider factory pattern:**

```javascript
// Add at top of file
const { LocalLLMProvider } = require('./ai-providers/local-llm-provider.js');

// Create helper function to get the right provider
async function getAIProvider(userId) {
  // Check if user has local LLM enabled
  const userResult = await pool.query(
    'SELECT local_llm_enabled, local_llm_endpoint, local_llm_model, local_llm_api_key FROM users WHERE id = $1',
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = userResult.rows[0];

  // If user has local LLM configured, use it
  if (user.local_llm_enabled && user.local_llm_endpoint) {
    console.log(`🏠 Using Local LLM for user ${userId}: ${user.local_llm_model} at ${user.local_llm_endpoint}`);
    return new LocalLLMProvider({
      endpoint: user.local_llm_endpoint,
      model: user.local_llm_model,
      apiKey: user.local_llm_api_key
    });
  }

  // Otherwise, use Google AI (default)
  console.log(`☁️ Using Google AI for user ${userId}`);
  return new GoogleAIProvider({ model: 'gemini-2.0-flash-exp' });
}

// Then update all routes that use aiProvider:

// BEFORE:
router.post('/chat/message', asyncHandler(async (req, res) => {
  // ...
  const aiProvider = new GoogleAIProvider({ model: 'gemini-2.0-flash-exp' });
  const aiAnalysis = await analyzeConversationTurn(message, updatedStateWithUserMessage, aiProvider);
  // ...
}));

// AFTER:
router.post('/chat/message', asyncHandler(async (req, res) => {
  const { sessionId, message, conversationState } = req.body;
  const userId = req.user.userId;

  // ... session validation ...

  // Get the appropriate AI provider for this user
  const aiProvider = await getAIProvider(userId);
  const aiAnalysis = await analyzeConversationTurn(message, updatedStateWithUserMessage, aiProvider);
  // ...
}));
```

**Apply this pattern to ALL these routes:**
1. `POST /api/ai/chat/message` (line ~279)
2. `POST /api/ai/analyze-contract-requirements` (line ~409)
3. `POST /api/ai/enhance-contract-language` (line ~424)
4. `POST /api/generate-contract` in `server.js` (line ~277)
5. `POST /api/generate-contract-enhanced` in `server.js` (line ~308)

### 1.4 Update Local LLM Provider to Match Google AI Interface

**File:** `backend/src/ai-providers/local-llm-provider.js`

**Add this method to match GoogleAIProvider interface:**

```javascript
class LocalLLMProvider {
  // ... existing code ...

  // Add genAI property to match GoogleAIProvider interface
  get genAI() {
    return {
      getGenerativeModel: (config) => {
        return {
          generateContent: async (prompt) => {
            const responseText = await this._makeRequest(prompt);
            return {
              response: {
                text: async () => responseText
              }
            };
          }
        };
      }
    };
  }

  // Keep existing methods...
}
```

This ensures `analyzeConversationTurn` works with both providers without modification.

### 1.5 Settings UI for Local LLM Configuration

**File:** `frontend/src/components/Settings.jsx` (or create if doesn't exist)

```jsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Server, Cloud, AlertCircle, CheckCircle2 } from 'lucide-react';

export function Settings() {
  const [localLLMEnabled, setLocalLLMEnabled] = useState(false);
  const [endpoint, setEndpoint] = useState('http://localhost:11434/api/generate');
  const [model, setModel] = useState('llama3.1:70b');
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [testStatus, setTestStatus] = useState(null);

  useEffect(() => {
    // Load current settings
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setLocalLLMEnabled(data.local_llm_enabled || false);
        setEndpoint(data.local_llm_endpoint || 'http://localhost:11434/api/generate');
        setModel(data.local_llm_model || 'llama3.1:70b');
        setApiKey(data.local_llm_api_key || '');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const testConnection = async () => {
    setTestStatus('testing');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/test-local-llm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ endpoint, model, apiKey })
      });

      if (response.ok) {
        setTestStatus('success');
      } else {
        setTestStatus('error');
      }
    } catch (error) {
      setTestStatus('error');
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          local_llm_enabled: localLLMEnabled,
          local_llm_endpoint: endpoint,
          local_llm_model: model,
          local_llm_api_key: apiKey
        })
      });

      if (response.ok) {
        alert('Settings saved successfully!');
      }
    } catch (error) {
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            AI Provider Settings
            <Badge variant="secondary">Enterprise</Badge>
          </CardTitle>
          <CardDescription>
            Choose between cloud AI (Google Gemini) or your own local LLM for complete data privacy
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Provider Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {localLLMEnabled ? (
                  <Server className="w-5 h-5 text-green-600" />
                ) : (
                  <Cloud className="w-5 h-5 text-blue-600" />
                )}
                <Label htmlFor="llm-toggle" className="text-base font-medium">
                  {localLLMEnabled ? 'Local LLM (Private)' : 'Cloud AI (Google Gemini)'}
                </Label>
              </div>
              <p className="text-sm text-gray-500">
                {localLLMEnabled
                  ? 'All AI processing stays on your machine. Maximum privacy.'
                  : 'Uses Google Gemini API. Data sent to Google servers.'}
              </p>
            </div>
            <Switch
              id="llm-toggle"
              checked={localLLMEnabled}
              onCheckedChange={setLocalLLMEnabled}
            />
          </div>

          {/* Local LLM Configuration */}
          {localLLMEnabled && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
              <h3 className="font-medium text-sm">Local LLM Configuration</h3>

              <div className="space-y-2">
                <Label htmlFor="endpoint">Endpoint URL</Label>
                <Input
                  id="endpoint"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="http://localhost:11434/api/generate"
                />
                <p className="text-xs text-gray-500">
                  Ollama: http://localhost:11434/api/generate<br/>
                  LM Studio: http://localhost:1234/v1/chat/completions
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model Name</Label>
                <Input
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="llama3.1:70b"
                />
                <p className="text-xs text-gray-500">
                  Examples: llama3.1:70b, mistral, qwen2.5-coder:32b, deepseek-coder-v2
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key (optional)</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Leave empty for local Ollama/LM Studio"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={testConnection} variant="outline" className="flex-1">
                  Test Connection
                </Button>
                {testStatus === 'testing' && (
                  <Badge variant="secondary">Testing...</Badge>
                )}
                {testStatus === 'success' && (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                )}
                {testStatus === 'error' && (
                  <Badge variant="destructive">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Failed
                  </Badge>
                )}
              </div>
            </div>
          )}

          <Button onClick={saveSettings} disabled={isSaving} className="w-full">
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">About Local LLMs</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-gray-600">
          <p>• <strong>Complete Privacy:</strong> Your contract data never leaves your computer</p>
          <p>• <strong>No API Costs:</strong> Unlimited usage without per-request charges</p>
          <p>• <strong>Offline Capable:</strong> Works without internet connection</p>
          <p>• <strong>Model Choice:</strong> Use any Ollama, LM Studio, or compatible model</p>
          <p className="pt-2 text-xs">
            Recommended: Llama 3.1 70B, Qwen2.5-Coder 32B, or DeepSeek Coder V2 for best legal contract quality
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 1.6 Backend API Endpoints for Settings

**File:** `backend/src/subscription-service.js` (add to existing file)

```javascript
// Get user settings
router.get('/settings', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const result = await pool.query(
    `SELECT local_llm_enabled, local_llm_endpoint, local_llm_model, local_llm_api_key
     FROM users WHERE id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(result.rows[0]);
}));

// Update user settings
router.put('/settings', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { local_llm_enabled, local_llm_endpoint, local_llm_model, local_llm_api_key } = req.body;

  await pool.query(
    `UPDATE users
     SET local_llm_enabled = $1,
         local_llm_endpoint = $2,
         local_llm_model = $3,
         local_llm_api_key = $4,
         updated_at = NOW()
     WHERE id = $5`,
    [local_llm_enabled, local_llm_endpoint, local_llm_model, local_llm_api_key, userId]
  );

  res.json({ message: 'Settings updated successfully' });
}));

// Test local LLM connection
router.post('/test-local-llm', authenticateToken, asyncHandler(async (req, res) => {
  const { endpoint, model, apiKey } = req.body;

  try {
    const { LocalLLMProvider } = require('./ai-providers/local-llm-provider.js');
    const provider = new LocalLLMProvider({ endpoint, model, apiKey });

    // Test with simple prompt
    const testPrompt = 'Respond with valid JSON: {"status": "ok"}';
    const response = await provider._makeRequest(testPrompt);

    res.json({ success: true, message: 'Connection successful', response });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
}));
```

---

## 🎯 PHASE 2: Save AI Chats Feature

### 2.1 Database Schema Updates

```sql
-- Add columns to existing chat_sessions table
ALTER TABLE chat_sessions ADD COLUMN name VARCHAR(255);
ALTER TABLE chat_sessions ADD COLUMN is_saved BOOLEAN DEFAULT FALSE;

-- Index for faster queries
CREATE INDEX idx_chat_sessions_user_saved ON chat_sessions(user_id, is_saved);
```

### 2.2 Update ChatInterface with Save Button

**File:** `frontend/src/components/ChatInterface.jsx`

**Add at top with other imports:**
```jsx
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Save } from 'lucide-react';
```

**Add state for save dialog:**
```jsx
const [showSaveDialog, setShowSaveDialog] = useState(false);
const [chatName, setChatName] = useState('');
const [isSaving, setIsSaving] = useState(false);
```

**Add save function:**
```jsx
const handleSaveChat = async () => {
  if (!chatName.trim()) {
    alert('Please enter a name for this chat');
    return;
  }

  setIsSaving(true);
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/ai/chat/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        sessionId: currentSessionId,
        name: chatName
      })
    });

    if (response.ok) {
      alert('Chat saved successfully!');
      setShowSaveDialog(false);
      setChatName('');
    }
  } catch (error) {
    alert('Failed to save chat');
  } finally {
    setIsSaving(false);
  }
};
```

**Add Save button in header (around line 204, next to "How it works" button):**
```jsx
<Button
  variant="outline"
  size="sm"
  onClick={() => setShowSaveDialog(true)}
  className="text-purple-600 border-purple-200"
  disabled={messages.length <= 1 || !currentSessionId}
>
  <Save className="w-4 h-4 mr-1" />
  Save Chat
</Button>

<Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Save AI Chat Session</DialogTitle>
      <DialogDescription>
        Give this conversation a name to find it later
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-4 mt-4">
      <Input
        value={chatName}
        onChange={(e) => setChatName(e.target.value)}
        placeholder="e.g., Software Engineer Contract - Acme Corp"
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            handleSaveChat();
          }
        }}
      />
      <Button onClick={handleSaveChat} disabled={isSaving} className="w-full">
        {isSaving ? 'Saving...' : 'Save Chat'}
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

### 2.3 Backend Endpoint for Saving Chats

**File:** `backend/src/ai-interpreter.js`

**Add new route:**
```javascript
// Save chat with custom name
router.post('/chat/save', asyncHandler(async (req, res) => {
  const { sessionId, name } = req.body;
  const userId = req.user.userId;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Chat name is required' });
  }

  // Verify session belongs to user
  const result = await pool.query(
    'UPDATE chat_sessions SET name = $1, is_saved = TRUE, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING id',
    [name.trim(), sessionId, userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Chat session not found' });
  }

  res.json({ success: true, message: 'Chat saved successfully' });
}));
```

---

## 🎯 PHASE 3: Dashboard Integration

### 3.1 Update Dashboard to Show Saved Chats

**File:** `frontend/src/components/Dashboard.jsx`

**Add tabs for Contracts and Saved Chats:**

```jsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, FileText } from 'lucide-react';

// Add state
const [savedChats, setSavedChats] = useState([]);
const [activeTab, setActiveTab] = useState('contracts');

// Add fetch function
const fetchSavedChats = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/ai/chat/saved', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      setSavedChats(data.chats);
    }
  } catch (error) {
    console.error('Failed to fetch saved chats:', error);
  }
};

// Call in useEffect
useEffect(() => {
  fetchContracts();
  fetchSavedChats();
}, []);

// Update render to use tabs
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList className="grid w-full grid-cols-2">
    <TabsTrigger value="contracts">
      <FileText className="w-4 h-4 mr-2" />
      Contracts ({contracts.length})
    </TabsTrigger>
    <TabsTrigger value="chats">
      <MessageSquare className="w-4 h-4 mr-2" />
      Saved Chats ({savedChats.length})
    </TabsTrigger>
  </TabsList>

  <TabsContent value="contracts">
    {/* Existing contracts list */}
  </TabsContent>

  <TabsContent value="chats">
    <div className="space-y-4">
      {savedChats.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No saved chats yet</p>
            <p className="text-sm text-gray-400 mt-2">
              Use the "Save Chat" button in AI Chat to save conversations
            </p>
          </CardContent>
        </Card>
      ) : (
        savedChats.map((chat) => (
          <Card key={chat.id} className="hover:border-purple-300 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium">{chat.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                    <span>{new Date(chat.created_at).toLocaleDateString()}</span>
                    <span>{JSON.parse(chat.conversation_state).messages.length} messages</span>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    // Navigate to AI Chat with this session
                    window.location.href = `/create-contract?resumeChat=${chat.id}`;
                  }}
                  variant="outline"
                  size="sm"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Resume
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  </TabsContent>
</Tabs>
```

### 3.2 Backend Endpoint for Saved Chats List

**File:** `backend/src/ai-interpreter.js`

```javascript
// Get saved chats for user
router.get('/chat/saved', asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const result = await pool.query(
    `SELECT id, name, contract_type, conversation_state, created_at, updated_at
     FROM chat_sessions
     WHERE user_id = $1 AND is_saved = TRUE
     ORDER BY updated_at DESC`,
    [userId]
  );

  res.json({
    success: true,
    chats: result.rows
  });
}));
```

---

## 🎯 PHASE 4: Remove Versions Tab

### 4.1 Simple Cleanup

**File:** `frontend/src/components/ConversationalContractBuilder.jsx`

**Find the TabsList (around line 135):**
```jsx
// BEFORE:
<TabsList className="grid w-full grid-cols-3">
  <TabsTrigger value="chat">AI Chat</TabsTrigger>
  <TabsTrigger value="history">Versions</TabsTrigger>
  <TabsTrigger value="preview">Preview</TabsTrigger>
</TabsList>

// AFTER:
<TabsList className="grid w-full grid-cols-2">
  <TabsTrigger value="chat">AI Chat</TabsTrigger>
  <TabsTrigger value="preview">Preview</TabsTrigger>
</TabsList>
```

**Remove the entire "history" TabsContent block (lines ~161-191)**

---

## 🎯 PHASE 5: Testing Checklist

### Local LLM Testing (Partner - Mac with Ollama)

1. Install Ollama: `brew install ollama`
2. Pull a model: `ollama pull llama3.1:70b` (or smaller: `ollama pull mistral`)
3. Start Ollama: `ollama serve`
4. In VibeLegal Settings:
   - Enable "Local LLM"
   - Endpoint: `http://localhost:11434/api/generate`
   - Model: `llama3.1:70b`
   - Test Connection (should show green checkmark)
5. Go to AI Chat and test conversation
6. Backend logs should show: `🏠 Using Local LLM for user X: llama3.1:70b at http://localhost:11434/api/generate`

### Save Chat Testing

1. Start new AI chat conversation
2. Exchange 3-4 messages
3. Click "Save Chat" button
4. Enter name: "Test Contract Chat"
5. Check Dashboard → Saved Chats tab
6. Chat should appear with name and message count
7. Click "Resume" → should load chat in AI interface with full history

### Database Verification

```sql
-- Check saved chats
SELECT id, name, is_saved, created_at FROM chat_sessions WHERE is_saved = TRUE;

-- Check local LLM settings
SELECT email, local_llm_enabled, local_llm_model FROM users WHERE local_llm_enabled = TRUE;
```

---

## 📝 HANDOFF NOTES FOR CODEX

### Key Principles

1. **LocalLLMProvider must match GoogleAIProvider interface** - especially the `genAI.getGenerativeModel()` pattern
2. **Test connection before enabling** - bad config could break all AI features
3. **Graceful fallback** - if local LLM fails, should show error but not crash
4. **Console logging** - add logs to show which provider is being used (helps debugging)

### Common Pitfalls to Avoid

1. **Ollama vs OpenAI format** - they have different request/response structures (handled in `_makeRequest`)
2. **JSON parsing** - local LLMs are less reliable at returning valid JSON than Google AI
3. **Null checks** - not all users will have local LLM configured

### Files You'll Modify

**New Files:**
- `backend/src/ai-providers/local-llm-provider.js`
- `frontend/src/components/Settings.jsx`

**Modified Files:**
- `backend/src/ai-interpreter.js` (multiple routes)
- `backend/src/subscription-service.js` (add settings endpoints)
- `frontend/src/components/ChatInterface.jsx` (add save button)
- `frontend/src/components/Dashboard.jsx` (add saved chats tab)
- `frontend/src/components/ConversationalContractBuilder.jsx` (remove versions tab)

### SQL to Run

```sql
-- Run these in order
ALTER TABLE users ADD COLUMN local_llm_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN local_llm_endpoint VARCHAR(500);
ALTER TABLE users ADD COLUMN local_llm_model VARCHAR(100);
ALTER TABLE users ADD COLUMN local_llm_api_key VARCHAR(255);

ALTER TABLE chat_sessions ADD COLUMN name VARCHAR(255);
ALTER TABLE chat_sessions ADD COLUMN is_saved BOOLEAN DEFAULT FALSE;

CREATE INDEX idx_chat_sessions_user_saved ON chat_sessions(user_id, is_saved);
```

### Estimated Time

- Phase 1 (Local LLM): 4-6 hours
- Phase 2 (Save Chats): 2-3 hours
- Phase 3 (Dashboard): 2-3 hours
- Phase 4 (Remove Versions): 15 minutes
- Testing: 2-3 hours

**Total: ~12-16 hours over 2-3 days**

### Questions to Ask Me

If you get stuck on:
1. How local LLMs should format their responses
2. Whether to support streaming responses (probably not needed initially)
3. Error handling strategy when local LLM is down

Leave comments in code and I'll review when I'm back on Wednesday.

Good luck! 🚀
