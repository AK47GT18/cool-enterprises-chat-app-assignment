"use client";

import React, { useState, useEffect } from "react";
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
import { ChatStoreProvider } from "@/hooks/useChatStore";

type MobileView = "list" | "chat" | "info";

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [activeSidebarTab, setActiveSidebarTab] = useState("chats");
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  
  // Chat state
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  
  // Mobile responsive view state
  const [mobileView, setMobileView] = useState<MobileView>("list");

  // Handle system theme detection on mount
  useEffect(() => {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (isDark) {
      setTheme("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const handleSelectChat = (id: string, chat: any) => {
    setSelectedChat(chat);
    setMobileView("chat");
  };

  const handleBackToList = () => {
    setMobileView("list");
  };

  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  return (
    <ChatStoreProvider>
      <div className={styles.appContainer}>
        <div className={styles.floatingWrapper}>
          <Sidebar 
            activeTab={activeSidebarTab} 
            setActiveTab={setActiveSidebarTab} 
            toggleTheme={toggleTheme} 
          />

          {activeSidebarTab === 'chats' && (
            <ChatList 
              activeChatId={selectedChat?.id || null} 
              onSelectChat={handleSelectChat}
              isMobileListVisible={mobileView === "list"}
            />
          )}

          {activeSidebarTab === 'hollers' && <HollersTab />}
          {activeSidebarTab === 'status' && <ContactList />}
          {activeSidebarTab === 'calls' && <CallsTab />}
          {activeSidebarTab === 'groups' && (
            <GroupsTab 
              onOpenCreateModal={() => setIsCreateGroupOpen(true)} 
              activeGroupId={selectedChat?.id}
              onSelectGroup={handleSelectChat}
            />
          )}
          {activeSidebarTab === 'profile' && <ProfileTab />}
          
          <ChatWindow 
            chat={selectedChat} 
            onBack={handleBackToList}
            isMobileWindowVisible={mobileView === "chat"}
          />

          <CreateGroupModal 
            isOpen={isCreateGroupOpen} 
            onClose={() => setIsCreateGroupOpen(false)} 
          />
          
          <div className={styles.rightPanelWrapper}>
            <RightPanel 
              chat={selectedChat} 
              onClose={() => setIsRightPanelOpen(false)} 
              isVisible={!!selectedChat && isRightPanelOpen} 
            />
          </div>
        </div>
      </div>
    </ChatStoreProvider>
  );
}
