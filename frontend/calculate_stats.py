import json
import os

with open(r'c:\Users\berto\Desktop\mega baseball\frontend\src\data\players.json', 'r', encoding='utf-8') as f:
    players = json.load(f)

# Initialize stats collection
teams = {}

for p in players:
    team = p['team']
    if team not in teams:
        teams[team] = {
            'hitters': [],
            'pitchers': [],
            'sp': [],
            'rp_cp': []
        }
    
    if p.get('isPitcher'):
        teams[team]['pitchers'].append(p)
        if p.get('primaryPosition') == 'SP':
            teams[team]['sp'].append(p)
        else:
            teams[team]['rp_cp'].append(p)
    else:
        teams[team]['hitters'].append(p)

# Calculate averages
team_averages = {}
for team, data in teams.items():
    hitters = data['hitters']
    pitchers = data['pitchers']
    sp = data['sp']
    rp_cp = data['rp_cp']
    
    def avg(lst, key):
        if not lst: return 0
        return round(sum(p['stats'].get(key, 0) for p in lst) / len(lst), 1)
    
    team_averages[team] = {
        'pow': avg(hitters, 'power'),
        'con': avg(hitters, 'contact'),
        'spd': avg(hitters, 'speed'),
        'fld': avg(hitters, 'fielding'),
        'arm': avg(hitters, 'arm'),
        
        'sp_vel': avg(sp, 'velocity'),
        'sp_jnk': avg(sp, 'junk'),
        'sp_acc': avg(sp, 'accuracy'),
        
        'rp_vel': avg(rp_cp, 'velocity'),
        'rp_jnk': avg(rp_cp, 'junk'),
        'rp_acc': avg(rp_cp, 'accuracy'),
    }

output_file = r'team_stats_output.json'
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(team_averages, f, indent=4)
print(f"Stats written to {output_file}")
