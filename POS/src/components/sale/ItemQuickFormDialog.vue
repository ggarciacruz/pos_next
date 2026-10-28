<template>
	<Teleport to="body">
		<Transition name="fade">
			<div
				v-if="modelValue"
				class="fixed inset-0 z-[1050] flex items-center justify-center p-3 sm:p-5 bg-black bg-opacity-50"
				@click.self="closeDialog"
			>
				<div
					class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-200"
				>
					<!-- Header -->
					<div
						class="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50"
					>
						<div class="flex items-center gap-3 min-w-0">
							<div
								class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
								:class="isEditMode ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'"
							>
								<svg
									v-if="isEditMode"
									class="w-5 h-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									stroke-width="2"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
									/>
								</svg>
								<svg
									v-else
									class="w-5 h-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									stroke-width="2.5"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M12 4.5v15m7.5-7.5h-15"
									/>
								</svg>
							</div>
							<div class="min-w-0 text-start">
								<h2 class="text-base sm:text-lg font-bold text-gray-900 truncate">
									{{
										isEditMode
											? __("Editar Producto")
											: __("Crear Nuevo Producto")
									}}
								</h2>
								<p class="text-xs text-gray-600 truncate">
									{{
										isEditMode
											? `${form.item_name || itemCode} (${form.item_code})`
											: __("Complete los datos básicos y el sistema configurará precios y almacén automáticamente")
									}}
								</p>
							</div>
						</div>

						<button
							type="button"
							@click="closeDialog"
							class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>

					<!-- Body -->
					<div class="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-3.5 sm:space-y-5 text-start">
						<!-- Loading state -->
						<div v-if="loading" class="py-12 flex flex-col items-center justify-center">
							<div
								class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"
							></div>
							<p class="mt-3 text-xs text-gray-500">
								{{ __("Cargando datos del producto...") }}
							</p>
						</div>

						<template v-else>
							<!-- Section 1: Photo + Name + Category (Compact side-by-side even on mobile) -->
							<div class="space-y-3">
								<div class="flex flex-row gap-3 sm:gap-4 items-start">
									<!-- Photo Upload Box (Compact 80x80 on mobile, 112x112 on desktop) -->
									<div class="flex flex-col items-center shrink-0">
										<div
											@click="triggerFileInput"
											class="relative w-20 h-20 sm:w-28 sm:h-28 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 bg-gray-50 flex flex-col items-center justify-center overflow-hidden cursor-pointer group transition-colors"
										>
											<img
												v-if="imagePreview || form.image"
												:src="imagePreview || form.image"
												alt="Vista previa"
												class="w-full h-full object-cover"
											/>
											<div
												v-else
												class="flex flex-col items-center justify-center text-gray-400 group-hover:text-blue-600 p-1.5 text-center"
											>
												<svg
													class="w-6 h-6 sm:w-8 sm:h-8 mb-0.5 sm:mb-1"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="1.8"
														d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
													/>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="1.8"
														d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
													/>
												</svg>
												<span class="text-[10px] sm:text-[11px] font-semibold leading-tight">
													{{ __("Subir Foto") }}
												</span>
											</div>

											<div
												v-if="imagePreview || form.image"
												class="absolute inset-x-0 bottom-0 bg-black bg-opacity-60 text-white text-[9px] sm:text-[10px] font-semibold py-0.5 sm:py-1 text-center"
											>
												{{ __("Cambiar Foto") }}
											</div>
										</div>
										<input
											ref="fileInputRef"
											type="file"
											accept="image/*"
											class="hidden"
											@change="handleFileChange"
										/>
									</div>

									<!-- Name & Category (Name always beside photo; Category beside photo on desktop, full width below on mobile) -->
									<div class="flex-1 min-w-0 space-y-2.5 sm:space-y-3">
										<div>
											<label class="block text-xs font-bold text-gray-700 mb-1">
												{{ __("Nombre del Producto") }}
												<span class="text-red-500">*</span>
											</label>
											<input
												ref="nameInputRef"
												v-model="form.item_name"
												type="text"
												:placeholder="__('Ej: Colchón Cannon 2 Plazas / Somier 2p Turquesa')"
												class="w-full px-3 py-2 text-xs sm:text-sm font-medium text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
											/>
										</div>

										<!-- Category on desktop inside right column -->
										<div class="hidden sm:block">
											<div class="flex items-center justify-between mb-1">
												<label class="block text-xs font-bold text-gray-700">
													{{ __("Categoría / Grupo") }}
													<span class="text-red-500">*</span>
												</label>
											</div>

											<select
												v-model="form.item_group"
												:class="[
													'w-full px-3 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
													form.item_group ? 'text-gray-900' : 'text-gray-400',
												]"
											>
												<option value="" disabled>
													{{ __("Seleccione una categoría...") }}
												</option>
												<option
													v-for="grp in itemGroups"
													:key="grp"
													:value="grp"
													class="text-gray-900"
												>
													{{ grp }}
												</option>
											</select>

											<div
												v-if="resolvedWarehouseLabel"
												class="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium"
											>
												<svg
													class="w-3.5 h-3.5 text-blue-600 flex-shrink-0"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
													/>
												</svg>
												<span>
													{{ __("Almacén asignado:") }}
													<strong class="text-gray-900">{{
														resolvedWarehouseLabel
													}}</strong>
												</span>
											</div>
										</div>
									</div>
								</div>

								<!-- Category on mobile (full width right below Photo+Name) -->
								<div class="sm:hidden">
									<div class="flex items-center justify-between mb-1">
										<label class="block text-xs font-bold text-gray-700">
											{{ __("Categoría / Grupo") }}
											<span class="text-red-500">*</span>
										</label>
									</div>

									<select
										v-model="form.item_group"
										:class="[
											'w-full px-3 py-2 text-xs font-medium bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
											form.item_group ? 'text-gray-900' : 'text-gray-400',
										]"
									>
										<option value="" disabled>
											{{ __("Seleccione una categoría...") }}
										</option>
										<option
											v-for="grp in itemGroups"
											:key="grp"
											:value="grp"
											class="text-gray-900"
										>
											{{ grp }}
										</option>
									</select>

									<div
										v-if="resolvedWarehouseLabel"
										class="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-[11px] font-medium"
									>
										<svg
											class="w-3.5 h-3.5 text-blue-600 flex-shrink-0"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
											/>
										</svg>
										<span>
											{{ __("Almacén asignado:") }}
											<strong class="text-gray-900">{{
												resolvedWarehouseLabel
											}}</strong>
										</span>
									</div>
								</div>
							</div>

							<!-- Section 2: Selling Price & Cost (2 columns on both mobile and desktop) -->
							<div class="p-3 sm:p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-2.5 sm:space-y-3">
								<div class="flex flex-wrap items-center justify-between gap-1.5">
									<h3 class="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-blue-900">
										{{ __("Precio de Venta y Costo") }}
									</h3>
									<span
										v-if="Number(form.selling_rate) > 0 && Number(form.cost_rate) > 0"
										class="text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded-full"
										:class="
											estimatedProfit >= 0
												? 'bg-green-100 text-green-800 border border-green-300'
												: 'bg-red-100 text-red-800 border border-red-300'
										"
									>
										{{ __("Ganancia:") }} Bs. {{ estimatedProfit.toFixed(2) }} / u.
									</span>
								</div>

								<div class="grid grid-cols-2 gap-2.5 sm:gap-3">
									<div>
										<label class="block text-[11px] sm:text-xs font-bold text-gray-800 mb-1 truncate">
											{{ __("Precio de Venta (Bs.)") }}
											<span class="text-red-500">*</span>
										</label>
										<div class="relative">
											<span
												class="absolute inset-y-0 start-0 ps-2.5 sm:ps-3 flex items-center text-xs font-bold text-blue-700 pointer-events-none"
											>
												Bs.
											</span>
											<input
												v-model.number="form.selling_rate"
												type="number"
												min="0"
												step="1"
												placeholder="0.00"
												class="w-full ps-8 sm:ps-9 pe-2.5 sm:pe-3 py-1.5 sm:py-2 text-sm sm:text-base font-bold text-gray-900 bg-white border-2 border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
											/>
										</div>
									</div>

									<div>
										<label class="block text-[11px] sm:text-xs font-bold text-gray-700 mb-1 truncate">
											{{ __("Costo Fábrica") }}
											<span class="text-gray-400 font-normal"
												>({{ __("Opc.") }})</span
											>
										</label>
										<div class="relative">
											<span
												class="absolute inset-y-0 start-0 ps-2.5 sm:ps-3 flex items-center text-xs font-semibold text-gray-500 pointer-events-none"
											>
												Bs.
											</span>
											<input
												v-model.number="form.cost_rate"
												type="number"
												min="0"
												step="1"
												placeholder="0.00"
												class="w-full ps-8 sm:ps-9 pe-2.5 sm:pe-3 py-1.5 sm:py-2 text-sm sm:text-base font-semibold text-gray-800 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
											/>
										</div>
									</div>
								</div>
							</div>

							<!-- Section 3: Plazas & Dimensions (2x2 grid on mobile, 4-col on desktop) -->
							<div
								v-if="hasDimensions || hasPlazas"
								class="p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2.5 sm:space-y-3"
							>
								<h3 class="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-700">
									{{ __("Medidas y Plazas (Opcional)") }}
								</h3>

								<div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
									<div v-if="hasPlazas">
										<label class="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1">
											{{ __("Plazas") }}
										</label>
										<select
											v-model="form.custom_plazas"
											@change="handlePlazaPresetChange"
											class="w-full px-2.5 py-1.5 sm:py-2 text-xs font-medium text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
										>
											<option value="">{{ __("Sin especificar") }}</option>
											<option
												v-for="p in plazasOptions"
												:key="p"
												:value="p"
											>
												{{ p }}
											</option>
										</select>
									</div>

									<template v-if="hasDimensions">
										<div>
											<label class="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1">
												{{ __("Ancho (cm)") }}
											</label>
											<input
												v-model.number="form.custom_ancho_cm"
												type="number"
												min="0"
												step="1"
												placeholder="Ej: 140"
												class="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
											/>
										</div>
										<div>
											<label class="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1">
												{{ __("Largo (cm)") }}
											</label>
											<input
												v-model.number="form.custom_largo_cm"
												type="number"
												min="0"
												step="1"
												placeholder="Ej: 190"
												class="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
											/>
										</div>
										<div>
											<label class="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1">
												{{ __("Alto / Grosor (cm)") }}
											</label>
											<input
												v-model.number="form.custom_alto_cm"
												type="number"
												min="0"
												step="1"
												placeholder="Ej: 20"
												class="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
											/>
										</div>
									</template>
								</div>
							</div>

							<!-- Section 4: Initial Stock (New Item) OR Active Status (Edit Item) + SKU Code -->
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
								<!-- Initial Stock when creating -->
								<div
									v-if="!isEditMode"
									class="p-3 sm:p-3.5 bg-green-50 rounded-xl border border-green-200 space-y-2"
								>
									<label class="block text-xs font-bold text-green-900">
										{{ __("¿Con cuánto stock inicia hoy?") }}
									</label>
									<div class="flex items-center gap-2">
										<input
											v-model.number="form.opening_stock"
											type="number"
											min="0"
											step="1"
											placeholder="0"
											class="w-20 sm:w-24 px-2.5 py-1.5 text-sm sm:text-base font-bold text-center text-gray-900 bg-white border-2 border-green-500 rounded-lg focus:outline-none"
										/>
										<div class="flex items-center gap-1 flex-wrap">
											<button
												v-for="preset in [0, 10, 20, 30]"
												:key="preset"
												type="button"
												@click="form.opening_stock = preset"
												class="px-2 py-1 text-xs font-bold rounded border transition-colors"
												:class="
													Number(form.opening_stock) === preset
														? 'bg-green-600 text-white border-green-600'
														: 'bg-white text-green-700 border-green-300 hover:bg-green-100'
												"
											>
												{{ preset }}
											</button>
										</div>
									</div>
								</div>

								<!-- Active / Disabled toggle when editing -->
								<div
									v-else
									class="p-3 sm:p-3.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between gap-2"
								>
									<div>
										<p class="text-xs font-bold text-gray-800">
											{{ __("Estado en el Catálogo POS") }}
										</p>
										<p class="text-[11px] text-gray-500">
											{{
												form.disabled
													? __("Oculto (No aparece para vender)")
													: __("Activo (Visible para vender)")
											}}
										</p>
									</div>
									<button
										type="button"
										@click="form.disabled = form.disabled ? 0 : 1"
										class="px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors shrink-0"
										:class="
											form.disabled
												? 'bg-red-100 text-red-700 border-red-300'
												: 'bg-green-100 text-green-800 border-green-300'
										"
									>
										{{ form.disabled ? __("Desactivado") : __("Activo") }}
									</button>
								</div>

								<!-- SKU Code -->
								<div class="p-3 sm:p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5">
									<label class="block text-xs font-bold text-gray-700">
										{{ __("Código SKU") }}
										<span
											v-if="!isEditMode"
											class="text-gray-400 font-normal"
											>({{ __("Automático si lo deja vacío") }})</span
										>
									</label>
									<input
										v-model="form.item_code"
										type="text"
										:disabled="isEditMode"
										:placeholder="__('Se generará automáticamente')"
										class="w-full px-3 py-1.5 text-xs font-mono font-semibold text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
									/>
								</div>

								<!-- Low Stock Alert Threshold (Optional per-product override) -->
								<div class="sm:col-span-2 p-3 sm:p-3.5 bg-amber-50/70 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
									<div>
										<label class="block text-xs font-bold text-amber-900">
											{{ __("Alerta de Stock Bajo (Color Amarillo)") }}
											<span class="text-amber-700/80 font-normal">({{ __("Opcional por producto") }})</span>
										</label>
										<p class="text-[11px] text-amber-800/80">
											{{ __("Si lo deja vacío, usará el valor general del sistema") }} ({{ defaultLowStockThreshold }} {{ __("u.") }})
										</p>
									</div>
									<div class="flex items-center gap-2 shrink-0">
										<input
											v-model.number="form.safety_stock"
											type="number"
											min="0"
											step="1"
											:placeholder="`${defaultLowStockThreshold} (Por defecto)`"
											class="w-32 sm:w-36 px-3 py-1.5 text-xs sm:text-sm font-bold text-center text-gray-900 bg-white border border-amber-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
										/>
										<span class="text-xs font-semibold text-amber-900">{{ __("unidades") }}</span>
									</div>
								</div>
							</div>
						</template>
					</div>

					<!-- Footer (50/50 full width buttons on mobile) -->
					<div
						class="px-3.5 sm:px-6 py-3 sm:py-3.5 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-2.5 shrink-0"
					>
						<button
							type="button"
							@click="closeDialog"
							:disabled="saving"
							class="flex-1 sm:flex-initial justify-center px-4 py-2 text-xs sm:text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg transition-colors"
						>
							{{ __("Cancelar") }}
						</button>
						<button
							type="button"
							@click="handleSave"
							:disabled="saving || loading"
							class="flex-1 sm:flex-initial justify-center px-5 py-2 text-xs sm:text-sm font-bold text-white rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
							:class="
								isEditMode
									? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
									: 'bg-green-600 hover:bg-green-700 active:bg-green-800'
							"
						>
							<span
								v-if="saving"
								class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
							></span>
							<svg
								v-else
								class="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								stroke-width="2.5"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M5 13l4 4L19 7"
								/>
							</svg>
							<span>
								{{
									saving
										? __("Guardando...")
										: isEditMode
										? __("Guardar Cambios")
										: __("Crear Producto")
								}}
							</span>
						</button>
					</div>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<script setup>
