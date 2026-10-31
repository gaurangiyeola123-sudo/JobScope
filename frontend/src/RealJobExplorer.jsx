
import { useEffect, useState } from "react";
import {
  Search,
  MapPin,
  BriefcaseBusiness,
  Wallet,
  ChevronLeft,
  ChevronRight,
  X,
  SlidersHorizontal,
  LoaderCircle,
  Building2,
  CalendarDays,
  Star,
} from "lucide-react";

import {
  getRealJobs,
  getRealJobDetails,
  getRealLocations,
} from "./api";

const LIMIT = 10;

function formatSalary(min, max, currency) {
  if (min == null && max == null) return "Not disclosed";

  const symbol = currency === "USD" ? "$" : "₹";

  const format = (value) =>
    value == null
      ? null
      : `${symbol}${Number(value).toLocaleString("en-IN")}`;

  if (min != null && max != null) {
    return `${format(min)} – ${format(max)}`;
  }

  return min != null
    ? `${format(min)} onwards`
    : `Up to ${format(max)}`;
}

function formatExperience(job) {
  if (job.experience) return job.experience;

  if (job.min_experience != null && job.max_experience != null) {
    return `${job.min_experience}–${job.max_experience} years`;
  }

  if (job.min_experience != null) {
    return `${job.min_experience}+ years`;
  }

  return "Not specified";
}

