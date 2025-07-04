import os
import vanna as vn
from vanna.chromadb import ChromaDB_VectorStore

def initialize_vanna():
    """
    Initializes and configures the Vanna instance based on environment variables.
    This function selects the appropriate LLM backend and vector store.
    """
    llm_vendor = os.getenv('LLM_VENDOR', 'openai').lower()
    print(f"Initializing Vanna with LLM vendor: {llm_vendor}")

    # Define a base class with the chosen vector store
    class MyVanna(ChromaDB_VectorStore):
        def __init__(self, config=None):
            # Get ChromaDB connection details from environment
            chroma_config = {
                'path': os.getenv('VANNA_CHROMA_PATH', '/app/chroma'),
            }
            ChromaDB_VectorStore.__init__(self, config=chroma_config)

    # --- LLM Backend Selection ---
    if llm_vendor == 'openrouter':
        from vanna.openai import OpenAI_Chat
        from openai import OpenAI

        api_key = os.getenv('OPENROUTER_API_KEY')
        base_url = os.getenv('OPENAI_API_BASE', 'https://openrouter.ai/api/v1')
        model = os.getenv('LLM_MODEL_NAME')

        if not api_key or not model:
            raise ValueError("OPENROUTER_API_KEY and LLM_MODEL_NAME must be set for OpenRouter.")

        # The key is to initialize the OpenAI_Chat class with a custom OpenAI client
        # configured for the OpenRouter endpoint.
        class VannaOpenRouter(MyVanna, OpenAI_Chat):
            def __init__(self, config=None):
                MyVanna.__init__(self, config=config)
                OpenAI_Chat.__init__(self, client=OpenAI(api_key=api_key, base_url=base_url), config={'model': model})
        
        vn.set_vanna_class(VannaOpenRouter)

    elif llm_vendor == 'openai':
        from vanna.openai import OpenAI_Chat
        api_key = os.getenv('OPENAI_API_KEY')
        model = os.getenv('LLM_MODEL_NAME', 'gpt-4-turbo')
        if not api_key:
            raise ValueError("OPENAI_API_KEY must be set for OpenAI.")
        
        class VannaOpenAI(MyVanna, OpenAI_Chat):
             def __init__(self, config=None):
                MyVanna.__init__(self, config=config)
                OpenAI_Chat.__init__(self, config={'api_key': api_key, 'model': model})

        vn.set_vanna_class(VannaOpenAI)

    elif llm_vendor == 'gemini':
        from vanna.google import GoogleGeminiChat
        api_key = os.getenv('GEMINI_API_KEY')
        model = os.getenv('LLM_MODEL_NAME', 'gemini-pro')
        if not api_key:
            raise ValueError("GEMINI_API_KEY must be set for Gemini.")

        class VannaGemini(MyVanna, GoogleGeminiChat):
            def __init__(self, config=None):
                MyVanna.__init__(self, config=config)
                GoogleGeminiChat.__init__(self, config={'api_key': api_key, 'model': model})
        
        vn.set_vanna_class(VannaGemini)
    
    # Add other vendors like Anthropic, Ollama, etc. here as needed
    # elif llm_vendor == 'anthropic':
    #     ...

    else:
        raise ValueError(f"Unsupported LLM vendor: {llm_vendor}")

    # The vn object is now configured with the correct backend
    print("Vanna initialization complete.")