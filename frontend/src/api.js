import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
});

export const getStats = () => API.get("/stats");

export const getJobs = (params = {}) =>
  API.get("/jobs", { params });

export const getJobDetails = (jobId) =>
  API.get(`/jobs/${jobId}`);

export const getSkills = () => API.get("/skills");

export const getSalaries = () => API.get("/salaries");

export const getLocations = () => API.get("/locations");

export const getSkillsByRole = () =>
  API.get("/skills/by-role");

export const getSkillCombinations = () =>
  API.get("/skills/combinations");

export const getSkillGap = (role, candidateSkills) =>
  API.get("/skills/gap", {
    params: {
      role,
      candidate_skills: candidateSkills,
    },
  });
// Real Dataset Analytics

export const getRealStats = () => API.get("/real/stats");

export const getRealRoles = (limit = 10) =>
  API.get("/real/roles", { params: { limit } });

export const getRealLocations = (limit = 10) =>
  API.get("/real/locations", { params: { limit } });

export const getRealSalaries = (limit = 10) =>
  API.get("/real/salaries", { params: { limit } });

export const getRealSkills = (limit = 15) =>
  API.get("/real/skills", { params: { limit } });

export const getRealExperience = () =>
  API.get("/real/experience");

export const getRealCompanies = (limit = 10) =>
  API.get("/real/companies", { params: { limit } });

export const getRealJobs = (params = {}) =>
  API.get("/real/jobs", { params });

export const getRealJobDetails = (jobId) =>
  API.get(`/real/jobs/${jobId}`);
export const getSalaryOverview = () =>
  API.get("/real/salary/overview");

export const getSalaryDistribution = () =>
  API.get("/real/salary/distribution");

export const getSalaryByRole = (limit = 10) =>
  API.get("/real/salary/by-role", { params: { limit } });

export const getSalaryByCity = () =>
  API.get("/real/salary/by-city");
export const getSalaryPercentiles = () =>
  API.get("/real/salary/percentiles");

export const getSalaryByExperience = () =>
  API.get("/real/salary/by-experience");
export default API;
