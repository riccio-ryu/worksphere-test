import { useEffect } from "react";

interface Props {
  /** 같은 메시지가 연달아 떠도 타이머를 다시 시작하려고 키를 받는다. */
  toastKey: number;
  message: string;
  onDismiss: () => void;
}

const AUTO_DISMISS_MS = 5000;

export function Toast({ toastKey, message, onDismiss }: Props) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toastKey, onDismiss]);

  return (
    <div className="toast" role="alert">
      <span className="toast__message">{message}</span>
      <button type="button" className="toast__close" onClick={onDismiss} aria-label="알림 닫기">
        ✕
      </button>
    </div>
  );
}
