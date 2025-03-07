"""
LangChain integration utilities for the OffersPlus application.
This module provides centralized configuration and utility functions for LangChain.
"""
import os
from django.conf import settings
from langchain.callbacks.tracers.langchain import LangChainTracer
from langchain.callbacks.manager import CallbackManager
from langchain_core.tracers import ConsoleCallbackHandler
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# Initialize tracing based on settings
def get_callback_manager():
    """
    Get a callback manager configured with appropriate tracers based on settings.
    """
    callbacks = []
    
    # Always add console tracing in development for debugging
    if settings.DEBUG:
        callbacks.append(ConsoleCallbackHandler())
    
    # Add LangSmith tracing if enabled
    if getattr(settings, 'LANGCHAIN_TRACING_V2', False) and getattr(settings, 'LANGCHAIN_API_KEY', None):
        tracer = LangChainTracer(
            project_name=getattr(settings, 'LANGCHAIN_PROJECT', 'offersplus'),
        )
        callbacks.append(tracer)
    
    return CallbackManager(callbacks)

def get_openai_chat(model="gpt-3.5-turbo", temperature=0.7, **kwargs):
    """
    Get a configured ChatOpenAI instance with tracing enabled.
    
    Args:
        model (str): The OpenAI model to use
        temperature (float): Temperature setting for the model
        **kwargs: Additional arguments to pass to ChatOpenAI
        
    Returns:
        ChatOpenAI: A configured ChatOpenAI instance
    """
    callback_manager = get_callback_manager()
    
    return ChatOpenAI(
        model=model,
        temperature=temperature,
        api_key=settings.OPENAI_API_KEY,
        callbacks=callback_manager.handlers,
        **kwargs
    )

def create_simple_chain(system_prompt, user_prompt_template):
    """
    Create a simple LangChain chain with the given prompts.
    
    Args:
        system_prompt (str): The system prompt to use
        user_prompt_template (str): The user prompt template
        
    Returns:
        Chain: A configured LangChain chain
    """
    llm = get_openai_chat()
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("user", user_prompt_template),
    ])
    
    chain = prompt | llm | StrOutputParser()
    return chain
