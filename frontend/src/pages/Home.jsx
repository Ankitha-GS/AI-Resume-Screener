import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import JobForm from "../components/JobForm.jsx";
import { deleteJob, errorMessage, getJobs } from "../services/api.js";

export default function Home() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getJobs().then(setJobs).catch((e) => { setError(errorMessage(e)); setJobs([]); });
  }, []);

  const remove = async (job) => {
    if (!confirm(`Delete "${job.title}" and all its resumes?`)) return;
    await deleteJob(job.id);
    setJobs((j) => j.filter((x) => x.id !== job.id));
  };

  return (
    <div className="two-col">
      <JobForm onCreated={(job) => navigate(`/jobs/${job.id}`)} />
      <section>
        <h2>Your jobs</h2>
        {error && <p className="error" role="alert">{error}</p>}
        {jobs === null && <p className="muted">Loading…</p>}
        {jobs?.length === 0 && !error && <p className="muted">No jobs yet. Create your first one to start screening.</p>}
        <ul className="job-list">
          {jobs?.map((job) => (
            <li key={job.id} className="panel job-item">
              <div>
                <Link to={`/jobs/${job.id}`}><strong>{job.title}</strong></Link>
                <p className="muted">{job.resume_count} resume{job.resume_count === 1 ? "" : "s"} · {job.requirements.required_skills.length} required skills</p>
              </div>
              <button className="btn text" onClick={() => remove(job)}>Delete</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
