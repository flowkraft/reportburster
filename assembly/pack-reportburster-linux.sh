#!/bin/bash

# Step 1: Get the latest from git
git pull origin main

# Step 2: Read the version from the XML file
version=$(grep -oPm1 "(?<=<version>)[^<]+" ../backend/reporting/src/main/external-resources/template/config/burst/settings.xml)

# Step 3: Build the Docker image and upload it to Docker Hub
docker build --no-cache --progress=plain -t reportburster_server:$version -f ../Dockerfile ..
# docker push reportburster_server:$version

# Step 4: Update docker-compose.yml and  with the version parsed previously
sed -i "s/reportburster_server:.*/reportburster_server:$version/" ./docker/docker-compose.yml

# Update the startServer.sh startServer.sh with the latest version
sed -i "s/\(image=\"reportburster_server:\).*\"/\1$version\"/" ./docker/startServer.sh

chmod +x ./docker/startServer.sh
chmod +x ./docker/shutServer.sh

# Step 5: Pack docker folder as a zip file
rm -rf ./docker-temp/
mkdir ./docker-temp

cp ./docker/docker-compose.yml ./docker-temp/docker-compose.yml 
cp ./docker/startServer.sh ./docker-temp/startServer.sh 
cp ./docker/shutServer.sh ./docker-temp/shutServer.sh 

chmod +x ./docker-temp/startServer.sh
chmod +x ./docker-temp/shutServer.sh

rm -f ./dist/reportburster-server-linux.zip
zip -r ./dist/reportburster-server-linux.zip ./docker-temp

rm -rf ./docker-temp/

# Step 6: Use rclone to sync/upload the newly generated local zip file to s3
# rclone sync ./dist/reportburster-server-linux.zip s3:your_bucket_name