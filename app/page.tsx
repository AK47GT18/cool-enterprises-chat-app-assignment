"use client";

import clsx from 'clsx';
import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./page.module.css";
import Sidebar from "@/components/Sidebar/Sidebar";
import ChatList from "@/components/ChatList/ChatList";
import ChatWindow from "@/components/ChatWindow/ChatWindow";
import RightPanel from "@/components/RightPanel/RightPanel";
import HollersTab from "@/components/Sidebar/HollersTab";
import ContactList from "@/components/Sidebar/ContactList";
import CallsTab from "@/components/Sidebar/CallsTab";
import GroupsTab from "@/components/Sidebar/GroupsTab";
import ProfileTab from "@/components/Sidebar/ProfileTab";
import CreateGroupModal from "@/components/Groups/CreateGroupModal";
import NewChatModal from "@/components/Modals/NewChatModal";
import { ChatStoreProvider, useChatStore } from "@/hooks/useChatStore";
import { useWebRTC } from "@/hooks/useWebRTC";
import IncomingCallModal from "@/components/Calls/CallModal";
import ActiveCallUI from "@/components/Calls/ActiveCallUI";

type MobileView = "list" | "chat" | "info";

export default function Home() {
  return (
    <ChatStoreProvider>
      <MainContent />
    </ChatStoreProvider>
  );
}

