# RetroHub Admin System Setup Guide

## Quick Start (5 minutes)

### 1. Install Dependencies

```powershell
# Install multer for file uploads
cd backend\game-service
npm install

# Return to root
cd ..\..
```

### 2. Start Services

```powershell
# Start MongoDB and all services
npm run docker:full
```

Wait for all services to start (about 30 seconds).

### 3. Seed the Database

```powershell
# Populate database with production data
npm run seed:production
```

This creates:
- Admin user: `admin@retrohub.com` / `admin123`
- 6 sample games with themes, tips, and FAQs
- All assets properly linked

### 4. Access the Application

1. **Main Site**: http://localhost:8080
2. **Admin Panel**: http://localhost:8080/admin.html
3. **Mongo Express**: http://localhost:8081 (optional DB viewer)

### 5. Login as Admin

1. Go to http://localhost:8080
2. Click "Sign in"
3. Enter credentials:
   - Email: `admin@retrohub.com`
   - Password: `admin123`
4. Navigate to Admin Panel

## Features Implemented

### ✅ Admin System
- [x] Admin user role in database
- [x] JWT-based authentication
- [x] Admin-only API routes
- [x] Role-based access control

### ✅ Admin Panel UI
- [x] Games management (list, create, edit, delete)
- [x] Image upload (single & bulk)
- [x] Theme customization with color pickers
- [x] Tips & FAQs management
- [x] Theme presets (Fire Red, Emerald, etc.)
- [x] Responsive design

### ✅ Dynamic Content
- [x] Game model with nested theme structure
- [x] Dynamic color application via CSS variables
- [x] Data-driven game pages (no hardcoding)
- [x] Live theme preview

### ✅ Asset Management
- [x] File upload API with multer
- [x] Image validation (type, size)
- [x] Screenshot management
- [x] Asset organization

### ✅ Production Ready
- [x] Comprehensive seeder script
- [x] Sample data with real assets
- [x] Error handling
- [x] Security middleware
- [x] Documentation

## Testing the System

### Test 1: Create a New Game

1. Login as admin
2. Navigate to Admin Panel
3. Click "Create Game"
4. Fill in form:
   - Title: "Super Mario Bros"
   - Platform: "NES"
   - Year: 1985
   - Description: "Classic platformer"
5. Upload a cover image
6. Choose theme: "Fire Red"
7. Add some tips and FAQs
8. Click "Save Game"
9. Go to main site and see your new game!

### Test 2: Edit Theme Colors

1. In Admin Panel, click "Edit" on any game
2. Scroll to "Theme & Colors"
3. Change colors with pickers
4. Click "Save Game"
5. Open the game on main site
6. See custom colors applied

### Test 3: Upload Screenshots

1. Edit a game in Admin Panel
2. Scroll to "Screenshots"
3. Click "Bulk Upload"
4. Select multiple images
5. Save game
6. View game detail page
7. See screenshot gallery

### Test 4: Normal User Experience

1. Logout from admin
2. Create a new account
3. Verify you cannot access admin panel
4. Browse games as normal user
5. Post in forums
6. Check profile

## Troubleshooting

### Services won't start
```powershell
# Check if ports are in use
netstat -ano | findstr :3001
netstat -ano | findstr :3003
netstat -ano | findstr :27017

# Kill processes if needed
taskkill /PID <PID> /F

# Restart services
npm run docker:down
npm run docker:full
```

### Database connection errors
```powershell
# Check MongoDB status
docker ps | findstr mongo

# View MongoDB logs
docker logs retrohub-mongodb-1

# Restart MongoDB
docker restart retrohub-mongodb-1
```

### Admin panel won't load
1. Check browser console for errors
2. Verify you're logged in as admin
3. Check localStorage:
   ```javascript
   console.log(JSON.parse(localStorage.authUser).role)
   // Should output: "admin"
   ```
4. Clear localStorage and login again

### Images not displaying
1. Verify image paths start with `/assets/`
2. Check files exist in `frontend/assets/`
3. Clear browser cache (Ctrl + F5)
4. Check server is serving static files

### Theme colors not applying
1. Open DevTools → Elements
2. Look for `<style id="dynamic-theme-style">`
3. Verify CSS variables are present
4. Re-save game in admin panel
5. Hard refresh page (Ctrl + Shift + R)

