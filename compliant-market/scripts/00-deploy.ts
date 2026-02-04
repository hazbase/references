import "dotenv/config";
import { ethers } from "ethers";
import {
  WhitelistHelper,
  FlexibleTokenHelper,
  MarketManagerHelper,
  ReservePoolHelper,
  EmergencyPauseManagerHelper,
  TimelockControllerHelper,
  GenericGovernorHelper,
  GovernanceTokenHelper,
} from "@hazbase/kit";
import { envOpt, getProvider, getWallet, saveJson } from "../../common.js";

type Addresses = Record<string, string>;

async function main(): Promise<void> {
  const provider = getProvider();
  const deployer = getWallet("PRIVATE_KEY_DEPLOYER", provider);
  const guardian = getWallet("PRIVATE_KEY_GUARDIAN", provider);

  const outPath = envOpt("ADDRESSES_PATH", "./artifacts/compliant-market.addresses.json");
  const forwarders: string[] = [];

  const addrs: Addresses = {};

  // 1) Whitelist
  const wl = await WhitelistHelper.deploy({ admin: deployer.address, trustedForwarders: forwarders } as any, deployer);
  addrs.whitelist = wl.address;

  // 2) Governance token (optional but useful for governor demos)
  const govTok = await GovernanceTokenHelper.deploy(
    {
      name: "hazBase Governance Token",
      symbol: "HBG",
      treasury: deployer.address,
      initialSupply: 0n,
      cap: ethers.parseUnits("1000000000", 18),
      transferable: true,
      admin: deployer.address,
      forwarders,
    } as any,
    deployer
  );
  addrs.govToken = govTok.address;

  // 3) Timelock
  const minDelay = BigInt(envOpt("TIMELOCK_DELAY_SEC", "300"));
  const timelock = await TimelockControllerHelper.deploy(
    {
      minDelay,
      proposers: [deployer.address],
      executors: [ethers.ZeroAddress],
      admin: deployer.address,
      trustedForwarders: forwarders,
    } as any,
    deployer
  );
  addrs.timelock = timelock.address;

  // 4) Governor
  const strategyAddr = envOpt("STRATEGY_ADDR", ethers.ZeroAddress);
  const governor = await GenericGovernorHelper.deploy(
    {
      admin: deployer.address,
      name: "hazBase Governor",
      token: addrs.govToken,
      timelock: addrs.timelock,
      strategyAddr,
      trustedForwarders: forwarders,
    } as any,
    deployer
  );
  addrs.governor = governor.address;

  // 5) EmergencyPauseManager
  const epm = await EmergencyPauseManagerHelper.deploy({ admin: deployer.address, forwarders } as any, deployer);
  addrs.pauseManager = epm.address;

  // 6) Payment token (USDC-like)
  const usdc = await FlexibleTokenHelper.deploy(
    {
      name: "USD Coin",
      symbol: "USDC",
      treasury: deployer.address,
      initialSupply: 0n,
      cap: ethers.parseUnits("1000000000", 6),
      decimals: 6,
      transferable: true,
      admin: deployer.address,
      forwarders,
    } as any,
    deployer
  );
  addrs.usdc = usdc.address;

  // 7) MarketManager (fee splitter + bps)
  const splitter = envOpt("FEE_SPLITTER", deployer.address);
  const feeBps = Number(envOpt("FEE_BPS", "10")); // 1% default (1000-base rule)
  const market = await MarketManagerHelper.deploy(
    { admin: deployer.address, splitter, bps: feeBps, trustedForwarders: forwarders } as any,
    deployer
  );
  addrs.marketManager = market.address;

  // 8) ReservePool
  const router = envOpt("ROUTER", ethers.ZeroAddress);
  const reserve = await ReservePoolHelper.deploy(
    { admin: deployer.address, router, protocolToken: addrs.govToken, forwarders } as any,
    deployer
  );
  addrs.reservePool = reserve.address;

  saveJson(outPath, addrs);

  console.log("Deployed addresses:");
  console.log(addrs);
  console.log("Deployer:", deployer.address);
  console.log("Guardian:", guardian.address);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
