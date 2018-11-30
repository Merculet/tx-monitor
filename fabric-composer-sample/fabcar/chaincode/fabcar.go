/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/*
 * The sample smart contract for documentation topic:
 * Writing Your First Blockchain Application
 */

package main

/* Imports
 * 4 utility libraries for formatting, handling bytes, reading and writing JSON, and string manipulation
 * 2 specific Hyperledger Fabric specific libraries for Smart Contracts
 */
import (
	"bytes"
	"encoding/json"
	"fmt"
	"math/rand"
	"strconv"
	"time"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	sc "github.com/hyperledger/fabric/protos/peer"
)

// Define the Smart Contract structure
type SmartContract struct {
}

// Define the car structure, with 4 properties.  Structure tags are used by encoding/json library
type Car struct {
	Make   string `json:"make"`
	Model  string `json:"model"`
	Colour string `json:"colour"`
	Owner  string `json:"owner"`
	Amount int    `json:"amount"`
}

/*
 * The Init method is called when the Smart Contract "fabcar" is instantiated by the blockchain network
 * Best practice is to have any Ledger initialization in separate function -- see initLedger()
 */
func (s *SmartContract) Init(APIstub shim.ChaincodeStubInterface) sc.Response {
	return shim.Success(nil)
}

/*
 * The Invoke method is called as a result of an application request to run the Smart Contract "fabcar"
 * The calling application program has also specified the particular smart contract function to be called, with arguments
 */
func (s *SmartContract) Invoke(APIstub shim.ChaincodeStubInterface) sc.Response {

	// Retrieve the requested Smart Contract function and arguments
	function, args := APIstub.GetFunctionAndParameters()

	fmt.Println("invoke fabcar cc: ", function, args)

	// Route to the appropriate handler function to interact with the ledger appropriately
	if function == "queryCar" {
		return s.queryCar(APIstub, args)
	} else if function == "initLedger" {
		return s.initLedger(APIstub)
	} else if function == "createCar" {
		return s.createCar(APIstub, args)
	} else if function == "queryAllCars" {
		return s.queryAllCars(APIstub)
	} else if function == "changeCarOwner" {
		return s.changeCarOwner(APIstub, args)
	} else if function == "testAtomicBatch" {
		return s.testAtomicBatch(APIstub, args)
	} else if function == "batch_generic" {
		return s.batch_generic(APIstub)
	} else if function == "batch_direct" {
		return s.batch_direct(APIstub)
	} else if function == "increaseAmount" {
		return s.increaseAmount(APIstub, args)
	} else if function == "batch_increaseAmount" {
		return s.batch_increaseAmount(APIstub)
	} else if function == "replaceCar" {
		return s.replaceCar(APIstub, args)
	} else if function == "readThenReplaceCar" {
		return s.readThenReplaceCar(APIstub, args)
	}

	return shim.Error("Invalid Smart Contract function name.")
}

func (s *SmartContract) queryCar(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	carAsBytes, _ := APIstub.GetState(args[0])
	return shim.Success(carAsBytes)
}

func (s *SmartContract) increaseAmount(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	carAsBytes, _ := APIstub.GetState(args[0])
	car := Car{}
	json.Unmarshal(carAsBytes, &car)

	car.Amount++

	carAsBytes, _ = json.Marshal(car)
	APIstub.PutState(args[0], carAsBytes)

	return shim.Success(carAsBytes)
}

// Invoke batch
func (s *SmartContract) batch_increaseAmount(APIstub shim.ChaincodeStubInterface) sc.Response {
	args := APIstub.GetArgs()

	//chaincodeName := string(args[1])
	//fmt.Println("chaincodeName:\t", chaincodeName)

	//channelID := APIstub.GetChannelID()
	//fmt.Println("channelID:\t", channelID)

	for i := 2; i < len(args); i++ {
		//fmt.Println("i: ", i, "-------------------------------------------------------")

		subArgsAsTEXT := []string{}
		json.Unmarshal(args[i], &subArgsAsTEXT)
		//fmt.Println("subArgsAsTEXT:\t", subArgsAsTEXT)

		subArgs := make([]string, 0, len(subArgsAsTEXT))
		for n := 0; n < len(subArgsAsTEXT); n++ {
			//fmt.Println("subArgsAsTEXT[n]:\t", subArgsAsTEXT[n])

			subArgs = append(subArgs, subArgsAsTEXT[n])
		}

		//fmt.Println("subArgs:\t", subArgs)

		_ = s.increaseAmount(APIstub, subArgs[1:])
		//fmt.Println("resp:\t", resp)
	}

	return shim.Success(nil)
}

