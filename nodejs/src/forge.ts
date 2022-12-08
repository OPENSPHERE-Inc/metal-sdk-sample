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

const forgeMetal = async (
    type: MetadataType,
    sourcePubAccount: PublicAccount,
    targetPubAccount: PublicAccount,
    targetId: undefined | MosaicId | NamespaceId,
    payload: Uint8Array,
    signerAccount: Account,
    cosignerAccounts: Account[],
    additive?: Uint8Array,
) => {
    const { key, txs, additive: newAdditive } = await MetalService.createForgeTxs(
        type,
        sourcePubAccount,
        targetPubAccount,
        targetId,
        payload,
        additive,
    );
    const batches = await SymbolService.buildSignedAggregateCompleteTxBatches(
        txs,
        signerAccount,
        cosignerAccounts,
    );
    const errors = await SymbolService.executeBatches(batches, signerAccount);
    if (errors) {
        throw Error("Transaction error.");
    }
    const metalId = MetalService.calculateMetalId(
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

assert(privateKey);
const signerAccount = Account.createFromPrivateKey(privateKey, NetworkType.TEST_NET);

assert(nodeUrl);
SymbolService.init({ node_url: nodeUrl });
forgeMetal(
    MetadataType.Account,
    signerAccount.publicAccount,
    signerAccount.publicAccount,
    undefined,
    payload,
    signerAccount,
    []
).then(({ metalId, key, additive }) => {
    console.log(`Forged! metalId=${metalId},key=${key.toHex()},additive=${Convert.uint8ToUtf8(additive)}`);
}).catch((e) => {
    console.error(e);
    process.exit(1);
});
