# RealMapAI Backend Server

Backend API server for the RealMapAI chatbot, powered by **OpenAI ChatGPT (GPT-3.5-Turbo)**.

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment variables**:
   Create or update the `.env` file with:
   ```bash
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3001
   ```

## Getting an OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key and add it to your `.env` file

## Running the Server

### Development mode (with auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

The server will start on `http://localhost:3001`

## API Endpoints

### 1. Health Check
```
GET /health
```
Returns server status and model information.

**Response:**
```json
{
  "status": "ok",
  "model": "gpt-3.5-turbo",
  "timestamp": "2026-01-07T05:40:00.000Z"
}
```

### 2. Chat
```
POST /api/chat
```
Send a message and get AI response.

**Request:**
```json
{
  "message": "Tell me about Paris",
  "sessionId": "optional-session-id"
}
```

**Response:**
```json
{
  "response": "Paris is the capital of France...",
  "sessionId": "optional-session-id",
  "model": "gpt-3.5-turbo"
}
```

### 3. Reset Conversation
```
POST /api/chat/reset
```
Reset conversation history for a session.

**Request:**
```json
{
  "sessionId": "optional-session-id"
}
```

**Response:**
```json
{
  "message": "Conversation reset successfully",
  "sessionId": "optional-session-id"
}
```

## Features

- ✅ **ChatGPT Integration**: Uses OpenAI's GPT-3.5-Turbo model
- ✅ **Session Management**: Maintains conversation context per session
- ✅ **CORS Enabled**: Works with frontend on different port
- ✅ **Error Handling**: Graceful error handling and logging
- ✅ **Context Preservation**: Keeps last 10 exchanges in memory
- ✅ **Fast & Reliable**: Better than Gemini for quick responses

## Model Configuration

- **Model**: `gpt-3.5-turbo`
- **Temperature**: 0.9 (creative responses)
- **Max Tokens**: 500 (brief responses)

## Troubleshooting

**Port already in use:**
Change the `PORT` in `.env` file to a different port (e.g., 3002)

**API Key errors:**
- Verify your `OPENAI_API_KEY` in the `.env` file
- Make sure you have credits in your OpenAI account
- Check [OpenAI Usage](https://platform.openai.com/usage) for your quota

**Rate limit errors:**
OpenAI has rate limits. If you hit them:
- Wait a few seconds and try again
- Upgrade your OpenAI plan for higher limits
- Use GPT-3.5-turbo-0125 for better rate limits
