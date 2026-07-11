import json

typos = {
    'PWR vs RHP': 'POW vs RHP',
    'Con vs RHP': 'CON vs RHP',
    'Con vs RPH': 'CON vs RHP',
    'CON vs RPH': 'CON vs RHP',
    'POW vs PHP': 'POW vs RHP',
    'Con vs LHP': 'CON vs LHP',
    'POW vs LHP': 'POW vs LHP',
    'Clitch': 'Clutch',
    'East Target': 'Easy Target',
    'Base Rounds': 'Base Rounder',
    'Slowpoke': 'Slow Poke',
    'K Neglector': 'K Neglecter',
    'Elite 4': 'Elite 4F',
}

# 1. Update players.json to fix typos
with open('frontend/src/data/players.json', 'r', encoding='utf-8') as f:
    players = json.load(f)

for p in players:
    new_traits = []
    for t in p.get('traits', []):
        t_fixed = typos.get(t, t)
        new_traits.append(t_fixed)
    p['traits'] = new_traits

with open('frontend/src/data/players.json', 'w', encoding='utf-8') as f:
    json.dump(players, f, ensure_ascii=False, indent=2)

# 2. Add Missing Traits to info and i18n
missing_definitions = {
    'Two Way (IF)': {'zh': '二刀流(內野)', 'desc': '當打內野手時，減少防守和傳球懲罰'},
    'Two Way (OF)': {'zh': '二刀流(外野)', 'desc': '當打外野手時，減少防守和傳球懲罰'},
    'Two Way (C)': {'zh': '二刀流(捕手)', 'desc': '當打捕手時，減少防守和傳球懲罰'},
    'Elite 2F': {'zh': '菁英二縫線', 'desc': '投擲2-Seam快速球時增加投球速度與折線'},
    'Elite SB': {'zh': '菁英螺旋球', 'desc': '投擲螺旋球時減少投球速度和增加折線數'},
    'Elite CF': {'zh': '菁英卡特球', 'desc': '投擲卡特球時增加折線數'},
    'Outside Pitch': {'zh': '外角球', 'desc': '瞄準好球帶的外角時，力量和打擊會增加'},
    'Off-Speed Hitter': {'zh': '變化球打者', 'desc': '在擊打CB，SL，CH，SB或FK投球時，力量和打擊會增加'},
    'Surrounded': {'zh': '包圍', 'desc': '壘上有兩名跑壘者以上時，球速、體力和控球減少'},
    'RBI Hero': {'zh': 'RBI英雄', 'desc': '在2B或3B有跑者時打擊時增加力量和打擊'},
    'Sprinter': {'zh': '短跑手', 'desc': '從打擊區跑出時增加奔跑速度'},
    'Easy Target': {'zh': '容易針對', 'desc': '在擊球時，對手的控球會增加'},
    'Tough Out': {'zh': '堅韌', 'desc': '在2好球的情況下增加打擊能力'},
    'Consistent': {'zh': '持續', 'desc': '從遊戲到遊戲，精神力(Mojo)的變化速度緩慢'},
    'POW vs RHP': {'zh': '力量vs右投', 'desc': '在對右投手打擊時增加力量'},
    'POW vs LHP': {'zh': '力量vs左投', 'desc': '在對左投手打擊時增加力量'},
    'CON vs RHP': {'zh': '打擊vs右投', 'desc': '在對右投手打擊時增加打擊'},
    'CON vs LHP': {'zh': '打擊vs左投', 'desc': '在對左投手打擊時增加打擊'},
    'K Neglecter': {'zh': '三振疏忽', 'desc': '在2好球時球速和控球降低'},
    'Base Rounder': {'zh': '繞壘高手', 'desc': '在繞壘時增加奔跑速度'},
    'Slow Poke': {'zh': '遲緩', 'desc': '從打擊區跑出時減少奔跑速度'},
}

with open('frontend/src/data/traits_info.json', 'r', encoding='utf-8') as f:
    info = json.load(f)
    
with open('frontend/src/locales/i18n_zh-TW.json', 'r', encoding='utf-8') as f:
    zh_loc = json.load(f)

for eng_key, val in missing_definitions.items():
    info[eng_key] = val['desc']
    zh_loc['traits'][eng_key] = val['zh']

with open('frontend/src/data/traits_info.json', 'w', encoding='utf-8') as f:
    json.dump(info, f, ensure_ascii=False, indent=2)

with open('frontend/src/locales/i18n_zh-TW.json', 'w', encoding='utf-8') as f:
    json.dump(zh_loc, f, ensure_ascii=False, indent=2)

print("Fixed typos and missing definitions successfully.")
