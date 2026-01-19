# Demo Accounts & Seeded Data

The database has been seeded with the following demo accounts and content for testing/demonstration purposes.

## Demo Users

| Username       | Email                 | Password         | Role    |
| :------------- | :-------------------- | :--------------- | :------ |
| **retroGamer88** | `retro@example.com`     | `RetroGamer@88`    | Regular |
| **PixelMaster**  | `pixel@example.com`     | `PixelM@ster!`     | Regular |
| **ClassicFan**   | `classic@example.com`   | `Classic@Fan99`    | Regular |
| **SpeedRunner**  | `speedrun@example.com`  | `SpeedRun@2024`    | Regular |
| **NostalgiaKid** | `nostalgia@example.com` | `Nostalgia@90s`    | Regular |

## Seeded Games (NES/SNES)

The following games have been added to the game catalog:

*   **Super Mario Bros.** (NES, 1985)
*   **The Legend of Zelda** (NES, 1986)
*   **Metroid** (NES, 1986)
*   **Chrono Trigger** (SNES, 1995)

## Community Content

*   Approximately **30-40 random posts** have been generated.
*   Posts are distributed across the "General Chat", "Tips & Tricks", and "Retro Memories" categories.
*   Each post is assigned to one of the demo users above.

## How to Reset Data

To reset the database and re-seed with this data, run:
```bash
npm run seed:users
```
Or use the docker command:
```bash
docker-compose run seed-db
```
