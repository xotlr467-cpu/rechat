import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import ChatRoom from './ChatRoom';
import { socket } from '../socket';
import { Menu, X } from 'lucide-react';

const ChatLayout = ({ user }) => {
  const [activeRoom, setActiveRoom] = useState('general');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    socket.connect();
    
    return () => {
      socket.disconnect();
    };
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleRoomSelect = (roomId) => {
    setActiveRoom(roomId);
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        absolute inset-y-0 left-0 z-30 transform 
        md:relative md:translate-x-0 transition duration-300 ease-in-out
        w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 
        flex flex-col
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="md:hidden flex justify-end p-4 border-b border-gray-100 dark:border-gray-700">
          <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X size={24} />
          </button>
        </div>
        <Sidebar user={user} activeRoom={activeRoom} onSelectRoom={handleRoomSelect} />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 min-w-0">
        <div className="md:hidden flex items-center p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm z-10">
          <button 
            onClick={toggleSidebar}
            className="p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition"
          >
            <Menu size={24} />
          </button>
          <div className="ml-2 font-semibold text-gray-800 dark:text-white truncate">
            {activeRoom ? `#${activeRoom}` : 'rechat'}
          </div>
        </div>
        
        <ChatRoom user={user} roomId={activeRoom} />
      </div>
    </div>
  );
};

export default ChatLayout;
