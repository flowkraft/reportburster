#!/bin/sh

# Copy files from container to host
cp -r /app/config/* ./config/
cp -r /app/input-files/* ./input-files/
cp -r /app/samples/* ./samples/
cp -r /app/scripts/* ./scripts/

# Start the Java Spring Boot application
exec java -Dserver.port=9090 -DPORTABLE_EXECUTABLE_DIR=$PORTABLE_EXECUTABLE_DIR_PATH -DUID=9090 -Dspring.resources.static-locations=file:///$FRONTEND_PATH -DPOLLING_PATH=$POLLING_PATH -jar /app/lib/server/rb-server.jar -serve