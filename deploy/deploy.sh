#!/usr/bin/env bash
# mongodb user settings
export USERNAME=$1
export PASSWORD=$2

# build in the root directory
yarn
yarn build
# remove obsolete containers and images
docker-compose -f docker-compose-prod.yml down  -v --rmi all
sleep 5
# build and deploy
docker-compose -f docker-compose-prod.yml up -d
# init your mongodb
docker exec -e USERNAME=$1 -e PASSWORD=$2 doggyserver npx node reptile.js

