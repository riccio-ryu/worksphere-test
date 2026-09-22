import { describe, expect, it } from "vitest";
import { createApplicants } from "./seed";
import { ROLES, STAGES } from "../types";

const list = createApplicants(1000);

describe("시드 생성", () => {
  it("요청한 개수만큼 만들고 id가 겹치지 않는다", () => {
    expect(list).toHaveLength(1000);
    expect(new Set(list.map((a) => a.id)).size).toBe(1000);
  });

  it("같은 시드면 같은 데이터가 나온다", () => {
    expect(createApplicants(50)).toEqual(createApplicants(50));
  });

  it("다른 시드면 다른 데이터가 나온다", () => {
    expect(createApplicants(50, 1)).not.toEqual(createApplicants(50, 2));
  });

  // 이름 음절 배열에 한글이 아닌 문자가 섞여 들어간 적이 있다.
  // 타입이 전부 string 이라 컴파일러가 잡지 못하므로 테스트로 막는다.
  it("이름이 한글 세 글자다", () => {
    const broken = list.filter((a) => !/^[가-힣]{3}$/.test(a.name));
    expect(broken).toEqual([]);
  });

  it("지원일이 YYYY-MM-DD 형식이고 미래가 아니다", () => {
    const today = new Date().toISOString().slice(0, 10);
    const broken = list.filter(
      (a) => !/^\d{4}-\d{2}-\d{2}$/.test(a.appliedAt) || a.appliedAt > today,
    );
    expect(broken).toEqual([]);
  });

  it("단계와 직무가 정의된 값만 쓴다", () => {
    const stages = new Set(list.map((a) => a.stage));
    const roles = new Set(list.map((a) => a.role));
    expect([...stages].every((s) => STAGES.includes(s))).toBe(true);
    expect([...roles].every((r) => ROLES.includes(r))).toBe(true);
  });

  it("단계 분포가 의도한 가중치를 따른다", () => {
    const count = (stage: string) => list.filter((a) => a.stage === stage).length;

    // 서류검토 0.42 / 면접 0.22 / 처우협의 0.10 / 최종합격 0.08 / 불합격 0.18
    // 1,000건 표본이라 ±5%p 안에 들어오면 의도대로 본다.
    expect(count("서류검토") / 1000).toBeCloseTo(0.42, 1);
    expect(count("면접") / 1000).toBeCloseTo(0.22, 1);
    expect(count("불합격") / 1000).toBeCloseTo(0.18, 1);

    // 앞 단계가 뒷 단계보다 두꺼워야 파이프라인처럼 보인다.
    expect(count("서류검토")).toBeGreaterThan(count("면접"));
    expect(count("면접")).toBeGreaterThan(count("처우협의"));
  });

  it("직무가 한쪽으로 쏠리지 않는다", () => {
    const counts = ROLES.map((role) => list.filter((a) => a.role === role).length);
    // 8종을 고르게 뽑으면 평균 125건. 절반~두 배 사이면 쏠림이 없다고 본다.
    expect(Math.min(...counts)).toBeGreaterThan(62);
    expect(Math.max(...counts)).toBeLessThan(250);
  });
});
