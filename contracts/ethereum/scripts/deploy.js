const hre = require("hardhat");
const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  Deploying wDWC (Upgradeable) to", hre.network.name);
  console.log("═══════════════════════════════════════════════════════════════\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH\n");

  console.log("Deploying UUPS Proxy + Implementation...\n");

  const WDWC = await ethers.getContractFactory("WDWC");
  
  const wdwc = await upgrades.deployProxy(WDWC, [deployer.address], {
    initializer: "initialize",
    kind: "uups"
  });

  await wdwc.waitForDeployment();

  const proxyAddress = await wdwc.getAddress();
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  const adminAddress = await upgrades.erc1967.getAdminAddress(proxyAddress).catch(() => "N/A (UUPS)");

  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  Deployment Complete - UUPS Upgradeable Proxy");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("");
  console.log("Proxy Address (use this):", proxyAddress);
  console.log("Implementation Address:  ", implementationAddress);
  console.log("Bridge Operator:         ", deployer.address);
  console.log("Contract Version:        ", await wdwc.getVersion());
  console.log("");
  console.log("Set this in Replit Secrets:");
  console.log(`  WDWC_ETHEREUM_ADDRESS=${proxyAddress}`);
  console.log(`  WDWC_IMPLEMENTATION_ADDRESS=${implementationAddress}`);
  console.log("");
  console.log("Verify on Etherscan:");
  console.log(`  Proxy: https://sepolia.etherscan.io/address/${proxyAddress}`);
  console.log(`  Impl:  https://sepolia.etherscan.io/address/${implementationAddress}`);
  console.log("");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  UPGRADE INSTRUCTIONS");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("To upgrade in the future:");
  console.log("1. Modify WDWC.sol with new features");
  console.log("2. Increment VERSION constant");
  console.log("3. Run: npm run upgrade:sepolia");
  console.log("");
  console.log("All balances and state will be preserved!");
  console.log("═══════════════════════════════════════════════════════════════");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
