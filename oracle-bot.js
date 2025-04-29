const { ethers } = require("ethers");
const dotenv from "dotenv";
dotenv.config();

// === CONFIG ===
const RPC_URL = "https://rpc.vscblockchain.org"; // VSC Mainnet RPC
const PRIVATE_KEY = process.env.PRIVATE_KEY; // Private key of your bot wallet
const ORACLE_ADDRESS = "0xaf27A37f46cda90A1bCDbCe7db1Bf2BA2811Db32"; // Your deployed Oracle contract
const ROUTER_ADDRESS = "0xD85558c4dFB8D2fcb9Bd16292622F0600de717fA"; // Your DEX Router
const VSG_ADDRESS = "0x83048f0bf34feed8ced419455a4320a735a92e9d"; // WVSG token address
const USDC_ADDRESS = "0x5FD55E18e1c3AC221c0a8A17330a1C1a92bFF687"; // USDC token address

// === ABIs ===
const ORACLE_ABI = [
  "function updatePrice(uint256 _price) external",
];
const ROUTER_ABI = [
  "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)",
];

// === SETUP ===
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const oracleContract = new ethers.Contract(ORACLE_ADDRESS, ORACLE_ABI, wallet);
const routerContract = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, provider);

// === MAIN ===
async function updateOraclePrice() {
  try {
    const amountIn = ethers.utils.parseUnits("1", 18); // 1 VSG
    const path = [VSG_ADDRESS, USDC_ADDRESS];

    const amounts = await routerContract.getAmountsOut(amountIn, path);
    const usdcAmount = amounts[1]; // How much USDC 1 VSG =

    // Optionally multiply/divide to scale USDC decimals
    const scaledPrice = usdcAmount; // Already correct if USDC is 18 decimals

    const tx = await oracleContract.updatePrice(scaledPrice);
    console.log(`Submitted price update tx: ${tx.hash}`);
    await tx.wait();
    console.log(`✅ Updated Oracle price to: ${ethers.utils.formatUnits(scaledPrice, 18)} USDC`);
  } catch (error) {
    console.error("Failed to update Oracle:", error.message);
  }
}

// === LOOP ===
async function main() {
  console.log("Oracle Bot Started...");
  setInterval(updateOraclePrice, 5000); // Every 5 seconds
}

main();
