const fs = require('fs');
const path = require('path');

const srcImagesDir = path.join(__dirname, '..', 'data_extract', 'SMB Player Cards (High Res)');
const destImagesDir = path.join(__dirname, '..', 'frontend', 'public', 'images', 'players');
const playersFile = path.join(__dirname, '..', 'frontend', 'src', 'data', 'players.json');
const mapFile = path.join(__dirname, '..', 'frontend', 'src', 'data', 'playerImageMap.json');

if (!fs.existsSync(destImagesDir)) {
    fs.mkdirSync(destImagesDir, { recursive: true });
}

const players = JSON.parse(fs.readFileSync(playersFile, 'utf8'));
const oldMap = JSON.parse(fs.readFileSync(mapFile, 'utf8'));
const availableFiles = fs.readdirSync(srcImagesDir).filter(f => f.endsWith('.png'));

const teamMap = {
  'Sandcats': 'sand_cats',
  'Wild Pigs': 'wild_pigs',
  'Hot Corners': 'hot_corners'
};

const imageMap = {};
let missingCount = 0;
let matchedCount = 0;
let fallbackCount = 0;

players.forEach(p => {
    const key = `${p.team}-${p.name}`;
    
    let normalizedTeam = teamMap[p.team] || p.team.toLowerCase().replace(/\s+/g, '_');
    
    const normalizedName = p.name.toLowerCase()
        .replace(/['.]/g, '_')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_');
        
    const expectedName1 = `${normalizedTeam}-${normalizedName}.png`;
    const expectedName2 = `${normalizedTeam.replace('_', '')}-${normalizedName}.png`;

    let matchedFile = availableFiles.find(f => f === expectedName1 || f === expectedName2);
    
    if (!matchedFile) {
        const nameParts = normalizedName.split('_');
        const lastName = nameParts[nameParts.length - 1];
        matchedFile = availableFiles.find(f => f.startsWith(normalizedTeam) && f.includes(lastName));
        
        if (!matchedFile) {
            matchedFile = availableFiles.find(f => f.includes(lastName));
        }
    }

    if (matchedFile) {
        const srcPath = path.join(srcImagesDir, matchedFile);
        const destPath = path.join(destImagesDir, matchedFile);
        if (!fs.existsSync(destPath)) {
            fs.copyFileSync(srcPath, destPath);
        }
        imageMap[key] = `/images/players/${matchedFile}`;
        matchedCount++;
    } else {
        // Fallback to old map if we can't auto-match
        if (oldMap[key]) {
            imageMap[key] = oldMap[key];
            fallbackCount++;
            matchedCount++;
        } else {
            console.log(`Missing image for: ${key}`);
            missingCount++;
        }
    }
});

fs.writeFileSync(mapFile, JSON.stringify(imageMap, null, 2));

console.log(`\nMatch complete! Auto-matched: ${matchedCount - fallbackCount}, Fallback old map: ${fallbackCount}, Missing: ${missingCount}`);
