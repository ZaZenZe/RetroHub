import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { GamesProvider } from './context/GamesContext';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import AuthModal from './components/AuthModal';
import Home from './pages/Home';
import GameDetail from './pages/GameDetail';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import About from './pages/About';
import AdminApp from './admin/AdminApp';
import '../style.css';

function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [currentGame, setCurrentGame] = useState(null);

  const handleChatOpen = () => {
    setIsChatbotOpen(true);
  };

  return (
    <Router>
      <AuthProvider>
        <GamesProvider>
          <ThemeProvider>
            <div className="app">
              <Header onAuthClick={() => setIsAuthModalOpen(true)} />
              
              <main className="app-main" role="main">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route 
                    path="/game/:gameId" 
                    element={<GameDetail onChatOpen={handleChatOpen} onGameChange={setCurrentGame} />} 
                  />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/admin/*" element={<AdminApp />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>

              <Footer />
              <Chatbot
                currentGame={currentGame}
                isOpen={isChatbotOpen}
                onOpenChange={setIsChatbotOpen}
              />
              <AuthModal 
                isOpen={isAuthModalOpen} 
                onClose={() => setIsAuthModalOpen(false)} 
              />
            </div>
          </ThemeProvider>
        </GamesProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
