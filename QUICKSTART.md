# SportBuzz - Quick Reference Guide

## 🚀 Getting Started

### Running the Project
```bash
npm install
npm run dev
```

### Accessing Features

**Default Login Flow:**
1. App loads → Redirected to `/login`
2. Click "Sign Up" or use existing credentials
3. After login → Full access to dashboard

---

## 📍 New Routes Added

| Route | Purpose | Protected |
|-------|---------|-----------|
| `/login` | User authentication | ❌ No |
| `/signup` | New account creation | ❌ No |
| `/` | Dashboard/Home | ✅ Yes |
| `/profile` | User profile & settings | ✅ Yes |
| `/preferences` | Notification & theme settings | ✅ Yes |
| `/favorites` | Saved favorite matches | ✅ Yes |
| `/leaderboard` | Global rankings & stats | ✅ Yes |
| `/fantasy-cricket` | Fantasy team management | ✅ Yes |
| `/admin` | Admin dashboard | ✅ Yes |

---

## 👤 Test Accounts

Since we use localStorage, create test accounts easily:

**Example Signup:**
- Name: `John Doe`
- Email: `john@example.com`
- Password: `password123`

---

## 🎯 Feature Highlights

### 1️⃣ Profile Management
- Edit personal info
- Update favorite team
- Add bio/description
- **Access**: User menu → "My Profile"

### 2️⃣ Favorites System
- Save important matches
- Quick search saved matches
- Share with others
- **Access**: User menu → "Favorites"

### 3️⃣ Leaderboard
- See global rankings
- Check your rank and points
- View prediction accuracy
- **Access**: User menu → "Leaderboard"

### 4️⃣ Fantasy Cricket
- Create multiple teams
- Manage players
- Track points
- **Access**: User menu → "Fantasy Cricket"

### 5️⃣ Preferences
- Toggle dark mode
- Email notifications
- Push notifications
- Content preferences
- **Access**: User menu → "Preferences"

### 6️⃣ Admin Dashboard
- User management
- Content moderation
- Match management
- System settings
- **Access**: `/admin` (requires `isAdmin` flag)

---

## 🔧 Key Components

### ProtectedRoute
```typescript
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```
- Redirects to login if not authenticated

### AdvancedSearch
```typescript
<AdvancedSearch 
  onSearch={handleSearch}
  onClose={handleClose}
/>
```
- Multi-filter search component

### Pagination
```typescript
<Pagination 
  currentPage={page}
  totalPages={totalPages}
  onPageChange={setPage}
/>
```
- Page navigation with smart display

### DataVisualization
```typescript
<DataVisualization 
  title="Performance Metrics"
  data={chartData}
  type="line"
  dataKeys={[{ key: 'points', color: '#ef4444', name: 'Points' }]}
/>
```
- Charts and graphs (Line/Bar)

---

## 💾 localStorage Keys

| Key | Content | Type |
|-----|---------|------|
| `user` | User profile data | JSON |
| `preferences` | Settings & notifications | JSON |
| `favorites` | Saved matches | JSON |
| `fantasyTeams` | Fantasy cricket teams | JSON |
| `theme` | Dark/light mode | String |
| `isAdmin` | Admin access | String |

---

## 🎨 UI Components Used

- **Cards**: Match cards, stat cards, info cards
- **Buttons**: Action buttons with variants
- **Input**: Text fields, date pickers
- **Switches**: Toggle preferences
- **Dropdowns**: User menu, filters
- **Tables**: Leaderboard, match listings
- **Modals**: Coming soon

---

## 🔐 Admin Mode (Development)

To access admin dashboard in development:

```javascript
// In browser console:
localStorage.setItem('isAdmin', 'true');
// Then navigate to /admin
```

---

## 📊 Sample Data

### Leaderboard (Mock Data)
```
1. Cricket Master - 9850 points - 89% accuracy
2. Football Fan - 8920 points - 87% accuracy
3. Sports Guru - 7650 points - 85% accuracy
```

### User Stats (Mock Data)
```
Rank: #127
Points: 2450
Predictions: 65 (42 correct)
Accuracy: 64.6%
Level: Pro
```

---

## 🐛 Troubleshooting

### Issue: Redirected to login repeatedly
**Solution**: Check localStorage has valid user data
```javascript
console.log(localStorage.getItem('user'));
```

### Issue: Admin dashboard not accessible
**Solution**: Set admin flag
```javascript
localStorage.setItem('isAdmin', 'true');
```

### Issue: Data not persisting
**Solution**: Check localStorage is not disabled
```javascript
localStorage.setItem('test', 'test');
console.log(localStorage.getItem('test'));
```

---

## 📱 Mobile Responsiveness

All features are fully responsive:
- ✅ Hamburger menu on mobile
- ✅ Touch-friendly buttons
- ✅ Responsive grids
- ✅ Optimized font sizes
- ✅ Mobile navigation drawer

---

## ⚡ Performance Tips

1. Use pagination for large match lists
2. Leverage favorites for quick access
3. Clear old localStorage data periodically
4. Use search filters to narrow down results

---

## 🎓 Learning Resources

- **React Router**: Route protection patterns
- **Shadcn/ui**: Component library
- **Tailwind CSS**: Utility-first styling
- **Recharts**: Data visualization

---

## 📞 Support Features

- Error messages on invalid input
- Success feedback on actions
- Loading states
- Disabled states for edge cases

---

## 🚀 Next Steps

1. **Connect to Backend API**: Replace localStorage with real API
2. **Real-time Updates**: Implement WebSocket for live scores
3. **Email Notifications**: Setup email service
4. **Payment Integration**: For premium features
5. **Mobile App**: React Native version

---

**Version**: 1.0.0  
**Status**: ✅ All Features Implemented  
**Last Updated**: January 23, 2026
