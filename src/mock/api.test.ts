import { afterEach, describe, expect, it } from "vitest";
import { ApiError, MOCK_CONFIG, STORAGE_KEY, fetchApplicants, updateStage } from "./api";

const DEFAULTS = { ...MOCK_CONFIG };

/** 지연을 0으로 낮춘다. 수백 회 시행해야 하는 테스트에서 실제 지연을 기다릴 수 없다. */
function noDelay() {
  MOCK_CONFIG.minLatency = 0;
  MOCK_CONFIG.maxLatency = 0;
}

afterEach(() => {
  Object.assign(MOCK_CONFIG, DEFAULTS);
  localStorage.clear();
});

describe("조회", () => {
  // 한 번만 재면 "이번 호출이 범위 안이었다"밖에 모른다.
  // 늘 같은 값을 돌려주도록 잘못 바뀌어도 통과하므로 여러 번 재서 흩어짐까지 본다.
  //
  // 순차로 재면 8회 × 최대 800ms = 6.4초가 되어 기본 타임아웃(5초)을 넘길 수 있다.
  // 동시에 보내면 전체 소요가 가장 느린 한 건(최대 800ms)으로 줄고 표본은 그대로다.
  it("지연이 200~800ms 범위에서 매번 달라진다", async () => {
    const measure = async () => {
      const started = Date.now();
      await fetchApplicants();
      return Date.now() - started;
    };

    const samples = await Promise.all(Array.from({ length: 8 }, measure));

    expect(Math.min(...samples)).toBeGreaterThanOrEqual(MOCK_CONFIG.minLatency);
    // 타이머는 정확히 깨어나지 않으므로 상한에만 여유를 둔다.
    expect(Math.max(...samples)).toBeLessThan(MOCK_CONFIG.maxLatency + 200);
    // 고정값이 아니라 범위 안에서 흩어져야 한다.
    expect(Math.max(...samples) - Math.min(...samples)).toBeGreaterThan(50);
  });

  it("기본값으로는 실패하지 않는다", async () => {
    noDelay();
    for (let i = 0; i < 50; i++) {
      await expect(fetchApplicants()).resolves.toHaveLength(1000);
    }
  });

  it("조회 실패율을 올리면 ApiError를 던진다", async () => {
    noDelay();
    MOCK_CONFIG.fetchFailureRate = 1;
    await expect(fetchApplicants()).rejects.toBeInstanceOf(ApiError);
  });

  // 키를 상수로 가져온다. 문자열을 박아두면 STORAGE_KEY 를 올렸을 때
  // 엉뚱한 키에 쓰고도 통과해 검증이 조용히 무력화된다.
  it("저장된 값이 깨져 있으면 버리고 다시 시딩한다", async () => {
    noDelay();
    localStorage.setItem(STORAGE_KEY, "{ 깨진 JSON");
    await expect(fetchApplicants()).resolves.toHaveLength(1000);
  });
});

describe("단계 이동", () => {
  it("실패율이 15% 근처다", async () => {
    noDelay();

    const trials = 600;
    let failures = 0;
    for (let i = 0; i < trials; i++) {
      try {
        await updateStage("A0001", "면접");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        failures++;
      }
    }

    // 600회 표본. 15%를 기준으로 ±5%p 안에 들어오면 의도대로 본다.
    const rate = failures / trials;
    expect(rate).toBeGreaterThan(0.1);
    expect(rate).toBeLessThan(0.2);
  });

  it("성공하면 저장되어 다시 조회해도 유지된다", async () => {
    noDelay();
    MOCK_CONFIG.writeFailureRate = 0;

    await updateStage("A0007", "처우협의");
    const list = await fetchApplicants();

    expect(list.find((a) => a.id === "A0007")?.stage).toBe("처우협의");
  });

  // 낙관적 업데이트 롤백이 이 성질에 기댄다.
  // 서버가 실패했는데 일부라도 썼다면 롤백한 화면과 저장 상태가 어긋난다.
  it("실패하면 저장소를 건드리지 않는다", async () => {
    noDelay();
    MOCK_CONFIG.writeFailureRate = 1;

    const before = (await fetchApplicants()).find((a) => a.id === "A0007")?.stage;
    await expect(updateStage("A0007", "최종합격")).rejects.toBeInstanceOf(ApiError);
    const after = (await fetchApplicants()).find((a) => a.id === "A0007")?.stage;

    expect(after).toBe(before);
  });

  it("없는 지원자를 옮기려 하면 ApiError를 던진다", async () => {
    noDelay();
    MOCK_CONFIG.writeFailureRate = 0;

    await expect(updateStage("없는id", "면접")).rejects.toBeInstanceOf(ApiError);
  });
});

describe("목록 순서", () => {
  it("방금 옮긴 지원자가 맨 앞으로 온다", async () => {
    noDelay();
    MOCK_CONFIG.writeFailureRate = 0;

    const before = await fetchApplicants();
    const targetId = before[500].id;
    expect(before[0].id).not.toBe(targetId);

    await updateStage(targetId, "면접");
    const after = await fetchApplicants();

    expect(after[0].id).toBe(targetId);
    // 순서만 바뀌고 사라지는 지원자는 없어야 한다.
    expect(after).toHaveLength(before.length);
    expect(new Set(after.map((a) => a.id))).toEqual(new Set(before.map((a) => a.id)));
  });
});
