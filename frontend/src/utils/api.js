/**
 * API UTILITIES
 * Centralized API calls for authentication and project management
 * Features: User auth, project CRUD, error handling
 */
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const registerUser = async (name, email, password) => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  return res.json();
};

export const loginUser = async (email, password) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
};

export const fetchProfile = async (token) => {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};


// PROJECT APIs
export async function fetchProjects(token) {
const res = await fetch(`${API_URL}/projects`, {
    headers: { Authorization: `Bearer ${token}` },
});
return res.json();
}

export async function createProject(token, project) {
const res = await fetch(`${API_URL}/projects`, {
    method: "POST",
    headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(project),
});
return res.json();
}
  