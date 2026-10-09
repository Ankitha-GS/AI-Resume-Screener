import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import JobForm from "../components/JobForm.jsx";
import { deleteJob, errorMessage, getJobs } from "../services/api.js";

export default function Home() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getJobs()
      .then(setJobs)
      .catch((e) => {
        setError(errorMessage(e));
        setJobs([]);
      });
  }, []);

  const remove = async (job) => {
    if (!confirm(`Delete "${job.title}" and all its resumes?`)) return;

    try {
      await deleteJob(job.id);
      setJobs((current) => current.filter((item) => item.id !== job.id));
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const totalResumes =
    jobs?.reduce((sum, job) => sum + (job.resume_count || 0), 0) ?? 0;

  return (
    <div className="dashboard">
      <section className="welcome-row">
        <div>
          <p className="eyebrow">RECRUITMENT WORKSPACE</p>
          <h1>
            Find the right people, <span>faster.</span>
          </h1>
          <p className="welcome-copy">
            Turn job descriptions and resumes into a clear, explainable
            shortlist.
          </p>
        </div>

        <div className="welcome-icon" aria-hidden="true">
          <span>✦</span>
          <i />
          <b />
        </div>
      </section>

      <section className="stats-grid" aria-label="Workspace overview">
        <article className="stat-card">
          <span className="stat-icon purple">▤</span>
          <div>
            <p>Jobs created</p>
            <strong>{jobs === null ? "—" : jobs.length}</strong>
          </div>
          <span className="stat-foot">Screening projects</span>
        </article>

        <article className="stat-card">
          <span className="stat-icon mint">▧</span>
          <div>
            <p>Resumes uploaded</p>
            <strong>{jobs === null ? "—" : totalResumes}</strong>
          </div>
          <span className="stat-foot">Across all jobs</span>
        </article>

        <article className="stat-card">
          <span className="stat-icon blue">◎</span>
          <div>
            <p>Workflow</p>
            <strong className="stat-word">AI assisted</strong>
          </div>
          <span className="stat-foot">Skills · experience · fit</span>
        </article>
      </section>

      <div className="workspace-grid">
        <section className="panel create-panel">
          <div className="section-heading">
            <div>
              <span className="step-tag">STEP 01</span>
              <h2>Create a screening</h2>
            </div>
            <span className="heading-icon">＋</span>
          </div>

          <p className="section-description">
            Start with the role. AI will extract the requirements from your
            job description.
          </p>

          <JobForm onCreated={(job) => navigate(`/jobs/${job.id}`)} />

          <div className="privacy-note">
            <span>✧</span>
            Review match scores alongside the candidate evidence.
          </div>
        </section>

        <section className="jobs-panel">
          <div className="section-heading jobs-heading">
            <div>
              <span className="step-tag">YOUR WORKSPACE</span>
              <h2>Screening projects</h2>
            </div>
            <span className="count-pill">
              {jobs === null ? "…" : jobs.length}
            </span>
          </div>

          <p className="section-description">
            Open a project to manage resumes and rank candidates.
          </p>

          {error && (
            <p className="error alert" role="alert">
              {error}
            </p>
          )}

          {jobs === null && (
            <div className="empty-state">
              <span className="loading-mark" />
              <p>Loading your projects…</p>
            </div>
          )}

          {jobs?.length === 0 && !error && (
            <div className="empty-state">
              <span className="empty-icon">▤</span>
              <h3>Your workspace is ready</h3>
              <p>
                Create your first screening to get started. Your projects will
                appear here.
              </p>
            </div>
          )}

          <ul className="job-list">
            {jobs?.map((job) => (
              <li key={job.id} className="job-card">
                <div className="job-card-symbol">
                  {(job.title || "J").trim().charAt(0).toUpperCase()}
                </div>

                <div className="job-card-main">
                  <Link to={`/jobs/${job.id}`} className="job-title">
                    {job.title}
                  </Link>

                  <div className="job-meta">
                    <span>
                      {job.resume_count} resume
                      {job.resume_count === 1 ? "" : "s"}
                    </span>
                    <span className="meta-separator">·</span>
                    <span>
                      {job.requirements.required_skills.length} required skills
                    </span>
                  </div>

                  <Link className="open-project" to={`/jobs/${job.id}`}>
                    Open screening <span>↗</span>
                  </Link>
                </div>

                <button
                  className="icon-button delete-button"
                  aria-label={`Delete ${job.title}`}
                  title="Delete project"
                  onClick={() => remove(job)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}