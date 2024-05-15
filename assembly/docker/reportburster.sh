#!/bin/bash

# Store the script arguments
args="$@"

# Define the image name
image="reportburster_server:10.1.1"

# Run the Docker command with the arguments
docker run -it --rm $image reportburster.sh $args