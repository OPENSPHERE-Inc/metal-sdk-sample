import assert from "assert";
import {MetalService, SymbolService} from "metal-on-symbol";
import {useCallback, useState} from "react";
import {useForm} from "react-hook-form";
import {Link} from "react-router-dom";
import {Convert} from "symbol-sdk";


assert(process.env.REACT_APP_NODE_URL);
const symbolService = new SymbolService({ node_url: process.env.REACT_APP_NODE_URL, repo_factory_config: {
        websocketInjected: WebSocket,
        websocketUrl: process.env.REACT_APP_NODE_URL.replace('http', 'ws') + '/ws',
    }
});
const metalService = new MetalService(symbolService);

interface FormData {
    metal_id: string;
    payload: string;
}

const Verify = () => {
    const [ succeeded, setSucceeded ] = useState<boolean>();
    const [ error, setError ] = useState<string>();
    const { handleSubmit, register, formState: { errors, isValid, isSubmitting } } = useForm<FormData>({
        mode: "onBlur",
    });

    const verify = useCallback(async (data: FormData) => {
        try {
            setSucceeded(undefined);

            const {
                metadataType: type,
                sourceAddress,
                targetAddress,
                targetId,
                scopedMetadataKey: key,
            } = (await metalService.getFirstChunk(data.metal_id)).metadataEntry;
            const { mismatches, maxLength } = await metalService.verify(
                Convert.utf8ToUint8(data.payload),
                type,
                sourceAddress,
                targetAddress,
                key,
                targetId,
            );
            if (mismatches) {
                setError(`Mismatches ${ mismatches / maxLength * 100}%`);
                return;
            }

            setSucceeded(true);
        } catch (e) {
            console.error(e);
            setError(String(e));
        }
    }, []);

    return <div className="content">
        <h1 className="title is-3">Verify Metal sample</h1>

        <form onSubmit={handleSubmit(verify)}>
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

            <div className="field">
                <label className="label">Payload</label>
                <div className="control">
                    <textarea className={`textarea ${errors.payload ? "is-danger" : ""}`}
                              { ...register("payload", { required: "Required field." }) }
                    />
                </div>
            </div>
            { errors.payload && <div className="field">
                <p className="help is-danger">
                    { errors.payload.message }
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

            { succeeded ? <div className="notification is-success is-light">
                No mismatches found. Verify succeeded.
            </div> : null }

            <div className="buttons is-centered">
                <Link to="/" className="button is-text">Back to Index</Link>
            </div>
        </form>
    </div>;
};

export default Verify;