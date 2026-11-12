<template>
	<MdxModal
		v-model="show"
		:title="__('Edit Item Details')"
		size="md"
	>
		<!-- Body Content -->
		<div v-if="localItem" class="flex flex-col gap-4">
			<!-- Item Header -->
			<div class="flex items-center gap-3 pb-3.5 border-b border-slate-200">
				<!-- Item Image -->
				<div
					class="w-14 h-14 bg-slate-50 border border-slate-200 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden"
				>
					<img
						v-if="localItem.image"
						:src="localItem.image"
						:alt="localItem.item_name"
						class="w-full h-full object-cover"
					/>
					<svg
						v-else
						class="h-7 w-7 text-slate-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>
				</div>
				<!-- Item Info -->
				<div class="flex-1 min-w-0">
					<h3 class="text-sm font-bold text-slate-900 truncate">
						{{ localItem.item_name }}
					</h3>
					<p class="text-xs font-medium text-slate-500 truncate mt-0.5 tabular-nums">
						{{ formatCurrency(localItem.price_list_rate || localItem.rate) }}
						/
						{{ localItem.stock_uom || __("Nos", null, "UOM") }}
					</p>
				</div>
			</div>

			<!-- Two Column Layout for Quantity, UOM, Rate, Warehouse -->
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
				<!-- Left Column: Quantity and Rate -->
				<div class="flex flex-col gap-3.5">
					<!-- Quantity Control -->
					<div>
						<label class="block text-xs font-bold text-slate-700 mb-1.5 text-start">
							{{ __("Quantity") }}
							<span
								v-if="localItem?.is_resolved_barcode"
								class="ms-1 text-[11px] font-semibold text-amber-600"
								>({{ __("Locked") }})</span
							>
						</label>
						<!-- For serial items, quantity is read-only (controlled by serial list) -->
						<div
							v-if="localItem?.has_serial_no && localSerials.length > 0"
							class="w-full h-9 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-center"
						>
							<span class="text-sm font-bold text-slate-700 tabular-nums">{{
								localSerials.length
							}}</span>
						</div>
						<!-- For resolved barcode items, quantity is read-only -->
						<div
							v-else-if="localItem?.is_resolved_barcode"
							class="w-full h-9 border border-amber-200 rounded-xl bg-amber-50 flex items-center justify-center"
						>
							<span class="text-sm font-bold text-amber-700 tabular-nums">{{
								localQuantity
							}}</span>
						</div>
						<!-- For non-serial items, show quantity controls -->
						<div
							v-else
							class="w-full h-9 border border-slate-200 rounded-xl bg-white flex items-center overflow-hidden"
						>
							<button
								type="button"
								@click="decrementQuantity"
								class="w-9 h-full bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 font-bold text-base transition-colors flex items-center justify-center border-e border-slate-200 touch-manipulation"
							>
								−
							</button>
							<div class="flex-1 h-full flex items-center justify-center px-2">
								<input
									v-model.number="localQuantity"
									type="number"
									min="0.0001"
									step="any"
									inputmode="decimal"
									class="w-full text-center border-0 text-sm font-bold text-slate-900 focus:outline-none focus:ring-0 bg-transparent tabular-nums"
									@input="handleQuantityInput"
									@blur="handleQuantityBlur"
									@keydown.enter="$event.target.blur()"
								/>
							</div>
							<button
								type="button"
								@click="incrementQuantity"
								class="w-9 h-full bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 font-bold text-base transition-colors flex items-center justify-center border-s border-slate-200 touch-manipulation"
							>
								+
							</button>
						</div>
					</div>

					<!-- Rate -->
					<div>
						<label class="block text-xs font-bold text-slate-700 mb-1.5 text-start">{{
							__("Rate")
						}}</label>
						<div class="relative h-9">
							<span
								class="absolute inset-y-0 start-0 ps-3 flex items-center text-slate-400 text-xs font-bold"
							>
								{{ currencySymbol }}
							</span>
							<input
								v-model.number="localRate"
								type="number"
								min="0"
								step="0.01"
								:readonly="!canEditRate"
								:class="
									canEditRate
										? 'bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
										: 'bg-slate-50 text-slate-500 cursor-not-allowed'
								"
								class="w-full h-9 border border-slate-200 rounded-xl ps-10 pe-3 text-sm font-bold text-slate-900 tabular-nums"
								:title="rateEditDisabledReason"
								@input="calculateTotals"
							/>
						</div>
						<!-- Compact warning when rate editing disabled due to pricing rules -->
						<p
							v-if="hasPricingRules && settingsStore.allowUserToEditRate"
							class="mt-1 text-[11px] text-amber-600 flex items-center gap-1"
						>
							<FeatherIcon name="lock" class="w-3 h-3" />
							{{ __("Locked (offer applied)") }}
						</p>
					</div>
				</div>

				<!-- Right Column: UOM and Warehouse -->
				<div class="flex flex-col gap-3.5">
					<!-- UOM Selector -->
					<div>
						<label class="block text-xs font-bold text-slate-700 mb-1.5 text-start">
							{{ __("UOM") }}
							<span
								v-if="localItem?.is_resolved_barcode"
								class="ms-1 text-[11px] font-semibold text-amber-600"
								>({{ __("Locked") }})</span
							>
						</label>
						<!-- For resolved barcode items, UOM is read-only -->
						<div
							v-if="localItem?.is_resolved_barcode"
							class="w-full h-9 border border-amber-200 rounded-xl bg-amber-50 flex items-center justify-center"
						>
							<span class="text-sm font-bold text-amber-700">{{ localUom }}</span>
						</div>
						<MdxSelect
							v-else
							v-model="localUom"
							:options="uomOptions"
							size="sm"
							:showSearch="false"
							:teleport="true"
						/>
					</div>

					<!-- Warehouse Selector -->
					<div>
						<label class="block text-xs font-bold text-slate-700 mb-1.5 text-start">{{
							__("Warehouse")
						}}</label>
						<MdxSelect
							v-model="localWarehouse"
							:options="warehouseOptions"
							size="sm"
							:showSearch="warehouseOptions.length > 5"
							:teleport="true"
							@update:modelValue="handleWarehouseChange"
						/>
					</div>
				</div>
			</div>

			<!-- Serial Numbers Section (only for serial items) -->
			<div
				v-if="localItem?.has_serial_no && localSerials.length > 0"
				class="border-t border-slate-200 pt-3.5"
			>
				<div class="flex items-center justify-between mb-2">
					<label class="block text-xs font-bold text-slate-700 text-start">
						{{ __("Serial Numbers") }}
					</label>
					<MdxBadge variant="info" size="sm">{{ localSerials.length }}</MdxBadge>
				</div>
				<div class="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
					<div
						v-for="(serial, index) in localSerials"
						:key="serial"
						class="flex items-center justify-between gap-2 p-2 bg-slate-50 border border-slate-200/80 rounded-xl"
					>
						<div class="flex items-center gap-2">
							<span
								class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-white text-[11px] font-bold"
							>
								{{ index + 1 }}
							</span>
							<span class="text-xs font-semibold text-slate-900 font-mono">{{
								serial
							}}</span>
						</div>
						<button
							type="button"
							@click="removeSerial(serial)"
							:disabled="localSerials.length <= 1"
							class="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							:title="
								localSerials.length <= 1
									? __('Cannot remove last serial')
									: __('Remove serial')
							"
						>
							<svg
								class="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>
				</div>
			</div>

			<!-- Item Discount Section (only if allowed by POS Profile) -->
			<div
				v-if="settingsStore.allowItemDiscount"
				class="border-t border-slate-200 pt-3.5"
			>
				<label class="block text-xs font-bold text-slate-700 mb-2 text-start">{{
					__("Item Discount")
				}}</label>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<!-- Discount Type -->
					<div>
						<label class="block text-[11px] font-semibold text-slate-600 mb-1 text-start">{{
							__("Discount Type")
						}}</label>
						<MdxSelect
							v-model="discountType"
							:options="discountTypeOptions"
							size="sm"
							:showSearch="false"
							:teleport="true"
							@update:modelValue="handleDiscountTypeChange"
						/>
					</div>
					<!-- Discount Value -->
					<div>
						<label class="block text-[11px] font-semibold text-slate-600 mb-1 text-start">{{
							discountType === "percentage" ? __("Percentage") : __("Amount")
						}}</label>
						<div class="relative">
							<input
								v-model.number="discountValue"
								type="number"
								min="0"
								:max="discountType === 'percentage' ? 100 : undefined"
								step="0.01"
								class="w-full h-9 border border-slate-200 rounded-xl px-3 pe-8 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 tabular-nums"
								@input="calculateDiscount"
							/>
							<span
								class="absolute inset-y-0 end-0 pe-3 flex items-center text-slate-400 text-xs font-bold"
							>
								{{ discountType === "percentage" ? "%" : currencySymbol }}
							</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Totals -->
			<div class="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col gap-1.5">
				<div class="flex items-center justify-between text-xs">
					<span class="text-slate-500 font-medium">{{ __("Subtotal:") }}</span>
					<span class="font-bold text-slate-800 tabular-nums">{{
						formatCurrency(calculatedSubtotal)
					}}</span>
				</div>
				<div
					v-if="calculatedDiscount > 0"
					class="flex items-center justify-between text-xs text-red-600"
				>
					<span class="font-medium">{{ __("Discount:") }}</span>
					<span class="font-bold tabular-nums">-{{ formatCurrency(calculatedDiscount) }}</span>
				</div>
				<div
					class="flex items-center justify-between pt-2 mt-0.5 border-t border-slate-200"
				>
					<span class="text-sm font-extrabold text-slate-900">{{ __("Total:") }}</span>
					<span class="text-base font-black text-slate-900 tabular-nums">{{
						formatCurrency(calculatedTotal)
					}}</span>
				</div>
			</div>
		</div>

		<template #footer>
			<div class="flex items-center justify-end gap-2 w-full">
				<MdxButton variant="secondary" @click="cancel">
					{{ __("Cancel") }}
				</MdxButton>
				<MdxButton
					variant="primary"
					:loading="isCheckingStock"
					:disabled="!hasStock || isCheckingStock"
					@click="updateItem"
				>
					<span v-if="isCheckingStock">{{ __("Checking Stock...") }}</span>
					<span v-else-if="!hasStock">{{ __("No Stock Available") }}</span>
					<span v-else>{{ __("Update Item") }}</span>
				</MdxButton>
			</div>
		</template>
	</MdxModal>
