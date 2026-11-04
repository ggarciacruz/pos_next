<template>
	<MdxModal
		v-model="show"
		:title="isEditMode ? __('Edit Customer') : __('Create New Customer')"
		size="md"
	>
		<div class="flex flex-col gap-3.5 px-0.5">
			<!-- Customer Name (Required) -->
			<div>
				<label class="block text-start text-xs font-bold text-slate-700 mb-1">
					{{ __("Customer Name") }} <span class="text-red-500">*</span>
				</label>
				<input
					v-model="customerData.customer_name"
					type="text"
					:placeholder="__('Enter customer name')"
					required
					class="w-full h-9 px-3 border border-slate-200 rounded-xl text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-start"
					@keydown.enter.prevent="handleCreate"
				/>
			</div>

			<!-- Mobile Number with Country Code Selector -->
			<div>
				<label class="block text-start text-xs font-bold text-slate-700 mb-1">
					{{ __("Mobile Number") }}
				</label>
				<div class="flex gap-2">
					<!-- Country Code Dropdown -->
					<div class="relative" ref="dropdownRef">
						<button
							type="button"
							@click="showCountryDropdown = !showCountryDropdown"
							class="flex items-center gap-1.5 w-24 h-9 ps-2.5 pe-1.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white hover:bg-slate-50"
						>
							<img
								:src="`https://flagcdn.com/h24/${currentCountryCode}.png`"
								:alt="currentCountryCode"
								class="w-5 h-auto rounded-sm"
								@error="handleFlagError"
							/>
							<span class="flex-1 text-start tabular-nums">{{
								selectedCountryCode || "+591"
							}}</span>
							<svg
								class="w-4 h-4 text-slate-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 9l-7 7-7-7"
								/>
							</svg>
						</button>

						<!-- Country Search Dropdown -->
						<div
							v-if="showCountryDropdown"
							class="absolute start-0 z-50 mt-1 w-72 sm:w-80 max-h-72 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden"
						>
							<div class="sticky top-0 bg-white border-b border-slate-200 p-2">
								<input
									ref="countrySearchRef"
									v-model="countrySearchQuery"
									type="text"
									:placeholder="__('Search country or code...')"
									class="w-full h-8 px-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
									@keydown.escape="showCountryDropdown = false"
								/>
							</div>
							<div class="overflow-y-auto max-h-56">
								<button
									v-for="country in filteredCountries"
									:key="country.code"
									type="button"
									@click="selectCountry(country)"
									class="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 transition-colors text-start"
									:class="{
										'bg-blue-50/60': selectedCountryCode === country.isd,
									}"
								>
									<img
										:src="`https://flagcdn.com/h24/${country.code.toLowerCase()}.png`"
										:alt="country.name"
										class="w-5 h-auto rounded-sm shadow-sm"
										@error="(e) => (e.target.style.display = 'none')"
									/>
									<span class="flex-1 text-xs font-semibold text-slate-700">{{
										country.name
									}}</span>
									<span class="text-xs font-medium text-slate-500 tabular-nums">{{
										country.isd
									}}</span>
								</button>
								<div
									v-if="filteredCountries.length === 0"
									class="px-4 py-6 text-center text-xs text-slate-500"
								>
									{{ __("No countries found") }}
								</div>
							</div>
						</div>
					</div>

					<!-- Phone Number Input -->
					<input
						v-model="phoneNumber"
						type="tel"
						:placeholder="__('Enter phone number')"
						class="flex-1 h-9 px-3 border border-slate-200 rounded-xl text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-start tabular-nums"
						@input="updateMobileNumber"
						@keydown.enter.prevent="handleCreate"
					/>
				</div>
			</div>

			<!-- Dirección / Puesto de Entrega (Opcional) -->
			<div>
				<label class="block text-start text-xs font-bold text-slate-700 mb-1">
					{{ __("Dirección / Puesto de Entrega") }}
				</label>
				<input
					v-model="customerData.primary_address"
					type="text"
					:placeholder="__('Ej: Feria / Tienda / Calle y zona de entrega (opcional)')"
					class="w-full h-9 px-3 border border-slate-200 rounded-xl text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-start"
					@keydown.enter.prevent="handleCreate"
				/>
			</div>

			<!-- Datos de Facturación (Solo visible si la Facturación está habilitada en Configuración del POS) -->
			<div
				v-if="settingsStore.enableSiatFiscalFormat"
				class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 border-t border-slate-200"
			>
				<!-- NIT / CI -->
				<div>
					<label class="block text-start text-xs font-bold text-slate-700 mb-1">
						{{ __("NIT / CI") }}
					</label>
					<input
						v-model="customerData.tax_id"
						type="text"
						:placeholder="__('Número de NIT o CI')"
						class="w-full h-9 px-3 border border-slate-200 rounded-xl text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-start tabular-nums"
						@keydown.enter.prevent="handleCreate"
					/>
				</div>

				<!-- Razón Social -->
				<div>
					<label class="block text-start text-xs font-bold text-slate-700 mb-1">
						{{ __("Razón Social / Nombre Factura") }}
					</label>
					<input
						v-model="customerData.custom_razon_social"
						type="text"
						:placeholder="customerData.customer_name || __('Nombre o Apellido para factura')"
						class="w-full h-9 px-3 border border-slate-200 rounded-xl text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-start"
						@keydown.enter.prevent="handleCreate"
					/>
				</div>
			</div>

			<!-- Permission Warning -->
			<div
				v-if="!hasPermission"
				class="px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl"
			>
				<div class="flex items-start gap-2">
					<svg
						class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5"
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<path
							fill-rule="evenodd"
							d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
							clip-rule="evenodd"
						/>
					</svg>
					<div class="flex-1">
						<p class="text-xs font-bold text-amber-900">
							{{ __("Permission Required") }}
						</p>
						<p class="text-[11px] text-amber-700 mt-0.5">
							{{
								__(
									"You don't have permission to create customers. Contact your administrator."
								)
							}}
						</p>
					</div>
				</div>
			</div>
		</div>

		<template #footer>
			<div class="flex items-center justify-end gap-2 w-full">
				<MdxButton variant="secondary" @click="show = false">
					{{ __("Cancel") }}
				</MdxButton>
				<MdxButton
					variant="primary"
					:loading="
						createCustomerResource.loading ||
						updateCustomerResource.loading ||
						checkingPermission
					"
					:disabled="!customerData.customer_name || !hasPermission"
					@click="handleCreate"
				>
					{{ isEditMode ? __("Save Changes") : __("Create Customer") }}
				</MdxButton>
			</div>
		</template>
	</MdxModal>
