import openai
from django.conf import settings

openai.api_key = settings.OPENAI_API_KEY

def generate_response(prompt: str) -> str:
    """Generate a general response using GPT-4."""
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a professional career coach helping prepare interview responses."},
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error generating response: {str(e)}")
        raise

def generate_why_company(company_name: str) -> str:
    """Generate a response for why you want to work at a specific company."""
    prompt = f"""
    Generate a compelling response for the interview question: 
    'Why do you want to work at {company_name}?'
    Focus on the company's:
    1. Technology and innovation
    2. Company culture and values
    3. Impact and mission
    4. Growth opportunities
    Keep it professional, authentic, and around 200 words.
    """
    return generate_response(prompt)

def generate_why_role(company_name: str, role_name: str) -> str:
    """Generate a response for why you want a specific role at a company."""
    prompt = f"""
    Generate a compelling response for why you want the {role_name} role at {company_name}.
    Focus on:
    1. Role-specific skills and experience
    2. Career growth opportunities
    3. Impact in the role
    4. Alignment with company mission
    Keep it professional and around 200 words.
    """
    return generate_response(prompt)

def generate_thank_you_letter(interviewer_name: str, company_name: str) -> str:
    """Generate a thank you letter after an interview."""
    prompt = f"""
    Write a professional thank you letter to:
    Interviewer: {interviewer_name}
    Company: {company_name}
    
    Include:
    1. Gratitude for their time
    2. Reference to specific discussion points
    3. Reiteration of interest
    4. Next steps
    Keep it concise and professional.
    """
    return generate_response(prompt)

def get_behavioral_answer(question: str) -> str:
    """Generate a response for behavioral interview questions using the STAR method."""
    prompt = f"""
    Generate a professional response to the behavioral interview question:
    '{question}'
    
    Use the STAR method:
    1. Situation: Set the context
    2. Task: Describe the challenge
    3. Action: Explain what you did
    4. Result: Share the outcome
    
    Keep it concise, specific, and professional. Around 250 words.
    """
    return generate_response(prompt)

def get_resume_feedback(resume_file) -> str:
    """Analyze a resume and provide feedback."""
    # TODO: Implement resume parsing and analysis
    try:
        # For now, return a placeholder response
        return "Resume feedback functionality coming soon."
    except Exception as e:
        print(f"Error analyzing resume: {str(e)}")
        raise

def get_resume_match_score(job_description: str, resume_url: str) -> dict:
    """Compare a resume against a job description and provide a match score."""
    prompt = f"""
    Analyze the following job description and resume, and provide:
    1. An overall match score (0-100)
    2. Key matching skills
    3. Missing skills or areas for improvement
    
    Job Description:
    {job_description}
    
    Resume URL:
    {resume_url}
    """
    
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an AI resume analyzer providing match scores and feedback."},
                {"role": "user", "content": prompt}
            ]
        )
        return {
            'score': 75,  # Placeholder score
            'feedback': response.choices[0].message.content.strip()
        }
    except Exception as e:
        print(f"Error calculating resume match score: {str(e)}")
        raise