</template>

<script setup>
import { useToast } from "@/composables/useToast";
import { usePOSSettingsStore } from "@/stores/posSettings";
import { useSerialNumberStore } from "@/stores/serialNumber";
import { getItemStock } from "@/utils/stockValidator";
import {
	formatCurrency as formatCurrencyUtil,
	getCurrencySymbol,
	roundCurrency,
} from "@/utils/currency";
import { FeatherIcon, createResource } from "frappe-ui";
import { MdxBadge, MdxButton, MdxModal, MdxSelect } from "mdx_ui";
import { computed, ref, watch } from "vue";

const { showSuccess, showError, showWarning } = useToast();
const settingsStore = usePOSSettingsStore();
const serialStore = useSerialNumberStore();

const props = defineProps({
	modelValue: Boolean,
	item: Object,
	warehouses: {
		type: Array,
		default: () => [],
	},
	currency: {
		type: String,
		default: "EGP",
	},
});

const emit = defineEmits(["update:modelValue", "update-item"]);

// Local state
const localItem = ref(null);
const localQuantity = ref(1);
const localUom = ref("");
const localRate = ref(0);
const localWarehouse = ref("");
const discountType = ref("percentage");
const discountValue = ref(0);
const calculatedSubtotal = ref(0);
const calculatedDiscount = ref(0);
const calculatedTotal = ref(0);
const hasStock = ref(true);
const isCheckingStock = ref(false);
const isInitializingItem = ref(false);
const uomRateRequestId = ref(0);
const localSerials = ref([]); // List of serial numbers for this item
const removedSerials = ref([]); // Track serials removed during this edit session
const originalSerials = ref([]); // Original serials when dialog opened
const originalPriceListRate = ref(0); // Original price_list_rate when dialog opened (for rate edit validation)

