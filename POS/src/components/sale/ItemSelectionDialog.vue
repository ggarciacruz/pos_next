<template>
	<MdxModal v-model="isOpen" :title="dialogTitle" size="md">
		<div class="flex flex-col gap-4">
			<!-- Tarjeta Unificada de Producto / Variante Activa -->
			<div
				v-if="item"
				class="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl"
			>
				<div class="flex items-center gap-3 min-w-0 flex-1">
					<div
						class="w-14 h-14 bg-white border border-slate-200/80 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
					>
						<img
							v-if="matchedVariant?.data?.image || item.image"
							:src="matchedVariant?.data?.image || item.image"
							loading="lazy"
							:alt="matchedVariant?.label || item.item_name"
							class="w-full h-full object-contain"
						/>
						<svg
							v-else
							class="h-6 w-6 text-slate-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
							/>
						</svg>
					</div>
					<div class="flex-1 min-w-0">
						<h3 class="text-sm font-bold text-slate-900 truncate">
							{{ matchedVariant?.label || item.item_name }}
						</h3>
						<p class="text-xs font-medium text-slate-500 truncate">
							{{ matchedVariant?.description || item.item_code }}
						</p>
					</div>
				</div>

				<!-- Precio y Stock integrados en la tarjeta superior (Modo Variante) -->
				<div
					v-if="mode === 'variant' && matchedVariant"
					class="flex flex-col items-end flex-shrink-0 gap-1"
				>
					<span class="text-base font-black text-slate-900 tabular-nums">
						{{ formatCurrency((matchedVariant.rate || 0) * quantity) }}
					</span>
					<MdxBadge
						:variant="
							(matchedVariant.stock ?? matchedVariant.data?.actual_qty ?? 0) > 0
								? 'success'
								: 'danger'
						"
						size="sm"
					>
						{{
							__("Stock: {0}", [
								matchedVariant.stock ?? matchedVariant.data?.actual_qty ?? 0,
							])
						}}
					</MdxBadge>
				</div>
			</div>

			<!-- Loading State (mdx_ui) -->
			<MdxLoadingSpinner
				v-if="loading"
				size="md"
				:text="__('Loading options...')"
			/>

			<!-- Variant Options with Attribute Selection -->
			<div
				v-else-if="mode === 'variant' && options.length > 0"
				class="flex flex-col gap-4"
			>
				<!-- Group variants by attributes -->
				<div
					v-for="(values, attrName) in variantAttributesMap"
					:key="attrName"
					class="flex flex-col gap-2"
				>
					<label
						class="text-[11px] font-black text-slate-500 uppercase tracking-wider text-start block"
					>
						{{ attrName }}
					</label>
					<div class="flex flex-wrap gap-2">
						<button
							v-for="value in values"
							:key="value"
							type="button"
							@click="selectAttribute(attrName, value)"
							:class="[
								'px-3.5 py-2 rounded-lg border text-xs font-bold transition-all touch-manipulation',
								selectedAttributes[attrName] === value
									? 'border-blue-600 bg-blue-600 text-white shadow-sm'
									: 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
							]"
						>
							{{ value }}
						</button>
					</div>
				</div>

				<!-- Quantity Control for Variant (MdxQuantityStepper) -->
				<MdxQuantityStepper
					v-if="matchedVariant"
					v-model="quantity"
					:min="1"
					:uom="matchedVariant.data?.stock_uom || item?.stock_uom"
					:label="__('Quantity')"
					:show-quick-adds="false"
				/>

				<!-- Warning if combination not found -->
				<div
					v-else-if="allAttributesSelected"
					class="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2"
				>
					<MdxBadge variant="warning" size="sm">
						{{ __("This combination is not available") }}
					</MdxBadge>
				</div>
			</div>

			<!-- UOM Options (Fast Cashier UI) -->
			<div v-else-if="mode === 'uom' && options.length > 0" class="flex flex-col gap-4">
				<!-- UOM Selection Buttons -->
				<div>
					<label
						class="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2 text-start"
					>
						{{ __("Unit of Measure") }}
					</label>
					<div
						class="grid gap-2"
						:class="options.length <= 2 ? 'grid-cols-2' : 'grid-cols-3'"
					>
						<button
							v-for="(option, index) in options"
							:key="index"
							type="button"
							@click="selectOption(option)"
							:class="[
								'px-4 py-3 rounded-xl border font-bold text-sm transition-all touch-manipulation flex flex-col items-center justify-center min-h-[60px]',
								selectedOption === option
									? 'border-blue-600 bg-blue-600 text-white shadow-sm'
									: 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
							]"
						>
							<span>{{ option.label }}</span>
							<span
								:class="[
									'text-xs mt-0.5 font-semibold',
									selectedOption === option ? 'text-blue-100' : 'text-slate-500',
								]"
							>
								{{ formatCurrency(option.rate || 0) }}
							</span>
						</button>
					</div>
				</div>

				<!-- Quantity Control for UOM (MdxQuantityStepper) -->
				<MdxQuantityStepper
					v-model="quantity"
					:min="1"
					:uom="selectedOption?.uom || item?.stock_uom"
					:label="__('Quantity')"
					:show-quick-adds="true"
					:quick-adds="[1, 5, 10, 20]"
				/>

				<!-- Price Summary -->
				<div
					class="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between"
				>
					<div>
						<p class="text-xs font-bold text-slate-600 uppercase tracking-wider">
							{{ __("Total") }}
						</p>
						<p class="text-xs font-medium text-slate-500 mt-0.5">
							{{ quantity }} ×
							{{ formatCurrency(selectedOption?.rate || options[0]?.rate || 0) }}
						</p>
					</div>
					<p class="text-xl font-black text-slate-900 tabular-nums">
						{{
							formatCurrency(
								(selectedOption?.rate || options[0]?.rate || 0) * quantity
							)
						}}
					</p>
				</div>

				<!-- Stock Warning -->
				<div v-if="stockWarning" class="flex items-center justify-center">
					<MdxBadge variant="warning" size="md">
						{{ stockWarning }}
					</MdxBadge>
				</div>
			</div>

			<!-- No Options -->
			<div v-else class="text-center py-8">
				<div
					class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-slate-100 mb-3"
				>
					<svg
						class="h-6 w-6 text-slate-500"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
				</div>
				<p class="text-sm font-bold text-slate-900">
					{{
						mode === "variant"
							? __("No Variants Available")
							: __("No Options Available")
					}}
				</p>
				<p v-if="mode === 'variant'" class="text-xs text-slate-500 mt-2">
					<TranslatedHTML
						:inner="
							__(
								'This item template &lt;strong&gt;{0}&lt;strong&gt; has no variants created yet.',
								[item?.item_name]
							)
						"
					/>
				</p>
				<p v-else class="text-xs text-slate-500 mt-2">
					{{ __("No additional units of measurement configured for this item.") }}
				</p>
				<div v-if="mode === 'variant'" class="mt-4">
					<p class="text-xs text-slate-600 mb-2">{{ __("To create variants:") }}</p>
					<ol
						class="text-xs text-slate-600 text-start max-w-xs mx-auto flex flex-col gap-1"
					>
						<TranslatedHTML
							:tag="'li'"
							:inner="
								__(
									'1. Go to &lt;strong&gt;Item Master&lt;strong&gt; → &lt;strong&gt;{0}&lt;strong&gt;',
									[item?.item_code]
								)
							"
						/>
						<TranslatedHTML
							:tag="'li'"
							:inner="
								__('2. Click &lt;strong&gt;&quot;Make Variants&quot;&lt;strong&gt; button')
							"
						/>
						<li>{{ __("3. Select attribute combinations") }}</li>
						<TranslatedHTML
							:tag="'li'"
							:inner="__('4. Click &lt;strong&gt;&quot;Create&quot;&lt;strong&gt;')"
						/>
					</ol>
				</div>
			</div>
		</div>

		<template #footer>
			<div class="flex gap-2.5 w-full">
				<MdxButton class="flex-1" variant="secondary" @click="cancel">
					{{ __("Cancel") }}
				</MdxButton>
				<MdxButton
					class="flex-1"
					variant="primary"
					:disabled="!selectedOption"
					@click="confirm"
				>
					{{ confirmButtonText }}
				</MdxButton>
			</div>
		</template>
	</MdxModal>
