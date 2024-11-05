import './App.css';
import React, { useState, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

function App() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState(() => {
    const savedHistory = localStorage.getItem('chatHistory');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });
  const [typingResponse, setTypingResponse] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
  }, [chatHistory]);

  const getPrediction = async () => {
    if (!message.trim()) return;

    setChatHistory(prev => [...prev, { sender: 'You', text: message }]);
    setMessage('');

    try {
      setIsTyping(true);

      const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY); // Replace with env variable
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(message);

      const prediction = result.response.text();
      displayTypingEffect(prediction);
    } catch (error) {
      console.error(error);
      setChatHistory(prev => [
        ...prev,
        { sender: 'ChatGPT', text: "An error occurred while fetching the response." }
      ]);
    }
  };

  const displayTypingEffect = (text) => {
    let index = 0;
    setTypingResponse('');

    const typingInterval = setInterval(() => {
      setTypingResponse(prev => prev + text[index]);
      index++;

      if (index === text.length) {
        clearInterval(typingInterval);
        setChatHistory(prev => [...prev, { sender: 'ChatGPT', text }]);
        setIsTyping(false);
      }
    }, 20);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      getPrediction();
    }
  };

  const formatText = (text) => {
    const lines = text.split('\n');
    return lines.map((line, i) => (
      <p key={i}>
        {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j}>{part.slice(2, -2)}</strong>;
          }
          return part;
        })}
      </p>
    ));
  };

  return (
    <div className="d-flex vh-100 text-white w-100">
      {/* Left history panel */}
      <div className="left bg-dark p-4 col-3 d-flex flex-column gap-2">
        <div className="d-flex gap-2 align-items-center">
          <img src="https://chatgpt.com/favicon.ico" alt="ChatGPT Logo" className="" />
          <span>ChatGPT</span>
        </div>
        <div className="history mt-3">
          {chatHistory
            .filter(entry => entry.sender === 'You')
            .map((entry, index) => (
              <div key={index} className="history-item border-bottom mt-3">
                {entry.text}
              </div>
            ))}
        </div>
      </div>

      {/* Right panel - Show logo if no chat history, otherwise show chat content */}
      <div className="right col-9 d-flex flex-column p-3">

        {chatHistory.length === 0 ? (
          <div className="centered-logo text-center mt-5">
            <img src="https://chatgpt.com/favicon.ico" alt="ChatGPT Logo" className="" />
            <h3>Welcome to ChatGPT</h3>
            <p>Start a conversation by typing a message below.</p>
          </div>
        ) : (
          <>
            <div className='d-flex justify-content-between align-items-center'>
              <h4 className='fw-bold'>ChatGPT </h4>
              <img src="data:image/jpeg;base64,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" alt="logo" className='logo' />
            </div>
            <div className="chat-box w-100 p-4" style={{ maxHeight: '95vh', overflowY: 'auto' }}>
              {chatHistory.map((entry, index) => (
                <div key={index} className={`text-left mb-3  ${entry.sender === 'You' ? 'text-light' : 'text-white'}`}>
                  <strong>{entry.sender}</strong>: {formatText(entry.text)}
                </div>
              ))}
              {isTyping && (
                <div className="text-left text-white">
                  <strong>ChatGPT</strong>: {formatText(typingResponse)}
                </div>
              )}
            </div>
          </>
        )}

        <div className="input-container w-100 d-flex justify-content-center align-items-center" style={{ height: '8vh' }}>
          <div className="input-group w-75 d-flex align-items-center">
            <input
              type="text"
              className="form-control"
              placeholder="Message ChatGPT"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button className="btn btn-primary" onClick={getPrediction}>
              Send
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
