import dotenv from "dotenv";
dotenv.config();

import {Account, Convert, MetadataType, MosaicId, NamespaceId, NetworkType, PublicAccount} from "symbol-sdk";
import {MetalService, SymbolService} from "metal-on-symbol";
import assert from "assert";

// Edit here -------------
const nodeUrl = process.env.TEST_NODE_URL;
const privateKey = process.env.TEST_PRIVATE_KEY;    // The account will be signer/source/target
const payload = Convert.utf8ToUint8("Test Data Here");
// -----------------------

const forgeMetal = async (
    type: MetadataType,
    sourceAccount: PublicAccount,
    targetAccount: PublicAccount,
    targetId: undefined | MosaicId | NamespaceId,
    payload: Uint8Array,
    signer: Account,
    cosigners: Account[],
    additive?: Uint8Array,
) => {
    const metadataPool = await SymbolService.searchMetadata(
        type,
        {
            source: sourceAccount,
            target: targetAccount,
            targetId
        });
    const { key, txs, additive: newAdditive } = await MetalService.createForgeTxs(
        type,
        sourceAccount,
        targetAccount,
        targetId,
        payload,
        additive,
        metadataPool,
    );
    const batches = await SymbolService.buildSignedAggregateCompleteTxBatches(
        txs,
        signer,
        cosigners,
    );
    const errors = await SymbolService.executeBatches(batches, signer);
    if (errors) {
        throw Error("Transaction error.");
    }
    const metalId = MetalService.calculateMetalId(
        type,
        sourceAccount.address,
        targetAccount.address,
        targetId,
        key,
    );

    return {
        metalId,
        key,
        additive: newAdditive,
    };
};

assert(privateKey);
const signer = Account.createFromPrivateKey(privateKey, NetworkType.TEST_NET);

assert(nodeUrl);
SymbolService.init({ node_url: nodeUrl });
forgeMetal(
    MetadataType.Account,
    signer.publicAccount,
    signer.publicAccount,
    undefined,
    payload,
    signer,
    []
).then(({ metalId, key, additive }) => {
    console.log(`Forged! metalId=${metalId},key=${key.toHex()},additive=${Convert.uint8ToUtf8(additive)}`);
}).catch((e) => {
    console.error(e);
    process.exit(1);
});
