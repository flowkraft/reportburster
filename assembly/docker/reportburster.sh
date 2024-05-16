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

# Store the script arguments
args="$@"

# Run the Docker command with the arguments
docker run -it --rm \
  -v $(pwd)/backup:/app/backup \
  -v $(pwd)/config:/app/config \
  -v $(pwd)/input-files:/app/input-files \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/output:/app/output \
  -v $(pwd)/quarantine:/app/quarantine \
  -v $(pwd)/poll:/app/poll \
  -v $(pwd)/samples:/app/samples \
  -v $(pwd)/scripts:/app/scripts \
  $image reportburster.sh $args