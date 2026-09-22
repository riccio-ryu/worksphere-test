import { describe, expect, it } from "vitest";
import { applicantsReducer, initialState, type State } from "./applicantsReducer";
import type { Applicant } from "../types";

function applicant(id: string, stage: Applicant["stage"] = "서류검토"): Applicant {
  return {
    id,
    name: `지원자${id}`,
    role: "프론트엔드",
    appliedAt: "2026-09-01",
    stage,
    email: `${id}@example.com`,
    phone: "010-0000-0000",
    experienceYears: 3,
    source: "직접지원",
    summary: "테스트용",
  };
}

/** A1~A5 다섯 명이 서류검토에 있는 상태 */
function ready(): State {
  return applicantsReducer(initialState, {
    type: "fetch/success",
    applicants: ["A1", "A2", "A3", "A4", "A5"].map((id) => applicant(id)),
  });
}

describe("조회", () => {
  it("응답을 id 맵과 순서 배열로 나눠 담는다", () => {
    const state = ready();
    expect(state.status).toBe("ready");
    expect(state.order).toEqual(["A1", "A2", "A3", "A4", "A5"]);
    expect(state.byId.A3.id).toBe("A3");
  });

  it("다시 불러오면 진행 중이던 이동 기록을 비운다", () => {
    const moving = applicantsReducer(ready(), { type: "move/start", id: "A3", stage: "면접" });
    expect(Object.keys(moving.pending)).toEqual(["A3"]);

    const reloaded = applicantsReducer(moving, {
      type: "fetch/success",
      applicants: [applicant("A1")],
    });
    expect(reloaded.pending).toEqual({});
  });
});

describe("낙관적 이동", () => {
  it("응답을 기다리지 않고 단계를 바꾸고 맨 앞으로 보낸다", () => {
    const state = applicantsReducer(ready(), { type: "move/start", id: "A3", stage: "면접" });

    expect(state.byId.A3.stage).toBe("면접");
    expect(state.order).toEqual(["A3", "A1", "A2", "A4", "A5"]);
  });

  it("되돌릴 값으로 이전 단계와 바로 앞 카드를 남긴다", () => {
    const state = applicantsReducer(ready(), { type: "move/start", id: "A3", stage: "면접" });

    expect(state.pending.A3).toEqual({
      previousStage: "서류검토",
      previousAnchorId: "A2",
      inFlight: 1,
    });
  });

  it("맨 앞 카드는 기준점이 없다", () => {
    const state = applicantsReducer(ready(), { type: "move/start", id: "A1", stage: "면접" });

    expect(state.pending.A1.previousAnchorId).toBeNull();
  });

  it("없는 지원자는 아무것도 바꾸지 않는다", () => {
    const base = ready();
    expect(applicantsReducer(base, { type: "move/start", id: "없음", stage: "면접" })).toBe(base);
  });
});

describe("성공", () => {
  it("서버가 준 값으로 맞추고 스냅샷을 버린다", () => {
    const moved = applicantsReducer(ready(), { type: "move/start", id: "A3", stage: "면접" });
    const done = applicantsReducer(moved, {
      type: "move/success",
      applicant: applicant("A3", "면접"),
    });

    expect(done.byId.A3.stage).toBe("면접");
    expect(done.pending).toEqual({});
    // 성공했으므로 맨 앞 자리를 유지한다.
    expect(done.order[0]).toBe("A3");
    expect(done.toast).toBeNull();
  });
});

describe("실패 롤백", () => {
  it("단계를 이전 값으로 되돌린다", () => {
    const moved = applicantsReducer(ready(), { type: "move/start", id: "A3", stage: "면접" });
    const rolled = applicantsReducer(moved, {
      type: "move/failure",
      id: "A3",
      message: "저장 실패",
    });

    expect(rolled.byId.A3.stage).toBe("서류검토");
  });

  // 단계만 되돌리면 카드가 원래 컬럼에 돌아오되 맨 위에 남아 또 다른 이동처럼 보인다.
  it("표시 위치까지 원래 자리로 되돌린다", () => {
    const moved = applicantsReducer(ready(), { type: "move/start", id: "A3", stage: "면접" });
    expect(moved.order).toEqual(["A3", "A1", "A2", "A4", "A5"]);

    const rolled = applicantsReducer(moved, {
      type: "move/failure",
      id: "A3",
      message: "저장 실패",
    });

    expect(rolled.order).toEqual(["A1", "A2", "A3", "A4", "A5"]);
  });

  it("롤백은 이동 전 상태와 완전히 같아야 한다", () => {
    const before = ready();
    const moved = applicantsReducer(before, { type: "move/start", id: "A2", stage: "처우협의" });
    const rolled = applicantsReducer(moved, {
      type: "move/failure",
      id: "A2",
      message: "저장 실패",
    });

    expect(rolled.byId).toEqual(before.byId);
    expect(rolled.order).toEqual(before.order);
    expect(rolled.pending).toEqual({});
  });

  it("사용자에게 알릴 메시지를 남긴다", () => {
    const moved = applicantsReducer(ready(), { type: "move/start", id: "A3", stage: "면접" });
    const rolled = applicantsReducer(moved, {
      type: "move/failure",
      id: "A3",
      message: "단계 이동을 저장하지 못했습니다.",
    });

    expect(rolled.toast?.message).toBe("단계 이동을 저장하지 못했습니다.");
  });

  // 같은 메시지가 연달아 떠도 새 알림으로 인식되어야 자동 닫힘 타이머가 다시 시작된다.
  it("연속 실패 시 알림 키가 증가한다", () => {
    let state = ready();
    const keys: number[] = [];

    for (const id of ["A1", "A2"]) {
      state = applicantsReducer(state, { type: "move/start", id, stage: "면접" });
      state = applicantsReducer(state, { type: "move/failure", id, message: "저장 실패" });
      keys.push(state.toast!.key);
    }

    expect(keys[1]).toBeGreaterThan(keys[0]);
  });

  it("스냅샷이 없으면 아무것도 바꾸지 않는다", () => {
    const base = ready();
    expect(
      applicantsReducer(base, { type: "move/failure", id: "A3", message: "저장 실패" }),
    ).toBe(base);
  });
});