function MainContent() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [activeSidebarTab, setActiveSidebarTab] = useState("chats");
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [mobileView, setMobileView] = useState<MobileView>("list");
  // true = Chrome blocked autoplay, show "Unmute Audio" button in call UI
  const [audioBlocked, setAudioBlocked] = useState(false);

  const { refreshConversations, currentUser, conversations, loading } = useChatStore();

  // SAFETY NET: if done loading and no user, go to login
  useEffect(() => {
    if (!loading && !currentUser) {
      window.location.replace('/auth/login');
    }
  }, [loading, currentUser]);

  const {
    callState, incomingCall, error: callError,
    remoteStream, isMuted, callDuration,
    startCall, acceptCall, rejectCall, endCall, toggleMute,
  } = useWebRTC();

  const [activeCallInfo, setActiveCallInfo] = useState<{ name: string; avatar: string } | null>(null);

  useEffect(() => {
    if (callState !== 'idle') console.log('[Page] Call State:', callState);
  }, [callState]);

  useEffect(() => {
    if (incomingCall) {
      setActiveCallInfo({ name: incomingCall.callerName, avatar: incomingCall.callerAvatar });
    }
  }, [incomingCall]);

  useEffect(() => {
    if (selectedChat?.id) {
      const latest = conversations.find((c: any) => c.id === selectedChat.id);
      if (latest && JSON.stringify(latest) !== JSON.stringify(selectedChat)) {
        setSelectedChat(latest);
      }
    }
  }, [conversations, selectedChat?.id]);

  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const tryPlayAudio = useCallback(() => {
    const audioEl = remoteAudioRef.current;
    if (!audioEl) return;
    audioEl.play()
      .then(() => {
        console.log('[Audio] Playing successfully');
        setAudioBlocked(false);
      })
      .catch((err) => {
        // Chrome autoplay policy blocked it — show the "Unmute Audio" button
        console.warn('[Audio] Autoplay blocked:', err.message);
        setAudioBlocked(true);
      });
  }, []);

  // Attach stream to audio element as soon as it arrives
  useEffect(() => {
    const audioEl = remoteAudioRef.current;
    if (!audioEl || !remoteStream) return;
    console.log('[Audio] Attaching remote stream');
    audioEl.srcObject = remoteStream;
    tryPlayAudio();
  }, [remoteStream, tryPlayAudio]);

  // Retry play when call transitions to connected
  // (stream may have arrived before this state on the caller side)
  useEffect(() => {
    if (callState === 'connected') {
      const audioEl = remoteAudioRef.current;
      if (audioEl && audioEl.srcObject) {
        tryPlayAudio();
      }
    }
    if (callState === 'idle' || callState === 'ended') {
      setAudioBlocked(false);
    }
  }, [callState, tryPlayAudio]);

  // User clicks "Unmute Audio" button — this is a direct user gesture so play() will succeed
  const handleUnmuteAudio = () => {
    const audioEl = remoteAudioRef.current;
    if (!audioEl) return;
    if (remoteStream && audioEl.srcObject !== remoteStream) {
      audioEl.srcObject = remoteStream;
    }
    tryPlayAudio();
  };

  const handleStartCall = async (callType: 'audio' | 'video') => {
    if (!selectedChat || selectedChat.isGroup || !currentUser) return;
    try {
      const res = await fetch(`/api/conversations/${selectedChat.id}`);
      if (!res.ok) return;
      const chatData = await res.json();
      const recipient = chatData.members?.find((m: any) => m.userId !== currentUser.id);
      if (!recipient) return;
      setActiveCallInfo({ name: selectedChat.name, avatar: selectedChat.avatar });
      await startCall(recipient.userId, selectedChat.id, currentUser.username || 'User', currentUser.image || '', callType);
    } catch (err) {
      console.error("Error starting call:", err);
    }
  };

  useEffect(() => {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const t = isDark ? "dark" : "light";
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const handleSelectChat = (id: string, chat: any) => { setSelectedChat(chat); setMobileView("chat"); };
  const handleBackToList = () => setMobileView("list");
  const handleShowInfo = () => setMobileView("info");
  const handleBackFromInfo = () => setMobileView("chat");

  const handleStartChatWithUser = async (user: any) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      if (response.ok) {
        const chat = await response.json();
        await refreshConversations();
        setSelectedChat(chat);
        setIsNewChatModalOpen(false);
        setMobileView("chat");
      }
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };

  const handleDeleteCommunity = () => { setSelectedChat(null); setMobileView("list"); refreshConversations(); };
  const handleLeaveCommunity = () => { setSelectedChat(null); setMobileView("list"); refreshConversations(); };
  const handleClearChat = () => refreshConversations();
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  return (
    <>
      <div className={clsx(
        styles.appContainer,
        mobileView === 'chat' && styles.isChatOpen,
        mobileView === 'info' && styles.isInfoOpen
      )}>
        <div className={styles.floatingWrapper}>
          <Sidebar activeTab={activeSidebarTab} setActiveTab={setActiveSidebarTab} toggleTheme={toggleTheme} theme={theme} />
          {activeSidebarTab === 'chats' && (
            <ChatList activeChatId={selectedChat?.id || null} onSelectChat={handleSelectChat} onNewChat={() => setIsNewChatModalOpen(true)} isMobileListVisible={mobileView === "list"} />
          )}
          {activeSidebarTab === 'hollers' && <HollersTab />}
          {activeSidebarTab === 'status' && <ContactList activeChatId={selectedChat?.id} onSelectChat={handleSelectChat} />}
          {activeSidebarTab === 'calls' && <CallsTab />}
          {activeSidebarTab === 'groups' && <GroupsTab onOpenCreateModal={() => setIsCreateGroupOpen(true)} activeGroupId={selectedChat?.id} onSelectGroup={handleSelectChat} />}
          {activeSidebarTab === 'profile' && <ProfileTab />}
          <ChatWindow chat={selectedChat} onBack={handleBackToList} isMobileWindowVisible={mobileView === "chat"} onStartCall={handleStartCall} onShowInfo={handleShowInfo} />
          <CreateGroupModal isOpen={isCreateGroupOpen} onClose={() => setIsCreateGroupOpen(false)} />
          <NewChatModal isOpen={isNewChatModalOpen} onClose={() => setIsNewChatModalOpen(false)} onSelectUser={handleStartChatWithUser} />
          <div className={clsx(styles.rightPanelWrapper, mobileView === 'info' && styles.rightPanelMobileActive)}>
            <RightPanel
              chat={selectedChat}
              onClose={() => { setIsRightPanelOpen(false); if (mobileView === 'info') setMobileView('chat'); }}
              isVisible={(!!selectedChat && isRightPanelOpen) || mobileView === 'info'}
              onStartCall={handleStartCall}
              onBack={handleBackFromInfo}
              isMobile={mobileView === 'info'}
              onDeleteCommunity={handleDeleteCommunity}
              onLeaveCommunity={handleLeaveCommunity}
              onClearChat={handleClearChat}
            />
          </div>
        </div>
      </div>

      <IncomingCallModal incomingCall={incomingCall} onAccept={acceptCall} onReject={rejectCall} />

      <ActiveCallUI
        callState={callState}
        callerName={activeCallInfo?.name || incomingCall?.callerName || 'Unknown'}
        callerAvatar={activeCallInfo?.avatar || incomingCall?.callerAvatar || ''}
        callDuration={callDuration}
        isMuted={isMuted}
        error={callError}
        onEndCall={endCall}
        onToggleMute={toggleMute}
        audioBlocked={audioBlocked}
        onUnmuteAudio={handleUnmuteAudio}
      />

      {/* No autoPlay attr — .play() is called manually to handle Chrome's autoplay policy */}
      <audio ref={remoteAudioRef} playsInline style={{ display: 'none' }} />
    </>
  );
}