const getItemDetailsResource = createResource({
	url: "pos_next.api.items.get_item_details",
	auto: false,
});

const show = computed({
	get: () => props.modelValue,
	set: (val) => emit("update:modelValue", val),
});

const availableUoms = computed(() => {
	if (!localItem.value || !localItem.value.item_uoms) return [];
	return localItem.value.item_uoms.filter((u) => u.uom !== localItem.value.stock_uom);
});

const currencySymbol = computed(() => getCurrencySymbol(props.currency));

// Check if item has pricing rules applied (promotional offers)
const hasPricingRules = computed(() => {
	if (!localItem.value) return false;
	return Boolean(localItem.value.pricing_rules) && localItem.value.pricing_rules.length > 0;
});

// Rate editing is allowed only if:
// 1. POS Settings allows rate editing AND
// 2. Item does NOT have pricing rules (promotional offers) applied
const canEditRate = computed(() => {
	return settingsStore.allowUserToEditRate && !hasPricingRules.value;
});

// Tooltip message for why rate editing is disabled
const rateEditDisabledReason = computed(() => {
	if (!settingsStore.allowUserToEditRate) {
		return __("Rate editing is disabled");
	}
	if (hasPricingRules.value) {
		return __("Locked (offer applied)");
	}
	return "";
});

