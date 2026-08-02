"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPublicPortfolio } from "@/lib/api";

export default function HomePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["publicPortfolio"],
    queryFn: fetchPublicPortfolio,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-lg font-medium text-slate-400">
          Loading Portfolio Data from Express...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center space-y-2">
          <p className="text-red-400 font-semibold">
            Failed to connect to backend on localhost:5000.
          </p>
          <p className="text-xs text-slate-500">
            Make sure your Express server is running in the /server folder.
          </p>
        </div>
      </div>
    );
  }

  // Safe destructuring with default empty arrays to prevent .map() errors
  const {
    profile = null,
    skills = [],
    employment = [],
    projects = [],
    resume = null,
  } = data;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-16 space-y-24">
        {/* 1. HERO & ABOUT ME */}
        <section className="space-y-6">
          <div className="inline-block rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
            {profile?.location || "Dhaka, Bangladesh"}
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl text-white">
            {profile?.headline || "Full-Stack Software Engineer"}
          </h1>
          <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
            {profile?.aboutMe || "No bio available yet."}
          </p>
          {resume?.fileUrl && (
            <div className="pt-4">
              <a
                href={resume.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
              >
                Download Active Resume
              </a>
            </div>
          )}
        </section>

        {/* 2. EMPLOYMENT HISTORY */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold tracking-tight text-white border-b border-slate-800 pb-4">
            Employment History
          </h2>
          {employment.length === 0 ? (
            <p className="text-sm text-slate-500">
              No employment records found.
            </p>
          ) : (
            <div className="space-y-10">
              {employment.map((job) => (
                <div
                  key={job.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <h3 className="text-xl font-semibold text-white">
                      {job.role}
                    </h3>
                    <span className="text-sm font-medium text-emerald-400">
                      {job.duration}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-400">
                    {job.organization}
                  </p>
                  {Array.isArray(job.responsibilities) &&
                    job.responsibilities.length > 0 && (
                      <ul className="list-disc list-inside space-y-2 text-slate-300 text-sm">
                        {job.responsibilities.map((resp, i) => (
                          <li key={i}>{resp}</li>
                        ))}
                      </ul>
                    )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 3. SKILLS TAXONOMY */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold tracking-tight text-white border-b border-slate-800 pb-4">
            Technical Skills
          </h2>
          {skills.length === 0 ? (
            <p className="text-sm text-slate-500">
              No skills categories found.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {skills.map((category) => (
                <div
                  key={category.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4"
                >
                  <h3 className="font-semibold text-emerald-400">
                    {category.name}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(category.skills) &&
                      category.skills.map((skill) => (
                        <span
                          key={skill.id}
                          className="rounded-md bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-200"
                        >
                          {skill.name}
                        </span>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 4. FEATURED PROJECTS */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold tracking-tight text-white border-b border-slate-800 pb-4">
            Featured Case Studies
          </h2>
          {projects.length === 0 ? (
            <p className="text-sm text-slate-500">No projects published yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-white">
                      {project.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-400">
                      {project.description}
                    </p>
                  </div>
                  {Array.isArray(project.tags) && project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {project.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
