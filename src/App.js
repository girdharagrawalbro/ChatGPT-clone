import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { FiSend, FiCopy, FiMic, FiTrash2, FiMenu, FiX, FiImage, FiPlus, FiSettings } from 'react-icons/fi';

// A simple SVG icon to represent Gemini
const GeminiIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="bg-gradient-to-br from-blue-400 to-purple-500 rounded-full">
    <path d="M12 4.75L13.4724 9.52763L18.25 11L13.4724 12.4724L12 17.25L10.5276 12.4724L5.75 11L10.5276 9.52763L12 4.75Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);


function App() {
  // All your state management and refs remain unchanged
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const chatBoxRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [message]);

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

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isTyping]);

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
      recognitionRef.current.onend = () => setIsListening(false);
    }
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const scrollToBottom = () => {
    chatBoxRef.current?.scrollTo({ top: chatBoxRef.current.scrollHeight, behavior: 'smooth' });
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
    setIsListening(!isListening);
  };

  const generateConversationTitle = async (messages) => {
    const firstUserMessage = messages.find(msg => msg.sender === 'You')?.text;
    if (!firstUserMessage) return 'New Chat';
    try {
      const genAI = new GoogleGenerativeAI("AIzaSyDo0eD4kH-FMGIa6mrr29TodxlqB5RFfzk");
      const genModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `Generate a very short title (3-4 words max) for this conversation starter: "${firstUserMessage}"`;
      const result = await genModel.generateContent(prompt);
      const response = await result.response;
      const title = response.text().replace(/["']/g, '').trim();
      return title || firstUserMessage.split(' ').slice(0, 4).join(' ');
    } catch (error) {
      console.error('Error generating title:', error);
      return firstUserMessage.split(' ').slice(0, 4).join(' ') || 'New Chat';
    }
  };

  const createNewConversation = async () => {
    const newConversation = { id: Date.now(), title: 'New Chat', messages: [], createdAt: new Date().toISOString() };
    const updatedConversations = [newConversation, ...conversations];
    setConversations(updatedConversations);
    setActiveConversation(newConversation.id);
    setChatHistory([]);
    localStorage.setItem('conversations', JSON.stringify(updatedConversations));
    setMobileSidebarOpen(false);
    return newConversation.id;
  };

  const selectConversation = (id) => {
    const conversation = conversations.find(c => c.id === id);
    if (conversation) {
      setActiveConversation(id);
      setChatHistory(conversation.messages);
    }
    setMobileSidebarOpen(false);
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
    const updatedConversations = conversations.map(conv => conv.id === id ? { ...conv, title: newTitle } : conv);
    setConversations(updatedConversations);
    localStorage.setItem('conversations', JSON.stringify(updatedConversations));
  };

  const handleSend = async () => {
    if (!message.trim() && !image) return;

    let currentConvId = activeConversation;
    if (!currentConvId) {
      currentConvId = await createNewConversation();
    }

    const userMessage = { sender: 'You', text: message, image: imagePreview, timestamp: new Date().toISOString() };
    const updatedHistory = [...chatHistory, userMessage];
    setChatHistory(updatedHistory);
    setMessage('');
    setImage(null);
    setImagePreview(null);
    setIsTyping(true);

    try {
      const genAI = new GoogleGenerativeAI("AIzaSyDo0eD4kH-FMGIa6mrr29TodxlqB5RFfzk");
      const genModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      let result;
      if (image) {
        const imageParts = [{ inlineData: { data: image.split(',')[1], mimeType: 'image/jpeg' } }];
        const prompt = message || "Describe this image";
        result = await genModel.generateContent([prompt, ...imageParts]);
      } else {
        result = await genModel.generateContent(message);
      }
      const aiResponse = await result.response.text();
      const aiMessage = { sender: 'Gemini', text: aiResponse, timestamp: new Date().toISOString() };
      const finalHistory = [...updatedHistory, aiMessage];
      setChatHistory(finalHistory);

      const convs = JSON.parse(localStorage.getItem('conversations') || '[]');
      const updatedConversations = convs.map(conv => conv.id === currentConvId ? { ...conv, messages: finalHistory } : conv);

      if (updatedHistory.length === 1) {
        setIsGeneratingTitle(true);
        const title = await generateConversationTitle(finalHistory);
        updateConversationTitle(currentConvId, title);
        setIsGeneratingTitle(false);
      } else {
        setConversations(updatedConversations);
        localStorage.setItem('conversations', JSON.stringify(updatedConversations));
      }
    } catch (error) {
      console.error('API Error:', error);
      setChatHistory(prev => [...prev, { sender: 'Gemini', text: `Sorry, I encountered an error: ${error.message}`, timestamp: new Date().toISOString() }]);
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
    <div className="flex h-screen font-sans bg-white dark:bg-[#131314] text-gray-800 dark:text-gray-200">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-68 bg-[#f0f4f9] dark:bg-[#1e1f20] transform ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <div className="flex flex-col h-full p-2">
          <div className="flex justify-between items-center mb-4">
            <button onClick={createNewConversation} className="flex-grow flex items-center gap-2 p-2 rounded-full text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700">
              <FiPlus size={20} />
              New chat
            </button>
            <button onClick={() => setMobileSidebarOpen(false)} className="p-1 rounded bg-blue-100 dark:hover:bg-gray-700 md:hidden">
              <FiX size={20} />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto">
            <h5 className="px-2 py-1 text-sm font-medium text-gray-500 dark:text-gray-400">Recent</h5>
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`flex items-center justify-between px-3 py-2  mt-1 rounded-full cursor-pointer ${activeConversation === conv.id ? 'bg-blue-100 dark:bg-gray-700' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                onClick={() => selectConversation(conv.id)}
              >
                <p className="m-0 p-0 truncate flex-1 text-sm ">{conv.title}</p>
                {isGeneratingTitle && activeConversation === conv.id && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin ml-2"></div>}
                <button onClick={(e) => deleteConversation(conv.id, e)} className="p-1 rounded-full hover:bg-red-200 dark:hover:bg-red-800 opacity-50 hover:opacity-100">
                  <FiTrash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-2 ">
            <button className="w-full flex items-center gap-3 p-2 text-sm hover:bg-blue-100 dark:hover:bg-blue-100 rounded-full">
              <FiSettings size={18} />
              <span>Settings and Help</span>
            </button>

          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 h-screen">

        {/* Chat Area */}
        <main ref={chatBoxRef} className="flex-1 overflow-y-auto py-2 px-3 md:p-6">
          <div className="flex items-center justify-between">
            <div className='flex gap-2 items-center'>
              <button onClick={() => setMobileSidebarOpen(true)} className="p-2  rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                <FiMenu size={20} />
              </button>
              <div className='flex flex-col'>
                <h5 className='text-gray-500'>Gemini</h5>
                <p className="text-sm m-0 p-0 text-gray-500 bg-[#f0f4f9]  px-2 py-1 rounded-full  dark:text-gray-400 font-medium">gemini-1.5-flash</p>
              </div>
            </div>
            <div>
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-medium">G</div>

            </div>
          </div>

          <div className="max-w-3xl mx-auto w-full">
            {chatHistory.length === 0 ? (
              <div className="flex items-center justify-center h-96 text-center">
                <h1 className="text-3xl font-medium" style={{ color: '#6666ff' }}>
                  Hello, User
                </h1>
              </div>
            ) : (
              chatHistory.map((msg, idx) => (
                <div key={idx} className="flex gap-4 my-6">
                  <div className="flex-shrink-0">
                    {msg.sender === 'You' ? (
                      <div className="w-8 h-8 rounded-full bg-blue-300 dark:bg-blue-600 flex text-white items-center justify-center font-medium">G</div>
                    ) : (
                      <GeminiIcon />
                    )}
                  </div>
                  <div className="flex flex-col w-full">
                    {msg.image && <img src={msg.image} alt="upload" className="mt-2 rounded-lg max-w-xs" />}
                    <div className="prose prose-lg dark:prose-invert max-w-none text-gray-800 dark:text-gray-200">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <span className="text-xs">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {msg.sender === 'Gemini' && (
                        <button onClick={() => copyToClipboard(msg.text)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600" title="Copy">
                          <FiCopy size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            {isTyping && (
              <div className="flex gap-4 my-6">
                <div className="flex-shrink-0"><GeminiIcon /></div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce mx-1" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            )}
          </div>

        </main>

        {/* Input Area */}
        <footer className="px-4 py-1 md:p-6">
          <div className="max-w-3xl mx-auto">
            {imagePreview && (
              <div className="relative w-24 h-24 mb-2">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                <button onClick={() => { setImage(null); setImagePreview(null); }} className="absolute -top-2 -right-2 bg-gray-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-lg">&times;</button>
              </div>
            )}
            <div className="relative border border-gray-900 flex items-center p-2 bg-[#fff] dark:bg-[#1e1f20] rounded-3xl">
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
              <button onClick={() => fileInputRef.current.click()} title="Upload image" className="p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600">
                <FiImage size={20} />
              </button>
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Gemini"
                rows={1}
                className="flex-1 px-2 bg-transparent focus:outline-none resize-none max-h-48"
              />
              <button onClick={toggleVoiceInput} title="Use microphone" className={`p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 ${isListening ? 'bg-red-500 text-white' : ''}`}>
                <FiMic size={20} />
              </button>
              <button onClick={handleSend} disabled={isTyping || (!message.trim() && !image)} className="p-2 rounded-full  disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-500">
                <FiSend size={20} />
              </button>
            </div>
            <p className="text-xs text-center mt-2 text-gray-500 dark:text-gray-400">
              Gemini can make mistakes, so double-check it
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;                                               