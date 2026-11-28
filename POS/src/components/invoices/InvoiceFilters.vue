<template>
	<div class="w-full space-y-2.5 text-start">
		<!-- Main Search Bar + Quick Filters Toolbar -->
		<div class="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2.5">
			<div class="flex flex-col lg:flex-row lg:items-center gap-2.5">
				<!-- Standardized Search Input -->
				<div class="flex-1 min-w-0 inv-filter-search">
					<MdxSearchInput
						v-model="store.searchTerm"
						:placeholder="__('Buscar por número, cliente o vendedor...')"
						:debounce="80"
						:enable-shortcut-listener="false"
						:shortcut-key="''"
					/>
				</div>

				<!-- More Filters Toggle Button -->
				<div class="flex items-center gap-2 shrink-0">
					<button
						type="button"
						@click="showAdvanced = !showAdvanced"
						class="h-9 px-3 text-xs font-bold rounded-lg border transition-all inline-flex items-center gap-1.5 cursor-pointer focus:outline-none"
						:class="
							showAdvanced || hasAdvancedFilters
								? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
								: 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
						"
					>
						<svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
							/>
						</svg>
						<span>{{ __("More") }}</span>
						<span
							v-if="hasAdvancedFilters"
							class="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-extrabold bg-white/20 text-current"
						>
							{{ advancedFiltersCount }}
						</span>
					</button>
				</div>
			</div>

			<!-- Quick Filter Chips Row (Slate Corporate Neutral) -->
			<div class="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
				<!-- Date Chips -->
				<button
					v-for="preset in quickDates"
					:key="preset.value"
					type="button"
					@click="preset.action()"
					class="h-7 px-2.5 text-xs font-semibold rounded-lg border transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
					:class="
						isDatePresetActive(preset.value)
							? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
							: 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
					"
				>
					<svg class="w-3.5 h-3.5 shrink-0 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>
					<span>{{ preset.label }}</span>
				</button>

				<div class="hidden sm:block h-4 w-px bg-slate-200 mx-0.5"></div>

				<!-- Status Chips -->
				<button
					v-for="status in statusOptions"
					:key="status.value"
					type="button"
					@click="toggleStatus(status.value)"
					class="h-7 px-2.5 text-xs font-semibold rounded-lg border transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
					:class="
						store.status === status.value
							? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
							: 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
					"
				>
					<span>{{ status.label }}</span>
				</button>
			</div>
		</div>

		<!-- Active Filters Summary -->
		<Transition name="fade">
			<div
				v-if="store.hasActiveFilters"
				class="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 flex flex-wrap items-center justify-between gap-2"
			>
				<div class="flex flex-wrap items-center gap-2 flex-1 min-w-0">
					<TranslatedHTML
						class="text-xs text-slate-600"
						:inner="
							__(
								'&lt;strong&gt;{0}&lt;/strong&gt; of &lt;strong&gt;{1}&lt;/strong&gt; invoice(s)',
								[filterStats?.filtered || 0, filterStats?.total || 0]
							)
						"
					/>
					<div class="flex flex-wrap items-center gap-1.5">
						<button
							v-for="filter in store.filterSummary"
							:key="filter.type"
							type="button"
							@click="store.clearFilter(filter.type)"
							class="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-medium text-slate-700 transition-colors cursor-pointer"
						>
							<span>{{ filter.label }}</span>
							<svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>
				<button
					type="button"
					@click="store.clearAllFilters()"
					class="text-xs font-semibold text-slate-600 hover:text-red-600 px-2.5 py-1 bg-white border border-slate-200 hover:border-red-200 rounded-lg transition-colors cursor-pointer shrink-0"
				>
					{{ __("Clear all") }}
				</button>
			</div>
		</Transition>

		<!-- Advanced Filters Panel (Collapsible) -->
		<Transition name="expand">
			<div
				v-if="showAdvanced"
				class="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 shadow-2xs"
			>
				<!-- Customer & Product -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
					<div class="space-y-1.5">
						<label class="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
							<svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
							</svg>
							<span>{{ __("Customer") }}</span>
						</label>
						<MdxSelect
							v-model="store.customer"
							:options="customerSelectOptions"
							:placeholder="''"
							size="sm"
							:searchable="true"
							:teleport="true"
						/>
					</div>

					<div class="space-y-1.5">
						<label class="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
							<svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
							</svg>
							<span>{{ __("Product") }}</span>
						</label>
						<MdxSelect
							v-model="store.product"
							:options="productSelectOptions"
							:placeholder="''"
							size="sm"
							:searchable="true"
							:teleport="true"
						/>
					</div>
				</div>

				<!-- Custom Date Range -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
					<div class="space-y-1.5">
						<label class="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
							<svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
							<span>{{ __("From Date") }}</span>
						</label>
						<MdxDatePicker v-model="store.dateFrom" size="sm" />
					</div>

					<div class="space-y-1.5">
						<label class="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
							<svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
							<span>{{ __("To Date") }}</span>
						</label>
						<MdxDatePicker v-model="store.dateTo" size="sm" />
					</div>
				</div>

				<!-- Save Filter -->
				<div v-if="store.hasActiveFilters" class="flex flex-col sm:flex-row gap-2 pt-3 border-t border-slate-100">
					<input
						v-model="saveFilterName"
						type="text"
						class="flex-1 h-8 px-3 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
						:placeholder="__('Save these filters as...')"
						@keyup.enter="saveFilters"
					/>
					<MdxButton
						variant="primary"
						size="sm"
						:disabled="!saveFilterName"
						@click="saveFilters"
					>
						{{ __("Save") }}
					</MdxButton>
				</div>

				<!-- Saved Filters -->
				<div v-if="store.savedFilters.length > 0" class="pt-3 border-t border-slate-100">
					<div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
						{{ __("Saved Filters") }}
					</div>
					<div class="flex flex-wrap gap-1.5">
						<div
							v-for="preset in store.savedFilters"
							:key="preset.name"
							class="inline-flex items-center gap-1 bg-white border border-slate-200 hover:border-slate-300 rounded-lg ps-2.5 pe-1 py-1 text-xs font-medium text-slate-700 transition-colors"
						>
							<button
								type="button"
								@click="loadSavedFilter(preset.name)"
								class="inline-flex items-center gap-1.5 cursor-pointer hover:text-slate-900"
							>
								<svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
								</svg>
								<span>{{ preset.name }}</span>
							</button>
							<button
								type="button"
								@click.stop="requestDeleteSavedFilter(preset.name)"
								class="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
								:title="__('Eliminar filtro guardado')"
							>
								<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
					</div>
				</div>
			</div>
		</Transition>

		<!-- Delete Saved Filter Confirmation -->
		<MdxConfirmDialog
			v-model="showDeletePresetDialog"
			:isDangerous="true"
			icon="trash"
			:title="__('¿Eliminar filtro guardado?')"
			:message="deletePresetMessage"
			:cancel-text="__('Cancelar')"
			:confirm-text="__('Eliminar')"
			@confirm="confirmDeleteSavedFilter"
		/>
	</div>
