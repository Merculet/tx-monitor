#!/bin/sh

set -x

docker-compose -f dev/docker-compose.yml down --remove-orphans
