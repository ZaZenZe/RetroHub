#!/usr/bin/env node
'use strict';

/**
 * Comprehensive Database Seeder
 * - Creates an admin user
 * - Seeds games with assets from frontend/assets
 * - Adds tips and FAQs for each game
 * - Uses proper themes and dynamic colors
 */

require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;
const bcrypt = require('bcryptjs');

// Path fix for requiring models
const modelsPath = path.join(__dirname, '../backend/shared/models');

// Models
const User = require(path.join(modelsPath, 'User'));
const Game = require(path.join(modelsPath, 'Game'));
const Tip = require(path.join(modelsPath, 'Tip'));
const FAQ = require(path.join(modelsPath, 'FAQ'));

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://retrohub:retrohub@localhost:27017/retrohub?authSource=admin';

// Admin user to create
const ADMIN_USER = {
  email: 'admin@retrohub.com',
  username: 'admin',
  password: 'admin123', // Change this in production!
  role: 'admin',
  avatarUrl: '/assets/pixel/6Vww.gif',
};

// Game data with assets
const GAMES = [
  {
    slug: 'pokemon-fire-red',
    title: 'Pokémon Fire Red',
    platform: 'GBA',
    releaseYear: 2004,
    versionLabel: 'Fire Red Edition',
    description: 'Return to the Kanto region in this enhanced remake of Pokémon Red. Catch, train, and battle with over 150 Pokémon in this classic adventure.',
    coverImageUrl: '/assets/box art/640px-FireRed_EN_boxart.png',
    heroImageUrl: '/assets/box art/640px-FireRed_EN_boxart.png',
    hoverImageUrl: '/assets/box art/640px-FireRed_EN_boxart.png',
    screenshots: [
      '/assets/screenshots/1.png',
      '/assets/screenshots/2.png',
      '/assets/screenshots/3.png',
    ],
    theme: {
      name: 'fire-red',
      colors: {
        primary: '#ff5e3a',
        primaryAlt: '#ff7452',
        accent: '#ffd700',
        background: '#1a0a0a',
        card: '#2a1515',
        text: '#ffe6e6',
        border: '#3d1f1f',
      },
    },
    tips: [
      { content: 'Start with Charmander for an easier gym challenge against Brock', category: 'gameplay' },
      { content: 'Use the VS Seeker to rebattle trainers and level up quickly', category: 'gameplay' },
      { content: 'Save your Master Ball for legendary Pokémon like Mewtwo', category: 'items' },
      { content: 'Complete the Pokédex to unlock the National Dex and access more Pokémon', category: 'general' },
    ],
    faqs: [
      { question: 'How do I get to the Sevii Islands?', answer: 'After defeating Blaine on Cinnabar Island, Bill will give you a Tri-Pass to access One, Two, and Three Islands.' },
      { question: 'Where can I find Mew?', answer: 'Mew is not available in the base game without events or trading from other games.' },
      { question: 'What\'s the best starter Pokémon?', answer: 'All starters are viable! Charmander offers type advantages, Squirtle is well-rounded, and Bulbasaur excels early game.' },
    ],
  },
  {
    slug: 'pokemon-emerald',
    title: 'Pokémon Emerald',
    platform: 'GBA',
    releaseYear: 2005,
    versionLabel: 'Emerald Version',
    description: 'Explore the Hoenn region and challenge the Battle Frontier in this definitive third version of Pokémon Ruby and Sapphire.',
    coverImageUrl: '/assets/box art/emerald.jpg',
    heroImageUrl: '/assets/box art/emerald.jpg',
    hoverImageUrl: '/assets/box art/emerald.jpg',
    screenshots: [
      '/assets/screenshots/4.png',
      '/assets/screenshots/5.png',
      '/assets/screenshots/6.png',
    ],
    theme: {
      name: 'emerald',
      colors: {
        primary: '#2ecc71',
        primaryAlt: '#27ae60',
        accent: '#a8e6cf',
        background: '#0a1a0a',
        card: '#152a15',
        text: '#e6ffe6',
        border: '#1f3d1f',
      },
    },
    tips: [
      { content: 'The Battle Frontier opens after beating the Elite Four', category: 'gameplay' },
      { content: 'Catch Rayquaza at the Sky Pillar after the main story', category: 'general' },
      { content: 'Use the PokeNav to find rare Pokémon and track trainers', category: 'gameplay' },
      { content: 'Don\'t miss the Move Tutors for exclusive moves', category: 'strategy' },
    ],
    faqs: [
      { question: 'How do I catch both Groudon and Kyogre?', answer: 'After beating the Elite Four, you can catch both legendaries in the Cave of Origin and Marine Cave.' },
      { question: 'What\'s new in Emerald compared to Ruby/Sapphire?', answer: 'Emerald adds the Battle Frontier, both Team Magma and Aqua storylines, and animated Pokémon sprites.' },
      { question: 'Where is the Safari Zone?', answer: 'The Safari Zone is located in Route 121, accessible after getting the Pokedex from Professor Birch.' },
    ],
  },
  {
    slug: 'pokemon-platinum',
    title: 'Pokémon Platinum',
    platform: 'DS',
    releaseYear: 2009,
    versionLabel: 'Platinum Version',
    description: 'Journey through the Sinnoh region with enhanced graphics and an expanded storyline featuring Giratina and the Distortion World.',
    coverImageUrl: '/assets/box art/Platinum_EN_boxart.png',
    heroImageUrl: '/assets/box art/Platinum_EN_boxart.png',
    hoverImageUrl: '/assets/box art/Platinum_EN_boxart.png',
    screenshots: [
      '/assets/screenshots/1.png',
      '/assets/screenshots/2.png',
      '/assets/screenshots/3.png',
    ],
    theme: {
      name: 'platinum',
      colors: {
        primary: '#95a5a6',
        primaryAlt: '#bdc3c7',
        accent: '#3498db',
        background: '#0f0f14',
        card: '#1a1a24',
        text: '#e8e8f0',
        border: '#2a2a38',
      },
    },
    tips: [
      { content: 'The Distortion World features unique gravity-defying puzzles', category: 'general' },
      { content: 'Visit the Global Trade Station in Jubilife City to trade worldwide', category: 'gameplay' },
      { content: 'Unlock the Battle Frontier after beating the Elite Four', category: 'gameplay' },
      { content: 'Use the Poketch apps to track berry growth and breeding', category: 'strategy' },
    ],
    faqs: [
      { question: 'How do I get to the Distortion World?', answer: 'You\'ll access it automatically during the main story at Spear Pillar when confronting Cyrus.' },
      { question: 'Can I catch Darkrai and Shaymin?', answer: 'Yes, but you need event items (Member Card for Darkrai, Oak\'s Letter for Shaymin).' },
      { question: 'What\'s the difference from Diamond/Pearl?', answer: 'Platinum has faster battles, more Pokémon variety, an expanded storyline, and the Battle Frontier.' },
    ],
  },
  {
    slug: 'pokemon-heart-gold',
    title: 'Pokémon HeartGold',
    platform: 'DS',
    releaseYear: 2009,
    versionLabel: 'HeartGold Version',
    description: 'Relive the classic Johto adventure with your Pokémon following you on the overworld and the return of the Pokéathlon.',
    coverImageUrl: '/assets/box art/1200px-HeartGold_EN_boxart.jpg',
    heroImageUrl: '/assets/box art/1200px-HeartGold_EN_boxart.jpg',
    hoverImageUrl: '/assets/box art/1200px-HeartGold_EN_boxart.jpg',
    screenshots: [
      '/assets/screenshots/4.png',
      '/assets/screenshots/5.png',
      '/assets/screenshots/6.png',
    ],
    theme: {
      name: 'heart-gold',
      colors: {
        primary: '#f39c12',
        primaryAlt: '#f1c40f',
        accent: '#e74c3c',
        background: '#1a1410',
        card: '#2a2218',
        text: '#fff5e6',
        border: '#3d3425',
      },
    },
    tips: [
      { content: 'Your lead Pokémon follows you around - check its mood regularly', category: 'gameplay' },
      { content: 'Compete in the Pokéathlon for unique prizes and items', category: 'gameplay' },
      { content: 'After beating the Elite Four, you can travel to Kanto', category: 'general' },
      { content: 'Catch Ho-Oh using the Rainbow Wing at Bell Tower', category: 'items' },
    ],
    faqs: [
      { question: 'How do I use the PokéWalker?', answer: 'The PokéWalker is a physical pedometer accessory that came with the game, but the game is fully playable without it.' },
      { question: 'Can I get all 16 gym badges?', answer: 'Yes! You can collect 8 badges in Johto and 8 more in Kanto.' },
      { question: 'Where do I find the Red Gyarados?', answer: 'The Red Gyarados appears at the Lake of Rage as part of the main story.' },
    ],
  },
  {
    slug: 'pokemon-black-2',
    title: 'Pokémon Black 2',
    platform: 'DS',
    releaseYear: 2012,
    versionLabel: 'Black Version 2',
    description: 'Two years after the events of Black and White, explore a changed Unova region with new areas, gyms, and the Pokémon World Tournament.',
    coverImageUrl: '/assets/box art/pokemon-black-2---button-1558054992410.jpg',
    heroImageUrl: '/assets/box art/pokemon-black-2---button-1558054992410.jpg',
    hoverImageUrl: '/assets/box art/pokemon-black-2---button-1558054992410.jpg',
    screenshots: [
      '/assets/screenshots/1.png',
      '/assets/screenshots/2.png',
      '/assets/screenshots/3.png',
    ],
    theme: {
      name: 'black-2',
      colors: {
        primary: '#34495e',
        primaryAlt: '#2c3e50',
        accent: '#3498db',
        background: '#0c0d10',
        card: '#1a1d24',
        text: '#ecf0f1',
        border: '#2c3440',
      },
    },
    tips: [
      { content: 'The Pokémon World Tournament lets you battle trainers from previous games', category: 'gameplay' },
      { content: 'Unlock Challenge Mode after beating the game for tougher battles', category: 'gameplay' },
      { content: 'Visit the Medal Office to track your achievements', category: 'general' },
      { content: 'Join Avenue grows as you interact with other players', category: 'gameplay' },
    ],
    faqs: [
      { question: 'Do I need to play Black/White first?', answer: 'No, but playing Black/White first enhances the story as B2/W2 are direct sequels.' },
      { question: 'How do I unlock the PWT?', answer: 'The Pokémon World Tournament unlocks after beating the Elite Four in Driftveil City.' },
      { question: 'Can I transfer Pokémon from older games?', answer: 'Yes, use the Poké Transfer Lab to bring Pokémon from Gen IV games.' },
    ],
  },
  {
    slug: 'pokemon-y',
    title: 'Pokémon Y',
    platform: '3DS',
    releaseYear: 2013,
    versionLabel: 'Y Version',
    description: 'Experience Pokémon in stunning 3D for the first time in the beautiful Kalos region, inspired by France. Discover Mega Evolution and new Fairy-type Pokémon.',
    coverImageUrl: '/assets/box art/Pokemon-Y.avif',
    heroImageUrl: '/assets/box art/Pokemon-Y.avif',
    hoverImageUrl: '/assets/box art/Pokemon-Y.avif',
    screenshots: [
      '/assets/screenshots/4.png',
      '/assets/screenshots/5.png',
      '/assets/screenshots/6.png',
    ],
    theme: {
      name: 'y',
      colors: {
        primary: '#e91e63',
        primaryAlt: '#d81b60',
        accent: '#9c27b0',
        background: '#1a0a14',
        card: '#2a1524',
        text: '#ffe6f5',
        border: '#3d1f34',
      },
    },
    tips: [
      { content: 'Mega Evolution requires a Mega Stone and strong bond with your Pokémon', category: 'gameplay' },
      { content: 'The new Fairy type is super effective against Dragon types', category: 'gameplay' },
      { content: 'Use Pokémon-Amie to increase friendship and get in-battle bonuses', category: 'gameplay' },
      { content: 'Catch Yveltal at Team Flare\'s headquarters as part of the story', category: 'general' },
    ],
    faqs: [
      { question: 'What\'s the difference between X and Y?', answer: 'The main differences are the legendary Pokémon (Xerneas vs Yveltal) and some exclusive Mega Evolutions.' },
      { question: 'How do I Mega Evolve my Pokémon?', answer: 'You need a Mega Ring (obtained in story), the Pokémon\'s specific Mega Stone, and it must be in battle.' },
      { question: 'Where is the Friend Safari?', answer: 'Friend Safari is in Kiloude City, accessible after beating the Elite Four.' },
    ],
  },
];

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
}

