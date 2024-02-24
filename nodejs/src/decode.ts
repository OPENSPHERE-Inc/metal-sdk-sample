import "./env";
import assert from "assert";
import fs from "fs";
import { MetalSeal, MetalServiceV2, SymbolService } from "metal-on-symbol";
import mime from "mime";
import { Account, Address, MetadataType, MosaicId, NamespaceId, NetworkType, UInt64 } from "symbol-sdk";

// Edit here -------------
const nodeUrl = process.env.TEST_NODE_URL;
const privateKey = process.env.TEST_PRIVATE_KEY;    // The account will be signer/source/target
const key = UInt64.fromHex(process.argv[2]);
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

    let fileName = `${key}.out`;
    if (text) {
        try {
            const seal = MetalSeal.parse(text);
            const contentType = seal.mimeType ?? "application/octet-stream";
            fileName = seal.name || `${key}.${mime.getExtension(contentType) ?? "out"}`;
        } catch (e) {}
    }
    fs.writeFileSync(fileName, payload);

    console.log(`Saved Payload File: ${fileName}`);
    console.log(`Text Section: ${text}`);
}).catch((e) => {
    console.error(e);
    process.exit(1);
});
