<template>
	<div class="bg-slate-50/80 border border-slate-200 rounded-2xl p-3.5 md:p-4 flex flex-col gap-3.5">
		<!-- Header Strip -->
		<div class="flex flex-wrap items-center justify-between gap-2.5">
			<div class="flex items-center gap-2.5 text-start">
				<div class="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-slate-700 shrink-0">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
						<rect x="2" y="6" width="20" height="12" rx="2" />
						<circle cx="12" cy="12" r="2.2" />
						<path stroke-linecap="round" d="M6 12h.01M18 12h.01" />
					</svg>
				</div>
				<div>
					<div class="flex items-center gap-2 flex-wrap">
						<h4 class="text-xs md:text-sm font-bold text-slate-900 tracking-tight">
							{{ __("Conteo Detallado por Cortes") }}
						</h4>
						<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white border border-slate-200 text-slate-600 tabular-nums">
							{{ totalPieces }} {{ totalPieces === 1 ? __("pieza") : __("piezas") }}
						</span>
					</div>
					<p class="text-[11px] text-slate-500 mt-0.5">
						{{ __("Use los botones + / - o escriba la cantidad de billetes y monedas de cada corte.") }}
					</p>
				</div>
			</div>

			<div class="flex items-center gap-2">
				<button
					type="button"
					:disabled="disabled"
					@click="showUsd = !showUsd"
					:class="[
						'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all disabled:opacity-50 cursor-pointer',
						showUsd || totalUsd > 0
							? 'bg-slate-900 text-white border-slate-900 shadow-xs'
							: 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100',
					]"
				>
					<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 2v20m5-15H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H7" />
					</svg>
					<span>{{ showUsd ? __("Ocultar USD") : __("Dólares (USD)") }}</span>
				</button>
				<button
					type="button"
					:disabled="disabled || totalCountedBob <= 0"
					@click="clearAll"
					class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
				>
					<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
					</svg>
					<span>{{ __("Reiniciar") }}</span>
				</button>
			</div>
		</div>

		<!-- Bolivianos: Billetes y Monedas -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
			<!-- Billetes Bs. -->
			<div class="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs flex flex-col gap-2.5">
				<div class="flex items-center justify-between border-b border-slate-100 pb-2">
					<div class="flex items-center gap-2">
						<svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
							<rect x="3" y="7" width="18" height="10" rx="2" />
							<path stroke-linecap="round" d="M7 12h10" />
						</svg>
						<span class="text-xs font-bold text-slate-800 uppercase tracking-wider">{{ __("Billetes (Bs.)") }}</span>
					</div>
					<span class="px-2 py-0.5 rounded-lg bg-slate-100 text-xs font-bold text-slate-900 tabular-nums">
						{{ formatBs(totalBobBills) }}
					</span>
				</div>

				<div class="grid grid-cols-[68px_1fr_88px] items-center gap-2 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
					<span class="text-start">{{ __("Corte") }}</span>
					<span class="text-center">{{ __("Cantidad") }}</span>
					<span class="text-end">{{ __("Subtotal") }}</span>
				</div>

				<div class="flex flex-col gap-1.5">
					<div
						v-for="val in BOB_BILLS"
						:key="`bob-bill-${val}`"
						:class="[
							'grid grid-cols-[68px_1fr_88px] items-center gap-2 p-1.5 rounded-xl border transition-colors',
							getQty('BOB', 'Billete', val) > 0
								? 'bg-slate-50 border-slate-300'
								: 'bg-white border-transparent hover:bg-slate-50/70',
						]"
					>
						<span
							:class="[
								'inline-flex items-center justify-center h-7 px-2 rounded-lg text-xs font-bold tabular-nums transition-colors',
								getQty('BOB', 'Billete', val) > 0
									? 'bg-slate-900 text-white'
									: 'bg-slate-100 text-slate-700 border border-slate-200',
							]"
						>
							Bs. {{ val }}
						</span>

						<div class="inline-flex items-center justify-center h-8 rounded-lg border border-slate-300 bg-white overflow-hidden">
							<button
								type="button"
								:disabled="disabled || getQty('BOB', 'Billete', val) <= 0"
								@click="stepQty('BOB', 'Billete', val, -1)"
								class="w-8 h-full flex items-center justify-center text-slate-600 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-35 disabled:cursor-not-allowed border-e border-slate-200 transition-colors cursor-pointer"
								:aria-label="__('Disminuir billetes de {0}', [val])"
							>
								<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
									<path stroke-linecap="round" d="M5 12h14" />
								</svg>
							</button>
							<input
								:value="quantities[`BOB-Billete-${val}`] ?? ''"
								@input="(e) => setQty('BOB', 'Billete', val, e.target.value)"
								type="number"
								min="0"
								step="1"
								placeholder="0"
								:disabled="disabled"
								class="no-spinners w-full min-w-[36px] h-full px-1 text-sm text-center font-bold bg-transparent text-slate-900 focus:outline-none focus:bg-slate-50 disabled:bg-slate-100 tabular-nums"
							/>
							<button
								type="button"
								:disabled="disabled"
								@click="stepQty('BOB', 'Billete', val, 1)"
								class="w-8 h-full flex items-center justify-center text-slate-700 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-35 disabled:cursor-not-allowed border-s border-slate-200 transition-colors cursor-pointer"
								:aria-label="__('Aumentar billetes de {0}', [val])"
							>
								<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
									<path stroke-linecap="round" d="M12 5v14M5 12h14" />
								</svg>
							</button>
						</div>

						<span
							:class="[
								'text-xs text-end tabular-nums px-1',
								getQty('BOB', 'Billete', val) > 0 ? 'font-bold text-slate-900' : 'font-medium text-slate-400',
							]"
						>
							{{ formatBs(getQty('BOB', 'Billete', val) * val) }}
						</span>
					</div>
				</div>
			</div>

			<!-- Monedas Bs. -->
			<div class="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs flex flex-col gap-2.5">
				<div class="flex items-center justify-between border-b border-slate-100 pb-2">
					<div class="flex items-center gap-2">
						<svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
							<circle cx="12" cy="12" r="8" />
							<circle cx="12" cy="12" r="3" />
						</svg>
						<span class="text-xs font-bold text-slate-800 uppercase tracking-wider">{{ __("Monedas (Bs.)") }}</span>
					</div>
					<span class="px-2 py-0.5 rounded-lg bg-slate-100 text-xs font-bold text-slate-900 tabular-nums">
						{{ formatBs(totalBobCoins) }}
					</span>
				</div>

				<div class="grid grid-cols-[68px_1fr_88px] items-center gap-2 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
					<span class="text-start">{{ __("Corte") }}</span>
					<span class="text-center">{{ __("Cantidad") }}</span>
					<span class="text-end">{{ __("Subtotal") }}</span>
				</div>

				<div class="flex flex-col gap-1.5">
					<div
						v-for="val in BOB_COINS"
						:key="`bob-coin-${val}`"
						:class="[
							'grid grid-cols-[68px_1fr_88px] items-center gap-2 p-1.5 rounded-xl border transition-colors',
							getQty('BOB', 'Moneda', val) > 0
								? 'bg-slate-50 border-slate-300'
								: 'bg-white border-transparent hover:bg-slate-50/70',
						]"
					>
						<span
							:class="[
								'inline-flex items-center justify-center h-7 px-2 rounded-lg text-xs font-bold tabular-nums transition-colors',
								getQty('BOB', 'Moneda', val) > 0
									? 'bg-slate-900 text-white'
									: 'bg-slate-100 text-slate-700 border border-slate-200',
							]"
						>
							Bs. {{ val >= 1 ? val : val.toFixed(2) }}
						</span>

						<div class="inline-flex items-center justify-center h-8 rounded-lg border border-slate-300 bg-white overflow-hidden">
							<button
								type="button"
								:disabled="disabled || getQty('BOB', 'Moneda', val) <= 0"
								@click="stepQty('BOB', 'Moneda', val, -1)"
								class="w-8 h-full flex items-center justify-center text-slate-600 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-35 disabled:cursor-not-allowed border-e border-slate-200 transition-colors cursor-pointer"
								:aria-label="__('Disminuir monedas de {0}', [val])"
							>
								<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
									<path stroke-linecap="round" d="M5 12h14" />
								</svg>
							</button>
							<input
								:value="quantities[`BOB-Moneda-${val}`] ?? ''"
								@input="(e) => setQty('BOB', 'Moneda', val, e.target.value)"
								type="number"
								min="0"
								step="1"
								placeholder="0"
								:disabled="disabled"
								class="no-spinners w-full min-w-[36px] h-full px-1 text-sm text-center font-bold bg-transparent text-slate-900 focus:outline-none focus:bg-slate-50 disabled:bg-slate-100 tabular-nums"
							/>
							<button
								type="button"
								:disabled="disabled"
								@click="stepQty('BOB', 'Moneda', val, 1)"
								class="w-8 h-full flex items-center justify-center text-slate-700 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-35 disabled:cursor-not-allowed border-s border-slate-200 transition-colors cursor-pointer"
								:aria-label="__('Aumentar monedas de {0}', [val])"
							>
								<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
									<path stroke-linecap="round" d="M12 5v14M5 12h14" />
								</svg>
							</button>
						</div>

						<span
							:class="[
								'text-xs text-end tabular-nums px-1',
								getQty('BOB', 'Moneda', val) > 0 ? 'font-bold text-slate-900' : 'font-medium text-slate-400',
							]"
						>
							{{ formatBs(getQty('BOB', 'Moneda', val) * val) }}
						</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Opcional: Dólares Americanos -->
		<div v-if="showUsd" class="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs flex flex-col gap-3">
			<div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
				<div class="flex items-center gap-2">
					<span class="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[11px] font-bold">USD</span>
					<span class="text-xs font-bold text-slate-800 uppercase tracking-wider">{{ __("Billetes en Dólares Americanos") }}</span>
				</div>
				<div class="flex items-center gap-2">
					<label class="text-xs font-semibold text-slate-600">{{ __("T/C (Bs. por USD):") }}</label>
					<input
						:value="localRate"
						@input="(e) => updateRate(e.target.value)"
						type="number"
						step="0.01"
						min="1"
						:disabled="disabled"
						class="no-spinners w-20 h-8 px-2 text-xs text-center font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-500 tabular-nums"
					/>
				</div>
			</div>

			<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
				<div
					v-for="val in USD_BILLS"
					:key="`usd-bill-${val}`"
					:class="[
						'flex flex-col gap-1.5 rounded-xl p-2.5 border transition-colors',
						getQty('USD', 'Billete', val) > 0
							? 'bg-slate-50 border-slate-400'
							: 'bg-white border-slate-200',
					]"
				>
					<div class="flex items-center justify-between">
						<span class="text-xs font-bold text-slate-900 tabular-nums">$us {{ val }}</span>
						<span class="text-[11px] text-slate-500 tabular-nums">
							${{ (getQty('USD', 'Billete', val) * val).toFixed(0) }}
						</span>
					</div>
					<div class="inline-flex items-center h-8 rounded-lg border border-slate-300 bg-white overflow-hidden">
						<button
							type="button"
							:disabled="disabled || getQty('USD', 'Billete', val) <= 0"
							@click="stepQty('USD', 'Billete', val, -1)"
							class="w-7 h-full flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-35 border-e border-slate-200 cursor-pointer"
						>
							<svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
								<path stroke-linecap="round" d="M5 12h14" />
							</svg>
						</button>
						<input
							:value="quantities[`USD-Billete-${val}`] ?? ''"
							@input="(e) => setQty('USD', 'Billete', val, e.target.value)"
							type="number"
							min="0"
							step="1"
							placeholder="0"
							:disabled="disabled"
							class="no-spinners w-full min-w-[28px] h-full px-1 text-xs text-center font-bold bg-transparent text-slate-900 focus:outline-none tabular-nums"
						/>
						<button
							type="button"
							:disabled="disabled"
							@click="stepQty('USD', 'Billete', val, 1)"
							class="w-7 h-full flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-35 border-s border-slate-200 cursor-pointer"
						>
							<svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
								<path stroke-linecap="round" d="M12 5v14M5 12h14" />
							</svg>
						</button>
					</div>
				</div>
			</div>

			<div class="flex flex-wrap items-center justify-end gap-4 text-xs text-slate-600 pt-1 border-t border-slate-100">
				<span>{{ __("Total USD:") }} <strong class="text-slate-900 tabular-nums">$us {{ totalUsd.toFixed(2) }}</strong></span>
				<span>{{ __("Equivalente en Bs.:") }} <strong class="text-slate-900 tabular-nums">{{ formatBs(totalUsdInBob) }}</strong></span>
			</div>
		</div>

		<!-- Executive Dark Total Bar -->
		<div class="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-xs">
			<div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300 tabular-nums">
				<span>{{ __("Billetes:") }} <strong class="text-white">{{ formatBs(totalBobBills) }}</strong></span>
				<span class="text-slate-600">|</span>
				<span>{{ __("Monedas:") }} <strong class="text-white">{{ formatBs(totalBobCoins) }}</strong></span>
				<template v-if="totalUsd > 0">
					<span class="text-slate-600">|</span>
					<span>USD: <strong class="text-white">{{ formatBs(totalUsdInBob) }}</strong></span>
				</template>
			</div>
			<div class="flex items-center gap-2.5 ms-auto">
				<span class="text-xs font-semibold text-slate-300 uppercase tracking-wider">
					{{ __("Total Contado") }}
				</span>
				<span class="text-lg md:text-xl font-extrabold text-white tabular-nums">
					{{ formatBs(totalCountedBob) }}
				</span>
			</div>
		</div>
	</div>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";

