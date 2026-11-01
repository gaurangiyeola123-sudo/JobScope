
import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  LayoutDashboard,
  ChartNoAxesCombined,
  MapPin,
  Wallet,
  Users,
  Bell,
  ChevronDown,
  LoaderCircle,
  AlertCircle,
  RefreshCw,
  X,
  ExternalLink,
  SlidersHorizontal,
  BrainCircuit,
  Target,
  Code2
} from "lucide-react";
import SalaryAnalytics from "./SalaryAnalytics";

import CareerAdvisor from "./CareerAdvisor";
import RealAnalytics from "./RealAnalytics";
import RealJobExplorer from "./RealJobExplorer";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from "recharts";

import {
  getStats,
  getJobs,
  getJobDetails,
  getSkills,
  getSalaries,
  getLocations,
  getSkillsByRole,
  getSkillCombinations,
  getSkillGap
} from "./api";

const COLORS = ["#2563eb", "#7c3aed", "#0891b2", "#16a34a", "#ea580c", "#db2777"];

const formatSalary = (value) =>
  `₹${(value / 100000).toFixed(1)} LPA`;

function StatCard({ title, value, subtitle, icon: Icon, color }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className={`rounded-lg p-2 ${color}`}>
          <Icon size={21} />
        </div>
      </div>
      <h2 className="mt-4 text-2xl font-bold text-slate-900">{value}</h2>
      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function JobDetailsModal({ job, onClose }) {
  if (!job) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">{job.company}</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              {job.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <X size={21} />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-slate-50 p-4">
            <MapPin size={18} className="text-blue-600" />
            <p className="mt-2 text-xs text-slate-500">Location</p>
            <p className="mt-1 font-semibold">{job.location}</p>
          </div>

          <div className="rounded-lg bg-slate-50 p-4">
            <BriefcaseBusiness size={18} className="text-blue-600" />
            <p className="mt-2 text-xs text-slate-500">Experience</p>
            <p className="mt-1 font-semibold">{job.experience}</p>
          </div>

          <div className="col-span-2 rounded-lg bg-slate-50 p-4">
            <Wallet size={18} className="text-green-600" />
            <p className="mt-2 text-xs text-slate-500">Salary range</p>
            <p className="mt-1 font-semibold">
              {formatSalary(job.min_salary)} – {formatSalary(job.max_salary)}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold text-slate-900">Required Skills</h3>

          <div className="mt-3 flex flex-wrap gap-2">
            {(Array.isArray(job.skills)
              ? job.skills
              : (job.skills || "").split(";")
            ).map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700"
              >
                {skill.trim()}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold text-slate-900">Job Information</h3>
          <p className="mt-2 text-sm text-slate-500">
            This listing is part of the JobScope sample dataset. Contact and
            application details are not currently available.
          </p>
        </div>

        <button
          onClick={onClose}
          className="mt-7 w-full rounded-lg bg-blue-600 py-3 font-medium text-white hover:bg-blue-700"
        >
          Close Details
        </button>
      </div>
    </div>
  );
}

function App() {
  const [activePage, setActivePage] = useState("dashboard");

  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [skills, setSkills] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [locations, setLocations] = useState([]);
  const [skillsByRole, setSkillsByRole] = useState([]);
  const [skillCombinations, setSkillCombinations] = useState([]);

  const [gapRole, setGapRole] = useState("Data Engineer");
  const [candidateSkills, setCandidateSkills] = useState("Python, SQL");
  const [gapResult, setGapResult] = useState(null);
  const [gapLoading, setGapLoading] = useState(false);
  const [gapError, setGapError] = useState("");

  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("");
  const [minSalary, setMinSalary] = useState("");
  const [maxSalary, setMaxSalary] = useState("");
  const [sortBy, setSortBy] = useState("default");

  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const [
        statsRes,
        jobsRes,
        skillsRes,
        salariesRes,
        locationsRes,
        roleSkillsRes,
        combinationsRes
      ] = await Promise.all([
        getStats(),
        getJobs(),
        getSkills(),
        getSalaries(),
        getLocations(),
        getSkillsByRole(),
        getSkillCombinations()
      ]);

      setStats(statsRes.data);
      setJobs(jobsRes.data.jobs);
      setSkills(skillsRes.data);
      setSalaries(salariesRes.data);
      setLocations(locationsRes.data);
      setSkillsByRole(roleSkillsRes.data);
      setSkillCombinations(combinationsRes.data);
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the backend. Check that FastAPI is running.");
    } finally {
      setLoading(false);
    }
  }

  async function searchJobs(event) {
    event?.preventDefault();

    try {
      setSearching(true);
      setError("");

      const params = {
        search,
        location: locationFilter,
        experience: experienceFilter,
        min_salary: minSalary ? Number(minSalary) * 100000 : 0,
        max_salary: maxSalary ? Number(maxSalary) * 100000 : 100000000,
        sort_by: sortBy
      };

      const response = await getJobs(params);
      setJobs(response.data.jobs);
    } catch (err) {
      console.error(err);
      setError("Unable to apply filters. Please try again.");
    } finally {
      setSearching(false);
    }
  }

  async function resetFilters() {
    setSearch("");
    setLocationFilter("");
    setExperienceFilter("");
    setMinSalary("");
    setMaxSalary("");
    setSortBy("default");

    try {
      setSearching(true);
      const response = await getJobs();
      setJobs(response.data.jobs);
      setError("");
    } catch (err) {
      setError("Unable to reload job listings.");
    } finally {
      setSearching(false);
    }
  }

  async function openJobDetails(jobId) {
    try {
      const response = await getJobDetails(jobId);
      setSelectedJob(response.data);
    } catch (err) {
      console.error(err);
      setError("Unable to load job details.");
    }
  }

  async function analyzeSkillGap(event) {
    event.preventDefault();

    try {
      setGapLoading(true);
      setGapError("");
      setGapResult(null);

      const response = await getSkillGap(gapRole, candidateSkills);
      setGapResult(response.data);
    } catch (err) {
      console.error(err);
      setGapError(
        err.response?.data?.detail ||
        "Unable to analyze this role. Please try again."
      );
    } finally {
      setGapLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <LoaderCircle
            className="mx-auto animate-spin text-blue-600"
            size={40}
          />
          <p className="mt-4 text-sm text-slate-500">
            Loading JobScope dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-xl border bg-white p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto text-red-500" size={40} />
          <h2 className="mt-4 text-xl font-bold">Connection Error</h2>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
          <button
            onClick={loadDashboard}
            className="mt-5 rounded-lg bg-blue-600 px-5 py-2 text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const pageTitle =
    activePage === "dashboard"
      ? "Dashboard"
      : activePage === "jobs"
      ? "Real Job Explorer"
      : "AI Career Advisor";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
          <div className="rounded-lg bg-blue-600 p-2 text-white">
            <BriefcaseBusiness size={22} />
          </div>
          <span className="text-xl font-bold text-slate-900">JobScope</span>
        </div>

        <div className="px-4 py-6">
          <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </p>

          <button
            onClick={() => setActivePage("dashboard")}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium ${
              activePage === "dashboard"
                ? "bg-blue-50 text-blue-700"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <LayoutDashboard size={19} />
            Dashboard
          </button>

          <button
            onClick={() => setActivePage("jobs")}
            className={`mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium ${
              activePage === "jobs"
                ? "bg-blue-50 text-blue-700"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <BriefcaseBusiness size={19} />
            Real Job Explorer
          </button>

          <button
            onClick={() => setActivePage("advisor")}
            className={`mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium ${
              activePage === "advisor"
                ? "bg-blue-50 text-blue-700"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <BrainCircuit size={19} />
            AI Career Advisor
          </button>

          <button
            onClick={() => {
              setActivePage("dashboard");
              document.getElementById("skills-intelligence")?.scrollIntoView({
                behavior: "smooth"
              });
            }}
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-slate-500 hover:bg-slate-50"
          >
            <ChartNoAxesCombined size={19} />
            Skills Analytics
          </button>
        </div>

        <div className="mt-auto border-t border-slate-100 p-5">
          <p className="text-xs text-slate-400">JOB MARKET INTELLIGENCE</p>
          <p className="mt-2 text-sm font-semibold text-slate-700">
            Make smarter career decisions.
          </p>
        </div>
      </aside>

      <main className="lg:ml-64">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-5 md:px-8">
          <div>
            <p className="text-xs text-slate-400">WORKSPACE / OVERVIEW</p>
            <h1 className="mt-1 text-lg font-bold text-slate-900">
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={loadDashboard}
              title="Refresh dashboard"
              className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
            >
              <RefreshCw size={18} />
            </button>

            <Bell size={20} className="text-slate-500" />

            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                JS
              </div>

              <div className="hidden sm:block">
                <p className="text-sm font-semibold">JobScope User</p>
                <p className="text-xs text-slate-400">Explorer</p>
              </div>

              <ChevronDown size={15} className="text-slate-400" />
            </div>
          </div>
        </header>

        <div className="space-y-7 p-5 md:p-8">

          {/* REAL JOB EXPLORER PAGE */}
          {activePage === "jobs" && <RealJobExplorer />}

          {/* AI CAREER ADVISOR PAGE */}
          {activePage === "advisor" && <CareerAdvisor />}

          {/* MAIN DASHBOARD PAGE */}
          {activePage === "dashboard" && (
            <>
              <section>
                <h2 className="text-2xl font-bold text-slate-900">
                  Job Market Overview
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Explore employment trends, salaries and in-demand skills.
                </p>
                <span className="mt-3 inline-block rounded-full bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
                  ● API Connected
                </span>
              </section>

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  title="Total Jobs"
                  value={stats?.total_jobs ?? "—"}
                  subtitle="Sample listings"
                  icon={BriefcaseBusiness}
                  color="bg-blue-50 text-blue-600"
                />
                <StatCard
                  title="Average Salary"
                  value={formatSalary(stats?.average_salary ?? 0)}
                  subtitle="Across listed jobs"
                  icon={Wallet}
                  color="bg-green-50 text-green-600"
                />
                <StatCard
                  title="Companies"
                  value={stats?.total_companies ?? "—"}
                  subtitle="Unique employers"
                  icon={Users}
                  color="bg-purple-50 text-purple-600"
                />
                <StatCard
                  title="Job Locations"
                  value={stats?.total_locations ?? "—"}
                  subtitle="Cities covered"
                  icon={MapPin}
                  color="bg-orange-50 text-orange-600"
                />
              </section>

              <RealAnalytics />
              <SalaryAnalytics />

              <section className="grid gap-5 xl:grid-cols-2">
                <ChartCard
                  title="Salary by Job Role"
                  subtitle="Average annual salary in INR"
                >
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={salaries}
                      layout="vertical"
                      margin={{ left: 15, right: 20 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tickFormatter={(v) =>
                          `₹${(v / 100000).toFixed(0)}L`
                        }
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        type="category"
                        dataKey="role"
                        width={130}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip
                        formatter={(v) => [
                          `₹${Number(v).toLocaleString("en-IN")}`,
                          "Average Salary"
                        ]}
                      />
                      <Bar
                        dataKey="average_salary"
                        fill="#2563eb"
                        radius={[0, 5, 5, 0]}
                        barSize={18}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard
                  title="Most In-Demand Skills"
                  subtitle="Frequency across job listings"
                >
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={skills}
                      margin={{ top: 5, right: 10, left: -15, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="skill"
                        tick={{ fontSize: 10 }}
                        interval={0}
                        angle={-25}
                        textAnchor="end"
                        height={65}
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar
                        dataKey="count"
                        fill="#7c3aed"
                        radius={[5, 5, 0, 0]}
                        barSize={28}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard
                  title="Jobs by Location"
                  subtitle="Distribution across cities"
                >
                  <div className="flex flex-col items-center gap-4 sm:flex-row">
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={locations}
                          dataKey="job_count"
                          nameKey="location"
                          cx="50%"
                          cy="50%"
                          outerRadius={95}
                          innerRadius={55}
                          paddingAngle={3}
                        >
                          {locations.map((item, index) => (
                            <Cell
                              key={item.location}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="flex flex-wrap justify-center gap-3 sm:flex-col">
                      {locations.map((item, index) => (
                        <div
                          key={item.location}
                          className="flex items-center gap-2 text-xs"
                        >
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{
                              backgroundColor: COLORS[index % COLORS.length]
                            }}
                          />
                          {item.location} ({item.job_count})
                        </div>
                      ))}
                    </div>
                  </div>
                </ChartCard>

                <ChartCard
                  title="Career Snapshot"
                  subtitle="Highlights from the current dataset"
                >
                  <div className="space-y-5">
                    <div className="rounded-lg bg-blue-50 p-4">
                      <p className="text-xs font-medium text-blue-600">
                        MOST FREQUENT ROLE
                      </p>
                      <h3 className="mt-2 text-xl font-bold">
                        {stats?.popular_role}
                      </h3>
                    </div>

                    <div className="rounded-lg bg-purple-50 p-4">
                      <p className="text-xs font-medium text-purple-600">
                        MOST DEMANDED SKILL
                      </p>
                      <h3 className="mt-2 text-xl font-bold">
                        {skills[0]?.skill}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Appears in {skills[0]?.count} job listings
                      </p>
                    </div>

                    <div className="rounded-lg bg-green-50 p-4">
                      <p className="text-xs font-medium text-green-600">
                        TOP LOCATION
                      </p>
                      <h3 className="mt-2 text-xl font-bold">
                        {locations[0]?.location}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {locations[0]?.job_count} job listings
                      </p>
                    </div>
                  </div>
                </ChartCard>
              </section>

              <section
                id="skills-intelligence"
                className="space-y-5"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="text-blue-600" size={22} />
                    <h2 className="text-xl font-bold text-slate-900">
                      Skills Intelligence
                    </h2>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    Explore skill demand, role requirements, skill combinations
                    and potential skill gaps.
                  </p>
                </div>

                <div className="grid gap-5 xl:grid-cols-2">
                  <ChartCard
                    title="Skills Required by Role"
                    subtitle="Select a role to inspect the skills found in its sample listings"
                  >
                    <div className="mb-4">
                      <select
                        value={gapRole}
                        onChange={(e) => setGapRole(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      >
                        {[...new Set(salaries.map((item) => item.role))].map(
                          (role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart
                        data={skillsByRole
                          .filter((item) => item.role === gapRole)
                          .sort((a, b) => b.count - a.count)}
                        layout="vertical"
                        margin={{ left: 12, right: 18 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          horizontal={false}
                        />
                        <XAxis
                          type="number"
                          allowDecimals={false}
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis
                          type="category"
                          dataKey="skill"
                          width={100}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip />
                        <Bar
                          dataKey="count"
                          name="Listings"
                          fill="#0891b2"
                          radius={[0, 5, 5, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard
                    title="Frequently Paired Skills"
                    subtitle="Skill pairs appearing together in the same job listing"
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                          <tr>
                            <th className="px-3 py-3">Skill 1</th>
                            <th className="px-3 py-3">Skill 2</th>
                            <th className="px-3 py-3 text-right">
                              Co-occurrences
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {skillCombinations.slice(0, 10).map((pair) => (
                            <tr key={`${pair.skill_1}-${pair.skill_2}`}>
                              <td className="px-3 py-3 font-medium">
                                {pair.skill_1}
                              </td>
                              <td className="px-3 py-3">{pair.skill_2}</td>
                              <td className="px-3 py-3 text-right font-semibold text-blue-700">
                                {pair.count}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </ChartCard>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Target size={20} className="text-purple-600" />
                    <h3 className="font-semibold text-slate-900">
                      Skill Gap Analysis
                    </h3>
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    Compare your current skills with skills appearing in
                    listings for a selected role.
                  </p>

                  <form
                    onSubmit={analyzeSkillGap}
                    className="mt-5 grid gap-3 md:grid-cols-2"
                  >
                    <label className="text-sm font-medium text-slate-700">
                      Target role
                      <select
                        value={gapRole}
                        onChange={(e) => setGapRole(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-3 font-normal"
                      >
                        {[...new Set(salaries.map((item) => item.role))].map(
                          (role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          )
                        )}
                      </select>
                    </label>

                    <label className="text-sm font-medium text-slate-700">
                      Your current skills (comma-separated)
                      <input
                        value={candidateSkills}
                        onChange={(e) => setCandidateSkills(e.target.value)}
                        placeholder="Python, SQL, Excel"
                        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-3 font-normal"
                      />
                    </label>

                    <div className="md:col-span-2">
                      <button
                        disabled={gapLoading}
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                      >
                        <Code2 size={17} />
                        {gapLoading ? "Analyzing..." : "Analyze Skill Gap"}
                      </button>
                    </div>
                  </form>

                  {gapError && (
                    <p className="mt-4 text-sm text-red-600">{gapError}</p>
                  )}

                  {gapResult && (
                    <div className="mt-6 border-t border-slate-100 pt-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-slate-900">
                            {gapResult.target_role} skill comparison
                          </h4>
                          <p className="mt-1 text-xs text-slate-500">
                            Based on {gapResult.matching_jobs} matching sample
                            listings
                          </p>
                        </div>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                          {gapResult.skills.length} skills identified
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {gapResult.skills.map((item) => (
                          <div
                            key={item.skill}
                            className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 p-3"
                          >
                            <div>
                              <p className="text-sm font-medium text-slate-800">
                                {item.skill}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                Found in {item.job_count} listing(s)
                              </p>
                            </div>

                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                item.status === "Already have"
                                  ? "bg-green-50 text-green-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-400">
                  These insights are calculated from the current sample dataset
                  and should not be interpreted as market-wide statistics or
                  definitive career requirements.
                </p>
              </section>

              <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-5">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal
                      size={19}
                      className="text-blue-600"
                    />
                    <h3 className="text-lg font-bold text-slate-900">
                      Advanced Job Explorer
                    </h3>
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    Search and filter opportunities using multiple criteria.
                  </p>

                  <form
                    onSubmit={searchJobs}
                    className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
                  >
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search title, company or skill..."
                      className="rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />

                    <select
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="rounded-lg border border-slate-200 px-4 py-3 text-sm"
                    >
                      <option value="">All Locations</option>
                      {locations.map((item) => (
                        <option key={item.location} value={item.location}>
                          {item.location}
                        </option>
                      ))}
                    </select>

                    <select
                      value={experienceFilter}
                      onChange={(e) => setExperienceFilter(e.target.value)}
                      className="rounded-lg border border-slate-200 px-4 py-3 text-sm"
                    >
                      <option value="">All Experience Levels</option>
                      <option value="Entry Level">Entry Level</option>
                      <option value="Mid Level">Mid Level</option>
                      <option value="Senior Level">Senior Level</option>
                    </select>

                    <input
                      type="number"
                      min="0"
                      value={minSalary}
                      onChange={(e) => setMinSalary(e.target.value)}
                      placeholder="Minimum salary (LPA)"
                      className="rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />

                    <input
                      type="number"
                      min="0"
                      value={maxSalary}
                      onChange={(e) => setMaxSalary(e.target.value)}
                      placeholder="Maximum salary (LPA)"
                      className="rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />

                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="rounded-lg border border-slate-200 px-4 py-3 text-sm"
                    >
                      <option value="default">Default Order</option>
                      <option value="salary_high">Highest Salary First</option>
                      <option value="salary_low">Lowest Salary First</option>
                      <option value="company">Company Name</option>
                    </select>

                    <div className="flex flex-wrap gap-2 sm:col-span-2 xl:col-span-3">
                      <button
                        type="submit"
                        disabled={searching}
                        className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                      >
                        {searching ? "Applying..." : "Apply Filters"}
                      </button>

                      <button
                        type="button"
                        onClick={resetFilters}
                        className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
                      >
                        Reset Filters
                      </button>
                    </div>
                  </form>
                </div>

                {error && (
                  <p className="px-5 pt-4 text-sm text-red-600">{error}</p>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-5 py-4">Job Role</th>
                        <th className="px-5 py-4">Company</th>
                        <th className="px-5 py-4">Location</th>
                        <th className="px-5 py-4">Experience</th>
                        <th className="px-5 py-4">Salary Range</th>
                        <th className="px-5 py-4">Details</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {jobs.length > 0 ? (
                        jobs.map((job) => (
                          <tr key={job.id} className="hover:bg-slate-50">
                            <td className="px-5 py-4 font-semibold">
                              {job.title}
                            </td>
                            <td className="px-5 py-4 text-slate-600">
                              {job.company}
                            </td>
                            <td className="px-5 py-4 text-slate-600">
                              {job.location}
                            </td>
                            <td className="px-5 py-4">
                              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">
                                {job.experience}
                              </span>
                            </td>
                            <td className="px-5 py-4 font-medium">
                              {formatSalary(job.min_salary)} –{" "}
                              {formatSalary(job.max_salary)}
                            </td>
                            <td className="px-5 py-4">
                              <button
                                onClick={() => openJobDetails(job.id)}
                                className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100"
                              >
                                View <ExternalLink size={13} />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="6"
                            className="px-5 py-10 text-center text-slate-400"
                          >
                            No matching jobs found. Try changing your filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-400">
                  Showing {jobs.length} matching listings from the sample
                  dataset.
                </div>
              </section>

              <footer className="pb-4 text-center text-xs text-slate-400">
                JobScope © 2026 · Job Market Intelligence Platform
              </footer>
            </>
          )}
        </div>
      </main>

      <JobDetailsModal
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
      />
    </div>
  );
}

export default App;
