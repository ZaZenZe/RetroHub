'use strict';

require('dotenv').config();
const { connectWithRetry, mongoose } = require('../backend/shared/db');
const Game = require('../backend/shared/models/Game');
const Tip = require('../backend/shared/models/Tip');
const FAQ = require('../backend/shared/models/FAQ');

const FORCE_CLEAR = process.argv.includes('--force');

const gamesToAdd = [
  {
    slug: 'pokemon-fire-red',
    title: 'Pokemon Fire Red',
    platform: 'GBA',
    releaseYear: 2004,
    coverImageUrl: 'https://static.retrohub.local/pokemon-fire-red.jpg',
    heroImageUrl: 'https://static.retrohub.local/pokemon-fire-red-hero.jpg',
    hoverImageUrl: 'https://static.retrohub.local/pokemon-fire-red-hero.jpg',
    description: 'Return to Kanto in this enhanced remake with wireless trading and Sevii Islands.',
    region: 'Global',
  },
  {
    slug: 'pokemon-emerald',
    title: 'Pokemon Emerald',
    platform: 'GBA',
    releaseYear: 2005,
    coverImageUrl: 'https://static.retrohub.local/pokemon-emerald.jpg',
    heroImageUrl: 'https://static.retrohub.local/pokemon-emerald-hero.jpg',
    hoverImageUrl: 'https://static.retrohub.local/pokemon-emerald-hero.jpg',
    description: 'Hoenn adventure featuring both Team Magma and Aqua and the Battle Frontier.',
    region: 'Global',
  },
  {
    slug: 'pokemon-heart-gold',
    title: 'Pokemon Heart Gold',
    platform: 'DS',
    releaseYear: 2009,
    coverImageUrl: 'https://static.retrohub.local/pokemon-heart-gold.jpg',
    heroImageUrl: 'https://static.retrohub.local/pokemon-heart-gold-hero.jpg',
    hoverImageUrl: 'https://static.retrohub.local/pokemon-heart-gold-hero.jpg',
    description: 'Johto remake with updated mechanics, follower Pokemon, and Pokewalker support.',
    region: 'Global',
  },
  {
    slug: 'pokemon-platinum',
    title: 'Pokemon Platinum',
    platform: 'DS',
    releaseYear: 2008,
    coverImageUrl: 'https://static.retrohub.local/pokemon-platinum.jpg',
    heroImageUrl: 'https://static.retrohub.local/pokemon-platinum-hero.jpg',
    hoverImageUrl: 'https://static.retrohub.local/pokemon-platinum-hero.jpg',
    description: 'Enhanced Sinnoh journey featuring the Distortion World and expanded roster.',
    region: 'Global',
  },
  {
    slug: 'pokemon-black-2',
    title: 'Pokemon Black 2',
    platform: 'DS',
    releaseYear: 2012,
    coverImageUrl: 'https://static.retrohub.local/pokemon-black-2.jpg',
    heroImageUrl: 'https://static.retrohub.local/pokemon-black-2-hero.jpg',
    hoverImageUrl: 'https://static.retrohub.local/pokemon-black-2-hero.jpg',
    description: 'Direct sequel in Unova with new locations, Kyurem forms, and key system updates.',
    region: 'Global',
  },
  {
    slug: 'pokemon-y',
    title: 'Pokemon Y',
    platform: '3DS',
    releaseYear: 2013,
    coverImageUrl: 'https://static.retrohub.local/pokemon-y.jpg',
    heroImageUrl: 'https://static.retrohub.local/pokemon-y-hero.jpg',
    hoverImageUrl: 'https://static.retrohub.local/pokemon-y-hero.jpg',
    description: 'Kalos region adventure introducing Mega Evolution and full 3D battles.',
    region: 'Global',
  },
];

const tipsByTitle = {
  'Pokemon Fire Red': [
    {
      content: 'Pick a starter that eases early gyms (Bulbasaur for Brock and Misty).',
      category: 'strategy',
    },
    {
      content: 'Use the VS Seeker near rich trainers on Route 16 for fast money and XP.',
      category: 'gameplay',
    },
    {
      content: 'Grab the Old Amber in Pewter Museum to revive Aerodactyl later.',
      category: 'items',
    },
    {
      content: 'Save the Master Ball for roaming legendaries like the legendary birds.',
      category: 'general',
    },
  ],
  'Pokemon Emerald': [
    {
      content: 'Switch to the Mach Bike to clear the Sky Pillar gaps before facing Rayquaza.',
      category: 'gameplay',
    },
    {
      content: 'Use the Acro Bike tricks to access hidden items on Route 119 and Safari Zone.',
      category: 'items',
    },
    {
      content: 'Train a balanced team for the Battle Frontier; status moves win long sets.',
      category: 'strategy',
    },
    {
      content: 'Catch Rayquaza before the Elite Four to cover Dragon threats.',
      category: 'general',
    },
  ],
  'Pokemon Heart Gold': [
    {
      content: 'Let your lead Pokemon follow you to boost friendship gains as you walk.',
      category: 'gameplay',
    },
    {
      content: 'Use Headbutt in forests for early Bug and Flying types with good coverage.',
      category: 'strategy',
    },
    {
      content: 'Stock up on Burn Heals and Ice Heals for the Pryce and Clair gyms.',
      category: 'items',
    },
    {
      content: 'Bring an Electric or Rock type for the Red Gyarados at Lake of Rage.',
      category: 'general',
    },
  ],
  'Pokemon Platinum': [
    {
      content: 'Prioritize a diverse party before entering the Distortion World puzzles.',
      category: 'strategy',
    },
    {
      content: 'Use the Vs. Seeker on Route 206 and 222 for efficient leveling.',
      category: 'gameplay',
    },
    {
      content: 'Get the Vs. Recorder and focus on speed control for the Battle Frontier.',
      category: 'general',
    },
    { content: 'Catch Rotom forms on Fridays after the Old Chateau TV event.', category: 'items' },
  ],
  'Pokemon Black 2': [
    {
      content: 'Use Join Avenue shops daily for fast training and item discounts.',
      category: 'gameplay',
    },
    {
      content: 'Tackle the Hidden Grottos for rare abilities like Multiscale Dragonite.',
      category: 'strategy',
    },
    {
      content: 'Bring Electric and Ice coverage for Drayden and the Plasma Frigate fights.',
      category: 'general',
    },
    {
      content: 'Use the Medal system as a guide for optional challenges and rewards.',
      category: 'items',
    },
  ],
  'Pokemon Y': [
    {
      content: 'Mega Evolutions swing battles; build around your chosen Mega early.',
      category: 'strategy',
    },
    {
      content: 'Roller skate tricks open shortcuts in Lumiose—practice parallel swerves.',
      category: 'gameplay',
    },
    {
      content: 'Use O-Powers to boost capture and XP rates during story grinds.',
      category: 'general',
    },
    {
      content: 'Farm Berry fields near Camphrier Town for money and battle items.',
      category: 'items',
    },
  ],
};