import { call } from "@/utils/apiWrapper";
import { useToast } from "@/composables/useToast";
import { computed, nextTick, ref, watch } from "vue";

const props = defineProps({
	modelValue: {
		type: Boolean,
		default: false,
	},
	posProfile: {
		type: String,
		default: "",
	},
	itemCode: {
		type: String,
		default: "",
	},
	defaultItemGroup: {
		type: String,
		default: "",
	},
});

const emit = defineEmits(["update:modelValue", "saved"]);

const { showSuccess, showError } = useToast();

const loading = ref(false);
const saving = ref(false);
const savingNewGroup = ref(false);
const isCreatingNewGroup = ref(false);
const itemGroups = ref([]);
const groupWarehouses = ref({});
const hasDimensions = ref(true);
const hasPlazas = ref(true);
const defaultLowStockThreshold = ref(10);
const plazasOptions = ref([
	"1 Plaza",
	"1.5 Plazas",
	"2 Plazas",
	"2.5 Plazas / Queen",
	"3 Plazas / King",
]);

const fileInputRef = ref(null);
const nameInputRef = ref(null);
const imagePreview = ref("");
const imageBase64 = ref("");

const form = ref({
	item_code: "",
	item_name: "",
	item_group: "",
	new_item_group: "",
	stock_uom: "Unidad(es)",
	selling_rate: null,
	cost_rate: null,
	custom_plazas: "",
	custom_ancho_cm: null,
	custom_largo_cm: null,
	custom_alto_cm: null,
	opening_stock: 0,
	safety_stock: null,
	disabled: 0,
	image: "",
});