</template>

<script setup>
/**
 * CreateCustomerDialog - Quick customer creation from POS
 *
 * Features:
 * - Country code selector with flag icons and search
 * - Auto-sets territory based on selected country
 * - Permission checking before allowing creation
 * - Lazy loads countries data when dialog opens (not on app startup)
 */

import { usePOSPermissions } from "@/composables/usePermissions";
import { useToast } from "@/composables/useToast";
import { useCountriesStore } from "@/stores/countries";
import { usePOSSettingsStore } from "@/stores/posSettings";
import { logger } from "@/utils/logger";
import { createResource } from "frappe-ui";
import { MdxButton, MdxModal } from "mdx_ui";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

const log = logger.create("CreateCustomerDialog");

// =============================================================================
// Composables & Stores
// =============================================================================

const countriesStore = useCountriesStore();
const settingsStore = usePOSSettingsStore();
const { canCreateCustomer } = usePOSPermissions();
const { showSuccess, showError } = useToast();

// =============================================================================
// Props & Emits
// =============================================================================

const props = defineProps({
	modelValue: Boolean,
	posProfile: String,
	initialName: String,
	customer: Object, // Customer object for edit mode
});

const emit = defineEmits(["update:modelValue", "customer-created", "customer-updated"]);

// =============================================================================
// State
// =============================================================================

const hasPermission = ref(true);
const checkingPermission = ref(false);
const selectedCountryCode = ref("");
const phoneNumber = ref("");
const showCountryDropdown = ref(false);
const countrySearchQuery = ref("");
const dropdownRef = ref(null);
const countrySearchRef = ref(null);

const customerGroups = ref([]);
const territories = ref([]);
const governorates = ref([]);
const districts = ref([]);

