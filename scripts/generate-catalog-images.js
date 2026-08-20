#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'src', 'assets', 'vendei', 'catalog');

const CATEGORIES = {
  supermarket: {
    'Beverages': { bg: '#e8f5e9', accent: '#2e7d32', icon: '🥤' },
    'Dairy': { bg: '#e3f2fd', accent: '#1565c0', icon: '🥛' },
    'Snacks': { bg: '#fff3e0', accent: '#e65100', icon: '🍿' },
    'Groceries': { bg: '#f1f8e9', accent: '#558b2f', icon: '🛒' },
    'Cleaning': { bg: '#e0f7fa', accent: '#00838f', icon: '🧹' },
  },
  'chicken-store': {
    'Whole Chicken': { bg: '#fff8e1', accent: '#f57f17', icon: '🍗' },
    'Chicken Cuts': { bg: '#fbe9e7', accent: '#d84315', icon: '🍖' },
    'Combos': { bg: '#fce4ec', accent: '#c62828', icon: '🍱' },
    'Sides': { bg: '#f3e5f5', accent: '#7b1fa2', icon: '🍟' },
    'Sauces': { bg: '#e8eaf6', accent: '#283593', icon: '🫙' },
  },
  hardware: {
    'Tools': { bg: '#efebe9', accent: '#4e342e', icon: '🔧' },
    'Fasteners': { bg: '#eceff1', accent: '#37474f', icon: '🔩' },
    'Building': { bg: '#d7ccc8', accent: '#5d4037', icon: '🧱' },
    'Electrical': { bg: '#fff9c4', accent: '#f9a825', icon: '💡' },
    'Paint': { bg: '#e1f5fe', accent: '#0277bd', icon: '🎨' },
  },
  'auto-parts': {
    'Engine': { bg: '#e8eaf6', accent: '#1a237e', icon: '⚙️' },
    'Brakes': { bg: '#fce4ec', accent: '#b71c1c', icon: '🔴' },
    'Electrical': { bg: '#fffde7', accent: '#f57f17', icon: '🔋' },
    'Fluids': { bg: '#e0f2f1', accent: '#00695c', icon: '🧴' },
    'Accessories': { bg: '#f3e5f5', accent: '#6a1b9a', icon: '🛡️' },
  },
  bakery: {
    'Breads': { bg: '#fff8e1', accent: '#ff8f00', icon: '🍞' },
    'Pastries': { bg: '#fbe9e7', accent: '#e64a19', icon: '🥐' },
    'Cakes': { bg: '#fce4ec', accent: '#ad1457', icon: '🎂' },
    'Cookies': { bg: '#f1f8e9', accent: '#689f38', icon: '🍪' },
    'Beverages': { bg: '#efebe9', accent: '#5d4037', icon: '☕' },
  },
};

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function generateSvg(name, categoryName, profileSlug) {
  const profile = CATEGORIES[profileSlug];
  const cat = profile[categoryName] || { bg: '#f5f5f5', accent: '#666', icon: '📦' };

  const lines = name.split(' ');
  let nameLine1 = lines.slice(0, Math.ceil(lines.length / 2)).join(' ');
  let nameLine2 = lines.slice(Math.ceil(lines.length / 2)).join(' ');
  if (lines.length <= 1) { nameLine1 = name; nameLine2 = ''; }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${cat.bg};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ffffff;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${cat.accent};stop-opacity:0.15" />
      <stop offset="100%" style="stop-color:${cat.accent};stop-opacity:0.05" />
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000" flood-opacity="0.08"/>
    </filter>
  </defs>

  <rect width="512" height="512" rx="24" fill="url(#bg)"/>
  <rect x="16" y="16" width="480" height="480" rx="16" fill="url(#accent)"/>

  <circle cx="256" cy="190" r="100" fill="white" opacity="0.6" filter="url(#shadow)"/>
  <text x="256" y="210" text-anchor="middle" font-size="96" dominant-baseline="central">${cat.icon}</text>

  <rect x="60" y="330" width="392" height="1" fill="${cat.accent}" opacity="0.2"/>

  <text x="256" y="380" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="26" font-weight="600" fill="#1e293b">
    ${escapeXml(nameLine1)}
  </text>
  ${nameLine2 ? `<text x="256" y="414" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="500" fill="#475569">
    ${escapeXml(nameLine2)}
  </text>` : ''}

  <rect x="120" y="450" width="272" height="28" rx="14" fill="${cat.accent}" opacity="0.12"/>
  <text x="256" y="469" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="500" fill="${cat.accent}" opacity="0.7">${escapeXml(categoryName)}</text>
</svg>`;
}

const products = {
  supermarket: [
    { name: 'Coca Cola 2L', cat: 'Beverages', slug: 'coca-cola-2l' },
    { name: 'Pepsi 2L', cat: 'Beverages', slug: 'pepsi-2l' },
    { name: 'Milk 1L', cat: 'Dairy', slug: 'milk-1l' },
    { name: 'Cheddar Cheese 200g', cat: 'Dairy', slug: 'cheddar-cheese-200g' },
    { name: 'Yogurt 500ml', cat: 'Dairy', slug: 'yogurt-500ml' },
    { name: 'Potato Chips 150g', cat: 'Snacks', slug: 'potato-chips-150g' },
    { name: 'Chocolate Cookies 200g', cat: 'Snacks', slug: 'chocolate-cookies-200g' },
    { name: 'Rice 1kg', cat: 'Groceries', slug: 'rice-1kg' },
    { name: 'Sugar 1kg', cat: 'Groceries', slug: 'sugar-1kg' },
    { name: 'Cooking Oil 1L', cat: 'Groceries', slug: 'cooking-oil-1l' },
    { name: 'Spaghetti 500g', cat: 'Groceries', slug: 'spaghetti-500g' },
    { name: 'Bread Loaf', cat: 'Groceries', slug: 'bread-loaf' },
    { name: 'Laundry Detergent 1L', cat: 'Cleaning', slug: 'laundry-detergent-1l' },
    { name: 'Toilet Paper 4-pack', cat: 'Cleaning', slug: 'toilet-paper-4-pack' },
    { name: 'Dish Soap 500ml', cat: 'Cleaning', slug: 'dish-soap-500ml' },
  ],
  'chicken-store': [
    { name: 'Whole Chicken', cat: 'Whole Chicken', slug: 'whole-chicken' },
    { name: 'Grilled Chicken', cat: 'Whole Chicken', slug: 'grilled-chicken' },
    { name: 'Chicken Breast', cat: 'Chicken Cuts', slug: 'chicken-breast' },
    { name: 'Chicken Wings', cat: 'Chicken Cuts', slug: 'chicken-wings' },
    { name: 'Chicken Thigh', cat: 'Chicken Cuts', slug: 'chicken-thigh' },
    { name: 'Chicken Fillet', cat: 'Chicken Cuts', slug: 'chicken-fillet' },
    { name: 'Chicken Combo', cat: 'Combos', slug: 'chicken-combo' },
    { name: 'Family Chicken Combo', cat: 'Combos', slug: 'family-chicken-combo' },
    { name: 'Kids Combo', cat: 'Combos', slug: 'kids-combo' },
    { name: 'French Fries', cat: 'Sides', slug: 'french-fries' },
    { name: 'Coleslaw', cat: 'Sides', slug: 'coleslaw' },
    { name: 'Mashed Potatoes', cat: 'Sides', slug: 'mashed-potatoes' },
    { name: 'Spicy Sauce', cat: 'Sauces', slug: 'spicy-sauce' },
    { name: 'BBQ Sauce', cat: 'Sauces', slug: 'bbq-sauce' },
    { name: 'Garlic Sauce', cat: 'Sauces', slug: 'garlic-sauce' },
  ],
  hardware: [
    { name: 'Hammer', cat: 'Tools', slug: 'hammer' },
    { name: 'Screwdriver Set', cat: 'Tools', slug: 'screwdriver-set' },
    { name: 'Pliers', cat: 'Tools', slug: 'pliers' },
    { name: 'Tape Measure 5m', cat: 'Tools', slug: 'tape-measure-5m' },
    { name: 'Screws Assorted 100pc', cat: 'Fasteners', slug: 'screws-assorted-100pc' },
    { name: 'Nails 1kg', cat: 'Fasteners', slug: 'nails-1kg' },
    { name: 'Bolts M8 50pc', cat: 'Fasteners', slug: 'bolts-m8-50pc' },
    { name: 'Cement 50kg', cat: 'Building', slug: 'cement-50kg' },
    { name: 'Brick (standard)', cat: 'Building', slug: 'brick-standard' },
    { name: 'PVC Pipe 1m', cat: 'Building', slug: 'pvc-pipe-1m' },
    { name: 'Electrical Cable 10m', cat: 'Electrical', slug: 'electrical-cable-10m' },
    { name: 'Light Bulb LED 9W', cat: 'Electrical', slug: 'light-bulb-led-9w' },
    { name: 'Paint White 1L', cat: 'Paint', slug: 'paint-white-1l' },
    { name: 'Paint Roller Set', cat: 'Paint', slug: 'paint-roller-set' },
    { name: 'Sandpaper 10-pack', cat: 'Paint', slug: 'sandpaper-10-pack' },
  ],
  'auto-parts': [
    { name: 'Engine Oil 5W30 4L', cat: 'Engine', slug: 'engine-oil-5w30-4l' },
    { name: 'Oil Filter', cat: 'Engine', slug: 'oil-filter' },
    { name: 'Air Filter', cat: 'Engine', slug: 'air-filter' },
    { name: 'Spark Plug Set 4pc', cat: 'Engine', slug: 'spark-plug-set-4pc' },
    { name: 'Brake Pads Front', cat: 'Brakes', slug: 'brake-pads-front' },
    { name: 'Brake Pads Rear', cat: 'Brakes', slug: 'brake-pads-rear' },
    { name: 'Brake Disc Front', cat: 'Brakes', slug: 'brake-disc-front' },
    { name: 'Car Battery 12V 60Ah', cat: 'Electrical', slug: 'car-battery-12v-60ah' },
    { name: 'Headlight Bulb H4', cat: 'Electrical', slug: 'headlight-bulb-h4' },
    { name: 'Tail Light Bulb', cat: 'Electrical', slug: 'tail-light-bulb' },
    { name: 'Coolant 1L', cat: 'Fluids', slug: 'coolant-1l' },
    { name: 'Brake Fluid 500ml', cat: 'Fluids', slug: 'brake-fluid-500ml' },
    { name: 'Washer Fluid 1L', cat: 'Fluids', slug: 'washer-fluid-1l' },
    { name: 'Wiper Blades Pair', cat: 'Accessories', slug: 'wiper-blades-pair' },
    { name: 'Seat Cover Set', cat: 'Accessories', slug: 'seat-cover-set' },
  ],
  bakery: [
    { name: 'French Bread', cat: 'Breads', slug: 'french-bread' },
    { name: 'White Bread Loaf', cat: 'Breads', slug: 'white-bread-loaf' },
    { name: 'Whole Wheat Bread', cat: 'Breads', slug: 'whole-wheat-bread' },
    { name: 'Croissant', cat: 'Pastries', slug: 'croissant' },
    { name: 'Cheese Pastry', cat: 'Pastries', slug: 'cheese-pastry' },
    { name: 'Apple Pie Slice', cat: 'Pastries', slug: 'apple-pie-slice' },
    { name: 'Ham & Cheese Pastry', cat: 'Pastries', slug: 'ham-cheese-pastry' },
    { name: 'Chocolate Cake', cat: 'Cakes', slug: 'chocolate-cake' },
    { name: 'Vanilla Cake', cat: 'Cakes', slug: 'vanilla-cake' },
    { name: 'Tres Leches Cake', cat: 'Cakes', slug: 'tres-leches-cake' },
    { name: 'Cookies Assorted 6pc', cat: 'Cookies', slug: 'cookies-assorted-6pc' },
    { name: 'Muffin Blueberry', cat: 'Cookies', slug: 'muffin-blueberry' },
    { name: 'Donut Glazed', cat: 'Cookies', slug: 'donut-glazed' },
    { name: 'Coffee Regular', cat: 'Beverages', slug: 'coffee-regular' },
    { name: 'Hot Chocolate', cat: 'Beverages', slug: 'hot-chocolate' },
  ],
};

let total = 0;
for (const [profileSlug, items] of Object.entries(products)) {
  const dir = path.join(ASSETS_DIR, profileSlug);
  fs.mkdirSync(dir, { recursive: true });
  for (const p of items) {
    const svg = generateSvg(p.name, p.cat, profileSlug);
    fs.writeFileSync(path.join(dir, `${p.slug}.svg`), svg, 'utf8');
    total++;
  }
  console.log(`${profileSlug}: ${items.length} images created`);
}
console.log(`Total: ${total} product images created`);
