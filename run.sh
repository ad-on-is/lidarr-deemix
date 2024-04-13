#!/bin/bash

nohup python ./python/deemix-server.py > ~/nohup_deemix.txt 2>&1 &
nohup pnpm run start > ~/nohup_server.txt 2>&1 &
nohup mitmdump -s ./python/http-redirect-request.py > ~/nohup_mitmdump.txt 2>&1 &

tail -f ~/nohup_*.txt
