#!/bin/bash

# Define the image name
image="reportburster_server:10.1.1"

# Define the directories to copy
directories=("backup", "config" "input-files" "logs" "output" "quarantine" "poll" "samples" "scripts")

# Check if the config directory exists and is not empty
if [ ! -d "config" ] || [ -z "$(ls -A config)" ]; then
  # If the config directory does not exist or is empty, create a temporary container
  container=$(docker create $image)
  
  # Loop over the directories
  for dir in "${directories[@]}"; do
    # Copy the files from the container to the host
    docker cp $container:/app/$dir $dir
  done
  
  # Remove the temporary container
  docker rm $container
fi

# Start the services
docker-compose up -d