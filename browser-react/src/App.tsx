import React from 'react';
import {BrowserRouter, Route, Routes} from "react-router-dom";
import Index from "./pages/Index";
import Decode from "./pages/Decode";
import Fetch from "./pages/Fetch";
import FetchByKey from "./pages/FetchByKey";
import Forge from "./pages/Forge";
import ForgeRecover from "./pages/ForgeRecover";
import Scrap from "./pages/Scrap";
import ScrapByPayload from "./pages/ScrapByPayload";
import Verify from "./pages/Verify";

function App() {
    return (
        <section className="section">
            <div className="container is-max-desktop">
                <BrowserRouter>
                    <Routes>
                        <Route path="/decode" element={<Decode />} />
                        <Route path="/fetch" element={<Fetch />} />
                        <Route path="/fetch-by-key" element={<FetchByKey />} />
                        <Route path="/forge" element={<Forge />} />
                        <Route path="/forge-recover" element={<ForgeRecover />} />
                        <Route path="/scrap" element={<Scrap />} />
                        <Route path="/scrap-by-payload" element={<ScrapByPayload />} />
                        <Route path="/verify" element={<Verify />} />
                        <Route path="/" element={<Index />} />
                    </Routes>
                </BrowserRouter>
            </div>
        </section>
    );
}

export default App;
