#!/bin/bash

# Check if DOCKER_HUB_USERNAME environment variable is set, if not use 'flowkraft' as default
if [[ -z "${DOCKER_HUB_USERNAME}" ]]; then
  echo "DOCKER_HUB_USERNAME is not set. Using 'flowkraft' as the default value."
  DOCKER_HUB_USERNAME='flowkraft'
fi

if [[ -z "${DOCKER_HUB_PASSWORD}" ]]; then
  echo "Error: DOCKER_HUB_PASSWORD is not set. Please set this environment variable."
  exit 1
fi

if [[ -z "${AWS_ACCESS_KEY_ID}" ]]; then
  echo "Error: AWS_ACCESS_KEY_ID is not set. Please set this environment variable."
  exit 1
fi

if [[ -z "${AWS_SECRET_ACCESS_KEY}" ]]; then
  echo "Error: AWS_SECRET_ACCESS_KEY is not set. Please set this environment variable."
  exit 1
fi

# Step 1: Get the latest from git
git reset --hard
git pull origin main

# Step 2: Read the version from the XML file
version=$(grep -oPm1 "(?<=<version>)[^<]+" ../backend/reporting/src/main/external-resources/template/config/burst/settings.xml)

# Step 3: Build the Docker image and upload it to Docker Hub
docker build --no-cache --progress=plain -t $DOCKER_HUB_USERNAME/reportburster-server:$version -f ../Dockerfile ..

# Use the credentials
# For example, to login to Docker:
echo $DOCKER_HUB_PASSWORD | docker login --username $DOCKER_HUB_USERNAME --password-stdin
docker push $DOCKER_HUB_USERNAME/reportburster-server:$version

# Step 4: Update docker-compose.yml with the version parsed previously
sed -i "s|${DOCKER_HUB_USERNAME}/reportburster-server:.*|${DOCKER_HUB_USERNAME}/reportburster-server:${version}|" ./docker/docker-compose.yml

# Update the reportburster.sh, startServer.sh with the latest version
sed -i "s|\(image=\"${DOCKER_HUB_USERNAME}/reportburster-server:\).*\"|\1${version}\"|" ./docker/reportburster.sh
sed -i "s|\(image=\"${DOCKER_HUB_USERNAME}/reportburster-server:\).*\"|\1${version}\"|" ./docker/startServer.sh

chmod +x ./docker/reportburster.sh
chmod +x ./docker/startServer.sh
chmod +x ./docker/shutServer.sh

chmod +x ./docker/_clean.sh && cd ./docker && ./_clean.sh && cd ..

# Step 5: Pack docker folder as a zip file
rm -rf ./ReportBurster/
mkdir ./ReportBurster

cp ./docker/docker-compose.yml ./ReportBurster/docker-compose.yml 

cp ./docker/startServer.sh ./ReportBurster/reportburster.sh
cp ./docker/startServer.sh ./ReportBurster/startServer.sh 
cp ./docker/shutServer.sh ./ReportBurster/shutServer.sh 

chmod +x ./ReportBurster/reportburster.sh
chmod +x ./ReportBurster/startServer.sh
chmod +x ./ReportBurster/shutServer.sh

#create the dist directory if it doesn't already exist. If the directory does exist, mkdir -p will do nothing
mkdir -p ./dist
rm -f ./dist/reportburster-server-docker.zip
zip -r ./dist/reportburster-server-docker.zip ./ReportBurster

rm -rf ./ReportBurster/

# Step 6: Use rclone to sync/upload the newly generated local zip file to s3mkdir -p ~/.config/rclone
if [ ! -f ~/.config/rclone/rclone.conf ]; then
cat > ~/.config/rclone/rclone.conf <<EOF
[s3]
type = s3
provider = AWS
env_auth = false
access_key_id = ${AWS_ACCESS_KEY_ID}
secret_access_key = ${AWS_SECRET_ACCESS_KEY}
region = us-east-1
EOF
fi

rclone sync ./dist/reportburster-server-docker.zip s3://documentburster/newest/