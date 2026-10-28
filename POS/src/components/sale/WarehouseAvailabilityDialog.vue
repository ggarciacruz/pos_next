<template>
	<Teleport to="body">
		<Transition name="fade">
			<div
				v-if="show"
				class="fixed inset-0 z-[300] bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-5 md:p-7"
				@click.self="closeDialog"
			>
				<div
					:class="[
						'bg-white rounded-2xl shadow-2xl w-full flex flex-col overflow-hidden border border-gray-200',
						isSearchMode && (settingsStore.canManageStock || settingsStore.canManageItems)
							? 'max-w-[96vw] xl:max-w-7xl h-[90vh] max-h-[90vh]'
							: 'max-w-4xl max-h-[88vh]',
					]"
				>
					<!-- Modal Header (Compact) -->
					<div class="px-3.5 sm:px-6 py-2 sm:py-2.5 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-slate-50 to-blue-50/40 shrink-0">
						<div class="flex items-center gap-2.5 min-w-0">
							<div class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
								<svg class="w-4 h-4 sm:w-4.5 sm:h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
								</svg>
							</div>
							<div class="min-w-0 text-start">
								<h3 class="text-sm sm:text-base font-bold text-gray-900 truncate">
									{{
										isSearchMode && (settingsStore.canManageStock || settingsStore.canManageItems)
											? __("Gestión de Productos e Inventario")
											: __("Disponibilidad y Stock")
									}}
								</h3>
							</div>
						</div>
						<button
							type="button"
							@click="closeDialog"
							class="p-1 sm:p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-lg transition-colors shrink-0"
							:title="__('Cerrar')"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>

					<!-- Modal Body (Scrollable) -->
					<div class="flex-1 overflow-y-auto px-3 sm:px-5 py-1.5 sm:py-2">
						<!-- Initial Loading State - shown before any content is ready -->
						<div
							v-if="!isReady && loading"
							class="flex flex-col items-center justify-center py-12"
						>
							<div class="text-center">
								<div
									class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"
								></div>
								<p class="mt-4 text-sm text-gray-500">
									{{ __("Loading stock information...") }}
								</p>
							</div>
							<button
								@click="closeDialog"
								class="mt-6 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
							>
								{{ __("Cancel") }}
							</button>
						</div>

						<template v-else>
							<!-- Top Tabs (2x2 compact grid on mobile, single flex bar on desktop) -->
							<div
								v-if="isSearchMode && (settingsStore.canManageStock || settingsStore.canManageItems)"
								class="grid grid-cols-2 sm:flex sm:flex-wrap gap-1 p-1 bg-gray-100 rounded-lg mb-1.5"
							>
								<button
									type="button"
									@click="switchTab('lookup')"
									:class="[
										'sm:flex-1 px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5',
										activeTab === 'lookup'
											? 'bg-white text-blue-700 shadow-xs'
											: 'text-gray-600 hover:text-gray-900',
									]"
								>
									<svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
									</svg>
									<span class="truncate">{{ __("Inventario / Stock") }}</span>
								</button>
								<button
									v-if="settingsStore.canManageItems"
									type="button"
									@click="switchTab('catalog')"
									:class="[
										'sm:flex-1 px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5',
										activeTab === 'catalog'
											? 'bg-white text-blue-700 shadow-xs'
											: 'text-gray-600 hover:text-gray-900',
									]"
								>
									<svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
									</svg>
									<span class="sm:hidden truncate">{{ __("Productos") }}</span>
									<span class="hidden sm:inline truncate">{{ __("Productos (Crear / Editar)") }}</span>
								</button>
								<button
									v-if="settingsStore.canManageStock"
									type="button"
									@click="switchTab('batch_entry')"
									:class="[
										'sm:flex-1 px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5',
										activeTab === 'batch_entry'
											? 'bg-white text-green-700 shadow-xs'
											: 'text-gray-600 hover:text-gray-900',
									]"
								>
									<svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
									</svg>
									<span class="sm:hidden truncate">{{ __("Inv. Masivo") }}</span>
									<span class="hidden sm:inline truncate">{{ __("Añadir Inventario Masivo") }}</span>
									<span
										v-if="batchItems.length > 0"
										class="px-1.5 py-0.5 text-[10px] font-bold bg-green-600 text-white rounded-full shrink-0"
									>
										{{ batchItems.length }}
									</span>
								</button>
								<button
									v-if="settingsStore.canManageStock"
									type="button"
									@click="switchTab('history')"
									:class="[
										'sm:flex-1 px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5',
										activeTab === 'history'
											? 'bg-white text-blue-700 shadow-xs'
											: 'text-gray-600 hover:text-gray-900',
									]"
								>
									<svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									<span class="truncate">{{ __("Historial / Anular") }}</span>
								</button>
							</div>

				<!-- ============================================================ -->
				<!-- TAB 1: CONSULTAR / AÑADIR STOCK INDIVIDUAL                   -->
				<!-- ============================================================ -->
				<div v-if="!isSearchMode || activeTab === 'lookup'">
				<!-- Subtitle (Only shown in single-item mode or when an item is selected) -->
				<div
					v-if="!isSearchMode || selectedItemCode"
					class="mb-2.5 flex flex-wrap items-center justify-between gap-2 text-start"
				>
					<div class="flex items-center gap-2 min-w-0 flex-1">
						<button
							v-if="isSearchMode && selectedItemCode"
							type="button"
							@click="clearSelectedItem"
							class="px-2.5 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors flex items-center gap-1 shrink-0"
						>
							<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
							</svg>
							<span>{{ __("Volver al Inventario") }}</span>
						</button>
						<p class="text-xs sm:text-sm font-bold text-gray-800 leading-snug line-clamp-2 min-w-0">
							{{ displayItemName }}
						</p>
					</div>
					<button
						v-if="settingsStore.canManageItems && (selectedItemCode || itemCode)"
						type="button"
						@click="openEditItemModal(isSearchMode ? selectedItemCode : itemCode)"
						class="px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-1 flex-shrink-0"
					>
						<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
							/>
						</svg>
						<span>{{ __("Editar Producto") }}</span>
					</button>
				</div>

				<!-- Search Section (Only shown when viewing a specific item in Search Mode) -->
				<div
					v-if="isSearchMode && selectedItemCode"
					class="py-2.5 px-3 border-b border-gray-200 bg-gray-50 rounded-lg relative mb-3"
				>
					<div class="relative">
						<!-- Search Icon / Loading Spinner -->
						<div
							class="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none"
						>
							<svg
								v-if="!searching"
								class="h-5 w-5 text-gray-400"
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
							<div
								v-else
								class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"
							></div>
						</div>
						<!-- Search Input -->
						<input
							ref="searchInputRef"
							v-model="searchQuery"
							type="text"
							:placeholder="__('Type to search items...')"
							class="stock-search-input w-full ps-10 pe-10 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
							@input="handleSearchInput"
							@keydown.enter.prevent="selectFirstResult"
							@keydown.down.prevent="navigateResults(1)"
							@keydown.up.prevent="navigateResults(-1)"
							@keydown.escape="handleEscape"
							@focus="
								showSearchResults =
									searchResults.length > 0 || searchQuery.length >= 1
							"
							autocomplete="off"
						/>
						<!-- Clear Button -->
						<button
							v-if="searchQuery"
							@click="clearSearch"
							class="absolute inset-y-0 end-0 pe-3 flex items-center"
							:aria-label="__('Clear search')"
						>
							<svg
								class="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors"
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

					<!-- Search Hint -->
					<div
						v-if="!searchQuery && !selectedItemCode"
						class="mt-2 flex items-center justify-start gap-2 text-xs text-gray-500"
					>
						<svg
							class="w-3.5 h-3.5 flex-shrink-0"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<span class="text-start">{{
							__("Search by item name, code, or scan barcode")
						}}</span>
					</div>

					<!-- Search Results Dropdown -->
					<div
						v-if="
							showSearchResults &&
							(searchResults.length > 0 || (searchQuery.length >= 1 && !searching))
						"
						class="absolute start-4 end-4 z-20 mt-1 bg-white border border-gray-200 rounded-lg shadow-2xl max-h-72 overflow-y-auto"
					>
						<!-- Results List -->
						<div v-if="searchResults.length > 0">
							<button
								v-for="(item, index) in searchResults"
								:key="item.item_code"
								ref="resultRefs"
								@click="selectItem(item)"
								@mouseenter="selectedResultIndex = index"
								:class="[
									'w-full text-start px-4 py-3 flex items-center gap-3 border-b border-gray-100 last:border-0 transition-colors',
									selectedResultIndex === index
										? 'bg-blue-50'
										: 'hover:bg-gray-50',
								]"
							>
								<!-- Item Image -->
								<div
									class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
								>
									<img
										v-if="item.image"
										:src="item.image"
										:alt="item.item_name"
										class="w-full h-full object-cover"
									/>
									<svg
										v-else
										class="w-5 h-5 text-gray-400"
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
								<div class="flex-1 min-w-0 text-start">
									<!-- Item Name with Highlighting -->
									<p
										class="text-sm font-medium text-gray-900 truncate"
										v-html="highlightMatch(item.item_name, searchQuery)"
									></p>
									<!-- Item Code with Highlighting -->
									<p
										class="text-xs text-gray-500 truncate"
										v-html="highlightMatch(item.item_code, searchQuery)"
									></p>
								</div>
								<div class="text-end flex-shrink-0 flex flex-col items-end gap-1">
									<!-- Stock Badge -->
									<span
										:class="[
											'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
											(item.actual_qty || 0) > 0
												? 'bg-green-100 text-green-800'
												: 'bg-red-100 text-red-800',
										]"
									>
										{{ Math.floor(item.actual_qty || 0) }}
										{{ item.stock_uom || __("Nos") }}
									</span>
									<!-- Price if available -->
									<span v-if="item.rate" class="text-xs text-gray-500">
										{{ formatPrice(item.rate) }}
									</span>
								</div>
							</button>
						</div>

						<!-- No Results -->
						<div
							v-else-if="searchQuery.length >= 1 && !searching"
							class="px-4 py-6 text-center"
						>
							<svg
								class="mx-auto h-10 w-10 text-gray-300"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							<p class="mt-2 text-sm text-gray-500">
								{{ __('No items found for "{0}"', [searchQuery]) }}
							</p>
							<p class="mt-1 text-xs text-gray-400">
								{{ __("Try a different search term") }}
							</p>
						</div>
					</div>
				</div>

				<!-- Selected Item Header (Search Mode with item selected) -->
				<div
					v-if="isSearchMode && selectedItemCode"
					class="py-2 px-3 bg-blue-50 border border-blue-200 rounded-lg mb-4"
				>
					<div class="flex items-center gap-2">
						<!-- Item Image -->
						<div
							class="w-8 h-8 bg-white rounded flex items-center justify-center overflow-hidden border border-blue-200 flex-shrink-0"
						>
							<img
								v-if="selectedItemImage"
								:src="selectedItemImage"
								:alt="displayItemName"
								class="w-full h-full object-cover"
							/>
							<svg
								v-else
								class="w-4 h-4 text-gray-400"
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
						<!-- Item Info -->
						<div class="flex-1 min-w-0 text-start">
							<p class="text-sm font-medium text-gray-900 truncate">
								{{ displayItemName }}
							</p>
							<p class="text-xs text-gray-500 truncate">{{ selectedItemCode }}</p>
						</div>
						<!-- Clear Button -->
						<button
							@click="clearSelectedItem"
							class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-blue-100 rounded transition-colors flex-shrink-0"
							:title="__('Search Again')"
						>
							<svg
								class="w-4 h-4"
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

				<!-- Variant Selection Section -->
				<div
					v-if="showVariantSelection"
					class="mb-4 border border-gray-200 rounded-lg bg-gray-50"
				>
					<div class="p-4">
						<div class="flex items-center justify-between mb-3">
							<h4 class="text-sm font-semibold text-gray-900">
								{{ __("Select Variants") }}
							</h4>
							<div class="flex gap-2">
								<button
									@click="selectAllVariants"
									class="text-xs px-2 py-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
								>
									{{ __("Select All") }}
								</button>
								<button
									@click="deselectAllVariants"
									class="text-xs px-2 py-1 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
								>
									{{ __("Deselect All") }}
								</button>
							</div>
						</div>

						<!-- Loading Variants -->
						<div v-if="loadingVariants" class="flex items-center justify-center py-8">
							<div class="text-center">
								<div
									class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"
								></div>
								<p class="mt-2 text-xs text-gray-500">
									{{ __("Loading variants...") }}
								</p>
							</div>
						</div>

						<!-- Variants List -->
						<div
							v-else-if="variants.length > 0"
							class="space-y-2 max-h-64 overflow-y-auto"
						>
							<button
								v-for="variant in variants"
								:key="variant.item_code"
								@click="toggleVariantSelection(variant)"
								:class="[
									'w-full text-start p-3 rounded-lg border transition-all',
									isVariantSelected(variant)
										? 'bg-blue-50 border-blue-300 shadow-sm'
										: 'bg-white border-gray-200 hover:border-blue-200 hover:bg-gray-50',
								]"
							>
								<div class="flex items-center gap-3">
									<!-- Checkbox -->
									<div class="flex-shrink-0">
										<div
											:class="[
												'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
												isVariantSelected(variant)
													? 'bg-blue-600 border-blue-600'
													: 'bg-white border-gray-300',
											]"
										>
											<svg
												v-if="isVariantSelected(variant)"
												class="w-3 h-3 text-white"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="3"
													d="M5 13l4 4L19 7"
												/>
											</svg>
										</div>
									</div>

									<!-- Variant Image -->
									<div
										class="w-10 h-10 bg-gray-100 rounded flex items-center justify-center overflow-hidden flex-shrink-0"
									>
										<img
											v-if="variant.image"
											:src="variant.image"
											:alt="variant.item_name"
											class="w-full h-full object-cover"
										/>
										<svg
											v-else
											class="w-5 h-5 text-gray-400"
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

									<!-- Variant Info -->
									<div class="flex-1 min-w-0">
										<p class="text-sm font-medium text-gray-900 truncate">
											{{ variant.item_name }}
										</p>
										<p class="text-xs text-gray-500 truncate">
											{{ variant.item_code }}
										</p>
										<!-- Attributes -->
										<div
											v-if="
												variant.attributes &&
												Object.keys(variant.attributes).length > 0
											"
											class="mt-1 flex flex-wrap gap-1"
										>
											<span
												v-for="(value, key) in variant.attributes"
												:key="key"
												class="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
											>
												{{ key }}: {{ value }}
											</span>
										</div>
									</div>
								</div>
							</button>
						</div>

						<!-- No Variants -->
						<div v-else class="text-center py-6">
							<p class="text-sm text-gray-500">{{ __("No variants found") }}</p>
						</div>

						<!-- Confirm Button -->
						<div v-if="variants.length > 0" class="mt-4 pt-4 border-t border-gray-200">
							<button
								@click="confirmVariantSelection"
								:disabled="selectedVariants.length === 0"
								:class="[
									'w-full px-4 py-2 rounded-lg font-medium transition-colors',
									selectedVariants.length > 0
										? 'bg-blue-600 text-white hover:bg-blue-700'
										: 'bg-gray-300 text-gray-500 cursor-not-allowed',
								]"
							>
								{{ __("Check Availability in All Wherehouses") }} ({{
									selectedVariants.length
								}}
								{{ __("Selected") }})
							</button>
						</div>
					</div>
				</div>

				<!-- Content -->
				<div class="flex-1">
					<!-- Loading State (only show if not in variant selection) -->
					<div
						v-if="loading && !showVariantSelection"
						class="flex items-center justify-center py-12"
					>
						<div class="text-center">
							<div
								class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"
							></div>
							<p class="mt-4 text-sm text-gray-500">
								{{ __("Checking warehouse availability...") }}
							</p>
						</div>
					</div>

					<!-- Error State (only show if not in variant selection) -->
					<div
						v-else-if="error && !showVariantSelection"
						class="flex items-center justify-center py-12"
					>
						<div class="text-center">
							<svg
								class="mx-auto h-12 w-12 text-red-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							<p class="mt-4 text-sm text-gray-700">{{ error }}</p>
							<button
								@click="loadAvailability"
								class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
							>
								{{ __("Try Again") }}
							</button>
						</div>
					</div>

					<!-- Current Inventory Overview Table + Compact Unified Toolbar + PDF Export -->
					<div
						v-else-if="isSearchMode && !selectedItemCode && !showVariantSelection"
						class="space-y-1.5 text-start"
					>
						<!-- Unified Compact Control Bar (Mobile-First: 3 slim rows on mobile, 2 on desktop) -->
						<div class="p-1.5 sm:p-2 bg-gray-50 border border-gray-200 rounded-lg space-y-1.5">
							<!-- Row 1: Search + Filters + Refresh + PDF -->
							<div class="grid grid-cols-1 sm:grid-cols-12 gap-1.5 items-center">
								<!-- Search Input + Mobile Quick Actions (Refresh & PDF share Row 1 on mobile) -->
								<div class="flex items-center gap-1.5 sm:col-span-4">
									<div class="relative flex-1 min-w-0">
										<svg
											class="w-3.5 h-3.5 text-gray-400 absolute start-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
										</svg>
										<input
											ref="searchInputRef"
											v-model="searchQuery"
											type="text"
											:placeholder="__('Buscar producto, código o medida...')"
											class="w-full ps-8 pe-7 py-1 text-xs bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
											@keydown.enter.prevent="filteredInventoryItems.length > 0 && selectItem(filteredInventoryItems[0])"
											autocomplete="off"
										/>
										<button
											v-if="searchQuery"
											type="button"
											@click="searchQuery = ''"
											class="absolute inset-y-0 end-0 pe-2 flex items-center text-gray-400 hover:text-gray-600"
										>
											<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
												<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
											</svg>
										</button>
									</div>

									<!-- Mobile-only Refresh & PDF buttons inline with Search -->
									<button
										type="button"
										@click="loadInventoryReport"
										:disabled="loadingInventoryReport"
										class="sm:hidden p-1.5 text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-md transition-colors shrink-0"
										:title="__('Actualizar inventario')"
									>
										<svg
											class="w-3.5 h-3.5"
											:class="loadingInventoryReport ? 'animate-spin text-blue-600' : ''"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											stroke-width="2"
										>
											<path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
										</svg>
									</button>

									<button
										type="button"
										@click="exportInventoryPDF"
										:disabled="filteredInventoryItems.length === 0"
										class="sm:hidden px-2 py-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 rounded-md shadow-xs transition-colors flex items-center gap-1 shrink-0"
									>
										<svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
											<path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
										</svg>
										<span>PDF</span>
									</button>
								</div>

								<!-- Warehouse Filter & Category Filter (Side-by-side on mobile & desktop) -->
								<div class="grid grid-cols-2 gap-1.5 sm:col-span-5">
									<select
										v-model="invWarehouseFilter"
										class="w-full px-2 py-1 text-[11px] sm:text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 truncate"
									>
										<option value="">{{ __("Almacén: Todos") }}</option>
										<option
											v-for="wh in inventoryWarehouses"
											:key="wh.warehouse"
											:value="wh.warehouse"
										>
											{{ wh.warehouse_name }}
										</option>
									</select>

									<select
										v-model="invGroupFilter"
										class="w-full px-2 py-1 text-[11px] sm:text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 truncate"
									>
										<option value="">{{ __("Categoría: Todas") }}</option>
										<option
											v-for="grp in inventoryGroups"
											:key="grp"
											:value="grp"
										>
											{{ grp }}
										</option>
									</select>
								</div>

								<!-- Desktop Refresh + Export PDF -->
								<div class="hidden sm:flex items-center justify-end gap-1.5 sm:col-span-3">
									<button
										type="button"
										@click="loadInventoryReport"
										:disabled="loadingInventoryReport"
										class="p-1 text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-md transition-colors shrink-0"
										:title="__('Actualizar inventario')"
									>
										<svg
											class="w-4 h-4"
											:class="loadingInventoryReport ? 'animate-spin text-blue-600' : ''"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											stroke-width="2"
										>
											<path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
										</svg>
									</button>

									<button
										type="button"
										@click="exportInventoryPDF"
										:disabled="filteredInventoryItems.length === 0"
										class="px-2.5 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 rounded-md shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap"
									>
										<svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
											<path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
										</svg>
										<span>{{ __("Exportar PDF") }}</span>
									</button>
								</div>
							</div>

							<!-- Row 2: Single-Line Status Chips + Cost Toggle -->
							<div class="flex flex-wrap items-center justify-between gap-1 pt-1 border-t border-gray-200/80">
								<div class="flex flex-wrap items-center gap-1">
									<button
										type="button"
										@click="invStatusFilter = ''"
										class="px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold border transition-all flex items-center gap-1"
										:class="invStatusFilter === '' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'"
									>
										<span>Todos: {{ filteredInventoryItems.length }}</span>
									</button>

									<span class="px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold bg-gray-100 text-gray-800 border border-gray-300">
										<span class="hidden sm:inline">Unidades: </span>{{ inventorySummary.totalUnits }} uds
									</span>

									<button
										type="button"
										@click="invStatusFilter = invStatusFilter === 'low' ? '' : 'low'"
										class="px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold border transition-all flex items-center gap-1"
										:class="invStatusFilter === 'low' ? 'bg-amber-500 text-white border-amber-600' : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'"
									>
										<span class="sm:hidden">Bajo: {{ inventorySummary.lowStockCount }}</span>
										<span class="hidden sm:inline">Stock Bajo: {{ inventorySummary.lowStockCount }}</span>
									</button>

									<button
										type="button"
										@click="invStatusFilter = invStatusFilter === 'out' ? '' : 'out'"
										class="px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold border transition-all flex items-center gap-1"
										:class="invStatusFilter === 'out' ? 'bg-red-600 text-white border-red-600' : 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'"
									>
										<span>Sin Stock: {{ inventorySummary.outOfStockCount }}</span>
									</button>
								</div>

								<label class="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-white border border-gray-300 hover:bg-gray-50 cursor-pointer select-none ms-auto">
									<input
										v-model="showCostPrice"
										type="checkbox"
										class="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
									/>
									<span class="text-[10px] sm:text-[11px] font-semibold text-gray-700">
										<span class="sm:hidden">Costo</span>
										<span class="hidden sm:inline">Mostrar Costo Fábrica</span>
									</span>
								</label>
							</div>
						</div>

						<!-- Loading Inventory State -->
						<div v-if="loadingInventoryReport && inventoryReportItems.length === 0" class="py-10 text-center">
							<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
							<p class="mt-2 text-xs text-gray-500">{{ __("Cargando inventario actual...") }}</p>
						</div>

						<!-- Inventory List & Table (Single Scrollbar, Zero Horizontal Overflow on Mobile) -->
						<div
							v-else-if="filteredInventoryItems.length > 0"
							class="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs"
						>
							<!-- MOBILE VIEW (< 640px): Compact 100%-Width Product Rows (No horizontal cut-off) -->
							<div class="sm:hidden divide-y divide-gray-100">
								<div class="px-2.5 py-1.5 bg-gray-100 flex items-center justify-between text-[10px] font-bold text-gray-600 uppercase tracking-wider">
									<span>Producto / Almacén</span>
									<div class="flex items-center gap-3">
										<span>Precio</span>
										<span>Cant.</span>
										<span class="w-12 text-end">Acción</span>
									</div>
								</div>
								<div
									v-for="row in filteredInventoryItems"
									:key="`mob-${row.item_code}`"
									class="px-2.5 py-2 hover:bg-gray-50 active:bg-gray-100 transition-colors flex items-center justify-between gap-2 cursor-pointer"
									@click="selectItem(row)"
								>
									<!-- Left: Product Name + 1-line compact metadata -->
									<div class="flex-1 min-w-0">
										<div class="text-xs font-bold text-gray-900 leading-snug truncate">
											{{ row.item_name }}
										</div>
										<div class="text-[10px] text-gray-500 truncate mt-0.5">
											<span class="font-mono text-gray-400">{{ row.item_code }}</span>
											<template v-if="row.custom_medida"> · {{ row.custom_medida }}</template>
											<template v-if="row.display_warehouse_name"> · {{ cleanWarehouseName(row.display_warehouse_name) }}</template>
										</div>
										<div v-if="showCostPrice" class="text-[10px] font-semibold text-gray-500 mt-0.5">
											Costo: Bs. {{ Number(row.cost_rate || 0).toFixed(0) }}
										</div>
									</div>

									<!-- Right: Price + Stock Pill + Actions -->
									<div class="shrink-0 flex items-center gap-1.5" @click.stop>
										<div class="text-xs font-bold text-gray-900 whitespace-nowrap text-end">
											Bs. {{ Number(row.selling_rate || 0).toFixed(0) }}
										</div>

										<button
											type="button"
											@click="selectItem(row)"
											class="inline-flex items-center justify-center min-w-[2rem] px-1.5 py-0.5 rounded-md text-[11px] font-extrabold text-white shadow-2xs"
											:class="
												row.stock_level === 'out'
													? 'bg-red-500'
													: row.stock_level === 'low'
													? 'bg-amber-500'
													: 'bg-green-500'
											"
										>
											{{ Math.floor(row.display_qty) }}
										</button>

										<button
											type="button"
											@click="selectItem(row)"
											class="px-1.5 py-0.5 text-[10px] font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded transition-colors"
											:title="__('Ajustar Stock')"
										>
											+ / −
										</button>

										<button
											v-if="settingsStore.canManageItems"
											type="button"
											@click="openEditItemModal(row.item_code)"
											class="p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
											:title="__('Editar Producto')"
										>
											<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
												<path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
											</svg>
										</button>
									</div>
								</div>
							</div>

							<!-- DESKTOP/TABLET VIEW (>= 640px): Full Table -->
							<div class="hidden sm:block overflow-x-auto">
								<table class="min-w-full divide-y divide-gray-200 text-xs">
									<thead class="bg-gray-100 sticky top-0 z-10">
										<tr>
											<th class="px-3 py-1.5 text-start font-bold text-gray-700 uppercase tracking-wider">
												Producto
											</th>
											<th class="px-2.5 py-1.5 text-start font-bold text-gray-700 uppercase tracking-wider hidden md:table-cell">
												Categoría
											</th>
											<th class="px-2.5 py-1.5 text-start font-bold text-gray-700 uppercase tracking-wider">
												Almacén
											</th>
											<th
												v-if="showCostPrice"
												class="px-2.5 py-1.5 text-end font-bold text-gray-700 uppercase tracking-wider"
											>
												Costo
											</th>
											<th class="px-2.5 py-1.5 text-end font-bold text-gray-700 uppercase tracking-wider">
												Precio
											</th>
											<th class="px-2.5 py-1.5 text-center font-bold text-gray-700 uppercase tracking-wider">
												Cantidad
											</th>
											<th class="px-2.5 py-1.5 text-end font-bold text-gray-700 uppercase tracking-wider">
												Acción
											</th>
										</tr>
									</thead>
									<tbody class="divide-y divide-gray-100 bg-white">
										<tr
											v-for="row in filteredInventoryItems"
											:key="row.item_code"
											class="hover:bg-gray-50 transition-colors cursor-pointer"
											@click="selectItem(row)"
										>
											<td class="px-3 py-1.5">
												<div class="font-bold text-gray-900 leading-tight">
													{{ row.item_name }}
												</div>
												<div class="flex items-center gap-1 flex-wrap mt-0.5 text-[10px] text-gray-500">
													<span class="font-mono text-gray-400">{{ row.item_code }}</span>
													<span v-if="row.custom_medida" class="px-1 bg-gray-100 text-gray-600 rounded font-medium">
														{{ row.custom_medida }}
													</span>
												</div>
											</td>
											<td class="px-2.5 py-1.5 text-gray-600 font-medium hidden md:table-cell">
												{{ row.item_group }}
											</td>
											<td class="px-2.5 py-1.5 text-gray-700">
												<div class="font-semibold text-gray-800 leading-tight">
													{{ cleanWarehouseName(row.display_warehouse_name) }}
												</div>
												<div
													v-if="!invWarehouseFilter && row.other_qty > 0"
													class="text-[10px] text-gray-500 font-medium"
												>
													+ {{ Math.floor(row.other_qty) }} {{ __("otros") }}
												</div>
											</td>
											<td
												v-if="showCostPrice"
												class="px-2.5 py-1.5 text-end font-semibold text-gray-600 whitespace-nowrap"
											>
												Bs. {{ Number(row.cost_rate || 0).toFixed(0) }}
											</td>
											<td class="px-2.5 py-1.5 text-end font-bold text-gray-900 whitespace-nowrap">
												Bs. {{ Number(row.selling_rate || 0).toFixed(0) }}
											</td>
											<td class="px-2.5 py-1.5 text-center whitespace-nowrap">
												<span
													class="inline-flex items-center justify-center min-w-[2.25rem] px-2 py-0.5 rounded-md text-xs font-extrabold text-white shadow-2xs"
													:class="
														row.stock_level === 'out'
															? 'bg-red-500'
															: row.stock_level === 'low'
															? 'bg-amber-500'
															: 'bg-green-500'
													"
												>
													{{ Math.floor(row.display_qty) }}
												</span>
											</td>
											<td class="px-2.5 py-1.5 text-end whitespace-nowrap" @click.stop>
												<div class="inline-flex items-center gap-1">
													<button
														type="button"
														@click="selectItem(row)"
														class="px-2 py-0.5 text-[11px] font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-md transition-colors"
													>
														{{ settingsStore.canManageStock ? "+ / − Stock" : "Ver" }}
													</button>
													<button
														v-if="settingsStore.canManageItems"
														type="button"
														@click="openEditItemModal(row.item_code)"
														class="p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 border border-transparent hover:border-gray-300 rounded-md transition-colors"
														:title="__('Editar Producto')"
													>
														<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
															<path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
														</svg>
													</button>
												</div>
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>

						<!-- Empty Filtered State -->
						<div v-else class="py-8 text-center bg-gray-50 border border-gray-200 rounded-xl">
							<p class="text-xs font-semibold text-gray-600">
								{{ __("No se encontraron productos con los filtros seleccionados.") }}
							</p>
						</div>
					</div>

					<!-- Warehouses List (only show if not in variant selection) -->
					<div
						v-else-if="warehouses && warehouses.length > 0 && !showVariantSelection"
						class="flex flex-col gap-3"
					>
						<!-- Group by warehouse if multiple variants selected -->
						<template v-if="selectedVariants.length > 1">
							<!-- Group warehouses by warehouse name -->
							<div
								v-for="(warehouseGroup, warehouseName) in groupedWarehouses"
								:key="warehouseName"
								class="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors"
							>
								<div
									class="flex items-center justify-between gap-4 mb-3 pb-3 border-b border-gray-200"
								>
									<div class="flex-1 min-w-0 text-start">
										<h3 class="font-medium text-gray-900 truncate">
											{{ warehouseGroup[0].warehouse_name }}
										</h3>
										<p class="text-sm text-gray-500 mt-0.5 truncate">
											{{ warehouseGroup[0].company }}
										</p>
									</div>
									<div class="text-end flex-shrink-0">
										<div class="text-xs text-gray-500">
											{{ warehouseGroup.length }}
											{{
												warehouseGroup.length === 1
													? __("variant")
													: __("variants")
											}}
										</div>
									</div>
								</div>
								<!-- Variants in this warehouse -->
								<div class="space-y-2">
									<div
										v-for="warehouse in warehouseGroup"
										:key="`${warehouse.warehouse}-${warehouse.item_code}`"
										class="bg-white rounded p-3 border border-gray-100"
									>
										<div class="flex items-center justify-between gap-4">
											<div class="flex-1 min-w-0 text-start">
												<p
													class="text-sm font-medium text-gray-900 truncate"
												>
													{{ getVariantName(warehouse.item_code) }}
												</p>
												<p class="text-xs text-gray-500 truncate">
													{{ warehouse.item_code }}
												</p>
											</div>
											<div class="flex-shrink-0 flex items-center gap-2">
												<!-- Sell Button -->
												<button
													v-if="warehouse.available_qty > 0 || !settingsStore.shouldEnforceStockValidation()"
													@click="sellFromWarehouse(warehouse)"
													class="px-2 py-1 text-[10px] font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded transition-colors flex items-center gap-0.5 shadow-sm"
												>
													<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
														<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
													</svg>
													<span>{{ __("Vender") }}</span>
												</button>

												<div class="text-end flex-shrink-0">
													<div
														:class="[
															'text-base font-bold',
															warehouse.available_qty > 0
																? 'text-green-600'
																: 'text-red-500',
														]"
													>
														{{ Math.floor(warehouse.available_qty) }}
														{{ getVariantUom(warehouse.item_code) }}
													</div>
													<div class="text-xs text-gray-500 mt-0.5">
														<span
															v-if="warehouse.reserved_qty > 0"
															class="text-orange-600"
														>
															{{
																__("{0} reserved", [
																	Math.floor(warehouse.reserved_qty),
																])
															}}
														</span>
														<span
															v-if="warehouse.rate"
															class="text-gray-500"
															>{{ formatPrice(warehouse.rate) }}</span
														>
														<span v-else>{{ __("Available") }}</span>
													</div>
												</div>
											</div>
										</div>
										<!-- Actual vs Available -->
										<div
											v-if="warehouse.actual_qty !== warehouse.available_qty"
											class="mt-2 pt-2 border-t border-gray-100"
										>
											<div
												class="flex items-center justify-between text-xs text-gray-600"
											>
												<span class="text-start">{{
													__("Actual Stock")
												}}</span>
												<span class="font-medium text-end"
													>{{ Math.floor(warehouse.actual_qty) }}
													{{ getVariantUom(warehouse.item_code) }}</span
												>
											</div>
										</div>
									</div>
								</div>
							</div>
						</template>
						<!-- Single variant or no variants - show simple list -->
						<template v-else>
							<div
								v-for="warehouse in warehouses"
								:key="warehouse.warehouse"
								class="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-200 hover:border-blue-300 transition-colors"
							>
								<!-- Top Row: Warehouse Name (left) + Available Qty (right) -->
								<div class="flex items-start justify-between gap-3">
									<div class="flex-1 min-w-0 text-start">
										<h3 class="text-sm sm:text-base font-bold text-gray-900 leading-snug truncate">
											{{ warehouse.warehouse_name }}
										</h3>
										<p class="text-xs text-gray-500 mt-0.5 truncate">
											{{ warehouse.company }}
										</p>
										<!-- Show variant name if single variant selected -->
										<p
											v-if="
												warehouse.item_code &&
												selectedVariants.length === 1
											"
											class="text-xs text-blue-600 mt-1"
										>
											{{ getVariantName(warehouse.item_code) }}
										</p>
									</div>

									<div class="text-end shrink-0">
										<div
											:class="[
												'text-base sm:text-lg font-bold leading-tight',
												warehouse.available_qty > 0
													? 'text-green-600'
													: 'text-red-500',
											]"
										>
											{{ Math.floor(warehouse.available_qty) }}
											{{
												warehouse.item_code
													? getVariantUom(warehouse.item_code)
													: displayUom
											}}
										</div>
										<!-- Converted quantity in barcode UOM if different -->
										<div
											v-if="
												selectedBarcodeUom &&
												convertToBarcodeUom(warehouse.available_qty) !==
													null
											"
											class="text-xs sm:text-sm text-blue-600 font-medium"
										>
											≈
											{{
												Math.floor(
													convertToBarcodeUom(warehouse.available_qty) *
														100
												) / 100
											}}
											{{ selectedBarcodeUom }}
										</div>
										<div class="text-[11px] sm:text-xs text-gray-500 mt-0.5">
											<span
												v-if="warehouse.reserved_qty > 0"
												class="text-orange-600"
											>
												{{
													__("{0} reserved", [
														Math.floor(warehouse.reserved_qty),
													])
												}}
											</span>
											<span v-else>{{ __("Disponible") }}</span>
										</div>
									</div>
								</div>

								<!-- Action Buttons Bar (Wraps cleanly on mobile, zero horizontal overflow) -->
								<div
									v-if="(settingsStore.canManageStock && selectedVariants.length <= 1) || warehouse.available_qty > 0 || !settingsStore.shouldEnforceStockValidation()"
									class="mt-2.5 pt-2.5 border-t border-gray-200/80 flex flex-wrap items-center gap-1.5 sm:gap-2"
								>
									<!-- Quick Add Stock Button -->
									<button
										v-if="settingsStore.canManageStock && selectedVariants.length <= 1"
										type="button"
										@click="toggleQuickStockForm(warehouse, 'add')"
										class="flex-1 sm:flex-initial justify-center px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm border"
										:class="
											activeQuickWarehouse === warehouse.warehouse && quickEntryMode === 'add'
												? 'bg-green-600 text-white border-green-600'
												: 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
										"
									>
										<svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
											<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
										</svg>
										<span>{{ __("Añadir Stock") }}</span>
									</button>

									<!-- Quick Subtract Stock Button -->
									<button
										v-if="settingsStore.canManageStock && selectedVariants.length <= 1 && (warehouse.actual_qty || 0) > 0"
										type="button"
										@click="toggleQuickStockForm(warehouse, 'subtract')"
										class="flex-1 sm:flex-initial justify-center px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm border"
										:class="
											activeQuickWarehouse === warehouse.warehouse && quickEntryMode === 'subtract'
												? 'bg-red-600 text-white border-red-600'
												: 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
										"
									>
										<svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
											<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12h-15" />
										</svg>
										<span>{{ __("Disminuir") }}</span>
									</button>

									<!-- Sell Button -->
									<button
										v-if="warehouse.available_qty > 0 || !settingsStore.shouldEnforceStockValidation()"
										type="button"
										@click="sellFromWarehouse(warehouse)"
										class="flex-1 sm:flex-initial sm:ms-auto justify-center px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
									>
										<svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
											<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
										</svg>
										<span>{{ __("Vender de aquí") }}</span>
									</button>
								</div>

								<!-- Actual vs Available -->
								<div
									v-if="warehouse.actual_qty !== warehouse.available_qty"
									class="mt-2 pt-2 border-t border-gray-200"
								>
									<div
										class="flex items-center justify-between text-xs text-gray-600"
									>
										<span class="text-start">{{ __("Actual Stock") }}</span>
										<span class="font-medium text-end"
											>{{ Math.floor(warehouse.actual_qty) }}
											{{
												warehouse.item_code
													? getVariantUom(warehouse.item_code)
													: displayUom
											}}</span
										>
									</div>
								</div>

								<!-- Simple & Clear Add / Subtract Stock Form -->
								<div
									v-if="activeQuickWarehouse === warehouse.warehouse"
									class="mt-3 pt-3 border-t bg-white rounded-lg p-3 sm:p-3.5 shadow-sm space-y-3 text-start"
									:class="quickEntryMode === 'subtract' ? 'border-red-200' : 'border-green-200'"
								>
									<!-- Header + Live Calculation -->
									<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
										<span class="text-xs font-bold text-gray-800">
											{{
												quickEntryMode === "subtract"
													? __("¿Cuántas unidades quieres descontar del stock?")
													: __("¿Cuántas unidades quieres añadir al stock?")
											}}
										</span>

										<div
											v-if="quickEntryMode === 'subtract'"
											class="text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-50 text-red-800 border border-red-200 self-start sm:self-auto"
										>
											{{ __("Hay:") }} <strong>{{ Math.floor(warehouse.actual_qty || 0) }}</strong>
											<span class="mx-1 text-red-600">−</span>
											{{ __("Descuentas:") }} <strong>{{ Math.max(0, Math.floor(Number(quickQty) || 0)) }}</strong>
											<span class="mx-1 text-red-600">=</span>
											{{ __("Quedarán:") }}
											<strong class="text-sm text-red-700">
												{{ Math.max(0, Math.floor((warehouse.actual_qty || 0) - Math.max(0, Number(quickQty) || 0))) }}
											</strong>
										</div>
										<div
											v-else
											class="text-xs font-semibold px-2.5 py-1 rounded-lg bg-green-50 text-green-800 border border-green-200 self-start sm:self-auto"
										>
											{{ __("Hay:") }} <strong>{{ Math.floor(warehouse.actual_qty || 0) }}</strong>
											<span class="mx-1 text-green-600">+</span>
											{{ __("Añades:") }} <strong>{{ Math.max(0, Math.floor(Number(quickQty) || 0)) }}</strong>
											<span class="mx-1 text-green-600">=</span>
											{{ __("Quedarán:") }}
											<strong class="text-sm text-green-700">
												{{ Math.floor((warehouse.actual_qty || 0) + Math.max(0, Number(quickQty) || 0)) }}
											</strong>
										</div>
									</div>

									<!-- Big Counter + Quick Buttons + Save Button -->
									<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
										<div class="flex flex-wrap items-center gap-2">
											<!-- Stepper -->
											<div
												class="flex items-center border-2 rounded-lg overflow-hidden bg-white"
												:class="quickEntryMode === 'subtract' ? 'border-red-500' : 'border-green-500'"
											>
												<button
													type="button"
													@click="quickQty = Math.max(1, (Number(quickQty) || 1) - 1)"
													class="px-3.5 py-1.5 sm:py-2 text-gray-700 hover:bg-gray-100 active:bg-gray-200 font-bold text-base"
												>
													−
												</button>
												<input
													v-model.number="quickQty"
													type="number"
													min="1"
													:max="quickEntryMode === 'subtract' ? Math.max(1, Math.floor(warehouse.actual_qty || 1)) : undefined"
													step="1"
													class="w-16 sm:w-20 text-center text-base font-bold text-gray-900 border-x border-gray-200 py-1 sm:py-1.5 focus:outline-none"
													@keydown.enter.prevent="submitQuickStockEntry(warehouse)"
												/>
												<button
													type="button"
													@click="
														quickQty =
															quickEntryMode === 'subtract'
																? Math.min(Math.max(1, Math.floor(warehouse.actual_qty || 1)), (Number(quickQty) || 0) + 1)
																: (Number(quickQty) || 0) + 1
													"
													class="px-3.5 py-1.5 sm:py-2 text-gray-700 hover:bg-gray-100 active:bg-gray-200 font-bold text-base"
												>
													+
												</button>
											</div>

											<!-- Quick Add/Subtract Chips -->
											<div class="flex items-center gap-1.5">
												<button
													v-for="step in [5, 10, 20]"
													:key="step"
													type="button"
													@click="
														quickQty =
															quickEntryMode === 'subtract'
																? Math.min(Math.max(1, Math.floor(warehouse.actual_qty || 1)), (Number(quickQty) || 0) + step)
																: (Number(quickQty) || 0) + step
													"
													class="px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors border"
													:class="
														quickEntryMode === 'subtract'
															? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-300'
															: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-300'
													"
												>
													{{ quickEntryMode === "subtract" ? `−${step}` : `+${step}` }}
												</button>
											</div>
										</div>

										<!-- Clear Action Buttons (Full width 50/50 on mobile) -->
										<div class="flex items-center gap-2 w-full sm:w-auto sm:ms-auto">
											<button
												type="button"
												@click="activeQuickWarehouse = null"
												:disabled="submittingStock"
												class="flex-1 sm:flex-initial justify-center px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
											>
												{{ __("Cancelar") }}
											</button>
											<button
												type="button"
												@click="submitQuickStockEntry(warehouse)"
												:disabled="submittingStock"
												class="flex-1 sm:flex-initial justify-center px-4 py-2 text-xs font-bold text-white disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
												:class="
													quickEntryMode === 'subtract'
														? 'bg-red-600 hover:bg-red-700 active:bg-red-800'
														: 'bg-green-600 hover:bg-green-700 active:bg-green-800'
												"
											>
												<span
													v-if="submittingStock"
													class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"
												></span>
												<svg v-else class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
													<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
												</svg>
												<span>
													{{
														quickEntryMode === "subtract"
															? `${__("Descontar")} (−${Math.max(1, Math.floor(Number(quickQty) || 1))})`
															: `${__("Guardar")} (+${Math.max(1, Math.floor(Number(quickQty) || 1))})`
													}}
												</span>
											</button>
										</div>
									</div>
								</div>
							</div>
						</template>
					</div>

					<!-- No Stock State (only show if not in variant selection) -->
					<div
						v-else-if="(selectedItemCode || itemCode) && !showVariantSelection"
						class="flex items-center justify-center py-12"
					>
						<div class="text-center">
							<svg
								class="mx-auto h-12 w-12 text-gray-400"
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
							<p class="mt-4 text-sm text-gray-700 font-medium">
								{{ __("No stock available") }}
							</p>
							<p class="mt-1 text-sm text-gray-500">
								{{ __("This item is out of stock in all warehouses") }}
							</p>
						</div>
					</div>
				</div>
				</div>

				<!-- ============================================================ -->
				<!-- TAB 2: INGRESO DE PRODUCCIÓN / MERCADERÍA (MULTI-PRODUCTO)    -->
				<!-- ============================================================ -->
				<div
					v-else-if="isSearchMode && activeTab === 'batch_entry'"
					class="space-y-4 text-start"
				>
					<!-- Warehouse + Remarks Header -->
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-green-50 border border-green-200 rounded-lg p-3">
						<div>
							<label class="block text-xs font-bold text-gray-700 mb-1">
								{{ __("Almacén donde entra la mercadería") }}
							</label>
							<select
								v-model="batchWarehouse"
								class="w-full px-3 py-2 text-xs font-semibold bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
							>
								<option
									v-for="wh in availableCompanyWarehouses"
									:key="wh.warehouse || wh.name"
									:value="wh.warehouse || wh.name"
								>
									{{ wh.warehouse_name || wh.warehouse || wh.name }}
								</option>
							</select>
						</div>
						<div>
							<label class="block text-xs font-bold text-gray-700 mb-1">
								{{ __("Nota opcional") }}
							</label>
							<input
								v-model="batchRemarks"
								type="text"
								:placeholder="__('Ej: Llegó de fábrica')"
								class="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
							/>
						</div>
					</div>

					<!-- Product Search to Add to Batch List -->
					<div class="relative">
						<div class="relative">
							<div class="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
								<svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
								</svg>
							</div>
							<input
								v-model="batchSearchQuery"
								type="text"
								:placeholder="__('Buscar producto por nombre o código para añadir...')"
								class="w-full ps-9 pe-8 py-2.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
								@input="handleBatchSearchInput"
								@keydown.enter.prevent="selectFirstBatchResult"
								autocomplete="off"
							/>
							<button
								v-if="batchSearchQuery"
								type="button"
								@click="batchSearchQuery = ''; batchSearchResults = []"
								class="absolute inset-y-0 end-0 pe-3 flex items-center text-gray-400 hover:text-gray-600"
							>
								×
							</button>
						</div>

						<!-- Dropdown Results for Batch Search -->
						<div
							v-if="batchSearchResults.length > 0"
							class="absolute start-0 end-0 z-30 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto"
						>
							<button
								v-for="item in batchSearchResults"
								:key="item.item_code"
								type="button"
								@click="addBatchItem(item)"
								class="w-full text-start px-3 py-2.5 flex items-center justify-between gap-3 border-b border-gray-100 last:border-0 hover:bg-green-50 transition-colors"
							>
								<div class="min-w-0">
									<p class="text-xs font-semibold text-gray-900 truncate">{{ item.item_name }}</p>
									<p class="text-[11px] text-gray-500 font-mono truncate">{{ item.item_code }}</p>
								</div>
								<div class="flex items-center gap-2 shrink-0">
									<span class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700">
										{{ __("Stock:") }} {{ Math.floor(item.actual_qty || 0) }}
									</span>
									<span class="px-2 py-1 bg-green-600 text-white rounded text-[11px] font-semibold">
										+ {{ __("Agregar") }}
									</span>
								</div>
							</button>
						</div>
					</div>

					<!-- Batch Items Table -->
					<div v-if="batchItems.length > 0" class="border border-gray-200 rounded-lg overflow-hidden bg-white">
						<div class="max-h-72 overflow-y-auto divide-y divide-gray-100">
							<div
								v-for="(row, idx) in batchItems"
								:key="row.item_code"
								class="p-3 flex flex-wrap items-center justify-between gap-3 hover:bg-gray-50"
							>
								<div class="flex-1 min-w-[180px]">
									<p class="text-xs font-bold text-gray-900">{{ row.item_name }}</p>
									<p class="text-[11px] text-gray-500 font-mono">
										{{ row.item_code }} · {{ __("Hay:") }}
										<strong>{{ Math.floor(row.actual_qty || 0) }}</strong>
										<span class="text-green-700 font-semibold ms-1">
											➔ {{ __("Quedarán:") }} {{ Math.floor((row.actual_qty || 0) + (Number(row.qty) || 0)) }}
										</span>
									</p>
								</div>

								<div class="flex items-center gap-2">
									<!-- Quick +5 / +10 buttons -->
									<button
										type="button"
										@click="row.qty = (Number(row.qty) || 0) + 5"
										class="px-2 py-1 text-[11px] font-semibold bg-green-50 hover:bg-green-100 text-green-700 border border-green-300 rounded"
									>
										+5
									</button>
									<button
										type="button"
										@click="row.qty = (Number(row.qty) || 0) + 10"
										class="px-2 py-1 text-[11px] font-semibold bg-green-50 hover:bg-green-100 text-green-700 border border-green-300 rounded"
									>
										+10
									</button>

									<!-- Stepper -->
									<div class="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
										<button
											type="button"
											@click="row.qty = Math.max(1, (Number(row.qty) || 1) - 1)"
											class="px-2.5 py-1 text-gray-600 hover:bg-gray-100 font-bold text-xs"
										>
											-
										</button>
										<input
											v-model.number="row.qty"
											type="number"
											min="1"
											step="1"
											class="w-16 text-center text-xs font-bold border-x border-gray-200 py-1 focus:outline-none"
										/>
										<button
											type="button"
											@click="row.qty = (Number(row.qty) || 0) + 1"
											class="px-2.5 py-1 text-gray-600 hover:bg-gray-100 font-bold text-xs"
										>
											+
										</button>
									</div>

									<!-- Remove Row -->
									<button
										type="button"
										@click="batchItems.splice(idx, 1)"
										class="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
										:title="__('Quitar de la lista')"
									>
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
										</svg>
									</button>
								</div>
							</div>
						</div>

						<!-- Batch Submit Bar -->
						<div class="p-3 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2">
							<div class="text-xs text-gray-600">
								<strong>{{ batchItems.length }}</strong> {{ __("producto(s)") }} ·
								{{ __("Total unidades a añadir:") }}
								<strong class="text-green-700">
									+{{ batchItems.reduce((acc, r) => acc + (Number(r.qty) || 0), 0) }}
								</strong>
							</div>
							<div class="flex items-center gap-2">
								<button
									type="button"
									@click="batchItems = []"
									:disabled="submittingStock"
									class="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
								>
									{{ __("Limpiar Lista") }}
								</button>
								<button
									type="button"
									@click="submitBatchStockEntry"
									:disabled="submittingStock || batchItems.length === 0"
									class="px-4 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
								>
									<span
										v-if="submittingStock"
										class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"
									></span>
									<span>{{ __("Guardar Ingreso") }}</span>
								</button>
							</div>
						</div>
					</div>

					<!-- Empty Batch State -->
					<div v-else class="py-10 text-center bg-gray-50 border border-dashed border-gray-300 rounded-lg">
						<svg class="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
						</svg>
						<p class="mt-2 text-xs font-semibold text-gray-700">
							{{ __("Busque arriba los productos que llegaron para sumarlos al stock") }}
						</p>
					</div>
				</div>

				<!-- ============================================================ -->
				<!-- TAB 3: HISTORIAL DE INGRESOS RECIENTES Y ANULACIÓN            -->
				<!-- ============================================================ -->
				<div
					v-else-if="isSearchMode && activeTab === 'history'"
					class="space-y-3 text-start"
				>
					<div class="flex items-center justify-between">
						<p class="text-xs text-gray-500">
							{{ __("Últimos ingresos de stock registrados. Si se equivocó al añadir unidades, puede anularlo aquí.") }}
						</p>
						<button
							type="button"
							@click="loadStockEntriesHistory"
							class="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
						>
							{{ __("Actualizar") }}
						</button>
					</div>

					<div v-if="loadingHistory" class="py-10 text-center">
						<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
						<p class="mt-2 text-xs text-gray-500">{{ __("Cargando historial...") }}</p>
					</div>

					<div
						v-else-if="stockEntriesHistory.length > 0"
						class="max-h-96 overflow-y-auto space-y-2.5 pr-1"
					>
						<div
							v-for="entry in stockEntriesHistory"
							:key="entry.name"
							class="p-3 rounded-lg border transition-colors"
							:class="
								entry.docstatus === 2
									? 'bg-gray-50 border-gray-200 opacity-70'
									: 'bg-white border-gray-200 hover:border-blue-200'
							"
						>
							<div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-100">
								<div class="flex items-center gap-2">
									<span class="text-xs font-bold font-mono text-gray-900">{{ entry.name }}</span>
									<span
										class="px-2 py-0.5 text-[10px] font-bold rounded-full"
										:class="
											entry.docstatus === 2
												? 'bg-red-100 text-red-700'
												: entry.purpose === 'Material Receipt'
												? 'bg-green-100 text-green-800'
												: 'bg-orange-100 text-orange-800'
										"
									>
										{{
											entry.docstatus === 2
												? __("Anulado")
												: entry.purpose === "Material Receipt"
												? __("Ingreso (+)")
												: __("Salida (-)")
										}}
									</span>
									<span v-if="entry.warehouse_name" class="text-[11px] text-gray-600 font-medium">
										· {{ entry.warehouse_name }}
									</span>
								</div>

								<div class="flex items-center gap-2">
									<span class="text-[11px] text-gray-500">
										{{ entry.posting_date }} {{ (entry.posting_time || "").slice(0, 5) }}
									</span>
									<button
										v-if="entry.docstatus === 1 && settingsStore.canManageStock"
										type="button"
										@click="cancellingEntryName = cancellingEntryName === entry.name ? '' : entry.name; cancelReason = ''"
										class="px-2.5 py-1 text-[11px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-colors"
									>
										{{ __("Anular") }}
									</button>
								</div>
							</div>

							<!-- Items inside this Stock Entry -->
							<div class="mt-2 flex flex-wrap gap-1.5">
								<span
									v-for="(it, iIdx) in entry.items"
									:key="iIdx"
									class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800"
								>
									<strong :class="it.direction === 'in' ? 'text-green-700' : 'text-orange-700'">
										{{ it.direction === "in" ? "+" : "-" }}{{ Math.floor(it.qty) }}
									</strong>
									<span>{{ it.item_name }}</span>
								</span>
							</div>

							<p v-if="entry.remarks" class="mt-1.5 text-[11px] text-gray-500 truncate">
								{{ entry.remarks }}
							</p>

							<!-- Inline Cancellation Confirmation -->
							<div
								v-if="cancellingEntryName === entry.name"
								class="mt-2.5 pt-2.5 border-t border-red-200 bg-red-50 rounded p-2.5 flex flex-wrap items-center gap-2"
							>
								<input
									v-model="cancelReason"
									type="text"
									:placeholder="__('Motivo de la anulación (ej: Me equivoqué de cantidad)...')"
									class="flex-1 min-w-[200px] px-2.5 py-1.5 text-xs bg-white border border-red-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
									@keydown.enter.prevent="confirmCancelStockEntry(entry)"
								/>
								<button
									type="button"
									@click="cancellingEntryName = ''"
									class="px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded"
								>
									{{ __("Cancelar") }}
								</button>
								<button
									type="button"
									@click="confirmCancelStockEntry(entry)"
									:disabled="submittingStock"
									class="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded shadow-sm"
								>
									{{ __("Confirmar Anulación") }}
								</button>
							</div>
						</div>
					</div>

					<div v-else class="py-10 text-center bg-gray-50 border border-gray-200 rounded-lg">
						<p class="text-xs text-gray-500">{{ __("No hay ingresos de stock recientes.") }}</p>
					</div>
				</div>

				<!-- ============================================================ -->
				<!-- TAB: GESTIÓN DE PRODUCTOS (CREAR Y EDITAR)                   -->
				<!-- ============================================================ -->
				<div v-else-if="isSearchMode && activeTab === 'catalog'" class="space-y-3 sm:space-y-4 text-start">
					<!-- Toolbar: Search + Create Button -->
					<div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 bg-gray-50 p-3 sm:p-3.5 rounded-xl border border-gray-200">
						<div class="relative flex-1">
							<svg
								class="w-4 h-4 text-gray-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
							<input
								v-model="catalogSearchQuery"
								type="text"
								:placeholder="__('Buscar producto por nombre, código o categoría...')"
								class="w-full ps-9 pe-3 py-2 sm:py-2.5 text-xs sm:text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						<button
							type="button"
							@click="openCreateItemModal"
							class="px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-green-600 hover:bg-green-700 active:bg-green-800 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 flex-shrink-0"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
							</svg>
							<span>{{ __("Crear Nuevo Producto") }}</span>
						</button>
					</div>

					<!-- Product List (Mobile-First stacked card on phone, 2-column grid on desktop) -->
					<div class="grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-3">
						<div
							v-for="prod in filteredCatalogItems"
							:key="prod.item_code"
							class="bg-white border border-gray-200 hover:border-blue-300 rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 transition-colors shadow-sm"
						>
							<div class="flex items-start sm:items-center gap-3 min-w-0 flex-1">
								<div class="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
									<img
										v-if="prod.image"
										:src="prod.image"
										:alt="prod.item_name"
										class="w-full h-full object-cover"
									/>
									<svg v-else class="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
									</svg>
								</div>
								<div class="min-w-0 flex-1">
									<p class="text-xs sm:text-sm font-bold text-gray-900 leading-snug line-clamp-2">
										{{ prod.item_name }}
									</p>
									<div class="flex items-center gap-1.5 flex-wrap mt-1 text-[11px] sm:text-xs text-gray-500">
										<span class="font-mono text-gray-400">
											{{ prod.item_code }}
										</span>
										<span class="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
											{{ prod.item_group }}
										</span>
										<span class="text-gray-600">
											{{ (prod.warehouse_name || prod.warehouse || "").replace(/\s*-\s*[A-Z0-9]+$/i, "") }}:
											<strong :class="(prod.actual_qty ?? 0) > 0 ? 'text-green-600' : 'text-red-500'">
												{{ Math.floor(prod.actual_qty ?? 0) }}
											</strong>
										</span>
									</div>
								</div>
							</div>

							<div class="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t border-gray-100 sm:border-0 flex-shrink-0">
								<div class="text-start sm:text-end">
									<span class="text-sm font-bold text-blue-600">
										Bs. {{ Number(prod.rate || prod.price_list_rate || 0).toFixed(2) }}
									</span>
									<span class="text-[11px] text-gray-400 sm:block ms-1 sm:ms-0">
										/ {{ prod.stock_uom || prod.uom || "Unidad(es)" }}
									</span>
								</div>

								<button
									type="button"
									@click="openEditItemModal(prod.item_code)"
									class="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-1"
								>
									<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
									</svg>
									<span>{{ __("Editar") }}</span>
								</button>
							</div>
						</div>

						<div v-if="filteredCatalogItems.length === 0" class="col-span-full py-10 text-center bg-gray-50 border border-gray-200 rounded-lg">
							<p class="text-xs text-gray-500">{{ __("No se encontraron productos con ese criterio.") }}</p>
						</div>
					</div>
				</div>
						</template>
					</div>

					<!-- Modal Sticky Footer (Compact) -->
					<div v-if="isReady" class="px-3 sm:px-6 py-1.5 sm:py-2 bg-gray-50 border-t border-gray-200 shrink-0">
						<div class="flex items-center justify-between gap-2">
							<!-- Inventory Table Valuation Totals when in general inventory view -->
							<div
								v-if="isSearchMode && activeTab === 'lookup' && !selectedItemCode"
								class="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] sm:text-xs text-start min-w-0"
							>
								<span v-if="showCostPrice" class="text-gray-700 font-semibold whitespace-nowrap">
									<span class="sm:hidden">Costo:</span>
									<span class="hidden sm:inline">Total Costo:</span>
									<strong class="font-extrabold text-gray-900 ms-1">Bs. {{ formatPrice(inventorySummary.totalCostValue) || "0.00" }}</strong>
								</span>
								<span class="text-gray-700 font-semibold whitespace-nowrap">
									<span class="sm:hidden">Total Venta:</span>
									<span class="hidden sm:inline">Total Precio Venta:</span>
									<strong class="font-extrabold text-gray-900 ms-1">Bs. {{ formatPrice(inventorySummary.totalSellingValue) || "0.00" }}</strong>
								</span>
							</div>

							<div
								v-else-if="(!isSearchMode || activeTab === 'lookup') && (selectedItemCode || itemCode) && warehouses.length > 0"
								class="text-xs sm:text-sm text-gray-600 text-start"
							>
								<div>
									<span class="font-medium">{{ __("Total disponible") }}:</span>
									<span class="ms-1.5 text-gray-900 font-bold text-sm sm:text-base">
										{{ totalAvailable }} {{ displayUom }}
									</span>
									<span v-if="warehouses.length > 0" class="ms-1.5 text-gray-500">
										{{
											warehouses.length === 1
												? __("en 1 almacén")
												: __("en {0} almacenes", [warehouses.length])
										}}
									</span>
								</div>
							</div>
							<button
								type="button"
								@click="closeDialog"
								class="ms-auto shrink-0 px-3 sm:px-4 py-1 sm:py-1.5 bg-gray-700 text-white text-xs font-semibold rounded-lg hover:bg-gray-800 transition-colors"
							>
								{{ __("Cerrar") }}
							</button>
						</div>
					</div>
				</div>
			</div>
		</Transition>
	</Teleport>

	<!-- Quick Create / Edit Product Modal -->
	<ItemQuickFormDialog
		v-model="showItemQuickForm"
		:pos-profile="posProfile || shiftStore.profileName"
		:item-code="editingCatalogItemCode"
		@saved="handleCatalogItemSaved"
	/>
