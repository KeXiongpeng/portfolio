// web/lib/types.ts
export interface SocialLinks {
  github?: string;
  linkedin?: string;
  email?: string;
  twitter?: string;
}

export interface Skill {
  name: string;
  category: string;
}

export interface Experience {
  company: string;
  role: string;
  period: string;
  description: string;
}

export interface Education {
  school: string;
  degree: string;
  period: string;
  description: string;
}

export interface Profile {
  id: number;
  name: string;
  title: string;
  bio?: string;
  about?: string;
  avatar_url?: string;
  social_links: SocialLinks;
  skills: Skill[];
  experience: Experience[];
  education: Education[];
}

export interface Project {
  id: number;
  title: string;
  slug: string;
  description?: string;
  content?: string;
  cover_url?: string;
  tech_stack: string[];
  demo_url?: string;
  github_url?: string;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface Blog {
  id: number;
  title: string;
  slug: string;
  content: string;
  summary?: string;
  tags: string[];
  status: 'draft' | 'published';
  view_count: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BlogListResponse {
  items: Blog[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface Analytics {
  todayPv: number;
  totalPv: number;
  weekPv: number;
  monthPv: number;
  online: number;
  dailyStats: { date: string; pv: number; uv: number }[];
}
