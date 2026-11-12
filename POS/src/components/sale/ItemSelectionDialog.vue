<template>
	<MdxModal
		v-model="isOpen"
		:title="dialogTitle"
		:subtitle="dialogSubtitle"
		:size="mode === 'variant' ? 'lg' : 'md'"
		:no-padding="mode === 'variant'"
	>
		<template v-if="mode === 'variant' && options.length > 0" #header-actions>
			<MdxBadge
				:variant="totalAvailableTemplateStock > 0 ? 'success' : 'neutral'"
				size="sm"
			>
				{{
					totalAvailableTemplateStock > 0
						? __("Stock: {0}", [Math.floor(totalAvailableTemplateStock)])
						: __("Sin stock")
				}}
			</MdxBadge>
		</template>

		<!-- ============================================================== -->
		<!-- MODO VARIANTE: Grilla Ultracompacta (Sin Doble Scroll)         -->
		<!-- ============================================================== -->
		<div
			v-if="mode === 'variant'"
			class="flex flex-col flex-1 min-h-0"
		>
			<!-- Estado de Carga -->
			<div v-if="loading" class="py-10 px-4">
				<MdxLoadingSpinner size="md" :text="__('Loading options...')" />
			</div>

			<!-- Selector Múltiple Compacto -->
			<template v-else-if="options.length > 0">
				<!-- Barra Superior Fija en 1 Sola Línea (Móvil y Desktop) -->
				<div class="px-3.5 sm:px-5 py-2 bg-white border-b border-slate-200/80 flex items-center gap-2 flex-shrink-0">
					<div class="flex-1 min-w-0 variant-search-box">
						<MdxSearchInput
							v-model="variantSearch"
							:placeholder="__('Buscar color...')"
							:debounce="80"
							:enable-shortcut-listener="false"
							:shortcut-key="''"
						/>
					</div>

					<div class="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex-shrink-0">
						<button
							type="button"
							@click="variantStockFilter = 'all'"
							class="px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap"
							:class="
								variantStockFilter === 'all'
									? 'bg-white text-slate-900 shadow-2xs'
									: 'text-slate-600 hover:text-slate-900'
							"
						>
							{{ __("Todos") }} ({{ options.length }})
						</button>
						<button
							type="button"
							@click="variantStockFilter = 'in_stock'"
							class="px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap"
							:class="
								variantStockFilter === 'in_stock'
									? 'bg-white text-emerald-700 shadow-2xs'
									: 'text-slate-600 hover:text-slate-900'
							"
						>
							{{ __("Stock") }} ({{ inStockVariantsCount }})
						</button>
					</div>

					<button
						v-if="selectedVariantsCount > 0"
						type="button"
						@click="clearVariantQuantities"
						class="p-1.5 rounded-lg text-slate-500 bg-white border border-slate-200 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer flex-shrink-0"
						:title="__('Limpiar selección')"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<!-- Único Contenedor con Scroll: 2 Columnas en PC/Tablet, Filas de 1 Línea en Móvil -->
				<div class="flex-1 min-h-0 overflow-y-auto px-3.5 sm:px-5 py-2.5">
					<div
						v-if="filteredVariantOptions.length > 0"
						class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2"
					>
						<div
							v-for="opt in filteredVariantOptions"
							:key="opt.item_code"
							@click="handleVariantRowTap(opt)"
							:class="[
								'rounded-lg border px-2.5 py-1.5 sm:py-2 transition-all flex items-center justify-between gap-2 select-none',
								isVariantDisabled(opt)
									? 'bg-slate-50/70 border-slate-200 opacity-55 cursor-not-allowed'
									: getVariantQty(opt.item_code) > 0
										? 'bg-blue-50/40 border-blue-500 ring-1 ring-blue-500/15 cursor-pointer'
										: 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 cursor-pointer',
							]"
						>
							<!-- Izquierda: Nombre del Color + Indicador Compacto de Stock -->
							<div class="min-w-0 flex-1 flex items-center gap-1.5">
								<span
									class="text-[13px] font-bold truncate leading-tight"
									:class="
										getVariantQty(opt.item_code) > 0
											? 'text-blue-950'
											: 'text-slate-900'
									"
									:title="`${getVariantPrimaryLabel(opt)} (${opt.item_code})`"
								>
									{{ getVariantPrimaryLabel(opt) }}
								</span>

								<span
									v-if="getAvailableStock(opt) > 0"
									class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 tabular-nums"
								>
									{{ Math.floor(getAvailableStock(opt)) }} {{ __("disp.") }}
								</span>
								<span
									v-else
									class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-400 shrink-0 tabular-nums"
									:title="__('Sin stock físico')"
								>
									0
								</span>

								<span
									v-if="(opt.data?.other_qty || 0) > 0"
									class="inline-flex items-center px-1 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 shrink-0 tabular-nums"
								>
									+{{ Math.floor(opt.data.other_qty) }}
								</span>

								<span
									v-if="getCartReserved(opt.item_code) > 0"
									class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200/80 text-slate-700 shrink-0 tabular-nums"
									:title="__('Ya reservado en el carrito actual')"
								>
									{{ __("Carr:") }} {{ getCartReserved(opt.item_code) }}
								</span>
							</div>

							<!-- Derecha: Precio Diferencial (solo si difiere del base) + Control Táctil Compacto -->
							<div class="flex items-center gap-2 shrink-0" @click.stop>
								<span
									v-if="hasDistinctVariantPrices"
									class="text-xs font-bold text-slate-600 tabular-nums whitespace-nowrap"
								>
									{{ formatCurrency(opt.rate || 0) }}
								</span>

								<!-- Cuando ya tiene cantidad seleccionada: Stepper compacto [ - | N | + ] -->
								<div
									v-if="getVariantQty(opt.item_code) > 0"
									class="inline-flex items-center rounded-lg border border-blue-200 bg-white shadow-2xs overflow-hidden h-[30px]"
								>
									<button
										type="button"
										@click="adjustVariantQty(opt, -1)"
										class="w-7 h-full flex items-center justify-center text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
										:title="__('Restar')"
									>
										<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round">
											<path d="M5 12h14" />
										</svg>
									</button>
									<span class="min-w-[26px] px-1 text-center text-xs font-black text-blue-700 tabular-nums select-none">
										{{ getVariantQty(opt.item_code) }}
									</span>
									<button
										type="button"
										@click="adjustVariantQty(opt, 1)"
										:disabled="isAtMaxQty(opt)"
										class="w-7 h-full flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-200 disabled:text-slate-400 transition-colors cursor-pointer disabled:cursor-not-allowed"
										:title="__('Sumar')"
									>
										<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round">
											<path d="M12 5v14M5 12h14" />
										</svg>
									</button>
								</div>

								<!-- Cuando está en 0: Botón limpio de 1 toque [ + ] -->
								<button
									v-else
									type="button"
									@click="adjustVariantQty(opt, 1)"
									:disabled="isVariantDisabled(opt)"
									class="w-[30px] h-[30px] rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 active:scale-95 flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
									:title="__('Agregar 1')"
								>
									<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
										<path d="M12 5v14M5 12h14" />
									</svg>
								</button>
							</div>
						</div>
					</div>

					<!-- Estado Vacío de Filtro/Búsqueda -->
					<div
						v-else
						class="py-8 px-4 text-center bg-slate-50 border border-slate-200 rounded-xl"
					>
						<p class="text-xs sm:text-sm font-semibold text-slate-700">
							{{
								variantStockFilter === "in_stock" && !variantSearch
									? __("Ninguna variante tiene stock físico disponible en este momento.")
									: __("No se encontraron variantes con ese filtro.")
							}}
						</p>
						<button
							v-if="variantStockFilter === 'in_stock' || variantSearch"
							type="button"
							@click="resetVariantFilters"
							class="mt-2 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
						>
							{{ __("Ver todas las variantes") }}
						</button>
					</div>
				</div>
			</template>

			<!-- Sin Variantes Creadas -->
			<div v-else class="text-center py-8 px-5">
				<p class="text-sm font-bold text-slate-900">
					{{ __("No Variants Available") }}
				</p>
				<p class="text-xs text-slate-500 mt-1.5">
					<TranslatedHTML
						:inner="
							__(
								'This item template &lt;strong&gt;{0}&lt;strong&gt; has no variants created yet.',
								[item?.item_name]
							)
						"
					/>
				</p>
			</div>
		</div>

		<!-- ============================================================== -->
		<!-- MODO UOM: Selector Rápido de Unidad de Medida                  -->
		<!-- ============================================================== -->
		<div v-else class="flex flex-col gap-4">
			<div
				v-if="item"
				class="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl"
			>
				<div class="flex items-center gap-3 min-w-0 flex-1">
					<div
						class="w-12 h-12 bg-white border border-slate-200/80 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
					>
						<img
							v-if="item.image"
							:src="item.image"
							loading="lazy"
							:alt="item.item_name"
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
							{{ item.item_name }}
						</h3>
						<p class="text-xs font-medium text-slate-500 truncate">
							{{ item.item_code }}
						</p>
					</div>
				</div>
			</div>

			<MdxLoadingSpinner
				v-if="loading"
				size="md"
				:text="__('Loading options...')"
			/>

			<div v-else-if="options.length > 0" class="flex flex-col gap-4">
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

				<MdxQuantityStepper
					v-model="quantity"
					:min="1"
					:uom="selectedOption?.uom || item?.stock_uom"
					:label="__('Quantity')"
					:show-quick-adds="true"
					:quick-adds="[1, 5, 10, 20]"
				/>

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

				<div v-if="stockWarning" class="flex items-center justify-center">
					<MdxBadge variant="warning" size="md">
						{{ stockWarning }}
					</MdxBadge>
				</div>
			</div>

			<div v-else class="text-center py-8">
				<p class="text-sm font-bold text-slate-900">
					{{ __("No Options Available") }}
				</p>
				<p class="text-xs text-slate-500 mt-2">
					{{ __("No additional units of measurement configured for this item.") }}
				</p>
			</div>
		</div>

		<template v-if="mode === 'variant' && selectedVariantsCount > 0" #footer-left>
			<div
				class="flex items-center justify-between sm:justify-start gap-2.5 text-xs text-slate-600"
			>
				<span>
					<strong class="font-bold text-slate-900">{{ selectedVariantsCount }}</strong>
					{{ __("var.") }} ·
					<strong class="font-bold text-slate-900">{{ totalSelectedUnits }}</strong>
					{{ totalSelectedUnits === 1 ? __("ud.") : __("uds.") }}
				</span>
				<span class="text-sm font-black text-slate-900 tabular-nums">
					{{ formatCurrency(totalSelectedAmount) }}
				</span>
			</div>
		</template>

		<template #footer>
			<MdxButton variant="secondary" @click="cancel">
				{{ __("Cancel") }}
			</MdxButton>
			<MdxButton
				variant="primary"
				:disabled="!canConfirm"
				@click="confirm"
			>
				{{ confirmButtonText }}
			</MdxButton>
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
	MdxSearchInput,
} from "mdx_ui";
import { computed, ref, watch } from "vue";
import TranslatedHTML from "../common/TranslatedHTML.vue";
import { offlineState } from "@/utils/offline/offlineState";
import { getCachedVariants, cacheItems } from "@/utils/offline/items";
import { useStockStore } from "@/stores/stock";
import { usePOSSettingsStore } from "@/stores/posSettings";
import { shouldValidateItemStock } from "@/utils/stockValidator";

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