</template>

<script setup>
/**
 * WarehouseAvailabilityDialog.vue
 *
 * Stock Lookup Dialog - Shows item availability across warehouses
 *
 * Modes:
 * - 'item': Single item mode - shows availability for a specific item (default)
 * - 'search': Search mode - allows searching for any item with autocomplete
 *
 * RTL Support: Fully compatible with right-to-left languages
 * Translations: All user-facing strings use __() for i18n
 */
import { ref, computed, watch, nextTick } from "vue";
import { call } from "frappe-ui";
import ItemQuickFormDialog from "@/components/sale/ItemQuickFormDialog.vue";
import { __ } from "@/utils/translation";
import { usePOSCartStore } from "@/stores/posCart";
import { usePOSShiftStore } from "@/stores/posShift";
import { usePOSSettingsStore } from "@/stores/posSettings";
import { useStockStore } from "@/stores/stock";
import { useItemSearchStore } from "@/stores/itemSearch";
import { useToast } from "@/composables/useToast";
import { offlineWorker } from "@/utils/offline/workerClient";

const props = defineProps({
	modelValue: Boolean,
	// For single item mode (backward compatible)
	itemCode: String,
	itemName: String,
	uom: {
		type: String,
		default: "Nos",
	},
	company: String,
	currency: {
		type: String,
		default: "",
	},
	// For search mode
	posProfile: String,
	// Mode: 'item' for single item (default), 'search' for general search
	mode: {
		type: String,
		default: "item",
	},
});

