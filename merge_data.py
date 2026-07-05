import json
import os
import uuid

def load_json(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

fielders = load_json('data_extract/野手資料.json')
pitchers = load_json('data_extract/投手資料.json')

unified_players = []

def map_traits(t1, t2):
    traits = []
    if t1 and t1 != "-" and str(t1).strip() != "None":
        traits.append(str(t1).strip())
    if t2 and t2 != "-" and str(t2).strip() != "None":
        traits.append(str(t2).strip())
    return traits

for p in fielders:
    if "球員" not in p: continue
    
    player_id = str(uuid.uuid4())
    player = {
        "id": player_id,
        "name": p.get("球員", "Unknown"),
        "team": p.get("原始隊伍", ""),
        "rating": p.get("評級", ""),
        "primaryPosition": p.get("主守位", ""),
        "secondaryPositions": [pos.strip() for pos in str(p.get("次守位", "")).split("/") if pos.strip() and pos.strip() != "-"],
        "bats": p.get("打擊", ""),
        "throws": p.get("投球", ""),
        "chemistry": p.get("特性", ""),
        "traits": map_traits(p.get("特殊能力-1"), p.get("特殊能力-2")),
        "stats": {
            "power": p.get("力量", 0),
            "contact": p.get("技巧", 0),
            "speed": p.get("跑速", 0),
            "fielding": p.get("守備", 0),
            "arm": p.get("臂力", 0),
            "velocity": None,
            "junk": None,
            "accuracy": None
        },
        "pitching": None,
        "isPitcher": False
    }
    unified_players.append(player)

for p in pitchers:
    if "球員" not in p: continue
    
    player_id = str(uuid.uuid4())
    
    # 投手的主守位可能是 SP, RP, CP
    # 會有 velocity, junk, accuracy 數值
    player = {
        "id": player_id,
        "name": p.get("球員", "Unknown"),
        "team": p.get("原始隊伍", ""),
        "rating": p.get("評級", ""),
        "primaryPosition": p.get("主守位", ""),
        "secondaryPositions": [pos.strip() for pos in str(p.get("次守位", "")).split("/") if pos.strip() and pos.strip() != "-"],
        "bats": p.get("打擊", ""),
        "throws": p.get("投球", ""),
        "chemistry": p.get("特性", ""),
        "traits": map_traits(p.get("特殊能力-1"), p.get("特殊能力-2")),
        "stats": {
            "power": p.get("力量", 0),
            "contact": p.get("技巧", 0),
            "speed": p.get("跑速", 0),
            "fielding": p.get("守備", 0),
            "arm": None,
            "velocity": p.get("球速", 0),
            "junk": p.get("變化", 0),
            "accuracy": p.get("控球", 0)
        },
        "pitching": {
            "armAngle": p.get("出手點", "Mid"),
            "pitches": [pos.strip() for pos in str(p.get("球種", "")).split("/") if pos.strip() and pos.strip() != "-"]
        },
        "isPitcher": True
    }
    # 處理二刀流投手的臂力? 原文沒提到投手有臂力欄位，先設為 null
    unified_players.append(player)

with open('data_extract/players.json', 'w', encoding='utf-8') as f:
    json.dump(unified_players, f, ensure_ascii=False, indent=2)

print("Successfully generated players.json with", len(unified_players), "players.")
