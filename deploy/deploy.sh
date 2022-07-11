#!/usr/bin/env bash
# mongodb user settings
export USERNAME=$1
export PASSWORD=$2
# just for init db, this is optional
export INIT_DB_URL=$3
export TAG=$(git rev-parse --short HEAD)
echo $TAG
# build in the root directory
yarn && yarn build

# remove obsolete containers and images
cd deploy && docker-compose -f docker-compose-init-prod.yml down  -v --rmi all
sleep 5
# build and deploy
docker-compose -f docker-compose-init-prod.yml up -d

if [[ -n $3 ]]; then
  # init your mongodb
  docker exec -e USERNAME=$1 -e PASSWORD=$2 -e INIT_DB_URL=$3 doggyserver npx node ./utils/reptile.js
fi
cd  -
echo 'deploy finished'


