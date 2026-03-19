import React, { useRef, useCallback, useMemo } from 'react';
import styles from './ChatWindow.module.css';
import { ArrowLeft, Phone, Video, MoreVertical, Paperclip, Smile, Send, Mic, Reply, X, Search, Shield, Trash2, FileText, FileBadge, FileSpreadsheet, File, Download } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

import { useWebRTC } from '@/hooks/useWebRTC';
import CallModal from '@/components/Calls/CallModal';
import { createClient } from '@/utils/supabase/client';
import { useChatStore } from '@/hooks/useChatStore';
import { LocalRealtimeService } from '@/services/local-realtime.service';
import { decryptMessage } from '@/lib/encryption';

interface ChatWindowProps {
  chat: { id: string; name: string; avatar: string; imageUrl?: string; online?: boolean; isGroup?: boolean } | null;
  onBack: () => void;
  isMobileWindowVisible: boolean;
}

export default function ChatWindow({ chat, onBack, isMobileWindowVisible }: ChatWindowProps) {
  const { isCalling, isIncoming, startCall, acceptCall, hangup, remoteStream } = useWebRTC(chat?.id || null);
  const { currentUser, presence, markAsSeen, refreshConversations } = useChatStore();
  const [message, setMessage] = React.useState('');
  const [messages, setMessages] = React.useState<any[]>([]);
  const [fullChat, setFullChat] = React.useState<any>(null);
  const [hasMore, setHasMore] = React.useState(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const cursorRef = useRef<string | null>(null);
  const loadingRef = useRef(false);
  const setupChatIdRef = useRef<string | null>(null);
  const [activeMessageMenu, setActiveMessageMenu] = React.useState<string | null>(null);
  
  // Ref to handle clicking outside the menu
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMessageMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [isRecording, setIsRecording] = React.useState(false);
  const [recordingTime, setRecordingTime] = React.useState(0);
  const [isUploading, setIsUploading] = React.useState(false);
  const [replyingTo, setReplyingTo] = React.useState<any>(null);
  const [lightboxImage, setLightboxImage] = React.useState<string | null>(null);
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [typingUsers, setTypingUsers] = React.useState<string[]>([]);
  const [recordingUsers, setRecordingUsers] = React.useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const websocketRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const observerTargetRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const supabaseRef = useRef(createClient());

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, []);

  const fetchFullChat = useCallback(async () => {
    if (!chat?.id) return;
    try {
      const response = await fetch(`/api/conversations/${chat.id}`);
      if (response.ok) {
        const data = await response.json();
        setFullChat(data);
      }
    } catch (err) {
      console.error("Error fetching full chat:", err);
    }
  }, [chat?.id]);

  React.useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const fetchMessages = useCallback(async (overrideCursor?: string | null) => {
    if (!chat?.id || loadingRef.current) return;
    
    // Determine the cursor to use
    const currentCursor = overrideCursor === undefined ? cursorRef.current : overrideCursor;
    
    // If we're trying to fetch more but have no cursor, we're done
    if (currentCursor === null && messages.length > 0) {
      setHasMore(false);
      return;
    }

    loadingRef.current = true;
    if (!currentCursor) setIsLoadingMore(true); // Only show spinner for initial or large fetches if desired

    try {
      const url = new URL(`/api/conversations/${chat.id}/messages`, window.location.origin);
      if (currentCursor) {
        url.searchParams.set('cursor', currentCursor);
      }

      const response = await fetch(url.toString());
      if (!response.ok) return;
      const data = await response.json();
      
      if (data.messages) {
        const fetchedMessages = data.messages.reverse();
        setMessages(prev => currentCursor ? [...fetchedMessages, ...prev] : fetchedMessages);
        
        cursorRef.current = data.nextCursor;
        setHasMore(!!data.nextCursor);

        if (!currentCursor) {
          setTimeout(scrollToBottom, 50);
        }
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      loadingRef.current = false;
      setIsLoadingMore(false);
    }
  }, [chat?.id, messages.length, scrollToBottom]);

  // Setup chat on id change
  React.useEffect(() => {
    if (!chat?.id || setupChatIdRef.current === chat.id) return;
    
    // Mark as handled for this ID to prevent loops
    setupChatIdRef.current = chat.id;

    // Reset local state for new chat
    setMessages([]);
    cursorRef.current = null;
    setHasMore(true);
    
    // Initial data fetch
    fetchMessages(''); // Fetches first page
    fetchFullChat();
    
    // Server-side mark as seen
    fetch(`/api/conversations/${chat.id}/seen`, { method: 'POST' });
    // Local-side mark as seen for instant UI update
    markAsSeen(chat.id);

  }, [chat?.id, fetchMessages, fetchFullChat, markAsSeen]);

  const handleBlock = async () => {
    if (!chat?.id || !confirm("Are you sure you want to block this user? This will also delete your conversation with them.")) return;
    
    // Find the other user's ID from fullChat members
    const otherUser = fullChat?.members?.find((m: any) => m.userId !== currentUser?.id)?.user;
    const otherUserId = fullChat?.members?.find((m: any) => m.userId !== currentUser?.id)?.userId;
    
    if (!otherUserId) return;

    try {
      const response = await fetch(`/api/users/${otherUserId}/block`, { method: 'POST' });
      if (response.ok) {
        refreshConversations();
        window.location.href = '/'; // Redirect to home/clear chat
      }
    } catch (error) {
      console.error("Failed to block user:", error);
    }
  };

  // Realtime Setup (Local SSE)
  React.useEffect(() => {
    if (!chat?.id || !currentUser?.id) return;

    const subscription = LocalRealtimeService.subscribe((eventName, data) => {
      // Filter typing events for this chat
      if (data.conversationId !== chat.id) return;

      switch(eventName) {
        case 'message:new':
          setMessages((current) => {
            if (current.some(m => m.id === data.id)) return current;
            
            // Decrypt the body
            const decryptedBody = data.body ? decryptMessage(data.body) : data.body;
            
            // Decrypt replyTo body if it exists
            const replyTo = data.replyTo ? {
              ...data.replyTo,
              body: data.replyTo.body ? decryptMessage(data.replyTo.body) : data.replyTo.body
            } : null;
            
            // Resolve sender info
            let sender = data.sender;
            if (!sender) {
              if (data.senderId === currentUser?.id) {
                sender = { username: currentUser.username || 'You', image: currentUser.image };
              } else {
                const member = fullChat?.members?.find((m: any) => m.userId === data.senderId);
                sender = member?.user || { username: 'Someone', image: null };
              }
            }

            // When a real message arrives, remove any optimistic message with same body and sender
            const filtered = current.filter(m => {
              if (!m._optimistic) return true;
              // Match by body
              if (m.body === decryptedBody && m.senderId === data.senderId) return false;
              // Match by voiceNoteUrl (optimistic blob)
              if (m.voiceNoteUrl && m.voiceNoteUrl.startsWith('blob:') && data.voiceNoteUrl && m.senderId === data.senderId) return false;
              // Match by other attachments
              if ((m.imageUrl === data.imageUrl || m.videoUrl === data.videoUrl || m.documentUrl === data.documentUrl) && m.senderId === data.senderId) return false;
              return true;
            });
            return [...filtered, { ...data, body: decryptedBody, sender, replyTo }];
          });
          setTimeout(scrollToBottom, 50);
          markAsSeen(chat.id);
          fetch(`/api/conversations/${chat.id}/seen`, { method: 'POST' });
          break;

        case 'typing:start':
          if (data.userId !== currentUser.id) {
            setTypingUsers(prev => Array.from(new Set([...prev, data.userId])));
            setTimeout(scrollToBottom, 50);
          }
          break;

        case 'typing:stop':
          setTypingUsers(prev => prev.filter(id => id !== data.userId));
          break;

        case 'recording:start':
          if (data.userId !== currentUser.id) {
            setRecordingUsers(prev => Array.from(new Set([...prev, data.userId])));
            setTimeout(scrollToBottom, 50);
          }
          break;

        case 'recording:stop':
          setRecordingUsers(prev => prev.filter(id => id !== data.userId));
          break;

        case 'message:update':
          setMessages((current) => current.map(m => m.id === data.id ? { ...m, ...data } : m));
          break;
      }
    });

    return () => {
      subscription.cleanup();
    };
  }, [chat?.id, currentUser, fullChat, markAsSeen, scrollToBottom]);

  // Intersection Observer for Infinite Scroll
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && messages.length > 0) {
          fetchMessages();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTargetRef.current) {
      observer.observe(observerTargetRef.current);
    }
    return () => observer.disconnect();
  }, [fetchMessages, hasMore, isLoadingMore, messages.length]);



  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 16000 });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      if (chat?.id) LocalRealtimeService.setRecording(chat.id, true);
    } catch (err) {
      console.error("Failed to start voice recording:", err);
    }
  };

  const cancelRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) return;
    mediaRecorderRef.current.onstop = null;
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    setIsRecording(false);
    setRecordingTime(0);
    audioChunksRef.current = [];
    if (chat?.id) LocalRealtimeService.setRecording(chat.id, false);
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) {
      setIsRecording(false);
      return;
    }

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      audioChunksRef.current = [];
      setIsUploading(true);
      setIsRecording(false);
      if (chat?.id) LocalRealtimeService.setRecording(chat.id, false);
      
      const localUrl = URL.createObjectURL(audioBlob);
      const optId = `opt_${Date.now()}`;
      setMessages((current) => [...current, {
        id: optId,
        _optimistic: true,
        body: '',
        senderId: currentUser?.id,
        conversationId: chat?.id,
        createdAt: new Date().toISOString(),
        sender: { username: 'You', image: null },
        voiceNoteUrl: localUrl
      }]);
      setTimeout(scrollToBottom, 50);
      
      const fileName = `${Date.now()}_voice.webm`;
      const formData = new FormData();
      formData.append('file', audioBlob, fileName);
      
      try {
        const response = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!response.ok) throw new Error('Failed to upload voice note');
        const data = await response.json();
        
        // Remove optimistic local preview
        setMessages((current) => current.filter(m => m.id !== optId));
        
        await handleSendMessage({ voiceNoteUrl: data.url });
      } catch (error) {
        console.error("Error uploading voice note:", error);
      } finally {
        setIsUploading(false);
      }
    };
    
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
  };

  const renderMessageBody = (body: string) => {
    if (!searchQuery) return <p>{body}</p>;
    const parts = body.split(new RegExp(`(${searchQuery})`, 'gi'));
    return (
      <p>
        {parts.map((part, i) => 
          part.toLowerCase() === searchQuery.toLowerCase() 
            ? <mark key={i} className="bg-yellow-200 text-black rounded px-0.5">{part}</mark> 
            : part
        )}
      </p>
    );
  };

  const handleSendMessage = async (attachments: any = {}) => {
    if (!chat || (!message.trim() && !attachments.imageUrl && !attachments.videoUrl && !attachments.documentUrl && !attachments.voiceNoteUrl)) return;
    const body = message;
    setMessage('');

    // Optimistic insert
    const optimisticMsg = {
      id: `opt_${Date.now()}`,
      _optimistic: true,
      body,
      senderId: currentUser?.id,
      conversationId: chat.id,
      createdAt: new Date().toISOString(),
      sender: { username: 'You', image: null },
      replyTo: replyingTo,
      ...attachments,
    };
    setMessages((current) => [...current, optimisticMsg]);
    setTimeout(scrollToBottom, 50);

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body,
          conversationId: chat.id,
          replyToId: replyingTo?.id?.startsWith('opt_') ? null : replyingTo?.id,
          ...attachments
        })
      });
      setReplyingTo(null);
      LocalRealtimeService.setTyping(chat.id, false);
    } catch (error) {
      console.error("Failed to send message:", error);
      // Remove optimistic message on failure
      setMessages((current) => current.filter(m => m.id !== optimisticMsg.id));
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !chat) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('File upload failed');
      const data = await response.json();
      
      const attachments: any = {};
      if (file.type.startsWith('image/')) attachments.imageUrl = data.url;
      else if (file.type.startsWith('video/')) attachments.videoUrl = data.url;
      else if (file.type.startsWith('audio/')) attachments.voiceNoteUrl = data.url;
      else attachments.documentUrl = data.url;

      await handleSendMessage(attachments);
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      await fetch(`/api/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji })
      });
      // Realtime will handle the update
    } catch (error) {
      console.error("Failed to toggle reaction:", error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await fetch(`/api/messages/${messageId}/delete`, {
        method: 'PATCH'
      });
      // Realtime will handle the update
      setActiveMessageMenu(null);
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  if (!chat) {
    return (
      <div className={clsx(styles.emptyState, !isMobileWindowVisible && styles.hiddenOnMobile)}>
        <div className={styles.emptyContent}>
          <h3>Select a chat to start messaging</h3>
          <p>Send and receive messages seamlessly across devices.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx(styles.container, !isMobileWindowVisible && styles.hiddenOnMobile)}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={onBack} aria-label="Back">
            <ArrowLeft size={24} />
          </button>
          <img 
            src={chat.imageUrl || chat.avatar || `https://ui-avatars.com/api/?name=${chat.name}&background=random`} 
            alt={chat.name} 
            className={styles.avatar} 
          />
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
              {chat?.isGroup ? fullChat?.name : (chat?.name || 'Chat')}
            </h2>
            {recordingUsers.length > 0 ? (
              <span className="text-xs text-green-500 animate-pulse font-medium">
                recording audio...
              </span>
            ) : typingUsers.length > 0 ? (
              <span className="text-xs text-blue-500 animate-pulse font-medium">
                typing...
              </span>
            ) : chat?.isGroup ? (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {fullChat?.members?.length || 0} members
              </span>
            ) : (
              <span className="text-xs text-green-500 font-medium tracking-wide">
                {(() => {
                  const otherMember = fullChat?.members?.find((m: any) => m.userId !== currentUser?.id);
                  return (otherMember && presence[otherMember.userId]) 
                    ? ((Date.now() - presence[otherMember.userId] < 5 * 60 * 1000) ? 'Online' : 'Offline') 
                    : 'Offline';
                })()}
              </span>
            )}
          </div>
        </div>
        <div className={styles.headerRight}>
          <button onClick={() => setIsSearching(!isSearching)} className={styles.iconBtn}><Search size={20} /></button>
          <button onClick={startCall} className={styles.iconBtn}><Phone size={20} /></button>
          <button className={styles.iconBtn}><Video size={20} /></button>
          <div className="relative group">
            <button 
              onClick={() => {
                const dropdown = document.getElementById('chat-more-dropdown');
                if (dropdown) dropdown.classList.toggle('hidden');
              }}
              className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all duration-300"
            >
              <MoreVertical size={20} />
            </button>
            <div id="chat-more-dropdown" className="hidden absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-2 overflow-hidden">
              <button 
                onClick={handleBlock}
                className="w-full px-4 py-2.5 text-left text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
              >
                <Shield size={16} /> Block User
              </button>
              <button 
                onClick={() => {}} 
                className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors"
              >
                <Trash2 size={16} /> Delete Conversation
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isSearching && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-white border-b border-[#E2E8F0] px-4 py-3 flex items-center gap-3">
             <Search size={18} className="text-[#9CA3AF]" />
             <input type="text" placeholder="Search in chat..." autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1 bg-transparent outline-none text-[15px] font-medium text-[#111827] placeholder:text-[#9CA3AF]" />
             <button onClick={() => { setIsSearching(false); setSearchQuery(''); }} className="text-[#9CA3AF] hover:text-[#111827] bg-black/5 rounded-full p-1 transition-colors"><X size={18}/></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={styles.messagesArea}>
        {hasMore && (
          <div ref={observerTargetRef} className="w-full flex justify-center py-4">
            {isLoadingMore ? (
              <div className="w-6 h-6 border-2 border-[#2C6BED] border-t-transparent rounded-full animate-spin" />
            ) : null}
          </div>
        )}


        <div className={styles.dateLabel}>Today</div>

        {messages.map((msg, index) => (
          <motion.div
             key={msg.id || index}
             layout
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: msg._optimistic ? 0.7 : 1, y: 0 }}
             className={styles.messageRow}
          >
            <div className={clsx(
              (msg.voiceNoteUrl && !msg.body && !msg.imageUrl && !msg.videoUrl && !msg.documentUrl) 
                ? [styles.vnContainer, msg.senderId === currentUser?.id ? styles.vnSent : styles.vnReceived]
                : [styles.messageBubble, msg.senderId === currentUser?.id ? styles.sent : styles.received],
              "cursor-pointer group relative"
            )}
            onClick={(e) => {
              if (activeMessageMenu === msg.id) setActiveMessageMenu(null);
              else setActiveMessageMenu(msg.id);
            }}
          >
            {/* Click-to-reply Menu Toast */}
            {activeMessageMenu === msg.id && (
              <div 
                ref={menuRef}
                className={clsx(
                  "absolute flex items-center gap-2 bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 rounded-2xl p-2 z-[100] transition-all",
                  msg.senderId === currentUser?.id ? "right-1/2 xs:right-0 top-[-50px]" : "left-0 top-[-50px]"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Emoji Reactions */}
                <div className="flex bg-slate-100 dark:bg-slate-700 rounded-full px-2 py-1 gap-1 border border-slate-200 dark:border-slate-600">
                  {['❤️', '👍', '🔥', '😂', '😮'].map(emoji => (
                    <button 
                      key={emoji} 
                      onClick={() => { handleReaction(msg.id, emoji); setActiveMessageMenu(null); }}
                      className="hover:scale-125 transition-transform p-1 text-sm leading-none"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                {/* Reply Button */}
                <button 
                  onClick={() => { setReplyingTo(msg); setActiveMessageMenu(null); }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors font-bold text-xs"
                >
                  <Reply size={14} /> Reply
                </button>
                {/* Delete Button */}
                {msg.senderId === currentUser?.id && !msg.isDeleted && (
                  <button 
                    onClick={() => handleDeleteMessage(msg.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors font-bold text-xs"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                )}
              </div>
            )}

            {/* Reply Reference */}
              {msg.replyTo && (
                <div 
                  className="relative p-2 mb-2 bg-black/5 dark:bg-white/10 rounded-lg border-l-4 overflow-hidden"
                  style={{ borderLeftColor: msg.senderId === currentUser?.id ? '#1e40af' : '#2563eb' }}
                >
                  <span className="font-bold text-xs block mb-0.5" style={{ color: msg.senderId === currentUser?.id ? '#1e40af' : '#2563eb' }}>
                    {msg.replyTo.sender?.username || 'User'}
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-300 truncate block">
                     {msg.replyTo.body || (msg.replyTo.imageUrl ? '📷 Photo' : msg.replyTo.videoUrl ? '🎥 Video' : msg.replyTo.voiceNoteUrl ? '🎤 Voice message' : msg.replyTo.documentUrl ? '📄 Document' : 'Message')}
                  </span>
                </div>
              )}
              {chat.isGroup && msg.senderId !== currentUser?.id && (
                <span className="text-[10px] font-bold text-blue-400 block mb-1">
                   @{msg.sender?.username || 'user'}
                </span>
              )}
              {msg.isDeleted ? (
                <div className="flex items-center gap-2 text-slate-400 italic text-[13px] py-1">
                  <Shield size={14} />
                  <span>This message was deleted</span>
                </div>
              ) : (
                <>
                  {msg.imageUrl && (
                    <img src={msg.imageUrl} alt="Attachment" className="max-w-full rounded-lg mb-2 cursor-pointer hover:opacity-90 transition-opacity shadow-sm" onClick={() => setLightboxImage(msg.imageUrl)} />
                  )}
                  {msg.videoUrl && (
                    <video src={msg.videoUrl} controls className="max-w-full rounded-lg mb-2" />
                  )}
                  {msg.documentUrl && (
                    <a href={msg.documentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-white/10 dark:bg-slate-800/50 rounded-xl mb-2 hover:bg-white/20 transition-all w-full border border-white/10">
                      <div className="p-2 bg-blue-500/20 rounded-lg text-blue-500">
                        {msg.documentUrl.toLowerCase().endsWith('.pdf') ? <FileText size={24} /> : 
                         msg.documentUrl.toLowerCase().match(/\.(doc|docx)$/) ? <FileBadge size={24} /> :
                         msg.documentUrl.toLowerCase().match(/\.(xls|xlsx)$/) ? <FileSpreadsheet size={24} /> :
                         <File size={24} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">
                          {msg.documentUrl.split('_').slice(1).join('_') || 'Document'}
                        </p>
                        <p className="text-[10px] opacity-50 uppercase font-black tracking-tighter">
                          {msg.documentUrl.split('.').pop()} File
                        </p>
                      </div>
                      <Download size={18} className="text-slate-400" />
                    </a>
                  )}
                  {msg.voiceNoteUrl && (
                    <div className="flex flex-col gap-1 w-[260px] sm:w-[300px]">
                      <audio 
                        src={msg.voiceNoteUrl} 
                        controls 
                        className="w-full h-12 rounded-full outline-none shadow-sm filter drop-shadow-sm [&::-webkit-media-controls-enclosure]:bg-white [&::-webkit-media-controls-enclosure]:rounded-full dark:[&::-webkit-media-controls-enclosure]:bg-[#1e293b]" 
                      />
                      {msg.voiceNoteUrl && !msg.body && !msg.imageUrl && !msg.videoUrl && !msg.documentUrl && (
                        <div className="flex items-center justify-end px-2">
                          <span className="text-[10px] text-slate-500 font-medium">
                            {format(new Date(msg.createdAt), 'h:mm a')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {msg.body && renderMessageBody(msg.body)}
                </>
              )}
              
              {/* Normal footer row for standard bubbles (hidden for standalone voice notes to avoid duplication) */}
              {!(msg.voiceNoteUrl && !msg.body && !msg.imageUrl && !msg.videoUrl && !msg.documentUrl) && (
                <div className="flex items-center justify-between mt-1 gap-4">
                  {/* Reactions */}
                  <div className="flex gap-1 flex-wrap">
                    {msg.reactions?.map((r: any) => (
                      <span key={r.id} className="text-[12px] bg-white/20 px-1.5 py-0.5 rounded-full shadow-sm">
                        {r.emoji}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={styles.timestamp}>
                      {format(new Date(msg.createdAt), 'h:mm a')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
        
        {typingUsers.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-6 py-4"
          >
            <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400">
              <div className="flex gap-1 bg-slate-100 rounded-full px-3 py-2 shadow-sm border border-slate-200/50">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Recording UI overlay removed; integrated into inputArea below */}

      {/* Replying To Bar */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-6 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-1 h-8 bg-blue-500 rounded-full" />
              <div className="min-w-0">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-wider">Replying to @{replyingTo.sender.username}</p>
                <p className="text-xs text-slate-500 truncate font-medium">{replyingTo.body || 'Media attachment'}</p>
              </div>
            </div>
            <button onClick={() => setReplyingTo(null)} className="p-1.5 hover:bg-slate-200 rounded-full transition-colors">
              <X size={16} className="text-slate-400" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className={styles.inputArea}>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileUpload}
          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
        />
        <AnimatePresence mode="popLayout">
          {isRecording ? (
            <motion.div 
              key="recording-ui"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '100%', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="flex items-center w-full gap-3 py-1 pr-1"
            >
              <button 
                onClick={cancelRecording}
                className="text-red-500 hover:bg-red-50 p-2.5 rounded-full transition-colors flex-shrink-0"
              >
                <Trash2 size={22} />
              </button>
              <div className="flex-1 flex items-center justify-center gap-2">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-500 font-medium tabular-nums font-mono text-base">
                  {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <button
                onClick={stopRecording}
                className={clsx(styles.iconBtn, styles.sendBtn)}
              >
                <Send size={22} />
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="text-ui"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-end gap-2 w-full"
            >
              <button 
                className={clsx(styles.iconBtn, isUploading && "animate-pulse")} 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Paperclip size={24} />
              </button>
              <div className={styles.inputWrapper}>
                <div className="relative">
                  <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={styles.insideIconBtn}><Smile size={24} /></button>
                  <AnimatePresence>
                    {showEmojiPicker && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full left-0 mb-4 bg-white dark:bg-slate-800 border dark:border-slate-700 shadow-2xl rounded-2xl p-3 w-72 max-h-64 overflow-y-auto overflow-x-hidden z-50 flex flex-wrap gap-1 items-start justify-start select-none"
                      >
                        {['😀','😃','😄','😁','😆','😅','😂','🤣','🥲','☺️','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥸','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕'].map(e => (
                           <button 
                             key={e} 
                             onClick={() => { setMessage(prev => prev + e); textareaRef.current?.focus(); }} 
                             className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-2xl transition-transform hover:scale-110 active:scale-95"
                           >
                             {e}
                           </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <textarea 
                  ref={textareaRef}
                  rows={1}
                  placeholder="Message" 
                  className={styles.msgInput} 
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    autoResize();
                    LocalRealtimeService.setTyping(chat.id, e.target.value.length > 0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                      if (textareaRef.current) textareaRef.current.style.height = 'auto';
                    }
                  }}
                />
              </div>
              <AnimatePresence mode="wait">
                {message.trim().length > 0 ? (
                  <motion.button
                    key="send"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className={clsx(styles.iconBtn, styles.sendBtn)}
                    onClick={() => handleSendMessage()}
                  >
                    <Send size={24} />
                  </motion.button>
                ) : (
                  <motion.button
                    key="mic"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className={clsx(styles.waMicBtn)}
                    onClick={startRecording}
                  >
                    <Mic size={24} className="text-white" />
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Global UI Overlays */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          >
            <button 
              onClick={() => setLightboxImage(null)}
              className="absolute top-6 right-6 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"
            >
              <X size={24} />
            </button>
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              src={lightboxImage} 
              alt="Fullscreen Attachment" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" 
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {chat && (
        <>
          <CallModal 
            isOpen={isCalling || isIncoming}
            isIncoming={isIncoming}
            onClose={hangup}
            onAccept={acceptCall}
            callerName={chat.name}
            callerAvatar={chat.avatar}
          />
          <audio 
            ref={(ref) => { if (ref && remoteStream) ref.srcObject = remoteStream; }} 
            autoPlay 
            className="hidden" 
          />
        </>
      )}
    </div>
  );
}
