import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../socket';
import { Send, Hash, LogOut, Lock, Trash2 } from 'lucide-react';

const ChatRoom = ({ user, roomId, roomConfig, onLeaveRoom }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const [roomData, setRoomData] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showPasswordEditor, setShowPasswordEditor] = useState(false);
  const [newPasswordValue, setNewPasswordValue] = useState('');

  const userRef = useRef(user);
  const roomConfigRef = useRef(roomConfig);

  useEffect(() => {
    userRef.current = user;
    roomConfigRef.current = roomConfig;
  }, [user, roomConfig]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!roomId || !user?.uid) return;
    
    setMessages([]);
    setIsJoined(false);
    setShowMembers(false);

    const attemptJoin = (pwd) => {
      const u = userRef.current;
      const conf = roomConfigRef.current;
      socket.emit('join_room', {
        roomId,
        user: { uid: u.uid, displayName: u.displayName, photoURL: u.photoURL },
        isPrivate: conf?.isPrivate || false,
        password: pwd || conf?.password || ''
      });
    };

    attemptJoin();

    const handleJoinError = (msg) => {
      const pwd = window.prompt(`${msg}`);
      if (pwd !== null) {
        attemptJoin(pwd);
      } else {
        if (onLeaveRoom) onLeaveRoom();
      }
    };

    const handleJoinSuccess = () => {
      setIsJoined(true);
    };

    const handleRoomData = (data) => {
      setRoomData(data);
      setMessages(data.messages || []);
      if (data.messages && data.messages.length > 0) {
        socket.emit('mark_read', { roomId, userUid: user.uid });
      }
    };

    const handleReceiveMessage = (message) => {
      setMessages((prev) => [...prev, message]);
      socket.emit('mark_read', { roomId, userUid: user.uid });
    };

    const handleKicked = () => {
      window.alert("방장에 의해 방에서 강퇴되었습니다.");
      if (onLeaveRoom) onLeaveRoom();
    };

    const handleRoomDeleted = () => {
      window.alert("방장에 의해 방이 삭제되었습니다.");
      if (onLeaveRoom) onLeaveRoom();
    };

    socket.on('join_error', handleJoinError);
    socket.on('join_success', handleJoinSuccess);
    socket.on('room_data', handleRoomData);
    socket.on('receive_message', handleReceiveMessage);
    socket.on('kicked', handleKicked);
    socket.on('room_deleted', handleRoomDeleted);

    return () => {
      socket.emit('leave_room', { roomId, userUid: user?.uid });
      socket.off('join_error', handleJoinError);
      socket.off('join_success', handleJoinSuccess);
      socket.off('room_data', handleRoomData);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('kicked', handleKicked);
      socket.off('room_deleted', handleRoomDeleted);
    };
  }, [roomId, user?.uid]);

  useEffect(() => {
    if (isJoined && user?.uid && user?.displayName) {
      socket.emit('update_profile', {
        roomId,
        userUid: user.uid,
        newDisplayName: user.displayName
      });
    }
  }, [user?.displayName, isJoined, roomId]);

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
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md sticky top-0 z-10 w-full relative">
        {/* Only show mobile Menu button spacer so it doesn't overlap text, actual button is in ChatLayout */}
        <div className="flex items-center md:pl-0 pl-10">
          {roomData?.isPrivate ? (
            <button 
              onClick={() => {
                if(roomData.password) {
                  setNewPasswordValue(roomData.password);
                  setShowPasswordEditor(!showPasswordEditor);
                  setShowMembers(false);
                }
              }}
              className={`flex items-center justify-center mr-2 ${roomData.password ? 'hover:bg-gray-200 dark:hover:bg-gray-800 p-1.5 rounded-md cursor-pointer transition' : ''}`}
            >
              <Lock size={20} className="text-gray-400" />
            </button>
          ) : <Hash size={24} className="text-gray-400 mr-2 hidden md:block" />}
          <h2 className="text-xl font-bold text-gray-900 dark:text-white max-w-[150px] sm:max-w-none truncate">{roomId}</h2>
          <button 
            onClick={() => {
              setShowMembers(!showMembers);
              setShowPasswordEditor(false);
            }}
            className="ml-4 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm hidden sm:flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            {roomData?.users?.length || 0} members
          </button>
        </div>
        
        <div className="flex items-center flex-shrink-0">
          {roomId !== 'general' && roomData?.creatorUid === user?.uid && (
            <button onClick={() => { if (window.confirm("정말 이 방을 영구 삭제하시겠습니까? (멤버 전원 강제 퇴장)")) socket.emit('delete_room', { roomId, userUid: user.uid }); }} className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 rounded-lg transition-colors ml-2">
              <span className="hidden sm:inline">방 삭제</span>
              <Trash2 size={16} />
            </button>
          )}
          {roomId !== 'general' && (
            <button onClick={() => { if (window.confirm("방을 나가시겠습니까?")) onLeaveRoom(); }} className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 rounded-lg transition-colors ml-2">
              <span className="hidden sm:inline">나가기</span>
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Password Dropdown */}
      {showPasswordEditor && roomData?.isPrivate && roomData?.creatorUid === user?.uid && (
        <div className="absolute top-[72px] left-6 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-20 animate-in fade-in slide-in-from-top-2 p-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
            비밀번호 확인 및 수정
          </h3>
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              value={newPasswordValue} 
              onChange={(e) => setNewPasswordValue(e.target.value)} 
              className="w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button 
              onClick={() => {
                if (newPasswordValue.trim()) {
                  socket.emit('update_password', { roomId, userUid: user.uid, newPassword: newPasswordValue });
                  setShowPasswordEditor(false);
                }
              }}
              className="px-3 py-1.5 text-xs font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow-sm transition-colors"
            >
              저장
            </button>
          </div>
        </div>
      )}

      {/* Member List Dropdown */}
      {showMembers && (
        <div className="absolute top-[72px] left-1/2 sm:left-32 -translate-x-1/2 sm:translate-x-0 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-20 animate-in fade-in slide-in-from-top-2 p-2 hidden sm:block mt-1">
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase px-3 py-2 border-b border-gray-100 dark:border-gray-700 mb-2">
            Participants ({roomData?.users?.length || 0})
          </h3>
          <div className="max-h-60 overflow-y-auto space-y-1">
            {roomData?.users?.map((u) => (
              <div key={u.uid} className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-gray-50 dark:bg-gray-700/50 transition">
                <div className="flex items-center gap-3">
                  <img src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName}`} alt="avatar" className="w-8 h-8 rounded-full shadow-sm" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{u.displayName}</span>
                    {u.uid === user.uid ? (
                      <span className="text-[10px] text-blue-600 font-extrabold bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400 px-1.5 py-0.5 rounded-md w-fit mt-0.5">Me</span>
                    ) : (roomData?.creatorUid === user?.uid && (
                      <button onClick={() => { if(window.confirm(`정말 ${u.displayName}님을 강제로 추방시키겠습니까?`)) socket.emit('kick_user', { roomId, userUid: user.uid, targetUid: u.uid }) }} className="text-[10px] text-red-500 border border-red-200 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10 px-1.5 py-0.5 rounded-md mt-0.5 w-fit font-bold transition">
                        강퇴
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                  <div className={`flex items-center gap-1 mt-1 ${isMe ? 'mr-1 flex-row-reverse' : 'ml-1'}`}>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                      {formatTime(msg.timestamp)}
                    </span>
                    {roomData?.users && roomData.users.length > 0 && (roomData.users.length - (msg.readBy?.length || 1)) > 0 && (
                      <span className="text-[10px] font-bold text-yellow-500">
                        {roomData.users.length - (msg.readBy?.length || 1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {isJoined && (
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
      )}
    </div>
  );
};

export default ChatRoom;
