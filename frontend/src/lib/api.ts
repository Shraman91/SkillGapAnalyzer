import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface AnalyzePayload {
  resume_text?: string;
  manual_skills?: Record<string, string>;
  job_description?: string;
  role_id?: string;
}

export const fetchRoles = async () => {
  const response = await api.get("/roles/");
  return response.data;
};

export const runAnalysis = async (payload: AnalyzePayload, token?: string | null) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await api.post("/analyze/", payload, { headers });
  return response.data;
};

export const fetchUserAnalyses = async (token: string) => {
  const headers = { Authorization: `Bearer ${token}` };
  const response = await api.get("/analyze/list", { headers });
  return response.data;
};

export const fetchAnalysisDetail = async (id: string, token?: string | null) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await api.get(`/analyze/${id}`, { headers });
  return response.data;
};

export const updateUnitProgress = async (
  analysisId: string,
  unitId: string,
  completed: boolean,
  token?: string | null
) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await api.patch(
    `/analyze/${analysisId}/progress`,
    { unit_id: unitId, completed },
    { headers }
  );
  return response.data;
};

export const searchJobs = async (query: string, location: string, country: string = "in") => {
  const response = await api.get("/jobs/search", {
    params: { query, location, country },
  });
  return response.data;
};

export const analyzeJobReadiness = async (
  jobIds: string[],
  query: string,
  location: string,
  candidateSkills?: Record<string, string>,
  token?: string | null
) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await api.post(
    "/jobs/readiness",
    {
      job_ids: jobIds,
      query,
      location,
      candidate_skills: candidateSkills,
    },
    { headers }
  );
  return response.data;
};
