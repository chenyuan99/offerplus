import pandas as pd
import json

# Set the option to display all columns
pd.set_option('display.max_columns', None)

excel_file_path = 'data/sample.xlsx'  # Replace with your file path
df = pd.read_excel(excel_file_path)

with open("data/company.json", 'r') as file:
    company_mapping = json.load(file)

df["EMPLOYER_NAME"] =  df["EMPLOYER_NAME"].replace(company_mapping)

print(df.head())