const emit = defineEmits(["update:modelValue", "close", "edit-item"]);

// v-model binding for Dialog
const show = computed({
	get: () => props.modelValue,
	set: (val) => emit("update:modelValue", val),
});

// Close dialog helper
function closeDialog() {
	emit("update:modelValue", false);
	emit("close");
}

// Determine if we're in search mode
const isSearchMode = computed(() => props.mode === "search");

// Search state
const searchQuery = ref("");
const searchResults = ref([]);
const searching = ref(false);
const selectedResultIndex = ref(-1);
const showSearchResults = ref(false);
const searchInputRef = ref(null);
const resultRefs = ref([]);
let searchDebounce = null;

// Selected item state (for search mode)
const selectedItemCode = ref("");
const selectedItemName = ref("");
const selectedItemImage = ref("");
const selectedUom = ref("Nos");
const selectedItemHasVariants = ref(false);
const selectedBarcodeUom = ref(""); // Single barcode UOM if different from default
const selectedItemUoms = ref([]); // Conversion factors for UOMs

// Variant state
const variants = ref([]);
const selectedVariants = ref([]);
const loadingVariants = ref(false);
const showVariantSelection = ref(false);

// Warehouse availability state
const loading = ref(false);
const error = ref(null);
const warehouses = ref([]);
const isReady = ref(false); // Gate to prevent showing content before data is ready

