import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  timeout: 120000, // AI calls can be slow on the first request
});

export const errorMessage = (err) =>
  err.response?.data?.detail?.[0]?.msg ||
  err.response?.data?.detail ||
  (err.code === "ERR_NETWORK" ? "Can't reach the server. Is the backend running?" : err.message);

export const getJobs = () => api.get("/jobs").then((r) => r.data);
export const createJob = (data) => api.post("/jobs", data).then((r) => r.data);
export const getJob = (id) => api.get(`/jobs/${id}`).then((r) => r.data);
export const deleteJob = (id) => api.delete(`/jobs/${id}`);

export const getResumes = (id) => api.get(`/jobs/${id}/resumes`).then((r) => r.data);
export const deleteResume = (jobId, id) => api.delete(`/jobs/${jobId}/resumes/${id}`);
export const uploadResumes = (jobId, files) => {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  return api.post(`/jobs/${jobId}/resumes`, form).then((r) => r.data);
};

export const runMatching = (id) => api.post(`/jobs/${id}/match`).then((r) => r.data);
export const getResults = (id) => api.get(`/jobs/${id}/results`).then((r) => r.data);