const stockStore = useStockStore();
const settingsStore = usePOSSettingsStore();

const isOpen = computed({
	get: () => props.modelValue,
	set: (value) => emit("update:modelValue", value),
});

const loading = ref(false);
const options = ref([]);
const selectedOption = ref(null);
const quantity = ref(1);
const variantQuantities = ref({});
const variantSearch = ref("");
const variantStockFilter = ref("all"); // 'all' | 'in_stock'

const dialogTitle = computed(() => {
	if (props.mode === "variant") {
		return props.item?.item_name || __("Seleccionar Variantes");
	}
	return __("Select Unit of Measure");
});

function cleanWarehouseLabel(raw) {
	return String(raw || "").replace(/\s*-\s*[A-Z0-9]+$/i, "").trim();
}

const baseVariantRate = computed(() => {
	if (props.mode !== "variant") return 0;
	if (options.value.length > 0) {
		return Number(options.value[0]?.rate || props.item?.rate || 0);
	}
	return Number(props.item?.rate || props.item?.price_list_rate || 0);
});

const hasDistinctVariantPrices = computed(() => {
	if (props.mode !== "variant" || options.value.length <= 1) return false;
	const first = Number(options.value[0]?.rate || 0);
	return options.value.some((o) => Math.abs(Number(o.rate || 0) - first) > 0.009);
});