const customerData = ref({
	customer_name: "",
	tax_id: "",
	custom_razon_social: "",
	primary_address: "",
	mobile_no: "",
	email_id: "",
	customer_group: "",
	territory: "",
	custom_governorate: "",
	custom_district: "",
});

// =============================================================================
// Computed
// =============================================================================

const show = computed({
	get: () => props.modelValue,
	set: (val) => emit("update:modelValue", val),
});

const isEditMode = computed(() => !!props.customer?.name);

const currentCountryCode = computed(() => {
	const country = countriesStore.countries.find((c) => c.isd === selectedCountryCode.value);
	return country?.code.toLowerCase() || "bo";
});

const filteredCountries = computed(() => {
	if (!countrySearchQuery.value) return countriesStore.countries;

	const query = countrySearchQuery.value.toLowerCase();
	return countriesStore.countries.filter(
		(c) =>
			c.name.toLowerCase().includes(query) ||
			c.isd.includes(query) ||
			c.code.toLowerCase().includes(query)
	);
});

// =============================================================================
// Country & Territory Methods
// =============================================================================

const handleFlagError = (e) => (e.target.style.display = "none");

const selectCountry = (country) => {
	selectedCountryCode.value = country.isd;
	showCountryDropdown.value = false;
	countrySearchQuery.value = "";
	updateMobileNumber();
};

const updateMobileNumber = () => {
	const code = selectedCountryCode.value || "+591";
	customerData.value.mobile_no = phoneNumber.value
		? `${code}-${phoneNumber.value}`
		: "";
};

const handleClickOutside = (event) => {
	if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
		showCountryDropdown.value = false;
		countrySearchQuery.value = "";
	}
};

const setCountryFromName = (countryName) => {
	if (!countryName) {
		selectedCountryCode.value = "+591";
		return;
	}

	const isd = countriesStore.countryNameToISDMap[countryName];
	if (isd) {
		selectedCountryCode.value = isd;
		log.info(`Set country code to ${isd} for ${countryName}`);
	} else {
		log.warn(`Country "${countryName}" not found`);
		selectedCountryCode.value = "+591";
	}
};

/** Auto-set territory based on selected country (exact or fuzzy match) */
const updateTerritoryFromCountry = () => {
	if (!territories.value.length) return;

	const country = countriesStore.countries.find((c) => c.isd === selectedCountryCode.value);
	if (!country) return;

	// Try exact match first
	if (territories.value.includes(country.name)) {
		customerData.value.territory = country.name;
		log.info(`Territory set to: ${country.name}`);
		return;
	}

	// Try fuzzy match
	const fuzzyMatch = territories.value.find(
		(t) =>
			t.toLowerCase().includes(country.name.toLowerCase()) ||
			country.name.toLowerCase().includes(t.toLowerCase())
	);

	if (fuzzyMatch) {
		customerData.value.territory = fuzzyMatch;
		log.info(`Territory set to fuzzy match: ${fuzzyMatch}`);
	}
};

// =============================================================================
// API Resources
// =============================================================================

const createCustomerResource = createResource({
	url: "pos_next.api.customers.create_customer",
	makeParams: () => ({
		customer_name: customerData.value.customer_name,
		mobile_no: customerData.value.mobile_no || "",
		email_id: customerData.value.email_id || "",
		customer_group: customerData.value.customer_group || "",
		territory: customerData.value.territory || "",
		custom_governorate: customerData.value.custom_governorate || "",
		custom_district: customerData.value.custom_district || "",
		tax_id: customerData.value.tax_id || "",
		custom_razon_social: customerData.value.custom_razon_social || "",
		primary_address: customerData.value.primary_address || "",
		pos_profile: props.posProfile,
	}),
	onSuccess: (data) => {
		showSuccess(__("Customer {0} created successfully", [data.customer_name]));
		emit("customer-created", data);
		show.value = false;
	},
	onError: (error) => {
		log.error("Error creating customer", error);
		showError(error.message || __("Failed to create customer"));
	},
});