// Options for SelectInput components
const uomOptions = computed(() => {
	if (!localItem.value) return [];
	const options = [{ value: localItem.value.stock_uom, label: localItem.value.stock_uom }];
	if (availableUoms.value.length > 0) {
		availableUoms.value.forEach((uomData) => {
			options.push({ value: uomData.uom, label: uomData.uom });
		});
	}
	return options;
});

const warehouseOptions = computed(() => {
	if (props.warehouses.length > 0) {
		return props.warehouses.map((w) => ({
			value: w.name,
			label: w.warehouse || w.name,
		}));
	}
	return [{ value: localWarehouse.value, label: localWarehouse.value || __("Default") }];
});

const discountTypeOptions = computed(() => [
	{ value: "percentage", label: __("Percentage (%)") },
	{ value: "amount", label: __("Amount") },
]);

// Initialize local state when item changes
watch(
	() => props.item,
	(newItem) => {
		if (newItem) {
			isInitializingItem.value = true;
			localItem.value = { ...newItem };
			localQuantity.value = newItem.quantity || 1;
			localUom.value = newItem.uom || newItem.stock_uom || __("Nos");
			localRate.value = newItem.rate || 0;
			// Store original price_list_rate for rate edit validation
			originalPriceListRate.value = newItem.price_list_rate || newItem.rate || 0;
			localWarehouse.value = newItem.warehouse || props.warehouses[0]?.name || "";

			// Initialize serial numbers
			if (newItem.has_serial_no && newItem.serial_no) {
				const serials = newItem.serial_no.split("\n").filter((s) => s.trim());
				localSerials.value = [...serials];
				originalSerials.value = [...serials]; // Keep original for cancel
				removedSerials.value = []; // Reset removed serials tracker
				// For serial items, quantity must match serial count
				localQuantity.value = serials.length;
			} else {
				localSerials.value = [];
				originalSerials.value = [];
				removedSerials.value = [];
			}

			// Initialize discount
			if (newItem.discount_percentage && newItem.discount_percentage > 0) {
				discountType.value = "percentage";
				discountValue.value = newItem.discount_percentage;
			} else if (newItem.discount_amount && newItem.discount_amount > 0) {
				discountType.value = "amount";
				discountValue.value = newItem.discount_amount;
			} else {
				discountType.value = "percentage";
				discountValue.value = 0;
			}

			// Reset stock check state
			hasStock.value = true;
			isCheckingStock.value = false;

			calculateTotals();
			isInitializingItem.value = false;
		}
	},
	{ immediate: true }
);

watch(localUom, (newUom, oldUom) => {
	if (!newUom || newUom === oldUom || isInitializingItem.value) return;
	handleUomChange(newUom);
});

/**
 * Intelligently determine the step size based on current quantity
 * - Whole numbers (1, 2, 3): step by 1
 * - Multiples of 0.5 (1.5, 2.5): step by 0.5
 * - Multiples of 0.25 (0.25, 0.75): step by 0.25
 * - Multiples of 0.1 (0.1, 0.3): step by 0.1
 * - Other decimals: step by 0.01
 */
function getSmartStep(quantity) {
	// Check if it's a whole number
	if (quantity === Math.floor(quantity)) {
		return 1;
	}

	// Round to 4 decimal places to avoid floating point errors
	const rounded = Math.round(quantity * 10000) / 10000;

	// Check if it's a multiple of 0.5
	if (Math.abs(rounded % 0.5) < 0.0001) {
		return 0.5;
	}

	// Check if it's a multiple of 0.25
	if (Math.abs(rounded % 0.25) < 0.0001) {
		return 0.25;
	}

	// Check if it's a multiple of 0.1
	if (Math.abs(rounded % 0.1) < 0.0001) {
		return 0.1;
	}

	// For other decimals, use 0.01 for fine control
	return 0.01;
}

function incrementQuantity() {
	const step = getSmartStep(localQuantity.value);
	localQuantity.value = Math.round((localQuantity.value + step) * 10000) / 10000;
	calculateTotals();
}

function decrementQuantity() {
	const step = getSmartStep(localQuantity.value);
	const newQty = Math.round((localQuantity.value - step) * 10000) / 10000;

	if (newQty > 0) {
		localQuantity.value = newQty;
		calculateTotals();
	}
}

