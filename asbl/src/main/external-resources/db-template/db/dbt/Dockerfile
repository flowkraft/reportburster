FROM python:3.11-slim

RUN pip install --no-cache-dir dbt-core dbt-clickhouse

WORKDIR /usr/app

COPY dbt_project.yml .
COPY profiles.yml /root/.dbt/profiles.yml
COPY models/ models/

ENTRYPOINT ["dbt"]
CMD ["run"]
