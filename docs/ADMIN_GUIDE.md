# Admin Panel Documentation

## Overview

The RetroHub admin panel allows administrators to manage games, themes, and content dynamically without hardcoding. This enables a fully data-driven experience where game pages can be created, edited, and customized on-demand.

## Features

### 1. **User Roles**
- **Admin**: Full access to create, edit, and delete games
- **Normal User**: Can browse games, post in forums, and track their collection

### 2. **Dynamic Game Management**
- Create new game entries with full metadata
- Upload cover art, hero images, and screenshots
- Edit existing games without touching code
- Delete games and all associated content

### 3. **Custom Themes**
- Each game can have its own color scheme
- 7 customizable colors per theme:
  - Primary Color
  - Primary Alt Color
  - Accent Color
  - Background Color
  - Card Background Color
  - Text Color
  - Border Color
- Theme presets available (Fire Red, Emerald, Platinum, etc.)
- Live preview of theme changes

### 4. **Content Management**
- Add/edit/remove Tips for each game
- Add/edit/remove FAQs for each game
- Categorize tips (Gameplay, Story, Collectibles, Secrets)

### 5. **Asset Management**
- Single image upload for covers, heroes, and hover images
- Bulk screenshot upload
- Images stored in `/assets/uploads/`

## Getting Started

### 1. Seed the Database

Run the production seeder to populate the database with games and create an admin user:

```bash
node scripts/seed-production.js
```

This will create:
- An admin user (email: `admin@retrohub.com`, password: `admin123`)
- 6 sample games with tips, FAQs, and themes
- All assets linked from `frontend/assets/`

### 2. Access the Admin Panel

1. Start all services: `docker-compose up`
2. Navigate to: `http://localhost:8080`
3. Click "Sign in"
4. Use admin credentials:
   - Email: `admin@retrohub.com`
   - Password: `admin123`
5. Go to: `http://localhost:8080/admin.html`

### 3. Create a New Game

1. Click "Create Game" in the admin navbar
2. Fill in basic information:
   - Title (required)
   - Slug (auto-generated from title)
   - Platform (required)
   - Release Year (required)
   - Version Label (optional)
   - Description (required)
3. Upload or provide URLs for images:
   - Cover Image (required)
   - Hero/Banner Image (optional)
   - Hover Image (optional)
   - Screenshots (optional)
4. Customize the theme:
   - Choose a preset or create custom colors
   - Each color affects different UI elements
5. Add content:
   - Tips: Short gameplay hints
   - FAQs: Common questions and answers
6. Click "Save Game"

## API Endpoints

### Admin Routes (Require Admin Role)

All admin routes require authentication with an admin JWT token.

#### Games
- `GET /api/games/admin/games` - List all games
- `GET /api/games/admin/games/:id` - Get game with tips/FAQs
- `POST /api/games/admin/games` - Create new game
- `PUT /api/games/admin/games/:id` - Update game
- `DELETE /api/games/admin/games/:id` - Delete game

#### Tips
- `POST /api/games/admin/games/:id/tips` - Add tip
- `PUT /api/games/admin/games/:id/tips/:tipId` - Update tip
- `DELETE /api/games/admin/games/:id/tips/:tipId` - Delete tip

#### FAQs
- `POST /api/games/admin/games/:id/faqs` - Add FAQ
- `PUT /api/games/admin/games/:id/faqs/:faqId` - Update FAQ
- `DELETE /api/games/admin/games/:id/faqs/:faqId` - Delete FAQ

#### Assets
- `POST /api/games/admin/upload` - Upload single image
- `POST /api/games/admin/upload/bulk` - Upload multiple images

#### Themes
- `GET /api/games/admin/themes` - Get theme presets

## Database Models

### Game Schema

```javascript
{
  slug: String,              // URL-friendly identifier
  title: String,             // Display name
  platform: String,          // GBA, DS, 3DS, etc.
  releaseYear: Number,       // Year of release
  versionLabel: String,      // Optional version/region info
  description: String,       // Game description
  coverImageUrl: String,     // Main cover art
  heroImageUrl: String,      // Banner for detail page
  hoverImageUrl: String,     // Animated preview
  screenshots: [String],     // Array of screenshot URLs
  theme: {
    name: String,            // Theme identifier
    colors: {
      primary: String,       // Primary brand color
      primaryAlt: String,    // Secondary brand color
      accent: String,        // Accent/highlight color
      background: String,    // Page background
      card: String,          // Card backgrounds
      text: String,          // Text color
      border: String         // Border color
    }
  }
}
```

