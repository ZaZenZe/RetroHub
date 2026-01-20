import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const Chatbot = ({ currentGame = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatboxRef = useRef(null);

  const OAK_AVATAR = 'assets/PikPng.com_professor-oak-png_1480585.png';

  const welcomeMessages = [
    'Ah, a young trainer! What can I help you with today?',
    'Welcome! Ask me anything about this game.',
    'Greetings! Ready to explore this adventure?',
    'Hello there! Need some tips or guidance?',
  ];

  useEffect(() => {
    if (currentGame) {
      const greeting = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
      setMessages([
        {
          role: 'assistant',
          content: greeting,
          timestamp: new Date(),
        },
      ]);
    } else {
      setMessages([
        {
          role: 'assistant',
          content: 'Welcome to RetroBot! Browse a game to get started.',
          timestamp: new Date(),
        },
      ]);
    }
  }, [currentGame]);

  useEffect(() => {
    if (chatboxRef.current) {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || isLoading) return;

    const userMessage = {
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const gameContext = currentGame
        ? {
            title: currentGame.title,
            platform: currentGame.platform,
            description: currentGame.description,
          }
        : null;

      const response = await api.chat(text, gameContext);
      
      const assistantMessage = {
        role: 'assistant',
        content: response.reply || response.message || 'Sorry, I couldn\'t process that.',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Oops! I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        className="chatbot-toggler"
        aria-label="Toggle Chatbot"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="material-symbols-rounded">mode_comment</span>
        <span className="material-symbols-outlined">close</span>
      </button>
      <div className={`chatbot ${isOpen ? 'show' : ''}`} role="dialog" aria-labelledby="chatbot-header">
        <header id="chatbot-header">
          <h2>
            <img src="assets/pixel/6Vww.gif" alt="RetroBot" className="chat-title-avatar" />
            RetroBot
          </h2>
          <p className="chat-subtitle" id="chat-subtitle">
            {currentGame
              ? `Chatting about ${currentGame.title}`
              : 'Ask about a game for tips and walkthroughs.'}
          </p>
          <button
            className="close-btn material-symbols-outlined"
            aria-label="Close Chatbot"
            onClick={() => setIsOpen(false)}
          >
            close
          </button>
        </header>
        <ul className="chatbox" aria-live="polite" ref={chatboxRef}>
          {messages.map((msg, idx) => (
            <li key={idx} className={`chat ${msg.role === 'user' ? 'outgoing' : 'incoming'}`}>
              {msg.role === 'assistant' && (
                <img src={OAK_AVATAR} alt="Professor Oak" />
              )}
              <p>{msg.content}</p>
            </li>
          ))}
          {isLoading && (
            <li className="chat incoming">
              <img src={OAK_AVATAR} alt="Professor Oak" />
              <p>Thinking...</p>
            </li>
          )}
        </ul>
        <form className="chat-input" onSubmit={handleSend}>
          <textarea
            placeholder="Ask about tips, team comps, items…"
            spellCheck="false"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            required
          />
          <button
            id="send-btn"
            className="material-symbols-rounded"
            aria-label="Send Message"
            type="submit"
            disabled={isLoading || !inputText.trim()}
          >
            send
          </button>
        </form>
      </div>
    </>
  );
};

export default Chatbot;