async function clearDatabase() {
  console.log('\n🗑️  Clearing existing data...');
  await Promise.all([
    Game.deleteMany({}),
    Tip.deleteMany({}),
    FAQ.deleteMany({}),
    User.deleteMany({ role: 'admin' }),
  ]);
  console.log('✅ Database cleared');
}

async function createAdminUser() {
  console.log('\n👤 Creating admin user...');
  
  // Check if admin already exists
  const existing = await User.findOne({ email: ADMIN_USER.email });
  if (existing) {
    console.log('ℹ️  Admin user already exists');
    return existing;
  }
  
  // Hash password
  const passwordHash = await bcrypt.hash(ADMIN_USER.password, 10);
  
  const admin = await User.create({
    email: ADMIN_USER.email,
    username: ADMIN_USER.username,
    passwordHash,
    role: ADMIN_USER.role,
    avatarUrl: ADMIN_USER.avatarUrl,
  });
  
  console.log('✅ Admin user created');
  console.log(`   Email: ${ADMIN_USER.email}`);
  console.log(`   Password: ${ADMIN_USER.password}`);
  console.log('   ⚠️  CHANGE THIS PASSWORD IN PRODUCTION!');
  
  return admin;
}

async function seedGames() {
  console.log('\n🎮 Seeding games...');
  
  for (const gameData of GAMES) {
    try {
      const { tips, faqs, ...gameInfo } = gameData;
      
      // Create game
      const game = await Game.create(gameInfo);
      console.log(`   ✅ Created: ${game.title}`);
      
      // Add tips
      if (tips && tips.length > 0) {
        const tipDocs = tips.map(tip => ({
          gameId: game._id,
          content: tip.content,
          category: tip.category || 'gameplay',
        }));
        await Tip.insertMany(tipDocs);
        console.log(`      📝 Added ${tips.length} tips`);
      }
      
      // Add FAQs
      if (faqs && faqs.length > 0) {
        const faqDocs = faqs.map(faq => ({
          gameId: game._id,
          question: faq.question,
          answer: faq.answer,
        }));
        await FAQ.insertMany(faqDocs);
        console.log(`      ❓ Added ${faqs.length} FAQs`);
      }
    } catch (err) {
      console.error(`   ❌ Failed to create ${gameData.title}:`, err.message);
    }
  }
  
  console.log('\n✅ Games seeded successfully');
}

