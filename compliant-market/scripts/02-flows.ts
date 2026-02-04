import "dotenv/config";
import {
  MarketManagerHelper,
  ReservePoolHelper,
  EmergencyPauseManagerHelper,
} from "@hazbase/kit";
import { envOpt, getProvider, getWallet, loadJson } from "../../common.js";

type Addresses = Record<string, string>;

async function main(): Promise<void> {
  const provider = getProvider();
  const deployer = getWallet("PRIVATE_KEY_DEPLOYER", provider);
  const guardian = getWallet("PRIVATE_KEY_GUARDIAN", provider);

  const inPath = envOpt("ADDRESSES_PATH", "./artifacts/compliant-market.addresses.json");
  const addrs = loadJson<Addresses>(inPath, {});
  if (!addrs.marketManager) throw new Error("Missing addresses. Run deploy first.");

  const market = MarketManagerHelper.attach(addrs.marketManager, deployer);
  const reserve = ReservePoolHelper.attach(addrs.reservePool, deployer);
  const pauseManager = EmergencyPauseManagerHelper.attach(addrs.pauseManager, deployer);

  console.log("Pausing all targets (guardian)...");
  await pauseManager.connect(guardian).pauseAll();

  const paused = await pauseManager.checkAllPaused();
  console.log("All paused:", paused);

  console.log("Unpause requires GOVERNOR_ROLE (typically timelock).");
  console.log("Governance flow: Proposal -> Vote -> Queue (Timelock) -> Execute");
  console.log("Typical actions: unpauseAll(), setFee(), setPaymentToken(), reserve parameter updates.");

  console.log("Market:", market.address);
  console.log("Reserve:", reserve.address);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
