
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Sparkles, BrainCircuit, GraduationCap, Target, Loader2, RotateCcw } from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api/ai/career-advisor";

const initialForm = {
  education: "",
  skills: "",
  interests: "",
  preferred_domain: "Data Engineering",
  experience_level: "Beginner",
};

export default function CareerAdvisor() {
  const [form, setForm] = useState(initialForm);
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setAnalysis("");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Unable to generate career analysis. Please check your inputs."
        );
      }

      setAnalysis(data.career_analysis);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm(initialForm);
    setAnalysis("");
    setError("");
  };

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-gradient-to-r from-indigo-700 to-violet-700 p-7 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-3">
          <div className="rounded-xl bg-white/15 p-3">
            <BrainCircuit size={28} />
          </div>
          <span className="text-sm font-semibold uppercase tracking-wider text-indigo-100">
            Powered by Google Gemini
          </span>
        </div>

        <h1 className="text-3xl font-bold">AI Career Advisor</h1>
        <p className="mt-2 max-w-2xl text-indigo-100">
          Discover suitable technology careers, identify your skill gaps,
          and generate a personalized learning roadmap based on your profile.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-7 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
              <GraduationCap size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Your Candidate Profile
              </h2>
              <p className="text-sm text-slate-500">
                Enter your current education and skills.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Education
              </label>
              <input
                name="education"
                value={form.education}
                onChange={handleChange}
                placeholder="e.g. Second-year Computer Engineering student"
                required
                minLength={2}
                maxLength={200}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Current Skills
              </label>
              <textarea
                name="skills"
                value={form.skills}
                onChange={handleChange}
                placeholder="e.g. Python, SQL, Pandas, Excel, DSA"
                required
                minLength={1}
                maxLength={1000}
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Career Interests
              </label>
              <textarea
                name="interests"
                value={form.interests}
                onChange={handleChange}
                placeholder="e.g. Data Engineering, AI/ML, Analytics"
                required
                minLength={2}
                maxLength={1000}
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Preferred Career Domain
              </label>
              <select
                name="preferred_domain"
                value={form.preferred_domain}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
              >
                <option>Data Engineering</option>
                <option>Data Analytics</option>
                <option>Artificial Intelligence</option>
                <option>Machine Learning</option>
                <option>Software Engineering</option>
                <option>Cybersecurity</option>
                <option>Cloud Computing</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Experience Level
              </label>
              <select
                name="experience_level"
                value={form.experience_level}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={19} className="animate-spin" />
                    Generating Analysis...
                  </>
                ) : (
                  <>
                    <Sparkles size={19} />
                    Generate Career Analysis
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <RotateCcw size={17} />
                Reset
              </button>
            </div>
          </form>
        </section>

        <section className="min-h-[500px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
              <Target size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Career Analysis
              </h2>
              <p className="text-sm text-slate-500">
                Your personalized AI-generated report.
              </p>
            </div>
          </div>

          {!analysis && !loading && (
            <div className="flex min-h-[390px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 p-8 text-center">
              <div className="mb-4 rounded-full bg-indigo-50 p-5 text-indigo-500">
                <Sparkles size={32} />
              </div>
              <h3 className="font-semibold text-slate-700">
                Your career insights will appear here
              </h3>
              <p className="mt-2 max-w-sm text-sm text-slate-500">
                Complete your profile and generate an analysis to receive
                career recommendations and a personalized learning roadmap.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex min-h-[390px] flex-col items-center justify-center text-center">
              <Loader2 size={42} className="animate-spin text-indigo-600" />
              <h3 className="mt-5 font-semibold text-slate-700">
                Analyzing your career profile...
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Gemini is preparing your personalized report.
              </p>
            </div>
          )}

          {analysis && (
            <div className="max-h-[750px] overflow-y-auto rounded-xl bg-slate-50 p-5">
              <div className="prose prose-slate max-w-none prose-headings:text-slate-800 prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:leading-7 prose-li:my-1">
                <ReactMarkdown>{analysis}</ReactMarkdown>
              </div>
              <p className="mt-6 border-t border-slate-200 pt-4 text-xs text-slate-500">
                AI-generated career guidance. Verify important career,
                educational and industry information independently.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
