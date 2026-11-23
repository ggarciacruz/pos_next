<template>
	<MdxModal
		v-model="show"
		:title="recordedResult ? __('Entrega Registrada') : __('Registrar Entrega de Mercadería')"
		size="2xl"
	>
		<div v-if="control" class="flex flex-col gap-4">
			<!-- Header Card -->
			<div class="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
				<div class="min-w-0">
					<div class="flex items-center gap-2 flex-wrap">
						<h3 class="text-sm font-bold text-slate-900 truncate">
							{{ control.customer_name || control.customer }}
						</h3>
						<MdxBadge :variant="statusBadgeVariant(displayControl.status)" size="sm">
							{{ displayControl.status }}
						</MdxBadge>
					</div>
					<div class="text-xs text-slate-500 mt-0.5 tabular-nums">
						{{ control.reference_name }} · {{ control.name }}
						<span v-if="control.posting_date"> · {{ control.posting_date }}</span>
					</div>
				</div>
				<div
					v-if="Number(control.outstanding_amount || 0) > 0.01"
					class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold shrink-0"
				>
					<svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
					</svg>
					<span>{{ __("Saldo de pago pendiente:") }} {{ formatCurrency(control.outstanding_amount) }}</span>
				</div>
			</div>

			<!-- Success Confirmation State after saving -->
			<div v-if="recordedResult" class="flex flex-col gap-3">
				<div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
					<div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<div class="min-w-0 flex-1">
						<div class="text-sm font-bold text-emerald-900">
							{{
								recordedResult.control.status === "Entregado"
									? __("Entrega completada al 100%")
									: __("Retiro parcial registrado correctamente")
							}}
						</div>
						<p class="text-xs text-emerald-800 mt-1">
							{{ recordedResult.log?.items_summary }}
						</p>
						<p class="text-xs text-emerald-700 mt-1">
							{{ __("Retirado por:") }} <strong>{{ recordedResult.log?.received_by }}</strong>
							<span v-if="Number(recordedResult.control.total_qty_pending || 0) > 0">
								· {{ __("Saldo pendiente restante:") }}
								<strong>{{ formatPickupQty(recordedResult.control.total_qty_pending) }}</strong>
							</span>
						</p>
					</div>
				</div>

				<div class="flex flex-wrap items-center justify-end gap-2 pt-1">
					<MdxButton variant="secondary" @click="handlePrint">
						<svg class="w-4 h-4 me-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
						</svg>
						{{ __("Imprimir Constancia") }}
					</MdxButton>
					<MdxButton
						v-if="settingsStore.enableWhatsappSend"
						variant="secondary"
						@click="handleWhatsApp"
					>
						{{ __("Enviar por WhatsApp") }}
					</MdxButton>
					<MdxButton variant="primary" @click="show = false">
						{{ __("Listo") }}
					</MdxButton>
				</div>
			</div>

			<!-- Entry Form State -->
			<template v-else>
				<div class="flex items-center justify-between gap-2">
					<span class="text-xs font-semibold text-slate-700">
						{{ __("Indica la cantidad que retira el cliente ahora:") }}
					</span>
					<button
						type="button"
						@click="fillAllRemaining"
						class="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
					>
						{{ __("Entregar todo el saldo") }}
					</button>
				</div>

				<div class="border border-slate-200 rounded-xl divide-y divide-slate-200 bg-white max-h-72 overflow-y-auto">
					<div
						v-for="row in deliveryRows"
						:key="row.name"
						class="p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5"
					>
						<div class="min-w-0 flex-1">
							<div class="text-sm font-semibold text-slate-900">
								{{ row.item_name }}
							</div>
							<div class="text-xs text-slate-500 mt-0.5 tabular-nums flex flex-wrap items-center gap-x-2 gap-y-0.5">
								<span>{{ row.item_code }}</span>
								<span>·</span>
								<span>{{ __("Vendido:") }} {{ formatPickupQty(row.qty_sold) }} {{ row.uom }}</span>
								<span>·</span>
								<span>{{ __("Retirado:") }} {{ formatPickupQty(row.qty_delivered) }}</span>
								<span>·</span>
								<span class="font-bold text-slate-900">
									{{ __("Pendiente:") }} {{ formatPickupQty(row.qty_pending) }} {{ row.uom }}
									<template v-if="row.coverage_uom && row.coverage_factor > 0">
										({{ formatPickupQty(row.qty_pending * row.coverage_factor) }} {{ row.coverage_uom }})
									</template>
								</span>
							</div>
						</div>

						<div class="flex items-center gap-1.5 shrink-0">
							<button
								type="button"
								@click="stepRow(row, -1)"
								class="w-7 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold text-sm cursor-pointer"
							>
								−
							</button>
							<input
								type="number"
								min="0"
								:max="row.qty_pending"
								step="any"
								v-model.number="row.qty_to_deliver"
								@blur="clampRow(row)"
								class="w-20 h-8 px-2 text-sm font-bold text-center tabular-nums text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
							/>
							<button
								type="button"
								@click="stepRow(row, 1)"
								class="w-7 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold text-sm cursor-pointer"
							>
								+
							</button>
							<button
								type="button"
								@click="row.qty_to_deliver = row.qty_pending"
								class="px-2 h-8 text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
							>
								{{ __("Todo") }}
							</button>
						</div>
					</div>
				</div>

				<!-- Who picked up & notes -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div>
						<label class="block text-xs font-semibold text-slate-700 mb-1">
							{{ __("Retirado por") }}
						</label>
						<input
							v-model="receivedBy"
							type="text"
							:placeholder="control.customer_name || __('Nombre de quien retira')"
							class="w-full h-9 px-3 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
						/>
					</div>
					<div>
						<label class="block text-xs font-semibold text-slate-700 mb-1">
							{{ __("Observación / CI / Placa (opcional)") }}
						</label>
						<input
							v-model="pickupNotes"
							type="text"
							:placeholder="__('Ej: Camioneta blanca, CI 123456')"
							class="w-full h-9 px-3 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
						/>
					</div>
				</div>
			</template>
		</div>

		<template v-if="!recordedResult" #footer>
			<div class="flex items-center justify-between gap-3 w-full">
				<div class="text-xs text-slate-600 tabular-nums">
					{{ __("Total a entregar hoy:") }}
					<strong class="text-slate-900">{{ formatPickupQty(totalToDeliver) }}</strong>
				</div>
				<div class="flex items-center gap-2">
					<MdxButton variant="secondary" :disabled="saving" @click="show = false">
						{{ __("Cancel") }}
					</MdxButton>
					<MdxButton
						variant="primary"
						:disabled="saving || totalToDeliver <= 0"
						@click="submitPickup"
					>
						{{ saving ? __("Guardando...") : __("Confirmar Entrega") }}
					</MdxButton>
				</div>
			</div>
		</template>
	</MdxModal>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { call } from "frappe-ui";
