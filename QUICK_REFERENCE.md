# 🚀 RetroHub Admin Quick Reference

## Login Credentials
```
Email: admin@retrohub.com
Password: admin123
⚠️ CHANGE IN PRODUCTION!
```

## Quick Commands

### Setup (First Time)
```powershell
# 1. Install dependencies
cd backend\game-service
npm install
cd ..\..

# 2. Start all services
npm run docker:full

# 3. Seed database
npm run seed:production

# 4. Open browser
# http://localhost:8080
# http://localhost:8080/admin.html
```

### Daily Use
```powershell
# Start
npm run docker:full

# Stop
npm run docker:down

# View logs
npm run docker:logs

# Restart services
npm run docker:down && npm run docker:full
```

## URLs
- **Main Site**: http://localhost:8080
- **Admin Panel**: http://localhost:8080/admin.html
- **Mongo Express**: http://localhost:8081 (DB viewer)

## Admin Panel Sections

### 1. Games
- List all games
- Search & filter
- Edit/Delete

### 2. Create Game
- Basic info (title, platform, year)
- Images (cover, hero, screenshots)
- Theme & colors (7 customizable colors)
- Tips & FAQs

### 3. Themes
- View theme presets
- Apply to games

## Creating a Game (Step-by-Step)

1. **Click "Create Game"**

2. **Fill Basic Info**
   - Title: Required
   - Slug: Auto-generated (e.g., "my-game" from "My Game")
   - Platform: Choose from dropdown
   - Year: 1970-2030
   - Version: Optional (e.g., "USA Edition")
   - Description: Required

3. **Add Images**
   - Cover: Required (main card image)
   - Hero: Optional (detail page banner)
   - Hover: Optional (animated preview)
   - Screenshots: Optional (gallery)
   - Use "Upload" buttons or paste URLs

4. **Customize Theme**
   - Choose preset OR
   - Set custom colors:
     - Primary: Main brand color
     - Primary Alt: Hover states
     - Accent: Highlights
     - Background: Page background
     - Card: Panel backgrounds
     - Text: Text color
     - Border: Borders/dividers

5. **Add Content**
   - Tips: Click "Add Tip", enter content, choose category
   - FAQs: Click "Add FAQ", enter question & answer

6. **Save**
   - Click "Save Game"
   - View on main site!

## Theme Presets

| Name | Primary | Best For |
|------|---------|----------|
| Retro Classic | Orange | Default games |
| Fire Red | Red | Action games |
| Emerald Green | Green | Adventure |
| Platinum Silver | Gray | Neutral |
| Heart Gold | Gold | RPGs |

## Color Meanings

- **Primary**: Buttons, call-to-actions, main accent
- **Primary Alt**: Button hovers, secondary highlights
- **Accent**: Links, badges, secondary accents
- **Background**: Page background
- **Card**: Panels, cards, elevated surfaces
- **Text**: Main text color
- **Border**: Dividers, card borders

## File Upload Limits

- **Max Size**: 10MB per file
- **Allowed Types**: JPG, PNG, GIF, WebP, AVIF
- **Single Upload**: One image at a time
- **Bulk Upload**: Up to 10 screenshots

## Tips Categories

- **Gameplay**: General game tips
- **Story**: Story-related hints
- **Collectibles**: Finding items
- **Secrets**: Hidden features

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Can't login | Check email/password, clear cache |
| Images not loading | Verify paths start with `/assets/` |
| Theme not applying | Re-save game, hard refresh (Ctrl+F5) |
| Upload fails | Check file size (<10MB) and type |
| Access denied | Ensure role is 'admin' |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Esc | Close modals |
| Tab | Navigate form |
| Ctrl+S | Save (in forms) |

## Database Quick Access

### Via Mongo Express (GUI)
1. Open http://localhost:8081
2. Navigate to `retrohub` database
3. Browse collections:
   - `games` - All games
   - `users` - All users
   - `tips` - Game tips
   - `faqs` - Game FAQs

### Via Command Line
```powershell
# Connect to MongoDB
docker exec -it retrohub-mongodb-1 mongosh -u retrohub -p retrohub --authenticationDatabase admin

# Use database
use retrohub

# List all games
db.games.find().pretty()

# Find admin user
db.users.find({role: 'admin'})

# Count games
db.games.count()

# Exit
exit
```

## API Testing with cURL

### Get Token
```powershell
curl -X POST http://localhost:3001/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@retrohub.com","password":"admin123"}'
```

### List Games
```powershell
curl http://localhost:3003/games
```

### Create Game (Replace TOKEN)
```powershell
curl -X POST http://localhost:3003/admin/games `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer TOKEN" `
  -d '{"title":"Test Game","slug":"test","platform":"NES","releaseYear":1990,"description":"A test game","coverImageUrl":"/assets/pokeball.png"}'
```

## Backup & Restore

### Backup
```powershell
docker exec retrohub-mongodb-1 mongodump --out /backup
docker cp retrohub-mongodb-1:/backup ./backup
```

### Restore
```powershell
docker cp ./backup retrohub-mongodb-1:/backup
docker exec retrohub-mongodb-1 mongorestore /backup
```

## Security Checklist

- [ ] Changed admin password
- [ ] Set JWT_SECRET in environment
- [ ] Enabled HTTPS (production)
- [ ] Configured CORS properly
- [ ] Limited file upload sizes
- [ ] Validated all inputs
- [ ] Regular backups scheduled

## Performance Tips

1. **Images**: Compress before upload
2. **Thumbnails**: Use appropriate sizes
3. **Database**: Create indexes on slug, platform
4. **Caching**: Enable browser caching
5. **CDN**: Use CDN for production assets

## Deployment Checklist

- [ ] Change admin credentials
- [ ] Set environment variables
- [ ] Configure MongoDB replica set
- [ ] Enable HTTPS/SSL
- [ ] Set up CDN
- [ ] Configure backups
- [ ] Enable monitoring
- [ ] Set up logging
- [ ] Configure rate limiting
- [ ] Test thoroughly

## Support Resources

- **Admin Guide**: `docs/ADMIN_GUIDE.md`
- **Setup Guide**: `docs/ADMIN_SETUP.md`
- **Implementation**: `ADMIN_IMPLEMENTATION.md`
- **Docker Logs**: `docker-compose logs -f`
- **Browser Console**: F12 → Console tab

---

## Need Help?

1. Check documentation in `docs/`
2. Review browser console (F12)
3. Check server logs (`docker-compose logs`)
4. Verify MongoDB connection
5. Clear cache and retry

---

**Quick Tip**: Bookmark http://localhost:8080/admin.html for easy access! 🔖

**Happy Gaming!** 🎮✨
