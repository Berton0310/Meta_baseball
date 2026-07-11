import json

with open('data_extract/投手資料.json', 'r', encoding='utf-8') as f:
    pitchers_raw = json.load(f)

# Create a lookup for pitchers by name
pitcher_lookup = {}
for p in pitchers_raw:
    name = p.get('球員')
    if name:
        pitcher_lookup[name] = p

with open('frontend/src/data/players.json', 'r', encoding='utf-8') as f:
    players = json.load(f)

for p in players:
    if p.get('isPitcher'):
        name = p.get('name')
        raw_p = pitcher_lookup.get(name)
        if raw_p:
            pos_str = str(raw_p.get('位置', ''))
            pos_parts = [x.strip() for x in pos_str.split('/') if x.strip() and x.strip() != '-']
            
            if pos_parts:
                p['primaryPosition'] = pos_parts[0]
                if len(pos_parts) > 1:
                    p['secondaryPositions'] = pos_parts[1:]
                else:
                    p['secondaryPositions'] = []
            else:
                p['primaryPosition'] = ''
                p['secondaryPositions'] = []
            
            # Fix arm angle which was mapped from '出手點' but is actually '出手'
            if p.get('pitching'):
                p['pitching']['armAngle'] = raw_p.get('出手', 'Mid')

with open('frontend/src/data/players.json', 'w', encoding='utf-8') as f:
    json.dump(players, f, ensure_ascii=False, indent=2)

print("Fixed pitcher positions and arm angles.")