const faqsByTitle = {
  'Pokemon Fire Red': [
    {
      question: 'How do I reach the Sevii Islands?',
      answer:
        'Defeat Blaine and get the Tri-Pass; use the ferry in Vermilion to sail to One Island.',
    },
    {
      question: 'Where do I find the EXP Share?',
      answer: "Show 50 caught Pokemon to Professor Oak's aide on Route 15 to receive it.",
    },
  ],
  'Pokemon Emerald': [
    {
      question: 'How do I unlock the Battle Frontier?',
      answer: 'Beat the Elite Four and Champion; Scott will invite you and give the Frontier Pass.',
    },
    {
      question: 'Can I catch both Groudon and Kyogre?',
      answer:
        'Yes. Fight Team Magma at Magma Hideout for Groudon and Team Aqua in the Seafloor Cavern for Kyogre.',
    },
  ],
  'Pokemon Heart Gold': [
    {
      question: 'How do I evolve Eevee into Espeon or Umbreon?',
      answer: 'Max friendship and level up during the day for Espeon or at night for Umbreon.',
    },
    {
      question: 'Where is the EXP Share?',
      answer:
        "Receive it from Professor Elm's aide after you obtain the Red Scale from the Lake of Rage.",
    },
  ],
  'Pokemon Platinum': [
    {
      question: 'How do I access the Distortion World?',
      answer:
        'Progress the Team Galactic story and follow Cynthia to Spear Pillar; Giratina opens the portal.',
    },
    {
      question: 'Can I get both Dialga and Palkia?',
      answer:
        'Yes. After the National Dex, collect the Adamant and Lustrous Orbs from Celestic Town and visit Spear Pillar.',
    },
  ],
  'Pokemon Black 2': [
    {
      question: 'What is Memory Link?',
      answer: 'Connecting to Black/White save data unlocks flashbacks and adds NPC battles.',
    },
    {
      question: 'How do I get the Shiny Charm?',
      answer:
        'Complete the National Dex (excluding Mythicals) and talk to Professor Juniper in Nuvema Town lab.',
    },
  ],
  'Pokemon Y': [
    {
      question: 'How do I unlock Mega Evolution?',
      answer: 'Defeat Korrina in Shalour City and receive the Mega Ring and a Mega Stone.',
    },
    {
      question: 'Where can I find the EXP Share?',
      answer: 'Get it automatically from Alexa after earning the first badge in Santalune Gym.',
    },
  ],
};

async function ensureConnection() {
  const conn = await connectWithRetry();
  if (!conn) {
    throw new Error(
      'Database connection unavailable. Ensure MONGODB_URI is set and ALLOW_OFFLINE_DB is false.'
    );
  }
}

async function clearCollections() {
  console.log('[seed] --force supplied: clearing Game, Tip, and FAQ collections');
  await Promise.all([Tip.deleteMany({}), FAQ.deleteMany({}), Game.deleteMany({})]);
}

async function upsertGames() {
  const map = {};
  for (const game of gamesToAdd) {
    const doc = await Game.findOneAndUpdate(
      { title: game.title },
      { $set: game },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    );
    map[game.title] = doc._id;
    console.log(`[seed] ensured game: ${game.title}`);
  }
  return map;
}

async function seedTipsAndFaqs(gameIds) {
  for (const [title, tips] of Object.entries(tipsByTitle)) {
    const gameId = gameIds[title];
    if (!gameId) continue;
    await Tip.deleteMany({ gameId });
    if (tips && tips.length) {
      const payload = tips.map(tip => ({ ...tip, gameId }));
      await Tip.insertMany(payload);
      console.log(`[seed] inserted ${payload.length} tips for ${title}`);
    }
  }

  for (const [title, faqs] of Object.entries(faqsByTitle)) {
    const gameId = gameIds[title];
    if (!gameId) continue;
    await FAQ.deleteMany({ gameId });
    if (faqs && faqs.length) {
      const payload = faqs.map(faq => ({ ...faq, gameId }));
      await FAQ.insertMany(payload);
      console.log(`[seed] inserted ${payload.length} FAQs for ${title}`);
    }
  }
}

async function main() {
  try {
    await ensureConnection();

    if (FORCE_CLEAR) {
      await clearCollections();
    }

    const gameIds = await upsertGames();
    await seedTipsAndFaqs(gameIds);

    console.log('[seed] complete');
    process.exit(0);
  } catch (err) {
    console.error('[seed] failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

main();
