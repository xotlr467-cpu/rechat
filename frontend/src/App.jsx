import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Auth from './components/Auth';
import ChatLayout from './components/ChatLayout';
import NicknameModal from './components/NicknameModal';
import { Moon, Sun } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState(null);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for dark mode preference
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const storedNickname = localStorage.getItem(`nickname_${currentUser.uid}`);
        if (storedNickname) {
          setNickname(storedNickname);
        } else {
          setNickname(currentUser.displayName);
          setShowNicknameModal(true);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  };

  const handleSaveNickname = (newName) => {
    setNickname(newName);
    localStorage.setItem(`nickname_${user.uid}`, newName);
    setShowNicknameModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-200 font-sans">
      <header className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <span className="text-white font-bold text-xl">R</span>
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600">rechat</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-all hover:scale-105 active:scale-95 duration-200"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {!user ? (
          <Auth />
        ) : (
          <>
            <ChatLayout 
              user={{ ...user, displayName: nickname || user.displayName }} 
              onOpenNickname={() => setShowNicknameModal(true)} 
            />
            {showNicknameModal && (
              <NicknameModal 
                currentNickname={nickname}
                onSave={handleSaveNickname}
                onClose={() => setShowNicknameModal(false)}
                isForce={!localStorage.getItem(`nickname_${user.uid}`)}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
