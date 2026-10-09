import { Link, Route, Routes } from "react-router-dom";
import Home from "./pages/Home.jsx";
import JobDetail from "./pages/JobDetail.jsx";

export default function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-mark">A</span>
          <span>AI Resume <b>Screener</b></span>
        </Link>
        <div className="topbar-right">
          <span className="status-dot" />
          <span className="tagline">AI-powered candidate matching</span>
        </div>
      </header>

      <main className="page">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route
            path="*"
            element={
              <div className="panel">
                <h2>Page not found</h2>
                <Link to="/">Back to jobs</Link>
              </div>
            }
          />
        </Routes>
      </main>

      <footer className="footer">
        AI Resume Screener <span>·</span> Resume review, organized.
      </footer>
    </div>
  );
}