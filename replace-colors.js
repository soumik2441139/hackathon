const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'opushire', 'app', 'dashboard', 'student', 'page.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// Replace backgrounds
content = content.replace(/from-\[#0B0D17\] to-\[#05050A\]/g, 'from-[#1E1E24] to-[#121214]');
content = content.replace(/bg-\[#0B0D17\]/g, 'bg-[#18181B]');
content = content.replace(/bg-\[#05050A\]\/50/g, 'bg-[#18181B]/80');
content = content.replace(/bg-\[#05050A\]/g, 'bg-[#18181B]');

// Replace cyan -> orange
content = content.replace(/brand-cyan/g, 'orange-500');
content = content.replace(/text-orange-500/g, 'text-orange-400'); // Slightly brighter text

// Replace violet -> red/yellow
content = content.replace(/brand-violet/g, 'yellow-500');
content = content.replace(/text-yellow-500/g, 'text-yellow-400');
content = content.replace(/from-yellow-400 via-orange-500 to-yellow-400/g, 'from-red-500 via-orange-500 to-yellow-500');

// Replace glow colors
content = content.replace(/rgba\(0,240,255,/g, 'rgba(249,115,22,');
content = content.replace(/rgba\(138,43,226,/g, 'rgba(234,179,8,');

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Colors replaced in page.tsx');
