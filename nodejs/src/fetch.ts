import dotenv from "dotenv";
dotenv.config();

import assert from "assert";
import {MetalService, SymbolService} from "metal-on-symbol";
import {Convert} from "symbol-sdk";

// Edit here -------------
const nodeUrl = process.env.TEST_NODE_URL;
const metalId = "Your Metal ID here";
// -----------------------

assert(nodeUrl);
const symbolService = new SymbolService({ node_url: nodeUrl });
const metalService = new MetalService(symbolService);

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
    console.log(Convert.uint8ToUtf8(result.payload));
}).catch((e) => {
    console.error(e);
    process.exit(1);
});
