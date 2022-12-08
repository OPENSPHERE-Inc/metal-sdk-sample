import dotenv from "dotenv";
dotenv.config();

import {MetalService, SymbolService} from "metal-on-symbol";
import {Account, Convert, MetadataType, MosaicId, NamespaceId, NetworkType, PublicAccount} from "symbol-sdk";
import assert from "assert";

// Edit here -------------
const nodeUrl = process.env.TEST_NODE_URL;
const privateKey = process.env.TEST_PRIVATE_KEY;    // The account will be signer/source/target
const payload = Convert.utf8ToUint8("Test Data Here");
// -----------------------

const destroyMetal = async (
    type: MetadataType,
    sourcePubAccount: PublicAccount,
    targetPubAccount: PublicAccount,
    targetId: undefined | MosaicId | NamespaceId,
    payload: Uint8Array,
    additive: Uint8Array,
    signerAccount: Account,
    cosignerAccounts: Account[]
) => {
    const txs = await MetalService.createDestroyTxs(
        type,
        sourcePubAccount,
        targetPubAccount,
        targetId,
        payload,
        additive,
    );
    if (!txs) {
        throw Error("Transaction creation error.");
    }
    const batches = await SymbolService.buildSignedAggregateCompleteTxBatches(
        txs,
        signerAccount,
        cosignerAccounts,
    );
    const errors = await SymbolService.executeBatches(batches, signerAccount);
    if (errors) {
        throw Error("Transaction error.");
    }
};

assert(privateKey);
const signerAccount = Account.createFromPrivateKey(privateKey, NetworkType.TEST_NET);

assert(nodeUrl);
SymbolService.init({ node_url: nodeUrl });
destroyMetal(
    MetadataType.Account,
    signerAccount.publicAccount,
    signerAccount.publicAccount,
    undefined,
    payload,
    Convert.utf8ToUint8("0000"),
    signerAccount,
    []
).then(() => {
    console.log(`Scrapped!`);
}).catch((e) => {
    console.error(e);
    process.exit(1);
});