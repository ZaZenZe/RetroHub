#!/usr/bin/env node
'use strict';

/**
 * Seed Users, Games, and Posts
 * - Creates demo users (admin, moderator, regular users)
 * - Adds classic NES/SNES games
 * - Seeds community posts from random users
 */

require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

const modelsPath = path.join(__dirname, '../backend/shared/models');
const User = require(path.join(modelsPath, 'User'));
const Game = require(path.join(modelsPath, 'Game'));
const Tip = require(path.join(modelsPath, 'Tip'));
const FAQ = require(path.join(modelsPath, 'FAQ'));
const Post = require(path.join(modelsPath, 'Post'));
const Reply = require(path.join(modelsPath, 'Reply'));

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://retrohub:retrohub@localhost:27017/retrohub?authSource=admin';

// Demo Users
const USERS = [
  {
    username: 'oak',
    email: 'admin@retrohub.test',
    password: 'Admin@123',
    role: 'admin',
    avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=oak'
  },
  {
    username: 'misty',
    email: 'mod@retrohub.test',
    password: 'Mod@123',
    role: 'mod',
    avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=misty'
  },
  {
    username: 'retroGamer88',
    email: 'retro@example.com',
    password: 'RetroGamer@88',
    avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=retro88'
  },
  {
    username: 'PixelMaster',
    email: 'pixel@example.com',
    password: 'PixelM@ster!',
    avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=pixelmaster'
  },
  {
    username: 'ClassicFan',
    email: 'classic@example.com',
    password: 'Classic@Fan99',
    avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=classicfan'
  },
  {
    username: 'SpeedRunner',
    email: 'speedrun@example.com',
    password: 'SpeedRun@2024',
    avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=speedrunner'
  },
  {
    username: 'NostalgiaKid',
    email: 'nostalgia@example.com',
    password: 'Nostalgia@90s',
    avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=nostalgiakid'
  }
];

