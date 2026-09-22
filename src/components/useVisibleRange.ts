import { useCallback, useEffect, useRef, useState } from "react";

/** 카드 한 장이 차지하는 높이. 카드 자체 높이 + 목록의 gap. CSS 와 함께 고정해야 한다. */
export const CARD_SLOT_HEIGHT = 132;

interface Options {
  /** 항목 하나의 높이(px). 모든 카드가 같은 높이라 고정값으로 계산할 수 있다. */
  itemHeight: number;
  count: number;
  /** 화면 밖에 미리 그려둘 개수. 빠르게 스크롤할 때 빈 칸이 보이지 않게 한다. */
  overscan?: number;
}

/**
 * 스크롤 위치로 그릴 구간을 계산한다.
 *
 * 카드 높이가 모두 같아서 측정 없이 나눗셈으로 구할 수 있다.
 * 가변 높이였다면 각 항목을 재고 누적 오프셋을 관리해야 한다.
 */
export function useVisibleRange({ itemHeight, count, overscan = 6 }: Options) {
  const ref = useRef<HTMLElement | null>(null);
  const [range, setRange] = useState({ start: 0, end: Math.min(count, 20) });

  const measure = useCallback(() => {
    const node = ref.current;
    if (!node) return;

    const start = Math.floor(node.scrollTop / itemHeight);
    const visible = Math.ceil(node.clientHeight / itemHeight);

    setRange((current) => {
      const next = {
        start: Math.max(0, start - overscan),
        end: Math.min(count, start + visible + overscan),
      };
      return next.start === current.start && next.end === current.end ? current : next;
    });
  }, [itemHeight, count, overscan]);

  useEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // 스크롤은 프레임마다 들어온다. 렌더 직전에 한 번만 계산한다.
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        measure();
      });
    };

    node.addEventListener("scroll", onScroll, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(node);

    return () => {
      node.removeEventListener("scroll", onScroll);
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [measure]);

  return { ref, range };
}
