<template>
	<!-- Main Dialog -->
	<Dialog v-model="show" :options="{ title: __('Cargar Venta / Cotización'), size: '5xl' }">
		<template #body-content>
			<div class="flex flex-col gap-3">
				<!-- Search and Tabs Header -->
				<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
					<!-- Tabs -->
					<div class="flex bg-gray-100 p-0.5 rounded-lg w-full sm:w-auto">
						<button
							type="button"
							@click="activeTab = 'pre_sales'"
							class="flex-1 sm:flex-initial px-4 py-1.5 text-center text-xs font-semibold transition-all rounded-md cursor-pointer focus:outline-none"
							:class="activeTab === 'pre_sales' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
						>
							{{ __("Ordenes de Venta") }}
						</button>
						<button
							type="button"
							@click="activeTab = 'quotations'"
							class="flex-1 sm:flex-initial px-4 py-1.5 text-center text-xs font-semibold transition-all rounded-md cursor-pointer focus:outline-none"
							:class="activeTab === 'quotations' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
						>
							{{ __("Cotizaciones") }}
						</button>
					</div>

					<!-- Instant Search Box -->
					<div class="relative w-full sm:w-72">
						<div class="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
							<svg
								class="w-4 h-4 text-gray-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
								/>
							</svg>
						</div>
						<input
							type="text"
							v-model="searchQuery"
							:placeholder="__('Buscar por número o cliente...')"
							class="w-full h-8.5 ps-9 pe-8 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
						/>
						<button
							v-if="searchQuery"
							type="button"
							@click="searchQuery = ''"
							class="absolute inset-y-0 end-0 pe-2.5 flex items-center text-gray-400 hover:text-gray-600"
						>
							<svg
								class="w-3.5 h-3.5"
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

				<!-- Empty State -->
				<div v-if="filteredDrafts.length === 0" class="text-center py-12">
					<div
						class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-gray-100"
					>
						<svg
							class="h-8 w-8 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
					</div>
					<p class="text-sm font-semibold text-gray-900">
						{{ searchQuery ? __("No se encontraron resultados") : (activeTab === 'quotations' ? __("No hay cotizaciones") : __("No hay órdenes de venta")) }}
					</p>
					<p class="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
						{{ searchQuery ? __("Intente buscar con términos diferentes o borre el filtro") : (activeTab === 'quotations' ? __("Cree cotizaciones en el mostrador para recuperarlas aquí") : __("Guarde las ventas como órdenes de venta para continuar más tarde")) }}
					</p>
				</div>

				<!-- Drafts Horizontal List Layout -->
				<div v-else class="flex flex-col gap-3 max-h-[60vh] overflow-y-auto p-1">
					<div
						v-for="draft in filteredDrafts"
						:key="draft.draft_id"
						class="bg-white border border-gray-200 hover:border-blue-500 rounded-xl p-4.5 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 group"
						@click="$emit('load-draft', draft)"
					>
						<!-- Left Section: Doc info -->
						<div class="flex flex-col justify-center min-w-[220px] border-b lg:border-b-0 lg:border-r border-gray-100 pb-3 lg:pb-0 lg:pe-4 flex-shrink-0">
							<div class="flex items-center gap-2 mb-1.5 flex-wrap">
								<h4 class="text-sm md:text-base font-extrabold text-gray-900 group-hover:text-blue-600 transition-colors">
									{{ draft.draft_id }}
								</h4>
								<span
									class="px-2 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider"
									:class="isDraftQuotation(draft) ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-orange-50 text-orange-700 border-orange-200'"
								>
									{{ isDraftQuotation(draft) ? __('Cotización') : __('Pre-venta') }}
								</span>
								<span
									v-if="!isDraftQuotation(draft)"
									class="px-2 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider"
									:class="draft.docstatus === 1 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'"
								>
									{{ draft.docstatus === 1 ? __('Validada') : __('Borrador') }}
								</span>
							</div>
							<p class="text-xs text-gray-500">
								{{ formatDateTime(draft.created_at) }}
							</p>
							<div class="mt-2">
								<span class="inline-block text-[10px] font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-md">
									{{ getTimeAgo(draft.created_at) }}
								</span>
							</div>
						</div>

						<!-- Middle Section: Customer info -->
						<div class="flex-1 min-w-0 flex items-center gap-3">
							<div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100">
								<svg
									class="w-5 h-5 text-blue-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2.5"
										d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
									/>
								</svg>
							</div>
							<div class="min-w-0">
								<span class="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
									{{ __("Cliente") }}
								</span>
								<p class="text-sm md:text-base font-extrabold text-gray-800 truncate leading-snug">
									{{ draft.customer?.customer_name || draft.customer?.name || draft.customer }}
								</p>
							</div>
						</div>

						<!-- Right Section: Items list (condensed badges) -->
						<div class="flex-1 min-w-0 border-t lg:border-t-0 lg:border-x border-gray-100 pt-3 lg:pt-0 lg:px-4 flex flex-col justify-center">
							<span class="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
								{{ __("Detalle de Items") }} ({{ draft.items?.length || 0 }})
							</span>
							<div class="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
								<span
									v-for="(item, idx) in draft.items"
									:key="idx"
									class="text-[11px] bg-gray-50 border border-gray-200 text-gray-700 px-2 py-0.5 rounded-lg truncate max-w-full font-medium"
								>
									{{ item.item_name }} <span class="text-blue-600 font-bold">x{{ item.quantity || item.qty }}</span>
								</span>
							</div>
						</div>

						<!-- Far Right Section: Total & Quick Actions -->
						<div class="min-w-[160px] border-t lg:border-t-0 border-gray-100 pt-3 lg:pt-0 lg:ps-4 flex items-center justify-between lg:justify-end gap-4 flex-shrink-0">
							<div class="flex flex-col lg:items-end">
								<span class="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none">
									{{ __("Total a Cobrar") }}
								</span>
								<span class="text-base md:text-lg font-extrabold text-blue-600 mt-1">
									{{ formatCurrency(calculateTotal(draft.items)) }}
								</span>
							</div>

							<div class="flex items-center gap-1.5" @click.stop>
								<button
									v-if="props.allowPrintDraftInvoices"
									@click.stop="handlePrintDraft(draft)"
									class="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700 rounded-xl transition-all touch-manipulation"
									:title="__('Print draft')"
								>
									<svg
										class="w-4.5 h-4.5"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2.5"
											d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
										/>
									</svg>
								</button>
								<button
									@click.stop="handleDeleteDraft(draft.draft_id)"
									class="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-700 rounded-xl transition-all touch-manipulation"
									:title="__('Delete draft')"
								>
									<svg
										class="w-4.5 h-4.5"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2.5"
											d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
										/>
									</svg>
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</template>
		<template #actions>
			<div class="flex justify-between items-center w-full">
				<Button
					v-if="drafts.length > 0"
					variant="subtle"
					theme="red"
					@click="showClearAllDialog = true"
				>
					{{ __("Clear All") }}
				</Button>
				<Button variant="subtle" @click="show = false">
					{{ __("Close") }}
				</Button>
			</div>
		</template>
	</Dialog>

	<!-- Delete Single Draft Confirmation -->
	<Dialog v-model="showDeleteDialog" :options="{ title: __('Delete Draft?'), size: 'xs' }">
		<template #body-content>
			<div class="py-3">
				<p class="text-sm text-gray-600">
					{{ __("Permanently delete this draft invoice?") }}
				</p>
			</div>
		</template>
		<template #actions>
			<div class="flex gap-2 w-full">
				<Button class="flex-1" variant="subtle" @click="showDeleteDialog = false">
					{{ __("Cancel") }}
				</Button>
				<Button class="flex-1" variant="solid" theme="red" @click="confirmDeleteDraft">
					{{ __("Delete") }}
				</Button>
			</div>
		</template>
	</Dialog>

	<!-- Clear All Drafts Confirmation -->
	<Dialog v-model="showClearAllDialog" :options="{ title: __('Clear All Drafts?'), size: 'xs' }">
		<template #body-content>
			<div class="py-3">
				<p class="text-sm text-gray-600">
					{{ __("Permanently delete all {0} draft invoices?", [drafts.length]) }}
				</p>
			</div>
		</template>
		<template #actions>
			<div class="flex gap-2 w-full">
				<Button class="flex-1" variant="subtle" @click="showClearAllDialog = false">
					{{ __("Cancel") }}
				</Button>
				<Button class="flex-1" variant="solid" theme="red" @click="confirmClearAll">
					{{ __("Clear All") }}
				</Button>
			</div>
		</template>
	</Dialog>
