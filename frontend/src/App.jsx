import { NavLink, Link, Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home.jsx";
import JobDetail from "./pages/JobDetail.jsx";

const Icon = ({ name, size = 18 }) => {
  const paths = {
    leaf: <><path d="M20 4c-8 0-14 4-14 11a5 5 0 0 0 5 5C18 20 20 12 20 4Z"/><path d="M4 21c3-6 7-9 12-12"/></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    briefcase: <><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V4h8v3M3 12h18M10 12v2h4v-2"/></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    back: <><path d="M19 12H5M11 18l-6-6 6-6"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"/></>,
    upload: <><path d="M12 16V4m-5 5 5-5 5 5"/><path d="M4 16v4h16v-4"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2Z"/><path d="m19 14 1 2 2 1-2 1-1 2-1-2-2-1 2-1Z"/></>,
    chart: <><path d="M4 20V10m6 10V4m6 16v-7m6 7H2"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.grid}</svg>;
};

function Sidebar() {
  const location = useLocation();
  const onJob = location.pathname.startsWith("/jobs/");
  return <aside className="sidebar">
    <Link to="/" className="brand">
      <span className="brand-mark"><Icon name="leaf" size={22}/></span>
      <span>fieldnote<span className="brand-period">.</span><small>HIRING WORKSPACE</small></span>
    </Link>
    <div className="side-label">WORKSPACE</div>
    <nav className="side-nav">
      <NavLink to="/" end className={({isActive}) => `nav-link ${isActive ? "active" : ""}`}><Icon name="grid"/>Overview</NavLink>
      <NavLink to="/" className={() => `nav-link ${onJob ? "active" : ""}`}><Icon name="briefcase"/>Screening jobs</NavLink>
    </nav>
    <div className="sidebar-bottom">
      <div className="side-note"><span className="note-icon"><Icon name="spark" size={17}/></span><div><strong>Thoughtful hiring.</strong><p>Clear evidence. Better decisions.</p></div></div>
      <div className="profile-row"><span className="avatar">A</span><div><strong>Recruiter workspace</strong><small>Personal account</small></div><span className="profile-dot"/></div>
    </div>
  </aside>;
}

export default function App() {
  return <div className="app-shell">
    <Sidebar/>
    <div className="main-shell">
      <header className="mobile-header"><Link to="/" className="brand"><span className="brand-mark"><Icon name="leaf" size={20}/></span>fieldnote<span className="brand-period">.</span></Link><span className="mobile-tag">HIRING WORKSPACE</span></header>
      <div className="utility-bar"><div className="breadcrumb">Workspace <span>/</span> <strong>Talent screening</strong></div><div className="utility-right"><span className="status-dot"/> All systems connected <span className="utility-avatar">A</span></div></div>
      <main className="content-area">
        <Routes>
          <Route path="/" element={<Home Icon={Icon}/>}/>
          <Route path="/jobs/:id" element={<JobDetail Icon={Icon}/>}/>
          <Route path="*" element={<div className="empty-state"><h2>Page not found</h2><Link to="/" className="button button-dark">Back to overview</Link></div>}/>
        </Routes>
      </main>
      <footer className="app-footer"><span>fieldnote. <span className="footer-divider">/</span> AI Resume Screener</span><span>Built for clearer hiring decisions</span></footer>
    </div>
  </div>;
}