const updateCustomerResource = createResource({
	url: "pos_next.api.customers.update_customer",
	makeParams: () => ({
		customer: props.customer?.name,
		customer_name: customerData.value.customer_name,
		mobile_no: customerData.value.mobile_no || "",
		email_id: customerData.value.email_id || "",
		tax_id: customerData.value.tax_id || "",
		custom_razon_social: customerData.value.custom_razon_social || "",
		primary_address: customerData.value.primary_address || "",
		customer_group: customerData.value.customer_group || "",
		territory: customerData.value.territory || "",
	}),
	onSuccess: (data) => {
		showSuccess(__("Customer {0} updated successfully", [data.customer_name]));
		emit("customer-updated", data);
		show.value = false;
	},
	onError: (error) => {
		log.error("Error updating customer", error);
		showError(error.message || __("Failed to update customer"));
	},
});

const sellingSettingsResource = createResource({
	url: "frappe.client.get_value",
	makeParams: () => ({
		doctype: "Selling Settings",
		fieldname: ["customer_group", "territory"],
	}),
	auto: false,
	onError: (err) => log.error("Error loading Selling Settings", err),
});

function pickDefault(settingsValue, list, fallbackFn = null) {
	if (settingsValue && list.includes(settingsValue)) return settingsValue;
	if (fallbackFn) return fallbackFn(list) || list[0] || "";
	return list[0] || "";
}

/** Helper to create list fetch resources */
const createListResource = (doctype, onSuccess) =>
	createResource({
		url: "frappe.client.get_list",
		makeParams: () => ({
			doctype,
			fields: ["name"],
			filters: doctype === "Customer Group" ? { is_group: 0 } : {},
			limit_page_length: 500,
		}),
		auto: false,
		onSuccess: (data) => data?.length && onSuccess(data.map((d) => d.name)),
		onError: (err) => log.error(`Error loading ${doctype}`, err),
	});

const customerGroupsResource = createListResource("Customer Group", (names) => {
	customerGroups.value = names;
	if (!customerData.value.customer_group && names.length > 0) {
		const settingsDefault = sellingSettingsResource.data?.customer_group;
		customerData.value.customer_group = pickDefault(settingsDefault, names);
	}
});

const territoriesResource = createListResource("Territory", (names) => {
	territories.value = names;
	if (!customerData.value.territory && names.length > 0) {
		const settingsDefault = sellingSettingsResource.data?.territory;
		customerData.value.territory = pickDefault(settingsDefault, names, (list) =>
			list.find((n) => n === "All Territories")
		);
	}
});

const governoratesResource = createListResource("Governorate", (names) => {
	governorates.value = names;
});

const customerLocationResource = createResource({
	url: "frappe.client.get_value",
	makeParams: () => ({
		doctype: "Customer",
		filters: { name: props.customer?.name },
		fieldname: ["custom_governorate", "custom_district"],
	}),
	auto: false,
	onSuccess: (data) => {
		customerData.value.custom_governorate = data?.custom_governorate || "";
		customerData.value.custom_district = data?.custom_district || "";
	},
	onError: (err) => log.error("Error loading customer location", err),
});

const districtsResource = createResource({
	url: "frappe.client.get_list",
	makeParams: () => ({
		doctype: "District",
		fields: ["name", "district"],
		filters: { governorate: customerData.value.custom_governorate },
		limit_page_length: 0,
		order_by: "district asc",
	}),
	auto: false,
	onSuccess: (data) => {
		districts.value = data || [];
		// Drop the selected district if it no longer belongs to the governorate
		if (
			customerData.value.custom_district &&
			!districts.value.some((d) => d.name === customerData.value.custom_district)
		) {
			customerData.value.custom_district = "";
		}
	},
	onError: (err) => log.error("Error loading Districts", err),
});

const posProfileResource = createResource({
	url: "frappe.client.get_value",
	makeParams: () => ({
		doctype: "POS Profile",
		filters: { name: props.posProfile },
		fieldname: ["country"],
	}),
	auto: false,
	onSuccess: (data) => setCountryFromName(data?.country || "Bolivia"),
	onError: (err) => {
		log.error("Error loading POS Profile", err);
		selectedCountryCode.value = "+591";
	},
});

// =============================================================================
// Dialog Lifecycle
// =============================================================================

