export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  description: string;
  sort_order: number;
  published_count?: number;
  total_count?: number;
}

export interface Skill {
  id: number;
  slug: string;
  name: string;
  summary: string;
  category_id: number | null;
  category_name: string | null;
  category_slug: string | null;
  version: string;
  author: string;
  tags: string[];
  compatible_agents: string[];
  skill_markdown?: string;
  status: "published" | "draft";
  featured: boolean;
  is_official: boolean;
  download_count: number;
  file_count: number;
  created_at: string;
  updated_at: string;
}

export interface SkillFile {
  id: number;
  relative_path: string;
  mime_type: string;
  is_binary: number;
  size_bytes: number;
  content: string;
  created_at?: string;
}

export interface PublicStats {
  total_published: number;
  total_downloads: number;
}

export interface AdminSummary {
  total: number;
  published: number;
  draft: number;
  downloads: number;
}
