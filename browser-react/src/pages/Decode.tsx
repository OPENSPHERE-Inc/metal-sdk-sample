import assert from "assert";
import { MetalServiceV2, SymbolService } from "metal-on-symbol";
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

interface FormData {
    type: MetadataType;
    source_address: string;
    target_address: string;
    target_id?: string;
    key: string;
}

const Decode = () => {
    const [ payload, setPayload ] = useState<string>();
    const [ text, setText ] = useState<string>();
    const [ error, setError ] = useState<string>();
    const { handleSubmit, register, formState: { errors, isValid, isSubmitting } } = useForm<FormData>({
        mode: "onBlur",
        defaultValues: {
            type: MetadataType.Account,
            source_address: "TDHM4TOQECXRJIJRUWF4BHF25QVC5CMVJCZA5EQ",
            target_address: "TDHM4TOQECXRJIJRUWF4BHF25QVC5CMVJCZA5EQ",
            key: "3FF696F2C8812FB3",
        },
    });

    const decode = useCallback(async (data: FormData) => {
        try {
            setPayload(undefined);
            const metadataPool = await symbolService.searchBinMetadata(
                data.type,
                {
                    source: Address.createFromRawAddress(data.source_address),
                    target: Address.createFromRawAddress(data.target_address),
                    ...(data.target_id
                            ? {
                                targetId: data.type === MetadataType.Mosaic
                                    ? new MosaicId(data.target_id)
                                    : data.type === MetadataType.Namespace
                                        ? SymbolService.createNamespaceId(data.target_id)
                                        : undefined
                            }
                            : {}
                    ),
                });
            const { payload, text } = MetalServiceV2.decode(UInt64.fromHex(data.key), metadataPool);
            if(!payload.length) {
                setError("Couldn't decode.");
                return;
            }
            setPayload(Convert.uint8ToHex(payload));
            setText(text);
        } catch (e) {
            console.error(e);
            setError(String(e));
        }
    }, []);

    return (<div className="content">
        <h1 className="title is-3">Decode Metal payload sample</h1>

        <form onSubmit={handleSubmit(decode)}>
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
                    <label className="label">Decoded Payload</label>
                    <div className="control">
                        <textarea className="textarea" value={payload} readOnly={true} />
                    </div>
                </div>
            </div> : null }

            { text ? <div className="notification is-success is-light">
                <div className="field">
                    <label className="label">Decoded Text Section</label>
                    <div className="control">
                        <textarea className="textarea" value={text} readOnly={true} />
                    </div>
                </div>
            </div> : null }

            <div className="buttons is-centered">
                <Link to="/" className="button is-text">Back to Index</Link>
            </div>
        </form>
    </div>);
};

export default Decode;
