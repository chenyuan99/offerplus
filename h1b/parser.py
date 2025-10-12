import pandas as pd
import json

# Set the option to display all columns
pd.set_option('display.max_columns', None)

filename = "LCA_Disclosure_Data_FY2025_Q3"
# filename = "sample"
# excel_file_path = 'data/sample.xlsx'  # Replace with your file path
excel_file_path = f'data/raw/{filename}.xlsx'
df = pd.read_excel(excel_file_path)

with open("data/company.json", 'r') as file:
    company_mapping = json.load(file)

df["EMPLOYER_NAME"] =  df["EMPLOYER_NAME"].replace(company_mapping)

# Convert to JSON with epoch date format
df.to_json(f'data/output/{filename}.json', orient='records',date_format='iso', indent=4)
print(f"DataFrame saved to data/output/{filename}.json")
# print(df.head())