import pandas as pd
import json
import os

excel_path = "球員資料.xlsx"
out_dir = "data_extract"

if not os.path.exists(out_dir):
    os.makedirs(out_dir)

try:
    xl = pd.ExcelFile(excel_path)
    sheet_names = xl.sheet_names
    print(f"Found sheets: {sheet_names}")
    
    for sheet in sheet_names:
        df = xl.parse(sheet)
        json_data = df.to_json(orient="records", force_ascii=False)
        out_file = os.path.join(out_dir, f"{sheet}.json")
        with open(out_file, "w", encoding="utf-8") as f:
            f.write(json_data)
        print(f"Saved {sheet} to {out_file}")
except Exception as e:
    print(f"Error: {e}")
