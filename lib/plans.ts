export const GUEST_DAILY_DOCUMENT_LIMIT = 1;
export const FREE_MONTHLY_DOCUMENT_LIMIT = 20;
export const PRO_MONTHLY_DOCUMENT_LIMIT = 200;

export const PLAN_LIMITS: Record<string, number> = {
  free: FREE_MONTHLY_DOCUMENT_LIMIT,
  pro: PRO_MONTHLY_DOCUMENT_LIMIT,
};
