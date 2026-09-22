export const STAGES = ["서류검토", "면접", "처우협의", "최종합격", "불합격"] as const;

export type Stage = (typeof STAGES)[number];

export const ROLES = [
  "프론트엔드",
  "백엔드",
  "안드로이드",
  "iOS",
  "데이터 엔지니어",
  "QA",
  "프로덕트 디자이너",
  "PM",
] as const;

export type Role = (typeof ROLES)[number];

export interface Applicant {
  id: string;
  name: string;
  role: Role;
  /** YYYY-MM-DD */
  appliedAt: string;
  stage: Stage;
  email: string;
  phone: string;
  experienceYears: number;
  source: string;
  summary: string;
}
