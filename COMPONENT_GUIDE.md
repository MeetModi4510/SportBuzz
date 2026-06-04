# SportBuzz - Component Integration Guide

## 📦 Available Components

### Core Components

#### 1. ProtectedRoute
**Location**: `src/components/ProtectedRoute.tsx`

**Purpose**: Protect routes from unauthorized access

**Usage**:
```tsx
import { ProtectedRoute } from "@/components/ProtectedRoute";

<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

**Props**: 
- `children: React.ReactNode` - Component to protect

---

#### 2. AdvancedSearch
**Location**: `src/components/AdvancedSearch.tsx`

**Purpose**: Multi-filter search interface

**Usage**:
```tsx
import { AdvancedSearch, SearchFilters } from "@/components/AdvancedSearch";

const [showSearch, setShowSearch] = useState(false);

const handleSearch = (filters: SearchFilters) => {
  console.log('Search:', filters);
  // Apply filters to data
};

{showSearch && (
  <AdvancedSearch 
    onSearch={handleSearch} 
    onClose={() => setShowSearch(false)}
  />
)}
```

**Props**:
- `onSearch: (filters: SearchFilters) => void` - Callback with filter data
- `onClose?: () => void` - Close handler

**SearchFilters Interface**:
```typescript
{
  query: string;
  sport: string;
  status: string;
  venue: string;
  dateFrom: string;
  dateTo: string;
  team: string;
}
```

---

#### 3. Pagination
**Location**: `src/components/Pagination.tsx`

**Purpose**: Page navigation control

**Usage**:
```tsx
import { Pagination } from "@/components/Pagination";

const [currentPage, setCurrentPage] = useState(1);
const totalPages = 10;

<Pagination 
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={setCurrentPage}
  itemsPerPage={10}
  totalItems={100}
/>
```

**Props**:
- `currentPage: number` - Current page number
- `totalPages: number` - Total number of pages
- `onPageChange: (page: number) => void` - Page change handler
- `itemsPerPage?: number` - Items per page
- `totalItems?: number` - Total items count

---

#### 4. DataVisualization
**Location**: `src/components/DataVisualization.tsx`

**Purpose**: Display charts and graphs

**Usage - Line Chart**:
```tsx
import { DataVisualization } from "@/components/DataVisualization";

const data = [
  { name: 'Jan', sales: 400, revenue: 2400 },
  { name: 'Feb', sales: 300, revenue: 1398 },
  { name: 'Mar', sales: 200, revenue: 9800 },
];

<DataVisualization 
  title="Sales Performance"
  data={data}
  type="line"
  dataKeys={[
    { key: 'sales', color: '#3b82f6', name: 'Sales' },
    { key: 'revenue', color: '#ef4444', name: 'Revenue' }
  ]}
  height={400}
/>
```

**Usage - Bar Chart**:
```tsx
<DataVisualization 
  title="Team Statistics"
  data={teamData}
  type="bar"
  dataKeys={[
    { key: 'wins', color: '#10b981', name: 'Wins' },
    { key: 'losses', color: '#f59e0b', name: 'Losses' }
  ]}
/>
```

**Props**:
- `title: string` - Chart title
- `data: ChartData[]` - Data to display
- `type: "line" | "bar"` - Chart type
- `dataKeys: { key, color, name }[]` - Data series
- `height?: number` - Chart height (default: 300)

---

#### 5. Navbar
**Location**: `src/components/Navbar.tsx`

**Purpose**: Main navigation bar

**Features**:
- User authentication display
- Dropdown menu with links
- Mobile responsive menu
- Sport quick filters
- Search functionality
- Notifications

**Key Links in Menu**:
- Profile
- Favorites
- Leaderboard
- Fantasy Cricket
- Preferences
- Logout

---

## 🔌 UI Library Components

All components from Shadcn/ui are available:

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu";
// ... and more
```

---

## 📄 Page Components

### 1. Index (Dashboard)
**Location**: `src/pages/Index.tsx`
**Features**: 
- Match listings
- Sport filtering
- Status filtering
- Live matches section

### 2. Profile
**Location**: `src/pages/Profile.tsx`
**Features**:
- View user info
- Edit profile
- Save changes

### 3. Preferences
**Location**: `src/pages/Preferences.tsx`
**Features**:
- Dark mode toggle
- Notification settings
- Content preferences

### 4. Favorites
**Location**: `src/pages/Favorites.tsx`
**Features**:
- View saved matches
- Search favorites
- Remove from favorites
- Share matches

### 5. Leaderboard
**Location**: `src/pages/Leaderboard.tsx`
**Features**:
- User rankings
- Points display
- Accuracy stats
- Top 10 table

