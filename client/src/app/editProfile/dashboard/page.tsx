"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { fetchPublicPortfolio } from "@/lib/api";
import {
  getAuthToken,
  updateProfile,
  addSkill,
  addEmployment,
} from "@/lib/admin-api";

interface ProfileFormValues {
  headline: string;
  aboutMe: string;
  location: string;
}

interface SkillFormValues {
  name: string;
  categoryId: string;
}

interface JobFormValues {
  role: string;
  organization: string;
  duration: string;
  responsibilitiesText: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"profile" | "skills" | "jobs">(
    "profile",
  );
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 1. Guard check: Redirect if no JWT token
  useEffect(() => {
    if (!getAuthToken()) {
      router.push("/editProfile");
    }
  }, [router]);

  // 2. Fetch existing data for category dropdowns and current profile
  const { data, isLoading } = useQuery({
    queryKey: ["publicPortfolio"],
    queryFn: fetchPublicPortfolio,
  });

  // 3. Profile Form - using "values" so it populates when API data loads
  const { register: regProfile, handleSubmit: handleProfile } =
    useForm<ProfileFormValues>({
      values: {
        headline: data?.profile?.headline || "",
        aboutMe: data?.profile?.aboutMe || "",
        location: data?.profile?.location || "Dhaka, Bangladesh",
      },
    });

  // 4. Skill Form
  const {
    register: regSkill,
    handleSubmit: handleSkill,
    reset: resetSkill,
  } = useForm<SkillFormValues>({
    defaultValues: { name: "", categoryId: "" },
  });

  // 5. Job Form
  const {
    register: regJob,
    handleSubmit: handleJob,
    reset: resetJob,
  } = useForm<JobFormValues>({
    defaultValues: {
      role: "",
      organization: "",
      duration: "",
      responsibilitiesText: "",
    },
  });

  // 6. TanStack Query Mutations
  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publicPortfolio"] });
      showNotice("About Me profile updated successfully!");
    },
  });

  const skillMutation = useMutation({
    mutationFn: addSkill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publicPortfolio"] });
      resetSkill();
      showNotice("New skill added to database!");
    },
  });

  const jobMutation = useMutation({
    mutationFn: (vals: JobFormValues) =>
      addEmployment({
        role: vals.role,
        organization: vals.organization,
        duration: vals.duration,
        responsibilities: vals.responsibilitiesText
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publicPortfolio"] });
      resetJob();
      showNotice("New employment role added successfully!");
    },
  });

  const showNotice = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const logout = () => {
    localStorage.removeItem("admin_jwt_token");
    router.push("/editProfile");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-slate-400 font-medium">
          Loading Dashboard Data...
        </div>
      </div>
    );
  }

  const skillsList = Array.isArray(data?.skills) ? data.skills : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-slate-900/50 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-lg font-bold text-white">
            Headless CMS Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-400 hover:underline"
            >
              View Live Website ↗
            </a>
            <button
              onClick={logout}
              className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        {successMsg && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400 font-medium">
            ✅ {successMsg}
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab("profile")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === "profile"
                ? "bg-emerald-500 text-slate-950"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            1. Edit About Me
          </button>
          <button
            onClick={() => setActiveTab("skills")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === "skills"
                ? "bg-emerald-500 text-slate-950"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            2. Add New Skills
          </button>
          <button
            onClick={() => setActiveTab("jobs")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === "jobs"
                ? "bg-emerald-500 text-slate-950"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            3. Add Employment Role
          </button>
        </div>

        {/* TAB 1: EDIT ABOUT ME */}
        {activeTab === "profile" && (
          <form
            onSubmit={handleProfile((vals) => profileMutation.mutate(vals))}
            className="space-y-6 rounded-xl border border-slate-800 bg-slate-900/40 p-6"
          >
            <h2 className="text-lg font-bold text-white">Profile & About Me</h2>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">
                Headline
              </label>
              <input
                {...regProfile("headline")}
                placeholder="Full-Stack Software Engineer"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">
                Location
              </label>
              <input
                {...regProfile("location")}
                placeholder="Dhaka, Bangladesh"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">
                About Me Bio
              </label>
              <textarea
                rows={6}
                {...regProfile("aboutMe")}
                placeholder="Write your professional bio..."
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={profileMutation.isPending}
              className="rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
            >
              {profileMutation.isPending ? "Saving..." : "Save Profile Changes"}
            </button>
          </form>
        )}

        {/* TAB 2: ADD NEW SKILL */}
        {activeTab === "skills" && (
          <form
            onSubmit={handleSkill((vals) => skillMutation.mutate(vals))}
            className="space-y-6 rounded-xl border border-slate-800 bg-slate-900/40 p-6"
          >
            <h2 className="text-lg font-bold text-white">Insert New Skill</h2>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">
                Select Skill Category Type
              </label>
              <select
                {...regSkill("categoryId", { required: true })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="">
                  -- Choose Category (e.g., Frontend, Backend) --
                </option>
                {skillsList.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">
                Skill Name
              </label>
              <input
                {...regSkill("name", { required: true })}
                placeholder="e.g., GraphQL, Redis, NextAuth.js"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={skillMutation.isPending}
              className="rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
            >
              {skillMutation.isPending
                ? "Adding Skill..."
                : "Add Skill to Database"}
            </button>
          </form>
        )}

        {/* TAB 3: ADD EMPLOYMENT ROLE */}
        {activeTab === "jobs" && (
          <form
            onSubmit={handleJob((vals) => jobMutation.mutate(vals))}
            className="space-y-6 rounded-xl border border-slate-800 bg-slate-900/40 p-6"
          >
            <h2 className="text-lg font-bold text-white">
              Add New Employment Role
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">
                  Job Role
                </label>
                <input
                  {...regJob("role", { required: true })}
                  placeholder="e.g., Senior Full-Stack Engineer"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">
                  Organization / Company
                </label>
                <input
                  {...regJob("organization", { required: true })}
                  placeholder="e.g., Bay Institute of Renaissance Limited"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">
                Duration
              </label>
              <input
                {...regJob("duration", { required: true })}
                placeholder="e.g., Aug 2026 - Present"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">
                Responsibilities (1 bullet point per line)
              </label>
              <textarea
                rows={5}
                {...regJob("responsibilitiesText")}
                placeholder="Built scalable APIs using Node.js...&#10;Integrated real-time sockets...&#10;Optimized database queries..."
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={jobMutation.isPending}
              className="rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
            >
              {jobMutation.isPending ? "Adding Role..." : "Save New Job Role"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