const isEditMode = computed(() => Boolean(props.itemCode));

const estimatedProfit = computed(() => {
	const sell = Number(form.value.selling_rate) || 0;
	const cost = Number(form.value.cost_rate) || 0;
	return sell - cost;
});

const resolvedWarehouseLabel = computed(() => {
	const grp = isCreatingNewGroup.value
		? form.value.new_item_group
		: form.value.item_group;
	if (!grp) return "";
	if (groupWarehouses.value[grp]?.warehouse_name) {
		return groupWarehouses.value[grp].warehouse_name;
	}
	if (grp.toLowerCase().includes("somier")) {
		return "Fábrica de Somieres";
	}
	return "Fábrica de Colchones";
});

function resetForm() {
	isCreatingNewGroup.value = false;
	savingNewGroup.value = false;
	imagePreview.value = "";
	imageBase64.value = "";
	form.value = {
		item_code: "",
		item_name: "",
		item_group: "",
		new_item_group: "",
		stock_uom: "Unidad(es)",
		selling_rate: null,
		cost_rate: null,
		custom_plazas: "",
		custom_ancho_cm: null,
		custom_largo_cm: null,
		custom_alto_cm: null,
		opening_stock: 0,
		safety_stock: null,
		disabled: 0,
		image: "",
	};
}