const cartStore = usePOSCartStore();
const shiftStore = usePOSShiftStore();
const settingsStore = usePOSSettingsStore();
const stockStore = useStockStore();
const itemSearchStore = useItemSearchStore();
const { showSuccess, showError } = useToast();

const selectedItemObj = ref(null);

// Inventory Management State (Tabs, Quick Inline Adjustment, Batch Receipt, History)
const activeTab = ref("lookup"); // 'lookup' | 'batch_entry' | 'history'
const activeQuickWarehouse = ref(null);
const quickEntryMode = ref("add"); // 'add' | 'set'
const quickQty = ref(null);
const quickRemarks = ref("");
const submittingStock = ref(false);

// Batch Multi-Item Receipt State
const availableCompanyWarehouses = ref([]);
const batchWarehouse = ref("");
const batchRemarks = ref("");
const batchSearchQuery = ref("");
const batchSearchResults = ref([]);
const batchItems = ref([]);
let batchSearchDebounce = null;

// History & Cancellation State
const stockEntriesHistory = ref([]);
const loadingHistory = ref(false);
const cancellingEntryName = ref(null);
const cancelReason = ref("");

// Computed display values
const displayItemName = computed(() => {
	if (isSearchMode.value) {
		return selectedItemName.value || "";
	}
	return props.itemName || props.itemCode || "";
});

