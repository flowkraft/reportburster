FROM python:3.11-slim

# Install dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    git \
    build-essential \
    libpq-dev \
    unixodbc-dev \
    unixodbc \
    freetds-dev \
    freetds-bin \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Clone Vanna Streamlit repository (UI-focused)
RUN git clone https://github.com/vanna-ai/vanna-streamlit.git /opt/vanna-streamlit

# Set working directory
WORKDIR /opt/vanna-streamlit

# Install Python dependencies for all supported databases
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir \
    chromadb==0.4.22 \
    vanna[postgres] \
    vanna[mysql] \
    vanna[oracle] \
    psycopg2-binary \
    pymysql \
    pyodbc \
    cx_Oracle \
    sqlalchemy \
    ibm_db_sa \
    python-dotenv \
    requests \
    gevent \
    streamlit-extras

# Create directories for data and configuration
RUN mkdir -p /opt/data/chroma /opt/config

# Copy our custom files
COPY entrypoint.sh /entrypoint.sh
COPY connection_manager.py /opt/vanna-streamlit/
COPY dynamic_connection.py /opt/vanna-streamlit/

# Make scripts executable
RUN chmod +x /entrypoint.sh

# Set the entrypoint
ENTRYPOINT ["/entrypoint.sh"]