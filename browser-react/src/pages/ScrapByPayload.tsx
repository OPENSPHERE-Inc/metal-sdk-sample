import assert from "assert";
import { MetalServiceV2, SymbolService } from "metal-on-symbol";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { Account, Convert, MetadataType, MosaicId } from "symbol-sdk";


assert(process.env.REACT_APP_NODE_URL);
const symbolService = new SymbolService({ node_url: process.env.REACT_APP_NODE_URL, repo_factory_config: {
        websocketInjected: WebSocket,
        websocketUrl: process.env.REACT_APP_NODE_URL.replace('http', 'ws') + '/ws',
    }
});
const metalService = new MetalServiceV2(symbolService);

interface FormData {
    private_key: string;
    type: MetadataType;
    target_id?: string;
    payload: string;
    additive: number;
    text?: string;
}

const ScrapByPayload = () => {
    const [ error, setError ] = useState<string>();
    const [ succeeded, setSucceeded ] = useState<boolean>();
    const { handleSubmit, register, formState: { errors, isValid, isSubmitting } } = useForm<FormData>({
        mode: "onBlur",
        defaultValues: {
            type: MetadataType.Account,
            additive: 0,
        },
    });

    const scrapByPayload = useCallback(async (data: FormData) => {
        try {
            setError(undefined);
            setSucceeded(undefined);
            const { networkType } = await symbolService.getNetwork();
            const signerAccount = Account.createFromPrivateKey(data.private_key, networkType);
            const targetId = data.target_id
                ? [ undefined, new MosaicId(data.target_id), SymbolService.createNamespaceId(data.target_id)][data.type]
                : undefined;

            const txs = await metalService.createDestroyTxs(
                data.type,
                signerAccount.publicAccount,
                signerAccount.publicAccount,
                targetId,
                Convert.utf8ToUint8(data.payload),
                data.additive,
                data.text,
            );
            if (!txs) {
                setError("Transaction creation error.");
                return;
            }
            const batches = await symbolService.buildSignedAggregateCompleteTxBatches(
                txs,
                signerAccount,
                [],
            );
            const errors = await symbolService.executeBatches(batches, signerAccount);
            if (errors) {
                setError("Transaction error.");
                return;
            }

            setSucceeded(true);
        } catch (e) {
            console.error(e);
            setError(String(e));
        }
    }, []);

    return (<div className="content">
        <h1 className="title is-3">Scrap Metal by payload sample</h1>

        <form onSubmit={handleSubmit(scrapByPayload)}>
            <div className="field">
                <label className="label">Private Key (* The account will be signer/target/source)</label>
                <div className="control">
                    <input className={`input ${errors.private_key ? "is-danger" : ""}`} type="password" autoComplete="off" {
                        ...register("private_key", { required: "Required field." }) }
                    />
                </div>
            </div>
            { errors.private_key && <div className="field">
                <p className="help is-danger">
                    { errors.private_key.message }
                </p>
            </div> }

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
                <label className="label">Additive (Default:0)</label>
                <div className="control">
                    <input
                        className={`input ${errors.additive ? "is-danger" : ""}`}
                        type="number"
                        min={0}
                        max={65535}
                        step={1}
                        { ...register("additive", {
                            valueAsNumber: true,
                        }) }
                    />
                </div>
            </div>
            { errors.additive && <div className="field">
                <p className="help is-danger">
                    { errors.additive.message }
                </p>
            </div> }

            <div className="field">
                <label className="label">Text Section</label>
                <div className="control">
                    <input
                        className={`input ${errors.text ? "is-danger" : ""}`}
                        type="text"
                        { ...register("text") }
                    />
                </div>
            </div>
            { errors.text && <div className="field">
                <p className="help is-danger">
                    { errors.text.message }
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
                        disabled={!isValid || isSubmitting}
                >
                    Execute
                </button>
            </div>

            { error ? <div className="notification is-danger is-light">
                { error }
            </div> : null }

            { succeeded ? <div className="notification is-success is-light">
                Your Metal has been scrapped successfully.
            </div> : null }

            <div className="buttons is-centered">
                <Link to="/" className="button is-text">Back to Index</Link>
            </div>
        </form>
    </div>);
};

export default ScrapByPayload;