const displayUom = computed(() => {
	if (isSearchMode.value) {
		return selectedUom.value || "Nos";
	}
	return props.uom || "Nos";
});

const totalAvailable = computed(() => {
	if (!warehouses.value || warehouses.value.length === 0) return 0;
	return Math.floor(warehouses.value.reduce((sum, w) => sum + (w.available_qty || 0), 0));
});

// Group warehouses by warehouse name when multiple variants selected
const groupedWarehouses = computed(() => {
	if (selectedVariants.value.length <= 1) return {};

	const grouped = {};
	for (const warehouse of warehouses.value) {
		const key = warehouse.warehouse || warehouse.warehouse_name;
		if (!grouped[key]) {
			grouped[key] = [];
		}
		grouped[key].push(warehouse);
	}
	return grouped;
});

// Helper functions for variant info
function getVariantName(itemCode) {
	const variant = variants.value.find((v) => v.item_code === itemCode);
	return variant ? variant.item_name : itemCode;
}

function getVariantUom(itemCode) {
	const variant = variants.value.find((v) => v.item_code === itemCode);
	return variant ? variant.stock_uom || "Nos" : displayUom.value;
}

// Initialize and load based on mode
watch(
	() => props.modelValue,
	async (newVal) => {
		if (newVal) {
			// Set loading immediately to prevent flash of empty content
			loading.value = true;
			isReady.value = false;
			error.value = null;

			if (isSearchMode.value) {
				// Search mode - clear state, load full inventory report, and focus search
				resetSearchState();
				isReady.value = true;
				loading.value = false;
				loadInventoryReport();
				await nextTick();
				focusSearch();
			} else if (props.itemCode) {
				// Item mode - check if item has variants first
				// We need to fetch item details to check has_variants
				try {
					const itemResponse = await call("pos_next.api.items.get_items", {
						pos_profile: props.posProfile,
						search_term: props.itemCode,
						start: 0,
						limit: 1,
					});
					const item = itemResponse?.[0];
					selectedItemObj.value = item;
					if (item && item.has_variants) {
						selectedItemCode.value = props.itemCode;
						selectedItemName.value = props.itemName || props.itemCode;
						selectedItemHasVariants.value = true;
						isReady.value = true;
						await loadVariants();
					} else {
						// No variants, directly load availability
						isReady.value = true;
						await loadAvailability();
					}
				} catch (err) {
					console.error("Error checking item variants:", err);
					// Fallback to direct load
					isReady.value = true;
					await loadAvailability();
				}
			} else {
				// No item code provided
				isReady.value = true;
				loading.value = false;
			}
		} else {
			// Reset when dialog closes
			resetSearchState();
			warehouses.value = [];
			error.value = null;
			isReady.value = false;
		}
	},
	{ immediate: true }
);