function JobDetailsModal({ job, onClose }) {
  if (!job) return null;

  const skills = job.skills
    ? job.skills.split(";").map((skill) => skill.trim()).filter(Boolean)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b bg-white p-5">
          <h2 className="text-xl font-bold text-slate-900">Job Details</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">
              {job.title}
            </h3>
            <p className="mt-2 flex items-center gap-2 text-slate-600">
              <Building2 size={17} />
              {job.company || "Unknown company"}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Location</p>
              <p className="mt-1 font-semibold text-slate-800">
                {job.location || "Not specified"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Experience</p>
              <p className="mt-1 font-semibold text-slate-800">
                {formatExperience(job)}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Salary</p>
              <p className="mt-1 font-semibold text-slate-800">
                {formatSalary(job.min_salary, job.max_salary, job.currency)}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Posted</p>
              <p className="mt-1 font-semibold text-slate-800">
                {job.job_uploaded || "Not available"}
              </p>
            </div>
          </div>

          {skills.length > 0 && (
            <section>
              <h4 className="mb-3 font-bold text-slate-900">
                Required Skills
              </h4>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <span
                    key={`${skill}-${index}`}
                    className="rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section>
            <h4 className="mb-3 font-bold text-slate-900">
              Job Description
            </h4>
            <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
              {job.job_description || "No job description available."}
            </p>
          </section>

          {(job.aggregate_rating != null || job.reviews_count != null) && (
            <div className="flex flex-wrap gap-5 border-t pt-4 text-sm text-slate-600">
              {job.aggregate_rating != null && (
                <span className="flex items-center gap-2">
                  <Star size={16} className="text-amber-500" />
                  Rating: {job.aggregate_rating}
                </span>
              )}
              {job.reviews_count != null && (
                <span>
                  Reviews: {Number(job.reviews_count).toLocaleString("en-IN")}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RealJobExplorer() {
  const [jobs, setJobs] = useState([]);
  const [locations, setLocations] = useState([]);

  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [minExperience, setMinExperience] = useState("");
  const [maxExperience, setMaxExperience] = useState("");
  const [minSalary, setMinSalary] = useState("");
  const [maxSalary, setMaxSalary] = useState("");

  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    getRealLocations(200)
      .then((response) => {
        setLocations(response.data || []);
      })
      .catch((err) => {
        console.error("Could not load locations:", err);
      });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchJobs() {
      setLoading(true);
      setError("");

      try {
        const response = await getRealJobs({
          ...filters,
          page,
          limit: LIMIT,
        });

        if (cancelled) return;

        setJobs(response.data.jobs || []);
        setTotal(response.data.total || 0);
        setTotalPages(response.data.total_pages || 0);
      } catch (err) {
        if (cancelled) return;

        console.error("Job Explorer error:", err);
        setError(
          err.response?.data?.detail ||
            "Unable to load job listings. Check whether the backend is running."
        );
        setJobs([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchJobs();

    return () => {
      cancelled = true;
    };
  }, [filters, page]);

  function handleSearch(event) {
    event.preventDefault();

    const newFilters = {};

    if (search.trim()) newFilters.search = search.trim();
    if (location) newFilters.location = location;

    if (minExperience !== "") {
      newFilters.min_experience = Number(minExperience);
    }

    if (maxExperience !== "") {
      newFilters.max_experience = Number(maxExperience);
    }

    if (minSalary !== "") {
      newFilters.min_salary = Number(minSalary);
    }

    if (maxSalary !== "") {
      newFilters.max_salary = Number(maxSalary);
    }

    setPage(1);
    setFilters(newFilters);
  }

  function clearFilters() {
    setSearch("");
    setLocation("");
    setMinExperience("");
    setMaxExperience("");
    setMinSalary("");
    setMaxSalary("");
    setPage(1);
    setFilters({});
  }

  async function openJobDetails(jobId) {
    setDetailsLoading(true);

    try {
      const response = await getRealJobDetails(jobId);
      setSelectedJob(response.data);
    } catch (err) {
      console.error("Job details error:", err);
      setError("Unable to load job details. Please try again.");
    } finally {
      setDetailsLoading(false);
    }
  }

  return (
    <section className="my-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
            Explore the dataset
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">
            Real Job Explorer
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Search and filter job listings from the Indian job market dataset.
          </p>
        </div>

        <div className="rounded-xl bg-indigo-50 px-4 py-3">
          <p className="text-xs font-medium text-indigo-600">Matching listings</p>
          <p className="text-2xl font-bold text-indigo-900">
            {total.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSearch}
        className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="flex items-center gap-2 font-semibold text-slate-800">
          <SlidersHorizontal size={18} />
          Search and Filters
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Job title or company
            </label>
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="e.g. Data Engineer, Google..."
                className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Location
            </label>
            <div className="relative">
              <MapPin
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">All locations</option>
                {locations.map((item) => (
                  <option key={item.location} value={item.location}>
                    {item.location}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Minimum experience (years)
            </label>
            <input
              type="number"
              min="0"
              value={minExperience}
              onChange={(event) => setMinExperience(event.target.value)}
              placeholder="e.g. 0"
              className="w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Maximum experience (years)
            </label>
            <input
              type="number"
              min="0"
              value={maxExperience}
              onChange={(event) => setMaxExperience(event.target.value)}
              placeholder="e.g. 5"
              className="w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Minimum salary (₹)
            </label>
            <input
              type="number"
              min="0"
              value={minSalary}
              onChange={(event) => setMinSalary(event.target.value)}
              placeholder="e.g. 300000"
              className="w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Maximum salary (₹)
            </label>
            <input
              type="number"
              min="0"
              value={maxSalary}
              onChange={(event) => setMaxSalary(event.target.value)}
              placeholder="e.g. 1000000"
              className="w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
          >
            <Search size={17} />
            Apply Filters
          </button>

          <button
            type="button"
            onClick={clearFilters}
            className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Clear Filters
          </button>
        </div>
      </form>

      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-900">
          Job Listings
        </h3>
        <span className="text-sm text-slate-500">
          Page {page} of {Math.max(totalPages, 1)}
        </span>
      </div>

      {loading ? (
        <div className="flex min-h-48 items-center justify-center gap-3 rounded-2xl border bg-white text-slate-500">
          <LoaderCircle className="animate-spin" size={22} />
          Loading job listings...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
          {error}
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-2xl border bg-white p-10 text-center">
          <BriefcaseBusiness className="mx-auto mb-3 text-slate-400" size={32} />
          <h3 className="font-semibold text-slate-800">No jobs found</h3>
          <p className="mt-1 text-sm text-slate-500">
            Try changing your search or clearing some filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {jobs.map((job) => (
            <article
              key={job.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {job.title}
                  </h3>
                  <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                    <Building2 size={15} />
                    {job.company || "Unknown company"}
                  </p>
                </div>

                <span className="shrink-0 rounded-lg bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  {job.currency || "Salary N/A"}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 text-sm text-slate-600 sm:grid-cols-2">
                <p className="flex items-center gap-2">
                  <MapPin size={16} className="text-slate-400" />
                  {job.location || "Location not specified"}
                </p>

                <p className="flex items-center gap-2">
                  <BriefcaseBusiness size={16} className="text-slate-400" />
                  {formatExperience(job)}
                </p>

                <p className="flex items-center gap-2 sm:col-span-2">
                  <Wallet size={16} className="text-slate-400" />
                  {formatSalary(job.min_salary, job.max_salary, job.currency)}
                </p>
              </div>

              {job.skills && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {job.skills
                    .split(";")
                    .slice(0, 5)
                    .map((skill, index) => (
                      <span
                        key={`${skill}-${index}`}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600"
                      >
                        {skill.trim()}
                      </span>
                    ))}
                </div>
              )}

              <div className="mt-5 flex items-center justify-between border-t pt-4">
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <CalendarDays size={14} />
                  {job.job_uploaded || "Posting date unavailable"}
                </span>

                <button
                  onClick={() => openJobDetails(job.id)}
                  disabled={detailsLoading}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                >
                  View Details
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-3">
          <button
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1}
            className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={17} />
            Previous
          </button>

          <span className="text-sm font-medium text-slate-600">
            {page} / {totalPages}
          </span>

          <button
            onClick={() =>
              setPage((current) => Math.min(totalPages, current + 1))
            }
            disabled={page >= totalPages}
            className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <ChevronRight size={17} />
          </button>
        </div>
      )}

      {detailsLoading && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
          <div className="flex items-center gap-3 rounded-xl bg-white px-6 py-4 shadow-xl">
            <LoaderCircle className="animate-spin text-indigo-600" />
            <span className="text-sm font-medium text-slate-700">
              Loading job details...
            </span>
          </div>
        </div>
      )}

      {selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      )}
    </section>
  );
}
