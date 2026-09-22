import { createApplicants } from "./seed";
import type { Applicant, Stage } from "../types";

/** 시드 로직이 바뀌면 키를 올려 예전 데이터와 섞이지 않게 한다. */
export const STORAGE_KEY = "worksphere:applicants:v1";
const SEED_COUNT = 1000;

/**
 * 지연·실패율을 한곳에 모은다. 테스트에서 지연을 0으로 낮추거나
 * 실패율을 1로 올려 특정 상황을 재현할 때 이 객체를 조정한다.
 */
export const MOCK_CONFIG = {
  minLatency: 200,
  maxLatency: 800,
  /** 단계 이동 등 쓰기 요청의 실패 확률 */
  writeFailureRate: 0.15,
  /** 조회 실패 확률. 기본 0인 이유는 DECISIONS.md D2 참고 */
  fetchFailureRate: 0,
};

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

function delay(): Promise<void> {
  const { minLatency, maxLatency } = MOCK_CONFIG;
  const ms = minLatency + Math.random() * (maxLatency - minLatency);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readStore(): Applicant[] {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (raw) {
    try {
      return JSON.parse(raw) as Applicant[];
    } catch {
      // 손상된 값이면 버리고 다시 시딩한다. 여기서 던지면 앱이 영영 못 뜬다.
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  const seeded = createApplicants(SEED_COUNT);
  writeStore(seeded);
  return seeded;
}

function writeStore(list: Applicant[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export async function fetchApplicants(): Promise<Applicant[]> {
  await delay();

  if (Math.random() < MOCK_CONFIG.fetchFailureRate) {
    throw new ApiError("지원자 목록을 불러오지 못했습니다.");
  }

  return readStore();
}

/**
 * 단계 이동을 저장한다. 실패하면 저장소를 건드리지 않고 던진다.
 * 서버 역할이므로 낙관적 갱신은 하지 않는다. 롤백은 호출하는 쪽 책임이다.
 */
export async function updateStage(id: string, stage: Stage): Promise<Applicant> {
  await delay();

  if (Math.random() < MOCK_CONFIG.writeFailureRate) {
    throw new ApiError("단계 이동을 저장하지 못했습니다.");
  }

  const list = readStore();
  const index = list.findIndex((applicant) => applicant.id === id);
  if (index === -1) {
    throw new ApiError("존재하지 않는 지원자입니다.");
  }

  const updated = { ...list[index], stage };
  list[index] = updated;
  writeStore(list);

  return updated;
}
