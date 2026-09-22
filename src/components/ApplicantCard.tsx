import type { Applicant } from "../types";

interface Props {
  applicant: Applicant;
}

export function ApplicantCard({ applicant }: Props) {
  return (
    <li className="card">
      <p className="card__name">{applicant.name}</p>
      <p className="card__role">{applicant.role}</p>
      <p className="card__meta">
        <span>지원일 {applicant.appliedAt}</span>
        <span className="card__stage">{applicant.stage}</span>
      </p>
    </li>
  );
}