import { MdxModal, MdxButton, MdxBadge } from "mdx_ui";
import { useToast } from "@/composables/useToast";
import { usePOSSettingsStore } from "@/stores/posSettings";
import { DEFAULT_CURRENCY, formatCurrency as formatCurrencyUtil } from "@/utils/currency";
import {
	formatPickupQty,
	openPickupWhatsApp,
	printPickupReceipt,
} from "@/utils/pickupReceipt";

const props = defineProps({
	modelValue: Boolean,
	control: {
		type: Object,
		default: null,
	},
	currency: {
		type: String,
		default: DEFAULT_CURRENCY,
	},
});

const emit = defineEmits(["update:modelValue", "delivery-recorded"]);

const { showSuccess, showError } = useToast();
const settingsStore = usePOSSettingsStore();

const show = computed({
	get: () => props.modelValue,
	set: (val) => emit("update:modelValue", val),
});

const deliveryRows = ref([]);
const receivedBy = ref("");
const pickupNotes = ref("");
const saving = ref(false);
const recordedResult = ref(null);

const displayControl = computed(() => recordedResult.value?.control || props.control || {});

const totalToDeliver = computed(() =>
	deliveryRows.value.reduce((sum, r) => sum + Math.max(0, Number(r.qty_to_deliver) || 0), 0)
);

