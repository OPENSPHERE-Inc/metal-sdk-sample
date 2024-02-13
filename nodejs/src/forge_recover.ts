import "./env";
import {Account, Convert, MetadataType, MosaicId, NamespaceId, NetworkType, PublicAccount} from "symbol-sdk";
import {MetalServiceV2, SymbolService} from "metal-on-symbol";
import assert from "assert";

// Edit here -------------
const nodeUrl = process.env.TEST_NODE_URL;
const privateKey = process.env.TEST_PRIVATE_KEY;    // The account will be signer/source/target
const payload = Convert.utf8ToUint8("Test Data Here");
// -----------------------

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
    []
).then(({ metalId, key, additive }) => {
    console.log(`Forged! metalId=${metalId},key=${key.toHex()},additive=${additive}`);
}).catch((e) => {
    console.error(e);
    process.exit(1);
});
