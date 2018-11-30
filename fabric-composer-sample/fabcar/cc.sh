#!/bin/bash

# Exit on first error, print all commands.
set -ev

CC_VER=1.0

# clean the keystore
#rm -rf ./hfc-key-store


CC_NAME=fabcar
CHANNEL=composerchannel
CC_LANG=golang
CC_INIT_ARGS='{"Args":[""]}'
CC_1ST_ARGS='{"function":"initLedger","Args":[""]}'
CC_POLICY="OR ('Org1MSP.member','Org2MSP.member')"
ORDERER=orderer.example.com:7050
CLI="sudo docker exec cli"
CLI_CC="$CLI peer chaincode"

$CLI_CC install -n $CC_NAME -v $CC_VER -p chaincode -l $CC_LANG
$CLI_CC instantiate -o $ORDERER -C $CHANNEL -n $CC_NAME -l $CC_LANG -v $CC_VER -c $CC_INIT_ARGS -P "$CC_POLICY"
sleep 10
$CLI_CC invoke -o $ORDERER -C $CHANNEL -n $CC_NAME -c "$CC_1ST_ARGS"