</template>

<script setup>
import {
	MdxButton,
	MdxConfirmDialog,
	MdxDatePicker,
	MdxSearchInput,
	MdxSelect,
} from "mdx_ui";
import { useInvoiceFiltersStore } from "@/stores/invoiceFilters";
import { computed, ref } from "vue";
import TranslatedHTML from "../common/TranslatedHTML.vue";

const props = defineProps({
	uniqueCustomers: {
		type: Array,
		default: () => [],
	},
	uniqueProducts: {
		type: Array,
		default: () => [],
	},
	filterStats: {
		type: Object,
		default: null,
	},
});

const store = useInvoiceFiltersStore();
const showAdvanced = ref(false);
const saveFilterName = ref("");
const showDeletePresetDialog = ref(false);
const presetToDelete = ref("");
const deletePresetMessage = computed(() =>
	presetToDelete.value ? __("¿Desea eliminar el filtro '{0}'?", [presetToDelete.value]) : ""
);

const customerSelectOptions = computed(() => [
	{ value: "", label: __("Todos los clientes") },
	...(props.uniqueCustomers || []).map((c) => ({
		value: c.value,
		label: c.label || c.value,
	})),
]);

const productSelectOptions = computed(() => [
	{ value: "", label: __("Todos los productos") },
	...(props.uniqueProducts || []).map((p) => ({
		value: p.value,
		label: p.subtitle ? `${p.label} (${p.subtitle})` : p.label,
	})),
]);