// Pokémon set with local GIFs for cover hover and gameplay hero
const GAMES = [
  {
    title: 'Pokemon Fire Red',
    slug: 'pokemon-fire-red',
    platform: 'GBA',
    releaseYear: 2004,
    description: 'Return to Kanto in this enhanced remake with wireless trading and Sevii Islands.',
    coverImageUrl: '/assets/box art/640px-FireRed_EN_boxart.png',
    coverGifUrl: '/assets/game/fire-red.gif',
    heroImageUrl: '/assets/box art/640px-FireRed_EN_boxart.png',
    gameplayGifUrl: '/assets/gameplay/pokemon-fire-red.gif',
    hoverImageUrl: '/assets/box art/640px-FireRed_EN_boxart.png',
    hoverGifUrl: '/assets/game/fire-red.gif',
    screenshots: ['/assets/screenshots/1.png', '/assets/screenshots/2.png'],
    theme: {
      name: 'fire-red',
      colors: {
        primary: '#ff5e3a',
        primaryAlt: '#ff7452',
        accent: '#ffd700',
        background: '#1a0a0a',
        card: '#2a1515',
        text: '#ffe6e6',
        border: '#3d1f1f'
      }
    },
    tips: [
      { content: 'Pick Bulbasaur to breeze through the first two gyms.', category: 'strategy' },
      { content: 'Use the VS Seeker near rich trainers for fast money and XP.', category: 'gameplay' },
      { content: 'Save the Master Ball for roaming legendaries.', category: 'general' }
    ],
    faqs: [
      { question: 'How do I reach the Sevii Islands?', answer: 'Beat Blaine, receive the Tri-Pass, and sail from Vermilion.' },
      { question: 'Where do I get EXP Share?', answer: "Show 50 caught Pokémon to Professor Oak's aide on Route 15." }
    ]
  },
  {
    title: 'Pokemon Emerald',
    slug: 'pokemon-emerald',
    platform: 'GBA',
    releaseYear: 2005,
    description: 'Hoenn adventure featuring both Team Magma and Aqua and the Battle Frontier.',
    coverImageUrl: '/assets/box art/emerald.jpg',
    coverGifUrl: '/assets/game/pokemon-emerald.gif',
    heroImageUrl: '/assets/box art/emerald.jpg',
    gameplayGifUrl: '/assets/gameplay/emerald.gif',
    hoverImageUrl: '/assets/box art/emerald.jpg',
    hoverGifUrl: '/assets/game/pokemon-emerald.gif',
    screenshots: ['/assets/screenshots/3.png', '/assets/screenshots/4.png'],
    theme: {
      name: 'emerald',
      colors: {
        primary: '#2ecc71',
        primaryAlt: '#27ae60',
        accent: '#a8e6cf',
        background: '#0a1a0a',
        card: '#152a15',
        text: '#e6ffe6',
        border: '#1f3d1f'
      }
    },
    tips: [
      { content: 'Switch to the Mach Bike to clear Sky Pillar gaps.', category: 'gameplay' },
      { content: 'Train a balanced team for the Battle Frontier; status moves win long sets.', category: 'strategy' },
      { content: 'Catch Rayquaza before the Elite Four to cover Dragon threats.', category: 'general' }
    ],
    faqs: [
      { question: 'How do I unlock the Battle Frontier?', answer: 'Beat the Elite Four; Scott invites you and gives the Frontier Pass.' },
      { question: 'Can I catch both Groudon and Kyogre?', answer: 'Yes—fight Magma for Groudon and Aqua for Kyogre post-story.' }
    ]
  },
  {
    title: 'Pokemon Heart Gold',
    slug: 'pokemon-heart-gold',
    platform: 'DS',
    releaseYear: 2009,
    description: 'Johto remake with updated mechanics, follower Pokémon, and Pokéwalker support.',
    coverImageUrl: '/assets/box art/1200px-HeartGold_EN_boxart.jpg',
    coverGifUrl: '/assets/game/heart-gold.gif',
    heroImageUrl: '/assets/box art/1200px-HeartGold_EN_boxart.jpg',
    gameplayGifUrl: '/assets/gameplay/heartgold.gif',
    hoverImageUrl: '/assets/box art/1200px-HeartGold_EN_boxart.jpg',
    hoverGifUrl: '/assets/game/heart-gold.gif',
    screenshots: ['/assets/screenshots/5.png'],
    theme: {
      name: 'heart-gold',
      colors: {
        primary: '#f39c12',
        primaryAlt: '#f1c40f',
        accent: '#e74c3c',
        background: '#1a1410',
        card: '#2a2218',
        text: '#fff5e6',
        border: '#3d3425'
      }
    },
    tips: [
      { content: 'Let your lead Pokémon follow you to boost friendship gains.', category: 'gameplay' },
      { content: 'Stock Burn and Ice heals for Pryce and Clair gyms.', category: 'items' },
      { content: 'Bring Electric coverage for the Red Gyarados.', category: 'general' }
    ],
    faqs: [
      { question: 'How do I evolve Eevee into Espeon or Umbreon?', answer: 'Max friendship; level up during day for Espeon, night for Umbreon.' },
      { question: 'Where is the EXP Share?', answer: 'Get it from Professor Elm’s aide after grabbing the Red Scale.' }
    ]
  },
  {
    title: 'Pokemon Platinum',
    slug: 'pokemon-platinum',
    platform: 'DS',
    releaseYear: 2008,
    description: 'Enhanced Sinnoh journey featuring the Distortion World and expanded roster.',
    coverImageUrl: '/assets/box art/Platinum_EN_boxart.png',
    coverGifUrl: '/assets/game/platinum.gif',
    heroImageUrl: '/assets/box art/Platinum_EN_boxart.png',
    gameplayGifUrl: '/assets/gameplay/platinum.gif',
    hoverImageUrl: '/assets/box art/Platinum_EN_boxart.png',
    hoverGifUrl: '/assets/game/platinum.gif',
    screenshots: ['/assets/screenshots/6.png'],
    theme: {
      name: 'platinum',
      colors: {
        primary: '#95a5a6',
        primaryAlt: '#bdc3c7',
        accent: '#3498db',
        background: '#0f0f14',
        card: '#1a1a24',
        text: '#e8e8f0',
        border: '#2a2a38'
      }
    },
    tips: [
      { content: 'Prioritize a diverse party before the Distortion World puzzles.', category: 'strategy' },
      { content: 'Use the Vs. Seeker on Route 206/222 for efficient leveling.', category: 'gameplay' },
      { content: 'Rotom forms unlock on Fridays after the Old Chateau TV event.', category: 'items' }
    ],
    faqs: [
      { question: 'How do I access the Distortion World?', answer: 'Progress the Team Galactic story and follow Cynthia to Spear Pillar.' },
      { question: 'Can I get both Dialga and Palkia?', answer: 'Yes—after National Dex, collect the orbs and return to Spear Pillar.' }
    ]
  },
  {
    title: 'Pokemon Black 2',
    slug: 'pokemon-black-2',
    platform: 'DS',
    releaseYear: 2012,
    description: 'Direct sequel in Unova with new locations, Kyurem forms, and key system updates.',
    coverImageUrl: '/assets/box art/pokemon-black-2---button-1558054992410.jpg',
    coverGifUrl: '/assets/game/black2.gif',
    heroImageUrl: '/assets/box art/pokemon-black-2---button-1558054992410.jpg',
    gameplayGifUrl: '/assets/gameplay/black2.gif',
    hoverImageUrl: '/assets/box art/pokemon-black-2---button-1558054992410.jpg',
    hoverGifUrl: '/assets/game/black2.gif',
    screenshots: ['/assets/screenshots/1.png', '/assets/screenshots/3.png'],
    theme: {
      name: 'black-2',
      colors: {
        primary: '#4b6cb7',
        primaryAlt: '#182848',
        accent: '#00c6ff',
        background: '#0d0f17',
        card: '#171b26',
        text: '#e6e8ed',
        border: '#222839'
      }
    },
    tips: [
      { content: 'Use Join Avenue daily for fast training and item discounts.', category: 'gameplay' },
      { content: 'Hidden Grottos hold rare abilities like Multiscale Dragonite.', category: 'strategy' },
      { content: 'Bring Electric and Ice coverage for Drayden and Plasma Frigate.', category: 'general' }
    ],
    faqs: [
      { question: 'What is Memory Link?', answer: 'Link to Black/White save for flashbacks and extra battles.' },
      { question: 'How do I get the Shiny Charm?', answer: 'Complete the National Dex (minus Mythicals) and talk to Professor Juniper.' }
    ]
  },
  {
    title: 'Pokemon Y',
    slug: 'pokemon-y',
    platform: '3DS',
    releaseYear: 2013,
    description: 'Kalos region adventure introducing Mega Evolution and full 3D battles.',
    coverImageUrl: '/assets/box art/Pokemon-Y.avif',
    coverGifUrl: '/assets/game/y.gif',
    heroImageUrl: '/assets/box art/Pokemon-Y.avif',
    gameplayGifUrl: '/assets/gameplay/y.gif',
    hoverImageUrl: '/assets/box art/Pokemon-Y.avif',
    hoverGifUrl: '/assets/game/y.gif',
    screenshots: ['/assets/screenshots/2.png', '/assets/screenshots/4.png'],
    theme: {
      name: 'y',
      colors: {
        primary: '#c0392b',
        primaryAlt: '#e74c3c',
        accent: '#3498db',
        background: '#0d1018',
        card: '#161b27',
        text: '#e8ecf4',
        border: '#262d3d'
      }
    },
    tips: [
      { content: 'Mega Evolutions swing battles—plan your team around one.', category: 'strategy' },
      { content: 'Use O-Powers to boost capture and XP during grinds.', category: 'general' },
      { content: 'Farm Berry fields near Camphrier Town for cash and items.', category: 'items' }
    ],
    faqs: [
      { question: 'How do I unlock Mega Evolution?', answer: 'Defeat Korrina in Shalour City to receive the Mega Ring and a stone.' },
      { question: 'Where is the EXP Share?', answer: 'Earn it automatically from Alexa after your first badge.' }
    ]
  }
];

