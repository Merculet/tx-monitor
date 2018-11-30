Transaction Monitor for Hyperledger Fabric (https://github.com/hyperledger/fabric) 

Forward Fabric block event to Kafka topic for Fabric client to consume. Actually it follows what Fabric Client SDK suggests (https://github.com/hyperledger/fabric-sdk-node/blob/release-1.1/fabric-client/lib/ChannelEventHub.js)

```
The events are ephemeral, such that if a registered listener crashed when the event is published, the listener will miss the event. There are several techniques to compensate for missed events due to client crashes:

1. register block event listeners and record the block numbers received, such that when the next block arrives and its number is not the next in sequence, then the application knows exactly which block events have been missed. It can then use [queryBlock]{@link Channel#queryBlock} to get those missed blocks from the target peer or register for events using the startBlock option to resume or replay the events. You may also include an endBlock number if you wish to stop listening.

2. use a message queue to catch all the block events. With many robust message queue implementations available today, you will be guaranteed to not miss an event. A fabric event listener can be written in any programming language. The following implementations can be used as reference to write the necessary glue code between the fabric event stream and a message queue:

...

```


## Contents

* [Motivation](#motivation)
* [Features](#features)
* [Development deployment](#development-deployment)
* [Product deployment](#product-deployment)
* [Event format](#event-format)
* [Full Configuration](#full-configuration)
* [Administration API](#api-for-administration)
* [TODO List](#todo-list)
* [Build Status](#build-status)





## Motivation

* Fabric events are not persisted, that means, clients, for ex. merculet GaaS service, will get events lost if crashed or during shutdown.

* Fabric events may be duplicated, when the Fabric peer which clients are connecting to changes or is syncing up. So we should remove the burden of dealing with duplication from client, ensure at-least-once or exactly-once event delivering.

* Client application likes message queue rather than connecting to Fabric to receive block events via Fabric client SDK.

* Block event is really heavy -- block event payload, including proposal request & response & signature and etc, most part of which are what client application doesn't care, but bandwidth-consuming and CPU-consuming. Client application will benefit from filtering unnecessary block payload, especially for node.js applications (which is single-process-single-thread model even node.js clustering so each node.js process will get a copy of block event!)


## Features

* Subscribe block events from Fabric event hub then forwards them to Kafka, includes:
    * Persists events in MySQL including payload and block height. Old events are cleared periodically.
    * Ignores duplicating events, by querying MySQL.
    * For non-duplicating events, delivering them to Kafka topics. 
    
* Automatically catch up to events in latest block, during bootstrapping

* Administrative API:
    * Sync up block events with designated block number and range
    * Re-catchup to block events in latest block
    
* Reuse Fabric composer (https://github.com/hyperledger/composer) card store to connect to Fabric
  Note: this feature will be removed soon

* TODO: alerting for invalid malicious transaction


## Development deployment

  * Follow [Fabric composer tutorial](https://hyperledger.github.io/composer/latest/installing/development-tools) to bootstrap a Fabric 1.1 network
  
    Note, following that tutorial, it's enough good until (incudes) running  `./createPeerAdminCard.sh` -- no need `composer-playground`.
  
  * Bootstrap the sample composer business network
  
    ```shell
      cd fabric-composer-sample/tutorial-network
      composer archive create -t dir -n .
      composer network install --card PeerAdmin@hlfv1 --archiveFile tutorial-network@0.0.1.bna
      composer network start --networkName tutorial-network --networkVersion 0.0.1 --networkAdmin admin --networkAdminEnrollSecret adminpw --card PeerAdmin@hlfv1 --file networkadmin.card
      composer card import --file networkadmin.card
      composer network ping --card admin@tutorial-network
      composer-rest-server -c admin@tutorial-network -n never -w true
    ```

    To upgrade

    ```shell
      composer archive create --sourceType dir --sourceName . -a tutorial-network@0.0.2.bna
      composer network install --card PeerAdmin@hlfv1 --archiveFile tutorial-network@0.0.2.bna
      composer network upgrade -c PeerAdmin@hlfv1 -n tutorial-network -V 0.0.2
      composer network ping -c admin@tutorial-network | grep Business
    ```
    
  * Prepare to run
    
    The app will run inside docker container via docker-compose. We need to:
  
    * (Optional) in order to use consumer tool outside docker, run `npm install` or `yarn` (preferrable)

    * Run `dev/setup.sh`.
      Note:
      
      * what this script does is to copy Fabric composer card from your `${HOME}` folder to ./home and replace localhost with 172.17.0.1, which is the default local docker host IP. This is because the app runs in separated docker container so the composer card should be changed for the app to reuse to connect to Fabric network. It assumes the local docker host IP is 172.17.0.1, feel free to update the IP according to your local environment.
      
      * For Mac OS, share below folders with docker daemon:
        * The project folder
        * `/data/txm/` (need to create it of course)

    * Run `dev/build.sh`

  * Debugging in Visual Studio Code
  
    * Import the project to Visual Studio Code

    * Run `dev/build.sh` upon code changes
    
    * Run `dev/up.sh` to launch the app. The companioned Kafka and Zookeepr and MySQL will start up too.

    * Switch to debug panel, select `attach (tx-monitor)` to launch debug tool. 
    
      Note, debugging will be interrupted upon any code changes because that will incur app re-launching, so just re-launches debug tool in that case

  * The local development cycle is:

    * Run `dev/up.sh` to launch app environment
    
    * Run `npm run consume` to subscribe Kafka topic, it will print incoming transaction event on console then
    
    * Invoke chaincode to submit Fabric transaction to trigger block event

    * Changes code and run `npm run lint` to ensure no Javascript syntax error. And app running in docker container will automatically launch again
    
    * Run `dev/down.sh` to stop app




## Product deployment

* Pull the image (TODO)

* Below volumes must be mounted:

  * `${WORKDIR}/home:/root/.composer`

    Note, copy Fabric composer stores cards here. It should be sync-up with what composer-rest-server uses

  * `${WORKDIR}/config:/usr/src/app/config`

  * `${WORKDIR}/logs:/usr/src/app/logs`

* Execute `mysql/create_table.sql`

* Create Kafka topic `test_mw_tx`, or enable automatic topic creation in Kafka

* Prepare a `config/config.yml`. Its content for minimal configuration is:

  ```yaml
    Beans:
      ApiServer: 
        port: 8000                             # HTTP API port

      BlockEventListener:
        userName: admin                        # Fabric composer card user name
        networkName: tutorial-network          # Fabric composer business network name
      KafkaSender:
        options:
          metadata.broker.list: kafka_1:9092   # comma-separated kafka brokers
      
    database:
      host: mysql_1
      port: 3306
      user: txm
      password: txmpwd
      database: fabric_txmonitor
  ```
    



## Event Format
   
  ```json
    {
        "channelId": "composerchannel",
        "blockNumber": 27,
        "publishedAt": 1525266524401,
        "receivedAt": 1525266524387,
        "transactionAmount": 2,
        "transactions": [
          {
            "id": "e5f1ed0adc38cf219af3aec581e04ab2dee543cbfe85695ee94aa14ca35986a5", 
            "index": 0,
            "status": 0,
            "code": "VALID",
            "timestamp": 1525266658000,
            "type": 3,
            "typeString": "ENDORSER_TRANSACTION",
            "valid": true 
          },
          {
            "id": "07cf0ba664b4232fa886557fb91c0e9f247f18a337415cb1f242aea5c02f102e", 
            "index": 1,
            "status": 11,
            "code": "MVCC_READ_CONFLICT",
            "timestamp": 1525266658059,
            "type": 3,
            "typeString": "ENDORSER_TRANSACTION",
            "valid": false 
          }
        ]
    }
  ```





## Full Configuration

  See [config/config.yml](https://stash.magicwindow.cn/users/yiting.qiang/repos/tx-monitor/browse/config/config.yml)

  ```yaml
    Beans:
      ApiServer: 
        port: 8000                             # HTTP API port

      BlockEventListener:
        userName: admin                        # Fabric composer card user name
        networkName: tutorial-network          # Fabric composer business network name
      KafkaSender:
        options:
          metadata.broker.list: kafka_1:9092   # comma-separated kafka brokers
        topics:
          composerchannel: test_mw_tx   # Kafka topic name for specific Fabric channel. The example is the default with Fabric composer
        flushAtOnce: true                      # flush Kafka producer queue immediately, true by default
        flushTimeout: 10000                    # flush time out, 10 seconds by default
        dr_cb: true                            # specifies that we want a delivery-report producer event to be generated
        pollInterval: 2000                     # deliver report polling interval, 2 seconds by default
        listenMoreEvents: false                # listening more producer events, true for dev env by default, false for non-dev env

      KafkaConsumer:
        options:
          metadata.broker.list: kafka_1:9092   # another comma-separated kafka brokers, only used by tool/KafkaConsumer.js tool

    database:
      host: mysql_1
      port: 3306
      user: txm
      password: txmpwd
      connectTimeout: 10000
      database: fabric_txmonitor
      sequelize:
        logging: true
        timestamps: true
        paranoid: true
        underscored: true
        freezeTableName: true
        engine: InnoDBs
        dialectOptions:
          charset: utf8mb4
  ```
      




## Administrative API

* Default HTTP port: 8000

* URL: `GET http://<host>:<port>/<API name>`

* Response 

  * HTTP status: 
    
    | Status code     | Description                                           |
    |-----------------|-------------------------------------------------------|
    | 200 or 204      | Succeed                                               |
    | 400             | Request error, for ex. missing a specific parameter   |              
    | 403             | Forbidden                                             |
    | 404             | API not found                                         |
    | 500             | Server internal error                                 |
     
  * Successful HTTP response

    ```json
      {
        "code": 0,
        "key": "OK",
        "time": 1234567890,  // unix timestamp as milli-seconds
        "data": {
              ...
          }
        }
    ```
    
  * Failed response HTTP response

    ```json
      {
        "code": 3,
        "key": "MISSING_PARAMETER",
        "message": "缺少参数 'channelId'",
        "time": 1525266658059   // unix timestamp as milli-seconds
      }
    ```
     
* List of API:

    | API name        | Parameters                                | Description                                          |
    |-----------------|-------------------------------------------|------------------------------------------------------|
    | Catchup         | channelId, targetHeight                   | Catch up to target block height. To protect, targetHeight is limited to current block height + 100 |
    | Ping            | you                                       | For heathy check                                     |
    | Sync            | channelId, blockNumber                    | Sync up block events with specific block number      |
    | SyncRange       | channelId, blockNumberMin, blockNumberMax | Sync up block events with specific block number range. To protect, blockNumberMax is limited to current block height + 100, and (blockNumberMax-blockNumberMin) must be <=100     |




## TODO List

* Re-connect Fabric peer after broken connection

* Automatically check and query missing blocks and dispatch them as block events, without re-bootstrap

* Remove dependency on Fabric composer

* Support Fabric v1.2 and v1.3

* Alerting for invalid malicious transaction

