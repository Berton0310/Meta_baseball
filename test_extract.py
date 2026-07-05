import pandas as pd
file_path = 'C:/Users/berto/Desktop/mega baseball/Super Mega Baseball 4 Rosters.xlsx'
df = pd.read_excel(file_path, sheet_name='Heaters')
# Clean keys
df.columns = [str(c).strip() for c in df.columns]

fielder = df[df['P.Pos'] == 'CF'].iloc[0].to_dict()
pitcher = df[df['Unnamed: 0'] == 'SP'].iloc[0].to_dict()

print("Fielder:")
for k, v in fielder.items(): print(f"  {k}: {v}")

print("\nPitcher:")
for k, v in pitcher.items(): print(f"  {k}: {v}")
