#!/bin/bash


nohup python ./python/deemix-server.py &
nohup pnpm run start &
mitmdump -s ./python/http-redirect-request.py
