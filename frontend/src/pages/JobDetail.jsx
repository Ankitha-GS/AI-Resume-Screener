import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CandidateCard from "../components/CandidateCard.jsx";
import ResumeUploader from "../components/ResumeUploader.jsx";
import {
  deleteResume,
  errorMessage,
  getJob,
  getResults,
  getResumes,
  runMatching,
} from "../services/api.js";

export default function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getJob(id), getResumes(id), getResults(id)])
      .then(([jobData, resumeData, matchData]) => {
        setJob(jobData);
        setResumes(resumeData);
        setResults(matchData);
      })
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

  const removeResume = async (resume) => {
    try {
      await deleteResume(id, resume.id);
      setResumes((list) => list.filter((item) => item.id !== resume.id));
      setResults((list) =>
        list.filter((item) => item.resume_id !== resume.id)
      );
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  if (error && !job) {
    return (
      <p className="error">
        {error} <Link to="/">Back to jobs</Link>
      </p>
    );
  }

  if (!job) {
    return (
      <div className="empty-state">
        <span className="loading-mark" />
        <p>Loading screening project…</p>
      </div>
    );
  }

  const req = job.requirements;

  return (
    <>
      <Link className="job-back" to="/">
        ← All screening projects
      </Link>

      <div className="job-detail-title">
        <p className="eyebrow">SCREENING PROJECT</p>
        <h1>{job.title}</h1>
        <p className="welcome-copy">
          Review role requirements, add candidate resumes, and compare
          explainable match scores.
        </p>
      </div>

      <section className="panel create-panel">
        <div className="section-heading">
          <div>
            <span className="step-tag">ROLE PROFILE</span>
            <h2>What this job needs</h2>
          </div>
          <span className="heading-icon">⌕</span>
        </div>

        {req.summary && <p>{req.summary}</p>}

        <div className="cols">
          <div>
            <h4>Required skills</h4>
            <div className="chips">
              {req.required_skills.map((skill) => (
                <span key={skill} className="chip">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4>Preferred skills</h4>
            <div className="chips">
              {req.preferred_skills.length ? (
                req.preferred_skills.map((skill) => (
                  <span key={skill} className="chip soft">
                    {skill}
                  </span>
                ))
              ) : (
                <span className="muted">None listed</span>
              )}
            </div>
          </div>

          <div>
            <h4>Experience</h4>
            <p>
              {req.min_years_experience
                ? `${req.min_years_experience}+ years`
                : "Not specified"}
              {req.seniority ? `, ${req.seniority}` : ""}
            </p>
          </div>
        </div>
      </section>

      <section className="panel create-panel">
        <div className="section-heading">
          <div>
            <span className="step-tag">CANDIDATE PIPELINE</span>
            <h2>Resumes ({resumes.length})</h2>
          </div>
          <span className="heading-icon">↥</span>
        </div>

        <ResumeUploader
          jobId={id}
          onUploaded={(added) => setResumes((current) => [...current, ...added])}
        />

        {resumes.length > 0 && (
          <ul className="resume-list">
            {resumes.map((resume) => (
              <li key={resume.id}>
                <span>
                  <strong>{resume.candidate.name}</strong>
                  <span className="muted">
                    {" "}
                    {resume.filename} · {resume.candidate.skills.length} skills
                  </span>
                </span>

                <button
                  className="btn text"
                  onClick={() => removeResume(resume)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          className="btn"
          onClick={rank}
          disabled={busy || resumes.length === 0}
        >
          {busy
            ? "Ranking candidates…"
            : results.length
              ? "Re-rank candidates"
              : "Rank candidates"}
        </button>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </section>

      {results.length > 0 && (
        <section className="results-section">
          <div className="section-heading">
            <div>
              <span className="step-tag">MATCH RESULTS</span>
              <h2>Ranked candidates</h2>
            </div>
            <span className="count-pill">{results.length}</span>
          </div>

          {results.map((match, index) => (
            <CandidateCard
              key={match.resume_id}
              rank={index + 1}
              m={match}
            />
          ))}
        </section>
      )}
    </>
  );
}