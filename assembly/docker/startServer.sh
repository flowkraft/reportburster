docker-compose up -d

docker cp reportburster_server:/app/config .
docker cp reportburster_server:/app/input-files .
docker cp reportburster_server:/app/samples .
docker cp reportburster_server:/app/scripts .