
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import {
  IndianRupee,
  BriefcaseBusiness,
  TrendingUp,
  RefreshCw,
  ChartNoAxesCombined,
  GraduationCap,
} from "lucide-react";

import {
  getSalaryOverview,
  getSalaryDistribution,
  getSalaryByRole,
  getSalaryByCity,
  getSalaryPercentiles,
  getSalaryByExperience,
} from "./api";

const formatINR = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatLPA = (value) =>
  `₹${(Number(value || 0) / 100000).toFixed(1)} LPA`;

const formatNumber = (value) =>
  new Intl.NumberFormat("en-IN").format(value || 0);

function MetricCard({ title, value, subtitle, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
          <Icon size={20} />
        </div>
      </div>
      <p className="mt-4 text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

export default function SalaryAnalytics() {
  const [overview, setOverview] = useState(null);
  const [distribution, setDistribution] = useState([]);
  const [roles, setRoles] = useState([]);
  const [cities, setCities] = useState([]);
  const [percentiles, setPercentiles] = useState(null);
  const [experience, setExperience] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSalaryData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        overviewRes,
        distributionRes,
        rolesRes,
        citiesRes,
        percentilesRes,
        experienceRes,
      ] = await Promise.all([
        getSalaryOverview(),
        getSalaryDistribution(),
        getSalaryByRole(),
        getSalaryByCity(),
        getSalaryPercentiles(),
        getSalaryByExperience(),
      ]);

      setOverview(overviewRes.data);
      setDistribution(distributionRes.data);
      setRoles(rolesRes.data);
      setCities(citiesRes.data);
      setPercentiles(percentilesRes.data);
      setExperience(experienceRes.data);
    } catch (err) {
      console.error("Salary analytics error:", err);
      setError(
        "Unable to load salary analytics. Check the backend and salary APIs."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaryData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center text-slate-500">
        <RefreshCw className="mr-2 animate-spin" size={18} />
        Loading salary analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="font-semibold text-red-700">{error}</p>
        <button
          onClick={fetchSalaryData}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const salaryCards = [
    {
      title: "Average Salary",
      value: formatLPA(overview?.average_salary),
      subtitle: "Average midpoint of disclosed salaries",
      icon: IndianRupee,
    },
    {
      title: "Salary Disclosed",
      value: formatNumber(overview?.disclosed_salary_jobs),
      subtitle: "INR listings with both salary bounds",
      icon: BriefcaseBusiness,
    },
    {
      title: "Minimum Salary",
      value: formatINR(overview?.minimum_salary),
      subtitle: "Lowest positive salary lower bound",
      icon: TrendingUp,
    },
    {
      title: "Maximum Salary",
      value: formatINR(overview?.maximum_salary),
      subtitle: "Highest positive salary upper bound",
      icon: IndianRupee,
    },
  ];

  const percentileCards = [
    {
      label: "P25",
      value: percentiles?.p25_salary,
      description: "25th percentile",
    },
    {
      label: "P50",
      value: percentiles?.median_salary,
      description: "Median salary",
    },
    {
      label: "P75",
      value: percentiles?.p75_salary,
      description: "75th percentile",
    },
  ];

  return (
    <div className="mt-10 space-y-6" id="salary-analytics">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Compensation intelligence
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">
            Salary Analytics
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Explore salary distribution, percentiles, role-based pay and city comparisons.
          </p>
        </div>

        <button
          onClick={fetchSalaryData}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {salaryCards.map((card) => (
          <MetricCard key={card.title} {...card} />
        ))}
      </div>

      {/* Salary Percentiles */}
      <ChartCard
        title="Salary Percentiles"
        subtitle="Distribution of disclosed INR salary midpoints"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {percentileCards.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-slate-200 bg-slate-50 p-5"
            >
              <p className="text-sm font-semibold text-blue-600">
                {item.label}
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {formatLPA(item.value)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {item.description}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-500">
          P50 represents the median: half of the disclosed salary midpoints
          are at or below this value.
        </p>
      </ChartCard>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard
          title="Salary Distribution"
          subtitle="Number of disclosed INR listings in each annual salary bracket"
        >
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={distribution} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="salary_range" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => [formatNumber(value), "Job listings"]} />
              <Bar dataKey="job_count" name="Job listings" radius={[6, 6, 0, 0]}>
                {distribution.map((entry, index) => (
                  <Cell key={`${entry.salary_range}-${index}`} fill="#3B82F6" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="City-wise Salary Comparison"
          subtitle="Average salary midpoint for INR jobs mentioning each city"
        >
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={cities}
              layout="vertical"
              margin={{ top: 5, right: 25, left: 15, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`}
                tick={{ fontSize: 11 }}
              />
              <YAxis type="category" dataKey="city" width={90} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => [formatLPA(value), "Average salary"]} />
              <Bar
                dataKey="average_salary"
                name="Average salary"
                fill="#0D9488"
                radius={[0, 6, 6, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Experience-wise Salary */}
        <div className="xl:col-span-2">
          <ChartCard
            title="Salary by Experience"
            subtitle="Average disclosed salary midpoint across experience bands"
          >
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={experience}
                margin={{ top: 10, right: 20, left: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="experience_range" tick={{ fontSize: 12 }} />
                <YAxis
                  tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value, name) => [
                    name === "average_salary"
                      ? formatLPA(value)
                      : formatNumber(value),
                    name === "average_salary" ? "Average salary" : "Job listings",
                  ]}
                />
                <Bar
                  dataKey="average_salary"
                  name="average_salary"
                  fill="#D97706"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[450px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-3">Experience</th>
                    <th className="px-3 py-3">Listings</th>
                    <th className="px-3 py-3">Average Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {experience.map((item) => (
                    <tr key={item.experience_range} className="border-b border-slate-100">
                      <td className="px-3 py-3 font-medium text-slate-800">
                        {item.experience_range}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {formatNumber(item.job_count)}
                      </td>
                      <td className="px-3 py-3 font-semibold text-slate-800">
                        {formatLPA(item.average_salary)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
        </div>

        {/* Highest Paying Roles */}
        <div className="xl:col-span-2">
          <ChartCard
            title="Highest-Paying Job Roles"
            subtitle="Roles ranked by average disclosed salary midpoint; only roles with at least five listings"
          >
            <ResponsiveContainer width="100%" height={380}>
              <BarChart
                data={roles}
                layout="vertical"
                margin={{ top: 5, right: 35, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`}
                  tick={{ fontSize: 11 }}
                />
                <YAxis type="category" dataKey="role" width={160} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => [formatLPA(value), "Average salary"]} />
                <Bar
                  dataKey="average_salary"
                  name="Average salary"
                  fill="#7C3AED"
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-3">Job Role</th>
                    <th className="px-3 py-3">Listings</th>
                    <th className="px-3 py-3">Average</th>
                    <th className="px-3 py-3">Minimum</th>
                    <th className="px-3 py-3">Maximum</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => (
                    <tr key={role.role} className="border-b border-slate-100">
                      <td className="px-3 py-3 font-medium text-slate-800">{role.role}</td>
                      <td className="px-3 py-3 text-slate-600">{formatNumber(role.job_count)}</td>
                      <td className="px-3 py-3 font-semibold text-slate-800">{formatLPA(role.average_salary)}</td>
                      <td className="px-3 py-3 text-slate-600">{formatINR(role.minimum_salary)}</td>
                      <td className="px-3 py-3 text-slate-600">{formatINR(role.maximum_salary)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-semibold">How to interpret these figures</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-800">
          <li>Salary analytics include INR listings with both salary bounds greater than zero.</li>
          <li>Salary values are calculated from each listing's minimum–maximum midpoint.</li>
          <li>Percentiles use the nearest-rank method.</li>
          <li>City counts can overlap because one listing may mention multiple cities.</li>
          <li>Experience bands are assigned using each listing's maximum experience.</li>
          <li>Extreme salary values can influence averages and maximums.</li>
          <li>These figures describe this dataset, not guaranteed current market offers.</li>
        </ul>
      </div>
    </div>
  );
}