</template>

<script setup>
import { DEFAULT_CURRENCY, formatCurrency as formatCurrencyUtil } from "@/utils/currency";
import { createResource } from "frappe-ui";
import {
	MdxBadge,
	MdxButton,
	MdxLoadingSpinner,
	MdxModal,
	MdxQuantityStepper,
} from "mdx_ui";
import { computed, ref, watch } from "vue";
import TranslatedHTML from "../common/TranslatedHTML.vue";
import { offlineState } from "@/utils/offline/offlineState";
import { getCachedVariants, cacheItems } from "@/utils/offline/items";

const props = defineProps({
	modelValue: Boolean,
	item: Object,
	mode: {
		type: String, // 'uom' or 'variant'
		default: "uom",
	},
	posProfile: String,
	currency: {
		type: String,
		default: DEFAULT_CURRENCY,
	},
});

const emit = defineEmits(["update:modelValue", "option-selected"]);

const isOpen = computed({
	get: () => props.modelValue,
	set: (value) => emit("update:modelValue", value),
});

const loading = ref(false);
const options = ref([]);
const selectedOption = ref(null);
const quantity = ref(1);
const selectedAttributes = ref({}); // For variant attribute selection

// Computed properties for dialog customization
const dialogTitle = computed(() => {
	return props.mode === "variant" ? __("Select Item Variant") : __("Select Unit of Measure");
});