const primaryVariantWarehouse = computed(() => {
	if (props.mode !== "variant") return "";
	return (
		options.value[0]?.warehouseLabel ||
		cleanWarehouseLabel(props.item?.warehouse_name || props.item?.warehouse)
	);
});

const dialogSubtitle = computed(() => {
	if (props.mode !== "variant" || !props.item) return "";
	const parts = [props.item.item_code];
	if (!hasDistinctVariantPrices.value && baseVariantRate.value > 0) {
		parts.push(`${formatCurrency(baseVariantRate.value)} c/u`);
	}
	if (primaryVariantWarehouse.value) {
		parts.push(primaryVariantWarehouse.value);
	}
	return parts.filter(Boolean).join(" · ");
});

function getVariantPrimaryLabel(opt) {
	const attrValues = Object.values(opt.attributes || {}).filter(Boolean);
	if (attrValues.length > 0) {
		return attrValues.join(" · ");
	}
	return opt.label || opt.item_code;
}

function getCartReserved(itemCode) {
	return Number(stockStore.reserved.get(itemCode) || 0);
}

function getServerStock(opt) {
	if (stockStore.server.has(opt.item_code)) {
		return Number(stockStore.server.get(opt.item_code)?.qty ?? opt.stock ?? 0);
	}
	return Number(opt.stock ?? opt.data?.actual_qty ?? 0);
}

