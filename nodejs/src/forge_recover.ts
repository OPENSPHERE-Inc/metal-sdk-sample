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

const forgeMetal = async (
    type: MetadataType,
    sourcePubAccount: PublicAccount,
    targetPubAccount: PublicAccount,
    targetId: undefined | MosaicId | NamespaceId,
    payload: Uint8Array,
    signerAccount: Account,
    cosignerAccounts: Account[],
    additive?: number,
    text?: string,
) => {
    const metadataPool = await symbolService.searchBinMetadata(
        type,
        {
            source: sourcePubAccount,
            target: targetPubAccount,
            targetId
        });
    const { key, txs, additive: newAdditive } = await metalService.createForgeTxs(
        type,
        sourcePubAccount,
        targetPubAccount,
        targetId,
        payload,
        additive,
        text,
        metadataPool,
    );
    const batches = await symbolService.buildSignedAggregateCompleteTxBatches(
        txs,
        signerAccount,
        cosignerAccounts,
    );
    const errors = await symbolService.executeBatches(batches, signerAccount);
    if (errors) {
        throw Error("Transaction error.");
    }
    const metalId = MetalServiceV2.calculateMetalId(
        type,
        sourcePubAccount.address,
        targetPubAccount.address,
        targetId,
        key,
    );

    return {
        metalId,
        key,
        additive: newAdditive,
    };
};

forgeMetal(
    MetadataType.Account,
    signerAccount.publicAccount,
    signerAccount.publicAccount,
    undefined,
    payload,
    signerAccount,
    [],
    undefined,
    text,
).then(({ metalId, key, additive }) => {
    console.log(`Forged! metalId=${metalId},key=${key.toHex()},additive=${additive}`);
}).catch((e) => {
    console.error(e);
    process.exit(1);
});
