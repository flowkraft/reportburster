FROM python:3.11-slim

# Install system dependencies for JDBC (Java) and database connectivity
RUN apt-get update && apt-get install -y --no-install-recommends \
    openjdk-21-jre-headless \
    build-essential \
    libpq-dev \
    unixodbc-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set JAVA_HOME for JayDeBeApi/JPype
ENV JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
ENV PATH="${JAVA_HOME}/bin:${PATH}"

# Create non-root user
RUN useradd --create-home appuser \
    && mkdir -p /app/py \
    && chown -R appuser:appuser /app

USER appuser
WORKDIR /app

# Add user local bin to PATH (where pip installs executables)
ENV PATH="/home/appuser/.local/bin:${PATH}"

# Copy requirements and install Python dependencies
COPY --chown=appuser:appuser requirements.txt .
RUN python -m pip install --no-cache-dir --upgrade pip \
    && python -m pip install --no-cache-dir -r requirements.txt

# Copy Python modules
COPY --chown=appuser:appuser py/ /app/py/

# Add Python modules to path
ENV PYTHONPATH="${PYTHONPATH}:/app/py"

# Expose FastAPI port
EXPOSE 8888

# Start FastAPI via uvicorn
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8888", "--app-dir", "/app/py"]
