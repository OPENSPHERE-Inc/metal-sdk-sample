import "./env"
import assert from "assert";
import {MetalServiceV2, SymbolService} from "metal-on-symbol";
import {Account, Address, Convert, MetadataType, MosaicId, NamespaceId, NetworkType, UInt64} from "symbol-sdk";

// Edit here -------------
const nodeUrl = process.env.TEST_NODE_URL;
const privateKey = process.env.TEST_PRIVATE_KEY;    // The account will be signer/source/target
const key =  UInt64.fromHex("Your Metadata Key here");
// -----------------------

assert(nodeUrl);
const symbolService = new SymbolService({ node_url: nodeUrl });
const metalService = new MetalServiceV2(symbolService);

assert(privateKey);
const signerAccount = Account.createFromPrivateKey(privateKey, NetworkType.TEST_NET);

const fetchMetal = async (
    type: MetadataType,
    sourceAddress: Address,
    targetAddress: Address,
    targetId: undefined | MosaicId | NamespaceId,
    key: UInt64
) => {
    const payload = await metalService.fetch(type, sourceAddress, targetAddress, targetId, key);
    const metalId = MetalServiceV2.calculateMetalId(type, sourceAddress, targetAddress, targetId, key);
    return { payload, metalId };
};

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