const BOB_BILLS = [200, 100, 50, 20, 10];
const BOB_COINS = [5, 2, 1, 0.5, 0.2, 0.1];
const USD_BILLS = [100, 50, 20, 10, 5, 1];

const props = defineProps({
	modelValue: {
		type: Array,
		default: () => [],
	},
	exchangeRate: {
		type: Number,
		default: 6.96,
	},
	disabled: {
		type: Boolean,
		default: false,
	},
});

const emit = defineEmits(["update:modelValue", "update:exchangeRate", "total-change"]);

const quantities = reactive({});
const showUsd = ref(false);
const localRate = ref(Number(props.exchangeRate) || 6.96);

function initFromProps(rows) {
	Object.keys(quantities).forEach((k) => delete quantities[k]);
	let hasUsd = false;
	for (const r of rows || []) {
		const qty = Number.parseInt(r.quantity, 10) || 0;
		const val = Number.parseFloat(r.denomination_value) || 0;
		const cur = r.currency || "BOB";
		const dtype = r.denomination_type || "Billete";
		if (qty > 0 && val > 0) {
			quantities[`${cur}-${dtype}-${val}`] = qty;
			if (cur === "USD") hasUsd = true;
		}
	}
	if (hasUsd) showUsd.value = true;
}

watch(
	() => props.modelValue,
	(val) => {
		if (!val || val.length === 0) {
			Object.keys(quantities).forEach((k) => delete quantities[k]);
		} else {
			initFromProps(val);
		}
	},
	{ immediate: true }
);

