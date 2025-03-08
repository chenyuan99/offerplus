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
from langchain_deepseek import ChatDeepSeek
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

def get_deepseek_chat(model="deepseek-coder-6.7b", temperature=0.7, **kwargs):
    """ 
    Get a configured ChatDeepSeek instance with tracing enabled.

    Args:
        model (str): The Deepseek model to use
        temperature (float): Temperature setting for the model
        **kwargs: Additional arguments to pass to ChatDeepSeek

    Returns:
        ChatDeepSeek: A configured ChatDeepSeek instance
    """
    callback_manager = get_callback_manager()
    
    os.environ['DEEPSEEK_API_KEY'] = settings.DEEPSEEK_API_KEY

    return ChatDeepSeek(
        model="deepseek-chat",
        temperature=0,
        max_tokens=None,
        timeout=None,
        max_retries=2,
    )


def create_simple_chain(system_prompt, user_prompt_template, model="gpt-3.5-turbo"):
    """
    Create a simple LangChain chain with the given prompts and model.
    
    Args:
        system_prompt (str): The system prompt to use
        user_prompt_template (str): The user prompt template
        model (str): The model to use (OpenAI or Deepseek model identifier)
        
    Returns:
        Chain: A configured LangChain chain
    """
    # For Deepseek models, we'll need to handle them differently in the future
    # For now, if it's not an OpenAI model, default to gpt-4o-mini

    # TODO: Add Deepseek model support
    if model.startswith('deepseek-'):
        llm = get_deepseek_chat(model=model)
    else:
        if not model.startswith('gpt-'):
            # This is a temporary fallback until Deepseek models are properly integrated
            model = "gpt-4o-mini"
        llm = get_openai_chat(model=model)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("user", user_prompt_template),
    ])
    
    chain = prompt | llm | StrOutputParser()
    return chain
