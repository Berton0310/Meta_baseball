import json
import re

input_file = "../docs/技能補充.txt"
output_file = "../frontend/src/data/traits_info.json"

traits_map = {}

try:
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Match lines like "中文 英文 – 說明" or "中文 英文 - 說明"
        if ' – ' in line or ' - ' in line:
            separator = ' – ' if ' – ' in line else ' - '
            parts = line.split(separator, 1)
            if len(parts) == 2:
                name_part = parts[0].strip()
                desc_part = parts[1].strip()
                
                # The name_part often looks like "雷射肩 Cannon Arm" or "打擊vs左投 CON vs LHP"
                # We can map the English name to the description, and the Chinese name to the description.
                # Actually, the JSON players.json uses the English name, e.g., "Fastball Hitter" or "Cannon Arm".
                # Let's extract the English part if possible.
                # Usually English part is the second half after spaces. But some Chinese has spaces.
                # Let's just use regex to extract everything that consists of A-Z, a-z, spaces as the English key
                # A robust way is to just map BOTH the English substring and the full name string to the description
                
                # Find all english words
                eng_match = re.search(r'[A-Za-z0-9\s/]+$', name_part)
                if eng_match:
                    eng_key = eng_match.group(0).strip()
                    zh_key = name_part[:eng_match.start()].strip()
                    if eng_key:
                        traits_map[eng_key] = desc_part
                    if zh_key:
                        traits_map[zh_key] = desc_part
                else:
                    traits_map[name_part] = desc_part

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(traits_map, f, ensure_ascii=False, indent=2)
    print(f"Parsed {len(traits_map)} trait definitions into {output_file}")

except Exception as e:
    print("Error:", e)