function getAvailableStock(opt) {
	return getServerStock(opt) - getCartReserved(opt.item_code);
}

function isStrictStockEnforced(opt) {
	return Boolean(
		settingsStore.shouldEnforceStockValidation() && shouldValidateItemStock(opt.data || {})
	);
}

function isVariantDisabled(opt) {
	return isStrictStockEnforced(opt) && getAvailableStock(opt) <= 0;
}

function getVariantMaxQty(opt) {
	if (!isStrictStockEnforced(opt)) {
		return undefined;
	}
	return Math.max(0, Math.floor(getAvailableStock(opt)));
}

function getVariantQty(itemCode) {
	return Number(variantQuantities.value[itemCode] || 0);
}

function setVariantQty(opt, nextVal) {
	if (!opt?.item_code) return;
	let val = Math.max(0, Number(nextVal) || 0);
	const maxQ = getVariantMaxQty(opt);
	if (maxQ !== undefined) {
		val = Math.min(maxQ, val);
	}
	const updated = { ...variantQuantities.value };
	if (val <= 0) {
		delete updated[opt.item_code];
	} else {
		updated[opt.item_code] = val;
	}
	variantQuantities.value = updated;
}

function isAtMaxQty(opt) {
	const maxQ = getVariantMaxQty(opt);
	return maxQ !== undefined && getVariantQty(opt.item_code) >= maxQ;
}

function adjustVariantQty(opt, delta) {
	if (!opt?.item_code) return;
	if (delta > 0 && isVariantDisabled(opt)) return;
	const current = getVariantQty(opt.item_code);
	setVariantQty(opt, current + delta);
}

function handleVariantRowTap(opt) {
	if (isVariantDisabled(opt)) return;
	const current = getVariantQty(opt.item_code);
	if (current === 0) {
		setVariantQty(opt, 1);
	} else if (current === 1) {
		setVariantQty(opt, 0);
	}
}

function clearVariantQuantities() {
	variantQuantities.value = {};
}

function resetVariantFilters() {
	variantSearch.value = "";
	variantStockFilter.value = "all";
}

const inStockVariantsCount = computed(() => {
	if (props.mode !== "variant") return 0;
	return options.value.filter((opt) => getAvailableStock(opt) > 0).length;
});

const totalAvailableTemplateStock = computed(() => {
	if (props.mode !== "variant") return 0;
	return options.value.reduce((sum, opt) => sum + Math.max(0, getAvailableStock(opt)), 0);
});

const sortedVariantOptions = computed(() => {
	if (props.mode !== "variant") return [];
	return [...options.value].sort((a, b) => {
		const aHas = getAvailableStock(a) > 0 ? 1 : 0;
		const bHas = getAvailableStock(b) > 0 ? 1 : 0;
		if (bHas !== aHas) return bHas - aHas;
		return (a.orderIndex ?? 0) - (b.orderIndex ?? 0);
	});
});

