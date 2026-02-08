/**
 * Backend API client for PetPulse.
 * Base URL: VITE_API_URL or VITE_API_BASE_URL (default https://api.quantara.co) + /api/v1
 * Auth: Bearer token in localStorage key "petpulse_token".
 */

const TOKEN_KEY = "petpulse_token";
const DEFAULT_API_BASE = "https://api.quantara.co";

function getBaseUrl() {
  const base = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE;
  return String(base).replace(/\/$/, "") + "/api/v1";
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * @param {string} method
 * @param {string} path - e.g. "/auth/me" (no leading slash required)
 * @param {{ body?: object; headers?: Record<string,string>; formData?: FormData }} options
 * @returns {Promise<{ data: any; ok: boolean; status: number }>}
 */
export async function request(method, path, options = {}) {
  const url = `${getBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const token = getToken();
  const headers = { ...options.headers };
  if (!headers["Content-Type"] && !options.formData) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const config = {
    method,
    headers,
    credentials: "omit",
  };
  if (options.formData) {
    config.body = options.formData;
    delete headers["Content-Type"];
  } else if (options.body != null) {
    config.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, config);
  let data = null;
  const ct = res.headers.get("content-type");
  if (ct && ct.includes("application/json")) {
    try {
      data = await res.json();
    } catch (_) {}
  } else if (res.status !== 204) {
    data = await res.text();
  }

  if (res.status === 401) {
    clearToken();
  }

  return { data, ok: res.ok, status: res.status };
}

/** Throws if !ok; returns data. */
export async function requestOk(method, path, options = {}) {
  const { data, ok, status } = await request(method, path, options);
  if (!ok) {
    const err = new Error(data?.detail || data?.message || `Request failed: ${status}`);
    err.status = status;
    err.detail = Array.isArray(data?.detail) ? data.detail : data?.detail;
    throw err;
  }
  return data;
}

// --- Auth ---
export const auth = {
  async login(email, password) {
    return requestOk("POST", "/auth/login", { body: { email, password } });
  },
  async me() {
    return requestOk("GET", "/auth/me");
  },
};

// --- Users ---
export const users = {
  async create({ name, email, password }) {
    return requestOk("POST", "/users", { body: { name, email, password } });
  },
  async updateMe(body) {
    return requestOk("PATCH", "/users/me", { body });
  },
  async getMyPets() {
    return requestOk("GET", "/users/me/pets");
  },
  async getUpcomingEvents(limit = 50) {
    return requestOk("GET", `/users/me/upcoming-events?limit=${limit}`);
  },
  async getCalendarEvents(start, end, includeActivity = true) {
    const params = new URLSearchParams({ start, end, include_activity: includeActivity });
    return requestOk("GET", `/users/me/calendar/events?${params}`);
  },
};

// --- Pets ---
export const pets = {
  async list(skip = 0, limit = 100) {
    return requestOk("GET", `/pets?skip=${skip}&limit=${limit}`);
  },
  async create(body) {
    return requestOk("POST", "/pets", { body });
  },
  async get(id) {
    return requestOk("GET", `/pets/${id}`);
  },
  async update(id, body) {
    return requestOk("PATCH", `/pets/${id}`, { body });
  },
  /** Upload profile picture for a pet. Returns { url, profile_picture_url, media_id }. */
  async uploadProfilePicture(petId, file) {
    const form = new FormData();
    form.append("file", file);
    return requestOk("POST", `/pets/${petId}/profile-picture`, { formData: form });
  },
  async getActivityStats(id, days = 7) {
    return requestOk("GET", `/pets/${id}/stats/activity?days=${days}`);
  },
  async getCalendarEvents(id, start, end, includeActivity = true) {
    const params = new URLSearchParams({ start, end, include_activity: includeActivity });
    return requestOk("GET", `/pets/${id}/calendar/events?${params}`);
  },
  // Veterinary / medical records (PDFs)
  async listMedicalRecords(petId, { visitId, skip = 0, limit = 50 } = {}) {
    const params = new URLSearchParams({ skip, limit });
    if (visitId != null) params.set("visit_id", visitId);
    return requestOk("GET", `/pets/${petId}/veterinary/medical-records?${params}`);
  },
  async uploadMedicalRecord(petId, file) {
    const form = new FormData();
    form.append("file", file);
    return requestOk("POST", `/pets/${petId}/veterinary/medical-records`, { formData: form });
  },
  /** Fetch medical record PDF as blob (for viewer). Uses auth token. */
  async getMedicalRecordFile(petId, recordId) {
    const base = getBaseUrl();
    const path = `/pets/${petId}/veterinary/medical-records/${recordId}/file`;
    const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
    const token = getToken();
    const res = await fetch(url, {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "omit",
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Request failed: ${res.status}`);
    }
    return res.blob();
  },
};

// --- Community ---
export const community = {
  async getPosts(skip = 0, limit = 50) {
    return requestOk("GET", `/community/posts?skip=${skip}&limit=${limit}`);
  },
  async getPost(id) {
    return requestOk("GET", `/community/posts/${id}`);
  },
  async createPost(body) {
    return requestOk("POST", "/community/posts", { body });
  },
  async updatePost(id, body) {
    return requestOk("PATCH", `/community/posts/${id}`, { body });
  },
  async deletePost(id) {
    return requestOk("DELETE", `/community/posts/${id}`);
  },
};

// --- Stream ---
export const stream = {
  async getUrl(channel = "speedingchimp") {
    return requestOk("GET", `/stream/url?channel=${encodeURIComponent(channel)}`);
  },
};

// --- AI (Gemini) ---
export const gemini = {
  async analyzePet(file, model = "gemini") {
    const form = new FormData();
    form.append("file", file);
    return requestOk("POST", `/gemini/analyze-pet?model=${model}`, { formData: form });
  },
  async analyzeAudio(file, model = "gemini") {
    const form = new FormData();
    form.append("file", file);
    return requestOk("POST", `/gemini/analyze-audio?model=${model}`, { formData: form });
  },
  async analyzeActivity(file, model = "gemini") {
    const form = new FormData();
    form.append("file", file);
    return requestOk("POST", `/gemini/analyze-activity?model=${model}`, { formData: form });
  },
};

export default {
  getBaseUrl,
  getToken,
  setToken,
  clearToken,
  request,
  auth,
  users,
  pets,
  community,
  stream,
  gemini,
};