watch(
	() => props.exchangeRate,
	(val) => {
		const parsed = Number.parseFloat(val);
		if (Number.isFinite(parsed) && parsed > 0) {
			localRate.value = parsed;
		}
	}
);

const totalBobBills = computed(() =>
	BOB_BILLS.reduce((sum, val) => sum + (Number.parseInt(quantities[`BOB-Billete-${val}`], 10) || 0) * val, 0)
);

const totalBobCoins = computed(() =>
	Math.round(
		BOB_COINS.reduce((sum, val) => sum + (Number.parseInt(quantities[`BOB-Moneda-${val}`], 10) || 0) * val, 0) *
			100
	) / 100
);

const totalUsd = computed(() =>
	USD_BILLS.reduce((sum, val) => sum + (Number.parseInt(quantities[`USD-Billete-${val}`], 10) || 0) * val, 0)
);

const totalPieces = computed(() => {
	let count = 0;
	for (const val of BOB_BILLS) count += Number.parseInt(quantities[`BOB-Billete-${val}`], 10) || 0;
	for (const val of BOB_COINS) count += Number.parseInt(quantities[`BOB-Moneda-${val}`], 10) || 0;
	for (const val of USD_BILLS) count += Number.parseInt(quantities[`USD-Billete-${val}`], 10) || 0;
	return count;
});

