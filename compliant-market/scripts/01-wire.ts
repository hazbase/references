import "dotenv/config";
import { ethers } from "ethers";
import {
  WhitelistHelper,
  FlexibleTokenHelper,
  MarketManagerHelper,
  ReservePoolHelper,
  EmergencyPauseManagerHelper,
} from "@hazbase/kit";
import { envOpt, getProvider, getWallet, loadJson, saveJson } from "../../common.js";

type Addresses = Record<string, string>;
type RolesSnapshot = Record<string, unknown>;

async function main(): Promise<void> {
  const provider = getProvider();
  const deployer = getWallet("PRIVATE_KEY_DEPLOYER", provider);
  const guardian = getWallet("PRIVATE_KEY_GUARDIAN", provider);

  const inPath = envOpt("ADDRESSES_PATH", "./artifacts/compliant-market.addresses.json");
  const outRolesPath = envOpt("ROLES_PATH", "./artifacts/compliant-market.roles.json");

  const addrs = loadJson<Addresses>(inPath, {});
  if (!addrs.whitelist) throw new Error("Missing addresses. Run deploy first.");

  const whitelist = WhitelistHelper.attach(addrs.whitelist, deployer);
  const usdc = FlexibleTokenHelper.attach(addrs.usdc, deployer);
  const market = MarketManagerHelper.attach(addrs.marketManager, deployer);
  const reserve = ReservePoolHelper.attach(addrs.reservePool, deployer);
  const pauseManager = EmergencyPauseManagerHelper.attach(addrs.pauseManager, deployer);

  // 1) Compliance wiring
  await market.setWhitelist(whitelist.address);

  // Optional: gate token transfers too
  if ((usdc as any).configureWhitelist) {
    await (usdc as any).configureWhitelist(whitelist.address, true);
  }

  // 2) Payment token allowlist
  await market.setPaymentToken(usdc.address, true);

  // 3) Register pause targets
  await pauseManager.registerPausable(market.address);
  await pauseManager.registerPausable(reserve.address);
  await pauseManager.registerPausable(whitelist.address);
  await pauseManager.registerPausable(usdc.address);

  // 4) Grant guardian the emergency pause authority
  // NOTE: Update role string if your contracts use a different constant.
  const GUARDIAN_ROLE = ethers.id("GUARDIAN_ROLE");
  await pauseManager.contract.grantRole(GUARDIAN_ROLE, guardian.address);

  const snapshot: RolesSnapshot = {
    targets: {
      marketManager: market.address,
      reservePool: reserve.address,
      whitelist: whitelist.address,
      usdc: usdc.address,
    },
    guardian: guardian.address,
  };

  saveJson(outRolesPath, snapshot);

  console.log("Wiring complete.");
  console.log(snapshot);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
