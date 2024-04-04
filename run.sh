#!/bin/bash

LC=$(printenv LIDARR_CONTAINER)
nohup python ./python/deemix-server.py > ~/nohup_deemix.txt &
nohup pnpm run start > ~/nohup_server.txt &
docker exec -it $LC /bin/bash -c "update-ca-certificates" || true > /dev/null 2>&1
mitmdump -s ./python/http-redirect-request.py
