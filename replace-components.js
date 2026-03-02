const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'opushire', 'components', 'dashboard', 'ApplicationTracker.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// Replace cyan -> orange
content = content.replace(/brand-cyan/g, 'orange-500');
content = content.replace(/text-orange-500/g, 'text-orange-400');
content = content.replace(/rgba\(0,240,255,/g, 'rgba(249,115,22,');

// Replace violet -> red
content = content.replace(/brand-violet/g, 'red-500');
content = content.replace(/text-red-500/g, 'text-red-400');
content = content.replace(/rgba\(138,43,226,/g, 'rgba(239,68,68,');

// Replace green to yellow
content = content.replace(/#BEF264/g, 'yellow-400');
content = content.replace(/rgba\(190,242,100,/g, 'rgba(250,204,21,');
content = content.replace(/bg-\[yellow-400\]/g, 'bg-yellow-400');
content = content.replace(/text-\[yellow-400\]/g, 'text-yellow-400');
content = content.replace(/border-\[yellow-400\]/g, 'border-yellow-400');


fs.writeFileSync(targetPath, content, 'utf8');

const targetPath2 = path.join(__dirname, 'opushire', 'components', 'dashboard', 'SavedJobs.tsx');
let content2 = fs.readFileSync(targetPath2, 'utf8');

content2 = content2.replace(/brand-violet/g, 'yellow-500');
content2 = content2.replace(/rgba\(138,43,226,/g, 'rgba(234,179,8,');

fs.writeFileSync(targetPath2, content2, 'utf8');

console.log('Colors replaced in components');