const MOD_ASSIGNMENTS = {
  'mod@retrohub.test': ['pokemon-fire-red', 'pokemon-emerald'],
};

// Sample Posts for Games
const POST_TEMPLATES = [
  { content: 'Just beat this game for the first time! What an experience!', isSpoiler: false },
  { content: 'Anyone have tips for the final boss? I keep dying', isSpoiler: false },
  { content: 'This game was so ahead of its time. Still holds up today!', isSpoiler: false },
  { content: 'Found a secret area I never knew about after 20 years!', isSpoiler: false },
  { content: 'The music in this game is absolutely legendary', isSpoiler: false },
  { content: 'Doing a speedrun attempt. Current best time is...', isSpoiler: false },
  { content: 'Replaying this on original hardware. The nostalgia is real!', isSpoiler: false },
  { content: 'Who else spent hours grinding in the first area?', isSpoiler: false }
];

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

async function clearDatabase() {
  console.log('\n🗑️  Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Game.deleteMany({}),
    Tip.deleteMany({}),
    FAQ.deleteMany({}),
    Post.deleteMany({}),
    Reply.deleteMany({})
  ]);
  console.log('✅ Database cleared');
}

async function createUsers() {
  console.log('\n👥 Creating users...');
  const createdUsers = [];
  
  for (const userData of USERS) {
    // Check if user already exists
    const existing = await User.findOne({ email: userData.email });
    if (existing) {
      let updated = false;
      if (userData.role && existing.role !== userData.role) {
        existing.role = userData.role;
        updated = true;
      }
      if (userData.avatarUrl && existing.avatarUrl !== userData.avatarUrl) {
        existing.avatarUrl = userData.avatarUrl;
        updated = true;
      }
      if (updated) {
        await existing.save();
        console.log(`   🔄 Updated: ${existing.username}`);
      } else {
        console.log(`   ⏭️  Skipped: ${userData.username} (already exists)`);
      }
      createdUsers.push(existing);
      continue;
    }
    
    const user = await User.create({
      username: userData.username,
      email: userData.email,
      passwordHash: userData.password,
      avatarUrl: userData.avatarUrl,
      role: userData.role || 'user'
    });
    createdUsers.push(user);
    console.log(`   ✅ Created: ${user.username}`);
  }
  
  return createdUsers;
}

