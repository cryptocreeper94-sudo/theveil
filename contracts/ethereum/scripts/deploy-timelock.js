const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  Deploying DSC Governance Timelock to", hre.network.name);
  console.log("═══════════════════════════════════════════════════════════════\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH\n");

  // For initial deployment, deployer is both proposer and executor
  // In production, replace with multi-sig addresses
  const proposers = [deployer.address];
  const executors = [deployer.address];
  const admin = deployer.address; // Can renounce later by setting to address(0)

  console.log("Deploying Timelock with 48-hour delay...\n");

  const DSCTimelock = await ethers.getContractFactory("DSCTimelock");
  const timelock = await DSCTimelock.deploy(proposers, executors, admin);
  await timelock.waitForDeployment();

  const address = await timelock.getAddress();
  const delayHours = await timelock.getDelayHours();

  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  Timelock Deployment Complete");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("");
  console.log("Timelock Address:", address);
  console.log("Minimum Delay:   ", delayHours.toString(), "hours");
  console.log("Proposers:       ", proposers.join(", "));
  console.log("Executors:       ", executors.join(", "));
  console.log("Admin:           ", admin);
  console.log("");
  console.log("Set this in Replit Secrets:");
  console.log(`  DSC_TIMELOCK_ADDRESS=${address}`);
  console.log("");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  NEXT STEPS");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("1. Deploy wDWC proxy (if not already deployed)");
  console.log("2. Transfer wDWC ownership to timelock:");
  console.log("   await wdwc.transferOwnership('" + address + "')");
  console.log("3. Replace proposers/executors with Gnosis Safe multi-sig");
  console.log("4. Optionally renounce admin role for full decentralization");
  console.log("═══════════════════════════════════════════════════════════════");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
