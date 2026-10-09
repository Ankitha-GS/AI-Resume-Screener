import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CandidateCard from "../components/CandidateCard.jsx";
import ResumeUploader from "../components/ResumeUploader.jsx";
import { deleteResume, errorMessage, getJob, getResults, getResumes, runMatching } from "../services/api.js";

export default function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getJob(id), getResumes(id), getResults(id)])
      .then(([j, r, m]) => { setJob(j); setResumes(r); setResults(m); })
      .catch((e) => setError(errorMessage(e)));
  }, [id]);

  const rank = async () => {
    setBusy(true);
    setError("");
    try {
      setResults(await runMatching(id));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const removeResume = async (r) => {
    await deleteResume(id, r.id);
    setResumes((list) => list.filter((x) => x.id !== r.id));
    setResults((list) => list.filter((x) => x.resume_id !== r.id));
  };

  if (error && !job) return <p className="error">{error} <Link to="/">Back to jobs</Link></p>;
  if (!job) return <p className="muted">Loading…</p>;
  const req = job.requirements;

  return (
    <>
      <p><Link to="/">All jobs</Link></p>
      <h1>{job.title}</h1>

      <section className="panel">
        <h2>What this job needs</h2>
        {req.summary && <p>{req.summary}</p>}
        <div className="cols">
          <div>
            <h4>Required skills</h4>
            <div className="chips">{req.required_skills.map((s) => <span key={s} className="chip">{s}</span>)}</div>
          </div>
          <div>
            <h4>Preferred skills</h4>
            <div className="chips">
              {req.preferred_skills.length ? req.preferred_skills.map((s) => <span key={s} className="chip soft">{s}</span>) : <span className="muted">None listed</span>}
            </div>
          </div>
          <div>
            <h4>Experience</h4>
            <p>{req.min_years_experience ? `${req.min_years_experience}+ years` : "Not specified"}{req.seniority ? `, ${req.seniority}` : ""}</p>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>Resumes ({resumes.length})</h2>
        <ResumeUploader jobId={id} onUploaded={(added) => setResumes((r) => [...r, ...added])} />
        {resumes.length > 0 && (
          <ul className="resume-list">
            {resumes.map((r) => (
              <li key={r.id}>
                <span><strong>{r.candidate.name}</strong> <span className="muted">{r.filename} · {r.candidate.skills.length} skills</span></span>
                <button className="btn text" onClick={() => removeResume(r)}>Remove</button>
              </li>
            ))}
          </ul>
        )}
        <button className="btn" onClick={rank} disabled={busy || resumes.length === 0}>
          {busy ? "Ranking candidates…" : results.length ? "Re-rank candidates" : "Rank candidates"}
        </button>
        {error && <p className="error" role="alert">{error}</p>}
      </section>

      {results.length > 0 && (
        <section>
          <h2>Ranked candidates</h2>
          {results.map((m, i) => <CandidateCard key={m.resume_id} rank={i + 1} m={m} />)}
        </section>
      )}
    </>
  );
}
