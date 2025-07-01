import streamlit as st
import json
import os
import requests
import threading
import uvicorn
from pathlib import Path
from connection_manager import connection_manager
from fastapi import FastAPI, Request, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional

# Create FastAPI app for handling API requests
app = FastAPI(title="Vanna AI API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development - restrict this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API models
class ConnectionRequest(BaseModel):
    connection_name: str
    connection_data: Optional[Dict[str, Any]] = None

# API endpoint to change connection
@app.post("/api/connection")
async def api_connection(request: ConnectionRequest):
    try:
        connection_name = request.connection_name
        connection_data = request.connection_data
        
        # If we received new connection data, add/update it
        if connection_data:
            connection_manager.add_connection(connection_data)
        
        # Set as active connection
        success = connection_manager.set_active_connection(connection_name)
        
        if success:
            return {"status": "success", "message": f"Connected to {connection_name}"}
        else:
            return {"status": "error", "message": f"Failed to connect to {connection_name}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# Start FastAPI server in a separate thread
def start_api_server():
    uvicorn.run(app, host="0.0.0.0", port=8502)

# Streamlit configuration
st.set_page_config(
    page_title="ReportBurster - Vanna AI",
    page_icon="🤖",
    layout="wide",
)

# Function to display connection management UI
def connection_management():
    st.sidebar.header("Database Connections")
    
    # Display active connection
    active_conn = connection_manager.get_active_connection()
    if active_conn:
        st.sidebar.success(f"Connected to: {active_conn['name']}")
    else:
        st.sidebar.warning("No active connection")
    
    # List of available connections
    connections = connection_manager.get_connections()
    if connections:
        selected_conn = st.sidebar.selectbox("Select Connection", 
                                            [conn["name"] for conn in connections])
        
        if st.sidebar.button("Connect"):
            success = connection_manager.set_active_connection(selected_conn)
            if success:
                st.sidebar.success(f"Connected to {selected_conn}")
                st.experimental_rerun()
            else:
                st.sidebar.error(f"Failed to connect to {selected_conn}")
    
    # Form to add a new connection
    with st.sidebar.expander("Add New Connection"):
        with st.form("new_connection_form"):
            name = st.text_input("Connection Name")
            db_type = st.selectbox("Database Type", 
                                  ["oracle", "sqlserver", "postgresql", 
                                   "mysql", "ibmdb2", "sqlite"])
            
            if db_type == "sqlite":
                database = st.text_input("Database Name", "default")
                host = ""
                port = ""
                username = ""
                password = ""
            else:
                host = st.text_input("Host", "localhost")
                port = st.text_input("Port", "")
                database = st.text_input("Database Name", "")
                username = st.text_input("Username", "")
                password = st.text_input("Password", "", type="password")
            
            submit = st.form_submit_button("Add Connection")
            
            if submit:
                new_conn = {
                    "name": name,
                    "type": db_type,
                    "host": host,
                    "port": port,
                    "database": database,
                    "username": username,
                    "password": password
                }
                
                connection_manager.add_connection(new_conn)
                st.success(f"Added connection: {name}")
                st.experimental_rerun()

# Main application
def main():
    # Display API information
    st.sidebar.info("""
    **API Available**  
    External applications can connect via:  
    POST http://localhost:8502/api/connection
    """)
    
    # Header
    st.title("ReportBurster Database Chat")
    st.markdown("Ask questions about your data in natural language")
    
    # Display connection management UI in sidebar
    connection_management()
    
    # Check if we have an active connection
    v = connection_manager.get_vanna_instance()
    active_conn = connection_manager.get_active_connection()
    
    if not v or not active_conn:
        st.info("Please select or add a database connection to get started.")
        return
    
    # Main chat interface
    st.header(f"Chatting with {active_conn['name']}")
    
    # User input
    user_question = st.text_input("Ask a question about your data:", 
                                placeholder="Example: Show me the top 10 customers by revenue")
    
    # Process the question
    if user_question:
        with st.spinner("Generating response..."):
            try:
                # Get the SQL for the question
                sql = v.generate_sql(question=user_question)
                
                # Execute the SQL
                df = v.run_sql(sql)
                
                # Display results
                st.subheader("Results")
                st.dataframe(df)
                
                # Display the SQL
                with st.expander("View SQL"):
                    st.code(sql, language="sql")
                
                # Generate a natural language explanation
                explanation = v.generate_explanation(question=user_question, sql=sql)
                st.subheader("Explanation")
                st.markdown(explanation)
                
            except Exception as e:
                st.error(f"Error: {str(e)}")

# Run the application
if __name__ == "__main__":
    # Start the API server in a background thread
    api_thread = threading.Thread(target=start_api_server, daemon=True)
    api_thread.start()
    
    # Start the Streamlit app
    main()