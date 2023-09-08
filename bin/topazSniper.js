#! /usr/bin/env node
const { AptosAccount, AptosClient, HexString, CoinClient } = require('aptos');
const path = require('path');
const fs = require('fs');
var moment = require('moment');
const puppeteer = require('puppeteer-extra'); 
const StealthPlugin = require('puppeteer-extra-plugin-stealth')


const configPath = path.join(process.cwd(), './config.json');
var CONFIG = fs.readFileSync(configPath);
var CONFIG = JSON.parse(CONFIG.toString());

function delay_with_exit() {
    setTimeout(function() {        
        process.exit();
    }, 20000); //
};

MINT_AMOUNT = CONFIG.MintAmount;
PRIVATE_KEY = CONFIG.PrivateKey;
NODE_URL = "https://fullnode.mainnet.aptoslabs.com/v1";
FAUCET_URL = null;
CANDY_ADDRESS = CONFIG.CandyAddress;
maxPrice = CONFIG.MaxPrice;

const pkeys = new HexString(PRIVATE_KEY);
const payer = new AptosAccount(pkeys.toUint8Array());
const aptosClient = new AptosClient(NODE_URL);
const coinClient = new CoinClient(aptosClient); 

async function delay() {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve('resolved');
        }, CONFIG.SleepTime);
    });
}

async function welcome()
{
    console.log('Welcome '+payer.address().hex());
    let balance = await coinClient.checkBalance(payer);
    console.log('Your balance: '+Number(balance)/ 100000000);
    main();
}

async function buyItem(item) {
    var start = moment();
    token_address = (item.token_id).split('::');
    console.log('Buying '+token_address[1]+' '+token_address[2]+'...')
    const payload = {
        type: "entry_function_payload",
        function: "0x2c7bccf7b31baf770fdbcc768d9e9cb3d87805e255355df5db32ac9a669010a2::marketplace_v2::buy",
        type_arguments: [
            "0x1::aptos_coin::AptosCoin"
        ],
        arguments: [
            item.seller,
            item.price,
            item.amount,
            token_address[0],
            token_address[1],
            token_address[2],
            0
        ]
      };
    const Tx = await aptosClient.generateTransaction(payer.address(), payload, options={gas_unit_price:CONFIG.Gas});
    const signedTx = await aptosClient.signTransaction(payer, Tx);
    const submitTx = await aptosClient.submitTransaction(signedTx);
    var end = moment();
    const waitTx = await aptosClient.waitForTransactionWithResult(submitTx.hash);
    var duration = moment.duration(end.diff(start));
    console.log('\x1b[32m','Bought '+token_address[1]+' '+token_address[2]+'in '+duration+' ms','\x1b[0m');
}

async function findSnipe(jsonBlocks, page)
{
    found = false;
    try {
        listedItems = JSON.parse(jsonBlocks);
        listedItems = listedItems.data;
        console.log('Floor is '+listedItems[0].price/ 100000000+', '+listedItems[1].price/ 100000000+', '+listedItems[2].price/ 100000000+', '+listedItems[3].price/ 100000000+', '+listedItems[4].price/ 100000000+'...');
        for(var item of listedItems) {
            if ((item.price / 100000000) <= maxPrice) {
                trovato = true;
                await buyItem(item);
            }
        }
        if (found==false) {
            return getCollection(page);
        }
    } catch(err) {
        console.log('rate limited')
        return getCollection(page);
    }
}

async function createPage() {
    try {
        puppeteer.use(StealthPlugin())
        const browser = await puppeteer.launch({
            headless: false, //launch in non-headless mode so you can see graphics
            executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe"
        });
        const page = await browser.newPage(); 
        await page.waitForTimeout(5000);
        await getCollection(page);
    } catch(err) {
        console.log(err)
        await main();
    }
}

async function getCollection(page) {
    await delay(); 
    try {
        await page.goto('https://www.topaz.so/api/listing-view?collection_id='+CONFIG.Collection+'&from=0&to=10', { waitUntil: 'networkidle0' }); 
        await page.waitForSelector('pre')
        var content = await page.content();
        content = content.split('<pre style="word-wrap: break-word; white-space: pre-wrap;">')
        content2 = content[1].split('</pre>')
        console.log("\x1b[37m", moment().format("HH:mm:ss")+': Searching...');
        findSnipe(content2[0], page);
    } catch(err) {
        console.log(err)
    }
}

async function main() {
    await createPage();
}

welcome();