const confirmButtonText = computed(() => {
	return props.mode === "variant" ? __("Add to Cart") : __("Add to Cart");
});

// Computed: Stock warning when quantity exceeds available stock
const stockWarning = computed(() => {
	if (props.mode !== "uom" || !selectedOption.value) return null;

	const availableStock =
		selectedOption.value.stock_qty ?? selectedOption.value.actual_qty ?? null;
	if (availableStock === null) return null;

	if (quantity.value > availableStock) {
		return __("Requested quantity ({0}) exceeds available stock ({1})", [
			quantity.value,
			Math.floor(availableStock),
		]);
	}
	return null;
});

// Computed: Build a map of all available attribute values
const variantAttributesMap = computed(() => {
	if (props.mode !== "variant" || options.value.length === 0) return {};

	const attrMap = {};
	options.value.forEach((option) => {
		Object.entries(option.attributes || {}).forEach(([key, value]) => {
			if (!attrMap[key]) {
				attrMap[key] = new Set();
			}
			attrMap[key].add(value);
		});
	});

	// Convert Sets to Arrays preserving configured attribute order
	const result = {};
	Object.keys(attrMap).forEach((key) => {
		result[key] = Array.from(attrMap[key]);
	});

	return result;
});

// Computed: Check if all attributes are selected
const allAttributesSelected = computed(() => {
	const attrKeys = Object.keys(variantAttributesMap.value);
	return attrKeys.length > 0 && attrKeys.every((key) => selectedAttributes.value[key]);
});

// Computed: Find variant that matches selected attributes
const matchedVariant = computed(() => {
	if (!allAttributesSelected.value) return null;

	return options.value.find((option) => {
		return Object.entries(selectedAttributes.value).every(([key, value]) => {
			return option.attributes[key] === value;
		});
	});
});

/**
 * Transform raw variant data into option format for the UI
 */
function mapVariantsToOptions(variants) {
	return variants.map((v) => ({
		type: "variant",
		item_code: v.item_code,
		label: v.item_name,
		description: v.item_code,
		attributes: v.attributes || {},
		rate: v.rate || v.price_list_rate || 0,
		priceLabel: __("per {0}", [v.stock_uom]),
		stock: v.actual_qty ?? 0,
		data: v,
	}));
}

function autoSelectFirstVariant() {
	if (options.value.length > 0 && Object.keys(selectedAttributes.value).length === 0) {
		const firstWithStock = options.value.find((opt) => (opt.stock ?? 0) > 0) || options.value[0];
		if (firstWithStock?.attributes) {
			selectedAttributes.value = { ...firstWithStock.attributes };
		}
	}
}

/**
 * Load variants from IndexedDB cache (for offline mode or API fallback)
 */
async function loadVariantsFromCache() {
	try {
		const cachedVariants = await getCachedVariants(props.item?.item_code);
		options.value = cachedVariants?.length > 0 ? mapVariantsToOptions(cachedVariants) : [];
		autoSelectFirstVariant();
	} catch (error) {
		console.error("Error loading variants from cache:", error);
		options.value = [];
	} finally {
		loading.value = false;
	}
}