func (s *SmartContract) initLedger(APIstub shim.ChaincodeStubInterface) sc.Response {
	cars := []Car{
		Car{Make: "Toyota", Model: "Prius", Colour: "blue", Owner: "Tomoko", Amount: 1},
		Car{Make: "Ford", Model: "Mustang", Colour: "red", Owner: "Brad", Amount: 1},
		Car{Make: "Hyundai", Model: "Tucson", Colour: "green", Owner: "Jin Soo", Amount: 1},
	}

	i := 0
	for i < len(cars) {
		fmt.Println("i is ", i)
		carAsBytes, _ := json.Marshal(cars[i])
		APIstub.PutState("CAR"+strconv.Itoa(i), carAsBytes)
		fmt.Println("Added", cars[i])
		i = i + 1
	}

	return shim.Success(nil)
}

func (s *SmartContract) testAtomicBatch(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {
	fmt.Println("****************************************************************")

	r := rand.New(rand.NewSource(time.Now().UnixNano()))

	var newMaker = "maker_" + strconv.Itoa(r.Intn(100000)) //args[0]

	cars_valid := []Car{
		Car{Make: newMaker, Model: "Model_1", Colour: "Colour_4", Owner: "Owner_5", Amount: 1},
		Car{Make: newMaker, Model: "Model_2", Colour: "Colour_4", Owner: "Owner_5", Amount: 1},
		Car{Make: newMaker, Model: "Model_3", Colour: "Colour_4", Owner: "Owner_5", Amount: 1},
	}

	cars_conflict := []Car{
		Car{Make: newMaker, Model: "Prius_modified", Colour: "blue_modified", Owner: "Tomok_modifiedo", Amount: 1},
		Car{Make: newMaker, Model: "Mustang_modified", Colour: "red_modified", Owner: "Brad_modified", Amount: 1},
		Car{Make: newMaker, Model: "Tucson_modified", Colour: "green_modified", Owner: "Jin Soo_modified", Amount: 1},
	}

	var i = 0

	fmt.Println("cars_valid---->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
	i = 0
	for i < len(cars_valid) {
		fmt.Println("i = ", i)

		key := "CAR" + strconv.Itoa(1000+r.Intn(1000))

		carAsBytes, _ := json.Marshal(cars_valid[i])
		APIstub.PutState(key, carAsBytes)
		fmt.Println(key, " rand value: ", string(carAsBytes))

		i = i + 1
	}

	fmt.Println("cars_conflict----->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
	i = 0
	for i < len(cars_conflict) {
		fmt.Println("i = ", i)

		key := "CAR" + strconv.Itoa(i)

		oldValue, _ := APIstub.GetState(key)
		fmt.Println(key, " old value: ", string(oldValue))

		carAsBytes, _ := json.Marshal(cars_conflict[i])
		APIstub.PutState(key, carAsBytes)
		fmt.Println(key, " new value: ", string(carAsBytes))

		i = i + 1
	}

	return shim.Success(nil)
}

// Invoke batch
func (s *SmartContract) batch_generic(APIstub shim.ChaincodeStubInterface) sc.Response {
	args := APIstub.GetArgs()

	chaincodeName := string(args[1])
	fmt.Println("chaincodeName:\t", chaincodeName)

	channelID := APIstub.GetChannelID()
	fmt.Println("channelID:\t", channelID)

	for i := 2; i < len(args); i++ {
		fmt.Println("i: ", i, "-------------------------------------------------------")

		subArgsAsTEXT := []string{}
		json.Unmarshal(args[i], &subArgsAsTEXT)
		fmt.Println("subArgsAsTEXT:\t", subArgsAsTEXT)

		subArgs := make([][]byte, 0, len(subArgsAsTEXT))
		for n := 0; n < len(subArgsAsTEXT); n++ {
			fmt.Println("subArgsAsTEXT[n]:\t", subArgsAsTEXT[n])

			subArgBytes := []byte(subArgsAsTEXT[n])
			fmt.Println("subArgBytes:\t", subArgBytes)

			subArgs = append(subArgs, subArgBytes)
		}

		fmt.Println("subArgs:\t", subArgs)

		resp := APIstub.InvokeChaincode(chaincodeName, subArgs, channelID)
		fmt.Println("resp:\t", resp)
	}

	return shim.Success(nil)
}

// Invoke batch
func (s *SmartContract) batch_direct(APIstub shim.ChaincodeStubInterface) sc.Response {
	args := APIstub.GetArgs()

	//chaincodeName := string(args[1])
	//fmt.Println("chaincodeName:\t", chaincodeName)

	//channelID := APIstub.GetChannelID()
	//fmt.Println("channelID:\t", channelID)

	for i := 2; i < len(args); i++ {
		//fmt.Println("i: ", i, "-------------------------------------------------------")

		subArgsAsTEXT := []string{}
		json.Unmarshal(args[i], &subArgsAsTEXT)
		//fmt.Println("subArgsAsTEXT:\t", subArgsAsTEXT)

		subArgs := make([]string, 0, len(subArgsAsTEXT))
		for n := 0; n < len(subArgsAsTEXT); n++ {
			//fmt.Println("subArgsAsTEXT[n]:\t", subArgsAsTEXT[n])

			subArgs = append(subArgs, subArgsAsTEXT[n])
		}

		//fmt.Println("subArgs:\t", subArgs)

		_ = s.createCar(APIstub, subArgs[1:])
		//fmt.Println("resp:\t", resp)
	}

	return shim.Success(nil)
}

func (s *SmartContract) createCar(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 5 {
		return shim.Error("Incorrect number of arguments. Expecting 5")
	}

	var car = Car{Make: args[1], Model: args[2], Colour: args[3], Owner: args[4], Amount: 1}

	carAsBytes, _ := json.Marshal(car)
	APIstub.PutState(args[0], carAsBytes)

	return shim.Success(nil)
}

func (s *SmartContract) queryAllCars(APIstub shim.ChaincodeStubInterface) sc.Response {

	startKey := "CAR0"
	endKey := "CAR99999"

	resultsIterator, err := APIstub.GetStateByRange(startKey, endKey)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	// buffer is a JSON array containing QueryResults
	var buffer bytes.Buffer
	buffer.WriteString("[\n")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		// Add a comma before array members, suppress it for the first array member
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",\n")
		}
		buffer.WriteString("{\"Key\":")
		buffer.WriteString("\"")
		buffer.WriteString(queryResponse.Key)
		buffer.WriteString("\"")

		buffer.WriteString(", \"Record\":")
		// Record is a JSON object, so we write as-is
		buffer.WriteString(string(queryResponse.Value))
		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("\n]")

	fmt.Printf("- queryAllCars:\n%s\n", buffer.String())

	return shim.Success(buffer.Bytes())
}

func (s *SmartContract) changeCarOwner(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	carAsBytes, _ := APIstub.GetState(args[0])
	car := Car{}

	json.Unmarshal(carAsBytes, &car)
	car.Owner = args[1]

	carAsBytes, _ = json.Marshal(car)
	APIstub.PutState(args[0], carAsBytes)

	return shim.Success(nil)
}

func (s *SmartContract) replaceCar(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {
	key := args[0]
	newMake := args[1]

	newCar := Car{Make: newMake, Model: "Model__replaced", Colour: "Colour_replaced", Owner: "Owner_replaced", Amount: 1}
	carAsBytes, _ := json.Marshal(newCar)
	APIstub.PutState(key, carAsBytes)

	return shim.Success(nil)
}

func (s *SmartContract) readThenReplaceCar(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {
	key := args[0]
	newMake := args[1]

	carAsBytes, _ := APIstub.GetState(key)
	car := Car{}

	json.Unmarshal(carAsBytes, &car)

	car.Make = newMake
	carAsBytes, _ = json.Marshal(car)
	APIstub.PutState(key, carAsBytes)

	return shim.Success(nil)
}

// The main function is only relevant in unit test mode. Only included here for completeness.
func main() {

	// Create a new Smart Contract
	err := shim.Start(new(SmartContract))
	if err != nil {
		fmt.Printf("Error creating new Smart Contract: %s", err)
	}
}