async function createGames() {
  console.log('\n🎮 Creating games...');
  const createdGames = [];
  
  for (const gameData of GAMES) {
    const { tips, faqs, ...gameFields } = gameData;
    
    // Upsert game to avoid duplicates
    const game = await Game.findOneAndUpdate(
      { slug: gameFields.slug },
      { $set: gameFields },
      { upsert: true, new: true, runValidators: true }
    );
    
    createdGames.push(game);
    console.log(`   ✅ Ensured: ${game.title}`);
    
    // Update tips (clear existing for this game first)
    if (tips && tips.length > 0) {
      await Tip.deleteMany({ gameId: game._id });
      const tipDocs = tips.map(tip => ({
        gameId: game._id,
        ...tip
      }));
      await Tip.insertMany(tipDocs);
      console.log(`      📝 Added ${tips.length} tips`);
    }
    
    // Update FAQs
    if (faqs && faqs.length > 0) {
      await FAQ.deleteMany({ gameId: game._id });
      const faqDocs = faqs.map(faq => ({
        gameId: game._id,
        ...faq
      }));
      await FAQ.insertMany(faqDocs);
      console.log(`      ❓ Added ${faqs.length} FAQs`);
    }
  }
  
  return createdGames;
}

async function createPosts(users, games) {
  console.log('\n💬 Creating community posts...');
  let totalPosts = 0;
  
  for (const game of games) {
    const numPosts = Math.floor(Math.random() * 3) + 2; // 2-4 posts per game
    
    for (let i = 0; i < numPosts; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomTemplate = POST_TEMPLATES[Math.floor(Math.random() * POST_TEMPLATES.length)];
      
      await Post.create({
        gameId: game._id,
        userId: randomUser._id,
        content: randomTemplate.content,
        isSpoiler: randomTemplate.isSpoiler
      });
      
      totalPosts++;
    }
    
    console.log(`   ✅ ${numPosts} posts created for ${game.title}`);
  }
  
  console.log(`\n✅ Total posts created: ${totalPosts}`);
}

