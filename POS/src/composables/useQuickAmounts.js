/**
 * Quick Amounts Composable
 * Generates suggested payment amounts based on remaining balance
 */

import { computed } from "vue";
import { roundCurrency } from "@/utils/currency";

/**
 * Create quick amounts suggestions based on remaining amount
 * @param {ComputedRef<number>} remainingAmount - Remaining amount to pay
 * @param {ComputedRef<boolean>} isCash - Whether the selected payment method is cash
 * @returns {Object} Computed quick amounts array
 */
export function useQuickAmounts(remainingAmount, isCash) {
	/**
	 * Generate quick amount suggestions:
	 * Returns solely the exact remaining balance (rounded to currency precision).
	 * Eliminates confusing and unrealistic arbitrary round-up denominations (e.g. 1400, 1500, 1600).
	 */
	const quickAmounts = computed(() => {
		const remaining = remainingAmount.value;
		if (remaining <= 0) {
			return [];
		}

		return [roundCurrency(remaining)];
	});

	return {
		quickAmounts,
	};
}
