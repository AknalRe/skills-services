import type { AdminSummary, Category, PublicStats, Skill, SkillFile, User } from "../types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!res.ok) {
    let message = `Permintaan gagal (kode ${res.status}).`;
    try {
      const data = (await res.json()) as { error?: string };
      if (data?.error) message = data.error;
    } catch {
      // Keep default status message when body is not JSON
    }
    throw new Error(message);
  }

  return (await res.json()) as T;
}

export const api = {
  // Auth
  me: () => request<{ user: User | null }>("/api/auth/me"),
  login: (email: string, password: string) =>
    request<{ user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),

  // Categories
  listCategories: () => request<{ categories: Category[] }>("/api/categories"),
  createCategory: (payload: { name: string; slug?: string; description?: string; sort_order?: number }) =>
    request<{ category: Category }>("/api/admin/categories", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateCategory: (id: number, payload: { name?: string; slug?: string; description?: string; sort_order?: number }) =>
    request<{ category: Category }>(`/api/admin/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteCategory: (id: number) =>
    request<{ ok: boolean }>(`/api/admin/categories/${id}`, { method: "DELETE" }),

  // Public skills
  listPublicSkills: (params?: { q?: string; category?: string; agent?: string; sort?: string }) => {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.category) query.set("category", params.category);
    if (params?.agent) query.set("agent", params.agent);
    if (params?.sort) query.set("sort", params.sort);
    const qs = query.toString();
    return request<{ skills: Skill[]; stats: PublicStats }>(`/api/skills${qs ? `?${qs}` : ""}`);
  },
  getPublicSkill: (slug: string) =>
    request<{ skill: Skill; files: SkillFile[] }>(`/api/skills/${encodeURIComponent(slug)}`),

  // Admin skills
  listAdminSkills: (params?: { q?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.status) query.set("status", params.status);
    const qs = query.toString();
    return request<{ skills: Skill[]; summary: AdminSummary }>(`/api/admin/skills${qs ? `?${qs}` : ""}`);
  },
  getAdminSkill: (id: number) => request<{ skill: Skill; files: SkillFile[] }>(`/api/admin/skills/${id}`),
  createSkill: (payload: Partial<Skill>) =>
    request<{ skill: Skill }>("/api/admin/skills", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateSkill: (id: number, payload: Partial<Skill>) =>
    request<{ skill: Skill }>(`/api/admin/skills/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteSkill: (id: number) =>
    request<{ ok: boolean }>(`/api/admin/skills/${id}`, { method: "DELETE" }),

  // Supporting files
  upsertSkillFile: (
    skillId: number,
    payload: { relative_path: string; mime_type: string; is_binary: boolean; content: string }
  ) =>
    request<{ files: SkillFile[] }>(`/api/admin/skills/${skillId}/files`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  deleteSkillFile: (skillId: number, fileId: number) =>
    request<{ ok: boolean }>(`/api/admin/skills/${skillId}/files/${fileId}`, {
      method: "DELETE",
    }),
};
