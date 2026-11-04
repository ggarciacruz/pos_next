<template>
	<MdxModal v-model="show" :title="__('Select Customer')" size="md">
		<div class="flex flex-col gap-3.5">
			<!-- Search Input -->
			<div class="relative">
				<!-- Search Icon -->
				<div
					class="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none"
				>
					<svg
						class="h-4 w-4 text-slate-400"
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
				<!-- Search Input -->
				<input
					id="customer-search"
					name="customer-search"
					:value="searchTerm"
					@input="handleSearchInput"
					type="text"
					:placeholder="__('Search customers by name, mobile, or email...')"
					class="w-full h-10 border border-slate-200 rounded-xl ps-9 pe-8 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
					@keydown="handleKeydown"
					autofocus
					autocomplete="off"
					:aria-label="__('Search customers')"
				/>
				<!-- Clear Button -->
				<button
					v-if="searchTerm"
					type="button"
					@click="customerStore.clearSearch()"
					class="absolute inset-y-0 end-0 pe-3 flex items-center text-slate-400 hover:text-slate-600"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<p
				v-if="!loading && allCustomers.length > 0"
				class="text-start text-xs text-slate-500 flex items-center gap-1.5"
			>
				<span v-if="showingRecent" class="text-slate-700 font-semibold inline-flex items-center gap-1">
					<svg class="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
						<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
					</svg>
					{{ __("Recent & Frequent") }}
				</span>
				<span v-else>{{
					__("{0} of {1} customers", [customers.length, allCustomers.length])
				}}</span>
				<span v-if="customers.length > 0" class="text-slate-400 ms-1">{{
					__("• Use ↑↓ to navigate, Enter to select")
				}}</span>
			</p>

			<!-- Smart Recommendations -->
			<div v-if="recommendations.length > 0" class="flex flex-wrap gap-2 -mt-1">
				<div
					v-for="rec in recommendations"
					:key="rec.type"
					class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium"
				>
					<span>{{ rec.text }}</span>
				</div>
			</div>

			<!-- Customers List - Optimized rendering -->
			<div class="max-h-80 overflow-y-auto" style="will-change: scroll-position">
				<div v-if="loading" class="py-8 flex justify-center">
					<MdxLoadingSpinner size="md" :text="__('Loading customers...')" />
				</div>

				<div
					v-else-if="allCustomers.length === 0 && !loading"
					class="text-center py-8"
				>
					<svg
						class="mx-auto h-10 w-10 text-slate-300"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
						/>
					</svg>
					<p class="mt-2 text-sm font-semibold text-slate-600">
						{{ __("No customers available") }}
					</p>
					<p class="text-xs text-slate-400 mt-1">
						{{ __("Create your first customer to get started") }}
					</p>
				</div>

				<div
					v-else-if="customers.length === 0 && searchTerm.trim().length > 0"
					class="text-center py-8"
				>
					<svg
						class="mx-auto h-10 w-10 text-slate-300"
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
					<p class="mt-2 text-sm font-semibold text-slate-700">
						{{ __('No results for "{0}"', [searchTerm]) }}
					</p>
					<p class="text-xs text-slate-400 mt-1">
						{{ __("Try a different search term or create a new customer") }}
					</p>
				</div>

				<!-- Optimized list rendering with v-memo for performance -->
				<div v-else class="flex flex-col gap-1.5">
					<button
						v-for="(customer, index) in customers"
						:key="customer.name"
						type="button"
						v-memo="[customer.name, index === selectedIndex]"
						@click="selectCustomer(customer)"
						:class="[
							'w-full text-start p-3 rounded-xl border transition-all duration-75',
							index === selectedIndex
								? 'border-blue-600 bg-blue-50/50 shadow-sm'
								: 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
						]"
					>
						<div class="flex items-start justify-between">
							<div class="flex-1 min-w-0">
								<div class="font-bold text-sm text-slate-900 truncate">
									{{ customer.customer_name }}
								</div>
								<div class="flex flex-wrap items-center text-xs text-slate-600 mt-1 gap-3">
									<span
										v-if="customer.mobile_no"
										class="inline-flex items-center gap-1 tabular-nums"
									>
										<svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
										</svg>
										{{ customer.mobile_no }}
									</span>
									<span
										v-if="customer.email_id"
										class="inline-flex items-center gap-1"
									>
										<svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
										</svg>
										{{ customer.email_id }}
									</span>
								</div>
								<div
									v-if="customer.customer_group"
									class="text-[11px] font-medium text-slate-400 mt-1"
								>
									{{ customer.customer_group }}
								</div>
							</div>
							<div v-if="index === selectedIndex" class="ms-2 flex-shrink-0">
								<svg
									class="h-5 w-5 text-blue-600"
									fill="currentColor"
									viewBox="0 0 20 20"
								>
									<path
										fill-rule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
										clip-rule="evenodd"
									/>
								</svg>
							</div>
						</div>
					</button>
				</div>
			</div>
		</div>

		<template #footer>
			<div class="flex items-center justify-between gap-2 w-full">
				<MdxButton variant="secondary" @click="createNewCustomer">
					{{ __("+ Create New Customer") }}
				</MdxButton>
				<MdxButton variant="ghost" @click="show = false">
					{{ __("Cancel") }}
				</MdxButton>
			</div>
		</template>
	</MdxModal>

	<!-- Create Customer Dialog -->
	<CreateCustomerDialog
		v-model="showCreateDialog"
		:pos-profile="posProfile"
		@customer-created="handleCustomerCreated"
	/>
