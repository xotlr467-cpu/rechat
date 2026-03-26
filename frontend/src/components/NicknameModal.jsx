import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

const NicknameModal = ({ currentNickname, onSave, onClose, isForce }) => {
  const [name, setName] = useState(currentNickname || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">닉네임 설정</h3>
          {!isForce && (
            <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <X size={20} />
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">채팅에서 사용할 닉네임을 입력해주세요.</p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="새 닉네임"
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            autoFocus
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full mt-6 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold flex items-center justify-center gap-2 py-3 rounded-xl transition-all"
          >
            <Check size={18} />
            <span>저장하기</span>
          </button>
        </form>
      </div>
    </div>
  );
};
export default NicknameModal;