## API Testing with cURL

### Create a Game (Admin)

First, login to get token:
```powershell
curl -X POST http://localhost:3001/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@retrohub.com","password":"admin123"}'
```

Copy the token, then:
```powershell
curl -X POST http://localhost:3003/admin/games `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_TOKEN_HERE" `
  -d '{
    "title": "Sonic the Hedgehog",
    "slug": "sonic-1",
    "platform": "Sega Genesis",
    "releaseYear": 1991,
    "description": "Speed through levels collecting rings",
    "coverImageUrl": "/assets/pokeball.png",
    "theme": {
      "name": "sonic-blue",
      "colors": {
        "primary": "#0066ff",
        "primaryAlt": "#0099ff",
        "accent": "#ffcc00",
        "background": "#001133",
        "card": "#002255",
        "text": "#ffffff",
        "border": "#003377"
      }
    }
  }'
```

### Upload an Image
```powershell
curl -X POST http://localhost:3003/admin/upload `
  -H "Authorization: Bearer YOUR_TOKEN_HERE" `
  -F "image=@path\to\your\image.jpg"
```

### List All Games
```powershell
curl http://localhost:3003/games
```

## File Structure

```
RetroHub/
├── backend/
│   ├── game-service/
│   │   ├── routes/
│   │   │   ├── game.routes.js      # Public API
│   │   │   └── admin.routes.js     # Admin API (NEW)
│   │   ├── server.js                # Updated with admin routes
│   │   └── package.json             # Added multer
│   └── shared/
│       └── models/
│           ├── Game.js              # Updated with theme.colors
│           └── User.js              # Has role field
├── frontend/
│   ├── admin.html                   # Admin panel (NEW)
│   ├── admin.css                    # Admin styles (NEW)
│   ├── admin.js                     # Admin logic (NEW)
│   ├── index.html                   # Main site
│   ├── script.js                    # Updated with dynamic themes
│   ├── style.css                    # Existing styles
│   └── assets/
│       ├── box art/                 # Game covers
│       ├── screenshots/             # Game screenshots
│       ├── uploads/                 # Admin uploads (NEW)
│       └── pixel/                   # Avatar GIFs
├── scripts/
│   └── seed-production.js           # Production seeder (NEW)
└── docs/
    └── ADMIN_GUIDE.md               # Full documentation (NEW)
```

## Next Steps

1. **Customize Admin User**
   - Change password in database
   - Add more admin users via database

2. **Add More Games**
   - Use admin panel to add games
   - Upload your own assets
   - Create custom themes

3. **Backup Database**
   ```powershell
   docker exec retrohub-mongodb-1 mongodump --out /backup
   ```

4. **Deploy to Production**
   - Change admin password
   - Set up proper JWT secrets
   - Configure environment variables
   - Enable HTTPS
   - Set up CDN for assets

5. **Monitor**
   - Check logs: `docker-compose logs -f`
   - Use Mongo Express: http://localhost:8081
   - Monitor performance

## Security Checklist

- [ ] Change default admin password
- [ ] Set strong JWT_SECRET in .env
- [ ] Enable rate limiting on admin routes
- [ ] Add CSRF protection
- [ ] Validate all user inputs
- [ ] Sanitize file uploads
- [ ] Enable HTTPS in production
- [ ] Set up proper CORS policies
- [ ] Regular security audits
- [ ] Keep dependencies updated

## Performance Tips

1. **Image Optimization**
   - Compress images before upload
   - Use WebP/AVIF formats
   - Lazy load images
   - Consider using a CDN

2. **Database**
   - Index frequently queried fields
   - Use projection to limit data
   - Implement caching (Redis)
   - Monitor query performance

3. **Frontend**
   - Minify CSS/JS in production
   - Enable gzip compression
   - Use browser caching
   - Implement code splitting

## Support Resources

- **MongoDB Documentation**: https://docs.mongodb.com/
- **Express.js Guide**: https://expressjs.com/
- **Multer Documentation**: https://github.com/expressjs/multer
- **JWT Best Practices**: https://jwt.io/introduction
- **CSS Variables Guide**: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties

---

**Ready to go!** 🚀

Your RetroHub admin system is now fully functional. Create amazing game pages without touching code! 🎮✨
