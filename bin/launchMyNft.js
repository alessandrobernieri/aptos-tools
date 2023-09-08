#! /usr/bin/env node
const { AptosAccount, AptosClient, HexString, CoinClient } = require('aptos');
const axios = require('axios');
var inquirer = require('inquirer');
const path = require('path');
const fs = require('fs');
var moment = require('moment');

const configPath = path.join(process.cwd(), './config.json');
var CONFIG = fs.readFileSync(configPath);
var CONFIG = JSON.parse(CONFIG.toString());

function delay_with_exit() {
    setTimeout(function() {        
        process.exit();
    }, 20000); //
};

const questions = [
    {
        type: 'list',
        name: 'command',
        message: 'What do you want to do?',
        choices: [
            'Info',
            'Mint',
            'Exit',
        ],
    },
]

MINT_AMOUNT = CONFIG.MintAmount;
PRIVATE_KEY = CONFIG.PrivateKey;
NODE_URL = "https://fullnode.mainnet.aptoslabs.com/v1";
FAUCET_URL = null;
CANDY_ADDRESS = CONFIG.CandyAddress;

const pkeys = new HexString(PRIVATE_KEY)
const payer = new AptosAccount(pkeys.toUint8Array());
const aptosClient = new AptosClient(NODE_URL);
const coinClient = new CoinClient(aptosClient); 

async function welcome()
{
    console.log('Welcome '+payer.address().hex());
    let balance = await coinClient.checkBalance(payer);
    console.log('Your balance: '+Number(balance)/ 100000000);
    main();
}

async function getCandy()
{
    const response = await axios.get(NODE_URL+'/accounts/'+CANDY_ADDRESS+'/resources');
    const resources = response.data;
    
    const collectionInfo = {}
    for (const resource of resources) {
        if (resource.type === '0x9b9812f618c67f447aeaa93605074433f2f11489e23d7e775f2d705d2f40f86::minting::TestMinter')
        {
            collectionInfo.collectionName = resource.data.collection_name;
            collectionInfo.mintPrice = resource.data.phazes[CONFIG.Phase].price;
            collectionInfo.supply = 0;
            collectionInfo.maxSupply = 0;
            collectionInfo.startTime = resource.data.phazes[CONFIG.Phase].startTime;
            collectionInfo.startTimeWl = resource.data.start_time_wl;
        }
    }
    printInfo(collectionInfo);
}

function convertUnix(timestamp) {
    var date = new Date(timestamp  * 1000);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var day = date.getDate();
    var month = months[date.getMonth()];
    var year = date.getFullYear();
    var hours = date.getHours();
    var minutes = "0" + date.getMinutes();
    var seconds = "0" + date.getSeconds();
    var formattedTime = day + ' ' + month + ' ' + year + '    ' + hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
    return formattedTime;
}

async function printInfo(collectionInfo)
{
    console.log(collectionInfo.collectionName);
    console.log('Price: '+collectionInfo.mintPrice / 100000000+' APT');
    console.log('Minted: '+collectionInfo.supply+'/'+collectionInfo.maxSupply);
    console.log('WL:'+convertUnix(collectionInfo.startTimeWl));
    console.log('Public:'+convertUnix(collectionInfo.startTime));
    main();
}

async function mint(i, start, price, sequence)  {
    info = collectionInfo
    const payload = {
      type: "entry_function_payload",
      function: "0x9b9812f618c67f447aeaa93605074433f2f11489e23d7e775f2d705d2f40f86::minting::mint",
      type_arguments: [],
      arguments: [
        CONFIG.CandyAddress,
        price,
	      1,
          "0x"
      ]
    };
    let txInfo;
    var number = Number(sequence)+i; 
    const Tx = await aptosClient.generateTransaction(payer.address(), payload, options={sequence_number:number+1,gas_unit_price:CONFIG.Gas});
    const signedTx = await aptosClient.signTransaction(payer, Tx);
    const submitTx = await aptosClient.submitTransaction(signedTx);
    //const waitTx = await aptosClient.waitForTransactionWithResult(submitTx.hash);
    var end = moment();
    var duration = moment.duration(end.diff(start));
    console.log('\x1b[32m','TX '+submitTx.hash+' sent in '+duration+' ms');
}


welcome()


async function main() {
    const response = await axios.get(NODE_URL+'/accounts/'+CANDY_ADDRESS+'/resources');
    const resources = response.data;
    
    let price = {}
    for (const resource of resources) {
        if (resource.type === '0x9b9812f618c67f447aeaa93605074433f2f11489e23d7e775f2d705d2f40f86::minting::TestMinter')
        {
            price = resource.data.phazes[CONFIG.Phase].price;
        }
    }
    await inquirer.prompt(questions).then((answers) => {
        if (answers.command == "Info")
        {
            (async () => {
                collectionInfo = getCandy();;
            })();
        };
        if (answers.command == "Mint")
        {
            (async () => {
                const response = await axios.get(NODE_URL+'/accounts/'+payer.address().hex()+'/transactions?limit=1');
                const resources = response.data;
                sequence = resources[0].sequence_number;
                i = 0;
                while(i<MINT_AMOUNT) {
                    var start = moment();
                    await mint(i, start, price, sequence);
                    i=i+1;
                }
                console.log('\x1b[0m','');
                delay_with_exit();
            })();
        };
        if (answers.command == "Exit")
        {
            console.log("\x1b[37m",'Goodbye.')
            delay_with_exit();
        };
    });
}






