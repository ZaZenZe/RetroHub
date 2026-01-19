# Seeded Accounts and Credentials

These users are created automatically when you run `docker compose up` (the `seed-db` job now runs both `scripts/seed-database.js` and `scripts/seed-users-posts.js`). Passwords are development-only; change them for production.

| Role   | Username       | Email                 | Password     | Notes |
|--------|----------------|-----------------------|--------------|-------|
| admin  | oak            | admin@retrohub.test   | Admin@123    | Full admin rights |
| mod    | misty          | mod@retrohub.test     | Mod@123      | Moderator; assigned sample games |
| user   | retroGamer88   | retro@example.com     | RetroGamer@88| Demo user |
| user   | PixelMaster    | pixel@example.com     | PixelM@ster! | Demo user |
| user   | ClassicFan     | classic@example.com   | Classic@Fan99| Demo user |
| user   | SpeedRunner    | speedrun@example.com  | SpeedRun@2024| Demo user |
| user   | NostalgiaKid   | nostalgia@example.com | Nostalgia@90s| Demo user |

Content seeded:
- Games: Fire Red, Emerald, Heart Gold, Platinum, Black 2, Y (from `seed-database.js`).
- Tips/FAQs: Per game (from `seed-database.js`).
- Community posts/replies: Sample threads tied to seeded users (from `seed-users-posts.js`).

To reseed manually: `docker compose run --rm seed-db`.