function resetSearchState() {
	activeTab.value = "lookup";
	activeQuickWarehouse.value = null;
	quickEntryMode.value = "add";
	quickQty.value = null;
	quickRemarks.value = "";
	cancellingEntryName.value = null;
	cancelReason.value = "";
	searchQuery.value = "";
	searchResults.value = [];
	selectedResultIndex.value = -1;
	showSearchResults.value = false;
	selectedItemCode.value = "";
	selectedItemName.value = "";
	selectedItemImage.value = "";
	selectedUom.value = "Nos";
	selectedItemHasVariants.value = false;
	selectedBarcodeUom.value = "";
	selectedItemUoms.value = [];
	variants.value = [];
	selectedVariants.value = [];
	showVariantSelection.value = false;
	warehouses.value = [];
	error.value = null;
	// Don't reset isReady here - it's managed by the watch
}

function focusSearch() {
	if (searchInputRef.value) {
		searchInputRef.value.focus();
	}
}

async function handleSearchInput() {
	selectedResultIndex.value = -1;
	showSearchResults.value = true;

	if (searchDebounce) {
		clearTimeout(searchDebounce);
	}

	// Start searching after just 1 character for faster autocomplete
	if (searchQuery.value.length < 1) {
		searchResults.value = [];
		searching.value = false;
		return;
	}

	searching.value = true;

	// Shorter debounce for snappier autocomplete (150ms)
	searchDebounce = setTimeout(async () => {
		await performSearch();
	}, 150);
}

async function performSearch() {
	if (searchQuery.value.length < 1) {
		searching.value = false;
		return;
	}

	try {
		const response = await call("pos_next.api.items.get_items", {
			pos_profile: props.posProfile,
			search_term: searchQuery.value,
			start: 0,
			limit: 15, // Show more results for better autocomplete
		});

		searchResults.value = response || [];

		// Auto-select first result for quick enter
		if (searchResults.value.length > 0) {
			selectedResultIndex.value = 0;
		}
	} catch (err) {
		console.error("Error searching items:", err);
		searchResults.value = [];
	} finally {
		searching.value = false;
	}
}

function navigateResults(direction) {
	if (searchResults.value.length === 0) return;

	const newIndex = selectedResultIndex.value + direction;

	if (newIndex >= 0 && newIndex < searchResults.value.length) {
		selectedResultIndex.value = newIndex;

		// Scroll selected item into view
		nextTick(() => {
			const resultElements = document.querySelectorAll('[ref="resultRefs"]');
			if (resultElements[newIndex]) {
				resultElements[newIndex].scrollIntoView({ block: "nearest" });
			}
		});
	}
}

function selectFirstResult() {
	if (searchResults.value.length > 0) {
		const index = selectedResultIndex.value >= 0 ? selectedResultIndex.value : 0;
		selectItem(searchResults.value[index]);
	}
}

async function selectItem(item) {
	// Set loading state before clearing search results
	loading.value = true;
	selectedItemObj.value = item;

	selectedItemCode.value = item.item_code;
	selectedItemName.value = item.item_name;
	selectedItemImage.value = item.image || "";
	selectedUom.value = item.stock_uom || item.uom || "Nos";
	selectedItemHasVariants.value = item.has_variants || false;
	selectedItemUoms.value = item.item_uoms || [];

	// Check if barcode_uoms has a single value different from default UOM
	const barcodeUoms = item.barcode_uoms
		? item.barcode_uoms
				.split(",")
				.map((u) => u.trim())
				.filter((u) => u)
		: [];
	if (barcodeUoms.length === 1 && barcodeUoms[0] !== selectedUom.value) {
		selectedBarcodeUom.value = barcodeUoms[0];
	} else {
		selectedBarcodeUom.value = "";
	}

	searchQuery.value = "";
	searchResults.value = [];
	showSearchResults.value = false;
	selectedResultIndex.value = -1;

	// Check if item has variants
	if (selectedItemHasVariants.value) {
		await loadVariants();
	} else {
		// No variants, directly load availability
		await loadAvailability();
	}
}

function handleEscape() {
	if (showSearchResults.value && searchResults.value.length > 0) {
		// First escape closes dropdown
		showSearchResults.value = false;
	} else if (searchQuery.value) {
		// Second escape clears search
		clearSearch();
	} else {
		// Third escape closes dialog
		closeDialog();
	}
}

function clearSearch() {
	searchQuery.value = "";
	searchResults.value = [];
	selectedResultIndex.value = -1;
	showSearchResults.value = false;
	focusSearch();
}

function clearSelectedItem() {
	selectedItemCode.value = "";
	selectedItemName.value = "";
	selectedItemImage.value = "";
	selectedUom.value = "Nos";
	selectedItemHasVariants.value = false;
	selectedBarcodeUom.value = "";
	selectedItemUoms.value = [];
	variants.value = [];
	selectedVariants.value = [];
	showVariantSelection.value = false;
	warehouses.value = [];
	error.value = null;
	nextTick(() => {
		focusSearch();
	});
}

/**
 * Convert quantity from stock UOM to barcode UOM
 * @param {number} qty - Quantity in stock UOM
 * @returns {number|null} Converted quantity or null if conversion not possible
 */
function convertToBarcodeUom(qty) {
	if (!selectedBarcodeUom.value || !selectedItemUoms.value.length) return null;

	const uomData = selectedItemUoms.value.find((u) => u.uom === selectedBarcodeUom.value);
	if (!uomData || !uomData.conversion_factor) return null;

	// Convert: stock_qty / conversion_factor = barcode_uom_qty
	return qty / uomData.conversion_factor;
}

async function loadVariants() {
	const templateItem = isSearchMode.value ? selectedItemCode.value : props.itemCode;
	if (!templateItem || !props.posProfile) return;

	loadingVariants.value = true;
	variants.value = [];
	selectedVariants.value = [];
	showVariantSelection.value = true;
	error.value = null;

	try {
		const response = await call("pos_next.api.items.get_item_variants", {
			template_item: templateItem,
			pos_profile: props.posProfile,
		});

		variants.value = response || [];

		// If no variants found, load availability for the template item itself
		if (variants.value.length === 0) {
			showVariantSelection.value = false;
			loadAvailability();
		}
	} catch (err) {
		console.error("Error loading variants:", err);
		error.value = err.message || __("Failed to load variants");
		showVariantSelection.value = false;
	} finally {
		loadingVariants.value = false;
	}
}

function toggleVariantSelection(variant) {
	const index = selectedVariants.value.findIndex((v) => v.item_code === variant.item_code);
	if (index >= 0) {
		selectedVariants.value.splice(index, 1);
	} else {
		selectedVariants.value.push(variant);
	}
}

function isVariantSelected(variant) {
	return selectedVariants.value.some((v) => v.item_code === variant.item_code);
}

function confirmVariantSelection() {
	if (selectedVariants.value.length === 0) {
		error.value = __("Please select at least one variant");
		return;
	}
	showVariantSelection.value = false;
	loadAvailability();
}

function selectAllVariants() {
	selectedVariants.value = [...variants.value];
}

function deselectAllVariants() {
	selectedVariants.value = [];
}

async function loadAvailability() {
	const targetItemCode = isSearchMode.value ? selectedItemCode.value : props.itemCode;

	if (!targetItemCode) return;

	loading.value = true;
	error.value = null;
	warehouses.value = [];
	activeQuickWarehouse.value = null;

	try {
		const sortWithProfileWarehouseFirst = (list) => {
			if (! Array.isArray(list)) return [];
			const profileWh = shiftStore.profileWarehouse;
			return [...list].sort((a, b) => {
				if (profileWh) {
					if (a.warehouse === profileWh && b.warehouse !== profileWh) return -1;
					if (b.warehouse === profileWh && a.warehouse !== profileWh) return 1;
				}
				return (b.available_qty || 0) - (a.available_qty || 0);
			});
		};

		// If variants are selected, use item_codes parameter
		if (selectedVariants.value.length > 0) {
			const itemCodes = selectedVariants.value.map((v) => v.item_code);
			const response = await call("pos_next.api.items.get_item_warehouse_availability", {
				item_codes: JSON.stringify(itemCodes),
				company: props.company,
				include_zero_stock: settingsStore.canManageStock ? 1 : 0,
				pos_profile: props.posProfile || shiftStore.currentProfile,
			});
			warehouses.value = sortWithProfileWarehouseFirst(response || []);
		} else {
			// Single item (backward compatible) - include 0-stock for active POS profile warehouse
			const response = await call("pos_next.api.items.get_item_warehouse_availability", {
				item_code: targetItemCode,
				company: props.company,
				include_zero_stock: 1,
				pos_profile: props.posProfile || shiftStore.currentProfile,
			});
			warehouses.value = sortWithProfileWarehouseFirst(response || []);
		}
	} catch (err) {
		console.error("Error loading warehouse availability:", err);
		error.value = err.message || __("Failed to load warehouse availability");
	} finally {
		loading.value = false;
	}
}

function sellFromWarehouse(w) {
	const targetCode = w.item_code || selectedItemCode.value || props.itemCode;
	const catalogItem =
		(selectedItemObj.value && selectedItemObj.value.item_code === targetCode
			? selectedItemObj.value
			: null) ||
		itemSearchStore.allItems?.find((i) => i.item_code === targetCode) ||
		itemSearchStore.searchResults?.find((i) => i.item_code === targetCode) ||
		selectedItemObj.value;

	const itemToSell = {
		...(catalogItem || {
			item_code: targetCode,
			item_name: displayItemName.value,
			image: selectedItemImage.value,
			uom: w.item_code ? getVariantUom(w.item_code) : displayUom.value,
			stock_uom: w.item_code ? getVariantUom(w.item_code) : displayUom.value,
			item_uoms: selectedItemUoms.value,
			rate: w.rate || 0,
			price_list_rate: w.rate || 0,
		}),
		warehouse: w.warehouse || w.name,
		actual_qty: w.actual_qty ?? w.available_qty ?? 0,
	};

	try {
		cartStore.addItem(itemToSell, 1, true, shiftStore.currentProfile);
		closeDialog();
	} catch (error) {
		console.error("Error adding item to cart from warehouse:", error);
		showError(error.message || __("No se pudo agregar el producto al carrito"));
	}
}

/**
 * Propagate fresh Bin quantities to local dialog cards, Pinia stockStore, and IndexedDB worker
 */
