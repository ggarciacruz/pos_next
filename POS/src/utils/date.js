/**
 * Timezone-safe local date & Frappe datetime utilities.
 *
 * Avoids `new Date().toISOString().split("T")[0]` bugs in UTC- timezones
 * (e.g. America/La_Paz UTC-4 where UTC rolls over to tomorrow at 20:00 local time)
 * and avoids `new Date("YYYY-MM-DD")` parsing date-only strings as UTC midnight.
 */

/**
 * Format a Date instance as local YYYY-MM-DD (never UTC).
 * @param {Date} [date]
 * @returns {string}
 */
export function getLocalDateString(date = new Date()) {
	const d = date instanceof Date ? date : new Date(date);
	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

/**
 * Format a local date offset by N days from today as YYYY-MM-DD.
 * @param {number} daysOffset
 * @param {Date} [baseDate]
 * @returns {string}
 */
export function getLocalDateOffsetString(daysOffset = 0, baseDate = new Date()) {
	const d = new Date(baseDate.getTime());
	d.setDate(d.getDate() + Number(daysOffset || 0));
	return getLocalDateString(d);
}

/**
 * Safely parse a Frappe date/datetime string in local browser time.
 * - "YYYY-MM-DD HH:mm:ss(.ffffff)" -> parsed as local datetime (Safari/iOS safe)
 * - "YYYY-MM-DD" -> parsed as local midnight (prevents UTC-4 showing previous day 20:00)
 * - ISO timestamps with explicit timezone ("Z" or "+/-HH:mm") -> preserved as-is
 * @param {string|number|Date|null|undefined} value
 * @returns {Date|null}
 */
export function parseFrappeDateTime(value) {
	if (!value) return null;
	if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
	if (typeof value === "number") {
		const d = new Date(value);
		return Number.isNaN(d.getTime()) ? null : d;
	}

	const str = String(value).trim();
	if (!str) return null;

	// Date-only string YYYY-MM-DD -> force local midnight instead of UTC midnight
	if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
		const [y, m, d] = str.split("-").map(Number);
		return new Date(y, m - 1, d, 0, 0, 0, 0);
	}

	// Frappe naive datetime "YYYY-MM-DD HH:mm:ss(.ffffff)" -> replace space with T so it parses as local time on all browsers
	if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(str)) {
		const normalized = str.replace(" ", "T").replace(/\.(\d{3})\d+$/, ".$1");
		const d = new Date(normalized);
		return Number.isNaN(d.getTime()) ? null : d;
	}

	const d = new Date(str);
	return Number.isNaN(d.getTime()) ? null : d;
}
