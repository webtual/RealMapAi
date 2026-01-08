import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// System context for the AI assistant
const systemContext = {
    role: 'system',
    content: `You are a helpful AI assistant integrated into a map application called RealMapAI. 

CRITICAL INSTRUCTION:
You have the ability to control the map! You can SEARCH for places or CONTROL THE CAMERA (zoom, rotate, tilt, map style).

COMMAND FORMATS (Append these to the end of your response):
1. To Search matches: [LOCATION_SEARCH: {"query": "exact place name"}]
2. To Control Camera: [CAMERA_ACTION: {"type": "ACTION_TYPE", "value": "optional_value"}]

SUPPORTED CAMERA ACTIONS:
- "ZOOM_IN" / "ZOOM_OUT"
- "ROTATE_LEFT" / "ROTATE_RIGHT"
- "TILT_UP" / "TILT_DOWN"
- "RESET"
- "SWITCH_MODE" (value: "SATELLITE", "ROAD", "HYBRID")

RULES:
1. If user says "find...", "search...", "show me...", use LOCATION_SEARCH.
2. If user mentions "nearby" or "around here", use the PROVIDED CURRENT LOCATION in your search query.
   - Example: User "find gas stations here" -> [LOCATION_SEARCH: {"query": "gas stations near [Lat, Lng]"}]
3. If user says "switch to satellite", "show roads", use SWITCH_MODE.
4. Keep the text response short (1 sentence) and friendly.

Examples:
User: "Search for Marvel Stadium"
Assistant: Heading to Marvel Stadium! [LOCATION_SEARCH: {"query": "Marvel Stadium"}]

User: "Show restaurants near here"
Assistant: Searching for restaurants in this area. [LOCATION_SEARCH: {"query": "restaurants near -37.81, 144.96"}]

User: "Show me the roads"
Assistant: Switching to road view. [CAMERA_ACTION: {"type": "SWITCH_MODE", "value": "ROAD"}]`
};

// Store conversations for each session
const conversations = new Map();

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        model: 'gpt-3.5-turbo',
        timestamp: new Date().toISOString()
    });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message, sessionId = 'default', mapContext } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Get or create conversation history for this session
        if (!conversations.has(sessionId)) {
            conversations.set(sessionId, [systemContext]);
        }
        const conversationHistory = conversations.get(sessionId);

        // Construct User Message with Context
        let contextString = "";
        if (mapContext) {
            contextString = `\n[CURRENT MAP CONTEXT: Lat: ${mapContext.lat}, Lng: ${mapContext.lng}, Zoom: ${mapContext.zoom || 'unknown'}]`;
        }

        // Add user message to history with hidden instruction reminder
        conversationHistory.push({
            role: 'user',
            content: message + contextString + `\n(SYSTEM REMINDER: If this is a request to search/find, return [LOCATION_SEARCH: ...]. If "nearby", use coordinates. If changing view, use [CAMERA_ACTION: ...].)`
        });

        // Call OpenAI API
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: conversationHistory,
            temperature: 0.9,
            max_tokens: 500,
        });

        const assistantMessage = completion.choices[0].message.content;

        // Add assistant response to history
        conversationHistory.push({
            role: 'assistant',
            content: assistantMessage
        });

        // Smart History Management:
        // Always keep the System Prompt (index 0)
        // Keep the last 10 exchanges (20 messages)
        if (conversationHistory.length > 21) {
            // Remove messages from index 1 (after system prompt)
            // ensuring we keep the most recent ones
            conversationHistory.splice(1, conversationHistory.length - 21);
        }

        // Check if response contains location search request
        const locationMatch = assistantMessage.match(/\[LOCATION_SEARCH:\s*({.*?})\]/);
        // Check if response contains camera action
        const cameraMatch = assistantMessage.match(/\[CAMERA_ACTION:\s*({.*?})\]/);

        let locationData = null;
        let cameraData = null;
        let cleanedResponse = assistantMessage;

        // Extract Location Data
        if (locationMatch) {
            try {
                locationData = JSON.parse(locationMatch[1]);
                cleanedResponse = cleanedResponse.replace(/\[LOCATION_SEARCH:\s*{.*?}\]/, '');
            } catch (e) {
                console.error('Failed to parse location data:', e);
            }
        }

        // Extract Camera Data
        if (cameraMatch) {
            try {
                cameraData = JSON.parse(cameraMatch[1]);
                cleanedResponse = cleanedResponse.replace(/\[CAMERA_ACTION:\s*{.*?}\]/, '');
            } catch (e) {
                console.error('Failed to parse camera data:', e);
            }
        }

        res.json({
            response: cleanedResponse.trim(),
            locationSearch: locationData,
            cameraAction: cameraData,
            sessionId,
            model: 'gpt-3.5-turbo'
        });

    } catch (error) {
        console.error('Error in chat endpoint:', error);
        res.status(500).json({
            error: 'Failed to get AI response',
            details: error.message
        });
    }
});

// Reset conversation endpoint
app.post('/api/chat/reset', (req, res) => {
    const { sessionId = 'default' } = req.body;
    conversations.delete(sessionId);
    res.json({ message: 'Conversation reset successfully', sessionId });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`📡 Chat endpoint: http://localhost:${PORT}/api/chat`);
    console.log(`🤖 Using OpenAI GPT-3.5-Turbo`);
});
