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

/**
 * 합격 경로. 이전/다음 버튼은 이 순서를 따라 움직인다.
 * 불합격은 어느 단계에서나 갈 수 있는 분기라서 이 배열에 넣지 않는다.
 */
export const MAIN_PATH = ["서류검토", "면접", "처우협의", "최종합격"] as const;

export const REJECTED: Stage = "불합격";

export interface StageMoves {
  prev: Stage | null;
  next: Stage | null;
  /** 불합격으로 보낼 수 있는지. 이미 불합격이면 false */
  canReject: boolean;
}

/**
 * 현재 단계에서 갈 수 있는 곳을 계산한다.
 * 불합격 카드는 합격 경로 밖에 있으므로 경로의 첫 단계로 되돌리는 것만 허용한다.
 */
export function getStageMoves(stage: Stage): StageMoves {
  if (stage === REJECTED) {
    return { prev: MAIN_PATH[0], next: null, canReject: false };
  }

  const index = MAIN_PATH.indexOf(stage as (typeof MAIN_PATH)[number]);
  return {
    prev: index > 0 ? MAIN_PATH[index - 1] : null,
    next: index < MAIN_PATH.length - 1 ? MAIN_PATH[index + 1] : null,
    canReject: true,
  };
}
