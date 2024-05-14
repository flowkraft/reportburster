docker-compose up -d

docker cp reportburster-server:/app/config .
docker cp reportburster-server:/app/input-files .
docker cp reportburster-server:/app/samples .
docker cp reportburster-server:/app/scripts .