function applyStockBinUpdates(updatedBins) {
	if (!Array.isArray(updatedBins) || updatedBins.length === 0) return;

	// 1. Update local warehouse cards if currently viewing an item
	for (const bin of updatedBins) {
		const match = warehouses.value.find(
			(w) =>
				w.warehouse === bin.warehouse &&
				(!w.item_code || !bin.item_code || w.item_code === bin.item_code)
		);
		if (match) {
			match.actual_qty = bin.actual_qty;
			match.reserved_qty = bin.reserved_qty;
			match.available_qty = bin.available_qty;
		}
	}

	// 2. Update POS stockStore, itemSearchStore, and offlineWorker for items in their effective warehouse
	const profileWh = shiftStore.profileWarehouse;
	const findItemEffectiveWh = (code) => {
		const found =
			itemSearchStore.allItems?.find((i) => i.item_code === code) ||
			itemSearchStore.searchResults?.find((i) => i.item_code === code);
		return found?.warehouse || profileWh;
	};
	const stockUpdates = updatedBins
		.filter((b) => {
			const itemWh = findItemEffectiveWh(b.item_code);
			return !itemWh || b.warehouse === itemWh || updatedBins.length === 1;
		})
		.map((b) => ({
			item_code: b.item_code,
			actual_qty: b.actual_qty,
			available_qty: b.available_qty,
		}));

	if (stockUpdates.length > 0) {
		stockStore.update(stockUpdates);
		offlineWorker.updateStockQuantities(stockUpdates);
		const updateItemArrQty = (arr) => {
			if (!Array.isArray(arr)) return;
			for (const upd of stockUpdates) {
				const target = arr.find((i) => i.item_code === upd.item_code);
				if (target) {
					target.actual_qty = upd.actual_qty;
					target.stock_qty = upd.actual_qty;
				}
			}
		};
		updateItemArrQty(itemSearchStore.allItems);
		updateItemArrQty(itemSearchStore.searchResults);
	}

	// 3. If other warehouse stock changed while viewing a single item, update other_qty on item cards
	const currentItemCode = isSearchMode.value ? selectedItemCode.value : props.itemCode;
	const currentItemWh = currentItemCode ? findItemEffectiveWh(currentItemCode) : profileWh;
	if (currentItemCode && warehouses.value.length > 0 && currentItemWh) {
		const otherTotal = warehouses.value
			.filter((w) => w.warehouse !== currentItemWh && (!w.item_code || w.item_code === currentItemCode))
			.reduce((sum, w) => sum + (Number(w.actual_qty) || 0), 0);

		const updateListOtherQty = (arr) => {
			if (!Array.isArray(arr)) return;
			const target = arr.find((i) => i.item_code === currentItemCode);
			if (target) {
				target.other_qty = otherTotal;
			}
		};
		updateListOtherQty(itemSearchStore.allItems);
		updateListOtherQty(itemSearchStore.searchResults);
		itemSearchStore.invalidateCache();
	}

	// 4. Refresh inventory overview table in background so numbers stay 100% live
	if (isSearchMode.value) {
		loadInventoryReport();
	}
}

/**
 * Switch top navigation tabs in Search/Inventory Management mode
 */
async function switchTab(tab) {
	activeTab.value = tab;
	if (tab === "batch_entry") {
		await loadCompanyWarehouses();
	} else if (tab === "history") {
		await loadStockEntriesHistory();
	} else if (tab === "catalog") {
		if (!itemSearchStore.allItems || itemSearchStore.allItems.length === 0) {
			await itemSearchStore.loadAllItems(props.posProfile || shiftStore.profileName);
		}
	} else if (tab === "lookup") {
		await nextTick();
		if (!selectedItemCode.value) {
			focusSearch();
		}
	}
}

// ============================================================================
// CURRENT INVENTORY OVERVIEW & PDF EXPORT
// ============================================================================
const loadingInventoryReport = ref(false);
const inventoryReportItems = ref([]);
const inventoryWarehouses = ref([]);
const inventoryGroups = ref([]);
const inventoryCompany = ref("");
const inventoryDefaultThreshold = ref(10);

const invWarehouseFilter = ref("");
const invGroupFilter = ref("");
const invStatusFilter = ref("");
const showCostPrice = ref(false); // Unchecked by default for privacy

function cleanWarehouseName(name) {
	return (name || "").replace(/\s*-\s*[A-Z0-9]+$/i, "");
}

async function loadInventoryReport() {
	const activeProfile = props.posProfile || shiftStore.profileName;
	if (!activeProfile) return;
	loadingInventoryReport.value = true;
	try {
		const res = await call("pos_next.api.items.get_pos_inventory_report", {
			pos_profile: activeProfile,
		});
		const data = res?.message || res || {};
		inventoryReportItems.value = Array.isArray(data.items) ? data.items : [];
		inventoryWarehouses.value = Array.isArray(data.warehouses) ? data.warehouses : [];
		inventoryGroups.value = Array.isArray(data.item_groups) ? data.item_groups : [];
		inventoryCompany.value = data.company || props.company || "Muebles Ruffino";
		inventoryDefaultThreshold.value =
			Number(data.default_low_stock_threshold) || settingsStore.lowStockThreshold || 10;
	} catch (err) {
		console.error("Error loading inventory report:", err);
	} finally {
		loadingInventoryReport.value = false;
	}
}

const enrichedInventoryRows = computed(() => {
	const whFilter = invWarehouseFilter.value;
	const selectedWhObj = whFilter
		? inventoryWarehouses.value.find((w) => w.warehouse === whFilter)
		: null;
	const fallbackThreshold =
		settingsStore.lowStockThreshold || inventoryDefaultThreshold.value || 10;

	return (inventoryReportItems.value || []).map((it) => {
		const displayQty = whFilter
			? Number(it.by_warehouse?.[whFilter] ?? 0)
			: Number(it.actual_qty ?? 0);
		const displayWhName = whFilter
			? selectedWhObj?.warehouse_name || whFilter
			: it.warehouse_name || it.warehouse || "";
		const threshold =
			Number(it.safety_stock) > 0 ? Number(it.safety_stock) : fallbackThreshold;

		let stockLevel = "safe";
		if (displayQty <= 0) {
			stockLevel = "out";
		} else if (displayQty <= threshold) {
			stockLevel = "low";
		}

		return {
			...it,
			display_qty: displayQty,
			display_warehouse_name: displayWhName,
			effective_threshold: threshold,
			stock_level: stockLevel,
		};
	});
});

const filteredInventoryItems = computed(() => {
	const q = (searchQuery.value || "").trim().toLowerCase();
	const grpFilter = invGroupFilter.value;
	const statusFilter = invStatusFilter.value;

	return enrichedInventoryRows.value.filter((row) => {
		if (grpFilter && row.item_group !== grpFilter) return false;
		if (statusFilter && row.stock_level !== statusFilter) return false;
		if (q) {
			const match =
				(row.item_name || "").toLowerCase().includes(q) ||
				(row.item_code || "").toLowerCase().includes(q) ||
				(row.item_group || "").toLowerCase().includes(q) ||
				(row.custom_medida || "").toLowerCase().includes(q);
			if (!match) return false;
		}
		return true;
	});
});

const inventorySummary = computed(() => {
	let totalUnits = 0;
	let lowStockCount = 0;
	let outOfStockCount = 0;
	let totalCostValue = 0;
	let totalSellingValue = 0;

	// Count status KPIs across warehouse + group + search (so clicking Low/Out chips shows accurate counts)
	const q = (searchQuery.value || "").trim().toLowerCase();
	const grpFilter = invGroupFilter.value;
	for (const row of enrichedInventoryRows.value) {
		if (grpFilter && row.item_group !== grpFilter) continue;
		if (q) {
			const match =
				(row.item_name || "").toLowerCase().includes(q) ||
				(row.item_code || "").toLowerCase().includes(q) ||
				(row.item_group || "").toLowerCase().includes(q) ||
				(row.custom_medida || "").toLowerCase().includes(q);
			if (!match) continue;
		}
		if (row.stock_level === "low") lowStockCount++;
		if (row.stock_level === "out") outOfStockCount++;
	}

	for (const row of filteredInventoryItems.value) {
		const posQty = Math.max(0, Math.floor(row.display_qty || 0));
		totalUnits += Math.floor(row.display_qty || 0);
		totalCostValue += posQty * Number(row.cost_rate || 0);
		totalSellingValue += posQty * Number(row.selling_rate || 0);
	}

	return {
		totalUnits,
		lowStockCount,
		outOfStockCount,
		totalCostValue,
		totalSellingValue,
	};
});

