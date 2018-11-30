#!/bin/bash

echo
echo
set -x

WORK_DIR=$PWD
OS=`uname -s`
# MY_OS=$(echo $OS | awk '{print tolower($OS)}')

# prepare the data directory
DATA_DIR=/data/txm
sudo mkdir -p ${DATA_DIR}
if [ ${OS} == 'Darwin' ]; then
   sudo chown -R `users`:staff ${DATA_DIR}
fi


# prepare home directory
mkdir ${WORK_DIR}/home/
cp -r ${HOME}/.composer ${WORK_DIR}/home/

DOCKER_HOST=172.17.0.1
COMPOSER_HOST=localhost
SED_REGEX="s/${COMPOSER_HOST}/${DOCKER_HOST}/g"

# update connection info in Fabric composer card
if [ ${OS} == 'darwin' ]; then
   SED_OPTS="-it"
else
   SED_OPTS="-i"
fi

FC_USER=admin
FC_NETWORK=tutorial-network
FC_PROFILE=${FC_USER}@${FC_NETWORK}
sed ${SED_OPTS} -e ${SED_REGEX} ${WORK_DIR}/home/.composer/cards/${FC_PROFILE}/connection.json

set +x
echo
echo

if [ ${OS} == 'Darwin' ]; then
   echo '!!! For Mac OS, please share below folders with docker daemon:'
   echo '    1) The project folder'
   echo '    2) /data/txm/'
fi

echo
echo