### User Schema

```javascript
{
  email: String,
  username: String,
  passwordHash: String,
  role: String,              // 'user' or 'admin'
  avatarUrl: String,
  level: Number,
  experiencePoints: Number
}
```

## Theme System

### How Themes Work

1. **Static Themes**: Predefined CSS classes in `style.css`
   - `theme-home`, `theme-fire-red`, `theme-emerald`, etc.
   - Used as fallback if no dynamic theme is defined

2. **Dynamic Themes**: Database-driven color schemes
   - Stored in `game.theme.colors`
   - Applied via CSS custom properties (CSS variables)
   - Override default colors at runtime

3. **Application Flow**:
   ```
   User opens game → 
   Frontend fetches game data → 
   `applyDynamicTheme()` injects CSS variables → 
   UI uses custom colors
   ```

### Creating Custom Themes

In the admin panel:
1. Select "Custom" in the theme preset dropdown
2. Use color pickers to choose each color
3. Colors update the following CSS variables:
   - `--primary`: Main action buttons, highlights
   - `--primary-2`: Button hover states
   - `--accent`: Secondary highlights, links
   - `--bg`: Page background
   - `--card`: Card/panel backgrounds
   - `--text`: Main text color
   - `--border`: Borders and dividers

## Security

### Authentication
- JWT tokens stored in localStorage
- Token included in `Authorization: Bearer <token>` header
- Admin routes verify token and check `user.role === 'admin'`

### Authorization
- Only admins can access `/api/games/admin/*` routes
- Regular users get 403 Forbidden
- Unauthenticated requests get 401 Unauthorized

### File Uploads
- Only image files allowed (jpeg, jpg, png, gif, webp, avif)
- 10MB max file size
- Files stored in `frontend/assets/uploads/`
- Filenames include timestamp to prevent collisions

## Troubleshooting

### Issue: Admin panel shows "Access Denied"
**Solution**: Ensure you're logged in with an admin account. Check `localStorage.authUser.role === 'admin'`.

### Issue: Images not loading
**Solution**: 
1. Verify image paths start with `/assets/`
2. Check that files exist in `frontend/assets/`
3. Ensure server is serving static files from `frontend/`

### Issue: Theme colors not applying
**Solution**:
1. Open browser DevTools → Elements → Check `<style id="dynamic-theme-style">`
2. Verify CSS variables are set
3. Clear browser cache
4. Re-save the game in admin panel

### Issue: Can't create games
**Solution**:
1. Check MongoDB is running: `docker ps | grep mongo`
2. Verify game-service is running: `docker ps | grep game-service`
3. Check browser console for errors
4. Verify JWT token is valid

## Best Practices

1. **Asset Organization**
   - Keep box art in `/assets/box art/`
   - Keep screenshots in `/assets/screenshots/`
   - Use descriptive filenames

2. **Slugs**
   - Use lowercase, hyphenated format: `pokemon-fire-red`
   - Keep them short and memorable
   - Don't change slugs after publishing (breaks URLs)

3. **Themes**
   - Test themes with both light and dark text
   - Ensure sufficient contrast for accessibility
   - Use theme presets as starting points

4. **Content**
   - Write concise tips (1-2 sentences)
   - Answer FAQs thoroughly
   - Categorize tips appropriately

5. **Images**
   - Optimize images before uploading (compress, resize)
   - Use consistent aspect ratios
   - Prefer modern formats (WebP, AVIF) when possible

## Future Enhancements

Potential features for future development:
- [ ] Drag-and-drop image uploads
- [ ] Theme preview before saving
- [ ] Bulk game import from CSV
- [ ] Game cloning/duplication
- [ ] Version history for games
- [ ] Image CDN integration
- [ ] User permission levels (moderator, contributor)
- [ ] Content approval workflow
- [ ] Analytics dashboard
- [ ] Automated backups

## Support

For issues or questions:
1. Check this documentation
2. Review browser console errors
3. Check server logs: `docker-compose logs game-service`
4. Verify database connections: `docker-compose logs mongodb`

---

**RetroHub Admin Panel** - Making retro gaming accessible and customizable! 🎮✨
