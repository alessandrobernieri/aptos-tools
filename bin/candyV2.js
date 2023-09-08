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
        if (resource.type === '0xb9742b5dc72993aae12844c4b23148bdd6ffacecd3bd51d93f0209e259b03f1c::factory::MintData')
        {
            collectionInfo.collectionName = resource.data.collection_name;
            collectionInfo.mintPrice = resource.data.price_per_item;
            collectionInfo.supply = 0;
            collectionInfo.maxSupply = resource.data.total_nfts;
            collectionInfo.startTime = resource.data.start_time;
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

async function mint(i, start, sequence)  {
    const payload = {
      type: "entry_function_payload",
      function: "0x481efbf0c3cbec627b5f5674287d4ae6ee770da5949dcfe698a8520108236a33::candy_machine_v2::mint_tokens",
      type_arguments: [],
      arguments: [
        "0x4dd900eb454c9b95fb630a896c80e4d71813d76ab8fdedb32a81e09b5b41495c",
        "Silly Sausages",
	      5,
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
                    await mint(i, start, sequence);
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






