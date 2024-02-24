import assert from "assert";
import { MetalServiceV2, SymbolService } from "metal-on-symbol";
import React, { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";


assert(process.env.REACT_APP_NODE_URL);
const symbolService = new SymbolService({ node_url: process.env.REACT_APP_NODE_URL, repo_factory_config: {
        websocketInjected: WebSocket,
        websocketUrl: process.env.REACT_APP_NODE_URL.replace('http', 'ws') + '/ws',
    }
});
const metalService = new MetalServiceV2(symbolService);

interface FormData {
    metal_id: string;
    payload?: File;
}

const readFile = async (file: File) => await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
        if (event.target?.result) {
            resolve(event.target.result as ArrayBuffer);
        } else {
            reject(new TypeError("Result isn't an ArrayBuffer"));
        }
    };
    reader.onerror = (error) => {
        reject(error);
    };
    reader.readAsArrayBuffer(file);
});

const Verify = () => {
    const [ succeeded, setSucceeded ] = useState<boolean>();
    const [ error, setError ] = useState<string>();
    const {
        handleSubmit,
        register,
        setValue,
        watch,
        trigger,
        formState: { errors, isValid, isSubmitting }
    } = useForm<FormData>({
        mode: "onBlur",
    });
    const watchPayload = watch("payload");

    const verify = useCallback(async (data: FormData) => {
        if (!data.payload) {
            setError("Payload required.");
            return;
        }
        const payload = data.payload;

        try {
            setSucceeded(undefined);

            const payloadBuffer = await readFile(payload);

            const {
                metadataType: type,
                sourceAddress,
                targetAddress,
                targetId,
                scopedMetadataKey: key,
            } = (await metalService.getFirstChunk(data.metal_id)).metadataEntry;
            const { mismatches, maxLength } = await metalService.verify(
                new Uint8Array(payloadBuffer),
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

    const handlePayloadChange: React.ChangeEventHandler<HTMLInputElement> = useCallback(async (event) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }
        setValue("payload", file);
        await trigger();
    }, [ setValue, trigger ]);

    useEffect(() => {
        if (watchPayload) {
            setError(undefined);
        } else {
            setError("Payload required.");
        }
    }, [watchPayload]);

    return (<div className="content">
        <h1 className="title is-3">Verify Metal sample</h1>

        <form onSubmit={ handleSubmit(verify) }>
            <div className="field">
                <label className="label">Metal ID (*)</label>
                <div className="control">
                    <input className={ `input ${ errors.metal_id ? "is-danger" : "" }` } type="text" {
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
                <label className="label">Payload (*)</label>
                <div className="control">
                    <div className="file has-name is-fullwidth">
                        <label className="file-label">
                            <input className="file-input" type="file" onChange={ handlePayloadChange }/>
                            <span className="file-cta">
                                <span className="file-icon">
                                    <i className="fas fa-upload"></i>
                                </span>
                                <span className="file-label">
                                    Choose a file…
                                </span>
                            </span>
                            <span className="file-name">
                                { watchPayload?.name ?? "Empty" }
                            </span>
                        </label>
                    </div>
                </div>
            </div>

            <div className="buttons is-centered">
                <button className={ `button is-primary ${ isSubmitting ? "is-loading" : "" }` }
                        disabled={ !isValid || isSubmitting || !watchPayload }>
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
    </div>);
};

export default Verify;
