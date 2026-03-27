import React, { useState, useEffect } from 'react';
import { socket } from '../socket';
import { Hash, Plus, LogOut, Settings, Lock, Eye, EyeOff } from 'lucide-react';
import { auth } from '../firebase';

const Sidebar = ({ user, activeRoom, onSelectRoom, onOpenNickname }) => {
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    socket.emit('get_rooms');
    
    const handleRoomList = (roomList) => {
      setRooms(roomList);
    };
    
    const handleRoomUpdate = () => {
      socket.emit('get_rooms');
    };

    socket.on('room_list', handleRoomList);
    socket.on('room_update', handleRoomUpdate);

    return () => {
      socket.off('room_list', handleRoomList);
      socket.off('room_update', handleRoomUpdate);
    };
  }, []);

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (newRoomName.trim()) {
      const formattedName = newRoomName.trim().toLowerCase().replace(/\s+/g, '-');
      onSelectRoom(formattedName, { isPrivate, password });
      setNewRoomName('');
      setIsPrivate(false);
      setPassword('');
      setIsCreating(false);
    }
  };

  const handleSignOut = () => {
    if (window.confirm("정말 로그아웃 하시겠습니까?")) {
      auth.signOut();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Channels</h2>
          <button 
            onClick={() => setIsCreating(!isCreating)}
            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>

        {isCreating && (
          <form onSubmit={handleCreateRoom} className="mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <input
              type="text"
              placeholder="e.g. general"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-gray-400 text-sm mb-2"
              autoFocus
            />
            <div className="flex items-center gap-2 mb-2 px-1">
              <input type="checkbox" id="isPrivate" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="rounded text-blue-500" />
              <label htmlFor="isPrivate" className="text-xs text-gray-600 dark:text-gray-300">비밀방 만들기</label>
            </div>
            {isPrivate && (
              <div className="relative mb-2">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="비밀번호 설정"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-gray-400 text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            )}
            <button type="submit" disabled={!newRoomName.trim() || (isPrivate && !password.trim())} className="w-full py-2 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 disabled:opacity-50">생성하기</button>
          </form>
        )}

        <div className="space-y-1 overflow-y-auto">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => onSelectRoom(room.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                activeRoom === room.id
                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                {room.isPrivate ? (
                  <Lock size={16} className={activeRoom === room.id ? 'opacity-100 flex-shrink-0' : 'opacity-40 group-hover:opacity-70 flex-shrink-0'} />
                ) : (
                  <Hash size={18} className={activeRoom === room.id ? 'opacity-100 flex-shrink-0' : 'opacity-40 group-hover:opacity-70 flex-shrink-0'} />
                )}
                <span className="font-medium truncate">{room.name}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                activeRoom === room.id 
                  ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}>
                {room.usersCount || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden flex-1">
            <div className="relative cursor-pointer group" onClick={onOpenNickname}>
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                alt="Profile" 
                className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 group-hover:opacity-75 transition"
              />
              <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-0.5 shadow-sm border border-gray-100 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                <Settings size={12} className="text-gray-600 dark:text-gray-300" />
              </div>
            </div>
            <div className="truncate pr-2 cursor-pointer" onClick={onOpenNickname}>
              <div className="text-sm font-bold text-gray-900 dark:text-white truncate hover:underline underline-offset-2">
                {user.displayName}
              </div>
              <div className="text-xs text-green-500 font-medium">Online</div>
            </div>
          </div>
          <button 
            onClick={handleSignOut}
            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