function handleQuantityInput() {
	// Allow any value during typing, just recalculate totals
	// Don't validate or reset - let user type freely
	if (localQuantity.value > 0 && !isNaN(localQuantity.value)) {
		calculateTotals();
	}
}

function handleQuantityBlur() {
	// Validate and fix the quantity when user is done editing (leaves the field)
	if (!localQuantity.value || localQuantity.value <= 0 || isNaN(localQuantity.value)) {
		// If invalid, reset to 1
		localQuantity.value = 1;
	} else {
		// Round to 4 decimal places for consistency
		localQuantity.value = Math.round(localQuantity.value * 10000) / 10000;
	}
	calculateTotals();
}

function getConversionFactorForUom(uom) {
	if (!localItem.value) return 1;
	if (uom === localItem.value.stock_uom) return 1;
	const uomData = localItem.value.item_uoms?.find((itemUom) => itemUom.uom === uom);
	return uomData?.conversion_factor || 1;
}

async function getRateForUom(uom) {
	if (!localItem.value) return 0;

	// Primary source: fetch exact price_list_rate for selected UOM from backend.
	const posProfile = settingsStore.settings?.pos_profile || localItem.value.pos_profile;
	if (localItem.value.item_code && posProfile) {
		try {
			const itemDetails = await getItemDetailsResource.submit({
				item_code: localItem.value.item_code,
				pos_profile: posProfile,
				qty: localQuantity.value || 1,
				uom,
			});
			const serverRate = Number(itemDetails?.price_list_rate ?? itemDetails?.rate);
			if (!isNaN(serverRate) && serverRate > 0) {
				return serverRate;
			}
		} catch (error) {
			console.error("Error fetching UOM item price rate:", error);
		}
	}

	// Secondary source: preloaded UOM prices on item payload.
	if (localItem.value.uom_prices?.[uom] !== undefined) {
		return Number(localItem.value.uom_prices[uom]) || 0;
	}

	// Final fallback: keep current known item rate (no conversion-based pricing).
	return Number(localItem.value.price_list_rate || localItem.value.rate || localRate.value || 0);
}

async function handleUomChange(newUom) {
	const selectedUom = newUom || localUom.value;
	if (!localItem.value || !selectedUom) {
		calculateTotals();
		return;
	}

	const requestId = ++uomRateRequestId.value;
	const fetchedRate = await getRateForUom(selectedUom);
	// Ignore stale responses if user changes UOM repeatedly.
	if (requestId !== uomRateRequestId.value) return;

	const newRate = roundCurrency(fetchedRate);
	const newConversionFactor = getConversionFactorForUom(selectedUom);

	// Keep local state consistent so update payload has correct UOM pricing metadata.
	localRate.value = newRate;
	originalPriceListRate.value = newRate;
	localItem.value.uom = selectedUom;
	localItem.value.conversion_factor = newConversionFactor;
	localItem.value.rate = newRate;
	localItem.value.price_list_rate = newRate;

	calculateTotals();
}

async function handleWarehouseChange() {
	if (!localItem.value || !localWarehouse.value) return;

	isCheckingStock.value = true;
	try {
		// Check stock availability in the new warehouse
		const availableStock = await getItemStock(localItem.value.item_code, localWarehouse.value);
		const enforceStock = settingsStore.shouldEnforceStockValidation();

		if (availableStock <= 0) {
			hasStock.value = !enforceStock;
			if (enforceStock) {
				showError(
					__('"{0}" is not available in warehouse "{1}". Please select another warehouse.', [
						localItem.value.item_name,
						localWarehouse.value,
					])
				);
			} else {
				showWarning(
					__('"{0}" tiene stock {1} en "{2}" (se venderá en negativo).', [
						localItem.value.item_name,
						availableStock,
						localWarehouse.value,
					]),
					__("Aviso de stock")
				);
			}
		} else if (availableStock < localQuantity.value) {
			hasStock.value = !enforceStock;
			showWarning(
				__('Only {0} units of "{1}" available in "{2}". Current quantity: {3}', [
					availableStock,
					localItem.value.item_name,
					localWarehouse.value,
					localQuantity.value,
				])
			);
		} else {
			hasStock.value = true;
			showSuccess(
				__('{0} units available in "{1}"', [availableStock, localWarehouse.value])
			);
		}
	} catch (error) {
		console.error("Error checking warehouse stock:", error);
		hasStock.value = true; // Allow update if stock check fails
	} finally {
		isCheckingStock.value = false;
	}
}

