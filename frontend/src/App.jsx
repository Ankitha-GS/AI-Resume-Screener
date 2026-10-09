import { Link, Route, Routes } from "react-router-dom";
import Home from "./pages/Home.jsx";
import JobDetail from "./pages/JobDetail.jsx";

export default function App() {
  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">AI Resume Screener</Link>
        <span className="tagline">Rank resumes against a job, with reasons.</span>
      </header>
      <main className="page">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="*" element={<p>Page not found. <Link to="/">Back to jobs</Link></p>} />
        </Routes>
      </main>
    </>
  );
}
