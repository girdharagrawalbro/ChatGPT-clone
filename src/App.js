import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { FiSend, FiCopy, FiMic, FiMicOff, FiMoon, FiSun, FiTrash2, FiDownload, FiMenu, FiX, FiImage, FiPlus } from 'react-icons/fi';
import { FaGemini } from 'react-icons/fa6';
import './App.css';

function App() {
  // State management
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [model, setModel] = useState('gemini-1.5-flash');
  const [temperature, setTemperature] = useState(0.7);
  const [darkMode, setDarkMode] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Refs
  const chatBoxRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);

  // Check for mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Initialize from localStorage
  useEffect(() => {
    const savedConversations = localStorage.getItem('conversations');
    if (savedConversations) {
      const parsed = JSON.parse(savedConversations);
      setConversations(parsed);
      if (parsed.length > 0) {
        setActiveConversation(parsed[0].id);
        setChatHistory(parsed[0].messages);
      }
    } else {
      createNewConversation();
    }
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isTyping]);

  // Voice recognition setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setMessage(prev => prev + (prev ? ' ' : '') + transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const scrollToBottom = () => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
    setIsListening(!isListening);
  };

  const generateConversationTitle = async (messages) => {
    const firstUserMessage = messages.find(msg => msg.sender === 'You')?.text;
    if (!firstUserMessage) return 'New Chat';
    
    try {
      const genAI = new GoogleGenerativeAI(process.env.API);
      const genModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const prompt = `Generate a very short title (3-4 words max) for this conversation starter: "${firstUserMessage}"`;
      const result = await genModel.generateContent(prompt);
      const response = result.response.text();
      
      // Clean up the response to get just the title
      const title = response.replace(/["']/g, '').trim();
      return title || firstUserMessage.split(' ').slice(0, 4).join(' ');
    } catch (error) {
      console.error('Error generating title:', error);
      return firstUserMessage.split(' ').slice(0, 4).join(' ') || 'New Chat';
    }
  };

  const createNewConversation = async () => {
    const newConversation = {
      id: Date.now(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date().toISOString()
    };

    const updatedConversations = [newConversation, ...conversations];
    setConversations(updatedConversations);
    setActiveConversation(newConversation.id);
    setChatHistory([]);
    localStorage.setItem('conversations', JSON.stringify(updatedConversations));

    if (isMobile) {
      setMobileSidebarOpen(false);
    }

    return newConversation.id;
  };

  const selectConversation = (id) => {
    const conversation = conversations.find(c => c.id === id);
    if (conversation) {
      setActiveConversation(id);
      setChatHistory(conversation.messages);
    }
    
    if (isMobile) {
      setMobileSidebarOpen(false);
    }
  };

  const deleteConversation = (id, e) => {
    e.stopPropagation();
    const updatedConversations = conversations.filter(c => c.id !== id);
    setConversations(updatedConversations);
    localStorage.setItem('conversations', JSON.stringify(updatedConversations));

    if (activeConversation === id) {
      if (updatedConversations.length > 0) {
        selectConversation(updatedConversations[0].id);
      } else {
        createNewConversation();
      }
    }
  };

  const updateConversationTitle = (id, newTitle) => {
    const updatedConversations = conversations.map(conv =>
      conv.id === id ? { ...conv, title: newTitle } : conv
    );
    setConversations(updatedConversations);
    localStorage.setItem('conversations', JSON.stringify(updatedConversations));
  };

  const handleSend = async () => {
    if (!message.trim() && !image) return;

    // Create new conversation if none exists
    let currentConvId = activeConversation;
    if (!currentConvId) {
      currentConvId = await createNewConversation();
    }
  
    const userMessage = {
      sender: 'You',
      text: message,
      image: imagePreview,
      timestamp: new Date().toISOString()
    };
  
    // Create updated history with the new message
    const updatedHistory = [...chatHistory, userMessage];
    setChatHistory(updatedHistory);
    setMessage('');
    setImage(null);
    setImagePreview(null);
    setIsTyping(true);
  
    try {
      const genAI = new GoogleGenerativeAI(process.env.API);
      const genModel = genAI.getGenerativeModel({
        model: model,
        generationConfig: { temperature }
      });

      let result;
      if (image) {
        const imageParts = [{
          inlineData: {
            data: image.split(',')[1],
            mimeType: 'image/jpeg'
          }
        }];
        const prompt = message || "Describe this image";
        result = await genModel.generateContent([prompt, ...imageParts]);
      } else {
        result = await genModel.generateContent(message);
      }
  
      const aiResponse = result.response.text();
      const aiMessage = {
        sender: 'Gemini',
        text: aiResponse,
        timestamp: new Date().toISOString()
      };
  
      // Update chat history with AI response
      const finalHistory = [...updatedHistory, aiMessage];
      setChatHistory(finalHistory);
  
      // Update conversation in storage
      const updatedConversations = conversations.map(conv => 
        conv.id === currentConvId
          ? { ...conv, messages: finalHistory }
          : conv
      );

      // Generate title if this is the first exchange
      if (updatedHistory.length === 1) {
        setIsGeneratingTitle(true);
        const title = await generateConversationTitle(finalHistory);
        updateConversationTitle(currentConvId, title);
        setIsGeneratingTitle(false);
      }
  
      setConversations(updatedConversations);
      localStorage.setItem('conversations', JSON.stringify(updatedConversations));
  
    } catch (error) {
      console.error('API Error:', error);
      setChatHistory(prev => [
        ...prev,
        {
          sender: 'Gemini',
          text: `Sorry, I encountered an error: ${error.message}`,
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target.result);
        setImagePreview(URL.createObjectURL(file));
      };
      reader.readAsDataURL(file);
    }
  };

  const exportConversation = () => {
    if (!activeConversation) return;

    const conversation = conversations.find(c => c.id === activeConversation);
    if (!conversation) return;

    const data = {
      title: conversation.title,
      date: conversation.createdAt,
      messages: conversation.messages
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gemini_chat_${conversation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`app ${darkMode ? 'dark' : 'light'}`}>
      {/* Mobile Header */}
      {isMobile && (
        <div className="mobile-header">
          <button 
            className="menu-btn"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          >
            {mobileSidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
          <div className="mobile-title">
            <FaGemini className="gemini-icon" />
            <span>Gemini</span>
          </div>
          <div className="mobile-placeholder"></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`sidebar ${mobileSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <button
            className="new-chat-btn"
            onClick={createNewConversation}
          >
            <FiPlus size={18} />
            <span>New chat</span>
          </button>
        </div>

        <div className="conversation-list">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`conversation-item ${activeConversation === conv.id ? 'active' : ''}`}
              onClick={() => selectConversation(conv.id)}
            >
              <div className="conversation-content">
                <div className="conversation-icon">
                  <FaGemini size={16} />
                </div>
                <div className="conversation-title">
                  {conv.title || 'New Chat'}
                  {isGeneratingTitle && activeConversation === conv.id && (
                    <span className="loading-spinner"></span>
                  )}
                </div>
              </div>
              <button
                className="delete-btn"
                onClick={(e) => deleteConversation(conv.id, e)}
              >
                <FiTrash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="user-section">
            <div className="user-avatar">U</div>
            <div className="user-name">User</div>
          </div>
          <button
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
            {darkMode ? ' Light theme' : ' Dark theme'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Chat Area */}
        <div className="chat-area" ref={chatBoxRef}>
          {chatHistory.length === 0 ? (
            <div className="welcome-screen">
              <div className="welcome-logo">
                <FaGemini size={64} />
                <h1>Gemini</h1>
              </div>
              <h2>How can I help you today?</h2>
              <div className="example-prompts">
                <div className="prompt" onClick={() => setMessage("Explain quantum computing in simple terms")}>
                  "Explain quantum computing in simple terms"
                </div>
                <div className="prompt" onClick={() => setMessage("What's the weather like today?")}>
                  "What's the weather like today?"
                </div>
                <div className="prompt" onClick={() => setMessage("Write a poem about artificial intelligence")}>
                  "Write a poem about artificial intelligence"
                </div>
                <div className="prompt" onClick={() => setMessage("Plan a 3-day trip to New York")}>
                  "Plan a 3-day trip to New York"
                </div>
              </div>
              <div className="disclaimer">
                Gemini may display inaccurate info, including about people, so double-check its responses.
              </div>
            </div>
          ) : (
            chatHistory.map((msg, idx) => (
              <div key={idx} className={`message ${msg.sender.toLowerCase()}`}>
                <div className="message-header">
                  <div className="sender-icon">
                    {msg.sender === 'You' ? (
                      <div className="user-avatar">U</div>
                    ) : (
                      <FaGemini size={24} className="gemini-icon" />
                    )}
                  </div>
                  <div className="message-content-container">
                    <div className="sender-name">{msg.sender}</div>
                    {msg.image && (
                      <div className="message-image">
                        <img src={msg.image} alt="User uploaded" />
                      </div>
                    )}
                    <div className="message-content">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                    <div className="message-footer">
                      <div className="message-time">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {msg.sender === 'Gemini' && (
                        <button
                          className="copy-btn"
                          onClick={() => copyToClipboard(msg.text)}
                          title="Copy to clipboard"
                        >
                          <FiCopy size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          {isTyping && (
            <div className="message gemini">
              <div className="message-header">
                <div className="sender-icon">
                  <FaGemini size={24} className="gemini-icon" />
                </div>
                <div className="message-content-container">
                  <div className="sender-name">Gemini</div>
                  <div className="message-content typing-indicator">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="input-area">
          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Preview" />
              <button
                className="remove-image"
                onClick={() => {
                  setImage(null);
                  setImagePreview(null);
                }}
              >
                ×
              </button>
            </div>
          )}
          <div className="input-container">
            <div className="input-actions">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <button
                className="image-upload-btn"
                onClick={() => fileInputRef.current.click()}
                title="Upload image"
              >
                <FiImage size={20} />
              </button>
            </div>
            <div className="text-input-container">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Gemini..."
                rows={1}
              />
              <button
                className="send-btn"
                onClick={handleSend}
                disabled={isTyping || (!message.trim() && !image)}
              >
                {isTyping ? (
                  <div className="spinner"></div>
                ) : (
                  <FiSend size={20} />
                )}
              </button>
            </div>
            <div className="voice-input">
              <button
                className={`voice-btn ${isListening ? 'active' : ''}`}
                onClick={toggleVoiceInput}
                disabled={!('webkitSpeechRecognition' in window)}
                title={!('webkitSpeechRecognition' in window) ? 'Voice input not supported in your browser' : 'Voice input'}
              >
                {isListening ? <FiMicOff size={20} /> : <FiMic size={20} />}
              </button>
            </div>
          </div>
          <div className="input-footer">
            <div className="model-info">
              <span>Model: {model === 'gemini-1.5-flash' ? 'Gemini 1.5 Flash' : 'Gemini 1.5 Pro'}</span>
              <span>Temperature: {temperature.toFixed(1)}</span>
            </div>
            <div className="disclaimer">
              Gemini may display inaccurate info, including about people, so double-check its responses.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;