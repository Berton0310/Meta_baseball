const fs = require('fs');
const path = require('path');

const players = JSON.parse(fs.readFileSync('src/data/players.json', 'utf8'));
const imageFiles = fs.readdirSync('public/images/players').filter(f => f.endsWith('.png'));

function cleanStr(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const map = {};

players.forEach(p => {
  const pNameClean = cleanStr(p.name);
  const pTeamClean = cleanStr(p.team);
  
  let bestMatch = null;
  let bestScore = -1;

  for (const file of imageFiles) {
    const fileClean = cleanStr(file.replace('.png', ''));
    
    // Exact match on cleaned string (team + name)
    if (fileClean === pTeamClean + pNameClean || fileClean === pTeamClean + 's' + pNameClean) {
      bestMatch = file;
      break;
    }
    
    // Score based matching if exact fails
    let score = 0;
    if (fileClean.includes(pNameClean)) score += 10;
    if (fileClean.includes(pTeamClean)) score += 5;
    
    // Parts match
    const nameParts = p.name.toLowerCase().split(/[\s'-.]+/);
    nameParts.forEach(part => {
      if (part.length > 2 && fileClean.includes(part)) score += 2;
    });

    if (score > bestScore) {
      bestScore = score;
      bestMatch = file;
    }
  }

  if (bestMatch && bestScore > 0) {
    map[`${p.team}-${p.name}`] = `/images/players/${bestMatch}`;
  }
});

fs.writeFileSync('src/data/playerImageMap.json', JSON.stringify(map, null, 2));
console.log('Image map generated!');
