# Start with pgvector base for builder
FROM ankane/pgvector:v0.5.1 AS builder
# comment to trigger ci
# Install Python and required packages
RUN apt-get update && apt-get install -y \
    python3 \
    python3-venv \
    python3-full \
    build-essential \
    libpq-dev \
    python3-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

ARG LETTA_ENVIRONMENT=DEV
ENV LETTA_ENVIRONMENT=${LETTA_ENVIRONMENT} \
    UV_NO_PROGRESS=1 \
    UV_PYTHON_PREFERENCE=system \
    UV_CACHE_DIR=/tmp/uv_cache

WORKDIR /app

# Create and activate virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Now install uv and uvx in the virtual environment
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

# Clone Letta directly from GitHub - pinned to 0.16.4 for reproducible builds
# Our patches (if any) are verified against this version; update patches when upgrading
ARG LETTA_VERSION=0.16.4
RUN git clone --depth 1 --branch ${LETTA_VERSION} https://github.com/letta-ai/letta.git /app && \
    rm -rf /app/.git

# Commented out patches - testing if new Letta works without them
# COPY ./.patches/server.patched /app/letta/server/server.py
# COPY ./.patches/constants.patched /app/letta/constants.py

RUN uv sync --frozen --no-dev --all-extras --python 3.11

# Runtime stage
FROM ankane/pgvector:v0.5.1 AS runtime

# Overridable Node.js version with --build-arg NODE_VERSION
ARG NODE_VERSION=22

# Allow overriding the OpenTelemetry Collector version and let Docker inject TARGETARCH during build
ARG OTEL_VERSION=0.96.0
ARG TARGETARCH

RUN set -eux; \
    # Map TARGETARCH to the naming used by otel release assets
    case "${TARGETARCH:-amd64}" in \
      arm64|aarch64) OTEL_ARCH=arm64 ;; \
      amd64|x86_64|x64) OTEL_ARCH=amd64 ;; \
      *) OTEL_ARCH=amd64 ;; \
    esac; \
    apt-get update && \
    # Install system dependencies and agent utilities
    apt-get install -y \
        # --- SYSTEM DEPENDENCIES ---
        curl \
        python3 \
        python3-venv \
        libpq-dev \
        unixodbc-dev \
            # ODBC driver manager for SQL Server connectivity via pyodbc. \
        redis-server \
        # --- ESSENTIAL UTILITIES ---
        wget \
            # Download documentation and resources. \
        ripgrep \
            # Fast recursive search respecting .gitignore (preferred). \
        jq \
            # Command-line JSON processor for parsing configs and API responses. \
        xmlstarlet \
            # Command-line XML processor for parsing configurations. \
        file \
            # Identify file types before analysis. \
        git \
            # Version control for repository analysis and context gathering. \
        # --- TEXT PROCESSING & EDITING ---
        sed \
            # Stream editor for text replacement and transformation. \
        gawk \
            # Pattern scanning and processing language for structured text. \
        perl \
            # General-purpose scripting for regex operations and text processing. \
        # --- SEARCH & ANALYSIS ---
        grep \
            # Standard search tool (reliable fallback). \
        findutils \
            # Includes 'find' for file location. \
    && \
    # Install Node.js
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - && \
    apt-get install -y nodejs && \
    # Install agent-browser globally for AI agents (includes Chromium + Linux deps)
    npm install -g agent-browser && \
    agent-browser install --with-deps && \
    # Download and install OpenTelemetry Collector for the target architecture
    OTEL_FILENAME="otelcol-contrib_${OTEL_VERSION}_linux_${OTEL_ARCH}.tar.gz"; \
    echo "Downloading https://github.com/open-telemetry/opentelemetry-collector-releases/releases/download/v${OTEL_VERSION}/${OTEL_FILENAME}"; \
    curl -L "https://github.com/open-telemetry/opentelemetry-collector-releases/releases/download/v${OTEL_VERSION}/${OTEL_FILENAME}" -o /tmp/otel-collector.tar.gz && \
    tar xzf /tmp/otel-collector.tar.gz -C /usr/local/bin && \
    rm /tmp/otel-collector.tar.gz && \
    mkdir -p /etc/otel && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

ARG LETTA_ENVIRONMENT=DEV
ENV LETTA_ENVIRONMENT=${LETTA_ENVIRONMENT} \
    VIRTUAL_ENV="/app/.venv" \
    PATH="/app/.venv/bin:$PATH" \
    POSTGRES_USER=letta \
    POSTGRES_PASSWORD=letta \
    POSTGRES_DB=letta

# LETTA_VERSION is set in builder stage and inherited via COPY
ARG LETTA_VERSION=0.16.4
ENV LETTA_VERSION=${LETTA_VERSION}

WORKDIR /app

# Copy virtual environment and app from builder (includes otel/ folder and init.sql from git clone)
COPY --from=builder /app .

# Add OpenTelemetry Collector configs from the cloned Letta repo
RUN cp /app/otel/otel-collector-config-file.yaml /etc/otel/config-file.yaml && \
    cp /app/otel/otel-collector-config-clickhouse.yaml /etc/otel/config-clickhouse.yaml && \
    cp /app/otel/otel-collector-config-signoz.yaml /etc/otel/config-signoz.yaml

# Copy initialization SQL from the cloned Letta repo
RUN cp /app/init.sql /docker-entrypoint-initdb.d/

# Copy uv from official image for installing additional packages into the venv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/

# Install native Python database drivers for the db_query custom tool.
# These allow Athena to query any ReportBurster-configured database directly.
RUN uv pip install --python /app/.venv/bin/python --no-cache-dir \
    duckdb \
    psycopg2-binary \
    mysql-connector-python \
    pyodbc \
    oracledb \
    clickhouse-connect \
    tabulate

# Normalize startup script line endings (CRLF -> LF) and ensure executable
RUN if [ -f /app/letta/server/startup.sh ]; then \
      sed -i 's/\r$//' /app/letta/server/startup.sh && \
      chmod +x /app/letta/server/startup.sh; \
    fi

EXPOSE 8283 5432 6379 4317 4318

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["./letta/server/startup.sh"]
