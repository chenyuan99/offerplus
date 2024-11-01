import logging
import os

import openai

openai.api_key = os.environ["OPENAI_API_KEY"]


def generate_response(prompt: str) -> str:
    completion = openai.ChatCompletion.create(
        model="gpt-4o-mini", messages=[{"role": "user", "content": prompt}]
    )
    result = completion.choices[0].message.content
    logging.info(f"Generated response: {result}")
    return result

def generate_thank_you_letter(interviewer_name: str, company_name: str) -> str:
    return generate_response(f"Write a thank you letter to your Interviewer {interviewer_name} for {company_name}.")


def generate_why_company(company_name: str) -> str:
    return generate_response(f"Why {company_name}.")


def generate_why_role(company_name: str, role_name: str) -> str:
    return generate_response(f"Why this role {role_name} at {company_name}.")

