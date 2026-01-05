import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying MoonDistributor with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatUnits(balance, 18), "ETH");

  const MoonDistributor = await ethers.getContractFactory("MoonDistributor");
  const distributor = await MoonDistributor.deploy(deployer.address);

  await distributor.waitForDeployment();
  const address = await distributor.getAddress();

  console.log("MoonDistributor deployed to:", address);
  console.log("\nUpdate packages/chain-data/src/addresses.ts with:");
  console.log(`  DISTRIBUTOR_CONTRACTS: { arbitrumNova: '${address}' }`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
