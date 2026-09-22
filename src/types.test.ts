import { describe, expect, it } from "vitest";
import { getStageMoves } from "./types";

describe("단계별 이동 가능 경로", () => {
  it("첫 단계는 이전이 없다", () => {
    expect(getStageMoves("서류검토")).toEqual({ prev: null, next: "면접", canReject: true });
  });

  it("중간 단계는 양쪽으로 움직인다", () => {
    expect(getStageMoves("면접")).toEqual({ prev: "서류검토", next: "처우협의", canReject: true });
    expect(getStageMoves("처우협의")).toEqual({ prev: "면접", next: "최종합격", canReject: true });
  });

  it("최종합격은 다음이 없다", () => {
    expect(getStageMoves("최종합격")).toEqual({ prev: "처우협의", next: null, canReject: true });
  });

  // 불합격은 합격 경로 밖의 분기라 이전 단계를 알 수 없다. 경로 첫 단계로만 되돌린다.
  it("불합격은 서류검토로만 되돌아간다", () => {
    expect(getStageMoves("불합격")).toEqual({ prev: "서류검토", next: null, canReject: false });
  });
});