### 6. FantasyCricket
**Location**: `src/pages/FantasyCricket.tsx`
**Features**:
- Create teams
- Team management
- Points tracking

### 7. AdminDashboard
**Location**: `src/pages/AdminDashboard.tsx`
**Features**:
- User management
- Content moderation
- Match management
- System settings

---

## 🎨 Styling Guidelines

### Color Palette
```typescript
// Primary Colors
Red: #ef4444, #dc2626, #b91c1c
Blue: #3b82f6, #1d4ed8
Green: #10b981, #059669
Purple: #a855f7, #9333ea
Yellow: #eab308, #ca8a04

// Dark Theme
Background: #0f172a, #1e293b, #334155
Text: #ffffff, #e2e8f0, #cbd5e1
```

### Responsive Classes
```typescript
// Breakpoints
hidden md:flex      // Hidden on mobile, visible on tablet+
hidden lg:flex      // Hidden on mobile/tablet, visible on desktop
grid-cols-1 md:grid-cols-2 lg:grid-cols-3
```

---

## 🔄 Data Flow Examples

### Adding to Favorites

```tsx
const addToFavorites = (match: Match) => {
  const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
  
  // Check if already favorited
  if (!favorites.find(f => f.id === match.id)) {
    favorites.push(match);
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }
};
```

### Creating Fantasy Team

```tsx
const createFantasyTeam = (teamName: string) => {
  const teams = JSON.parse(localStorage.getItem("fantasyTeams") || "[]");
  
  const newTeam = {
    id: Date.now().toString(),
    name: teamName,
    players: [],
    points: 0,
    createdDate: new Date().toISOString(),
  };
  
  teams.push(newTeam);
  localStorage.setItem("fantasyTeams", JSON.stringify(teams));
};
```

### User Authentication

```tsx
const login = (email: string, password: string) => {
  const user = { email, loginTime: new Date().toISOString() };
  localStorage.setItem("user", JSON.stringify(user));
  navigate("/");
};

const logout = () => {
  localStorage.removeItem("user");
  navigate("/login");
};

const isAuthenticated = () => {
  return !!localStorage.getItem("user");
};
```

---

## 🧪 Testing Components

### Test Protected Route
```tsx
// Should redirect to login
<ProtectedRoute>
  <TestComponent />
</ProtectedRoute>
```

### Test Advanced Search
```tsx
const mockFilters = {
  query: "India",
  sport: "cricket",
  status: "upcoming",
  venue: "",
  dateFrom: "2026-01-23",
  dateTo: "2026-02-23",
  team: "",
};

<AdvancedSearch onSearch={mockFilters} />
```

### Test Pagination
```tsx
<Pagination 
  currentPage={1}
  totalPages={5}
  onPageChange={(page) => console.log(page)}
  itemsPerPage={10}
  totalItems={50}
/>
```

---

## 📚 Import Examples

```tsx
// Pages
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Preferences from "./pages/Preferences";
import Favorites from "./pages/Favorites";
import Leaderboard from "./pages/Leaderboard";
import FantasyCricket from "./pages/FantasyCricket";
import AdminDashboard from "./pages/AdminDashboard";

// Components
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdvancedSearch } from "@/components/AdvancedSearch";
import { Pagination } from "@/components/Pagination";
import { DataVisualization } from "@/components/DataVisualization";
import { Navbar } from "@/components/Navbar";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// Icons
import { Heart, Share2, Trophy, Users, Settings } from "lucide-react";
```

---

## 🎯 Best Practices

1. **Always wrap protected pages with ProtectedRoute**
2. **Use TypeScript interfaces for data types**
3. **Store complex data in localStorage as JSON**
4. **Validate user input before storage**
5. **Use semantic HTML for accessibility**
6. **Implement error boundaries**
7. **Add loading states for async operations**
8. **Mobile-first responsive design**

---

## 🔗 Component Relationship Map

```
App.tsx
├── ProtectedRoute (wrapper)
│   ├── Index (Dashboard)
│   ├── Profile
│   ├── Preferences
│   ├── Favorites
│   ├── Leaderboard
│   ├── FantasyCricket
│   └── AdminDashboard
├── Login
├── Signup
└── Navbar (all pages)
    ├── AdvancedSearch
    └── DropdownMenu (user menu)

AdvancedSearch
└── Pagination (for results)
    └── DataVisualization (charts)
```

---

## 📝 Notes

- All components are TypeScript-enabled
- Responsive design implemented
- Dark theme as default
- Accessibility features included
- Error handling implemented
- localStorage for persistence

---

**Last Updated**: January 23, 2026  
**Version**: 1.0.0
