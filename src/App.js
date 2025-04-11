import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { FiSend, FiCopy, FiMic, FiMicOff, FiMoon, FiSun, FiTrash2, FiDownload } from 'react-icons/fi';
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

  // Refs
  const chatBoxRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

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

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setMessage(prev => prev + ' ' + transcript);
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

  const generateConversationTitle = (messages) => {
    const firstUserMessage = messages.find(msg => msg.sender === 'You')?.text;
    if (!firstUserMessage) return 'New Chat';
    
    // Take first 4 words or 30 characters, whichever comes first
    const words = firstUserMessage.trim().split(/\s+/).slice(0, 4).join(' ');
    return words.slice(0, 30) || 'New Chat';
  };
  
 

  const createNewConversation = async () => {
    const newConversation = {
      id: Date.now(),
      title: 'New Chat', // Temporary title
      messages: [],
      createdAt: new Date().toISOString()
    };

    const updatedConversations = [newConversation, ...conversations];
    setConversations(updatedConversations);
    setActiveConversation(newConversation.id);
    setChatHistory([]);
    localStorage.setItem('conversations', JSON.stringify(updatedConversations));

    return newConversation.id;
  };

  const selectConversation = (id) => {
    const conversation = conversations.find(c => c.id === id);
    if (conversation) {
      setActiveConversation(id);
      setChatHistory(conversation.messages);
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
      const genAI = new GoogleGenerativeAI("AIzaSyDo0eD4kH-FMGIa6mrr29TodxlqB5RFfzk");
      const genModel = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
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
        sender: 'AI',
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
     // Update title if this is the first message
     if (updatedHistory.length === 1) { // Only the user message exists
      const title = generateConversationTitle(updatedHistory);
      updateConversationTitle(currentConvId, title);
    }
      // Generate title if this is the first exchange (only 1 user message and no AI response yet)
      if (updatedHistory.filter(m => m.sender === 'You').length === 1 && 
          updatedHistory.filter(m => m.sender === 'AI').length === 0) {
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
          sender: 'AI',
          text: `Error: ${error.message}`,
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
    a.download = `chat_${conversation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className={`app ${darkMode ? 'dark' : 'light'}`}>
      {/* Sidebar */}
      <div className="sidebar">
        <button
          className="new-chat-btn"
          onClick={createNewConversation}
        >
          + New Chat
        </button>

        <div className="conversation-list">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`conversation-item ${activeConversation === conv.id ? 'active' : ''}`}
              onClick={() => selectConversation(conv.id)}
            >
              <div className="conversation-title">
                {conv.title || 'Untitled Conversation'}
                {isGeneratingTitle && activeConversation === conv.id && (
                  <span className="loading-spinner"></span>
                )}
              </div>
              <button
                className="delete-btn"
                onClick={(e) => deleteConversation(conv.id, e)}
              >
                <FiTrash2 />
              </button>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <button
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? <FiSun /> : <FiMoon />}
            {darkMode ? ' Light Mode' : ' Dark Mode'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Chat Header */}
        <div className="chat-header">
          {activeConversation && (
            <div className="conversation-info">
              <input
                type="text"
                value={conversations.find(c => c.id === activeConversation)?.title || ''}
                onChange={(e) => updateConversationTitle(activeConversation, e.target.value)}
                className="conversation-title-input"
                placeholder={isGeneratingTitle ? "Generating title..." : "Conversation title"}
                disabled={isGeneratingTitle}
              />
              <button
                className="export-btn"
                onClick={exportConversation}
                title="Export conversation"
              >
                <FiDownload />
              </button>
            </div>
          )}
          <div className="model-controls">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={isTyping}
            >
              <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
            </select>
            <div className="temperature-control">
              <span>Creativity:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                disabled={isTyping}
              />
              <span>{temperature.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="chat-area" ref={chatBoxRef}>
          {chatHistory.length === 0 ? (
            <div className="welcome-screen">
              <h2>Welcome to Gemini Chat</h2>
              <p>Start a new conversation or select an existing one from the sidebar</p>
              <div className="example-prompts">
                <h4>Try asking:</h4>
                <div className="prompt" onClick={() => setMessage("Explain quantum computing in simple terms")}>
                  "Explain quantum computing in simple terms"
                </div>
                <div className="prompt" onClick={() => setMessage("What's the weather like today?")}>
                  "What's the weather like today?"
                </div>
                <div className="prompt" onClick={() => setMessage("Write a poem about artificial intelligence")}>
                  "Write a poem about artificial intelligence"
                </div>
              </div>
            </div>
          ) : (
            chatHistory.map((msg, idx) => (
              <div key={idx} className={`message ${msg.sender.toLowerCase()}`}>
                <div className="message-header">
                  <div className="sender-icon">
                    {msg.sender === 'You' ? '👤' : '🤖'}
                  </div>
                  <div className="sender-name">{msg.sender}</div>
                  <div className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {msg.sender === 'AI' && (
                    <button
                      className="copy-btn"
                      onClick={() => copyToClipboard(msg.text)}
                      title="Copy to clipboard"
                    >
                      <FiCopy />
                    </button>
                  )}
                </div>
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
              </div>
            ))
          )}
          {isTyping && (
            <div className="message ai">
              <div className="message-header">
                <div className="sender-icon">🤖</div>
                <div className="sender-name">AI</div>
              </div>
              <div className="message-content typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
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
              📷
            </button>
            <div className="text-input-container">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type a message..."
                rows={1}
              />
              <div className="input-buttons">
                <button
                  className={`voice-btn ${isListening ? 'active' : ''}`}
                  onClick={toggleVoiceInput}
                  disabled={!('webkitSpeechRecognition' in window)}
                  title={!('webkitSpeechRecognition' in window) ? 'Voice input not supported in your browser' : 'Voice input'}
                >
                  {isListening ? <FiMicOff /> : <FiMic />}
                </button>
                <button
                  className="send-btn"
                  onClick={handleSend}
                  disabled={isTyping || (!message.trim() && !image)}
                >
                  {isTyping ? (
                    <div className="spinner"></div>
                  ) : (
                    <FiSend />
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="disclaimer">
            Gemini may produce inaccurate information. Double-check important facts.
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;