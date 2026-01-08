// Backend API URL
const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// Generate a simple session ID for this browser session
const SESSION_ID = Math.random().toString(36).substring(7);

// Initialize chat (no-op for backend approach)
export const initializeChat = () => {
    console.log('Chat initialized with session:', SESSION_ID);
};

// Send a message and get response from backend
export const sendMessage = async (message, mapContext = null) => {
    try {
        const response = await fetch(`${API_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message,
                sessionId: SESSION_ID,
                mapContext // { lat, lng, zoom, heading, tilt }
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to get response');
        }

        const data = await response.json();
        return data; // Return full data object including locationSearch
    } catch (error) {
        console.error('Error sending message:', error);
        throw new Error('Failed to get AI response. Please make sure the backend server is running.');
    }
};

// Reset chat history
export const resetChat = async () => {
    try {
        await fetch(`${API_URL}/api/chat/reset`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sessionId: SESSION_ID
            }),
        });
        console.log('Chat history reset');
    } catch (error) {
        console.error('Error resetting chat:', error);
    }
};