// Resource for fetching variants from API
const variantsResource = createResource({
	url: "pos_next.api.items.get_item_variants",
	makeParams() {
		return {
			template_item: props.item?.item_code,
			pos_profile: props.posProfile,
		};
	},
	auto: false,
	async onSuccess(data) {
		const variants = data?.message || data || [];
		options.value = mapVariantsToOptions(variants);
		autoSelectFirstVariant();
		loading.value = false;

		// Cache variants for offline use
		if (variants.length > 0) {
			cacheItems(variants).catch((err) => console.error("Error caching variants:", err));
		}
	},
	async onError(error) {
		console.error("Error loading variants:", error);
		// Try cache as fallback (user might have just gone offline)
		await loadVariantsFromCache();
	},
});

// Load options when dialog opens
watch(
	() => props.modelValue,
	(isOpen) => {
		if (isOpen && props.item) {
			loadOptions();
		}
	},
	{ immediate: true }
);

// Watch mode and item changes to reload options
watch([() => props.mode, () => props.item], ([, newItem]) => {
	if (props.modelValue && newItem) {
		loadOptions();
	}
});

/**
 * Load options based on mode (variant or UOM)
 */
async function loadOptions() {
	selectedOption.value = null;
	quantity.value = props.item.resolved_qty || 1;
	selectedAttributes.value = {}; // Reset attribute selection

	if (props.mode === "variant") {
		loading.value = true;

		if (offlineState.isOffline) {
			await loadVariantsFromCache();
		} else {
			variantsResource.reload();
		}
	} else {
		// Load UOM options
		options.value = buildUomOptions();
		if (options.value.length > 0) {
			// Check if item has a single barcode UOM to auto-select
			const barcodeUoms = props.item?.barcode_uoms
				? props.item.barcode_uoms.split(",").filter(Boolean)
				: [];

			if (barcodeUoms.length === 1) {
				// Find and select the matching UOM option
				const uom = props.item.resolved_uom || barcodeUoms[0];
				const matchingOption = options.value.find((opt) => opt.uom === uom);
				selectedOption.value = matchingOption || options.value[0];
			} else {
				// Default to first option (stock UOM)
				selectedOption.value = options.value[0];
			}
		}
		loading.value = false;
	}
}

// Watch matched variant and auto-select it
watch(matchedVariant, (variant) => {
	if (variant) {
		selectedOption.value = variant;
	} else {
		selectedOption.value = null;
	}
});

function buildUomOptions() {
	if (!props.item) return [];

	const uomOptions = [];

	// Stock UOM option
	uomOptions.push({
		type: "uom",
		uom: props.item.stock_uom,
		conversion_factor: 1,
		label: props.item.stock_uom,
		description: __("Stock unit"),
		rate: getUomPrice(props.item.stock_uom, 1),
		priceLabel: __("per {0}", [props.item.stock_uom]),
	});

	// Additional UOMs
	if (props.item.item_uoms && props.item.item_uoms.length > 0) {
		props.item.item_uoms.forEach((uomData) => {
			uomOptions.push({
				type: "uom",
				uom: uomData.uom,
				conversion_factor: uomData.conversion_factor,
				label: uomData.uom,
				description: __("1 {0} = {1} {2}", [
					uomData.uom,
					uomData.conversion_factor,
					props.item.stock_uom,
				]),
				rate: getUomPrice(uomData.uom, uomData.conversion_factor),
				priceLabel: __("per {0}", [uomData.uom]),
			});
		});
	}

	return uomOptions;
}

function getUomPrice(uom, conversionFactor) {
	if (!props.item) return 0;

	// Check if we have UOM-specific prices
	if (props.item.uom_prices && props.item.uom_prices[uom]) {
		return props.item.uom_prices[uom];
	}

	// Calculate price based on conversion factor
	// If 1 Gram = 0.001 Kg, then price per Gram = price per Kg * 0.001
	const baseRate = props.item.rate || 0;
	return baseRate * conversionFactor;
}

function selectAttribute(attributeName, value) {
	selectedAttributes.value[attributeName] = value;
	// Force reactivity
	selectedAttributes.value = { ...selectedAttributes.value };
}

function selectOption(option) {
	selectedOption.value = option;
}

function confirm() {
	if (selectedOption.value) {
		// Emit first, let parent decide if dialog should close
		// Parent can keep dialog open by switching mode (variant → UOM)
		const option = { ...selectedOption.value, quantity: quantity.value };
		emit("option-selected", option);
	}
}

function cancel() {
	selectedOption.value = null;
	selectedAttributes.value = {};
	isOpen.value = false;
}

function formatCurrency(amount) {
	return formatCurrencyUtil(Number.parseFloat(amount || 0), props.currency);
}
</script>
