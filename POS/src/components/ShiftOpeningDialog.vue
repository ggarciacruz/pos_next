<template>
	<MdxModal
		v-model="open"
		:title="openingModalTitle"
		:subtitle="openingModalSubtitle"
		:size="step === 2 && canCheckout ? '4xl' : 'xl'"
	>
		<template #header-icon>
			<svg class="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
				<rect x="2" y="5" width="20" height="14" rx="2" />
				<path stroke-linecap="round" d="M2 10h20M7 15h3" />
			</svg>
		</template>

		<div class="flex flex-col gap-5">
			<!-- Step Indicator -->
			<div
				v-if="!isContinuousMode && canCheckout && step !== 3"
				class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200"
			>
				<div class="flex items-center gap-2">
					<span
						:class="[
							'w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center tabular-nums',
							step === 1 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700',
						]"
					>
						1
					</span>
					<span :class="['text-xs font-semibold', step === 1 ? 'text-slate-900' : 'text-slate-500']">
						{{ __("Punto de Venta") }}
					</span>
				</div>
				<div class="flex-1 h-px bg-slate-200"></div>
				<div class="flex items-center gap-2">
					<span
						:class="[
							'w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center tabular-nums',
							step === 2 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500',
						]"
					>
						2
					</span>
					<span :class="['text-xs font-semibold', step === 2 ? 'text-slate-900' : 'text-slate-500']">
						{{ __("Arqueo de Apertura") }}
					</span>
				</div>
			</div>

			<!-- Step 1: Select POS Profile -->
			<div v-if="step === 1" class="flex flex-col gap-3.5">
				<div v-if="profilesResource.loading" class="py-8 flex justify-center">
					<MdxLoadingSpinner size="md" :label="__('Cargando puntos de venta...')" />
				</div>

				<div
					v-else-if="profilesResource.data && profilesResource.data.length > 0"
					class="grid grid-cols-1 gap-3"
				>
					<button
						v-for="profile in profilesResource.data"
						:key="profile.name"
						type="button"
						@click="selectPosProfile(profile)"
						:class="[
							'w-full p-4 border rounded-2xl text-start transition-all flex items-center justify-between gap-4 cursor-pointer',
							selectedProfile?.name === profile.name
								? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900/15 shadow-xs'
								: 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70',
						]"
					>
						<div class="flex items-center gap-3.5 min-w-0">
							<div
								:class="[
									'w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-colors',
									selectedProfile?.name === profile.name
										? 'bg-slate-900 text-white border-slate-900'
										: 'bg-slate-100 text-slate-600 border-slate-200',
								]"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
								</svg>
							</div>
							<div class="min-w-0">
								<h3 class="text-sm font-bold text-slate-900 truncate">
									{{ cleanProfileName(profile.name) }}
								</h3>
								<div class="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-500">
									<span>{{ profile.company }}</span>
									<span v-if="profile.warehouse" class="text-slate-300">·</span>
									<span v-if="profile.warehouse" class="truncate">{{ profile.warehouse }}</span>
								</div>
							</div>
						</div>

						<div class="flex items-center gap-2.5 shrink-0">
							<MdxBadge variant="neutral" size="sm">{{ profile.currency || "BOB" }}</MdxBadge>
							<div
								:class="[
									'w-5 h-5 rounded-full border flex items-center justify-center transition-colors',
									selectedProfile?.name === profile.name
										? 'border-slate-900 bg-slate-900 text-white'
										: 'border-slate-300 bg-white',
								]"
							>
								<svg
									v-if="selectedProfile?.name === profile.name"
									class="w-3 h-3"
									fill="none"
									stroke="currentColor"
									stroke-width="3"
									viewBox="0 0 24 24"
								>
									<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
								</svg>
							</div>
						</div>
					</button>
				</div>

				<div v-else class="text-center py-8 text-slate-500 bg-slate-50 border border-slate-200 rounded-2xl">
					<p class="text-sm font-medium text-slate-700">
						{{ __("No POS Profiles available. Please contact your administrator.") }}
					</p>
				</div>

				<div v-if="profilesResource.error" class="rounded-xl bg-red-50 border border-red-200 p-4">
					<p class="text-sm text-red-800">{{ profilesResource.error }}</p>
				</div>
			</div>

			<!-- Step 2: Enter Opening Balances -->
			<div v-if="step === 2" class="flex flex-col gap-4">
				<!-- Executive Context Banner -->
				<div class="bg-white border border-slate-200 rounded-2xl p-3.5 md:p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
					<div class="flex items-center gap-3 text-start">
						<div class="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
							</svg>
						</div>
						<div>
							<div class="flex items-center gap-2">
								<h3 class="text-sm md:text-base font-bold text-slate-900">
									{{ cleanProfileName(selectedProfile?.name) }}
								</h3>
								<MdxBadge variant="neutral" size="sm">
									{{ selectedProfile?.currency || "BOB" }}
								</MdxBadge>
							</div>
							<p class="text-xs text-slate-500 mt-0.5">
								{{ selectedProfile?.company }}
							</p>
						</div>
					</div>

					<div class="flex items-center gap-3 ms-auto">
						<div class="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-end">
							<span class="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
								{{ __("Fondo Inicial Total") }}
							</span>
							<span class="text-sm md:text-base font-extrabold text-slate-900 tabular-nums">
								{{ formatBsAmount(totalOpeningAmount) }}
							</span>
						</div>
						<MdxButton
							v-if="(profilesResource.data?.length || 0) > 1"
							variant="secondary"
							size="sm"
							@click="step = 1"
						>
							{{ __("Cambiar Caja") }}
						</MdxButton>
					</div>
				</div>

				<!-- Vendor Notice -->
				<div v-if="!canCheckout" class="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-start">
					<div class="flex items-center gap-2 text-slate-900 font-bold text-xs mb-1">
						<svg class="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<span>{{ __("Modo Vendedor (Preventa & Cotizaciones)") }}</span>
					</div>
					<p class="text-xs text-slate-600">
						{{ __("Operación comercial sin arqueo de efectivo. Las ventas se cobran en la caja principal por un cajero autorizado.") }}
					</p>
				</div>

				<template v-else>
					<div v-if="dialogDataResource.loading" class="py-6 flex justify-center">
						<MdxLoadingSpinner size="sm" :label="__('Cargando medios de pago...')" />
					</div>

					<div v-else-if="paymentMethods.length > 0" class="flex flex-col gap-4">
						<!-- Primary Cash Section -->
						<div
							v-for="method in cashPaymentMethods"
							:key="method.name"
							class="bg-white border border-slate-200 rounded-2xl p-3.5 md:p-4 shadow-2xs flex flex-col gap-3.5"
						>
							<div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
								<div class="text-start">
									<div class="flex items-center gap-2">
										<h4 class="text-sm md:text-base font-bold text-slate-900">
											{{ __(method.mode_of_payment) }}
										</h4>
										<MdxBadge variant="neutral" size="sm">{{ __("Caja Física") }}</MdxBadge>
									</div>
									<p class="text-xs text-slate-500 mt-0.5">
										{{ __("Cuente el fondo fijo por corte de billete/moneda o ingrese el monto total directo.") }}
									</p>
								</div>

								<div class="w-44">
									<label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 text-end">
										{{ __("Monto Inicial (Bs.)") }}
									</label>
									<input
										:value="openingBalances[method.mode_of_payment] ?? ''"
										@input="(e) => onManualBalanceInput(method.mode_of_payment, e.target.value)"
										type="number"
										placeholder="0.00"
										step="0.01"
										min="0"
										class="w-full h-10 px-3 text-base text-end font-extrabold bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-500 transition-all tabular-nums"
									/>
								</div>
							</div>

							<CashDenominationCounter
								v-model="openingDenominations"
								v-model:exchange-rate="usdExchangeRate"
								@total-change="(val) => onDenominationTotalChange(method.mode_of_payment, val)"
							/>
						</div>

						<!-- Secondary Non-Cash Methods (Compact Grid) -->
						<div
							v-if="nonCashPaymentMethods.length > 0"
							class="bg-white border border-slate-200 rounded-2xl p-3.5 md:p-4 shadow-2xs"
						>
							<div class="flex items-center justify-between mb-3">
								<div class="text-start">
									<h4 class="text-xs md:text-sm font-bold text-slate-900 uppercase tracking-wider">
										{{ __("Medios Digitales y Bancarios (Opcional)") }}
									</h4>
									<p class="text-[11px] text-slate-500">
										{{ __("Normalmente inician en Bs. 0.00 al comenzar el turno.") }}
									</p>
								</div>
							</div>
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<div
									v-for="method in nonCashPaymentMethods"
									:key="method.name"
									class="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200"
								>
									<span class="text-xs md:text-sm font-semibold text-slate-800 truncate">
										{{ __(method.mode_of_payment) }}
									</span>
									<input
										:value="openingBalances[method.mode_of_payment] ?? ''"
										@input="(e) => onManualBalanceInput(method.mode_of_payment, e.target.value)"
										type="number"
										placeholder="0.00"
										step="0.01"
										min="0"
										class="w-32 h-9 px-2.5 text-sm text-end font-bold bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-500 tabular-nums"
									/>
								</div>
							</div>
						</div>

						<!-- Observaciones de Apertura -->
						<div class="bg-white border border-slate-200 rounded-2xl p-3.5 text-start shadow-2xs">
							<label class="block text-xs font-bold text-slate-700 mb-1.5">
								{{ __("Observaciones de Apertura (Opcional)") }}
							</label>
							<input
								v-model="openingObservations"
								type="text"
								:placeholder="__('Ej. Fondo fijo recibido para cambio, turno mañana...')"
								class="w-full h-10 px-3 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-500"
							/>
						</div>
					</div>

					<div v-else class="text-center py-4 text-slate-500">
						<p class="text-sm">
							{{ __("No payment methods configured for this POS Profile") }}
						</p>
					</div>
				</template>

				<div v-if="dialogDataResource.error" class="rounded-xl bg-red-50 border border-red-200 p-4">
					<p class="text-sm text-red-800">{{ dialogDataResource.error }}</p>
				</div>

				<div v-if="createShiftResource.error" class="rounded-xl bg-red-50 border border-red-200 p-4">
					<p class="text-sm text-red-800">{{ createShiftResource.error }}</p>
				</div>
			</div>

			<!-- Step 3: Resume or Open New -->
			<div v-if="step === 3" class="flex flex-col gap-4 py-2">
				<div class="text-center">
					<div class="mx-auto flex items-center justify-center h-12 w-12 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 mb-4">
						<svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<h3 class="text-lg font-bold text-slate-900 mb-1.5">
						{{ __("Existing Shift Found") }}
					</h3>
					<p class="text-sm text-slate-500 mb-5">
						{{ __("You have an open shift. Would you like to resume it or close it and open a new one?") }}
					</p>

					<div v-if="existingShift" class="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 text-start">
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
							<div>
								<span class="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
									{{ __("Punto de Venta") }}
								</span>
								<span class="font-bold text-slate-900">
									{{ cleanProfileName(existingShift.pos_profile?.name) }}
								</span>
							</div>
							<div>
								<span class="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
									{{ __("Apertura") }}
								</span>
								<span class="font-semibold text-slate-800 tabular-nums">
									{{ formatDateTime(existingShift.pos_opening_shift?.period_start_date) }}
								</span>
							</div>
						</div>
					</div>

					<div class="flex flex-wrap gap-3 justify-center">
						<MdxButton variant="primary" @click="resumeShift">
							{{ __("Resume Shift") }}
						</MdxButton>
						<MdxButton
							variant="secondary"
							@click="closeAndOpenNew"
							:disabled="closingExistingShift"
						>
							{{ __("Close & Open New") }}
						</MdxButton>
					</div>
				</div>
			</div>
		</div>

		<template #footer>
			<div class="flex justify-between items-center w-full gap-2">
				<MdxButton v-if="step > 1 && step !== 3" variant="secondary" @click="step--">
					{{ __("Back") }}
				</MdxButton>
				<div v-else></div>

				<div class="flex gap-2">
					<MdxButton
						variant="secondary"
						@click="closeDialog('cancelled')"
						:disabled="createShiftResource.loading"
					>
						{{ __("Cancel") }}
					</MdxButton>
					<MdxButton
						v-if="step === 1"
						variant="primary"
						@click="nextStep"
						:disabled="!selectedProfile || createShiftResource.loading"
						:loading="createShiftResource.loading"
					>
						{{ isContinuousMode ? __("Ingresar") : __("Next") }}
					</MdxButton>
					<MdxButton
						v-if="step === 2"
						variant="primary"
						@click="openShift"
						:loading="createShiftResource.loading"
					>
						{{ __("Open Shift") }}
					</MdxButton>
				</div>
			</div>
		</template>
	</MdxModal>

	<ShiftClosingDialog
		v-if="existingShift"
		v-model="showClosingDialog"
		:opening-shift="existingShift?.pos_opening_shift?.name"
		@shift-closed="handleExistingShiftClosed"
	/>