describe("경쟁 상태", () => {
  const move = (state: State, id: string, stage: Applicant["stage"]) =>
    applicantsReducer(state, { type: "move/start", id, stage });
  const fail = (state: State, id: string) =>
    applicantsReducer(state, { type: "move/failure", id, message: "저장 실패" });
  const succeed = (state: State, id: string, stage: Applicant["stage"]) =>
    applicantsReducer(state, { type: "move/success", applicant: applicant(id, stage) });

  it("같은 카드를 연속으로 누르면 스냅샷을 덮지 않는다", () => {
    let state = move(ready(), "A3", "면접");
    state = move(state, "A3", "처우협의");

    // 두 번째 스냅샷으로 덮였다면 확정된 적 없는 '면접'으로 되돌아가게 된다.
    expect(state.pending.A3.previousStage).toBe("서류검토");
    expect(state.pending.A3.inFlight).toBe(2);
    expect(state.byId.A3.stage).toBe("처우협의");
  });

  it("앞선 요청이 실패해도 뒤 요청이 남아 있으면 되돌리지 않는다", () => {
    let state = move(ready(), "A3", "면접");
    state = move(state, "A3", "처우협의");
    state = fail(state, "A3");

    expect(state.byId.A3.stage).toBe("처우협의");
    expect(state.pending.A3.inFlight).toBe(1);
    expect(state.toast).toBeNull();
  });

  it("마지막 응답이 성공이면 그 값으로 확정된다", () => {
    let state = move(ready(), "A3", "면접");
    state = move(state, "A3", "처우협의");
    state = fail(state, "A3");
    state = succeed(state, "A3", "처우협의");

    expect(state.byId.A3.stage).toBe("처우협의");
    expect(state.pending).toEqual({});
    expect(state.toast).toBeNull();
  });

  it("마지막 응답이 실패면 처음 확정 상태로 되돌린다", () => {
    let state = move(ready(), "A3", "면접");
    state = move(state, "A3", "처우협의");
    state = succeed(state, "A3", "면접");
    state = fail(state, "A3");

    // 중간에 성공한 '면접'이 아니라 누르기 전의 '서류검토'로 돌아가야 한다.
    expect(state.byId.A3.stage).toBe("서류검토");
    expect(state.order).toEqual(["A1", "A2", "A3", "A4", "A5"]);
    expect(state.toast?.message).toBe("저장 실패");
  });

  // 인덱스로 위치를 기억하면 그 사이 다른 카드가 앞으로 이동했을 때 한 칸씩 밀린다.
  it("다른 카드가 먼저 이동해도 원래 자리로 되돌아간다", () => {
    let state = move(ready(), "A3", "면접");
    state = move(state, "A5", "면접");
    expect(state.order).toEqual(["A5", "A3", "A1", "A2", "A4"]);

    state = fail(state, "A3");

    // A5 는 아직 이동 중이라 앞에 남고, A3 는 A2 뒤 원래 자리로 돌아간다.
    expect(state.order).toEqual(["A5", "A1", "A2", "A3", "A4"]);
  });

  it("두 카드를 동시에 옮겨도 서로의 롤백에 간섭하지 않는다", () => {
    const before = ready();
    let state = move(before, "A2", "면접");
    state = move(state, "A4", "처우협의");
    state = fail(state, "A2");
    state = fail(state, "A4");

    expect(state.byId).toEqual(before.byId);
    expect(state.order).toEqual(before.order);
    expect(state.pending).toEqual({});
  });
});
