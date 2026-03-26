import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { MessageSquare } from 'lucide-react';

const Auth = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error(err);
      setError('로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700/50 p-8 transform transition-all hover:scale-[1.01] duration-300">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/40 rotate-3 transition-transform hover:rotate-12 duration-300">
            <MessageSquare className="text-white w-8 h-8" />
          </div>
        </div>
        <h2 className="text-3xl font-extrabold text-center text-gray-900 dark:text-white mb-2 tracking-tight">
          Welcome to rechat
        </h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">
          실시간으로 친구들과 대화를 나누고 새로운 연결을 시작해보세요.
        </p>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 text-red-500 text-sm p-4 rounded-xl mb-6 text-center border border-red-100 dark:border-red-500/20">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-6 py-4 rounded-xl font-semibold shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
          ) : (
            <>
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Google 계정으로 시작하기</span>
            </>
          )}
        </button>

        {/* Development test buttons */}
        <div className="mt-4 flex gap-4 w-full">
          <button onClick={() => window.mockLogin?.('UserA')} className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 py-3 rounded-xl text-sm font-semibold transition-colors border border-emerald-200 shadow-sm">Test User A</button>
          <button onClick={() => window.mockLogin?.('UserB')} className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-800 py-3 rounded-xl text-sm font-semibold transition-colors border border-amber-200 shadow-sm">Test User B</button>
        </div>
      </div>
    </div>
  );
};
export default Auth;