// Quick date presets (simplified)
const quickDates = [
	{ label: __("Today"), value: "today", action: () => store.setToday() },
	{
		label: __("Yesterday"),
		value: "yesterday",
		action: () => store.setYesterday(),
	},
	{ label: __("This Week"), value: "week", action: () => store.setThisWeek() },
	{ label: __("This Month"), value: "month", action: () => store.setThisMonth() },
];

// Status options (only show meaningful ones)
const statusOptions = [
	{ label: __("Paid"), value: "Paid" },
	{ label: __("Unpaid"), value: "Unpaid" },
	{ label: __("Partial"), value: "Partly Paid" },
	{ label: __("Overdue"), value: "Overdue" },
];

// Advanced filters (customer, product, custom date)
const hasAdvancedFilters = computed(() => {
	return !!(store.customer || store.product || (store.dateFrom && store.dateTo));
});

const advancedFiltersCount = computed(() => {
	let count = 0;
	if (store.customer) count++;
	if (store.product) count++;
	if (store.dateFrom && store.dateTo) count++;
	return count;
});

function toggleStatus(status) {
	if (store.status === status) {
		store.status = "";
	} else {
		store.status = status;
	}
}

function isDatePresetActive(preset) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	let fromDate, toDate;

	switch (preset) {
		case "today":
			fromDate = toDate = formatDateForInput(today);
			break;
		case "yesterday": {
			const yesterday = new Date(today);
			yesterday.setDate(yesterday.getDate() - 1);
			fromDate = toDate = formatDateForInput(yesterday);
			break;
		}
		case "week": {
			const weekStart = new Date(today);
			weekStart.setDate(today.getDate() - today.getDay());
			fromDate = formatDateForInput(weekStart);
			toDate = formatDateForInput(today);
			break;
		}
		case "month": {
			const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
			fromDate = formatDateForInput(monthStart);
			toDate = formatDateForInput(today);
			break;
		}
		default:
			return false;
	}

	return store.dateFrom === fromDate && store.dateTo === toDate;
}

function formatDateForInput(date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function saveFilters() {
	if (saveFilterName.value && store.hasActiveFilters) {
		store.saveCurrentFilters(saveFilterName.value);
		saveFilterName.value = "";
		showAdvanced.value = false;
	}
}

function loadSavedFilter(name) {
	store.loadFilterPreset(name);
	showAdvanced.value = false;
}

function requestDeleteSavedFilter(name) {
	presetToDelete.value = name;
	showDeletePresetDialog.value = true;
}

function confirmDeleteSavedFilter() {
	if (presetToDelete.value) {
		store.deleteFilterPreset(presetToDelete.value);
		presetToDelete.value = "";
	}
}
</script>

<style scoped>
.inv-filter-search :deep(.mdx-search) {
	max-width: none;
}

.fade-enter-active,
.fade-leave-active {
	transition: all 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
	transform: translateY(-4px);
}

.expand-enter-active,
.expand-leave-active {
	transition: all 0.25s ease;
	max-height: 600px;
	overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
	max-height: 0;
	opacity: 0;
}
</style>
