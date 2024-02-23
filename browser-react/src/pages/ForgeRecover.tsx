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
    type: MetadataType;
    private_key: string;
    target_id?: string;
    additive?: number;
    text?: string;
    payload: string;
}

const ForgeRecover = () => {
    const [ partial, setPartial ] = useState<boolean>();
    const [ metalId, setMetalId ] = useState<string>();
    const [ key, setKey ] = useState<string>();
    const [ additive, setAdditive ] = useState<number>();
    const [ error, setError ] = useState<string>();
    const { handleSubmit, register, formState: { errors, isValid, isSubmitting } } = useForm<FormData>({
        mode: "onBlur",
        defaultValues: {
            type: MetadataType.Account,
            additive: 0,
        },
    });

    // Announce 1st TX only.
    const partialForge = useCallback(async (data: FormData) => {
        try {
            setPartial(false);
            setMetalId(undefined);
            setError(undefined);
            const { networkType } = await symbolService.getNetwork();
            const signerAccount = Account.createFromPrivateKey(data.private_key, networkType);
            const targetId = data.target_id
                ? [ undefined, new MosaicId(data.target_id), SymbolService.createNamespaceId(data.target_id)][data.type]
                : undefined;

            const { txs } = await metalService.createForgeTxs(
                data.type,
                signerAccount.publicAccount,
                signerAccount.publicAccount,
                targetId,
                Convert.utf8ToUint8(data.payload),
                data.additive,
                data.text,
            );
            const batches = await symbolService.buildSignedAggregateCompleteTxBatches(
                txs.slice(0, 1),
                signerAccount,
                [],
            );
            const errors = await symbolService.executeBatches(batches, signerAccount);
            if (errors) {
                setError("Transaction error.");
                return;
            }

            setPartial(true);
        } catch (e) {
            console.error(e);
            setError(String(e));
        }
    }, []);

    // Announce all remaining TXs.
    const recoveryForge = useCallback(async (data: FormData) => {
        try {
            setMetalId(undefined);
            setError(undefined);
            const { networkType } = await symbolService.getNetwork();
            const signer = Account.createFromPrivateKey(data.private_key, networkType);
            const targetId = data.target_id
                ? [ undefined, new MosaicId(data.target_id), SymbolService.createNamespaceId(data.target_id)][data.type]
                : undefined;

            const metadataPool = await symbolService.searchBinMetadata(
                data.type,
                {
                    source: signer.publicAccount,
                    target: signer.publicAccount,
                    targetId
                });
            const { key, txs, additive } = await metalService.createForgeTxs(
                data.type,
                signer.publicAccount,
                signer.publicAccount,
                targetId,
                Convert.utf8ToUint8(data.payload),
                data.additive,
                data.text,
                metadataPool,
            );
            const batches = await symbolService.buildSignedAggregateCompleteTxBatches(
                txs,
                signer,
                [],
            );
            const errors = await symbolService.executeBatches(batches, signer);
            if (errors) {
                setError("Transaction error.");
                return;
            }
            const metalId = MetalServiceV2.calculateMetalId(
                data.type,
                signer.address,
                signer.address,
                targetId,
                key,
            );

            setMetalId(metalId);
            setAdditive(additive);
            setKey(key.toHex());
            setPartial(false);
        } catch (e) {
            console.error(e);
            setError(String(e));
        }
    }, []);

    return (<div className="content">
        <h1 className="title is-3">Recovery Forge Metal sample</h1>

        <form>
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
                <label className="label">Payload (1,000 bytes or larger for proper test case)</label>
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
                <button className={`button is-warning ${isSubmitting ? "is-loading" : ""}`}
                        disabled={!isValid || isSubmitting || partial}
                        onClick={handleSubmit(partialForge)}
                >
                    (1) Partial Forge
                </button>
                <button className={`button is-primary ${isSubmitting ? "is-loading" : ""}`}
                        disabled={!isValid || isSubmitting || !partial}
                        onClick={handleSubmit(recoveryForge)}
                >
                    (2) Recovery Forge
                </button>
            </div>

            { partial ? <div className="notification is-warning is-lignt">
                Now your Metal has been forged partially. Please hit "(2) Recovery Forge".
            </div> : null }

            { error ? <div className="notification is-danger is-light">
                { error }
            </div> : null }

            { metalId ? <div className="notification is-success is-light">
                <div className="field">
                    <label className="label">Forged Metal ID</label>
                    <div className="control">
                        <input type="text" className="input" value={metalId} readOnly={true} />
                    </div>
                </div>
                <div className="field">
                    <label className="label">Header chunk Metadata Key</label>
                    <div className="control">
                        <input type="text" className="input" value={key} readOnly={true} />
                    </div>
                </div>
                <div className="field">
                    <label className="label">Additive</label>
                    <div className="control">
                        <input type="text" className="input" value={additive} readOnly={true} />
                    </div>
                </div>
            </div> : null }

            <div className="buttons is-centered">
                <Link to="/" className="button is-text">Back to Index</Link>
            </div>
        </form>
    </div>);
};

export default ForgeRecover;
