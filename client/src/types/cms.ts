// Created this file at client/src/types/cms.ts so TypeScript knows the exact shape of my Express API response:

export interface Profile {
  id: number;
  headline: string;
  aboutMe: string;
  avatarUrl: string | null;
  location: string;
}

export interface Skill {
  id: string;
  name: string;
  categoryId: string;
}

export interface SkillCategory {
  id: string;
  name: string;
  order: number;
  skills: Skill[];
}

export interface Employment {
  id: string;
  role: string;
  organization: string;
  duration: string;
  responsibilities: string[];
  order: number;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string | null;
  liveUrl: string | null;
  githubUrl: string | null;
  tags: string[];
  isFeatured: boolean;
  isPublished: boolean;
  order: number;
}

export interface Education {
  id: string;
  degree: string;
  institute: string;
  duration: string;
  order: number;
}

export interface Certification {
  id: string;
  name: string;
  institute: string;
  duration: string;
  description: string;
  credentialUrl: string | null;
  order: number;
}

export interface Resume {
  id: string;
  versionName: string;
  fileUrl: string;
  isActive: boolean;
}

export interface SeoSetting {
  id: number;
  metaTitle: string;
  metaDesc: string;
  ogImageUrl: string | null;
  keywords: string[];
}

export interface SiteSetting {
  id: number;
  siteName: string;
  maintenanceMode: boolean;
  githubUrl: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
}

export interface PortfolioData {
  profile: Profile | null;
  skills: SkillCategory[];
  employment: Employment[];
  projects: Project[];
  education: Education[];
  certifications: Certification[];
  resume: Resume | null;
  seo: SeoSetting | null;
  siteSettings: SiteSetting | null;
}
