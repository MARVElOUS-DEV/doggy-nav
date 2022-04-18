#!/usr/bin/env bash

export USERNAME=$1
export PASSWORD=$2

docker-compose -f docker-compose-prod.yml down  -v --rmi all
sleep 10
docker-compose -f docker-compose-prod.yml up -d
docker exec -e USERNAME=$1 -e PASSWORD=$2 doggyserver npx ts-node reptile.js 