const totalUsdInBob = computed(() => Math.round(totalUsd.value * (Number(localRate.value) || 6.96) * 100) / 100);

const totalCountedBob = computed(() => Math.round((totalBobBills.value + totalBobCoins.value + totalUsdInBob.value) * 100) / 100);

function getQty(currency, dtype, val) {
	return Number.parseInt(quantities[`${currency}-${dtype}-${val}`], 10) || 0;
}

function stepQty(currency, dtype, val, delta) {
	if (props.disabled) return;
	const next = Math.max(0, getQty(currency, dtype, val) + delta);
	setQty(currency, dtype, val, next === 0 ? "" : next);
}

function emitRows() {
	const rows = [];
	for (const val of BOB_BILLS) {
		const q = Number.parseInt(quantities[`BOB-Billete-${val}`], 10) || 0;
		if (q > 0) rows.push({ currency: "BOB", denomination_type: "Billete", denomination_value: val, quantity: q, subtotal: Math.round(q * val * 100) / 100 });
	}
	for (const val of BOB_COINS) {
		const q = Number.parseInt(quantities[`BOB-Moneda-${val}`], 10) || 0;
		if (q > 0) rows.push({ currency: "BOB", denomination_type: "Moneda", denomination_value: val, quantity: q, subtotal: Math.round(q * val * 100) / 100 });
	}
	for (const val of USD_BILLS) {
		const q = Number.parseInt(quantities[`USD-Billete-${val}`], 10) || 0;
		if (q > 0) rows.push({ currency: "USD", denomination_type: "Billete", denomination_value: val, quantity: q, subtotal: Math.round(q * val * 100) / 100 });
	}
	emit("update:modelValue", rows);
	emit("total-change", totalCountedBob.value);
}

function setQty(currency, dtype, val, rawVal) {
	const key = `${currency}-${dtype}-${val}`;
	const trimmed = rawVal === null || rawVal === undefined ? "" : String(rawVal).trim();
	if (trimmed === "") {
		delete quantities[key];
	} else {
		const parsed = Math.max(0, Number.parseInt(trimmed, 10) || 0);
		if (parsed === 0) {
			delete quantities[key];
		} else {
			quantities[key] = parsed;
		}
	}
	emitRows();
}

function updateRate(rawVal) {
	const parsed = Number.parseFloat(rawVal);
	const valid = Number.isFinite(parsed) && parsed > 0 ? parsed : 6.96;
	localRate.value = valid;
	emit("update:exchangeRate", valid);
	if (totalUsd.value > 0) {
		emitRows();
	}
}

function clearAll() {
	Object.keys(quantities).forEach((k) => delete quantities[k]);
	emitRows();
}

function formatBs(val) {
	return `Bs. ${(Number(val) || 0).toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;
}
</script>

<style scoped>
.no-spinners::-webkit-inner-spin-button,
.no-spinners::-webkit-outer-spin-button {
	-webkit-appearance: none;
	margin: 0;
}
.no-spinners {
	-moz-appearance: textfield;
}
</style>
