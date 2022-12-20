import assert from "assert";
import {MetalService, SymbolService} from "metal-on-symbol";
import {useCallback, useState} from "react";
import {useForm} from "react-hook-form";
import {Account} from "symbol-sdk";
import {Link} from "react-router-dom";


assert(process.env.REACT_APP_NODE_URL);
const symbolService = new SymbolService({ node_url: process.env.REACT_APP_NODE_URL, repo_factory_config: {
        websocketInjected: WebSocket,
        websocketUrl: process.env.REACT_APP_NODE_URL.replace('http', 'ws') + '/ws',
    }
});
const metalService = new MetalService(symbolService);

interface FormData {
    metal_id: string;
    private_key: string;
}

const Scrap = () => {
    const [ error, setError ] = useState<string>();
    const [ succeeded, setSucceeded ] = useState<boolean>();
    const { handleSubmit, register, formState: { errors, isValid, isSubmitting } } = useForm<FormData>({
        mode: "onBlur",
    });

    const scrap = useCallback(async (data: FormData) => {
        try {
            setError(undefined);
            setSucceeded(undefined);
            const { networkType } = await symbolService.getNetwork();
            const signerAccount = Account.createFromPrivateKey(data.private_key, networkType);
            const metadataEntry = (await metalService.getFirstChunk(data.metal_id)).metadataEntry;

            const txs = await metalService.createScrapTxs(
                metadataEntry.metadataType,
                signerAccount.publicAccount,
                signerAccount.publicAccount,
                metadataEntry.targetId,
                metadataEntry.scopedMetadataKey,
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

    return <div className="content">
        <h1 className="title is-3">Scrap Metal sample</h1>

        <form onSubmit={handleSubmit(scrap)}>
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

export default Scrap;