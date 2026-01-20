# RetroHub React Component Architecture

## Component Hierarchy Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Main Application                         │
│                           (App.jsx)                              │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 │
        ┌────────────────────────┴────────────────────────┐
        │                                                  │
        v                                                  v
┌───────────────────┐                          ┌─────────────────────┐
│  AuthProvider     │                          │  Admin Application  │
│  (Authentication) │                          │   (AdminApp.jsx)    │
└────────┬──────────┘                          └──────────┬──────────┘
         │                                                 │
         v                                                 │
┌───────────────────┐                                     │
│  GamesProvider    │                                     │
│  (Games Data)     │                                     │
└────────┬──────────┘                                     │
         │                                                 │
         v                                                 v
┌───────────────────┐                          ┌─────────────────────┐
│  ThemeProvider    │                          │   AuthProvider      │
│  (Theme/Settings) │                          │                     │
└────────┬──────────┘                          └──────────┬──────────┘
         │                                                 │
         │                                                 │
    ┌────┴────┐                                      ┌────┴────┐
    │         │                                      │         │
    v         v                                      v         v
┌────────┐ ┌──────────┐                   ┌──────────────┐ ┌──────────┐
│ Header │ │  Router  │                   │ AdminHeader  │ │  Router  │
└────────┘ └─────┬────┘                   └──────────────┘ └─────┬────┘
                 │                                                │
    ┌────────────┼────────────┐                     ┌────────────┼───────────┐
    │            │            │                     │            │           │
    v            v            v                     v            v           v
┌────────┐  ┌─────────┐  ┌──────────┐    ┌──────────────┐ ┌─────────┐ ┌────────┐
│  Home  │  │ Profile │  │ Settings │    │    Games     │ │  Create │ │  Edit  │
│  Page  │  │  Page   │  │   Page   │    │ Management   │ │  Game   │ │  Game  │
└────────┘  └─────────┘  └──────────┘    └──────────────┘ └─────────┘ └────────┘
    │
    v
┌──────────────┐
│  GameDetail  │
│     Page     │
└──────────────┘
```

## Context Providers Detail

```
┌──────────────────────────────────────────────────────────────┐
│                      AuthContext                              │
├──────────────────────────────────────────────────────────────┤
│  State:                                                       │
│  • user         - Current user object                         │
│  • token        - JWT authentication token                    │
│  • loading      - Auth loading state                          │
│                                                               │
│  Methods:                                                     │
│  • login()      - Authenticate user                           │
│  • register()   - Create new account                          │
│  • logout()     - Clear session                               │
│  • updateUserData() - Update user info                        │
│                                                               │
│  Computed:                                                    │
│  • isAuthenticated - Boolean auth status                      │
│  • isAdmin      - Admin role check                            │
│  • isMod        - Moderator role check                        │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                      GamesContext                             │
├──────────────────────────────────────────────────────────────┤
│  State:                                                       │
│  • games        - Array of all games                          │
│  • gamesById    - Map for quick ID lookup                     │
│  • gamesByDbId  - Map for database ID lookup                  │
│  • loading      - Games loading state                         │
│  • error        - Error state                                 │
│  • tipsCache    - Cached tips per game                        │
│  • faqCache     - Cached FAQs per game                        │
│  • postsCache   - Cached posts per game                       │
│                                                               │
│  Methods:                                                     │
│  • loadGames()      - Fetch all games                         │
│  • fetchGameFull()  - Get complete game data                  │
│  • getGameById()    - Lookup by slug/ID                       │
│  • getGameByDbId()  - Lookup by database ID                   │
│  • loadTips()       - Fetch game tips                         │
│  • loadFaqs()       - Fetch game FAQs                         │
│  • loadPosts()      - Fetch community posts                   │
│  • createPost()     - Create new post                         │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                      ThemeContext                             │
├──────────────────────────────────────────────────────────────┤
│  State:                                                       │
│  • currentTheme - Active theme object                         │
│  • settings     - User preferences                            │
│    - chat       - Keep chatbot open                           │
│    - badge      - Show achievement badges                     │
│    - analytics  - Anonymous analytics opt-in                  │
│                                                               │
│  Methods:                                                     │
│  • applyTheme()     - Apply dynamic theme                     │
│  • clearTheme()     - Reset to default                        │
│  • updateSettings() - Update preferences                      │
└──────────────────────────────────────────────────────────────┘
```

## Component Props Flow

```
Header Component
├── onAuthClick: () => void    - Opens auth modal

