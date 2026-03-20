# Cool Enterprises Chat App

A premium, real-time chat application with glassmorphic UI, WebRTC calling, and multi-cloud infrastructure.

## 🚀 Features

- **Real-time Messaging**: Instant communication using Socket.io (currently local, Cloud broker migration planned).
- **WebRTC Video/Audio Calls**: High-quality peer-to-peer calling with ringing states and mobile support.
- **Secure Authentication**: JWT-based auth with email verification, password reset, and inline regex validation.
- **Premium UI**: Modern glassmorphic design system using React 19, Next.js 16, and Framer Motion.
- **Global Search**: Find users by username or private code.
- **Privacy Controls**: Profile visibility toggles and user blocking.
- **Media Uploads**: Secure image/file sharing powered by Supabase Storage.

## 🛠 Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Database**: [PostgreSQL via Neon](https://neon.tech/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Auth**: Custom JWT session management with `bcryptjs`.
- **Storage**: [Supabase Storage](https://supabase.com/storage)
- **Styling**: Vanilla CSS + Tailwind CSS (v4).
- **Real-time**: Socket.io.

## 🏁 Getting Started

### 1. Prerequisites
- Node.js 20+
- A Neon PostgreSQL database.
- A Supabase project (for Storage).
- Gmail SMTP (for password reset emails).

### 2. Installation
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory (use `.env.example` as a template).

### 4. Database Setup
```bash
npx prisma generate
npx prisma db push
```

### 5. Running Localy
```bash
npm run dev
```

For **HTTPS** (required for mobile camera/mic testing):
```bash
npm run dev:expose
```

## 📦 Deployment (Vercel)

1. Connect your GitHub repository to Vercel.
2. Add all environment variables from `.env.example`.
3. In Supabase Storage, create a public bucket named `chat-media`.
4. Deploy!

## 📜 License
MIT
