import json
import os
import vanna
from pathlib import Path
import streamlit as st

class ConnectionManager:
    def __init__(self, config_path="/opt/config/connections.json"):
        self.config_path = config_path
        self.connections = self._load_connections()
        self.active_connection = None
        self.vanna_instance = None
    
    def _load_connections(self):
        """Load connections from the config file"""
        config_file = Path(self.config_path)
        if not config_file.exists():
            # Create default config if it doesn't exist
            config_file.parent.mkdir(parents=True, exist_ok=True)
            with open(config_file, 'w') as f:
                json.dump({"connections": []}, f)
            return {"connections": []}
        
        with open(config_file, 'r') as f:
            return json.load(f)
    
    def _save_connections(self):
        """Save connections to the config file"""
        with open(self.config_path, 'w') as f:
            json.dump(self.connections, f, indent=2)
    
    def add_connection(self, connection_info):
        """Add a new connection"""
        self.connections["connections"].append(connection_info)
        self._save_connections()
    
    def remove_connection(self, connection_name):
        """Remove a connection by name"""
        self.connections["connections"] = [
            conn for conn in self.connections["connections"]
            if conn["name"] != connection_name
        ]
        self._save_connections()
        
    def get_connections(self):
        """Get all connections"""
        return self.connections["connections"]
    
    def get_connection(self, connection_name):
        """Get a connection by name"""
        for conn in self.connections["connections"]:
            if conn["name"] == connection_name:
                return conn
        return None
    
    def set_active_connection(self, connection_name):
        """Set the active connection and initialize Vanna"""
        connection = self.get_connection(connection_name)
        if not connection:
            st.error(f"Connection {connection_name} not found")
            return False
        
        # Store the active connection
        self.active_connection = connection
        
        # Build connection string based on db type
        connection_string = self._build_connection_string(connection)
        
        # Initialize Vanna with the connection
        try:
            self.vanna_instance = self._initialize_vanna(connection, connection_string)
            return True
        except Exception as e:
            st.error(f"Error connecting to database: {str(e)}")
            return False
    
    def _build_connection_string(self, connection):
        """Build a connection string based on the database type"""
        db_type = connection.get("type", "").lower()
        host = connection.get("host", "localhost")
        port = connection.get("port", "")
        database = connection.get("database", "")
        username = connection.get("username", "")
        password = connection.get("password", "")
        
        if db_type == "oracle":
            return f"oracle+cx_oracle://{username}:{password}@{host}:{port}/{database}"
        elif db_type == "sqlserver":
            return f"mssql+pyodbc://{username}:{password}@{host}:{port}/{database}"
        elif db_type == "postgresql":
            return f"postgresql://{username}:{password}@{host}:{port}/{database}"
        elif db_type == "mysql":
            return f"mysql+pymysql://{username}:{password}@{host}:{port}/{database}"
        elif db_type == "ibmdb2":
            return f"ibm_db_sa://{username}:{password}@{host}:{port}/{database}"
        elif db_type == "sqlite":
            return f"sqlite:////{database}" if database.startswith('/') else f"sqlite:///opt/data/{database}.sqlite3"
        else:
            raise ValueError(f"Unsupported database type: {db_type}")
    
    def _initialize_vanna(self, connection, connection_string):
        """Initialize a Vanna instance with the given connection"""
        api_key = os.environ.get("API_KEY", "demo")
        custom_base_url = os.environ.get("CUSTOM_LLM_BASE_URL")
        model_name = os.environ.get("LLM_MODEL_NAME", "gpt-4")
        
        # Create Vanna instance with custom LLM if base URL is configured
        if custom_base_url:
            from openai import OpenAI
            from vanna.openai import OpenAI_Chat
            from vanna.chromadb import ChromaDB_VectorStore
            
            # Create a custom OpenAI client with the same API key
            custom_client = OpenAI(
                api_key=api_key,
                base_url=custom_base_url
            )
            
            # Create custom Vanna implementation
            class CustomVanna(ChromaDB_VectorStore, OpenAI_Chat):
                def __init__(self, config=None):
                    ChromaDB_VectorStore.__init__(self, config=config)
                    OpenAI_Chat.__init__(self, client=custom_client, config=config)
            
            vanna_instance = CustomVanna(config={'model': model_name})
        else:
            # Use standard Vanna implementation
            vanna_instance = vanna.Vanna(api_key=api_key)
            vanna_instance.set_model(model_name=model_name)
        
        # Connect to the database
        vanna_instance.connect_to_db(connection_string=connection_string)
        
        # Use a unique path for each connection to avoid conflicts
        conn_name = connection.get("name", "default").replace(" ", "_").lower()
        chroma_path = f"/opt/data/chroma/{conn_name}"
        vanna_instance.connect_to_chroma(chroma_path)
        
        return vanna_instance
    
    def get_vanna_instance(self):
        """Get the current Vanna instance"""
        return self.vanna_instance
    
    def get_active_connection(self):
        """Get the active connection info"""
        return self.active_connection

# Create a singleton instance
connection_manager = ConnectionManager()