const loadDialogData = async () => {
	// Lazy load countries (non-blocking)
	countriesStore.loadCountries();

	await sellingSettingsResource.reload();

	if (!isEditMode.value) {
		customerData.value.customer_group = "";
		customerData.value.territory = "";
	}

	// Load form options
	await Promise.all([
		territoriesResource.reload(),
		customerGroupsResource.reload(),
	]);
	checkPermissions();

	// Set country from POS Profile
	if (props.posProfile) {
		await posProfileResource.reload();
	} else {
		selectedCountryCode.value = "+591";
	}
};

const checkPermissions = async () => {
	checkingPermission.value = true;
	try {
		hasPermission.value = await canCreateCustomer();
	} catch (err) {
		log.error("Permission check failed", err);
		hasPermission.value = false;
	} finally {
		checkingPermission.value = false;
	}
};

const handleCreate = async () => {
	if (!customerData.value.customer_name) {
		return showError(__("Customer Name is required"));
	}
	if (isEditMode.value) {
		await updateCustomerResource.submit();
	} else {
		await createCustomerResource.submit();
	}
};

const resetForm = () => {
	const settings = sellingSettingsResource.data || {};
	Object.assign(customerData.value, {
		customer_name: "",
		tax_id: "",
		custom_razon_social: "",
		primary_address: "",
		mobile_no: "",
		email_id: "",
		customer_group: pickDefault(settings.customer_group, customerGroups.value),
		territory: pickDefault(settings.territory, territories.value, (list) =>
			list.find((n) => n === "All Territories")
		),
		custom_governorate: "",
		custom_district: "",
	});
	districts.value = [];
	selectedCountryCode.value = "+591";
	phoneNumber.value = "";
};

// =============================================================================
// Watchers
// =============================================================================

watch(
	() => props.initialName,
	(name) => name && (customerData.value.customer_name = name)
);

// Pre-fill form when customer prop changes (edit mode)
watch(
	() => props.customer,
	(customer) => {
		if (customer?.name) {
			customerData.value.customer_name = customer.customer_name || "";
			customerData.value.tax_id = customer.tax_id || "";
			customerData.value.custom_razon_social = customer.custom_razon_social || "";
			customerData.value.primary_address = customer.primary_address || "";
			customerData.value.email_id = customer.email_id || "";
			customerData.value.customer_group =
				customer.customer_group || customerGroups.value[0] || "";
			customerData.value.territory =
				customer.territory ||
				territories.value.find((n) => n === "All Territories") ||
				territories.value[0] ||
				"";

			customerData.value.custom_governorate = customer.custom_governorate || "";
			customerData.value.custom_district = customer.custom_district || "";
			// Handle mobile_no with country code
			if (customer.mobile_no) {
				customerData.value.mobile_no = customer.mobile_no;
				if (customer.mobile_no.includes("-")) {
					const [code, ...rest] = customer.mobile_no.split("-");
					selectedCountryCode.value = code;
					phoneNumber.value = rest.join("-");
				} else {
					selectedCountryCode.value = "+591";
					phoneNumber.value = customer.mobile_no;
				}
			} else {
				customerData.value.mobile_no = "";
				selectedCountryCode.value = "+591";
				phoneNumber.value = "";
			}
		}
	},
	{ immediate: true }
);

watch(
	() => customerData.value.mobile_no,
	(value) => {
		if (value?.includes("-")) {
			const [code, ...rest] = value.split("-");
			selectedCountryCode.value = code;
			phoneNumber.value = rest.join("-");
		}
	}
);

watch(selectedCountryCode, async (newVal, oldVal) => {
	if (!oldVal) return;
	await nextTick();
	updateTerritoryFromCountry();
});

watch(
	() => customerData.value.custom_governorate,
	(governorate) => {
		if (governorate) {
			districtsResource.reload();
		} else {
			districts.value = [];
			customerData.value.custom_district = "";
		}
	}
);

watch(showCountryDropdown, async (isOpen) => {
	if (isOpen) {
		await nextTick();
		countrySearchRef.value?.focus();
	}
});

watch(
	() => props.modelValue,
	async (isOpen) => {
		isOpen ? await loadDialogData() : resetForm();
	}
);

// =============================================================================
// Lifecycle Hooks
// =============================================================================

onMounted(() => {
	document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
	document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped>
.sr-only {
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
	border-width: 0;
}
</style>
