import React, { useState, useRef, useEffect } from 'react';
import { initializeChat, sendMessage } from '../services/geminiService';

const ChatSidebar = ({ isOpen, onToggle, onLocationSearch, onCameraAction, getMapContext }) => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: 'ai',
            text: 'Hello! I\'m your AI assistant powered by Google Gemini. How can I help you explore this area today?'
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    // Initialize Gemini chat when component mounts
    useEffect(() => {
        initializeChat();
    }, []);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const userMsg = {
            id: Date.now(),
            sender: 'user',
            text: inputValue
        };

        setMessages(prev => [...prev, userMsg]);
        const userMessage = inputValue;
        setInputValue('');
        setIsTyping(true);

        try {
            // Get current map context if available
            const currentContext = getMapContext ? getMapContext() : null;

            // Get AI response from backend with context
            const data = await sendMessage(userMessage, currentContext);

            setIsTyping(false);
            setMessages(prev => [
                ...prev,
                {
                    id: Date.now() + 1,
                    sender: 'ai',
                    text: data.response
                }
            ]);

            // If AI detected a location search request, trigger map search
            if (data.locationSearch && data.locationSearch.query && onLocationSearch) {
                console.log('Triggering location search:', data.locationSearch.query);
                onLocationSearch(data.locationSearch.query);
            }

            // If AI detected a camera action
            if (data.cameraAction && onCameraAction) {
                console.log('Triggering camera action:', data.cameraAction);
                onCameraAction(data.cameraAction);
            }

        } catch (error) {
            setIsTyping(false);
            setMessages(prev => [
                ...prev,
                {
                    id: Date.now() + 1,
                    sender: 'ai',
                    text: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
                    isError: true
                }
            ]);
        }
    };


    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    return (
        <>
            {/* Floating Chat Button */}
            {!isOpen && (
                <button
                    className="chat-fab-button"
                    onClick={onToggle}
                    style={{
                        position: 'fixed',
                        bottom: '60px',
                        right: '65px',
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #10a37f 0%, #1a7f64 100%)',
                        border: 'none',
                        boxShadow: '0 8px 24px rgba(16, 163, 127, 0.4), 0 4px 12px rgba(0, 0, 0, 0.2)',
                        cursor: 'pointer',
                        zIndex: 10000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '28px',
                        pointerEvents: 'auto',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        animation: 'pulse 2s infinite',
                        padding: '0'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.1) rotate(5deg)';
                        e.target.style.boxShadow = '0 12px 32px rgba(16, 163, 127, 0.5), 0 6px 16px rgba(0, 0, 0, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1) rotate(0deg)';
                        e.target.style.boxShadow = '0 8px 24px rgba(16, 163, 127, 0.4), 0 4px 12px rgba(0, 0, 0, 0.2)';
                    }}
                >
                    <style>{`
@keyframes pulse {
    0 %, 100 % { box- shadow: 0 8px 24px rgba(16, 163, 127, 0.4), 0 4px 12px rgba(0, 0, 0, 0.2);
}
50 % { box- shadow: 0 8px 32px rgba(16, 163, 127, 0.6), 0 4px 16px rgba(0, 0, 0, 0.3); }
                        }
@keyframes fadeInUp {
                            from { opacity: 0; transform: translateY(10px); }
                            to { opacity: 1; transform: translateY(0); }
}
@keyframes typing {
    0 %, 100 % { opacity: 0.3; }
    50 % { opacity: 1; }
}
`}</style>
                    {/* ChatGPT Logo SVG */}
                    <svg width="32" height="32" viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M37.5324 16.8707C37.9808 15.5241 38.1363 14.0974 37.9886 12.6859C37.8409 11.2744 37.3934 9.91076 36.676 8.68622C35.6126 6.83404 33.9882 5.3676 32.0373 4.4985C30.0864 3.62941 27.9098 3.40259 25.8215 3.85078C24.8796 2.7893 23.7219 1.94125 22.4257 1.36341C21.1295 0.785575 19.7249 0.491269 18.3058 0.500197C16.1708 0.495044 14.0893 1.16803 12.3614 2.42214C10.6335 3.67624 9.34853 5.44666 8.6917 7.47815C7.30085 7.76286 5.98686 8.3414 4.8377 9.17505C3.68854 10.0087 2.73073 11.0782 2.02839 12.312C0.956464 14.1591 0.498905 16.2988 0.721698 18.4228C0.944492 20.5467 1.83612 22.5449 3.268 24.1293C2.81966 25.4759 2.66413 26.9026 2.81182 28.3141C2.95951 29.7256 3.40701 31.0892 4.12437 32.3138C5.18791 34.1659 6.8123 35.6322 8.76321 36.5013C10.7141 37.3704 12.8907 37.5973 14.9789 37.1492C15.9208 38.2107 17.0786 39.0587 18.3747 39.6366C19.6709 40.2144 21.0755 40.5087 22.4946 40.4998C24.6307 40.5054 26.7133 39.8321 28.4418 38.5772C30.1704 37.3223 31.4556 35.5506 32.1119 33.5179C33.5027 33.2332 34.8167 32.6547 35.9659 31.821C37.115 30.9874 38.0728 29.9178 38.7752 28.684C39.8458 26.8371 40.3023 24.6979 40.0789 22.5748C39.8556 20.4517 38.9639 18.4544 37.5324 16.8707ZM22.4978 37.8849C20.7443 37.8874 19.0459 37.2733 17.6994 36.1501C17.7601 36.117 17.8666 36.0586 17.936 36.0161L25.9004 31.4156C26.1003 31.3019 26.2663 31.137 26.3813 30.9378C26.4964 30.7386 26.5563 30.5124 26.5549 30.2825V19.0542L29.9213 20.998C29.9389 21.0068 29.9541 21.0198 29.9656 21.0359C29.977 21.052 29.9842 21.0707 29.9867 21.0902V30.3889C29.9842 32.375 29.1946 34.2791 27.7909 35.6841C26.3872 37.0892 24.4838 37.8806 22.4978 37.8849ZM6.39227 31.0064C5.51397 29.4888 5.19742 27.7107 5.49804 25.9832C5.55718 26.0187 5.66048 26.0818 5.73461 26.1244L13.699 30.7248C13.8975 30.8408 14.1233 30.902 14.3532 30.902C14.583 30.902 14.8088 30.8408 15.0073 30.7248L24.731 25.1103V28.9979C24.7321 29.0177 24.7283 29.0376 24.7199 29.0556C24.7115 29.0736 24.6988 29.0893 24.6829 29.1012L16.6317 33.7497C14.9096 34.7416 12.8643 35.0097 10.9447 34.4954C9.02506 33.9811 7.38785 32.7263 6.39227 31.0064ZM4.29707 13.6194C5.17156 12.0998 6.55279 10.9364 8.19885 10.3327C8.19885 10.4013 8.19491 10.5228 8.19491 10.6071V19.808C8.19351 20.0378 8.25334 20.2638 8.36823 20.4629C8.48312 20.6619 8.64893 20.8267 8.84863 20.9404L18.5723 26.5542L15.206 28.4979C15.1894 28.5089 15.1703 28.5155 15.1505 28.5173C15.1307 28.5191 15.1107 28.516 15.0924 28.5082L7.04046 23.8557C5.32135 22.8601 4.06716 21.2235 3.55289 19.3046C3.03862 17.3858 3.30624 15.3413 4.29707 13.6194ZM31.955 20.0556L22.2312 14.4411L25.5976 12.4981C25.6142 12.4872 25.6333 12.4801 25.6531 12.4787C25.6729 12.4769 25.6928 12.4801 25.7111 12.4879L33.7631 17.1364C34.9967 17.849 36.0017 18.8982 36.6606 20.1613C37.3194 21.4244 37.6047 22.849 37.4832 24.2684C37.3617 25.6878 36.8382 27.0432 35.9743 28.1759C35.1103 29.3086 33.9424 30.1717 32.6047 30.6641C32.6047 30.5947 32.6047 30.4733 32.6047 30.3889V21.188C32.6066 20.9586 32.5474 20.7328 32.4332 20.5338C32.319 20.3348 32.154 20.1698 31.955 20.0556ZM35.3055 15.0128C35.2464 14.9765 35.1431 14.9142 35.069 14.8717L27.1045 10.2712C26.906 10.1554 26.6803 10.0943 26.4504 10.0943C26.2206 10.0943 25.9948 10.1554 25.7963 10.2712L16.0726 15.8858V11.9982C16.0715 11.9783 16.0753 11.9585 16.0837 11.9405C16.0921 11.9225 16.1048 11.9068 16.1207 11.8949L24.1719 7.25025C25.4053 6.53903 26.8158 6.19376 28.2383 6.25482C29.6608 6.31589 31.0364 6.78077 32.2044 7.59508C33.3723 8.40939 34.2842 9.53945 34.8334 10.8531C35.3826 12.1667 35.5464 13.6095 35.3055 15.0128ZM14.2424 21.9419L10.8752 19.9981C10.8576 19.9893 10.8423 19.9763 10.8309 19.9602C10.8195 19.9441 10.8122 19.9254 10.8098 19.9058V10.6071C10.8107 9.18295 11.2173 7.78848 11.9819 6.58695C12.7466 5.38542 13.8377 4.42659 15.1275 3.82264C16.4173 3.21869 17.8524 2.99464 19.2649 3.1767C20.6775 3.35876 22.0089 3.93941 23.1034 4.85067C23.0427 4.88379 22.937 4.94215 22.8668 4.98473L14.9024 9.58517C14.7025 9.69878 14.5366 9.86356 14.4215 10.0626C14.3065 10.2616 14.2466 10.4877 14.2479 10.7175L14.2424 21.9419ZM16.071 17.9991L20.4018 15.4978L24.7325 17.9975V22.9985L20.4018 25.4983L16.071 22.9985V17.9991Z" fill="white" />
                    </svg>
                </button>
            )}

            {/* Sidebar Panel */}
            <div
                className="chat-sidebar-panel"
                style={{
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    width: '380px',
                    height: '100vh',
                    transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
                    transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    willChange: 'transform',
                    background: 'linear-gradient(180deg, #ffffff 0%, #f8f9ff 100%)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.12), -4px 0 16px rgba(102, 126, 234, 0.08)',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    pointerEvents: isOpen ? 'auto' : 'none'
                }}
            >
                {/* Header with Gradient */}
                <div
                    style={{
                        padding: '24px 20px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        boxShadow: '0 4px 16px rgba(102, 126, 234, 0.2)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    <div>
                        <h3 style={{
                            margin: 0,
                            fontSize: '20px',
                            color: '#ffffff',
                            fontWeight: '700',
                            letterSpacing: '-0.03em',
                            textShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                        }}>AI Assistant</h3>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginTop: '6px'
                        }}>
                            <span style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: '#4ade80',
                                boxShadow: '0 0 8px rgba(74, 222, 128, 0.6)',
                                animation: 'pulse 2s infinite'
                            }}></span>
                            <span style={{
                                fontSize: '13px',
                                color: 'rgba(255, 255, 255, 0.95)',
                                fontWeight: '500'
                            }}>Online</span>
                        </div>
                    </div>

                    <button
                        onClick={onToggle}
                        style={{
                            border: 'none',
                            background: 'rgba(255, 255, 255, 0.2)',
                            backdropFilter: 'blur(10px)',
                            cursor: 'pointer',
                            fontSize: '22px',
                            color: '#ffffff',
                            padding: '0',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            width: '44px',
                            height: '44px',
                            fontWeight: '300'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                            e.target.style.transform = 'scale(1.08) rotate(90deg)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                            e.target.style.transform = 'scale(1) rotate(0deg)';
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Messages Container */}
                <div
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#667eea #f1f3f4'
                    }}
                >
                    {messages.map((msg, index) => (
                        <div
                            key={msg.id}
                            style={{
                                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                background: msg.sender === 'user'
                                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                    : msg.isError
                                        ? '#fee2e2'
                                        : '#ffffff',
                                color: msg.sender === 'user' ? '#ffffff' : msg.isError ? '#991b1b' : '#1a1a1a',
                                padding: '12px 16px',
                                borderRadius: msg.sender === 'user'
                                    ? '18px 18px 4px 18px'
                                    : '18px 18px 18px 4px',
                                maxWidth: '82%',
                                fontSize: '14.5px',
                                lineHeight: '1.5',
                                boxShadow: msg.sender === 'user'
                                    ? '0 4px 12px rgba(102, 126, 234, 0.3)'
                                    : '0 2px 8px rgba(0, 0, 0, 0.08)',
                                animation: 'fadeInUp 0.4s ease-out',
                                animationDelay: `${index * 0.1} s`,
                                animationFillMode: 'both',
                                fontWeight: '400',
                                border: msg.sender === 'ai'
                                    ? msg.isError
                                        ? '1px solid #fca5a5'
                                        : '1px solid rgba(0, 0, 0, 0.06)'
                                    : 'none'
                            }}
                        >
                            {msg.text}
                        </div>
                    ))}

                    {/* Typing Indicator */}
                    {isTyping && (
                        <div
                            style={{
                                alignSelf: 'flex-start',
                                background: '#ffffff',
                                padding: '12px 16px',
                                borderRadius: '18px 18px 18px 4px',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                                border: '1px solid rgba(0, 0, 0, 0.06)',
                                display: 'flex',
                                gap: '4px',
                                animation: 'fadeInUp 0.3s ease-out'
                            }}
                        >
                            <span style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: '#667eea',
                                animation: 'typing 1.4s infinite',
                                animationDelay: '0s'
                            }}></span>
                            <span style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: '#667eea',
                                animation: 'typing 1.4s infinite',
                                animationDelay: '0.2s'
                            }}></span>
                            <span style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: '#667eea',
                                animation: 'typing 1.4s infinite',
                                animationDelay: '0.4s'
                            }}></span>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Container */}
                <form
                    onSubmit={handleSendMessage}
                    style={{
                        padding: '20px',
                        background: '#ffffff',
                        borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center'
                    }}
                >
                    <input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Type your message..."
                        style={{
                            flex: 1,
                            padding: '14px 18px',
                            borderRadius: '24px',
                            border: '2px solid #e5e7eb',
                            outline: 'none',
                            fontSize: '14px',
                            transition: 'all 0.3s ease',
                            backgroundColor: '#f9fafb',
                            color: '#1a1a1a',
                            fontWeight: '400'
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = '#667eea';
                            e.target.style.backgroundColor = '#ffffff';
                            e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = '#e5e7eb';
                            e.target.style.backgroundColor = '#f9fafb';
                            e.target.style.boxShadow = 'none';
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim()}
                        style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: inputValue.trim()
                                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                : '#e5e7eb',
                            color: '#ffffff',
                            border: 'none',
                            cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: inputValue.trim()
                                ? '0 4px 12px rgba(102, 126, 234, 0.3)'
                                : 'none',
                            opacity: inputValue.trim() ? 1 : 0.5
                        }}
                        onMouseEnter={(e) => {
                            if (inputValue.trim()) {
                                e.target.style.transform = 'scale(1.08)';
                                e.target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'scale(1)';
                            e.target.style.boxShadow = inputValue.trim()
                                ? '0 4px 12px rgba(102, 126, 234, 0.3)'
                                : 'none';
                        }}
                    >
                        ➤
                    </button>
                </form>
            </div>
        </>
    );
};

export default ChatSidebar;
