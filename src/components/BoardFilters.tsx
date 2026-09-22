import { ROLES } from "../types";

interface Props {
  query: string;
  role: string;
  total: number;
  matched: number;
  onQueryChange: (value: string) => void;
  onRoleChange: (value: string) => void;
}

export const ALL_ROLES = "전체";

export function BoardFilters({ query, role, total, matched, onQueryChange, onRoleChange }: Props) {
  const filtering = query.trim() !== "" || role !== ALL_ROLES;

  return (
    <div className="filters">
      <label className="filters__field">
        <span className="filters__label">이름 검색</span>
        <input
          type="search"
          className="filters__input"
          value={query}
          placeholder="지원자 이름"
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </label>

      <label className="filters__field">
        <span className="filters__label">직무</span>
        <select className="filters__select" value={role} onChange={(event) => onRoleChange(event.target.value)}>
          <option value={ALL_ROLES}>{ALL_ROLES}</option>
          {ROLES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>

      <p className="filters__result" aria-live="polite">
        {filtering ? `${total}명 중 ${matched}명` : `지원자 ${total}명`}
      </p>
    </div>
  );
}
