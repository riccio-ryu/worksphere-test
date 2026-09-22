import { ROLES, STAGES, type Applicant, type Role, type Stage } from "../types";

/**
 * 시드를 고정한 선형 합동 생성기(LCG).
 * Math.random 을 쓰면 실행할 때마다 데이터가 달라져 "1,000건 중 몇 건" 같은 단언을 쓸 수 없다.
 */
function createRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

const SURNAMES = ["김", "이", "박", "최", "정", "강", "조", "윤", "장", "임", "한", "오", "서", "신", "권"];
const GIVEN_FIRST = ["민", "서", "지", "현", "예", "하", "도", "시", "수", "유", "주", "다", "은", "재", "태"];
const GIVEN_SECOND = ["준", "윤", "우", "진", "아", "호", "연", "빈", "결", "성", "현", "영", "찬", "희", "원"];
const SOURCES = ["직접지원", "헤드헌팅", "사내추천", "채용박람회", "리크루터 컨택"];

/** 실제 파이프라인처럼 앞 단계가 두껍게 쌓이도록 가중치를 준다. */
const STAGE_WEIGHTS: Array<[Stage, number]> = [
  ["서류검토", 0.42],
  ["면접", 0.22],
  ["처우협의", 0.1],
  ["최종합격", 0.08],
  ["불합격", 0.18],
];

function pickStage(value: number): Stage {
  let acc = 0;
  for (const [stage, weight] of STAGE_WEIGHTS) {
    acc += weight;
    if (value < acc) return stage;
  }
  return STAGES[0];
}

/** 모듈이 로드될 때 한 번 고정한다. 같은 실행 안에서는 두 번 호출해도 같은 날짜가 나온다. */
const BASE_TIME = Date.now();

export function createApplicants(count: number, seed = 20260923): Applicant[] {
  const random = createRandom(seed);
  const pick = <T,>(items: readonly T[]) => items[Math.floor(random() * items.length)];
  const list: Applicant[] = [];

  for (let i = 0; i < count; i++) {
    const name = `${pick(SURNAMES)}${pick(GIVEN_FIRST)}${pick(GIVEN_SECOND)}`;
    const role = pick(ROLES) as Role;
    const daysAgo = Math.floor(random() * 120);
    const appliedAt = new Date(BASE_TIME - daysAgo * 86_400_000).toISOString().slice(0, 10);
    const experienceYears = Math.floor(random() * 12);
    const source = pick(SOURCES);

    list.push({
      id: `A${String(i + 1).padStart(4, "0")}`,
      name,
      role,
      appliedAt,
      stage: pickStage(random()),
      email: `applicant${i + 1}@example.com`,
      phone: `010-${1000 + Math.floor(random() * 9000)}-${1000 + Math.floor(random() * 9000)}`,
      experienceYears,
      source,
      summary: `${role} ${experienceYears}년차. ${source} 경로로 지원.`,
    });
  }

  return list;
}