function startCreateNewGroup() {
	form.value.new_item_group = "";
	isCreatingNewGroup.value = true;
}

function cancelCreateNewGroup() {
	form.value.new_item_group = "";
	isCreatingNewGroup.value = false;
}

async function handleSaveNewGroup() {
	const cleanGrp = (form.value.new_item_group || "").trim();
	if (!cleanGrp) {
		showError("Por favor escriba el nombre de la nueva categoría.");
		return;
	}
	savingNewGroup.value = true;
	try {
		const res = await call("pos_next.api.items.create_pos_item_group", {
			pos_profile: props.posProfile,
			item_group_name: cleanGrp,
		});
		const data = res?.message || res || {};
		const savedGroup = data.item_group || cleanGrp;

		if (!itemGroups.value.includes(savedGroup)) {
			itemGroups.value = [...itemGroups.value, savedGroup].sort((a, b) =>
				a.localeCompare(b)
			);
		}
		if (data.warehouse) {
			groupWarehouses.value[savedGroup] = {
				warehouse: data.warehouse,
				warehouse_name: data.warehouse_name || data.warehouse,
			};
		}

		form.value.item_group = savedGroup;
		form.value.new_item_group = "";
		isCreatingNewGroup.value = false;
		showSuccess(data.message || `Categoría '${savedGroup}' guardada y seleccionada.`);
	} catch (err) {
		console.error("Error creating new item group:", err);
		showError(err?.message || "No se pudo guardar la categoría.");
	} finally {
		savingNewGroup.value = false;
	}
}

