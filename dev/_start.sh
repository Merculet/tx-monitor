#!/bin/sh

set -x

./wait-for-it.sh mysql_1:3306 -t 60 -- echo 'mysql_1:3306 started up'

./wait-for-it.sh zookeeper_1:2181 -t 60 -- echo 'zookeeper_1:2181 started up'

./wait-for-it.sh kafka_1:9092 -t 60 -- echo 'kafka_1:9092 started up'

echo 'now ready for me to start up'
pm2 start pm2/dev.json --no-daemon --watch