async function verifyAssets() {
  console.log('\n📁 Verifying assets...');
  
  const assetsDir = path.join(__dirname, '../frontend/assets');
  
  try {
    await fs.access(assetsDir);
    
    const boxArt = await fs.readdir(path.join(assetsDir, 'box art'));
    const screenshots = await fs.readdir(path.join(assetsDir, 'screenshots'));
    
    console.log(`   ✅ Found ${boxArt.length} box art images`);
    console.log(`   ✅ Found ${screenshots.length} screenshots`);
  } catch (err) {
    console.warn('   ⚠️  Assets directory not fully accessible:', err.message);
    console.warn('   You may need to manually copy assets to the frontend/assets directory');
  }
}

async function main() {
  console.log('🚀 RetroHub Database Seeder\n');
  console.log('═'.repeat(50));
  
  await connectDB();
  await verifyAssets();
  await clearDatabase();
  await createAdminUser();
  await seedGames();
  
  console.log('\n' + '═'.repeat(50));
  console.log('✨ Database seeding complete!\n');
  console.log('📌 Next steps:');
  console.log('   1. Ensure all services are running (docker-compose up)');
  console.log('   2. Navigate to http://localhost:8080');
  console.log('   3. Click "Sign in" and use admin credentials:');
  console.log(`      Email: ${ADMIN_USER.email}`);
  console.log(`      Password: ${ADMIN_USER.password}`);
  console.log('   4. Access admin panel at http://localhost:8080/admin.html');
  console.log('\n🎉 Enjoy RetroHub!\n');
  
  await mongoose.connection.close();
  process.exit(0);
}

main().catch(err => {
  console.error('\n❌ Seeding failed:', err);
  process.exit(1);
});