const filteredVariantOptions = computed(() => {
	let list = sortedVariantOptions.value;
	if (variantStockFilter.value === "in_stock") {
		list = list.filter((opt) => getAvailableStock(opt) > 0);
	}
	const q = (variantSearch.value || "").trim().toLowerCase();
	if (q) {
		list = list.filter((opt) => {
			const attrStr = Object.values(opt.attributes || {})
				.join(" ")
				.toLowerCase();
			return (
				attrStr.includes(q) ||
				(opt.label || "").toLowerCase().includes(q) ||
				(opt.item_code || "").toLowerCase().includes(q)
			);
		});
	}
	return list;
});

const selectedVariantEntries = computed(() => {
	if (props.mode !== "variant") return [];
	return options.value
		.filter((opt) => getVariantQty(opt.item_code) > 0)
		.map((opt) => ({
			...opt,
			quantity: getVariantQty(opt.item_code),
		}));
});

const selectedVariantsCount = computed(() => selectedVariantEntries.value.length);

const totalSelectedUnits = computed(() =>
	selectedVariantEntries.value.reduce((sum, entry) => sum + Number(entry.quantity || 0), 0)
);

const totalSelectedAmount = computed(() =>
	selectedVariantEntries.value.reduce(
		(sum, entry) => sum + Number(entry.rate || 0) * Number(entry.quantity || 0),
		0
	)
);

const canConfirm = computed(() => {
	if (props.mode === "variant") {
		return selectedVariantsCount.value > 0;
	}
	return Boolean(selectedOption.value);
});

const confirmButtonText = computed(() => {
	if (props.mode === "variant") {
		if (totalSelectedUnits.value > 0) {
			return __("Agregar {0} al Carrito", [totalSelectedUnits.value]);
		}
		return __("Add to Cart");
	}
	return __("Add to Cart");
});

// Computed: Stock warning when quantity exceeds available stock (UOM mode)
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

/**
 * Transform raw variant data into option format for the UI
 */
function mapVariantsToOptions(variants) {
	return variants.map((v, idx) => ({
		type: "variant",
		orderIndex: idx,
		item_code: v.item_code,
		label: v.item_name,
		description: v.item_code,
		attributes: v.attributes || {},
		rate: v.rate || v.price_list_rate || 0,
		priceLabel: __("per {0}", [v.stock_uom]),
		stock: v.actual_qty ?? 0,
		warehouseLabel: cleanWarehouseLabel(v.warehouse_name || v.warehouse),
		data: v,
	}));
}

/**
 * Load variants from IndexedDB cache (for offline mode or API fallback)
 */
async function loadVariantsFromCache() {
	try {
		const cachedVariants = await getCachedVariants(props.item?.item_code);
		options.value = cachedVariants?.length > 0 ? mapVariantsToOptions(cachedVariants) : [];
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
		// Sync fresh variant stock into stockStore so cart reservations and badges stay unified
		if (variants.length > 0) {
			stockStore.init(variants);
		}
		options.value = mapVariantsToOptions(variants);
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
	(isOpenVal) => {
		if (isOpenVal && props.item) {
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
	variantQuantities.value = {};
	variantSearch.value = "";
	variantStockFilter.value = "all";

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
	const baseRate = props.item.rate || 0;
	return baseRate * conversionFactor;
}

function selectOption(option) {
	selectedOption.value = option;
}

function confirm() {
	if (props.mode === "variant") {
		const list = selectedVariantEntries.value;
		if (list.length === 0) return;

		// Preserve secondary UOM / Batch / Serial flow if a single specialized variant was chosen
		if (
			list.length === 1 &&
			(list[0].data?.item_uoms?.length > 0 ||
				list[0].data?.has_batch_no ||
				list[0].data?.has_serial_no)
		) {
			emit("option-selected", {
				...list[0],
				type: "variant",
				quantity: list[0].quantity,
			});
			return;
		}

		emit("option-selected", {
			type: "variants_bulk",
			items: list.map((entry) => ({
				data: entry.data,
				quantity: entry.quantity,
			})),
		});
		return;
	}

	if (selectedOption.value) {
		const option = { ...selectedOption.value, quantity: quantity.value };
		emit("option-selected", option);
	}
}

function cancel() {
	selectedOption.value = null;
	variantQuantities.value = {};
	variantSearch.value = "";
	variantStockFilter.value = "all";
	isOpen.value = false;
}

function formatCurrency(amount) {
	return formatCurrencyUtil(Number.parseFloat(amount || 0), props.currency);
}
</script>

<style scoped>
.variant-search-box :deep(.mdx-search) {
	max-width: none;
}
.variant-search-box :deep(.mdx-search__input) {
	height: 34px;
}
</style>