Home Component
├── (Uses GamesContext)
├── (Uses ThemeContext)
└── Renders: GameCard[] → Navigate to GameDetail

GameDetail Component
├── gameId: string             - From URL params
├── onChatOpen: () => void     - Opens chatbot
├── (Uses GamesContext)
├── (Uses ThemeContext)
└── (Uses AuthContext)

Profile Component
├── (Uses AuthContext)
├── (Uses GamesContext)
└── Requires: isAuthenticated

Settings Component
├── (Uses AuthContext)
├── (Uses ThemeContext)
└── Requires: isAuthenticated

Chatbot Component
├── currentGame: Game | null   - Current game context
└── (Controlled by App state)

AuthModal Component
├── isOpen: boolean
├── onClose: () => void
└── (Uses AuthContext)
```

## Page Routes

```
Main Application Routes:
/                   → Home (game grid)
/game/:gameId       → GameDetail (full game view)
/profile            → Profile (user dashboard)
/settings           → Settings (account management)
/about              → About (static page)
/admin              → Redirect to admin.html

Admin Application Routes:
/admin              → GamesManagement (games list)
/admin/games        → GamesManagement (same)
/admin/create       → GameForm (new game)
/admin/edit/:gameId → GameForm (edit mode)
```

## Data Flow Diagram

```
┌──────────┐
│ Browser  │
└────┬─────┘
     │
     │ HTTP Request
     ↓
┌─────────────────┐
│  React App      │
│  (Port 3000)    │
└────┬────────────┘
     │
     │ API Call via services/api.js
     ↓
┌─────────────────┐
│  Gateway Server │
│  (Port 5173)    │
└────┬────────────┘
     │
     │ Proxy Routes
     ├─→ /api/auth      → Auth Service (3001)
     ├─→ /api/users     → User Service (3002)
     ├─→ /api/games     → Game Service (3003)
     ├─→ /api/community → Community Service (3004)
     └─→ /api/chat      → AI Service (3005)
            │
            ↓
     ┌─────────────┐
     │  MongoDB    │
     │ (Port 27017)│
     └─────────────┘
```

## State Update Flow

```
User Action
    ↓
React Component
    ↓
Event Handler
    ↓
Context Method Call
    ↓
API Service Request
    ↓
Backend Response
    ↓
Context State Update
    ↓
React Re-render
    ↓
Updated UI
```

## Build Process Flow

```
Development:
npm run dev:frontend
    ↓
Vite Dev Server (Port 3000)
    ├─→ Hot Module Replacement
    ├─→ Fast Refresh
    └─→ API Proxy to Gateway

Production:
npm run build:frontend
    ↓
Vite Build Process
    ├─→ Bundle Optimization
    ├─→ Code Splitting
    ├─→ Asset Processing
    └─→ Output to dist/
           ↓
    Gateway Serves Static Files
```

## Component Responsibilities

### Layout Components
- **Header** - Navigation, auth state, mobile menu
- **Footer** - App info and credits

### Page Components
- **Home** - Game grid with filters and search
- **GameDetail** - Full game view with all sections
- **Profile** - User stats, collection, achievements
- **Settings** - Account and preference management
- **About** - Static informational page

### Feature Components
- **Chatbot** - AI assistant with context awareness
- **AuthModal** - Login/register with validation
- **GameCard** - Individual game tile (in Home)
- **ScreenshotViewer** - Modal image gallery

### Admin Components
- **AdminHeader** - Admin navigation
- **GamesManagement** - Games list with CRUD
- **GameForm** - Create/edit game with validation

### Service Layer
- **api.js** - Centralized API communication
  - Token management
  - Error handling
  - All HTTP requests

---

This architecture provides:
✅ Clear separation of concerns
✅ Unidirectional data flow
✅ Centralized state management
✅ Reusable components
✅ Easy testing and debugging
✅ Scalable structure for future features
