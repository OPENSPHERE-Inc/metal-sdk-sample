import dotenv from "dotenv";
dotenv.config();

import {Account, NetworkType, PublicAccount} from "symbol-sdk";
import {MetalService, SymbolService} from "metal-on-symbol";
import assert from "assert";

// Edit here -------------
const nodeUrl = process.env.TEST_NODE_URL;
const privateKey = process.env.TEST_PRIVATE_KEY;  // The account will be signer/source/target
const metalId = "Your Metal ID here";
// -----------------------

assert(nodeUrl);
const symbolService = new SymbolService({ node_url: nodeUrl });
const metalService = new MetalService(symbolService);

assert(privateKey);
const signerAccount = Account.createFromPrivateKey(privateKey, NetworkType.TEST_NET);

const scrapMetal = async (
    metalId: string,
    sourcePubAccount: PublicAccount,
    targetPubAccount: PublicAccount,
    signerAccount: Account,
    cosignerAccounts: Account[]
) => {
    const metadataEntry = (await metalService.getFirstChunk(metalId)).metadataEntry;
    const txs = await metalService.createScrapTxs(
        metadataEntry.metadataType,
        sourcePubAccount,
        targetPubAccount,
        metadataEntry.targetId,
        metadataEntry.scopedMetadataKey,
    );
    if (!txs) {
        throw Error("Transaction creation error.");
    }
    const batches = await symbolService.buildSignedAggregateCompleteTxBatches(
        txs,
        signerAccount,
        cosignerAccounts,
    );
    const errors = await symbolService.executeBatches(batches, signerAccount);
    if (errors) {
        throw Error("Transaction error.");
    }
};

scrapMetal(
    metalId,
    signerAccount.publicAccount,
    signerAccount.publicAccount,
    signerAccount,
    []
).then(() => {
    console.log(`Scrapped!`);
}).catch((e) => {
    console.error(e);
    process.exit(1);
});