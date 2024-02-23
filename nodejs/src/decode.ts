import "./env";
import assert from "assert";
import { MetalServiceV2, SymbolService } from "metal-on-symbol";
import { Account, Address, Convert, MetadataType, MosaicId, NamespaceId, NetworkType, UInt64 } from "symbol-sdk";

// Edit here -------------
const nodeUrl = process.env.TEST_NODE_URL;
const privateKey = process.env.TEST_PRIVATE_KEY;    // The account will be signer/source/target
const key =  UInt64.fromHex("Your Metadata Key here");
// -----------------------

assert(nodeUrl);
const symbolService = new SymbolService({ node_url: nodeUrl });

assert(privateKey);
const signerAccount = Account.createFromPrivateKey(privateKey, NetworkType.TEST_NET);

const decode = async (
    type: MetadataType,
    sourceAddress: Address,
    targetAddress: Address,
    targetId: undefined | MosaicId | NamespaceId,
    key: UInt64
) => {
    const metadataPool = await symbolService.searchBinMetadata(
        type,
        {
            source: sourceAddress,
            target: targetAddress,
            targetId
        });
    return MetalServiceV2.decode(key, metadataPool);
};

decode(
    MetadataType.Account,
    signerAccount.address,
    signerAccount.address,
    undefined,
    key,
).then(({ payload, text }) => {
    console.log(`Decoded!`);
    console.log(Convert.uint8ToUtf8(payload));
    console.log(text);
}).catch((e) => {
    console.error(e);
    process.exit(1);
});
