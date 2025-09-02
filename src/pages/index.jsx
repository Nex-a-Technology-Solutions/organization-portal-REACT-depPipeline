import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Projects from "./Projects";

import Proposals from "./Proposals";

import Invoices from "./Invoices";

import Login from "./Login";

import TimeTracking from "./TimeTracking";

import Team from "./Team";

import Books from "./Books";

import ProposalView from "./ProposalView";

import Settings from "./Settings";

import Clients from "./Clients";

import ThankYou from "./ThankYou";

import UserInviteAcceptance from "./userInviteAcceptance";

import Register from "./Register.jsx";

import ClientProposalAcceptance from "./ClientProposalAcceptance.jsx";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

import GoogleOAuthCallback from "./GoogleOAuthCallback.jsx";

const PAGES = {
    
    Dashboard: Dashboard,
    
    Projects: Projects,
    
    Proposals: Proposals,
    
    Invoices: Invoices,
    
    TimeTracking: TimeTracking,
    
    Team: Team,
    
    Books: Books,
    
    ProposalView: ProposalView,
    
    Settings: Settings,
    
    Clients: Clients,
    
    ThankYou: ThankYou,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />

                <Route path="/login" element={<Login />} />
                
                <Route path="/Projects" element={<Projects />} />
                
                <Route path="/Proposals" element={<Proposals />} />
                
                <Route path="/Invoices" element={<Invoices />} />
                
                <Route path="/TimeTracking" element={<TimeTracking />} />
                
                <Route path="/Team" element={<Team />} />
                
                <Route path="/Books" element={<Books />} />
                
                <Route path="/ProposalView" element={<ProposalView />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/Clients" element={<Clients />} />
                
                <Route path="/ThankYou" element={<ThankYou />} />

                <Route path="/userInviteAcceptance" element={<UserInviteAcceptance />} />

                <Route path="/clientProposalAcceptance" element={<ClientProposalAcceptance />} />
                
                <Route path="/Register" element={<Register />} />

                <Route path="/auth/google/callback" element={<GoogleOAuthCallback />} />

            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}