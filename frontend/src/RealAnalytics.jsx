
import { useEffect, useState } from "react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import {
  getRealStats,
  getRealRoles,
  getRealLocations,
  getRealSalaries,
  getRealSkills,
  getRealExperience,
  getRealCompanies,
} from "./api";

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-IN");

function StatCard({ title, value, subtitle }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h3 className="mt-3 text-2xl font-bold text-slate-900">
        {value}
      </h3>
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

function EmptyChart() {
  return (
    <div className="flex h-[280px] items-center justify-center text-sm text-slate-400">
      No data available for this chart.
    </div>
  );
}

function RealAnalytics() {
  const [stats, setStats] = useState(null);
  const [roles, setRoles] = useState([]);
  const [locations, setLocations] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [skills, setSkills] = useState([]);
  const [experience, setExperience] = useState([]);
  const [companies, setCompanies] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRealAnalytics() {
      try {
        setLoading(true);
        setError("");

        const [
          statsRes,
          rolesRes,
          locationsRes,
          salariesRes,
          skillsRes,
          experienceRes,
          companiesRes,
        ] = await Promise.all([
          getRealStats(),
          getRealRoles(10),
          getRealLocations(10),
          getRealSalaries(10),
          getRealSkills(15),
          getRealExperience(),
          getRealCompanies(10),
        ]);

        setStats(statsRes.data);
        setRoles(rolesRes.data);
        setLocations(locationsRes.data);
        setSalaries(salariesRes.data);
        setSkills(skillsRes.data);
        setExperience(experienceRes.data);
        setCompanies(companiesRes.data);
      } catch (err) {
        console.error("Real analytics error:", err);

        setError(
          "Unable to load real dataset analytics. Check that the backend is running."
        );
      } finally {
        setLoading(false);
      }
    }

    loadRealAnalytics();
  }, []);

  const experienceChart = [...experience]
    .sort((a, b) => b.total_jobs - a.total_jobs)
    .slice(0, 10)
    .map((item) => ({
      range: `${item.min_experience}-${item.max_experience} yrs`,
      total_jobs: item.total_jobs,
    }));

  if (loading) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm text-slate-500">
          Loading real job market analytics...
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-xl border border-red-200 bg-white p-6">
        <p className="text-sm text-red-600">{error}</p>
      </section>
    );
  }

  return (
    <section id="real-analytics" className="space-y-6">

      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-bold text-slate-900">
            Real Job Market Intelligence
          </h2>

          <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
            REAL DATASET
          </span>
        </div>

        <p className="mt-2 text-sm text-slate-500">
          Analytics generated from 97,679 imported job listings.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Job Listings"
          value={formatNumber(stats?.total_jobs)}
          subtitle="Unique imported job records"
        />

        <StatCard
          title="Companies"
          value={formatNumber(stats?.total_companies)}
          subtitle="Distinct company names"
        />

        <StatCard
          title="Locations"
          value={formatNumber(stats?.total_locations)}
          subtitle="Distinct locations"
        />

        <StatCard
          title="INR Jobs with Salary"
          value={formatNumber(stats?.disclosed_salary_jobs)}
          subtitle="Listings with at least one salary value"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">

        <ChartCard
          title="Most In-Demand Job Roles"
          subtitle="Top 10 job titles by listing count"
        >
          {roles.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={roles}
                layout="vertical"
                margin={{ left: 15, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="role"
                  width={155}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip />
                <Bar
                  dataKey="total_jobs"
                  name="Job Listings"
                  fill="#2563eb"
                  radius={[0, 5, 5, 0]}
                  barSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        <ChartCard
          title="Job Demand by Location"
          subtitle="Top 10 locations by listing count"
        >
          {locations.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={locations}
                layout="vertical"
                margin={{ left: 15, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="location"
                  width={110}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip />
                <Bar
                  dataKey="total_jobs"
                  name="Job Listings"
                  fill="#0891b2"
                  radius={[0, 5, 5, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

      </div>

      <div className="grid gap-5 xl:grid-cols-2">

        <ChartCard
          title="Salary Intelligence by Role"
          subtitle="Average salary midpoint in INR, for listings with both salary bounds disclosed"
        >
          {salaries.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={salaries}
                layout="vertical"
                margin={{ left: 15, right: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(value) =>
                    `₹${(value / 100000).toFixed(0)}L`
                  }
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  type="category"
                  dataKey="role"
                  width={155}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  formatter={(value) => [
                    `₹${Number(value).toLocaleString("en-IN")}`,
                    "Average Salary",
                  ]}
                />
                <Bar
                  dataKey="average_salary"
                  name="Average Salary"
                  fill="#16a34a"
                  radius={[0, 5, 5, 0]}
                  barSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        <ChartCard
          title="Most Demanded Skills"
          subtitle="Number of job listings mentioning each skill"
        >
          {skills.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={skills}
                layout="vertical"
                margin={{ left: 15, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="skill"
                  width={110}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip />
                <Bar
                  dataKey="job_count"
                  name="Job Listings"
                  fill="#7c3aed"
                  radius={[0, 5, 5, 0]}
                  barSize={17}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

      </div>

      <div className="grid gap-5 xl:grid-cols-2">

        <ChartCard
          title="Experience Requirements"
          subtitle="Most frequent minimum-maximum experience combinations"
        >
          {experienceChart.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={experienceChart}
                margin={{ top: 5, right: 15, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="range"
                  tick={{ fontSize: 10 }}
                  angle={-25}
                  textAnchor="end"
                  height={65}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar
                  dataKey="total_jobs"
                  name="Job Listings"
                  fill="#ea580c"
                  radius={[5, 5, 0, 0]}
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        <ChartCard
          title="Companies with Most Listings"
          subtitle="Top 10 companies ranked by number of job records"
        >
          {companies.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={companies}
                layout="vertical"
                margin={{ left: 15, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="company"
                  width={125}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip />
                <Bar
                  dataKey="total_jobs"
                  name="Job Listings"
                  fill="#db2777"
                  radius={[0, 5, 5, 0]}
                  barSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

      </div>

      <p className="rounded-lg bg-amber-50 p-4 text-xs leading-5 text-amber-800">
        Data note: These analytics describe the downloaded dataset, not
        necessarily current vacancies or the entire Indian job market.
        Salary analysis uses INR listings with both minimum and maximum
        salary values available. Historical posting labels are retained
        as provided by the source.
      </p>

    </section>
  );
}

export default RealAnalytics;
