# 🌟 LifeOS — Your Personal Life Operating System

<div align="center">

![LifeOS Banner](https://img.shields.io/badge/LifeOS-Personal%20Productivity-blue?style=for-the-badge)
[![React](https://img.shields.io/badge/React-19.1.1-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.0-646CFF?style=flat&logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-Open%20Source-green?style=flat)](LICENSE)
[![AI Powered](https://img.shields.io/badge/Written%20by-Claude%20Opus%204-orange?style=flat)](https://www.anthropic.com/)

**Your all-in-one hub for a more organized, productive life.**

[Live Demo](https://yous2ef.github.io/LifeOS/) · [Report Bug](https://github.com/Yous2ef/LifeOS/issues) · [Request Feature](https://github.com/Yous2ef/LifeOS/issues)

</div>

---

## 📘 About

**LifeOS** is your **personal productivity system** — combining task management, dashboards, analytics, finance tracking, and goal management into one intuitive app.

**🔐 Privacy First:** Everything runs locally in your browser with optional Google Drive cloud backup — **your data stays yours.**

**✨ Highlights:**

-   🎓 University • 💼 Freelancing • 💻 Programming • 🏠 Personal Life • 💰 Finance
-   📊 Analytics Dashboard • 🔔 Smart Notifications • 🌓 Dark/Light Themes
-   ☁️ Google Drive Cloud Sync • 📱 Fully responsive interface
-   🔄 Auto-backup • 📤 Export/Import data

---

## ✨ Features

### 📦 Core Modules

| Module             | Capabilities                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| 🎓 **University**  | Subjects management, assignments, exams scheduling, grade tracking, academic years & terms, GPA calculation, study progress analytics |
| 💼 **Freelancing** | Client projects, applications tracking, platforms management, Kanban & list views, time tracking, earnings analytics                  |
| 💻 **Programming** | Projects management, learning items, skills tracking, tools inventory, task boards with time entries, GitHub integration              |
| 🏠 **Home**        | Daily tasks, habit tracking with streaks, personal goals, routines management                                                         |
| 💰 **Finance**     | Income & expense tracking, budget planning, installments management, savings goals, category-based analytics, multi-currency support  |
| 📚 **Misc**        | Notes, bookmarks, quick capture for ideas                                                                                             |
| 📊 **Dashboard**   | Activity insights, upcoming deadlines, notifications, daily motivational quotes, cross-module overview                                |

### 🔐 Authentication & Cloud Sync

| Feature               | Description                                             |
| --------------------- | ------------------------------------------------------- |
| 🔑 **Google Sign-In** | Secure authentication with Google OAuth 2.0             |
| ☁️ **Cloud Backup**   | Automatic sync to Google Drive (hidden app folder)      |
| 🔄 **Auto-Backup**    | Configurable automatic backups (daily/weekly/monthly)   |
| 📥 **Backup Restore** | Restore from any previous backup point                  |
| 👤 **Guest Mode**     | Full functionality without sign-in (local storage only) |
| 🔔 **Login Prompts**  | Smart reminders to enable cloud backup                  |

### 🎨 User Experience

| Feature                    | Description                                          |
| -------------------------- | ---------------------------------------------------- |
| 🌓 **Theme Toggle**        | Dark and light mode with system preference detection |
| 📱 **Responsive Design**   | Optimized for desktop, tablet, and mobile            |
| 🔔 **Smart Notifications** | Deadline reminders, exam alerts, payment due dates   |
| 🎯 **Kanban Boards**       | Drag-and-drop task management                        |
| 📊 **Charts & Analytics**  | Visual progress tracking with Recharts               |
| 🌍 **RTL Support**         | Arabic locale and right-to-left text support         |

---

## 🛠️ Tech Stack

### Core

-   **React 19** — Modern UI library with hooks
-   **TypeScript** — Type-safe development
-   **Vite 7** — Lightning-fast build tool

### UI & Styling

-   **Tailwind CSS** — Utility-first CSS framework
-   **Radix UI** — Accessible component primitives
-   **Lucide Icons** — Beautiful icon set
-   **next-themes** — Theme management

### State & Data

-   **React Context** — Global state management
-   **localStorage** — Offline-first data persistence
-   **Google Drive API** — Cloud backup storage

### Libraries

-   **React Router** — Client-side routing
-   **Recharts** — Data visualization
-   **@dnd-kit** — Drag and drop
-   **react-hot-toast & sonner** — Notifications
-   **date-fns** — Date manipulation

---

## ⚙️ Installation

```bash
# Clone repository
git clone https://github.com/Yous2ef/LifeOS.git
cd LifeOS

# Install dependencies
npm install

# Start development server
npm run dev
```

App will open at **[http://localhost:5173](http://localhost:5173)**

### Other Commands

```bash
npm run build      # Production build
npm run preview    # Preview build
npm run deploy     # Deploy to GitHub Pages
npm run lint       # Run ESLint
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file for Google OAuth (optional for cloud features):

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### Settings

| Setting              | Description                                       |
| -------------------- | ------------------------------------------------- |
| 🌓 **Themes**        | Toggle dark/light via navbar or system preference |
| 💾 **Storage**       | All data stored locally with optional cloud sync  |
| 🔔 **Notifications** | Manage preferences from Settings page             |
| ☁️ **Cloud Backup**  | Configure auto-backup frequency and retention     |
| 👤 **Profile**       | Customize your name and preferences               |

### Deployment

Update `package.json` homepage and `vite.config.ts` base path, then:

```bash
npm run deploy
```

---

## 📁 Project Structure

```
src/
├── components/           # UI + feature components
│   ├── auth/            # Authentication (Google login, user menu)
│   ├── common/          # Shared components (Kanban, cards)
│   ├── finance/         # Finance module components
│   ├── freelancing/     # Freelancing module components
│   ├── home/            # Home module components
│   ├── layout/          # Layout (Sidebar, MobileNav)
│   ├── misc/            # Miscellaneous components
│   ├── programming/     # Programming module components
│   ├── ui/              # Base UI components (Button, Card, etc.)
│   └── university/      # University module components
├── config/              # App configuration (Google OAuth)
├── context/             # Global state (App, Auth, Storage)
├── hooks/               # Custom hooks (useFinance, useProgramming, etc.)
├── lib/                 # Utility functions
├── pages/               # Route-based pages
├── services/            # Business logic
│   ├── DriveService.ts  # Google Drive API
│   ├── StorageService.ts # Data persistence
│   └── NotificationService.ts
├── types/               # TypeScript definitions
│   └── modules/         # Module-specific types
└── utils/               # Helpers and storage logic
    ├── storage.ts       # Unified storage API
    ├── storageV2.ts     # V2 storage implementation
    └── helpers.ts       # Utility functions
```

---

## 🚀 Usage

### Getting Started

1. Run `npm run dev` to start the development server
2. Use the sidebar to navigate between modules
3. Add tasks, projects, or entries with the "+" buttons
4. Organize with Kanban boards or list views
5. Track your progress on the Dashboard

### Cloud Backup (Optional)

1. Click "Sign in with Google" in the header
2. Grant permission for Drive access
3. Enable auto-backup in Settings
4. Your data syncs automatically to a hidden Drive folder

### Data Management

-   **Export:** Download your data as JSON from Settings
-   **Import:** Restore from a previous export
-   **Cloud Restore:** Restore from any cloud backup point

---

## 📱 Screenshots

### Dashboard

The central hub showing your daily overview, upcoming deadlines, and quick actions.

### University Module

Track subjects, assignments, exams, and calculate your GPA with beautiful analytics.

### Finance Module

Manage income, expenses, budgets, and savings goals with category-based tracking.

### Programming Module

Track your coding projects, learning items, skills, and tools with Kanban boards.

---

## 🗺️ Roadmap

-   [x] ✅ University module with academic tracking
-   [x] ✅ Freelancing project management
-   [x] ✅ Programming & learning tracker
-   [x] ✅ Finance module with budgets
-   [x] ✅ Google Drive cloud backup
-   [x] ✅ Auto-backup scheduling
-   [x] ✅ Guest mode with login prompts
-   [ ] 🔄 YouTube tools integration
-   [ ] 🏋️ Gym/Fitness tracking
-   [ ] 📖 Reading list management
-   [ ] 🤖 AI-powered insights
-   [ ] 📅 Calendar integration
-   [ ] 🔗 Third-party integrations

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m "Add AmazingFeature"`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

-   Follow TypeScript best practices
-   Use existing component patterns
-   Write meaningful commit messages
-   Test on both desktop and mobile

---

## 📝 License

Open source — free to use, modify, and distribute.

---

## 🙏 Acknowledgments

-   🤖 Written with assistance from **Claude Opus 4 (Anthropic)**
-   🎨 UI built with **Tailwind CSS** and **Radix UI**
-   💡 Inspired by **Notion-style productivity** & **GTD** principles
-   🔐 Authentication powered by **Google OAuth 2.0**

---

<div align="center">

⭐ **If you enjoy LifeOS, please give it a star on GitHub!**

Built with ❤️ by **Youssef**

[Live Demo](https://yous2ef.github.io/LifeOS/) · [GitHub](https://github.com/Yous2ef/LifeOS)

</div>