</template>

<script setup>
import { useCustomerSearchStore } from "@/stores/customerSearch";
import { MdxButton, MdxLoadingSpinner, MdxModal } from "mdx_ui";
import { storeToRefs } from "pinia";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import CreateCustomerDialog from "./CreateCustomerDialog.vue";

const props = defineProps({
	modelValue: Boolean,
	posProfile: String,
});

const emit = defineEmits(["update:modelValue", "customer-selected"]);

// Use Pinia store
const customerStore = useCustomerSearchStore();
const { filteredCustomers, loading, selectedIndex, searchTerm, allCustomers, recommendations } =
	storeToRefs(customerStore);

// Local state
const showCreateDialog = ref(false);

const show = computed({
	get: () => props.modelValue,
	set: (val) => emit("update:modelValue", val),
});

// Alias for template compatibility
const customers = computed(() => filteredCustomers.value);

// Show recent customers label
const showingRecent = computed(() => !searchTerm.value && customers.value.length > 0);

// Load customers when dialog opens
watch(show, (newVal) => {
	if (newVal) {
		customerStore.clearSearch();
		// loadAllCustomers will skip if already loaded (unless forceReload=true)
		customerStore.loadAllCustomers(props.posProfile);
	}
});

// Handle search input with instant reactivity
function handleSearchInput(event) {
	const value = event.target.value;
	customerStore.setSearchTerm(value);
}

// Keyboard navigation
function handleKeydown(event) {
	if (customers.value.length === 0) return;

	if (event.key === "ArrowDown") {
		event.preventDefault();
		customerStore.setSelectedIndex(
			Math.min(selectedIndex.value + 1, customers.value.length - 1)
		);
	} else if (event.key === "ArrowUp") {
		event.preventDefault();
		customerStore.setSelectedIndex(Math.max(selectedIndex.value - 1, -1));
	} else if (event.key === "Enter") {
		event.preventDefault();
		if (selectedIndex.value >= 0 && selectedIndex.value < customers.value.length) {
			selectCustomer(customers.value[selectedIndex.value]);
		} else if (customers.value.length === 1) {
			selectCustomer(customers.value[0]);
		}
	} else if (event.key === "Escape") {
		show.value = false;
	}
}

onMounted(() => {
	if (props.posProfile) {
		customerStore.loadAllCustomers(props.posProfile);
		customerStore.loadCustomerHistory();
	}
});

function selectCustomer(customer) {
	// Track selection for recommendations
	customerStore.trackCustomerSelection(customer.name);

	emit("customer-selected", customer);
	show.value = false;
}

async function createNewCustomer() {
	show.value = false;
	await nextTick();
	showCreateDialog.value = true;
}

async function handleCustomerCreated(customer) {
	if (props.posProfile) {
		await customerStore.addCustomerToCache(customer);
	}

	// Track new customer selection
	customerStore.trackCustomerSelection(customer.name);

	emit("customer-selected", customer);
	show.value = false;
}
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
