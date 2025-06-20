#!/bin/bash
set -e

echo "Vanna AI - Dynamic Database Connector"
echo "------------------------------------"

# Create default config if it doesn't exist
if [ ! -f "/opt/config/connections.json" ]; then
  echo "Creating default connection configuration..."
  echo '{"connections": []}' > /opt/config/connections.json
fi

# Start the Vanna Streamlit application with our custom connection manager
cd /opt/vanna-streamlit
streamlit run dynamic_connection.py