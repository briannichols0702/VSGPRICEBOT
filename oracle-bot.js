const { ethers } = require("ethers");
const dotenv = require("dotenv");
dotenv.config();

// === CONFIG ===
const RPC_URL = "https://rpc.vscblockchain.org"; // VSC Mainnet RPC
const PRIVATE_KEY = process.env.PRIVATE_KEY; // Your Oracle bot wallet
const ORACLE_ADDRESS = "0xaf27A37f46cda90A1bCDbCe7db1Bf2BA2811Db32"; // Your deployed Oracle contract
const ROUTER_ADDRESS = "0xD85558c4dFB8D2fcb9Bd16292622F0600de717fA"; // VSC Router
const VSG_ADDRESS = "0x83048f0bf34feed8ced419455a4320a735a92e9d"; // WVSG token address
const USDC_ADDRESS = "0x5FD55A1B9FC24967C4dB09C513C3BA0DFa7FF687"; // Corrected USDC address with checksum

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

// === MAIN LOGIC ===
async function updateOraclePrice() {
  try {
    const amountIn = ethers.utils.parseUnits("1", 18); // 1 VSG
    const path = [VSG_ADDRESS, USDC_ADDRESS];

    const amounts = await routerContract.getAmountsOut(amountIn, path);
    const usdcAmount = amounts[1]; // How much USDC for 1 VSG

    const scaledPrice = usdcAmount; // USDC uses 18 decimals on VSC too

    const tx = await oracleContract.updatePrice(scaledPrice, {
      gasLimit: 7000000,
      gasPrice: ethers.utils.parseUnits('1300000', 'gwei'),
    });

    console.log(`[${new Date().toISOString()}] Submitted tx: ${tx.hash}`);
    await tx.wait();
    console.log(`[${new Date().toISOString()}] ✅ Oracle price updated: ${ethers.utils.formatUnits(scaledPrice, 18)} USDC`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Failed to update Oracle:`, error.message);
  }
}

// === BALANCE CHECKER (OPTIONAL) ===
async function checkBalance() {
  const balance = await wallet.getBalance();
  const balanceInVSC = ethers.utils.formatEther(balance);
  if (parseFloat(balanceInVSC) < 0.01) {
    console.warn(`[${new Date().toISOString()}] ⚠️ Low wallet balance: ${balanceInVSC} VSC!`);
  }
}

// === LOOP ===
async function main() {
  console.log(`[${new Date().toISOString()}] Oracle Bot Started...`);
  setInterval(async () => {
    await checkBalance();
    await updateOraclePrice();
  }, 30 * 1000); // Every 30 seconds
}

main();