</template>

<script setup>
import { createResource } from "frappe-ui";
import { MdxModal, MdxButton, MdxLoadingSpinner, MdxBadge } from "mdx_ui";
import { computed, ref, watch } from "vue";
import { useShift } from "../composables/useShift";
import { useFormatters } from "../composables/useFormatters";
import ShiftClosingDialog from "./ShiftClosingDialog.vue";
import CashDenominationCounter from "./common/CashDenominationCounter.vue";
import { useBootstrapStore } from "../stores/bootstrap";

const bootstrapStore = useBootstrapStore();
const canCheckout = computed(() => bootstrapStore.canCheckout());

const props = defineProps({
	modelValue: Boolean,
});

const emit = defineEmits(["update:modelValue", "shift-opened", "dialog-closed"]);

const open = computed({
	get: () => props.modelValue,
	set: (value) => emit("update:modelValue", value),
});

const { createOpeningShift, getOpeningDialogData, checkOpeningShift } = useShift();
const { formatDateTime } = useFormatters();

function cleanProfileName(name) {
	return name ? String(name).replace(/\s*-\s*[A-Z0-9]{2,5}$/, "").trim() : "";
}

function formatBsAmount(val) {
	return `Bs. ${(Number(val) || 0).toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;
}

const step = ref(1);
const selectedProfile = ref(null);
const openingBalances = ref({});
const openingDenominations = ref([]);
const usdExchangeRate = ref(6.96);
const openingObservations = ref("");
const existingShift = ref(null);
const showClosingDialog = ref(false);
const closingExistingShift = ref(false);
const restartProfileName = ref(null);

// Get POS Profiles
const profilesResource = createResource({
	url: "pos_next.api.pos_profile.get_pos_profiles",
	auto: false,
});

// Get dialog data (payment methods)
const dialogDataResource = createResource({
	url: "pos_next.api.shifts.get_opening_dialog_data",
	auto: false,
});

// Create shift resource
const createShiftResource = createOpeningShift;

// Computed payment methods for selected profile
const paymentMethods = computed(() => {
	if (!dialogDataResource.data || !selectedProfile.value) return [];

	return (dialogDataResource.data.payments_method || []).filter(
		(method) => method.parent === selectedProfile.value.name
	);
});

const cashPaymentMethods = computed(() =>
	paymentMethods.value.filter((method) => isCashMethod(method.mode_of_payment))
);

const nonCashPaymentMethods = computed(() =>
	paymentMethods.value.filter((method) => !isCashMethod(method.mode_of_payment))
);

const totalOpeningAmount = computed(() =>
	paymentMethods.value.reduce(
		(sum, method) => sum + (Number.parseFloat(openingBalances.value[method.mode_of_payment]) || 0),
		0
	)
);

const isContinuousMode = computed(() => {
	if (selectedProfile.value && selectedProfile.value.enable_shift_management !== undefined) {
		return Number(selectedProfile.value.enable_shift_management) === 0;
	}
	if (profilesResource.data && profilesResource.data.length > 0) {
		return profilesResource.data.every((p) => Number(p.enable_shift_management ?? 1) === 0);
	}
	return false;
});

const openingModalTitle = computed(() => {
	if (isContinuousMode.value) return __("Seleccionar Punto de Venta");
	if (step.value === 3) return __("Turno Abierto Detectado");
	if (step.value === 2) return __("Apertura de Caja — Arqueo Inicial");
	return __("Apertura de Caja");
});

const openingModalSubtitle = computed(() => {
	if (step.value === 2 && selectedProfile.value) {
		return `${cleanProfileName(selectedProfile.value.name)} · ${selectedProfile.value.company || ""}`;
	}
	if (step.value === 1) {
		return __("Seleccione el punto de venta para iniciar jornada");
	}
	return "";
});

// Watch dialog open state
// Use { immediate: true } to ensure initDialog runs even when
// the component mounts with open already true (e.g., after logout with dialog open)
watch(
	open,
	(isOpen) => {
		if (isOpen) {
			initDialog();
		} else {
			resetDialog();
		}
	},
	{ immediate: true }
);

watch(showClosingDialog, (isOpen) => {
	closingExistingShift.value = isOpen;
	if (!isOpen && existingShift.value) {
		restartProfileName.value = null;
	}
});

async function initDialog() {
	step.value = 1;
	selectedProfile.value = null;
	existingShift.value = null;
	openingBalances.value = {};
	openingDenominations.value = [];
	usdExchangeRate.value = 6.96;
	openingObservations.value = "";
	dialogDataResource.reset();

	try {
		// Await profile fetch to ensure data is loaded before proceeding
		await profilesResource.fetch();

		// Check if user already has an open shift
		const checkResult = await checkOpeningShift.fetch();
		const allProfilesContinuous =
			profilesResource.data &&
			profilesResource.data.length > 0 &&
			profilesResource.data.every((p) => Number(p.enable_shift_management ?? 1) === 0);

		if (checkResult && !allProfilesContinuous) {
			existingShift.value = checkResult;
			step.value = 3;
		} else if (checkResult && allProfilesContinuous) {
			existingShift.value = checkResult;
			step.value = 1;
			const activeName = checkResult.pos_profile?.name;
			selectedProfile.value =
				profilesResource.data.find((p) => p.name === activeName) ||
				profilesResource.data[0];
		} else if (profilesResource.data && profilesResource.data.length === 1) {
			selectedProfile.value = profilesResource.data[0];
		}
	} catch (error) {
		console.error("Error initializing shift dialog:", error);
		// Error will be displayed via profilesResource.error in the UI
	}
}

function resetDialog() {
	step.value = 1;
	selectedProfile.value = null;
	openingBalances.value = {};
	openingDenominations.value = [];
	usdExchangeRate.value = 6.96;
	openingObservations.value = "";
	existingShift.value = null;
	profilesResource.reset();
	dialogDataResource.reset();
	createShiftResource.reset();
}

function isCashMethod(modeName) {
	const m = String(modeName || "").toLowerCase();
	return m.includes("cash") || m.includes("efectivo");
}

function onDenominationTotalChange(modeName, totalBob) {
	openingBalances.value[modeName] = totalBob > 0 ? totalBob : "";
}

function onManualBalanceInput(modeName, rawVal) {
	openingBalances.value[modeName] = rawVal;
	if (isCashMethod(modeName) && openingDenominations.value.length > 0) {
		openingDenominations.value = [];
	}
}

function selectPosProfile(profile) {
	selectedProfile.value = profile;
}

async function nextStep() {
	if (step.value === 1 && selectedProfile.value) {
		await dialogDataResource.fetch();
		if (!canCheckout.value || isContinuousMode.value) {
			// Continuous mode or vendor role: bypass cash balances step and open/activate shift immediately
			await openShift();
		} else {
			step.value = 2;
		}
	}
}

async function openShift() {
	if (!selectedProfile.value) return;

	// Prepare balance details
	const balance_details = paymentMethods.value.map((method) => ({
		mode_of_payment: method.mode_of_payment,
		opening_amount: Number.parseFloat(openingBalances.value[method.mode_of_payment] || 0),
	}));

	try {
		await createShiftResource.submit({
			pos_profile: selectedProfile.value.name,
			company: selectedProfile.value.company,
			balance_details,
			opening_denominations: openingDenominations.value,
			usd_exchange_rate: usdExchangeRate.value,
			opening_observations: openingObservations.value,
		});

		emit("shift-opened");
		closeDialog("shift-opened");
	} catch (error) {
		console.error("Error opening shift:", error);
	}
}

function resumeShift() {
	emit("shift-opened");
	closeDialog("resumed");
}

function closeAndOpenNew() {
	if (!existingShift.value?.pos_opening_shift?.name) {
		return;
	}

	restartProfileName.value = existingShift.value.pos_profile?.name || null;
	showClosingDialog.value = true;
}

function closeDialog(reason) {
	open.value = false;
	emit("dialog-closed", { reason });
}

async function handleExistingShiftClosed() {
	showClosingDialog.value = false;
	const profileToRestore = restartProfileName.value;
	restartProfileName.value = null;
	existingShift.value = null;
	step.value = 1;
	openingBalances.value = {};
	openingDenominations.value = [];
	openingObservations.value = "";

	await checkOpeningShift.fetch();

	if (!profilesResource.data || profilesResource.data.length === 0) {
		await profilesResource.fetch();
	}

	if (profileToRestore) {
		const matchedProfile = profilesResource.data?.find(
			(profile) => profile.name === profileToRestore
		);

		if (matchedProfile) {
			selectedProfile.value = matchedProfile;
			await dialogDataResource.fetch();
			step.value = 2;
		}
	}
}
</script>
