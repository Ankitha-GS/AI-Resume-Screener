import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CandidateCard from "../components/CandidateCard.jsx";
import ResumeUploader from "../components/ResumeUploader.jsx";
import { deleteResume, errorMessage, getJob, getResults, getResumes, runMatching } from "../services/api.js";

export default function JobDetail({ Icon }) {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sort, setSort] = useState("score");

  const refresh = () => Promise.all([getJob(id), getResumes(id), getResults(id)])
    .then(([j, r, m]) => { setJob(j); setResumes(r); setResults(m); })
    .catch((e) => setError(errorMessage(e)));
  useEffect(() => { setError(""); refresh(); }, [id]);

  const rank = async () => {
    setBusy(true); setError("");
    try { setResults(await runMatching(id)); }
    catch (e) { setError(errorMessage(e)); }
    finally { setBusy(false); }
  };
  const removeResume = async (r) => {
    try { await deleteResume(id, r.id); setResumes((list) => list.filter((x) => x.id !== r.id)); setResults((list) => list.filter((x) => x.resume_id !== r.id)); }
    catch (e) { setError(errorMessage(e)); }
  };

  const sortedResults = useMemo(() => [...results].sort((a,b) => sort === "name" ? (a.candidate?.name || "").localeCompare(b.candidate?.name || "") : b.score - a.score), [results, sort]);
  if (error && !job) return <div className="alert alert-error"><strong>Couldn't open this screening.</strong><span>{error}</span><Link to="/" className="button button-outline button-small">Back to overview</Link></div>;
  if (!job) return <div className="loading-card"><span className="loading-mark"/><span>Opening screening…</span></div>;

  const req = job.requirements || {};
  const min = req.min_years_experience;
  const max = req.max_years_experience;
  const experienceText = min != null && max != null ? `${min}–${max} years` : min != null ? `${min}+ years` : max != null ? `Up to ${max} years` : "Not specified";

  return <div className="page-stack job-detail-page">
    <Link to="/" className="back-link"><Icon name="back" size={16}/> All screening jobs</Link>
    <section className="detail-hero">
      <div><div className="eyebrow"><span className="eyebrow-line"/> SCREENING / ROLE DETAILS</div><h1>{job.title}</h1><p>{req.summary || "Role requirements and candidate screening."}</p><div className="hero-tags"><span><Icon name="file" size={14}/>{resumes.length} resumes</span><span><Icon name="briefcase" size={14}/>{experienceText}</span>{req.seniority && <span>{req.seniority} level</span>}</div></div>
      <div className="hero-index"><span>ROLE</span><strong>{String(job.id).padStart(2,"0")}</strong><small>SCREENING FILE</small></div>
    </section>

    {error && <div className="alert alert-error" role="alert">{error}<button className="button button-small button-outline" onClick={() => setError("")}>Dismiss</button></div>}

    <section className="requirements-panel">
      <div className="section-heading"><div><div className="eyebrow">ROLE PROFILE</div><h2>What matters for this role</h2><p>Requirements extracted from the job description.</p></div><span className="requirement-count">{(req.required_skills || []).length} required</span></div>
      <div className="requirement-groups">
        <div><h4><span className="requirement-marker required"/>Required requirements</h4><div className="evidence-chips">{req.required_skills?.length ? req.required_skills.map((s) => <span className="requirement-chip" key={s}>{s}</span>) : <p className="subtle-copy">No required requirements were identified.</p>}</div></div>
        <div><h4><span className="requirement-marker preferred"/>Preferred requirements</h4><div className="evidence-chips">{req.preferred_skills?.length ? req.preferred_skills.map((s) => <span className="requirement-chip preferred-chip" key={s}>{s}</span>) : <p className="subtle-copy">No preferred requirements listed.</p>}</div></div>
      </div>
    </section>

    <section className="resume-panel">
      <div className="section-heading"><div><div className="eyebrow">CANDIDATE INTAKE</div><h2>Resume library <span className="inline-count">{resumes.length}</span></h2><p>Upload PDFs to prepare your shortlist.</p></div><div className="panel-step">STEP <strong>02</strong></div></div>
      <ResumeUploader jobId={id} onUploaded={(added) => setResumes((r) => [...r, ...added])} Icon={Icon}/>
      {resumes.length > 0 && <div className="resume-table"><div className="resume-table-head"><span>Candidate / file</span><span>Extracted skills</span><span>Action</span></div>{resumes.map((r) => <div className="resume-table-row" key={r.id}><div className="resume-person"><span className="file-mark"><Icon name="file" size={17}/></span><div><strong>{r.candidate?.name || r.filename}</strong><small>{r.filename}</small></div></div><span className="resume-skills-count">{r.candidate?.skills?.length || 0} skills detected</span><button className="text-action" onClick={() => removeResume(r)}>Remove</button></div>)}</div>}
      <div className="rank-action-row"><div><strong>{resumes.length ? `${resumes.length} resume${resumes.length === 1 ? "" : "s"} ready to compare` : "Waiting for resumes"}</strong><p>{resumes.length ? "Run the assessment when you are ready." : "Upload one or more PDF files to begin."}</p></div><button className="button button-dark" onClick={rank} disabled={busy || resumes.length === 0}>{busy ? <><span className="button-spinner"/>Comparing candidates…</> : <>{results.length ? "Refresh ranking" : "Compare candidates"} <Icon name="arrow" size={17}/></>}</button></div>
    </section>

    <section className="results-section">
      <div className="section-heading"><div><div className="eyebrow">ASSESSMENT</div><h2>Candidate comparison</h2><p>Scores summarize fit against this role; review the evidence before making decisions.</p></div>{results.length > 0 && <label className="sort-control">Sort by <select value={sort} onChange={(e) => setSort(e.target.value)}><option value="score">Overall fit</option><option value="name">Candidate name</option></select></label>}</div>
      {results.length === 0 ? <div className="results-empty"><div className="empty-icon"><Icon name="chart" size={23}/></div><h3>Your comparison will appear here.</h3><p>Once resumes are uploaded, run a comparison to see scores, supported requirements, gaps and experience notes.</p></div> : <div className="candidate-list">{sortedResults.map((m) => <CandidateCard key={m.resume_id} rank={sortedResults.findIndex((x) => x.resume_id === m.resume_id) + 1} m={m} Icon={Icon}/>)}</div>}
    </section>
  </div>;
}