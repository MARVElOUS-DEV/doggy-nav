# 🎨 Doggy Nav Frontend

The frontend application for Doggy Nav, built with Next.js 15 and modern React.

## 🛠 Tech Stack

- **Framework**: Next.js 15.5.3
- **Language**: TypeScript
- **UI Library**: Arco Design
- **Styling**: Tailwind CSS 4.0
- **State Management**: Jotai
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Charts**: Recharts
- **Internationalization**: i18next
- **HTTP Client**: Axios

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 20.17.0
- pnpm ≥ 8.0.0

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.local.example .env.local

# Start development server
pnpm dev
```

The application will be available at `http://localhost:3001`

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Affiche/        # Announcement component
│   ├── DoggyImage/     # Image handling component
│   ├── StatsChart/     # Statistics visualization
│   └── timeline/       # Timeline components
├── pages/              # Next.js pages
│   ├── api/           # API proxy routes
│   ├── auth/          # Authentication pages
│   ├── profile/       # User profile
│   └── ...
├── store/             # Jotai state management
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
└── styles/            # Global styles
```

## 🔧 Configuration

### Environment Variables

Create `.env.local`:

```bash
# Backend API URL
SERVER_URL=http://localhost:3002

# Build configuration
ANALYZE=false
NEXT_TELEMETRY_DISABLED=1
```

### Next.js Configuration

Key features in `next.config.ts`:

- **Standalone output** for Docker deployment
- **Internationalization** (English, Chinese)
- **Image optimization** with remote patterns
- **Proxy rewrites** for development API calls
- **Bundle analysis** support

## 🎨 Styling

### Tailwind CSS 4.0

Modern utility-first CSS framework with:

- Custom design tokens
- Responsive breakpoints
- Dark mode support (planned)
- Component-based utilities

### Arco Design

Enterprise-class UI library providing:

- Comprehensive component library
- Consistent design language
- Accessibility features
- Theme customization

## 🌐 Internationalization

Supports multiple languages:

- **English** (en)
- **Chinese** (zh) - Default

Configuration in `src/i18n/`:

```
i18n/
├── locales/
│   ├── en/
│   └── zh/
└── index.ts
```

## 📊 State Management

Uses Jotai for atomic state management:

```typescript
// store/store.ts
import { atom } from 'jotai';

export const navRankingAtom = atom(null);
export const userAtom = atom(null);
export const favoritesAtom = atom([]);
```

## 🔄 API Integration

### Proxy Routes

Development API calls are proxied through Next.js API routes:

```typescript
// pages/api/auth/login.ts
export default async function handler(req, res) {
  const response = await axios.post(`${SERVER_URL}/api/login`, req.body);
  return res.status(response.status).json(response.data);
}
```

### HTTP Client

Axios configuration in `utils/api.ts`:

- Request/response interceptors
- Error handling
- Authentication token management

## 📱 Features

### 🏠 Homepage

- Navigation item showcase
- Statistics charts
- Search functionality
- Category filtering

### 👤 User Authentication

- Login/Register forms
- JWT token management
- Protected routes
- User profile management

### ⭐ Favorites System

- Add/remove favorites
- Personal bookmark collection
- Quick access navigation

### 📊 Analytics Dashboard

- View count statistics
- Popular items ranking
- User contribution metrics
- Interactive charts with Recharts

### 🔍 Search & Filtering

- Full-text search
- Category filtering
- Real-time results
- Advanced search options

## 🏗 Build & Deployment

### Development Build

```bash
pnpm dev        # Start dev server
pnpm build      # Production build
pnpm start      # Start production server
pnpm lint       # Code linting
```

### Docker Deployment

Uses multi-stage Docker build for optimal performance and security.

### Vercel Deployment

Optimized for Vercel with automatic deployments and environment management.

## 🔧 Troubleshooting

### Common Issues

1. **Build Errors**
   - Check TypeScript configuration
   - Verify all dependencies are installed
   - Clear `.next` directory and rebuild

2. **API Connection Issues**
   - Verify `SERVER_URL` environment variable
   - Check backend server is running
   - Review proxy configuration

3. **Styling Issues**
   - Clear Tailwind CSS cache
   - Check component import paths
   - Verify Arco Design theme configuration

For more detailed information, see the [main project README](../../README.md).
