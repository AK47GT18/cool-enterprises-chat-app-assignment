import React, { useRef, useCallback } from 'react';
import styles from './ChatWindow.module.css';
import { ArrowLeft, Phone, Video, MoreVertical, Paperclip, Smile, Send, Mic } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

import { useWebRTC } from '@/hooks/useWebRTC';
import CallModal from '@/components/Calls/CallModal';

interface ChatWindowProps {
  chat: { id: string; name: string; avatar: string; imageUrl?: string; online?: boolean; isGroup?: boolean } | null;
  onBack: () => void;
  isMobileWindowVisible: boolean;
}

import { createClient } from '@/utils/supabase/client';

export default function ChatWindow({ chat, onBack, isMobileWindowVisible }: ChatWindowProps) {
  const { isCalling, isIncoming, startCall, acceptCall, hangup, remoteStream } = useWebRTC(chat?.id || null);
  const [message, setMessage] = React.useState('');
  const [messages, setMessages] = React.useState<any[]>([]);
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [isRecording, setIsRecording] = React.useState(false);
  const [recordingTime, setRecordingTime] = React.useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, []);

  React.useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Fetch current user
  React.useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });
  }, []);

  // Real-time listener
  React.useEffect(() => {
    if (!chat) return;
    const supabase = createClient();

    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/conversations?id=${chat.id}`);
        if (!response.ok) return;
        const data = await response.json();
        if (data.messages) {
          setMessages(data.messages.reverse());
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat:${chat.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'Message', filter: `conversationId=eq.${chat.id}` },
        async (payload) => {
          // Fetch sender info for the new message
          const { data: sender } = await supabase
            .from('User')
            .select('username, image')
            .eq('id', payload.new.senderId)
            .single();
          
          const newMessage = { ...payload.new, sender };
          setMessages((current) => [...current, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chat?.id]);

  const handleSendMessage = async () => {
    if (!chat || !message.trim()) return;
    const body = message;
    setMessage('');
    
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body,
          conversationId: chat.id
        })
      });
    } catch (error) {
      console.error("Failed to send message:", error);
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
          <button onClick={startCall} className={styles.iconBtn}><Phone size={20} /></button>
          <button className={styles.iconBtn}><Video size={20} /></button>
          <button className={styles.iconBtn}><MoreVertical size={20} /></button>
        </div>
      </div>

      {/* Messages */}
      <div className={styles.messagesArea}>
        <div className={styles.dateLabel}>Today</div>

        {messages.map((msg, index) => (
          <motion.div
             key={msg.id || index}
             layout
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
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
                <img src={msg.imageUrl} alt="Attachment" className="max-w-full rounded-lg mb-2 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(msg.imageUrl, '_blank')} />
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
              {msg.body && <p>{msg.body}</p>}
              <span className={styles.timestamp}>
                {format(new Date(msg.createdAt), 'h:mm a')}
              </span>
            </div>
          </motion.div>
        ))}
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
        <button className={styles.iconBtn}><Paperclip size={24} /></button>
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
                // Reset height after sending
                if (textareaRef.current) {
                  textareaRef.current.style.height = 'auto';
                }
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
              onClick={handleSendMessage}
            >
              <Send size={24} />
            </motion.button>
          ) : (
            <motion.button
              key="mic"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className={clsx(styles.iconBtn, styles.micBtn)}
              onMouseDown={() => {
                setIsRecording(true);
                setRecordingTime(0);
              }}
              onMouseUp={() => setIsRecording(false)}
            >
              <Mic size={24} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

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
