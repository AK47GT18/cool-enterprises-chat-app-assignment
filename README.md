# The Circle Chat App 💬

A premium, real-time chat application built with Next.js, featuring WebRTC voice/video calling, PWA support, and enterprise-grade session management.

🔗 **Live Demo**: [cool-enterprises-chat-app-assignmen.vercel.app](https://cool-enterprises-chat-app-assignmen.vercel.app/auth/login)

---

## ✨ Features

### 🔐 Authentication & Security
- **JWT-Based Auth** — Secure login/signup with httpOnly cookies, bcrypt password hashing, and server-side session validation.
- **Single-Session Enforcement** — Only one active session per user. Logging in on a new device automatically invalidates the previous session. The old device is redirected to the login page via a global fetch interceptor that clears the session cookie.
- **Detailed Validation** — Real-time input validation with email format checking (RFC 5322), username rules (3-20 chars, letters/numbers/underscores), and password strength scoring (Weak → Strong).
- **Password Reset** — Email-based password recovery with secure, time-limited tokens and rate limiting.
- **Email Verification** — Optional email verification flow with token-based confirmation.

### 💬 Real-Time Messaging
- **Instant Messages** — Real-time message delivery using Server-Sent Events (SSE). Messages appear instantly for all participants.
- **Rich Media** — Send images, videos, documents, and voice notes via Supabase Storage.
- **Message Replies** — Reply to specific messages with threaded context.
- **Reactions** — React to messages with emojis.
- **Message Search** — Full-text search across conversations.
- **Typing Indicators** — See when someone is typing in real-time.
- **Read Receipts** — "Seen" status tracking for messages.

### 📞 Voice & Video Calls (WebRTC)
> ⚠️ **Note:** Calling features are currently in an experimental state. Voice calls are partially working (audio may only play one-sided in some environments), and video calling is still under development.

- **Peer-to-Peer Calling** — Audio/video calls using WebRTC with STUN/TURN server support.
- **Incoming Call UI** — Premium modal with caller info, accept/reject buttons.
- **Active Call UI** — Full-screen call interface with mute toggle, call duration timer, and end call button.
- **Mobile NAT Traversal** — TURN server fallback for reliable connections across mobile networks and firewalls.
- **Chrome Autoplay Handling** — Graceful fallback for browsers that block audio autoplay, with an "Unmute Audio" button.
- **Signaling Retry** — Automatic retry mechanism for call signaling to handle transient network failures.

### 👥 Groups & Communities
- **Create Groups** — Create group chats with name, description, and custom image.
- **Public & Private Groups** — Public groups are discoverable and joinable by anyone. Private groups require an invite code.
- **Invite Codes** — Unique invite codes for private group joining.
- **Role-Based Access** — Member, Admin, and Super Admin roles with different permissions.
- **Group Management** — Admins can update group info, manage members, and delete communities.

### 🤝 Contacts & Hollers
- **Contact Requests ("Hollers")** — Send friend requests to other users. Accept or reject incoming requests.
- **User Search** — Find users by username or privacy code.
- **Privacy Controls** — Toggle profile visibility between public and private. Private users can only be found via their unique privacy code.
- **User Blocking** — Block users to prevent messaging and contact requests.

### 👤 User Profiles
- **Customizable Profiles** — Upload profile pictures, set a bio, and change your username.
- **Online Presence** — Real-time online/offline status with heartbeat pings every 20 seconds.
- **Last Seen** — Timestamps showing when a user was last active.

### 📱 Progressive Web App (PWA)
- **Installable** — Install the app on your phone or desktop from the browser. A premium glassmorphic install prompt appears automatically.
- **Push Notifications** — Browser push notification support via Service Worker.
- **Offline Icon** — Custom circular app icon for home screen.

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────┐
│                   Client (Next.js)              │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Auth     │  │ Chat     │  │ WebRTC       │  │
│  │ Pages    │  │ Store    │  │ Hook         │  │
│  └────┬─────┘  └────┬─────┘  └──────┬───────┘  │
│       │              │               │          │
│  ┌────┴──────────────┴───────────────┴───────┐  │
│  │         Global Auth Interceptor           │  │
│  │    (Catches all 401s → logout → login)    │  │
│  └───────────────────┬───────────────────────┘  │
└──────────────────────┼──────────────────────────┘
                       │ HTTPS
┌──────────────────────┼──────────────────────────┐
│                Middleware (Edge)                 │
│         JWT verification → route guard          │
└──────────────────────┼──────────────────────────┘
                       │
┌──────────────────────┼──────────────────────────┐
│              API Routes (Node.js)               │
│  ┌────────────┐  ┌────────────┐  ┌───────────┐ │
│  │ Session    │  │ Prisma ORM │  │ Supabase  │ │
│  │ Service    │  │            │  │ Storage   │ │
│  └────┬───────┘  └─────┬──────┘  └─────┬─────┘ │
└───────┼────────────────┼────────────────┼───────┘
        │                │                │
   Single-Session   PostgreSQL       File Storage
   Enforcement       (Neon DB)       (Images/Docs)
```

### Key Modules

| Module | Path | Purpose |
|--------|------|---------|
| **Auth Interceptor** | `lib/auth-interceptor.ts` | Patches `window.fetch` globally to catch 401s, call logout API, and redirect to login |
| **Session Service** | `services/session.service.ts` | Server-side session validation with single-session enforcement |
| **Middleware** | `middleware.ts` | Edge-runtime JWT verification and route protection |
| **Chat Store** | `hooks/useChatStore.tsx` | Global state for conversations, presence, notifications |
| **WebRTC Hook** | `hooks/useWebRTC.ts` | Manages peer connections, call state, ICE candidates |
| **VoIP Service** | `services/voip.service.ts` | Call signaling with retry mechanism |
| **Realtime Service** | `services/local-realtime.service.ts` | SSE-based real-time event system |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Database** | PostgreSQL via [Neon](https://neon.tech/) |
| **ORM** | Prisma |
| **Auth** | Custom JWT (`jose` + `bcryptjs`) |
| **File Storage** | Supabase Storage |
| **Real-time** | Server-Sent Events (SSE) |
| **Calling** | WebRTC (STUN/TURN) |
| **Styling** | Vanilla CSS + CSS Modules |
| **Animations** | Framer Motion |
| **State** | React Context + Zustand patterns |
| **Deployment** | Vercel |

---

## 🏁 Getting Started

### Prerequisites
- Node.js 20+
- A [Neon](https://neon.tech/) PostgreSQL database
- A [Supabase](https://supabase.com/) project (for file storage)
- Gmail SMTP credentials (for password reset emails)

### Installation
```bash
git clone https://github.com/your-repo/Cool-Enterprises-Chat-App-Assignment.git
cd Cool-Enterprises-Chat-App-Assignment
npm install
```

### Environment Setup
Create a `.env` file using `.env.example` as a template:
```env
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
DIRECT_URL="postgresql://user:password@host/db?sslmode=require"
JWT_SECRET="your-secret-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-key"
SMTP_PASSWORD="your-gmail-app-password"
NEXT_PUBLIC_MESSAGE_ENCRYPTION_KEY="your-encryption-key"
```

### Database Setup
```bash
npx prisma generate
npx prisma db push
```

### Run Locally
```bash
npm run dev
```

For **HTTPS** (required for WebRTC on mobile):
```bash
npm run dev:expose
```

---

## 📦 Deployment (Vercel)

1. Connect your GitHub repository to Vercel.
2. Add all environment variables from `.env.example` to Vercel's dashboard.
3. In Supabase Storage, create a public bucket named `chat-media`.
4. Deploy — Vercel auto-builds on push to `main`.

---

## 📂 Project Structure

```
├── app/
│   ├── auth/              # Login, Register, Forgot/Reset Password pages
│   ├── api/
│   │   ├── auth/          # Login, Logout, Session validation, Email verification
│   │   ├── conversations/ # CRUD for chats
│   │   ├── messages/      # Send, edit, delete, search messages
│   │   ├── groups/        # Group creation, join, public listing
│   │   ├── contact-requests/ # Holler (friend request) management
│   │   ├── calls/         # WebRTC signaling
│   │   ├── realtime/      # SSE events, presence, typing indicators
│   │   ├── upload/        # File upload to Supabase
│   │   └── users/         # User search, block, profile
│   ├── settings/          # User profile settings
│   └── page.tsx           # Main chat interface
├── components/
│   ├── Calls/             # CallModal, ActiveCallUI
│   ├── ChatList/          # Conversation list sidebar
│   ├── ChatWindow/        # Message thread view
│   ├── Groups/            # CreateGroupModal
│   ├── Modals/            # NewChatModal
│   ├── PWA/               # InstallToast
│   ├── RightPanel/        # Chat info/settings panel
│   └── Sidebar/           # Navigation tabs (Chats, Hollers, Calls, Groups, Profile)
├── hooks/
│   ├── useChatStore.tsx   # Global chat state provider
│   └── useWebRTC.ts       # WebRTC call management
├── lib/
│   ├── auth-interceptor.ts # Global 401 fetch interceptor
│   ├── jwt.ts             # JWT sign/verify helpers
│   ├── prisma.ts          # Prisma client singleton
│   └── validation.ts      # Input validation with regex + strength scoring
├── services/
│   ├── session.service.ts      # Server-side auth with single-session check
│   ├── voip.service.ts         # Call signaling with retry
│   └── local-realtime.service.ts # SSE real-time event bus
├── prisma/
│   └── schema.prisma      # Database schema
└── middleware.ts           # Edge JWT verification + route protection
```

---

## 🔒 Single-Session Login Flow

```
User A logs in on Device 1
  → JWT created with sessionId = "abc123"
  → sessionId stored in DB user.sessionToken

User A logs in on Device 2
  → JWT created with sessionId = "xyz789"
  → DB updated: user.sessionToken = "xyz789"

Device 1 makes any API call
  → SessionService checks: JWT.sessionId ("abc123") ≠ DB.sessionToken ("xyz789")
  → Returns 401

Global Auth Interceptor catches 401
  → Calls /api/auth/logout (clears httpOnly cookie)
  → Redirects to /auth/login
```

---

## 📜 License
MIT
