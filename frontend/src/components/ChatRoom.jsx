import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../socket';
import { Send, Hash } from 'lucide-react';

const ChatRoom = ({ user, roomId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const [roomData, setRoomData] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!roomId || !user) return;
    
    setMessages([]);

    const joinData = {
      roomId,
      user: {
        uid: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL
      }
    };
    
    socket.emit('join_room', joinData);

    const handleRoomData = (data) => {
      setRoomData(data);
      setMessages(data.messages || []);
    };

    const handleReceiveMessage = (message) => {
      setMessages((prev) => [...prev, message]);
    };

    socket.on('room_data', handleRoomData);
    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('room_data', handleRoomData);
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [roomId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !roomId) return;

    const messageData = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      text: newMessage,
      sender: {
        uid: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL
      },
      timestamp: new Date().toISOString()
    };

    socket.emit('send_message', { roomId, message: messageData });
    setNewMessage('');
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-[#0f172a] relative">
      {/* Header */}
      <div className="hidden md:flex items-center px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md sticky top-0 z-10">
        <Hash size={24} className="text-gray-400 mr-2" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{roomId}</h2>
        <span className="ml-4 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
          {roomData?.users?.length || 0} members
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg, idx) => {
          const isMe = msg.sender.uid === user.uid;
          const showAvatar = idx === 0 || messages[idx - 1].sender.uid !== msg.sender.uid;

          return (
            <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[85%] md:max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                {!isMe && showAvatar ? (
                  <img 
                    src={msg.sender.photoURL || `https://ui-avatars.com/api/?name=${msg.sender.displayName}`} 
                    alt="avatar" 
                    className="w-8 h-8 rounded-full mb-1 flex-shrink-0 shadow-sm"
                  />
                ) : (
                  !isMe && <div className="w-8 flex-shrink-0" />
                )}
                
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {showAvatar && !isMe && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 ml-1 font-medium">{msg.sender.displayName}</span>
                  )}
                  <div className={`
                    relative px-5 py-3 rounded-2xl shadow-sm
                    ${isMe 
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-br-sm' 
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm border border-gray-100 dark:border-gray-700/50'
                    }
                  `}>
                    <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  <span className={`text-[10px] text-gray-400 dark:text-gray-500 mt-1 ${isMe ? 'mr-1' : 'ml-1'}`}>
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 md:p-6 bg-transparent">
        <form onSubmit={handleSendMessage} className="relative">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message #${roomId}`}
            className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-full pl-6 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-shadow hover:shadow-md"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-blue-500 transition-all transform active:scale-95 flex items-center justify-center shadow-md shadow-blue-500/20"
          >
            <Send size={18} className="translate-x-[1px] translate-y-[-1px]" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;
