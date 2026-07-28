export type ExpirationStatus =
  | "fresh"
  | "near-expiration"
  | "expiring-today"
  | "expired"
  | "no-date";

export type ExpirationDetails = {
  status: ExpirationStatus;
  label: string;
  daysRemaining: number | null;
};

export function getExpirationDetails(
  expirationDate?: string,
): ExpirationDetails {
  if (!expirationDate) {
    return {
      status: "no-date",
      label: "No Expiration Date",
      daysRemaining: null,
    };
  }

  const today = new Date();
  const expiration = new Date(`${expirationDate}T00:00:00`);

  today.setHours(0, 0, 0, 0);
  expiration.setHours(0, 0, 0, 0);

  const millisecondsPerDay = 1000 * 60 * 60 * 24;

  const daysRemaining = Math.round(
    (expiration.getTime() - today.getTime()) /
      millisecondsPerDay,
  );

  if (daysRemaining < 0) {
    return {
      status: "expired",
      label: "Expired",
      daysRemaining,
    };
  }

  if (daysRemaining === 0) {
    return {
      status: "expiring-today",
      label: "Today",
      daysRemaining,
    };
  }

  if (daysRemaining <= 3) {
    return {
      status: "near-expiration",
      label: "Soon",
      daysRemaining,
    };
  }

  return {
    status: "fresh",
    label: "Fresh",
    daysRemaining,
  };
}
