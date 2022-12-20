import dotenv from "dotenv";
dotenv.config();

import assert from "assert";
import {MetalService, SymbolService} from "metal-on-symbol";
import {Convert} from "symbol-sdk";

// Edit here -------------
const nodeUrl = process.env.TEST_NODE_URL;
const metalId = "Your Metal ID here";
const payload = Convert.utf8ToUint8("Test Data Here");
// -----------------------

assert(nodeUrl);
const symbolService = new SymbolService({ node_url: nodeUrl });
const metalService = new MetalService(symbolService);

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