function exportInventoryPDF() {
	const rows = filteredInventoryItems.value;
	if (!rows.length) return;

	const includeCost = Boolean(showCostPrice.value);
	const companyTitle = inventoryCompany.value || props.company || "Muebles Ruffino";
	const nowStr = new Date().toLocaleString("es-BO", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
	const whLabel = invWarehouseFilter.value
		? cleanWarehouseName(
				inventoryWarehouses.value.find((w) => w.warehouse === invWarehouseFilter.value)
					?.warehouse_name || invWarehouseFilter.value
		  )
		: "Todos los Almacenes (Almacén Asignado)";
	const grpLabel = invGroupFilter.value || "Todas las Categorías";
	const statusMap = {
		"": "Todos los Estados",
		safe: "En Stock Óptimo",
		low: "Stock Bajo (Amarillo)",
		out: "Sin Stock / Agotados",
	};
	const statusLabel = statusMap[invStatusFilter.value] || "Todos";

	const escapeHtml = (str) =>
		String(str ?? "")
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;");

	const tableRowsHtml = rows
		.map((r, idx) => {
			const qty = Math.floor(r.display_qty || 0);
			const statusBadge =
				r.stock_level === "out"
					? '<span style="color:#b91c1c;font-weight:700;">AGOTADO</span>'
					: r.stock_level === "low"
					? '<span style="color:#b45309;font-weight:700;">BAJO</span>'
					: '<span style="color:#15803d;font-weight:700;">OK</span>';

			return `
				<tr>
					<td style="text-align:center;color:#64748b;">${idx + 1}</td>
					<td style="font-family:monospace;font-size:10px;">${escapeHtml(r.item_code)}</td>
					<td>
						<strong>${escapeHtml(r.item_name)}</strong>
						${r.custom_medida ? `<span style="color:#475569;font-size:10px;"> (${escapeHtml(r.custom_medida)})</span>` : ""}
					</td>
					<td>${escapeHtml(r.item_group)}</td>
					<td>${escapeHtml(cleanWarehouseName(r.display_warehouse_name))}</td>
					${
						includeCost
							? `<td style="text-align:right;">Bs. ${Number(r.cost_rate || 0).toFixed(2)}</td>`
							: ""
					}
					<td style="text-align:right;font-weight:600;">Bs. ${Number(r.selling_rate || 0).toFixed(2)}</td>
					<td style="text-align:center;font-weight:800;font-size:12px;">${qty}</td>
					<td style="text-align:center;font-size:10px;">${statusBadge}</td>
					<td style="text-align:center;color:#94a3b8;">________</td>
				</tr>
			`;
		})
		.join("");

	const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
	<meta charset="UTF-8" />
	<title>Reporte de Inventario Actual - ${escapeHtml(companyTitle)}</title>
	<style>
		@page { size: letter portrait; margin: 12mm; }
		body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; font-size: 11px; margin: 0; padding: 0; }
		.header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1e293b; padding-bottom: 10px; margin-bottom: 12px; }
		.title { font-size: 18px; font-weight: 800; margin: 0; color: #0f172a; }
		.subtitle { font-size: 12px; font-weight: 600; color: #334155; margin: 3px 0 0 0; }
		.meta { text-align: right; font-size: 10px; color: #475569; line-height: 1.4; }
		.filters-bar { display: flex; flex-wrap: wrap; gap: 16px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; margin-bottom: 12px; font-size: 10.5px; }
		table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
		th { background: #1e293b; color: #ffffff; font-size: 10px; text-transform: uppercase; padding: 6px 6px; text-align: left; border: 1px solid #1e293b; }
		td { padding: 5px 6px; border: 1px solid #cbd5e1; vertical-align: middle; }
		tr:nth-child(even) td { background: #f8fafc; }
		.summary-box { display: flex; justify-content: space-between; align-items: center; background: #f1f5f9; border: 1px solid #94a3b8; border-radius: 6px; padding: 10px 14px; font-size: 11.5px; }
		.signatures { display: flex; justify-content: space-around; margin-top: 38px; text-align: center; font-size: 11px; color: #334155; }
		.sig-line { width: 200px; border-top: 1px solid #334155; padding-top: 5px; }
	</style>
</head>
<body>
	<div class="header">
		<div>
			<h1 class="title">${escapeHtml(companyTitle)}</h1>
			<p class="subtitle">REPORTE DE INVENTARIO ACTUAL Y VERIFICACIÓN FÍSICA</p>
		</div>
		<div class="meta">
			<div><strong>Fecha y Hora:</strong> ${escapeHtml(nowStr)}</div>
			<div><strong>Punto de Venta:</strong> ${escapeHtml(props.posProfile || shiftStore.profileName || "")}</div>
		</div>
	</div>

	<div class="filters-bar">
		<div><strong>Almacén:</strong> ${escapeHtml(whLabel)}</div>
		<div><strong>Categoría:</strong> ${escapeHtml(grpLabel)}</div>
		<div><strong>Estado:</strong> ${escapeHtml(statusLabel)}</div>
		<div><strong>Productos Listados:</strong> ${rows.length}</div>
		<div><strong>Total Unidades:</strong> ${inventorySummary.value.totalUnits} uds</div>
	</div>

	<table>
		<thead>
			<tr>
				<th style="width:26px;text-align:center;">#</th>
				<th style="width:85px;">Código</th>
				<th>Producto / Medida</th>
				<th style="width:110px;">Categoría</th>
				<th style="width:110px;">Almacén</th>
				${includeCost ? '<th style="width:78px;text-align:right;">Costo Fáb.</th>' : ""}
				<th style="width:78px;text-align:right;">Precio Venta</th>
				<th style="width:58px;text-align:center;">Cantidad</th>
				<th style="width:54px;text-align:center;">Estado</th>
				<th style="width:68px;text-align:center;">Físico</th>
			</tr>
		</thead>
		<tbody>
			${tableRowsHtml}
		</tbody>
	</table>

	<div class="summary-box">
		<div>
			<strong>Total Productos:</strong> ${rows.length} &nbsp;|&nbsp;
			<strong>Total Unidades en Stock:</strong> ${inventorySummary.value.totalUnits} uds
		</div>
		<div>
			${
				includeCost
					? `<strong>Valor Total (Costo Fábrica):</strong> Bs. ${inventorySummary.value.totalCostValue.toFixed(2)} &nbsp;|&nbsp; `
					: ""
			}
			<strong>Valor Total (Precio Venta):</strong> Bs. ${inventorySummary.value.totalSellingValue.toFixed(2)}
		</div>
	</div>

	<div class="signatures">
		<div class="sig-line">Responsable de Almacén / Fábrica</div>
		<div class="sig-line">Verificado por Administración</div>
	</div>
</body>
</html>`;

	const printWin = window.open("", "_blank", "width=960,height=760");
	if (!printWin) {
		showError("Por favor permita las ventanas emergentes para exportar el PDF.");
		return;
	}
	printWin.document.open();
	printWin.document.write(htmlContent);
	printWin.document.close();
	printWin.focus();
	setTimeout(() => {
		printWin.print();
	}, 250);
}

// ============================================================================
// PRODUCT CATALOG (CREATE / EDIT) INSIDE INVENTORY DIALOG
// ============================================================================
const catalogSearchQuery = ref("");
const showItemQuickForm = ref(false);
const editingCatalogItemCode = ref("");

const filteredCatalogItems = computed(() => {
	const list = itemSearchStore.allItems || [];
	const q = (catalogSearchQuery.value || "").trim().toLowerCase();
	if (!q) return list;
	return list.filter(
		(it) =>
			(it.item_name || "").toLowerCase().includes(q) ||
			(it.item_code || "").toLowerCase().includes(q) ||
			(it.item_group || "").toLowerCase().includes(q) ||
			(it.custom_medida || "").toLowerCase().includes(q)
	);
});

function openCreateItemModal() {
	editingCatalogItemCode.value = "";
	showItemQuickForm.value = true;
}

function openEditItemModal(code) {
	if (!code) return;
	editingCatalogItemCode.value = code;
	showItemQuickForm.value = true;
}

async function handleCatalogItemSaved({ item }) {
	const activeProfile = props.posProfile || shiftStore.profileName;
	await itemSearchStore.upsertCatalogItem(item, activeProfile);
	loadInventoryReport();

	// Also sync any matching line already in the current cart
	if (item && Array.isArray(cartStore.items)) {
		for (const cartRow of cartStore.items) {
			if (cartRow.item_code === item.item_code) {
				cartRow.item_name = item.item_name || cartRow.item_name;
				if (item.image) {
					cartRow.image = item.image;
				}
				if (Number(item.rate) > 0) {
					cartRow.rate = Number(item.rate);
					cartRow.price_list_rate = Number(item.price_list_rate || item.rate);
					cartRow.amount = Number(cartRow.qty || 1) * Number(item.rate);
				}
			}
		}
	}

	if ((selectedItemCode.value || props.itemCode) && item?.item_code === (selectedItemCode.value || props.itemCode)) {
		selectedItemName.value = item.item_name;
		if (item.image) {
			selectedItemImage.value = item.image;
		}
		await loadAvailability();
	}
}

/**
 * Toggle inline quick stock entry/adjustment form for a specific warehouse card
 */
function toggleQuickStockForm(warehouse, mode = "add") {
	if (activeQuickWarehouse.value === warehouse.warehouse && quickEntryMode.value === mode) {
		activeQuickWarehouse.value = null;
		return;
	}
	activeQuickWarehouse.value = warehouse.warehouse;
	quickEntryMode.value = mode;
	quickQty.value = 1;
	quickRemarks.value = "";
}

/**
 * Submit quick single-item stock entry or stock deduction
 */
async function submitQuickStockEntry(warehouse) {
	const targetItemCode =
		warehouse.item_code || (isSearchMode.value ? selectedItemCode.value : props.itemCode);
	if (!targetItemCode || !warehouse.warehouse) return;

	const qtyVal = Number(quickQty.value);
	if (isNaN(qtyVal) || qtyVal <= 0) {
		showError("Por favor ingrese una cantidad mayor a cero.");
		return;
	}
	if (quickEntryMode.value === "subtract" && qtyVal > Number(warehouse.actual_qty || 0)) {
		showError(`No puede descontar más de las ${Math.floor(warehouse.actual_qty || 0)} unidades disponibles.`);
		return;
	}

	submittingStock.value = true;
	try {
		const res = await call("pos_next.api.items.create_pos_stock_entry", {
			pos_profile: props.posProfile || shiftStore.profileName,
			warehouse: warehouse.warehouse,
			entry_mode: quickEntryMode.value,
			remarks: quickRemarks.value || "",
			items: JSON.stringify([
				{
					item_code: targetItemCode,
					qty: qtyVal,
				},
			]),
		});

		if (res?.updated_bins) {
			applyStockBinUpdates(res.updated_bins);
		} else {
			await loadAvailability();
		}

		showSuccess(res?.message || "Inventario actualizado correctamente.");
		activeQuickWarehouse.value = null;
		quickQty.value = null;
		quickRemarks.value = "";
	} catch (err) {
		console.error("Error creating stock entry:", err);
		showError(err?.message || "No se pudo actualizar el inventario.");
	} finally {
		submittingStock.value = false;
	}
}

/**
 * Load active company warehouses for Batch Receipt selector
 */
async function loadCompanyWarehouses() {
	if (availableCompanyWarehouses.value.length > 0) {
		if (!batchWarehouse.value) {
			batchWarehouse.value =
				shiftStore.profileWarehouse || availableCompanyWarehouses.value[0]?.warehouse || "";
		}
		return;
	}
	try {
		const targetItem = selectedItemCode.value || props.itemCode || "__ALL__";
		const res = await call("pos_next.api.items.get_item_warehouse_availability", {
			item_code: targetItem,
			company: props.company,
			include_zero_stock: 1,
		});
		const list = Array.isArray(res) ? res : [];
		const profileWh = shiftStore.profileWarehouse;
		list.sort((a, b) => {
			if (profileWh) {
				if (a.warehouse === profileWh && b.warehouse !== profileWh) return -1;
				if (b.warehouse === profileWh && a.warehouse !== profileWh) return 1;
			}
			return (a.warehouse_name || a.warehouse).localeCompare(b.warehouse_name || b.warehouse);
		});
		availableCompanyWarehouses.value = list;
		if (!batchWarehouse.value) {
			batchWarehouse.value = profileWh || list[0]?.warehouse || "";
		}
	} catch (err) {
		console.error("Error loading company warehouses:", err);
	}
}

/**
 * Autocomplete search for adding items to a batch receipt
 */
function handleBatchSearchInput() {
	if (batchSearchDebounce) {
		clearTimeout(batchSearchDebounce);
	}
	if (!batchSearchQuery.value || batchSearchQuery.value.trim().length < 1) {
		batchSearchResults.value = [];
		return;
	}
	batchSearchDebounce = setTimeout(async () => {
		try {
			const res = await call("pos_next.api.items.get_items", {
				pos_profile: props.posProfile || shiftStore.profileName,
				search_term: batchSearchQuery.value.trim(),
				start: 0,
				limit: 12,
			});
			batchSearchResults.value = (res || []).filter((i) => !i.has_variants);
		} catch (err) {
			console.error("Error searching batch items:", err);
			batchSearchResults.value = [];
		}
	}, 150);
}

function selectFirstBatchResult() {
	if (batchSearchResults.value.length > 0) {
		addBatchItem(batchSearchResults.value[0]);
	}
}

function addBatchItem(item) {
	if (!item || !item.item_code) return;
	const existing = batchItems.value.find((i) => i.item_code === item.item_code);
	if (existing) {
		existing.qty = Number(existing.qty || 0) + 1;
	} else {
		batchItems.value.push({
			item_code: item.item_code,
			item_name: item.item_name || item.item_code,
			image: item.image || "",
			uom: item.stock_uom || item.uom || "Nos",
			actual_qty: item.actual_qty ?? 0,
			qty: 1,
		});
	}
	batchSearchQuery.value = "";
	batchSearchResults.value = [];
}

/**
 * Submit multi-item merchandise/production receipt
 */
async function submitBatchStockEntry() {
	if (!batchWarehouse.value) {
		showError("Seleccione el almacén de destino.");
		return;
	}
	const validItems = batchItems.value.filter((i) => Number(i.qty) > 0);
	if (validItems.length === 0) {
		showError("Agregue al menos un producto con cantidad mayor a 0.");
		return;
	}

	submittingStock.value = true;
	try {
		const res = await call("pos_next.api.items.create_pos_stock_entry", {
			pos_profile: props.posProfile || shiftStore.profileName,
			warehouse: batchWarehouse.value,
			entry_mode: "add",
			remarks: batchRemarks.value || "Ingreso de mercadería / producción desde POS",
			items: JSON.stringify(
				validItems.map((i) => ({
					item_code: i.item_code,
					qty: Number(i.qty),
				}))
			),
		});

		if (res?.updated_bins) {
			applyStockBinUpdates(res.updated_bins);
		}

		showSuccess(res?.message || "Ingreso de mercadería registrado exitosamente.");
		batchItems.value = [];
		batchRemarks.value = "";
		await switchTab("history");
	} catch (err) {
		console.error("Error submitting batch stock entry:", err);
		showError(err?.message || "No se pudo registrar el ingreso de mercadería.");
	} finally {
		submittingStock.value = false;
	}
}

/**
 * Load recent Stock Entries for the History & Cancellation tab
 */
async function loadStockEntriesHistory() {
	loadingHistory.value = true;
	cancellingEntryName.value = null;
	cancelReason.value = "";
	try {
		const res = await call("pos_next.api.items.get_pos_stock_entries", {
			pos_profile: props.posProfile || shiftStore.profileName,
			limit: 30,
		});
		stockEntriesHistory.value = Array.isArray(res) ? res : [];
	} catch (err) {
		console.error("Error loading stock entries history:", err);
		showError("Error al cargar el historial de movimientos de inventario.");
	} finally {
		loadingHistory.value = false;
	}
}

/**
 * Cancel a submitted Stock Entry with mandatory reason
 */
async function confirmCancelStockEntry(entry) {
	if (!entry?.name) return;
	if (!cancelReason.value || !cancelReason.value.trim()) {
		showError("Debe ingresar el motivo de la anulación.");
		return;
	}

	submittingStock.value = true;
	try {
		const res = await call("pos_next.api.items.cancel_pos_stock_entry", {
			stock_entry_name: entry.name,
			reason: cancelReason.value.trim(),
			pos_profile: props.posProfile || shiftStore.profileName,
		});

		if (res?.updated_bins) {
			applyStockBinUpdates(res.updated_bins);
		}

		showSuccess(res?.message || `Movimiento ${entry.name} anulado correctamente.`);
		cancellingEntryName.value = null;
		cancelReason.value = "";
		await loadStockEntriesHistory();
	} catch (err) {
		console.error("Error cancelling stock entry:", err);
		showError(err?.message || "No se pudo anular el movimiento de inventario.");
	} finally {
		submittingStock.value = false;
	}
}

/**
 * Highlight matching text in search results
 * @param {string} text - Text to search in
 * @param {string} query - Search query to highlight
 * @returns {string} HTML with highlighted matches
 */
function highlightMatch(text, query) {
	if (!text || !query) return text;

	const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const regex = new RegExp(`(${escapedQuery})`, "gi");
	return text.replace(
		regex,
		'<mark class="bg-yellow-200 text-yellow-900 rounded px-0.5">$1</mark>'
	);
}

/**
 * Format price with locale-aware formatting
 * @param {number} price - Price value
 * @returns {string} Formatted price
 */
function formatPrice(price) {
	if (!price) return "";
	const num = Number(price);
	if (isNaN(num)) return "";
	return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
</script>

<style scoped>
/* RTL Support for Search Input */
.stock-search-input {
	text-align: start;
}

/* RTL mode - Right align text and placeholder */
:global([dir="rtl"]) .stock-search-input,
:global(.rtl) .stock-search-input {
	text-align: right;
	direction: rtl;
}

:global([dir="rtl"]) .stock-search-input::placeholder,
:global(.rtl) .stock-search-input::placeholder {
	text-align: right;
	direction: rtl;
}
</style>
