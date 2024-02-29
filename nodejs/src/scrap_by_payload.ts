import "./env";
import assert from "assert";
import fs from "fs";
import { MetalSeal, MetalServiceV2, SymbolService } from "metal-on-symbol";
import mime from "mime";
import { Account, MetadataType, MosaicId, NamespaceId, NetworkType, PublicAccount } from "symbol-sdk";

// Edit here -------------
const nodeUrl = process.env.TEST_NODE_URL;
const privateKey = process.env.TEST_PRIVATE_KEY;    // The account will be signer/source/target
const payloadFilePath = process.argv[2];
let text = process.argv[3];
// -----------------------

assert(payloadFilePath);
const payload = fs.readFileSync(payloadFilePath);
text = text ?? new MetalSeal(payload.length, mime.getType(payloadFilePath) ?? undefined).stringify();

assert(nodeUrl);
const symbolService = new SymbolService({ node_url: nodeUrl });
const metalService = new MetalServiceV2(symbolService);

assert(privateKey);
const signerAccount = Account.createFromPrivateKey(privateKey, NetworkType.TEST_NET);

const destroyMetal = async (
    type: MetadataType,
    sourcePubAccount: PublicAccount,
    targetPubAccount: PublicAccount,
    targetId: undefined | MosaicId | NamespaceId,
    payload: Uint8Array,
    additive: number,
    text: string,
    signerAccount: Account,
    cosignerAccounts: Account[]
) => {
    const txs = await metalService.createDestroyTxs(
        type,
        sourcePubAccount,
        targetPubAccount,
        targetId,
        payload,
        additive,
        text,
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

destroyMetal(
    MetadataType.Account,
    signerAccount.publicAccount,
    signerAccount.publicAccount,
    undefined,
    payload,
    0,
    text,
    signerAccount,
    []
).then(() => {
    console.log(`Scrapped!`);
}).catch((e) => {
    console.error(e);
    process.exit(1);
});
