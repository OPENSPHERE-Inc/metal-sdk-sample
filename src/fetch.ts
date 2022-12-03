import dotenv from "dotenv";
dotenv.config();

import assert from "assert";
import {MetalService, SymbolService} from "metal-on-symbol";
import {Convert} from "symbol-sdk";

// Edit here -------------
const nodeUrl = process.env.TEST_NODE_URL;
const metalId = "Your Metal ID here";
// -----------------------

const fetchMetal = async (metalId: string) => {
    return MetalService.fetchByMetalId(metalId);
};

assert(nodeUrl);
SymbolService.init({ node_url: nodeUrl });
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
