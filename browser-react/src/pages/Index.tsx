import {Link} from "react-router-dom";


const Index = () => {
    return (<div className="content">
        <h1 className="title is-3">Index of Samples</h1>
        <ul>
            <li><Link to="/decode">Decode Metal payload sample</Link></li>
            <li><Link to="/fetch">Fetch by Metal ID sample</Link></li>
            <li><Link to="/fetch-by-key">Fetch by metadata Key sample</Link></li>
            <li><Link to="/forge">Forge Metal sample</Link></li>
            <li><Link to="/forge-recover">Recovery forge Metal sample</Link></li>
            <li><Link to="/scrap">Scrap Metal by Metal ID sample</Link></li>
            <li><Link to="/scrap-by-payload">Scrap Metal by Metal payload sample</Link></li>
            <li><Link to="/verify">Verify Metal sample</Link></li>
        </ul>
    </div>);
};

export default Index;
