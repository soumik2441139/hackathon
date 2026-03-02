const fs = require('fs');
const path = require('path');

const targetPage = path.join(__dirname, 'opushire', 'app', 'dashboard', 'student', 'page.tsx');
let pageContent = fs.readFileSync(targetPage, 'utf8');

// The user wants the Deep Teal background: #006078
pageContent = pageContent.replace(/bg-\[var\(--background\)\]/g, 'bg-[#006078]');
pageContent = pageContent.replace(/from-brand-dark to-\[#05050A\]/g, 'from-[#004f63] to-[#003b4a]');

// Avatars, Banners, Glows to Orange / Yellow
pageContent = pageContent.replace(/bg-brand-dark/g, 'bg-[#004354]');
pageContent = pageContent.replace(/brand-primary/g, 'orange-500');
pageContent = pageContent.replace(/text-brand-primary/g, 'text-orange-400');
pageContent = pageContent.replace(/brand-secondary/g, 'yellow-500');
pageContent = pageContent.replace(/text-brand-secondary/g, 'text-yellow-400');
pageContent = pageContent.replace(/from-brand-violet via-brand-primary to-brand-violet/g, 'from-red-500 via-orange-500 to-yellow-500');
pageContent = pageContent.replace(/rgba\(0,240,255,/g, 'rgba(249,115,22,');
pageContent = pageContent.replace(/rgba\(138,43,226,/g, 'rgba(234,179,8,');

fs.writeFileSync(targetPage, pageContent, 'utf8');


const trackerPage = path.join(__dirname, 'opushire', 'components', 'dashboard', 'ApplicationTracker.tsx');
let trackerContent = fs.readFileSync(trackerPage, 'utf8');
trackerContent = trackerContent.replace(/brand-primary/g, 'orange-500');
trackerContent = trackerContent.replace(/text-brand-primary/g, 'text-orange-400');
trackerContent = trackerContent.replace(/bg-brand-cyan\/20/g, 'bg-orange-500/20');
trackerContent = trackerContent.replace(/border-brand-cyan\/40/g, 'border-orange-500/40');
trackerContent = trackerContent.replace(/text-brand-cyan/g, 'text-orange-500');
trackerContent = trackerContent.replace(/brand-violet/g, 'red-500');
trackerContent = trackerContent.replace(/text-brand-violet/g, 'text-red-400');
trackerContent = trackerContent.replace(/rgba\(0,240,255,/g, 'rgba(249,115,22,');
trackerContent = trackerContent.replace(/rgba\(138,43,226,/g, 'rgba(239,68,68,');
trackerContent = trackerContent.replace(/brand-secondary/g, 'yellow-500');
fs.writeFileSync(trackerPage, trackerContent, 'utf8');


const savedPage = path.join(__dirname, 'opushire', 'components', 'dashboard', 'SavedJobs.tsx');
let savedContent = fs.readFileSync(savedPage, 'utf8');
savedContent = savedContent.replace(/brand-secondary/g, 'yellow-500');
fs.writeFileSync(savedPage, savedContent, 'utf8');

console.log('Teal and Orange specifically applied to student dashboard components.');
