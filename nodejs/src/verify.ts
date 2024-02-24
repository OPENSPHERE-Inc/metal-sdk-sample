import "./env";
import assert from "assert";
import fs from "fs";
import { MetalServiceV2, SymbolService } from "metal-on-symbol";

// Edit here -------------
const nodeUrl = process.env.TEST_NODE_URL;
const metalId = process.argv[2];
const payloadFilePath = process.argv[3];
// -----------------------

assert(payloadFilePath);
const payload = fs.readFileSync(payloadFilePath);

assert(nodeUrl);
const symbolService = new SymbolService({ node_url: nodeUrl });
const metalService = new MetalServiceV2(symbolService);

const verifyMetal = async (
    metalId: string,
    payload: Uint8Array,
) => {
    const {
        metadataType: type,
        sourceAddress,
        targetAddress,
        targetId,
        scopedMetadataKey: key,
    } = (await metalService.getFirstChunk(metalId)).metadataEntry;
    const { mismatches } = await metalService.verify(
        payload,
        type,
        sourceAddress,
        targetAddress,
        key,
        targetId,
    );
    return mismatches === 0;
};

verifyMetal(
    metalId,
    payload,
).then((result) => {
    console.log(`Verified! result=${result}`);
}).catch((e) => {
    console.error(e);
    process.exit(1);
});
