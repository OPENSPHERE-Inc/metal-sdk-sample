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

const scrapMetal = async (
    metalId: string,
    sourceAccount: PublicAccount,
    targetAccount: PublicAccount,
    signer: Account,
    cosigners: Account[]
) => {
    const metadataEntry = (await MetalService.getFirstChunk(metalId)).metadataEntry;
    const txs = await MetalService.createScrapTxs(
        metadataEntry.metadataType,
        sourceAccount,
        targetAccount,
        metadataEntry.targetId,
        metadataEntry.scopedMetadataKey,
    );
    if (!txs) {
        throw Error("Transaction creation error.");
    }
    const batches = await SymbolService.buildSignedAggregateCompleteTxBatches(
        txs,
        signer,
        cosigners,
    );
    const errors = await SymbolService.executeBatches(batches, signer);
    if (errors) {
        throw Error("Transaction error.");
    }
};

assert(privateKey);
const signer = Account.createFromPrivateKey(privateKey, NetworkType.TEST_NET);

assert(nodeUrl);
SymbolService.init({ node_url: nodeUrl });
scrapMetal(
    metalId,
    signer.publicAccount,
    signer.publicAccount,
    signer,
    []
).then(() => {
    console.log(`Scrapped!`);
}).catch((e) => {
    console.error(e);
    process.exit(1);
});