</template>

<script setup>
import {
	DEFAULT_CURRENCY,
	DEFAULT_LOCALE,
	formatCurrency as formatCurrencyUtil,
	roundCurrency,
} from "@/utils/currency";
import { clearAllDrafts, deleteDraft, getAllDrafts } from "@/utils/draftManager";
import { printInvoiceCustom } from "@/utils/printInvoice";
import { useToast } from "@/composables/useToast";
import { usePOSShiftStore } from "@/stores/posShift";
import { usePOSDraftsStore } from "@/stores/posDrafts";
import { Button, Dialog } from "frappe-ui";
import { onMounted, ref, watch, computed } from "vue";

const { showSuccess, showError } = useToast();
const shiftStore = usePOSShiftStore();
const draftsStore = usePOSDraftsStore();

const props = defineProps({
	modelValue: Boolean,
	currency: {
		type: String,
		default: DEFAULT_CURRENCY,
	},
	allowPrintDraftInvoices: {
		type: Boolean,
		default: false,
	},
});

const emit = defineEmits(["update:modelValue", "load-draft", "drafts-updated"]);

const show = ref(props.modelValue);
const drafts = ref([]);
const showDeleteDialog = ref(false);
const showClearAllDialog = ref(false);
const draftToDelete = ref(null);
const activeTab = ref("pre_sales"); // "pre_sales" or "quotations"
const searchQuery = ref("");

