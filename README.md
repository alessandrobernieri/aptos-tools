# Aptos Tools

This command-line application, developed in Node.js, empowers users to effortlessly mint or snipe NFTs from various programs on the Aptos blockchain. By using this tool, you can expedite the minting/sniping process by directly interacting with the blockchain, eliminating the need for a frontend interface.

## Features

- **Efficient Minting:** Mint NFTs quickly and efficiently, significantly reducing wait times compared to using a frontend.
- **Fast Sniping:** Buy NFTs quickly and efficiently, significantly faster compared to using the marketplace frontend. Snipe an NFT as soon as it reach the blockchain.
- **Configuration File:** Customize your minting and sniping experience by providing your wallet's private keys, specifying the Candy Machine address, the number of NFTs to mint, maximum price thresholds, and more.

## Contracts Supported

This tool supports the following contracts:

- Candy V2 (mint)
- Topaz (mint)
- BlueMove (mint)
- LaunchMyNFT (mint)
- Topaz Marketplace (snipe)

## Prerequisites

Before using this application, make sure you have the following prerequisites installed:

- [Node.js](https://nodejs.org/): Download and install Node.js.
- npm (Node Package Manager): Included with Node.js installation.

## Installation

1. Clone this GitHub repository to your local machine:

   ```sh
   git clone https://github.com/alessandrobernieri/aptos-tools.git
   ```

2. Navigate to the project directory:

   ```sh
   cd aptos-tools
   ```

3. Install the required dependencies:

   ```sh
   npm install
   ```

## Usage

1. Configure the application by editing the `config.json` file:

   - Provide your wallet's private keys.
   - Specify the address you want to mint from.
   - Set the number of NFTs you want to mint.
   - Define a gas price to pay for each transaction.
   - Set maximum price thresholds to prevent minting if the price exceeds these limits.
   - If you want to use the sniper, set the collection address and the maximum price to pay for each NFT. Optionally, you can set a sleep time between each collection refresh.

2. Run the minting or sniping process based on the contract you want to interact with:

   ```sh
   node src/*contract-name*.js
   ```

## Contribution

Contributions are welcome! If you have any suggestions or improvements, please open an issue or create a pull request on this GitHub repository.

## License

This project is licensed under the MIT License. For more details, please refer to the [LICENSE](LICENSE) file.

**Note:** Exercise caution when dealing with private keys and sensitive information. Keep your private keys secure and do not share them publicly.