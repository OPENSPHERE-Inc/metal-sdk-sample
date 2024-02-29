import "./env"
import assert from "assert";
import fs from "fs";
import { MetalSeal, MetalServiceV2, SymbolService } from "metal-on-symbol";
import mime from "mime";

// Edit here -------------
const nodeUrl = process.env.TEST_NODE_URL;
const metalId = process.argv[2];
// -----------------------

assert(nodeUrl);
const symbolService = new SymbolService({ node_url: nodeUrl });
const metalService = new MetalServiceV2(symbolService);

const fetchMetal = async (metalId: string) => {
    return metalService.fetchByMetalId(metalId);
};

fetchMetal(
    metalId,
).then((result) => {
    console.log(
        `Fetched! type=${result.type},sourceAddr=${result.sourceAddress.plain()},` +
        `targetAddr=${result.targetAddress.plain()},targetId=${result.targetId?.toHex()},key=${result.key.toHex()}`
    );

    let fileName = `${metalId}.out`;
    if (result.text) {
        try {
            const seal = MetalSeal.parse(result.text);
            const contentType = seal.mimeType ?? "application/octet-stream";
            fileName = seal.name || `${metalId}.${mime.getExtension(contentType) ?? "out"}`;

            console.debug(`Decoded Metal Seal: schema=${seal.schema},length=${seal.length},mimeType=${seal.mimeType},` +
                `name=${seal.name},comment=${seal.comment}`);
        } catch (e) {}
    }
    fs.writeFileSync(fileName, result.payload);

    console.log(`Saved Payload File: ${fileName}`);
    console.log(`Text Section: ${result.text}`);
}).catch((e) => {
    console.error(e);
    process.exit(1);
});
