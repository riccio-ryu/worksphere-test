import { STAGES } from "../types";

/** 로딩 중에도 컬럼 골격을 보여줘서 데이터가 도착할 때 화면이 튀지 않게 한다. */
export function BoardSkeleton() {
  return (
    <div className="board" aria-hidden="true">
      {STAGES.map((stage) => (
        <section className="column" key={stage}>
          <h2 className="column__heading">{stage}</h2>
          <div className="column__list">
            {[0, 1, 2].map((i) => (
              <div className="skeleton" key={i} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

interface ErrorProps {
  message: string;
  onRetry: () => void;
}

export function BoardError({ message, onRetry }: ErrorProps) {
  return (
    <div className="state state--error" role="alert">
      <p className="state__title">지원자를 불러오지 못했습니다</p>
      <p className="state__body">{message}</p>
      <button type="button" className="button button--primary" onClick={onRetry}>
        다시 시도
      </button>
    </div>
  );
}

export function BoardEmpty({ filtered }: { filtered: boolean }) {
  return (
    <div className="state">
      <p className="state__title">
        {filtered ? "조건에 맞는 지원자가 없습니다" : "등록된 지원자가 없습니다"}
      </p>
      <p className="state__body">
        {filtered
          ? "이름 검색어나 직무 필터를 바꿔 보세요."
          : "지원자가 등록되면 단계별로 이곳에 표시됩니다."}
      </p>
    </div>
  );
}
