FROM python:3.11-slim

# Install system dependencies for JDBC (Java) and database connectivity
RUN apt-get update && apt-get install -y --no-install-recommends \
    openjdk-17-jre-headless \
    build-essential \
    libpq-dev \
    unixodbc-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set JAVA_HOME for JayDeBeApi/JPype
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH="${JAVA_HOME}/bin:${PATH}"

# Create non-root user
RUN useradd --create-home jupyter \
    && mkdir -p /app/notebooks /app/config /app/jdbc-drivers /app/db \
    && chown -R jupyter:jupyter /app

USER jupyter
WORKDIR /app

# Copy requirements and install Python dependencies
COPY --chown=jupyter:jupyter requirements.txt .
RUN python -m pip install --no-cache-dir --upgrade pip \
    && python -m pip install --no-cache-dir -r requirements.txt \
    && python -m ipykernel install --user --name python3 --display-name "Python 3 (Chat2DB)"

# Copy Python modules
COPY --chown=jupyter:jupyter py/ /app/py/

# Add Python modules to path
ENV PYTHONPATH="${PYTHONPATH}:/app/py"

# Expose JupyterLab port
EXPOSE 8888

# Start JupyterLab with token from environment
CMD ["sh", "-c", "jupyter lab --ip=0.0.0.0 --port=8888 --no-browser --NotebookApp.token=${JUPYTER_TOKEN:-reportburster}"]