const filteredDrafts = computed(() => {
	return drafts.value.filter(draft => {
		const isQuotation = isDraftQuotation(draft);
		
		// Filter by tab
		const matchesTab = activeTab.value === "quotations" ? isQuotation : !isQuotation;
		if (!matchesTab) return false;

		// Filter by search query
		if (searchQuery.value.trim()) {
			const q = searchQuery.value.toLowerCase().trim();
			const matchesId = draft.draft_id && draft.draft_id.toLowerCase().includes(q);
			
			const custName = draft.customer?.customer_name || draft.customer?.name || draft.customer || "";
			const matchesCustomer = custName.toLowerCase().includes(q);

			return matchesId || matchesCustomer;
		}

		return true;
	});
});

function isDraftQuotation(draft) {
	if (!draft) return false;
	if (draft.doctype === "Quotation") return true;

	const draftId = draft.draft_id;
	return draftId && (
		draftId.includes("-QTN-") ||
		draftId.includes("-COT-") ||
		draftId.startsWith("QTN-") ||
		draftId.startsWith("COT-")
	);
}

watch(
	() => props.modelValue,
	(val) => {
		show.value = val;
		if (val) {
			loadDrafts();
		}
	}
);

watch(show, (val) => {
	emit("update:modelValue", val);
});

onMounted(() => {
	loadDrafts();
});

async function loadDrafts() {
	try {
		await draftsStore.loadDrafts();
		drafts.value = draftsStore.drafts;
	} catch (error) {
		console.error("Error loading drafts:", error);
		showError(__("Failed to load draft invoices"));
	}
}

function handlePrintDraft(draft) {
	if (!props.allowPrintDraftInvoices) {
		return;
	}

	try {
		const isQuotation = isDraftQuotation(draft);

		const invoiceData = {
			name: draft.draft_id,
			company: shiftStore.profileCompany,
			items: draft.items,
			payments: [],
			grand_total: calculateTotal(draft.items),
			posting_date: draft.created_at,
			customer_name: draft.customer?.customer_name || draft.customer?.name || draft.customer,
			status: isQuotation ? "Quotation" : "Draft",
			header: isQuotation ? "Quotation" : "Draft",
			footer: isQuotation
				? "Este documento es una cotización informativa y no representa una factura ni compromiso de compra. Válido por 3 días."
				: "Este documento es una orden de venta y no representa una factura válida ni un comprobante de pago oficial.",
		};
		printInvoiceCustom(invoiceData);
	} catch (error) {
		console.error("Error printing draft:", error);
		showError(__("Failed to print draft"));
	}
}

function handleDeleteDraft(draftId) {
	draftToDelete.value = draftId;
	showDeleteDialog.value = true;
}

async function confirmDeleteDraft() {
	try {
		await draftsStore.deleteDraft(draftToDelete.value);
		await loadDrafts();
		showDeleteDialog.value = false;
		draftToDelete.value = null;

		// Notify parent to update count
		emit("drafts-updated");

		showSuccess(__("Draft invoice deleted"));
	} catch (error) {
		console.error("Error deleting draft:", error);
		showError(__("Failed to delete draft"));
	}
}

async function confirmClearAll() {
	try {
		await clearAllDrafts();
		await loadDrafts();
		showClearAllDialog.value = false;

		// Notify parent to update count
		emit("drafts-updated");

		showSuccess(__("All draft invoices deleted"));
	} catch (error) {
		console.error("Error clearing drafts:", error);
		showError(__("Failed to clear drafts"));
	}
}

function formatDateTime(dateStr) {
	const date = new Date(dateStr);
	return date.toLocaleString(DEFAULT_LOCALE, {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function formatCurrency(amount) {
	return formatCurrencyUtil(Number.parseFloat(amount || 0), props.currency);
}

function calculateTotal(items) {
	if (!items || items.length === 0) return 0;
	return roundCurrency(
		items.reduce((sum, item) => {
			const qty = item.quantity || item.qty || 1;
			const rate = item.rate || 0;
			return sum + roundCurrency(qty * roundCurrency(rate));
		}, 0)
	);
}

function getTimeAgo(createdAt) {
	if (!createdAt) return "";
	const date = new Date(createdAt);
	const now = new Date();
	const diffMs = now - date;
	const diffMins = Math.floor(diffMs / 60000);

	if (diffMins < 1) return __("Just now");
	if (diffMins < 60) return __("{0} min ago", [diffMins]);

	const diffHours = Math.floor(diffMins / 60);
	if (diffHours < 24) return __("{0} hr ago", [diffHours]);

	const diffDays = Math.floor(diffHours / 24);
	return __("{0} day ago", [diffDays]);
}
</script>
