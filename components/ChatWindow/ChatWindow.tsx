import React, { useRef, useCallback, useMemo } from 'react';
import styles from './ChatWindow.module.css';
import { ArrowLeft, Phone, Video, MoreVertical, Paperclip, Smile, Send, Mic, Reply, X, Search } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

import { useWebRTC } from '@/hooks/useWebRTC';
import CallModal from '@/components/Calls/CallModal';
import { createClient } from '@/utils/supabase/client';
import { useChatStore } from '@/hooks/useChatStore';

interface ChatWindowProps {
  chat: { id: string; name: string; avatar: string; imageUrl?: string; online?: boolean; isGroup?: boolean } | null;
  onBack: () => void;
  isMobileWindowVisible: boolean;
}

export default function ChatWindow({ chat, onBack, isMobileWindowVisible }: ChatWindowProps) {
  const { isCalling, isIncoming, startCall, acceptCall, hangup, remoteStream } = useWebRTC(chat?.id || null);
  const { currentUser } = useChatStore();
  const [message, setMessage] = React.useState('');
  const [messages, setMessages] = React.useState<any[]>([]);
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [hasMore, setHasMore] = React.useState(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [isRecording, setIsRecording] = React.useState(false);
  const [recordingTime, setRecordingTime] = React.useState(0);
  const [isUploading, setIsUploading] = React.useState(false);
  const [replyingTo, setReplyingTo] = React.useState<any>(null);
  const [lightboxImage, setLightboxImage] = React.useState<string | null>(null);
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
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
    if (!chat || isLoadingMore) return;
    const currentCursor = overrideCursor === undefined ? cursor : overrideCursor;
    if (currentCursor === null && messages.length > 0) return; // Means no more and not initial fetch

    setIsLoadingMore(true);
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
        setCursor(data.nextCursor);
        setHasMore(!!data.nextCursor);

        if (!currentCursor) {
          setTimeout(scrollToBottom, 50);
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [chat?.id, cursor, messages.length, isLoadingMore, scrollToBottom]);

  // Initial fetch and Realtime Setup
  React.useEffect(() => {
    if (!chat) return;
    const supabase = supabaseRef.current;

    // Reset state for new chat
    setMessages([]);
    setCursor(null);
    setHasMore(true);
    fetchMessages(''); // Pass empty string to act as falsy currentCursor but distinct from null check

    const channel = supabase
      .channel(`chat:${chat.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'Message', filter: `conversationId=eq.${chat.id}` },
        async (payload) => {
          setMessages((current) => {
            if (current.some(m => m.id === payload.new.id)) return current;
            supabase
              .from('User')
              .select('username, image')
              .eq('id', payload.new.senderId)
              .single()
              .then(({ data: sender }) => {
                setMessages((prev) => {
                  const optimisticIdx = prev.findIndex(m => m._optimistic && m.body === payload.new.body && m.senderId === payload.new.senderId);
                  if (optimisticIdx >= 0) {
                    const updated = [...prev];
                    updated[optimisticIdx] = { ...payload.new, sender };
                    return updated;
                  }
                  if (prev.some(m => m.id === payload.new.id)) return prev;
                  return [...prev, { ...payload.new, sender }];
                });
                setTimeout(scrollToBottom, 50);
              });
            return current;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chat?.id]); // EXCLUDE fetchMessages because we want this to run strictly on chat change

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
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (err) {
      console.error("Failed to start voice recording:", err);
    }
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
      
      const supabase = supabaseRef.current;
      const filePath = `messages/${chat?.id}/${Date.now()}_voice.webm`;
      
      try {
        const { error } = await supabase.storage
          .from('chat-media')
          .upload(filePath, audioBlob, { contentType: 'audio/webm' });
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage.from('chat-media').getPublicUrl(filePath);
        await handleSendMessage({ voiceNoteUrl: publicUrl });
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
          ...attachments
        })
      });
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
    const supabase = supabaseRef.current;
    const fileExt = file.name.split('.').pop();
    const filePath = `messages/${chat.id}/${Date.now()}_${Math.random()}.${fileExt}`;

    try {
      const { error } = await supabase.storage
        .from('chat-media')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-media')
        .getPublicUrl(filePath);

      const attachments: any = {};
      if (file.type.startsWith('image/')) attachments.imageUrl = publicUrl;
      else if (file.type.startsWith('video/')) attachments.videoUrl = publicUrl;
      else attachments.documentUrl = publicUrl;

      await handleSendMessage(attachments);
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
          <div className={styles.userInfo}>
            <h2>{chat.name}</h2>
            <span className={styles.status}>{chat.isGroup ? 'Group' : (chat.online ? 'Online' : 'offline')}</span>
          </div>
        </div>
        <div className={styles.headerRight}>
          <button onClick={() => setIsSearching(!isSearching)} className={styles.iconBtn}><Search size={20} /></button>
          <button onClick={startCall} className={styles.iconBtn}><Phone size={20} /></button>
          <button className={styles.iconBtn}><Video size={20} /></button>
          <button className={styles.iconBtn}><MoreVertical size={20} /></button>
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

      {/* Messages */}
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
              styles.messageBubble, 
              msg.senderId === currentUser?.id ? styles.sent : styles.received
            )}>
              {chat.isGroup && msg.senderId !== currentUser?.id && (
                <span className="text-[10px] font-bold text-blue-400 block mb-1">
                   @{msg.sender?.username || 'user'}
                </span>
              )}
              {msg.imageUrl && (
                <img src={msg.imageUrl} alt="Attachment" className="max-w-full rounded-lg mb-2 cursor-pointer hover:opacity-90 transition-opacity shadow-sm" onClick={() => setLightboxImage(msg.imageUrl)} />
              )}
              {msg.videoUrl && (
                <video src={msg.videoUrl} controls className="max-w-full rounded-lg mb-2" />
              )}
              {msg.documentUrl && (
                <a href={msg.documentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-white/10 rounded-lg mb-2 hover:bg-white/20 transition-all text-[12px] font-medium">
                  <Paperclip size={14} />
                  <span className="truncate">View Document</span>
                </a>
              )}
              {msg.voiceNoteUrl && (
                <audio src={msg.voiceNoteUrl} controls className="max-w-full h-10 mb-2 filter drop-shadow-sm [&::-webkit-media-controls-enclosure]:bg-black/5 [&::-webkit-media-controls-enclosure]:rounded-full" />
              )}
              {msg.body && renderMessageBody(msg.body)}
              <span className={styles.timestamp}>
                {format(new Date(msg.createdAt), 'h:mm a')}
              </span>
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Recording UI */}
      {isRecording && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.recordingOverlay}
        >
          <div className={styles.recordingInfo}>
            <div className={styles.recordingDot} />
            <span className={styles.recordingTime}>Recording... {recordingTime}s</span>
          </div>
          <motion.div 
            className={styles.recordingProgress}
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 10, repeat: Infinity }}
          />
        </motion.div>
      )}

      {/* Input Area */}
      <div className={styles.inputArea}>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileUpload}
          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
        />
        <button 
          className={clsx(styles.iconBtn, isUploading && "animate-pulse")} 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Paperclip size={24} />
        </button>
        <div className={styles.inputWrapper}>
          <button className={styles.insideIconBtn}><Smile size={24} /></button>
          <textarea 
            ref={textareaRef}
            rows={1}
            placeholder="Write a message..." 
            className={styles.msgInput} 
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              autoResize();
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
              className={clsx(styles.iconBtn, styles.micBtn, isRecording && "text-red-500 animate-pulse bg-red-50")}
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
            >
              <Mic size={24} />
            </motion.button>
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
