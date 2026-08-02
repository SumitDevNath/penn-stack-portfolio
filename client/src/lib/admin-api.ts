const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_jwt_token");
}

export async function loginAdmin(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Invalid email or password");
  }

  return res.json();
}

export async function updateProfile(data: {
  headline: string;
  aboutMe: string;
  location: string;
}) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/admin/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to update profile");
  return res.json();
}

export async function addSkill(data: { name: string; categoryId: string }) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/admin/skills`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to add skill");
  return res.json();
}

export async function addEmployment(data: {
  role: string;
  organization: string;
  duration: string;
  responsibilities: string[];
}) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/admin/employment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to add employment record");
  return res.json();
}
