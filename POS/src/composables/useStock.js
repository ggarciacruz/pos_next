/**
 * Stock Composable
 *
 * Provides centralized stock-related utilities including stock status
 * badge styling based on quantity levels.
 *
 * Usage:
 * import { useStock } from '@/composables/useStock'
 * const { getStockStatus } = useStock()
 * const status = getStockStatus(item.actual_qty)
 */

import { usePOSSettingsStore } from "@/stores/posSettings";

export function useStock() {
	const settingsStore = usePOSSettingsStore();

	/**
	 * Get stock status information based on quantity, item safety_stock, or profile default
	 *
	 * @param {number|null|undefined} qty - The stock quantity
	 * @param {Object|number|null} itemOrThreshold - Item object (uses item.safety_stock if > 0) or custom threshold number
	 * @returns {Object} Stock status with level, color, textColor, and label
	 */
	function getStockStatus(qty, itemOrThreshold = null) {
		const quantity = Math.floor(qty !== undefined && qty !== null ? qty : 0);

		let lowStockThreshold = settingsStore.lowStockThreshold ?? 10;
		if (itemOrThreshold && typeof itemOrThreshold === "object") {
			const itemSafetyStock = Number(itemOrThreshold.safety_stock);
			if (Number.isFinite(itemSafetyStock) && itemSafetyStock > 0) {
				lowStockThreshold = itemSafetyStock;
			}
		} else if (typeof itemOrThreshold === "number" && itemOrThreshold > 0) {
			lowStockThreshold = itemOrThreshold;
		}

		if (quantity < 0) {
			return {
				level: "negative",
				color: "bg-red-500",
				textColor: "text-white",
				label: __("Negative Stock"),
			};
		}

		if (quantity === 0) {
			return {
				level: "out",
				color: "bg-red-500",
				textColor: "text-white",
				label: __("Out of Stock"),
			};
		}

		if (quantity <= lowStockThreshold) {
			return {
				level: "low",
				color: "bg-amber-500",
				textColor: "text-white",
				label: __("Low Stock"),
			};
		}

		return {
			level: "safe",
			color: "bg-green-500",
			textColor: "text-white",
			label: __("In Stock"),
		};
	}

	return {
		getStockStatus,
	};
}
