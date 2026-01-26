import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Chatbot = ({ currentGame = null, isOpen: isOpenProp, onOpenChange }) => {
  const { isAuthenticated } = useAuth();
  const [isOpenState, setIsOpenState] = useState(false);
  const isOpen = typeof isOpenProp === 'boolean' ? isOpenProp : isOpenState;
  const setIsOpen = (next) => {
    if (onOpenChange) {
      onOpenChange(next);
    } else {
      setIsOpenState(next);
    }
  };

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentCharacter, setCurrentCharacter] = useState(null);
  const [chatSessionPrimed, setChatSessionPrimed] = useState(false);
  const [selectionPending, setSelectionPending] = useState(false);
  const [initMessageShown, setInitMessageShown] = useState(false);
  const [choicePrompt, setChoicePrompt] = useState(null);
  const [authPromptShown, setAuthPromptShown] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const chatboxRef = useRef(null);

  const AVATAR_DEFAULT = '/assets/pokeball.png';
  const AVATAR_MALE = '/assets/pixel/male.jpg';
  const AVATAR_FEMALE = '/assets/pixel/female.jpg';

  const ASSISTANT_CHOICES = [
    { name: 'Retro Rick', gender: 'male', avatar: AVATAR_MALE, vibe: 'Arcade tactician' },
    { name: 'Retro Rose', gender: 'female', avatar: AVATAR_FEMALE, vibe: 'Cozy lore keeper' },
  ];

  const welcomePool = {
    generic: [
      'Hi there! Select a game to get tailored help.',
      'Welcome! Pick a game and ask for tips or a walkthrough.',
      'Need guidance? Choose a game and start asking questions!',
      'Hey there! I’m your RetroHub gaming companion. Open the chat to pick who you want to talk to.',
      'Welcome! I can help with any game here. Tap the AI chat to get tips or walkthroughs.',
      "Let's get this nostalgia party started! Pick a guide to help you out.",
    ],
  };

  const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const randomWelcome = (gameId, gameTitle) => {
    if (gameTitle) {
      const tailored = [
        `Ready to conquer ${gameTitle}?`,
        `Let's make ${gameTitle} legendary.`,
        `${gameTitle} awaits—pick your guide!`,
      ];
      return tailored[Math.floor(Math.random() * tailored.length)];
    }
    const arr = welcomePool[gameId] || welcomePool.generic;
    return arr[Math.floor(Math.random() * arr.length)];
  };

  const normalizeCharacterAvatar = (character) => {
    if (!character) return null;
    const normalizedGender = character.gender === 'female' ? 'female' : 'male';
    const avatar = character.avatar
      ? character.avatar
      : normalizedGender === 'female'
      ? AVATAR_FEMALE
      : AVATAR_MALE;
    return {
      ...character,
      gender: normalizedGender,
      avatar,
    };
  };

  const currentAvatar = () => {
    if (!currentCharacter) return AVATAR_DEFAULT;
    if (currentCharacter.avatar) return currentCharacter.avatar;
    if (currentCharacter.gender === 'female') return AVATAR_FEMALE;
    if (currentCharacter.gender === 'male') return AVATAR_MALE;
    return AVATAR_DEFAULT;
  };

  const appendIncomingMessage = (text, options = {}) => {
    if (!text) return null;
    const message = {
      id: generateId(),
      role: 'assistant',
      content: text,
      timestamp: new Date(),
      avatar: options.avatar || currentAvatar(),
      isError: Boolean(options.isError),
    };
    setMessages((prev) => [...prev, message]);
    return message;
  };

  const getCurrentGameMeta = () => {
    if (!currentGame) {
      return {
        gameName: '',
        platform: '',
        releaseYear: '',
        gameId: null,
      };
    }
    return {
      gameName: currentGame.title || '',
      platform: currentGame.platform || '',
      releaseYear: currentGame.year || '',
      gameId: currentGame.dbId || currentGame._id || currentGame.id || null,
    };
  };

  const resetChatWithWelcome = () => {
    const gameId = currentGame?.slug || currentGame?.id || null;
    const greeting = randomWelcome(gameId, currentGame?.title || '');
    setMessages([
      {
        id: generateId(),
        role: 'assistant',
        content: greeting,
        timestamp: new Date(),
        avatar: AVATAR_DEFAULT,
      },
    ]);
    setCurrentCharacter(null);
    setChatSessionPrimed(false);
    setSelectionPending(false);
    setInitMessageShown(false);
    setChoicePrompt(null);
    setIsSelecting(false);
  };

  const ensureChatSession = async () => {
    if (selectionPending) return;
    if (chatSessionPrimed && currentCharacter) return;
    const meta = getCurrentGameMeta();
    const init = await api.chatInit(meta);
    setChatSessionPrimed(true);
    if (init.needsCharacterSelection) {
      setSelectionPending(true);
      setCurrentCharacter(null);
      setChoicePrompt(init.message || `Pick your guide for ${meta.gameName || 'this adventure'}:`);
      return;
    }
    if (init.message && !initMessageShown) {
      appendIncomingMessage(init.message, { avatar: AVATAR_DEFAULT });
      setInitMessageShown(true);
    }
    if (init.character) {
      const normalized = normalizeCharacterAvatar(init.character);
      setCurrentCharacter(normalized);
      const greeting = init.character.greeting || init.message;
      if (greeting && (!initMessageShown || greeting !== init.message)) {
        appendIncomingMessage(greeting, { avatar: normalized?.avatar || AVATAR_DEFAULT });
        setInitMessageShown(true);
      }
    }
  };

  const handleCharacterChoice = async (choice, assistantName) => {
    if (isSelecting) return;
    setIsSelecting(true);
    const meta = getCurrentGameMeta();

    try {
      const pick = await api.chatSelectCharacter({
        ...meta,
        choice,
        assistantName,
      });
      setSelectionPending(false);
      setChoicePrompt(null);
      const normalized = normalizeCharacterAvatar(pick.character);
      setCurrentCharacter(normalized);
      if (pick.notice) {
        appendIncomingMessage(pick.notice, { avatar: AVATAR_DEFAULT });
      }
      if (choice === 'in-game' && pick.inGameAvailable === false) {
        appendIncomingMessage('Game not recognized by AI yet. Switching to RetroHub assistant.', {
          avatar: AVATAR_DEFAULT,
        });
      }
      const personaIntros = {
        'Retro Rick': "Retro Rick here. Take a breath—I've got this. Tell me what's got you stuck and we'll figure it out together, nice and easy.",
        'Retro Rose': "Retro Rose here, sweetie. I'm in charge and you're going to love it. Tell me what you need... if you can keep up with me.",
      };
      const greeting = pick.character?.greeting;
      const isAssistantChoice = choice === 'assistant';
      const assistantIntro = isAssistantChoice && assistantName ? personaIntros[assistantName] : null;
      const characterName = pick.character?.name || 'your guide';
      const gameLabel = meta.gameName || 'this world';
      let finalGreeting = greeting;
      if (assistantIntro) {
        finalGreeting = assistantIntro;
      } else if (isAssistantChoice && greeting) {
        finalGreeting = greeting;
      } else if (isAssistantChoice) {
        finalGreeting = `I'm ${assistantName || 'your RetroHub guide'}. Tell me what you need and I will take it from here.`;
      } else if (choice === 'in-game') {
        finalGreeting = greeting || `${characterName} here from ${gameLabel}. Tell me what you need and I will handle it in my own style.`;
      }
      appendIncomingMessage(finalGreeting || 'Ready to help. What do you need?', {
        avatar: normalized?.avatar || AVATAR_DEFAULT,
      });
    } catch (err) {
      appendIncomingMessage(err.message || 'Could not select a character. Try again.', {
        avatar: AVATAR_DEFAULT,
        isError: true,
      });
    } finally {
      setIsSelecting(false);
    }
  };

  useEffect(() => {
    resetChatWithWelcome();
  }, [currentGame]);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('show-chatbot');
    } else {
      document.body.classList.remove('show-chatbot');
    }
    return () => document.body.classList.remove('show-chatbot');
  }, [isOpen]);

  useEffect(() => {
    if (chatboxRef.current) {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }
  }, [messages, selectionPending]);

  useEffect(() => {
    if (!isOpen) return;
    if (!isAuthenticated && !authPromptShown) {
      appendIncomingMessage('Please sign in to use the AI companion.', { avatar: AVATAR_DEFAULT });
      setAuthPromptShown(true);
      return;
    }
    if (isAuthenticated) {
      ensureChatSession().catch((err) => {
        appendIncomingMessage(err.message || 'Unable to start chat.', { avatar: AVATAR_DEFAULT, isError: true });
      });
    }
  }, [isOpen, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      setAuthPromptShown(false);
    }
  }, [isAuthenticated]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || isLoading) return;

    if (selectionPending) {
      appendIncomingMessage('Choose an in-game character or the RetroHub assistant to start chatting.', {
        avatar: AVATAR_DEFAULT,
      });
      setInputText('');
      return;
    }

    if (!isAuthenticated) {
      appendIncomingMessage('Please sign in to use the AI companion.', { avatar: AVATAR_DEFAULT });
      setAuthPromptShown(true);
      setInputText('');
      return;
    }

    try {
      await ensureChatSession();
    } catch (err) {
      appendIncomingMessage(err.message || 'Unable to start the chat session.', {
        avatar: AVATAR_DEFAULT,
        isError: true,
      });
      setInputText('');
      return;
    }

    if (selectionPending) {
      appendIncomingMessage('Choose an in-game character or the RetroHub assistant to start chatting.', {
        avatar: AVATAR_DEFAULT,
      });
      setInputText('');
      return;
    }

    if (!currentCharacter) {
      appendIncomingMessage('Choose a character to start chatting.', { avatar: AVATAR_DEFAULT });
      setInputText('');
      return;
    }

    const userMessage = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    const pendingId = generateId();
    const pendingMessage = {
      id: pendingId,
      role: 'assistant',
      content: 'On it…',
      timestamp: new Date(),
      avatar: currentAvatar(),
      pending: true,
    };

    setMessages((prev) => [...prev, userMessage, pendingMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const meta = getCurrentGameMeta();
      const payload = {
        message: text,
        character: currentCharacter,
        gameInfo: meta,
      };
      const data = await api.chatMessage(payload);
      const normalized = normalizeCharacterAvatar(data.character || currentCharacter);
      setCurrentCharacter(normalized);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === pendingId
            ? {
                ...msg,
                content: data.response || 'No response received. Try again.',
                pending: false,
                avatar: normalized?.avatar || AVATAR_DEFAULT,
              }
            : msg
        )
      );
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        appendIncomingMessage('Please sign in to use the AI companion.', { avatar: AVATAR_DEFAULT, isError: true });
        setAuthPromptShown(true);
      }
      const hint = 'If you are running locally, ensure the AI service is running and GEMINI_API_KEY is set.';
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === pendingId
            ? {
                ...msg,
                content: `${error?.message || 'Error contacting AI service'}\n${hint}`,
                pending: false,
                isError: true,
                avatar: AVATAR_DEFAULT,
              }
            : msg
        )
      );
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
      <div className="chatbot" role="dialog" aria-labelledby="chatbot-header">
        <header id="chatbot-header">
          <h2>
            <img src="/assets/pixel/6Vww.gif" alt="RetroBot" className="chat-title-avatar" />
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
          {messages.map((msg) => (
            <li key={msg.id} className={`chat ${msg.role === 'user' ? 'outgoing' : 'incoming'}`}>
              {msg.role === 'assistant' && (
                <img src={msg.avatar || AVATAR_DEFAULT} alt="RetroHub assistant" className="chat-avatar" />
              )}
              <p className={msg.isError ? 'error' : undefined}>{msg.content}</p>
            </li>
          ))}
          {selectionPending && choicePrompt && (
            <li className="chat incoming">
              <img src={AVATAR_DEFAULT} alt="RetroHub" className="chat-avatar" />
              <div className="chat-choice">
                <p>{choicePrompt}</p>
                <div className="chat-choice-grid">
                  <button
                    type="button"
                    className="choice-card prominent"
                    data-choice="in-game"
                    onClick={() => handleCharacterChoice('in-game')}
                    disabled={isSelecting}
                  >
                    <div className="choice-icon">🎮</div>
                    <strong>In-Game</strong>
                  </button>
                  {ASSISTANT_CHOICES.map((assistant) => (
                    <button
                      key={assistant.name}
                      type="button"
                      className="choice-card"
                      data-choice="assistant"
                      onClick={() => handleCharacterChoice('assistant', assistant.name)}
                      disabled={isSelecting}
                    >
                      <img src={assistant.avatar} alt={assistant.name} className="choice-avatar" />
                      <div className="choice-meta">
                        <strong>{assistant.name}</strong>
                        <span>{assistant.vibe}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
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