async function assignModerators(users, games) {
  console.log('\n🛡️  Assigning moderators to games...');

  const usersByEmail = users.reduce((acc, user) => {
    acc[user.email] = user;
    return acc;
  }, {});

  const gamesBySlug = games.reduce((acc, game) => {
    acc[game.slug] = game;
    return acc;
  }, {});

  for (const [email, slugs] of Object.entries(MOD_ASSIGNMENTS)) {
    const user = usersByEmail[email] || await User.findOne({ email });
    if (!user) {
      console.log(`   ⚠️  No user found for ${email}`);
      continue;
    }

    const current = new Set((user.moderatedGames || []).map(id => id.toString()));
    let added = 0;

    slugs.forEach(slug => {
      const game = gamesBySlug[slug];
      if (!game) return;
      const gameId = game._id.toString();
      if (!current.has(gameId)) {
        current.add(gameId);
        added++;
      }
    });

    if (added > 0) {
      user.moderatedGames = Array.from(current);
      await user.save();
      console.log(`   ✅ ${user.username} assigned to ${added} game(s)`);
    } else {
      console.log(`   ⏭️  No new assignments for ${user.username}`);
    }
  }
}

async function updateExistingGames() {
  console.log('\n🔄 Updating Pokémon game titles...');
  
  // Remove "Y Version" and similar suffixes
  const updates = [
    { old: 'Pokémon Fire Red', new: 'Pokémon Fire Red' }, // Already good
    { old: 'Pokémon Y', new: 'Pokémon Y' } // Remove "Version" if it exists
  ];
  
  // Find and update Pokémon Y if it has "Version" in description or title
  const pokemonY = await Game.findOne({ slug: 'pokemon-y' });
  if (pokemonY && pokemonY.description && pokemonY.description.includes('Y Version')) {
    pokemonY.description = pokemonY.description.replace('Y Version', '');
    await pokemonY.save();
    console.log('   ✅ Cleaned up Pokémon Y description');
  }
}

async function main() {
  console.log('🚀 RetroHub Database Seeder - Users & Posts\n');
  console.log('══════════════════════════════════════════════════\n');
  
  await connectDB();
  
  console.log('⚠️  Adding new data without clearing existing games...\n');
  
  // Create users
  const users = await createUsers();
  
  // Create new classic games
  await createGames();
  
  // Create posts for ALL games (existing + new)
  const allGames = await Game.find({});
  await assignModerators(users, allGames);
  await createPosts(users, allGames);
  
  // Clean up game titles
  await updateExistingGames();
  
  console.log('\n══════════════════════════════════════════════════');
  console.log('✨ Database seeding complete!\n');
  console.log('📌 User Accounts Created:');
  users.forEach(u => console.log(`   - ${u.username}: ${u.email}`));
  console.log('\n🎮 Games: ' + (await Game.countDocuments()) + ' total');
  console.log('💬 Posts: ' + (await Post.countDocuments()) + ' total');
  console.log('\n🎉 Ready to go!');
  
  process.exit(0);
}

main().catch(err => {
  console.error('\n❌ Seeding failed:', err);
  process.exit(1);
});
