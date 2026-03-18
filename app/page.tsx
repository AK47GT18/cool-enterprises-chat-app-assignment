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
import CreateGroupModal from "@/components/Groups/CreateGroupModal";

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
    setMobileView("chat"); // On mobile, navigating opens the chat window
  };

  const handleBackToList = () => {
    setMobileView("list");
  };

  // Only open right panel on desktop or explicit info request on mobile
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  return (
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
          <div className="flex-1 bg-white border-r min-w-[320px] p-6">
             <h2 className="text-2xl font-bold mb-4">Groups</h2>
             <button 
                onClick={() => setIsCreateGroupOpen(true)}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition"
             >
                Create New Group
             </button>
          </div>
        )}
        
        <ChatWindow 
          chat={selectedChat} 
          onBack={handleBackToList}
          isMobileWindowVisible={mobileView === "chat"}
        />

        <CreateGroupModal 
          isOpen={isCreateGroupOpen} 
          onClose={() => setIsCreateGroupOpen(false)} 
        />
        
        {/* Right panel logic: show on desktop if selectedChat exists, hide on mobile unless explicitly toggled (future dev) */}
        <div className={styles.rightPanelWrapper}>
          <RightPanel 
            chat={selectedChat} 
            onClose={() => setIsRightPanelOpen(false)} 
            isVisible={!!selectedChat && isRightPanelOpen} 
          />
        </div>
      </div>
    </div>
  );
}
