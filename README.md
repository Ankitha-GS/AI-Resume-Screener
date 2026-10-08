# AI Resume Screener

An AI-powered recruitment platform that helps recruiters create job requirements, upload candidate resumes, and automatically rank candidates based on their relevance to the job description.

The system combines resume processing, structured candidate-job matching, and AI-generated explanations to make the initial screening process faster and more consistent.

---

## 🚀 Live Demo

**Frontend:**  
https://YOUR-VERCEL-URL.vercel.app

**Backend API:**  
https://ai-resume-screener-xdfp.onrender.com

**API Documentation:**  
https://ai-resume-screener-xdfp.onrender.com/docs

> Replace the frontend URL above with your actual Vercel URL.

---

## 📌 Problem Statement

Recruiters often receive a large number of resumes for a single job opening. Manually reviewing every resume can be time-consuming and makes it difficult to consistently compare candidates against the same job requirements.

AI Resume Screener addresses this problem by providing an automated first-level screening system.

The application allows recruiters to:

- Create a job with a detailed job description
- Upload multiple candidate resumes
- Analyze candidate information
- Compare candidates against the job requirements
- Generate candidate match scores
- Rank candidates
- Provide explanations for the ranking

This helps recruiters quickly identify the most relevant candidates for further evaluation.

---

## ✨ Key Features

### Job Management
- Create job postings
- Store job titles and descriptions
- Maintain job information in PostgreSQL

### Resume Processing
- Upload candidate resumes in PDF format
- Process multiple resumes for a single job
- Store resume information for future reference

### AI-Powered Candidate Matching
- Compare candidate resumes against job requirements
- Generate candidate relevance scores
- Rank candidates based on their match with the job

### Explainable Results
- Provide reasons behind candidate rankings
- Highlight relevant candidate information
- Help recruiters understand why a candidate received a particular score

### Persistent Database
- PostgreSQL database using Neon
- Stores jobs, resumes, and candidate matching results

### REST API
- FastAPI-based backend
- Structured API endpoints
- Interactive Swagger API documentation

### Web Application
- Modern frontend interface
- Job creation workflow
- Resume upload
- Candidate ranking interface
- Results visualization

---

## 🏗️ System Architecture

```text
                    ┌─────────────────────┐
                    │      Recruiter      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │     Frontend        │
                    │   Web Application   │
                    └──────────┬──────────┘
                               │
                         REST API
                               │
                               ▼
                    ┌─────────────────────┐
                    │      FastAPI        │
                    │       Backend       │
                    └──────────┬──────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
                ▼                             ▼
       ┌─────────────────┐          ┌─────────────────┐
       │ Resume Analysis │          │  AI Processing  │
       │   & Matching    │          │  & Explanation  │
       └────────┬────────┘          └────────┬────────┘
                │                            │
                └──────────────┬─────────────┘
                               ▼
                    ┌─────────────────────┐
                    │ PostgreSQL / Neon   │
                    │                     │
                    │ • Jobs              │
                    │ • Resumes           │
                    │ • Match Results      │
                    └─────────────────────┘
