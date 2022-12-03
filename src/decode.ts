import dotenv from "dotenv";
dotenv.config();

import assert from "assert";
import {MetalService, SymbolService} from "metal-on-symbol";
import {
    Account,
    Address,
    Convert,
    MetadataType,
    MosaicId,
    NamespaceId,
    NetworkType,
    UInt64
} from "symbol-sdk";

// Edit here -------------
const nodeUrl = process.env.TEST_NODE_URL;
const privateKey = process.env.TEST_PRIVATE_KEY;
const key =  UInt64.fromHex("Your Metadata Key here");
// -----------------------

const decode = async (
    type: MetadataType,
    sourceAddress: Address,
    targetAddress: Address,
    targetId: undefined | MosaicId | NamespaceId,
    key: UInt64
) => {
    const metadataPool = await SymbolService.searchMetadata(
        type,
        {
            source: sourceAddress,
            target: targetAddress,
            targetId
        });
    const payloadBase64 = MetalService.decode(key, metadataPool);
    return Buffer.from(payloadBase64, "base64");
};

assert(privateKey);
const signer = Account.createFromPrivateKey(privateKey, NetworkType.TEST_NET);

assert(nodeUrl);
SymbolService.init({ node_url: nodeUrl });
decode(
    MetadataType.Account,
    signer.address,
    signer.address,
    undefined,
    key,
).then((payload) => {
    console.log(`Decoded!`);
    console.log(Convert.uint8ToUtf8(payload));
}).catch((e) => {
    console.error(e);
    process.exit(1);
});
