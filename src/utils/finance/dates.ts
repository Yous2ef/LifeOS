/** Today as YYYY-MM-DD in the device's time zone (toISOString would use UTC) */
export const todayISO = (now: Date = new Date()): string =>
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
        now.getDate(),
    ).padStart(2, "0")}`;
