import assert from "assert";
import {MetalService, SymbolService} from "metal-on-symbol";
import {Account, Convert, MetadataType, MosaicId} from "symbol-sdk";
import {useCallback, useState} from "react";
import {useForm} from "react-hook-form";
import {Link} from "react-router-dom";


assert(process.env.REACT_APP_NODE_URL);
SymbolService.init({ node_url: process.env.REACT_APP_NODE_URL, repo_factory_config: {
        websocketInjected: WebSocket,
        websocketUrl: process.env.REACT_APP_NODE_URL.replace('http', 'ws') + '/ws',
    }
});

interface FormData {
    private_key: string;
    type: MetadataType;
    target_id?: string;
    payload: string;
    additive: string;
}

const ScrapByPayload = () => {
    const [ error, setError ] = useState<string>();
    const [ succeeded, setSucceeded ] = useState<boolean>();
    const { handleSubmit, register, formState: { errors, isValid, isSubmitting } } = useForm<FormData>({
        mode: "onBlur",
        defaultValues: {
            type: MetadataType.Account,
            additive: "0000",
        },
    });

    const scrapByPayload = useCallback(async (data: FormData) => {
        try {
            setError(undefined);
            setSucceeded(undefined);
            const { networkType } = await SymbolService.getNetwork();
            const signerAccount = Account.createFromPrivateKey(data.private_key, networkType);
            const targetId = data.target_id
                ? [ undefined, new MosaicId(data.target_id), SymbolService.createNamespaceId(data.target_id)][data.type]
                : undefined;

            const txs = await MetalService.createDestroyTxs(
                data.type,
                signerAccount.publicAccount,
                signerAccount.publicAccount,
                targetId,
                Convert.utf8ToUint8(data.payload),
                Convert.utf8ToUint8(data.additive),
            );
            if (!txs) {
                setError("Transaction creation error.");
                return;
            }
            const batches = await SymbolService.buildSignedAggregateCompleteTxBatches(
                txs,
                signerAccount,
                [],
            );
            const errors = await SymbolService.executeBatches(batches, signerAccount);
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

    return <div className="content">
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
                <label className="label">Additive (Default:0000)</label>
                <div className="control">
                    <input className={`input ${errors.additive ? "is-danger" : ""}`} type="text" {
                        ...register("additive", {
                            pattern: {
                                value: /^[\x21-\x7e\s]{4}$/,
                                message: "Additive must be 4 ascii characters"
                            }
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
    </div>;
};

export default ScrapByPayload;