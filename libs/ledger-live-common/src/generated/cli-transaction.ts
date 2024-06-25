import celo from "../families/celo/cli-transaction";
import cosmos from "../families/cosmos/cli-transaction";
import crypto_org from "../families/crypto_org/cli-transaction";
import elrond from "../families/elrond/cli-transaction";
import filecoin from "../families/filecoin/cli-transaction";
import hedera from "../families/hedera/cli-transaction";
import stacks from "../families/stacks/cli-transaction";
import vechain from "../families/vechain/cli-transaction";
import { cliTools as algorand } from "../families/algorand/setup";
import { cliTools as bitcoin } from "../families/bitcoin/setup";
import { cliTools as cardano } from "../families/cardano/setup";
import { cliTools as evm } from "../families/evm/setup";
import { cliTools as near } from "../families/near/setup";
import { cliTools as polkadot } from "../families/polkadot/setup";
import { cliTools as solana } from "../families/solana/setup";
import { cliTools as stellar } from "../families/stellar/setup";
import { cliTools as tezos } from "../families/tezos/setup";
import { cliTools as tron } from "../families/tron/setup";
import { cliTools as xrp } from "../families/xrp/setup";
import { cliTools as kadena } from "../families/kadena/setup";

export default {
  celo,
  cosmos,
  crypto_org,
  elrond,
  filecoin,
  hedera,
  stacks,
  vechain,
  algorand,
  bitcoin,
  cardano,
  evm,
  near,
  polkadot,
  solana,
  stellar,
  tezos,
  tron,
  xrp,
  kadena,
};