function triggerFileInput() {
	fileInputRef.value?.click();
}

function handleFileChange(e) {
	const file = e.target.files?.[0];
	if (!file) return;
	const reader = new FileReader();
	reader.onload = (ev) => {
		const dataUrl = ev.target?.result;
		if (typeof dataUrl === "string") {
			imagePreview.value = dataUrl;
			imageBase64.value = dataUrl;
		}
	};
	reader.readAsDataURL(file);
}

function handlePlazaPresetChange() {
	const p = form.value.custom_plazas;
	if (!p) return;
	// Pre-fill standard mattress width/length if empty
	if (!form.value.custom_largo_cm) {
		form.value.custom_largo_cm = 190;
	}
	if (!form.value.custom_alto_cm) {
		form.value.custom_alto_cm = 20;
	}
	if (!form.value.custom_ancho_cm) {
		if (p.startsWith("1 Plaza")) form.value.custom_ancho_cm = 90;
		else if (p.startsWith("1.5")) form.value.custom_ancho_cm = 105;
		else if (p.startsWith("2 Plazas")) form.value.custom_ancho_cm = 140;
		else if (p.startsWith("2.5")) form.value.custom_ancho_cm = 160;
		else if (p.startsWith("3")) form.value.custom_ancho_cm = 180;
	}
}

