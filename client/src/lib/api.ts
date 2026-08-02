// Created this file at client/src/lib/api.ts to handle fetching data from my Express backend:

import { PortfolioData } from "@/types/cms";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export async function fetchPublicPortfolio(): Promise<PortfolioData> {
  const response = await fetch(`${API_BASE_URL}/public/portfolio`, {
    next: { revalidate: 60 }, // Cache on Next.js server for 60 seconds
  });

  if (!response.ok) {
    throw new Error("Failed to fetch portfolio data from Express server");
  }

  return response.json();
}
