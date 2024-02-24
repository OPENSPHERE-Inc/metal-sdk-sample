import assert from "assert";
import { saveAs } from "file-saver";
import { MetalSeal, MetalServiceV2, SymbolService } from "metal-on-symbol";
import mime from "mime";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { Address, Convert, MetadataType, MosaicId, NamespaceId, UInt64 } from "symbol-sdk";


assert(process.env.REACT_APP_NODE_URL);
const symbolService = new SymbolService({ node_url: process.env.REACT_APP_NODE_URL, repo_factory_config: {
        websocketInjected: WebSocket,
        websocketUrl: process.env.REACT_APP_NODE_URL.replace('http', 'ws') + '/ws',
    }
});
const metalService = new MetalServiceV2(symbolService);

interface FormData {
    metal_id: string;
}

interface Metal {
    payload: Uint8Array;
    text: string | undefined;
    type: MetadataType;
    sourceAddress: Address;
    targetAddress: Address
    targetId?: MosaicId | NamespaceId;
    key: UInt64;
}

const Fetch = () => {
    const [ metal, setMetal ] = useState<Metal>();
    const [ error, setError ] = useState<string>();
    const { handleSubmit, register, getValues, formState: { errors, isValid, isSubmitting } } = useForm<FormData>({
        mode: "onBlur",
        defaultValues: {
            metal_id: "FeEAJjHDoDgzpZaUyS7dru196aLHLBZKddDnj6SS57g8qR",
        },
    });

    const fetch = useCallback(async (data: FormData) => {
        try {
            setMetal(undefined);
            const result = await metalService.fetchByMetalId(data.metal_id);
            setMetal(result);
        } catch (e) {
            console.error(e);
            setError(String(e));
        }
    }, []);

    const save = useCallback(async () => {
        if (!metal) {
            return;
        }

        const metalId = getValues("metal_id");
        let contentType = "application/octet-stream";
        let fileName: string | undefined;
        if (metal.text) {
            try {
                const seal = MetalSeal.parse(metal.text);
                contentType = seal.mimeType ?? contentType;
                fileName = seal.name ?? `${metalId}.${mime.getExtension(contentType) || "bin"}`;
            } catch (e) {}
        }

        const blob = new Blob([ metal.payload.buffer ], { type: contentType });
        saveAs(blob, fileName);
    }, [metal, getValues]);

    return (<div className="content">
        <h1 className="title is-3">Fetch Metal by Metal ID sample</h1>

        <form onSubmit={handleSubmit(fetch)}>
            <div className="field">
                <label className="label">Metal ID (*)</label>
                <div className="control">
                    <input className={`input ${errors.metal_id ? "is-danger" : ""}`} type="text" {
                        ...register("metal_id", { required: "Required field." }) }
                    />
                </div>
            </div>
            { errors.metal_id && <div className="field">
                <p className="help is-danger">
                    { errors.metal_id.message }
                </p>
            </div> }

            <div className="buttons is-centered">
                <button className={`button is-primary ${isSubmitting ? "is-loading" : ""}`}
                        disabled={!isValid || isSubmitting}>
                    Execute
                </button>
            </div>

            { error ? <div className="notification is-danger is-light">
                { error }
            </div> : null }

            { metal ? <div className="notification is-success is-light">
                <div className="field">
                    <label className="label">Fetched Metal Payload</label>
                    <div className="control">
                        <textarea className="textarea" value={ Convert.uint8ToHex(metal.payload) } readOnly={ true }/>
                    </div>
                </div>
                <div className="field">
                    <div className="control">
                        <button type="button" className="button is-link" onClick={save}>
                            Save
                        </button>
                    </div>
                </div>
                <div className="field">
                    <label className="label">Fetched Metal Text Section</label>
                    <div className="control">
                        <textarea className="textarea" value={ metal.text } readOnly={ true }/>
                    </div>
                </div>
                <div className="field">
                    <label className="label">Metadata Type</label>
                    <div className="control">
                        <input type="text" className="input" value={ [ "Account", "Mosaic", "Namespace" ][metal.type] }
                               readOnly={ true }/>
                    </div>
                </div>
                <div className="field">
                    <label className="label">Source Address</label>
                    <div className="control">
                        <input type="text" className="input" value={ metal.sourceAddress.plain() } readOnly={ true }/>
                    </div>
                </div>
                <div className="field">
                    <label className="label">Target Address</label>
                    <div className="control">
                        <input type="text" className="input" value={ metal.targetAddress.plain() } readOnly={ true }/>
                    </div>
                </div>
                <div className="field">
                    <label className="label">Target ID</label>
                    <div className="control">
                        <input type="text" className="input" value={ metal.targetId?.toHex() || "" } readOnly={ true }/>
                    </div>
                </div>
                <div className="field">
                    <label className="label">Metadata Key</label>
                    <div className="control">
                        <input type="text" className="input" value={ metal.key.toHex() } readOnly={ true }/>
                    </div>
                </div>
            </div> : null }

            <div className="buttons is-centered">
                <Link to="/" className="button is-text">Back to Index</Link>
            </div>
        </form>
    </div>);
};

export default Fetch;
