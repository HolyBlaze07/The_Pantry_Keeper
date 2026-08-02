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

export function parseExpirationDate(dateString?: string): Date | null {
  if (!dateString) {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);

  if (!match) {
    return null;
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (year < 2000 || year > 2100) {
    return null;
  }

  const date = new Date(year, month - 1, day);

  const isValid =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;

  return isValid ? date : null;
}

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
  const expiration = parseExpirationDate(expirationDate);

  if (!expiration) {
    return {
      status: "no-date",
      label: "No Expiration Date",
      daysRemaining: null,
    };
  }

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
