# 🛡️ RLS Guard Dog

A secure, full-stack classroom analytics app built with **Next.js**, **Supabase**, and **MongoDB**. It enforces **Row-Level Security (RLS)** to ensure that students, teachers, and admins only see the data they’re authorized to access.

## 🚀 Features

- 🔐 Supabase RLS policies for fine-grained access control
- 📊 Syncs classroom averages to MongoDB for analytics
- 👨‍🏫 Role-based dashboards for students, teachers, and headteachers
- 🧠 Secure API route `/api/sync_class_averages` protected by a secret token
- 🧼 Production-ready deployment with `.env.local` excluded from Git

## 🧰 Tech Stack

- **Frontend**: Next.js, React
- **Backend**: Supabase (PostgreSQL), MongoDB
- **Auth**: Supabase Auth
- **Deployment**: Vercel

## 🌐 Live Deployment

This app is deployed and live at:

**🔗 [https://rls-guard-dog-nine.vercel.app](https://rls-guard-dog-nine.vercel.app)**

Feel free to explore the dashboards and test the sync endpoint.

## 🔧 Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/geetanjaliwagh24/rls_guard_dog.git
   cd rls_guard_dog