async function loadFormData() {
	if (!props.posProfile) return;
	loading.value = true;
	resetForm();

	try {
		const res = await call("pos_next.api.items.get_pos_item_form_data", {
			pos_profile: props.posProfile,
			item_code: props.itemCode || null,
		});
		const data = res?.message || res || {};
		itemGroups.value = data.item_groups || [];
		groupWarehouses.value = data.group_warehouses || {};
		hasDimensions.value = Boolean(data.has_dimensions);
		hasPlazas.value = Boolean(data.has_plazas);
		defaultLowStockThreshold.value = Number(data.default_low_stock_threshold) || 10;
		if (Array.isArray(data.plazas_options) && data.plazas_options.length > 0) {
			plazasOptions.value = data.plazas_options;
		}

		if (data.item) {
			form.value = {
				item_code: data.item.item_code || "",
				item_name: data.item.item_name || "",
				item_group: data.item.item_group || "",
				new_item_group: "",
				stock_uom: data.item.stock_uom || data.default_uom || "Unidad(es)",
				selling_rate: data.item.selling_rate ?? 0,
				cost_rate: data.item.cost_rate || null,
				custom_plazas: data.item.custom_plazas || "",
				custom_ancho_cm: data.item.custom_ancho_cm || null,
				custom_largo_cm: data.item.custom_largo_cm || null,
				custom_alto_cm: data.item.custom_alto_cm || null,
				opening_stock: 0,
				safety_stock: data.item.safety_stock > 0 ? Number(data.item.safety_stock) : null,
				disabled: data.item.disabled ? 1 : 0,
				image: data.item.image || "",
			};
		} else {
			form.value.stock_uom = data.default_uom || "Unidad(es)";
			form.value.item_group = "";
		}
	} catch (err) {
		console.error("Error loading item form data:", err);
		showError(err?.message || "No se pudo cargar el formulario de producto.");
	} finally {
		loading.value = false;
		await nextTick();
		nameInputRef.value?.focus();
	}
}

async function handleSave() {
	const cleanName = (form.value.item_name || "").trim();
	if (!cleanName) {
		showError("Por favor ingrese el nombre del producto.");
		nameInputRef.value?.focus();
		return;
	}

	const selectedGroup = isCreatingNewGroup.value
		? (form.value.new_item_group || "").trim()
		: (form.value.item_group || "").trim();

	if (!selectedGroup) {
		showError("Por favor seleccione una categoría para el producto.");
		return;
	}

	const sellRate = Number(form.value.selling_rate);
	if (isNaN(sellRate) || sellRate <= 0) {
		showError("Por favor ingrese un Precio de Venta mayor a cero.");
		return;
	}

	saving.value = true;
	try {
		const payload = {
			is_new: !isEditMode.value,
			item_code: form.value.item_code,
			item_name: cleanName,
			item_group: form.value.item_group,
			new_item_group: isCreatingNewGroup.value ? selectedGroup : "",
			stock_uom: form.value.stock_uom,
			selling_rate: sellRate,
			cost_rate: Number(form.value.cost_rate) || 0,
			custom_plazas: form.value.custom_plazas || "",
			custom_ancho_cm: Number(form.value.custom_ancho_cm) || 0,
			custom_largo_cm: Number(form.value.custom_largo_cm) || 0,
			custom_alto_cm: Number(form.value.custom_alto_cm) || 0,
			opening_stock: !isEditMode.value ? Math.max(0, Number(form.value.opening_stock) || 0) : 0,
			safety_stock: Math.max(0, Number(form.value.safety_stock) || 0),
			disabled: form.value.disabled ? 1 : 0,
			image_base64: imageBase64.value || null,
		};

		const res = await call("pos_next.api.items.save_pos_item", {
			pos_profile: props.posProfile,
			item_data: JSON.stringify(payload),
		});
		const result = res?.message || res || {};

		showSuccess(result.message || "Producto guardado correctamente.");
		emit("saved", {
			item: result.item,
			isNew: !isEditMode.value,
		});
		closeDialog();
	} catch (err) {
		console.error("Error saving POS item:", err);
		showError(err?.message || "No se pudo guardar el producto.");
	} finally {
		saving.value = false;
	}
}

function closeDialog() {
	emit("update:modelValue", false);
}

watch(
	() => props.modelValue,
	(open) => {
		if (open) {
			loadFormData();
		}
	}
);
</script>
