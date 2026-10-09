import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import JobForm from "../components/JobForm.jsx";
import { deleteJob, errorMessage, getJobs } from "../services/api.js";

export default function Home({ Icon }) {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const refresh = () => getJobs().then(setJobs).catch((e) => { setError(errorMessage(e)); setJobs([]); });
  useEffect(() => { refresh(); }, []);

  const remove = async (job) => {
    if (!window.confirm(`Delete "${job.title}" and all its resumes?`)) return;
    try { await deleteJob(job.id); setJobs((current) => current.filter((x) => x.id !== job.id)); }
    catch (e) { setError(errorMessage(e)); }
  };

  const filteredJobs = useMemo(() => (jobs || []).filter((j) => j.title.toLowerCase().includes(query.toLowerCase())), [jobs, query]);
  const totalResumes = (jobs || []).reduce((sum, job) => sum + (job.resume_count || 0), 0);
  const totalRequirements = (jobs || []).reduce((sum, job) => sum + (job.requirements?.required_skills?.length || 0), 0);

  return <div className="page-stack">
    <section className="welcome-band">
      <div className="welcome-copy">
        <div className="eyebrow"><span className="eyebrow-line"/> RECRUITMENT / OVERVIEW</div>
        <h1>Good hiring starts<br/><em>with a closer look.</em></h1>
        <p>A calm, evidence-led workspace to understand resumes, compare candidates, and make more considered hiring decisions.</p>
        <a className="button button-dark" href="#create-job">Start a screening <Icon name="arrow" size={17}/></a>
      </div>
      <div className="welcome-art" aria-hidden="true">
        <div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/>
        <div className="art-leaf leaf-one"/><div className="art-leaf leaf-two"/><div className="art-leaf leaf-three"/>
        <div className="art-stamp"><Icon name="leaf" size={24}/><span>BETTER<br/>BY DESIGN</span></div>
        <div className="art-caption">PEOPLE, NOT JUST PAPER.</div>
      </div>
    </section>

    <section className="stats-grid" aria-label="Workspace summary">
      <div className="stat-card"><div className="stat-top"><span>Screening jobs</span><span className="stat-icon sage"><Icon name="briefcase" size={18}/></span></div><div className="stat-number">{jobs === null ? "—" : String(jobs.length).padStart(2, "0")}</div><div className="stat-foot">Roles in your workspace</div></div>
      <div className="stat-card"><div className="stat-top"><span>Resumes received</span><span className="stat-icon peach"><Icon name="file" size={18}/></span></div><div className="stat-number">{jobs === null ? "—" : totalResumes}</div><div className="stat-foot">Across all screening jobs</div></div>
      <div className="stat-card"><div className="stat-top"><span>Requirements mapped</span><span className="stat-icon cream"><Icon name="chart" size={18}/></span></div><div className="stat-number">{jobs === null ? "—" : totalRequirements}</div><div className="stat-foot">Extracted from job descriptions</div></div>
    </section>

    {error && <div className="alert alert-error" role="alert"><strong>We couldn't load your workspace.</strong><span>{error}</span><button className="button button-small button-outline" onClick={refresh}>Try again</button></div>}

    <section className="workspace-grid">
      <div className="section-column jobs-column">
        <div className="section-heading"><div><div className="eyebrow">YOUR PIPELINE</div><h2>Screening jobs</h2><p>Pick up where you left off.</p></div><span className="count-pill">{jobs?.length ?? "—"} roles</span></div>
        <div className="job-toolbar"><label className="search-box"><Icon name="search" size={17}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search job titles..." aria-label="Search job titles"/></label></div>
        {jobs === null ? <div className="loading-card"><span className="loading-mark"/><span>Loading your jobs…</span></div> :
          filteredJobs.length === 0 ? <div className="empty-state"><div className="empty-icon"><Icon name="briefcase" size={24}/></div><h3>{query ? "No matching roles" : "Your next great hire starts here."}</h3><p>{query ? "Try another search term." : "Create a screening on the right. Your jobs and candidates will appear here."}</p>{query && <button className="button button-outline" onClick={() => setQuery("")}>Clear search</button>}</div> :
          <div className="job-list-modern">{filteredJobs.map((job, index) => <article className="job-row" key={job.id}>
            <div className={`job-index tone-${index % 3}`}>{String(index + 1).padStart(2, "0")}</div>
            <div className="job-main"><Link to={`/jobs/${job.id}`} className="job-title">{job.title}<Icon name="chevron" size={16}/></Link><div className="job-meta"><span><Icon name="file" size={14}/>{job.resume_count || 0} resumes</span><span>{job.requirements?.required_skills?.length || 0} required requirements</span></div><div className="job-summary">{job.requirements?.summary || "Open role · Ready for candidate screening"}</div></div>
            <div className="job-row-actions"><span className="live-status"><span/>Saved</span><button className="icon-button" title={`Delete ${job.title}`} aria-label={`Delete ${job.title}`} onClick={() => remove(job)}><Icon name="trash" size={16}/></button></div>
          </article>)}</div>}
        <div className="privacy-note"><Icon name="check" size={16}/><span>Candidate information stays tied to its screening job.</span></div>
      </div>
      <div className="create-column" id="create-job">
        <div className="section-heading"><div><div className="eyebrow">NEW WORKFLOW</div><h2>Create a screening</h2><p>Start with the role, not the resume.</p></div><span className="step-badge">01</span></div>
        <JobForm onCreated={(job) => navigate(`/jobs/${job.id}`)} Icon={Icon}/>
        <div className="how-card"><div className="how-mark"><Icon name="spark" size={18}/></div><div><strong>What happens next?</strong><p>We extract the role's requirements, then compare each uploaded resume against them.</p></div></div>
      </div>
    </section>
  </div>;
}