import json
import pandas as pd
import math

file_path = '../data/Super Mega Baseball 4 Rosters.xlsx'
xls = pd.ExcelFile(file_path)

# Extract League Outline
league_df = pd.read_excel(xls, 'League Outline')
team_info = {}

# Hardcoded mapping from League Outline to avoid complex visual parsing
team_mapping = {
    'Freebooters': ('Super Conference', 'Beast Division'),
    'Herbisaurs': ('Super Conference', 'Beast Division'),
    'Hot Corners': ('Super Conference', 'Beast Division'),
    'Moose': ('Super Conference', 'Beast Division'),
    'Wild Pigs': ('Super Conference', 'Beast Division'),
    
    'Blowfish': ('Super Conference', 'Boss Division'),
    'Moonstars': ('Super Conference', 'Boss Division'),
    'Sandcats': ('Super Conference', 'Boss Division'),
    'Sawteeth': ('Super Conference', 'Boss Division'),
    'Sirloins': ('Super Conference', 'Boss Division'),
    
    'Beewolves': ('Mega Conference', 'Epic Division'),
    'Grapplers': ('Mega Conference', 'Epic Division'),
    'Heaters': ('Mega Conference', 'Epic Division'),
    'Platypi': ('Mega Conference', 'Epic Division'),
    'Wideloads': ('Mega Conference', 'Epic Division'),
    
    'Buzzards': ('Mega Conference', 'Monster Division'),
    'Crocodons': ('Mega Conference', 'Monster Division'),
    'Jacks': ('Mega Conference', 'Monster Division'),
    'Nemesis': ('Mega Conference', 'Monster Division'),
    'Overdogs': ('Mega Conference', 'Monster Division'),
}

# The sheet name for Sand Cats is "Sandcats", but in mapping it might be Sand Cats. We'll handle it.

players = []

def clean_val(v):
    if pd.isna(v): return None
    if isinstance(v, str):
        v = v.strip()
        if v == '-': return None
    return v

for sheet in xls.sheet_names:
    if sheet == 'League Outline':
        continue
        
    team_name = sheet
    conf, div = team_mapping.get(team_name, ("Unknown Conference", "Unknown Division"))
    
    df = pd.read_excel(xls, sheet_name=sheet)
    df.columns = [str(c).strip() for c in df.columns]
    
    for idx, row in df.iterrows():
        name = clean_val(row.get('Name'))
        if not name or str(name) == 'Name':
            continue
            
        p_pos_unnamed = clean_val(row.get('Unnamed: 0'))
        is_pitcher = False
        
        # Check if it's a pitcher based on the first column
        if p_pos_unnamed in ['SP', 'RP', 'CP', 'SP/RP', 'RP/SP']:
            is_pitcher = True
            
        player = {
            "name": name,
            "team": team_name,
            "conference": conf,
            "division": div,
            "rating": clean_val(row.get('Ovr')),
            "bats": clean_val(row.get('Bat')),
            "throws": clean_val(row.get('Thr')),
            "age": clean_val(row.get('Age')),
            "salary": clean_val(row.get('Sal')),
            "chemistry": clean_val(row.get('Chem')),
            "traits": [],
            "stats": {}
        }
        
        t1 = clean_val(row.get('Trait 1'))
        t2 = clean_val(row.get('Trait 2'))
        if t1: player["traits"].append(t1)
        if t2: player["traits"].append(t2)
        
        if is_pitcher:
            pos_str = p_pos_unnamed
            pos_parts = [x.strip() for x in pos_str.split('/') if x.strip()]
            player["primaryPosition"] = pos_parts[0] if pos_parts else ""
            player["secondaryPositions"] = pos_parts[1:] if len(pos_parts) > 1 else []
            player["isPitcher"] = True
            
            player["stats"]["power"] = clean_val(row.get('P.Pos'))
            player["stats"]["contact"] = clean_val(row.get('S.Pos'))
            player["stats"]["speed"] = clean_val(row.get('Pow'))
            player["stats"]["fielding"] = clean_val(row.get('Con'))
            
            player["stats"]["velocity"] = clean_val(row.get('Spd'))
            player["stats"]["junk"] = clean_val(row.get('Fld'))
            player["stats"]["accuracy"] = clean_val(row.get('Arm'))
            
            player["pitching"] = {
                "pitches": [p.strip() for p in str(clean_val(row.get('Unnamed: 10')) or '').split(',') if p.strip()],
                "armAngle": clean_val(row.get('Unnamed: 11'))
            }
        else:
            pos_str = str(clean_val(row.get('P.Pos')) or '')
            sec_pos_str = str(clean_val(row.get('S.Pos')) or '')
            
            player["primaryPosition"] = pos_str
            player["secondaryPositions"] = [x.strip() for x in sec_pos_str.split('/') if x.strip()] if sec_pos_str else []
            player["isPitcher"] = False
            
            player["stats"]["power"] = clean_val(row.get('Pow'))
            player["stats"]["contact"] = clean_val(row.get('Con'))
            player["stats"]["speed"] = clean_val(row.get('Spd'))
            player["stats"]["fielding"] = clean_val(row.get('Fld'))
            player["stats"]["arm"] = clean_val(row.get('Arm'))
            
        # Clean numeric stats to int
        for k, v in player["stats"].items():
            try:
                player["stats"][k] = int(v) if v is not None else 0
            except:
                player["stats"][k] = 0
                
        players.append(player)

with open('../frontend/src/data/players.json', 'w', encoding='utf-8') as f:
    json.dump(players, f, ensure_ascii=False, indent=2)

print(f"Successfully extracted {len(players)} players.")
