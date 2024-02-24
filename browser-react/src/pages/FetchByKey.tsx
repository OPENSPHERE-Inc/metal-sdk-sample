import assert from "assert";
import { saveAs } from "file-saver";
import { MetalSeal, MetalServiceV2, SymbolService } from "metal-on-symbol";
import mime from "mime";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { Address, Convert, MetadataType, MosaicId, UInt64 } from "symbol-sdk";


assert(process.env.REACT_APP_NODE_URL);
const symbolService = new SymbolService({ node_url: process.env.REACT_APP_NODE_URL, repo_factory_config: {
        websocketInjected: WebSocket,
        websocketUrl: process.env.REACT_APP_NODE_URL.replace('http', 'ws') + '/ws',
    }
});
const metalService = new MetalServiceV2(symbolService);

interface FormData {
    key: string;
    type: MetadataType;
    source_address: string;
    target_address: string;
    target_id?: string;
}

const FetchByKey = () => {
    const [ payload, setPayload ] = useState<Uint8Array>();
    const [ text, setText ] = useState<string>();
    const [ metalId, setMetalId ] = useState<string>();
    const [ error, setError ] = useState<string>();
    const { handleSubmit, register, getValues, formState: { errors, isValid, isSubmitting } } = useForm<FormData>({
        mode: "onBlur",
        defaultValues: {
            type: MetadataType.Account,
            source_address: "TDHM4TOQECXRJIJRUWF4BHF25QVC5CMVJCZA5EQ",
            target_address: "TDHM4TOQECXRJIJRUWF4BHF25QVC5CMVJCZA5EQ",
            key: "3FF696F2C8812FB3",
        },
    });

    const fetchByKey = useCallback(async (data: FormData) => {
        try {
            setPayload(undefined);
            setMetalId(undefined);
            setError(undefined);

            const targetId = data.target_id
                ? [ undefined, new MosaicId(data.target_id), SymbolService.createNamespaceId(data.target_id)][data.type]
                : undefined;
            const { payload, text } = await metalService.fetch(
                data.type,
                Address.createFromRawAddress(data.source_address),
                Address.createFromRawAddress(data.target_address),
                targetId,
                UInt64.fromHex(data.key),
            );
            if(!payload.length) {
                setError("Couldn't fetch.");
                return;
            }
            const metalId = MetalServiceV2.calculateMetalId(
                data.type,
                Address.createFromRawAddress(data.source_address),
                Address.createFromRawAddress(data.target_address),
                targetId,
                UInt64.fromHex(data.key),
            );

            setPayload(payload);
            setText(text);
            setMetalId(metalId);
        } catch (e) {
            console.error(e);
            setError(String(e));
        }
    }, []);

    const save = useCallback(async () => {
        if (!payload) {
            return;
        }

        const metalId = getValues("key");
        let contentType = "application/octet-stream";
        let fileName: string | undefined;
        if (text) {
            try {
                const seal = MetalSeal.parse(text);
                contentType = seal.mimeType ?? contentType;
                fileName = seal.name ?? `${metalId}.${mime.getExtension(contentType) || "bin"}`;
            } catch (e) {}
        }

        const blob = new Blob([ payload.buffer ], { type: contentType });
        saveAs(blob, fileName);
    }, [payload, text, getValues]);

    return (<div className="content">
        <h1 className="title is-3">Fetch Metal by Metadata Key sample</h1>

        <form onSubmit={handleSubmit(fetchByKey)}>
            <div className="field">
                <label className="label">Metadata Type (*)</label>
                <div className="control">
                    <div className="select">
                        <select { ...register('type', { required: "Required field." })}>
                            <option value={MetadataType.Account}>Account</option>
                            <option value={MetadataType.Mosaic}>Mosaic</option>
                            <option value={MetadataType.Namespace}>Namespace</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="field">
                <label className="label">Source Address (*)</label>
                <div className="control">
                    <input className={`input ${errors.source_address ? "is-danger" : ""}`} type="text" {
                        ...register("source_address", { required: "Required field." }) }
                    />
                </div>
            </div>
            { errors.source_address && <div className="field">
                <p className="help is-danger">
                    { errors.source_address.message }
                </p>
            </div> }

            <div className="field">
                <label className="label">Target Address (*)</label>
                <div className="control">
                    <input className={`input ${errors.target_address ? "is-danger" : ""}`} type="text" {
                        ...register("target_address", { required: "Required field." }) }
                    />
                </div>
            </div>
            { errors.target_address && <div className="field">
                <p className="help is-danger">
                    { errors.target_address.message }
                </p>
            </div> }

            <div className="field">
                <label className="label">Target ID (Mosaic ID / Namespace ID, Leave blank when Account metadata)</label>
                <div className="control">
                    <input className={`input ${errors.target_id ? "is-danger" : ""}`} type="text" {
                        ...register("target_id") }
                    />
                </div>
            </div>
            { errors.target_id && <div className="field">
                <p className="help is-danger">
                    { errors.target_id.message }
                </p>
            </div> }

            <div className="field">
                <label className="label">Metadata Key (*)</label>
                <div className="control">
                    <input className={`input ${errors.key ? "is-danger" : ""}`} type="text" {
                        ...register("key", { required: "Required field." }) }
                    />
                </div>
            </div>
            { errors.key && <div className="field">
                <p className="help is-danger">
                    { errors.key.message }
                </p>
            </div> }

            <div className="buttons is-centered">
                <button className={`button is-primary ${isSubmitting ? "is-loading" : ""}`}
                        disabled={!isValid || isSubmitting}
                >
                    Execute
                </button>
            </div>

            { error ? <div className="notification is-danger is-light">
                { error }
            </div> : null }

            { payload ? <div className="notification is-success is-light">
                <div className="field">
                    <label className="label">Fetched Metal Payload</label>
                    <div className="control">
                        <textarea className="textarea" value={ Convert.uint8ToHex(payload) } readOnly={ true }/>
                    </div>
                </div>
                <div className="field">
                    <div className="control">
                        <button type="button" className="button is-link" onClick={ save }>
                            Save
                        </button>
                    </div>
                </div>
                <div className="field">
                    <label className="label">Fetched Metal Text Section</label>
                    <div className="control">
                        <textarea className="textarea" value={ text } readOnly={ true }/>
                    </div>
                </div>
                <div className="field">
                    <label className="label">Forged Metal ID</label>
                    <div className="control">
                        <input type="text" className="input" value={ metalId } readOnly={ true }/>
                    </div>
                </div>
            </div> : null }

            <div className="buttons is-centered">
                <Link to="/" className="button is-text">Back to Index</Link>
            </div>
        </form>
    </div>);
};

export default FetchByKey;
