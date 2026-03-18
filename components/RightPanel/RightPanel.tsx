import React from 'react';
import styles from './RightPanel.module.css';
import { ChevronRight, FileText, Image as ImageIcon, Video, FolderArchive, X } from 'lucide-react';
import clsx from 'clsx';

interface RightPanelProps {
  chat: { id: string; name: string; avatar: string } | null;
  onClose: () => void;
  isVisible: boolean;
}

export default function RightPanel({ chat, onClose, isVisible }: RightPanelProps) {
  const [activeView, setActiveView] = React.useState<'files' | 'profile'>('files');

  if (!chat || !isVisible) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.headerTabs}>
            <button 
              className={clsx(styles.tabBtn, activeView === 'files' && styles.activeTab)}
              onClick={() => setActiveView('files')}
            >
              Shared files
            </button>
            <button 
              className={clsx(styles.tabBtn, activeView === 'profile' && styles.activeTab)}
              onClick={() => setActiveView('profile')}
            >
              Profile
            </button>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close Info">
            <X size={20} />
          </button>
        </div>
      </div>

      {activeView === 'files' ? (
        <div className={styles.viewContent}>
          <div className={styles.statsRow}>
            <div className={clsx(styles.statCard, styles.filesCard)}>
              <FolderArchive size={20} className={styles.statIcon} />
              <div>
                <span className={styles.statLabel}>All files</span>
                <span className={styles.statValue}>231</span>
              </div>
            </div>
            <div className={clsx(styles.statCard, styles.linksCard)}>
              <FileText size={20} className={styles.statIcon} />
              <div>
                <span className={styles.statLabel}>All links</span>
                <span className={styles.statValue}>45</span>
              </div>
            </div>
          </div>

          <div className={styles.mediaGridSection}>
            <div className={styles.sectionHeader}>
              <h3>Photos & Videos</h3>
              <button className={styles.viewAllBtn}>View all</button>
            </div>
            <div className={styles.mediaGrid}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className={styles.mediaItem}>
                  <img src={`https://picsum.photos/seed/${chat.id + i}/200`} alt="Media" />
                </div>
              ))}
            </div>
          </div>

          <div className={styles.fileTypesSection}>
            <div className={styles.sectionHeader}>
              <h3>Documents</h3>
            </div>
            <div className={styles.fileList}>
              <FileItem icon={<FileText size={20} />} title="Company Proposal.pdf" sub="1.4 MB • Oct 12" color="#6366f1" bg="#eef2ff" />
              <FileItem icon={<FileText size={20} />} title="Budget-2024.xlsx" sub="2.1 MB • Oct 10" color="#10b981" bg="#ecfdf5" />
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.viewContent}>
          <div className={styles.profileSection}>
            <img src={chat.avatar} alt={chat.name} className={styles.avatarLarge} />
            <h2 className={styles.profileName}>{chat.name}</h2>
            <p className={styles.profileBio}>Product Designer at Cool Enterprises. Passionate about creating seamless user experiences.</p>
            
            <div className={styles.profileActions}>
              <button className={styles.actionBtn}>Message</button>
              <button className={clsx(styles.actionBtn, styles.secondary)}>Call</button>
            </div>
          </div>

          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Username</span>
              <span className={styles.infoValue}>@{(chat.name || '').toLowerCase().replace(' ', '_')}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Email</span>
              <span className={styles.infoValue}>{(chat.name || '').toLowerCase().replace(' ', '.')}@example.com</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FileItem({ icon, title, sub, color, bg }: { icon: React.ReactNode, title: string, sub: string, color: string, bg: string }) {
  return (
    <div className={styles.fileItem}>
      <div className={styles.fileIconWrapper} style={{ color, backgroundColor: bg }}>
        {icon}
      </div>
      <div className={styles.fileInfo}>
        <span className={styles.fileTitle}>{title}</span>
        <span className={styles.fileSub}>{sub}</span>
      </div>
      <ChevronRight size={16} className={styles.chevron} />
    </div>
  );
}

function MoreVerticalIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
}
