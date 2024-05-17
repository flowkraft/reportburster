#!/bin/bash

while getopts d:p:s:q: flag
do
    case "${flag}" in
        d) DOCKER_USERNAME=${OPTARG};;
        p) DOCKER_PASSWORD=${OPTARG};;
        s) S3_USERNAME=${OPTARG};;
        q) S3_PASSWORD=${OPTARG};;
    esac
done

# Step 1: Get the latest from git
git reset --hard
git pull origin main

# Step 2: Read the version from the XML file
version=$(grep -oPm1 "(?<=<version>)[^<]+" ../backend/reporting/src/main/external-resources/template/config/burst/settings.xml)

# Step 3: Build the Docker image and upload it to Docker Hub
docker build --no-cache --progress=plain -t reportburster_server:$version -f ../Dockerfile ..

# Use the credentials
# For example, to login to Docker:
echo $DOCKER_PASSWORD | docker login --username $DOCKER_USERNAME --password-stdin
docker tag reportburster_server:$version $DOCKER_USERNAME/reportburster_server:$version
docker push $DOCKER_USERNAME/reportburster_server:$version

# Step 4: Update docker-compose.yml with the version parsed previously
sed -i "s/image:reportburster_server:.*/image:reportburster_server:$version/" ./docker/docker-compose.yml

# Update the reportburster.sh, startServer.sh with the latest version
sed -i "s/\(image=\"reportburster_server:\).*\"/\1$version\"/" ./docker/reportburster.sh
sed -i "s/\(image=\"reportburster_server:\).*\"/\1$version\"/" ./docker/startServer.sh

chmod +x ./docker/reportburster.sh
chmod +x ./docker/startServer.sh
chmod +x ./docker/shutServer.sh

chmod +x ./docker/_clean.sh && cd ./docker && ./_clean.sh && cd ..

# Step 5: Pack docker folder as a zip file
rm -rf ./docker-temp/
mkdir ./docker-temp

cp ./docker/docker-compose.yml ./docker-temp/docker-compose.yml 

cp ./docker/startServer.sh ./docker-temp/reportburster.sh
cp ./docker/startServer.sh ./docker-temp/startServer.sh 
cp ./docker/shutServer.sh ./docker-temp/shutServer.sh 

chmod +x ./docker-temp/reportburster.sh
chmod +x ./docker-temp/startServer.sh
chmod +x ./docker-temp/shutServer.sh

#create the dist directory if it doesn't already exist. If the directory does exist, mkdir -p will do nothing
mkdir -p ./dist
rm -f ./dist/reportburster-server-linux.zip
zip -r ./dist/reportburster-server-linux.zip ./docker-temp

rm -rf ./docker-temp/

# And to use AWS CLI with S3:
export AWS_ACCESS_KEY_ID=$S3_USERNAME
export AWS_SECRET_ACCESS_KEY=$S3_PASSWORD
# Then you can use AWS CLI commands

# Step 6: Use rclone to sync/upload the newly generated local zip file to s3
rclone sync ./dist/reportburster-server-linux.zip s3://documentburster/newest/reportburster-server-linux.zip