function handleDiscountTypeChange() {
	// Reset discount value when type changes
	discountValue.value = 0;
	calculateTotals();
}

function calculateDiscount() {
	// Round to currency precision to prevent floating point precision issues (e.g., 10.000000000000002)
	if (
		discountValue.value !== null &&
		discountValue.value !== undefined &&
		!isNaN(discountValue.value)
	) {
		discountValue.value = roundCurrency(discountValue.value);
	}

	if (discountType.value === "percentage") {
		// Ensure percentage doesn't exceed 100
		if (discountValue.value > 100) {
			discountValue.value = 100;
		}
		calculatedDiscount.value = Math.floor(
			(calculatedSubtotal.value * discountValue.value) / 100
		);
	} else {
		// Ensure amount doesn't exceed subtotal
		if (discountValue.value > calculatedSubtotal.value) {
			discountValue.value = Math.floor(calculatedSubtotal.value);
		}
		calculatedDiscount.value = Math.floor(discountValue.value);
	}
	calculatedTotal.value = roundCurrency(calculatedSubtotal.value - calculatedDiscount.value);
}

function calculateTotals() {
	calculatedSubtotal.value = localRate.value * localQuantity.value;
	calculateDiscount();
}

function removeSerial(serialNo) {
	// Remove from local list
	const index = localSerials.value.indexOf(serialNo);
	if (index > -1) {
		localSerials.value.splice(index, 1);
		// Track removed serial (will be returned to cache on confirm)
		removedSerials.value.push(serialNo);
		// Update quantity to match serial count
		localQuantity.value = localSerials.value.length;
		calculateTotals();
	}
}

function formatCurrency(amount) {
	return formatCurrencyUtil(Number.parseFloat(amount || 0), props.currency);
}

function updateItem() {
	// Check if rate was manually edited
	const isRateManuallyEdited = localRate.value !== originalPriceListRate.value;

	// ========================================================================
	// RATE EDIT VALIDATION
	// ========================================================================
	if (settingsStore.allowUserToEditRate && isRateManuallyEdited) {
		// Validate rate is positive
		if (localRate.value <= 0) {
			showError(__("Rate must be greater than zero"));
			return;
		}

		// Validate against max discount if rate was reduced
		const maxDiscount = settingsStore.maxDiscountAllowed;
		if (maxDiscount > 0 && localRate.value < originalPriceListRate.value) {
			const discountPercent =
				((originalPriceListRate.value - localRate.value) / originalPriceListRate.value) *
				100;
			const roundedDiscount = Math.round(discountPercent * 100) / 100;

			if (roundedDiscount > maxDiscount) {
				showError(
					__("Rate reduction of {0}% exceeds maximum allowed discount of {1}%", [
						roundedDiscount.toFixed(2),
						maxDiscount,
					])
				);
				return;
			}
		}
	}

	const updatedItem = {
		...localItem.value,
		quantity: localQuantity.value,
		uom: localUom.value,
		rate: localRate.value,
		// Preserve price_list_rate for reference (original price before any manual edits)
		price_list_rate: originalPriceListRate.value,
		warehouse: localWarehouse.value,
		discount_percentage: discountType.value === "percentage" ? discountValue.value : 0,
		discount_amount: discountType.value === "amount" ? discountValue.value : 0,
		// Track manual rate edits for audit logging
		is_rate_manually_edited: isRateManuallyEdited ? 1 : 0,
		original_rate: isRateManuallyEdited ? originalPriceListRate.value : null,
	};

	// Update serial numbers if item has serials
	if (localItem.value.has_serial_no) {
		updatedItem.serial_no = localSerials.value.join("\n");
		updatedItem.quantity = localSerials.value.length;

		// Return removed serials to cache now that update is confirmed
		if (removedSerials.value.length > 0) {
			serialStore.returnSerials(localItem.value.item_code, removedSerials.value);
		}
	}

	emit("update-item", updatedItem);
	show.value = false;
}

function cancel() {
	show.value = false;
}
</script>

<style scoped>
/* Hide number input spinners */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
	appearance: none;
	-webkit-appearance: none;
	margin: 0;
}

input[type="number"] {
	appearance: textfield;
	-moz-appearance: textfield;
}

/* Use CSS custom properties from index.css for consistent z-index layering */
.z-dialog-overlay {
	z-index: var(--z-dialog-overlay, 400);
}

.z-dialog-content {
	z-index: var(--z-dialog-content, 500);
}
</style>