function statusBadgeVariant(status) {
	if (status === "Entregado") return "success";
	if (status === "Parcial") return "warning";
	if (status === "Anulado") return "danger";
	return "info";
}

function formatCurrency(val) {
	return formatCurrencyUtil(Number(val || 0), props.currency);
}

function initForm() {
	recordedResult.value = null;
	saving.value = false;
	pickupNotes.value = "";
	receivedBy.value = props.control?.customer_name || props.control?.customer || "";
	deliveryRows.value = (props.control?.items || [])
		.filter((it) => Number(it.qty_pending || 0) > 0.0001)
		.map((it) => ({
			...it,
			qty_to_deliver: Number(it.qty_pending || 0),
		}));
}

watch(
	() => [props.modelValue, props.control?.name],
	([open]) => {
		if (open && props.control) {
			initForm();
		}
	},
	{ immediate: true }
);

function clampRow(row) {
	let v = Number(row.qty_to_deliver);
	if (!Number.isFinite(v) || v < 0) v = 0;
	if (v > Number(row.qty_pending)) v = Number(row.qty_pending);
	row.qty_to_deliver = Math.round(v * 10000) / 10000;
}

function stepRow(row, delta) {
	const current = Number(row.qty_to_deliver) || 0;
	const next = Math.max(0, Math.min(Number(row.qty_pending), current + delta));
	row.qty_to_deliver = Math.round(next * 10000) / 10000;
}

function fillAllRemaining() {
	deliveryRows.value.forEach((r) => {
		r.qty_to_deliver = Number(r.qty_pending || 0);
	});
}

async function submitPickup() {
	if (saving.value || !props.control?.name) return;
	deliveryRows.value.forEach(clampRow);
	const payloadItems = deliveryRows.value
		.filter((r) => Number(r.qty_to_deliver) > 0)
		.map((r) => ({
			name: r.name,
			item_code: r.item_code,
			uom: r.uom,
			qty: Number(r.qty_to_deliver),
		}));

	if (!payloadItems.length) {
		showError(__("Ingresa una cantidad mayor a cero para entregar."));
		return;
	}

	saving.value = true;
	try {
		const res = await call("pos_next.api.delivery_control.record_delivery_pickup", {
			control_name: props.control.name,
			items: payloadItems,
			received_by: receivedBy.value.trim(),
			notes: pickupNotes.value.trim(),
		});
		const data = res?.message || res;
		if (!data?.control) {
			throw new Error(__("Respuesta inválida al registrar entrega"));
		}
		// Preserve customer_phone & financial metadata on updated control for WhatsApp button
		data.control.customer_phone = props.control.customer_phone || "";
		data.control.outstanding_amount = props.control.outstanding_amount || 0;
		recordedResult.value = data;
		showSuccess(
			data.control.status === "Entregado"
				? __("Entrega completada al 100%")
				: __("Entrega parcial registrada")
		);
		emit("delivery-recorded", data);
	} catch (err) {
		showError(err?.messages?.[0] || err?.message || __("No se pudo registrar la entrega"));
	} finally {
		saving.value = false;
	}
}

function handlePrint() {
	if (!recordedResult.value?.control) return;
	printPickupReceipt(recordedResult.value.control, recordedResult.value.log);
}

function handleWhatsApp() {
	if (!recordedResult.value?.control) return;
	openPickupWhatsApp(recordedResult.value.control, recordedResult.value.log);
}
</script>
