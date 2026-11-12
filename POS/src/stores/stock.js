/**
 * Stock Management Store - Smart & Minimal
 *
 * Core Formula: Display Stock = Server Stock - Reserved Stock
 *
 * This store is a LOCAL CACHE, not the source of truth.
 * The server database is the source. This cache stays synchronized via:
 *
 * 1. Realtime Updates (Socket.IO):
 *    - Other terminals submit invoices → realtime_events.py emits pos_stock_update
 *    - useRealtimeStock.js batches events → POSSale.vue filters by warehouse
 *    - Calls update() → Pinia reactivity triggers UI updates (100-800ms)
 *
 * 2. Direct Refresh (API):
 *    - Own invoice submission → calls refresh() with sold items
 *    - Manual refresh / warehouse change → calls refresh() with all items
 *    - Clears reservations + fetches fresh stock (50-200ms)
 *
 * Everything else is just Pinia reactivity doing its job.
 */

import { defineStore } from "pinia";
import { ref, onMounted } from "vue";
import { call } from "@/utils/apiWrapper";
import { offlineWorker } from "@/utils/offline/workerClient";
import { logger } from "@/utils/logger";
import { usePOSEventsStore } from "@/stores/posEvents";

const log = logger.create("Stock");

export const useStockStore = defineStore("stock", () => {
	// Get event store instance
	const eventsStore = usePOSEventsStore();
	// ========================================================================
	// STATE - Just 2 Maps, that's it!
	// ========================================================================
	const server = ref(new Map()); // item_code -> { qty, warehouse, ts }
	const reserved = ref(new Map()); // item_code -> qty
	const warehouse = ref(null); // Current warehouse
	const refreshing = ref(false); // Loading state

	// ========================================================================
	// GETTERS - Functions that return reactive computed values
	// ========================================================================
	const getDisplayStock = (itemCode) => {
		// Always return the actual calculated stock (can be negative)
		// Display is independent of whether negative stock sales are allowed
		return (server.value.get(itemCode)?.qty || 0) - (reserved.value.get(itemCode) || 0);
	};

	const getStockInfo = (itemCode) => ({
		code: itemCode,
		server: server.value.get(itemCode)?.qty || 0,
		reserved: reserved.value.get(itemCode) || 0,
		display: getDisplayStock(itemCode),
		warehouse: server.value.get(itemCode)?.warehouse || warehouse.value,
	});

	// ========================================================================
	// ACTIONS - Minimal, focused
	// ========================================================================

	// Initialize items from server
	const init = (items) =>
		items?.forEach((item) => {
			const prev = server.value.get(item.item_code);
			server.value.set(item.item_code, {
				qty: item.actual_qty ?? item.stock_qty ?? 0,
				other_qty: item.other_qty ?? prev?.other_qty ?? 0,
				variants_total: item.variants_total ?? prev?.variants_total,
				variants_in_stock: item.variants_in_stock ?? prev?.variants_in_stock,
				warehouse: item.warehouse || prev?.warehouse || warehouse.value,
				ts: Date.now(),
			});
		});

	// Update reservations from cart
	const reserve = (cartItems) => {
		reserved.value.clear();

		// Early return for empty or invalid cart
		if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
			return;
		}

		const variantMeta = new Map();
		cartItems.forEach((cartItem) => {
			// Skip items with missing item_code
			if (!cartItem?.item_code) return;

			const quantity = Number(cartItem.quantity) || 0;
			// Skip items with zero or negative quantity
			if (quantity <= 0) return;

			const factor = Number(cartItem.conversion_factor) || 1;
			const itemCode = cartItem.item_code;

			const current = reserved.value.get(itemCode) || 0;
			reserved.value.set(itemCode, current + quantity * factor);

			if (cartItem.variant_of && !variantMeta.has(itemCode)) {
				variantMeta.set(itemCode, {
					variant_of: cartItem.variant_of,
					original_stock: Number(
						cartItem.original_stock ?? cartItem.actual_qty ?? cartItem.stock_qty ?? 0
					),
				});
			}
		});

		// Propagate physical stock reservations up to parent template cards
		variantMeta.forEach((meta, variantCode) => {
			const reservedVariantQty = reserved.value.get(variantCode) || 0;
			const serverVariantQty = server.value.has(variantCode)
				? Number(server.value.get(variantCode)?.qty || 0)
				: meta.original_stock;
			const consumedPositive = Math.min(reservedVariantQty, Math.max(0, serverVariantQty));
			if (consumedPositive > 0) {
				const tplCurrent = reserved.value.get(meta.variant_of) || 0;
				reserved.value.set(meta.variant_of, tplCurrent + consumedPositive);
			}
		});
	};

	// Apply updates from server or realtime Socket.IO events
	// Called by: POSSale.vue (realtime), various refresh flows
	// Does NOT clear reservations - only updates server stock
	// Pinia reactivity automatically recalculates display stock
	const update = (stockUpdates) =>
		stockUpdates?.forEach((stockUpdate) => {
			const prev = server.value.get(stockUpdate.item_code);
			server.value.set(stockUpdate.item_code, {
				qty: stockUpdate.actual_qty ?? stockUpdate.stock_qty ?? prev?.qty ?? 0,
				other_qty: stockUpdate.other_qty ?? prev?.other_qty ?? 0,
				variants_total: stockUpdate.variants_total ?? prev?.variants_total,
				variants_in_stock: stockUpdate.variants_in_stock ?? prev?.variants_in_stock,
				warehouse: stockUpdate.warehouse || prev?.warehouse || warehouse.value,
				ts: Date.now(),
			});
		});

	// Refresh stock from server (direct API call)
	// Called after invoice submission, manual refresh, or warehouse change
	// Snapshots reservations before fetching to prevent UI flicker
	// This is the fallback when realtime Socket.IO is down
	const refresh = async (itemCodes, targetWarehouse) => {
		if (!targetWarehouse && !warehouse.value) return;

		refreshing.value = true;

		// Snapshot current reservations to restore after fetch
		const reservationSnapshot = new Map(reserved.value);

		try {
			const codesToRefresh = itemCodes || Array.from(server.value.keys());
			if (!codesToRefresh.length) return;

			const response = await Promise.race([
				call("pos_next.api.items.get_stock_quantities", {
					item_codes: JSON.stringify(codesToRefresh),
					warehouse: targetWarehouse || warehouse.value,
				}),
				new Promise((_, reject) => setTimeout(reject, 10000)),
			]);

			const stockData = response?.message || response || [];
			update(stockData);

			// Update IndexedDB and wait for timestamp update
			await offlineWorker.updateStockQuantities(stockData).catch(() => {});

			// Restore reservations after fetch completes
			reserved.value = reservationSnapshot;

			log.success(`Refreshed ${stockData.length} items`);
		} catch (error) {
			log.error("Refresh failed", error);
			// Restore reservations even on error
			reserved.value = reservationSnapshot;
		} finally {
			refreshing.value = false;
		}
	};

	// ========================================================================
	// EVENT LISTENERS - React to settings changes
	// ========================================================================

	// Listen to warehouse changes from settings
	eventsStore.on("settings:warehouse-changed", async ({ newWarehouse }) => {
		log.info(`Event received: Warehouse changed to ${newWarehouse}`);

		// Update warehouse
		warehouse.value = newWarehouse;

		// Refresh all stock for new warehouse
		const itemCodes = Array.from(server.value.keys());
		if (itemCodes.length > 0) {
			log.info(`Refreshing ${itemCodes.length} items for new warehouse`);
			await refresh(itemCodes, newWarehouse);
		}
	});

	return {
		// State
		server,
		reserved,
		warehouse,
		refreshing,

		// Getters
		getDisplayStock,
		getStockInfo,

		// Actions
		init,
		reserve,
		update,
		refresh,
		setWarehouse: (targetWarehouse) => (warehouse.value = targetWarehouse),
		clear: () => reserved.value.clear(),
		reset: () => {
			server.value.clear();
			reserved.value.clear();
		},
	};
});
