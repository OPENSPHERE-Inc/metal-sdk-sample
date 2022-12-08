import dotenv from "dotenv";
dotenv.config();

import assert from "assert";
import {MetalService, SymbolService} from "metal-on-symbol";
import {Account, Address, Convert, MetadataType, MosaicId, NamespaceId, NetworkType, UInt64} from "symbol-sdk";

// Edit here -------------
const nodeUrl = process.env.TEST_NODE_URL;
const privateKey = process.env.TEST_PRIVATE_KEY;    // The account will be signer/source/target
const key =  UInt64.fromHex("Your Metadata Key here");
// -----------------------

const fetchMetal = async (
    type: MetadataType,
    sourceAddress: Address,
    targetAddress: Address,
    targetId: undefined | MosaicId | NamespaceId,
    key: UInt64
) => {
    const payload = await MetalService.fetch(type, sourceAddress, targetAddress, targetId, key);
    const metalId = MetalService.calculateMetalId(type, sourceAddress, targetAddress, targetId, key);
    return { payload, metalId };
};

assert(privateKey);
const signerAccount = Account.createFromPrivateKey(privateKey, NetworkType.TEST_NET);

assert(nodeUrl);
SymbolService.init({ node_url: nodeUrl });
fetchMetal(
    MetadataType.Account,
    signerAccount.address,
    signerAccount.address,
    undefined,
    key,
).then(({ payload, metalId }) => {
    console.log(`Fetched! metalId=${metalId}`);
    console.log(Convert.uint8ToUtf8(payload));
}).catch((e) => {
    console.error(e);
    process.exit(1);
});
