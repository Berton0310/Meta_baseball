import pandas as pd
import json
import sys

try:
    df = pd.read_excel("球員資料.xlsx", engine="openpyxl")
    print(df.head().to_json(orient="records", force_ascii=False))
    print("\nColumns:", list(df.columns))
except Exception as e:
    print(f"Error reading with openpyxl: {e}")
    try:
        df = pd.read_excel("球員資料.xlsx")
        print(df.head().to_json(orient="records", force_ascii=False))
        print("\nColumns:", list(df.columns))
    except Exception as e2:
        print(f"Error reading with default engine: {e2}")
