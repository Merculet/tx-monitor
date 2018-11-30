#!/bin/sh

set -x

docker-compose -f dev/docker-compose.yml up $1
