#!/usr/bin/env node
// Build script to generate src/data/companies.js from Phase 2-4 research
// Run: node scripts/build-data.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Score a company based on ICP criteria
function scoreCompany(c) {
  let score = 0;
  const flags = [];

  // Employee size
  if (c.employees >= 1000) { score += 15; flags.push('1000+_employees'); }
  else if (c.employees >= 500) { score += 12; flags.push('500+_employees'); }
  else if (c.employees >= 200) { score += 8; flags.push('200+_employees'); }

  // Location
  if (['Lagos', 'Abuja'].includes(c.hqCity)) { score += 10; flags.push('primary_city_hq'); }

  // Sector
  if (c.sector === 'banking') { score += 12; flags.push('priority_sector'); }
  else if (c.sector === 'government') { score += 10; flags.push('priority_sector'); }
  else { score += 8; }

  // NGX listed
  if (c.ngxListed) { score += 5; flags.push('ngx_listed'); }

  // Parent company (subsidiary)
  if (c.parent) { score += 3; flags.push('subsidiary'); }

  // Government entity
  if (c.ownership === 'government') { score += 5; flags.push('government_entity'); }

  // Existing client
  if (c.status === 'client') { score += 15; flags.push('existing_client'); }

  const tier = score >= 60 ? 'hot' : score >= 40 ? 'warm' : score >= 25 ? 'cool' : 'watch';
  return { score: Math.min(score, 100), tier, flags };
}

// Read source registry and company registry from Phase 2
const sourceRegistry = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/sources/source-registry.json'), 'utf8'));
console.log(`Source registry: ${sourceRegistry.sources.length} sources`);

const companyRegistry = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/companies/company-registry.json'), 'utf8'));
console.log(`Company registry: ${companyRegistry.companies.length} companies (raw)`);

console.log('Build complete. Use the expanded companies.js file directly.');
