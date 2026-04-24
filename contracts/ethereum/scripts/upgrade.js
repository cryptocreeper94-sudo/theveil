const hre = require("hardhat");
const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  Upgrading wDWC on", hre.network.name);
  console.log("═══════════════════════════════════════════════════════════════\n");

  const PROXY_ADDRESS = process.env.WDWC_ETHEREUM_ADDRESS;
  
  if (!PROXY_ADDRESS) {
    console.error("ERROR: WDWC_ETHEREUM_ADDRESS not set in environment");
    console.error("Set it to the proxy address from initial deployment");
    process.exit(1);
  }

  const [deployer] = await ethers.getSigners();
  console.log("Upgrader:", deployer.address);
  console.log("Proxy Address:", PROXY_ADDRESS);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH\n");

  const oldImplementation = await upgrades.erc1967.getImplementationAddress(PROXY_ADDRESS);
  console.log("Current Implementation:", oldImplementation);

  console.log("\nDeploying new implementation...\n");

  const WDWC = await ethers.getContractFactory("WDWC");
  
  const upgraded = await upgrades.upgradeProxy(PROXY_ADDRESS, WDWC, {
    kind: "uups"
  });

  await upgraded.waitForDeployment();

  const newImplementation = await upgrades.erc1967.getImplementationAddress(PROXY_ADDRESS);

  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  Upgrade Complete");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("");
  console.log("Proxy Address (unchanged):", PROXY_ADDRESS);
  console.log("Old Implementation:       ", oldImplementation);
  console.log("New Implementation:       ", newImplementation);
  console.log("New Version:              ", await upgraded.getVersion());
  console.log("");
  console.log("Update in Replit Secrets:");
  console.log(`  WDWC_IMPLEMENTATION_ADDRESS=${newImplementation}`);
  console.log("");
  console.log("All balances and state have been preserved!");
  console.log("═══════════════════════════════════════════════════════════════");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
