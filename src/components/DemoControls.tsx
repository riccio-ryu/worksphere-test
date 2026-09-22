import { useState } from "react";
import { MOCK_CONFIG, clearStore, resetStore } from "../mock/api";

interface Props {
  onReload: () => void;
}

/**
 * 제품 기능이 아니라 mock 환경을 조작하는 시연 장치다.
 * 조회 실패와 빈 목록은 평소에 재현되지 않아서 이 패널 없이는 확인할 방법이 없다.
 */
export function DemoControls({ onReload }: Props) {
  const [failFetch, setFailFetch] = useState(MOCK_CONFIG.fetchFailureRate === 1);

  const toggleFailFetch = () => {
    const next = !failFetch;
    MOCK_CONFIG.fetchFailureRate = next ? 1 : 0;
    setFailFetch(next);
  };

  return (
    <div className="demo">
      <span className="demo__tag">시연용</span>

      <label className="demo__item">
        <input type="checkbox" checked={failFetch} onChange={toggleFailFetch} />
        조회를 항상 실패시키기
      </label>

      <button type="button" className="button" onClick={onReload}>
        다시 불러오기
      </button>
      <button
        type="button"
        className="button"
        onClick={() => {
          clearStore();
          onReload();
        }}
      >
        데이터 비우기
      </button>
      <button
        type="button"
        className="button"
        onClick={() => {
          resetStore();
          onReload();
        }}
      >
        초기 데이터로 되돌리기
      </button>
    </div>
  );
}
