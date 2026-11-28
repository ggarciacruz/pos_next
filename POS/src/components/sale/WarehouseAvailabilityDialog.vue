<template>
	<MdxModal
		v-model="show"
		:size="isSearchMode ? 'full' : '3xl'"
		:noPadding="true"
	>
		<!-- Standardized Corporate Modal Header -->
		<template #header>
			<div class="flex items-center gap-3 min-w-0">
				<div class="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
					</svg>
				</div>
				<div class="min-w-0 text-start">
					<h2 class="text-sm sm:text-base font-bold text-slate-900 truncate leading-tight">
						{{
							isSearchMode && (settingsStore.canManageStock || settingsStore.canManageItems)
								? __("Gestión de Productos e Inventario")
								: __("Disponibilidad y Stock")
						}}
					</h2>
					<p class="text-xs text-slate-500 truncate mt-0.5">
						{{ __("Catálogo de productos, precios y existencias por almacén") }}
					</p>
				</div>
			</div>

			<div class="flex items-center gap-2 shrink-0">
				<MdxButton
					variant="secondary"
					size="sm"
					:loading="isRefreshingDialog"
					@click="refreshActiveView"
				>
					<span class="inline-flex items-center gap-1.5">
						<svg
							v-if="!isRefreshingDialog"
							class="w-3.5 h-3.5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							stroke-width="2"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
							/>
						</svg>
						<span>{{ __("Actualizar") }}</span>
					</span>
				</MdxButton>

				<button
					type="button"
					@click="closeDialog"
					class="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors shrink-0 cursor-pointer"
					:title="__('Cerrar')"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
		</template>

		<!-- Body Content (Pinned Toolbar + Scrollable Slate Canvas) -->
		<div class="flex-1 min-h-0 flex flex-col bg-slate-50/50">
			<!-- Pinned White Toolbar (Tabs & Contextual Controls) -->
			<div
				v-if="isReady && isSearchMode && (settingsStore.canManageStock || settingsStore.canManageItems)"
				class="shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
			>
				<div class="w-full lg:w-auto min-w-0">
					<MdxSegmentedControl
						:modelValue="activeTab"
						@update:modelValue="switchTab"
						:options="inventoryTabOptions"
						size="sm"
						:full-width="false"
						:scrollable="true"
					/>
				</div>

				<!-- Contextual Actions: Lookup Overview -->
				<div
					v-if="activeTab === 'lookup' && !selectedItemCode && !showVariantSelection"
					class="flex flex-wrap items-center gap-2 w-full lg:w-auto lg:justify-end"
				>
					<button
						type="button"
						@click="invStatusFilter = ''"
						class="h-8 px-2.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer whitespace-nowrap"
						:class="
							invStatusFilter === ''
								? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
								: 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
						"
					>
						{{ __("Todos") }} ({{ filteredInventoryItems.length }})
					</button>
					<button
						type="button"
						@click="invStatusFilter = invStatusFilter === 'low' ? '' : 'low'"
						class="h-8 px-2.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer whitespace-nowrap"
						:class="
							invStatusFilter === 'low'
								? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
								: 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
						"
					>
						{{ __("Stock Bajo") }} ({{ inventorySummary.lowStockCount }})
					</button>
					<button
						type="button"
						@click="invStatusFilter = invStatusFilter === 'out' ? '' : 'out'"
						class="h-8 px-2.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer whitespace-nowrap"
						:class="
							invStatusFilter === 'out'
								? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
								: 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
						"
					>
						{{ __("Sin Stock") }} ({{ inventorySummary.outOfStockCount }})
					</button>

					<label
						v-if="canViewCostPrice"
						class="h-8 inline-flex items-center gap-1.5 px-2.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 cursor-pointer select-none"
					>
						<input
							v-model="showCostPrice"
							type="checkbox"
							class="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
						/>
						<span class="text-xs font-semibold text-slate-700 whitespace-nowrap">
							<span class="sm:hidden">{{ __("Costo") }}</span>
							<span class="hidden sm:inline">{{ __("Mostrar Costo Fábrica") }}</span>
						</span>
					</label>

					<MdxButton
						variant="secondary"
						size="sm"
						:disabled="filteredInventoryItems.length === 0"
						@click="exportInventoryPDF"
					>
						<span class="inline-flex items-center gap-1.5">
							<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
							</svg>
							<span>{{ __("Exportar PDF") }}</span>
						</span>
					</MdxButton>
				</div>

				<!-- Contextual Actions: Product Catalog -->
				<div
					v-else-if="activeTab === 'catalog' && settingsStore.canManageItems"
					class="flex items-center gap-2 lg:justify-end"
				>
					<MdxButton
						variant="primary"
						size="sm"
						@click="openCreateItemModal"
					>
						+ {{ __("Crear Nuevo Producto") }}
					</MdxButton>
				</div>
			</div>

			<!-- Scrollable Body Canvas -->
			<div class="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 flex flex-col pos-wh-canvas">
				<!-- Initial Dialog Loading Gate -->
				<div
					v-if="!isReady && loading"
					class="flex-1 flex flex-col items-center justify-center py-12"
				>
					<div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
					<p class="mt-3 text-xs font-medium text-slate-500">
						{{ __("Loading stock information...") }}
					</p>
				</div>

				<template v-else>
					<!-- ============================================================ -->
					<!-- TAB 1: INVENTARIO / STOCK                                    -->
					<!-- ============================================================ -->
					<div v-if="!isSearchMode || activeTab === 'lookup'" class="flex-1 flex flex-col gap-3">
						<!-- Single Consolidated Product Context Card (When viewing an item or in item mode) -->
						<div
							v-if="!isSearchMode || selectedItemCode"
							class="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-2xs relative text-start"
						>
							<div class="flex items-center gap-3 min-w-0 flex-1">
								<MdxButton
									v-if="isSearchMode && selectedItemCode"
									variant="secondary"
									size="sm"
									@click="clearSelectedItem"
								>
									<span class="inline-flex items-center gap-1.5">
										<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2">
											<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
										</svg>
										<span>{{ __("Volver al Inventario") }}</span>
									</span>
								</MdxButton>

								<div class="w-10 h-10 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
									<img
										v-if="selectedItemImage"
										:src="selectedItemImage"
										:alt="displayItemName"
										class="w-full h-full object-cover"
									/>
									<svg v-else class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8">
										<path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
									</svg>
								</div>

								<div class="min-w-0 flex-1">
									<h3 class="text-sm sm:text-base font-extrabold text-slate-900 truncate leading-snug">
										{{ displayItemName }}
									</h3>
									<p class="text-xs text-slate-500 truncate mt-0.5">
										<span class="font-mono font-semibold text-slate-600">{{ selectedItemCode || itemCode }}</span>
										<template v-if="selectedItemObj?.custom_medida"> · {{ selectedItemObj.custom_medida }}</template>
										<template v-if="selectedItemObj?.item_group"> · {{ selectedItemObj.item_group }}</template>
									</p>
								</div>
							</div>

							<div class="flex flex-wrap items-center gap-2 shrink-0">
								<!-- Quick Item Switcher (Search Mode) -->
								<div v-if="isSearchMode" class="relative w-full sm:w-64 lg:w-72 dialog-variant-search">
									<MdxSearchInput
										v-model="searchQuery"
										:placeholder="__('Cambiar de artículo...')"
										:debounce="120"
										:enable-shortcut-listener="false"
										:shortcut-key="''"
										@update:modelValue="handleSearchInput"
										@search="selectFirstResult"
										@clear="clearSearch"
									/>

									<!-- Quick Autocomplete Dropdown -->
									<div
										v-if="showSearchResults && (searchResults.length > 0 || (searchQuery.length >= 1 && !searching))"
										class="absolute start-0 end-0 z-30 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-72 overflow-y-auto"
									>
										<div v-if="searchResults.length > 0">
											<button
												v-for="(item, index) in searchResults"
												:key="item.item_code"
												type="button"
												@click="selectItem(item)"
												@mouseenter="selectedResultIndex = index"
												class="w-full text-start px-3.5 py-2.5 flex items-center gap-3 border-b border-slate-100 last:border-0 transition-colors cursor-pointer"
												:class="selectedResultIndex === index ? 'bg-slate-50' : 'hover:bg-slate-50'"
											>
												<div class="flex-1 min-w-0">
													<p class="text-xs font-bold text-slate-900 truncate">{{ item.item_name }}</p>
													<p class="text-[11px] text-slate-500 font-mono truncate">{{ item.item_code }}</p>
												</div>
												<MdxBadge :variant="(item.actual_qty || 0) > 0 ? 'success' : 'danger'" size="sm">
													{{ Math.floor(item.actual_qty || 0) }} {{ item.stock_uom || __("Nos") }}
												</MdxBadge>
											</button>
										</div>
										<div v-else class="px-4 py-5 text-center text-xs text-slate-500">
											{{ __('No items found for "{0}"', [searchQuery]) }}
										</div>
									</div>
								</div>

								<MdxButton
									v-if="settingsStore.canManageItems && (selectedItemCode || itemCode)"
									variant="secondary"
									size="sm"
									@click="openEditItemModal(isSearchMode ? selectedItemCode : itemCode)"
								>
									<span class="inline-flex items-center gap-1.5">
										<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
											<path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
										</svg>
										<span>{{ __("Editar Producto") }}</span>
									</span>
								</MdxButton>
							</div>
						</div>

						<!-- Variant Selection Panel (For Template Items) -->
						<div
							v-if="showVariantSelection"
							class="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 shadow-2xs"
						>
							<div class="flex flex-wrap items-center justify-between gap-2">
								<div v-if="variants.length > 4" class="flex-1 min-w-[200px] dialog-variant-search">
									<MdxSearchInput
										v-model="variantDialogSearch"
										:placeholder="__('Buscar variante o código...')"
										:debounce="80"
										:enable-shortcut-listener="false"
										:shortcut-key="''"
									/>
								</div>
								<div v-else class="text-start">
									<h4 class="text-xs sm:text-sm font-bold text-slate-900">
										{{ __("Variantes / Colores") }}
										<span class="font-medium text-slate-500">
											({{ inStockDialogVariantsCount }}/{{ variants.length }} {{ __("con stock") }})
										</span>
									</h4>
								</div>

								<div class="flex items-center flex-wrap gap-1.5">
									<div class="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
										<button
											type="button"
											@click="variantDialogFilter = 'all'"
											class="px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
											:class="variantDialogFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'"
										>
											{{ __("Todas") }} ({{ variants.length }})
										</button>
										<button
											type="button"
											@click="variantDialogFilter = 'in_stock'"
											class="px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
											:class="variantDialogFilter === 'in_stock' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'"
										>
											{{ __("Con stock") }} ({{ inStockDialogVariantsCount }})
										</button>
									</div>

									<MdxButton
										variant="secondary"
										size="sm"
										@click="selectedVariants.length === variants.length ? deselectAllVariants() : selectAllVariants()"
									>
										{{
											selectedVariants.length === variants.length && variants.length > 0
												? __("Deselect All")
												: __("Select All")
										}}
									</MdxButton>
								</div>
							</div>

							<div v-if="loadingVariants" class="flex items-center justify-center py-6">
								<div class="text-center">
									<div class="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600 mx-auto"></div>
									<p class="mt-2 text-xs text-slate-500">{{ __("Loading variants...") }}</p>
								</div>
							</div>

							<div
								v-else-if="filteredDialogVariants.length > 0"
								class="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
							>
								<div
									v-for="variant in filteredDialogVariants"
									:key="variant.item_code"
									@click="toggleVariantSelection(variant)"
									class="w-full text-start px-3 py-2.5 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between gap-2 shadow-2xs"
									:class="
										isVariantSelected(variant)
											? 'bg-blue-50/70 border-blue-500 ring-1 ring-blue-500/20'
											: 'bg-white border-slate-200 hover:border-slate-300'
									"
								>
									<div class="flex items-center gap-2 min-w-0 flex-1">
										<div
											class="w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0"
											:class="
												isVariantSelected(variant)
													? 'bg-blue-600 border-blue-600 text-white'
													: 'bg-white border-slate-300 text-transparent'
											"
										>
											<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
												<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
											</svg>
										</div>

										<span
											class="text-xs sm:text-sm font-bold text-slate-900 truncate"
											:title="`${getDialogVariantPrimaryLabel(variant)} (${variant.item_code})`"
										>
											{{ getDialogVariantPrimaryLabel(variant) }}
										</span>

										<MdxBadge :variant="(variant.actual_qty ?? 0) > 0 ? 'success' : 'neutral'" size="sm">
											{{ Math.floor(variant.actual_qty || 0) }} {{ __("disp.") }}
										</MdxBadge>

										<span
											v-if="(variant.other_qty || 0) > 0"
											class="text-[11px] font-semibold text-slate-500 tabular-nums shrink-0"
										>
											+{{ Math.floor(variant.other_qty) }}
										</span>
									</div>

									<MdxButton
										variant="secondary"
										size="sm"
										@click.stop="openSingleVariantAvailability(variant)"
									>
										{{ settingsStore.canManageStock ? __("+ / − Stock") : __("Almacenes") }}
									</MdxButton>
								</div>
							</div>

							<div v-else-if="variants.length > 0" class="text-center py-6 bg-slate-50 rounded-xl border border-slate-200">
								<p class="text-xs font-semibold text-slate-600">{{ __("No se encontraron variantes con los filtros actuales.") }}</p>
								<MdxButton
									variant="secondary"
									size="sm"
									class="mt-2"
									@click="variantDialogFilter = 'all'; variantDialogSearch = ''"
								>
									{{ __("Mostrar todas") }}
								</MdxButton>
							</div>

							<div v-else class="text-center py-5">
								<p class="text-sm text-slate-500">{{ __("No variants found") }}</p>
							</div>

							<div v-if="variants.length > 0" class="pt-2 border-t border-slate-200">
								<MdxButton
									variant="primary"
									size="md"
									:full-width="true"
									:disabled="selectedVariants.length === 0"
									@click="confirmVariantSelection"
								>
									{{ __("Ver disponibilidad por almacén") }} ({{ selectedVariants.length }} {{ __("Selected") }})
								</MdxButton>
							</div>
						</div>

						<!-- Main Lookup Content Area -->
						<div class="flex-1 flex flex-col">
							<!-- Loading State -->
							<div v-if="loading && !showVariantSelection" class="flex-1 flex items-center justify-center py-12">
								<div class="text-center">
									<div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
									<p class="mt-3 text-xs font-medium text-slate-500">
										{{ __("Checking warehouse availability...") }}
									</p>
								</div>
							</div>

							<!-- Error State -->
							<div v-else-if="error && !showVariantSelection" class="flex-1 flex items-center justify-center py-12">
								<div class="text-center">
									<svg class="mx-auto h-10 w-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8">
										<path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									<p class="mt-3 text-sm text-slate-700">{{ error }}</p>
									<MdxButton variant="primary" size="sm" class="mt-3" @click="loadAvailability">
										{{ __("Try Again") }}
									</MdxButton>
								</div>
							</div>

							<!-- Inventory Overview (MdxDataTable + MdxSearchInput + MdxSelect) -->
							<div
								v-else-if="isSearchMode && !selectedItemCode && !showVariantSelection"
								class="flex-1 flex flex-col gap-3 text-start"
							>
								<!-- Search & Select Filter Bar -->
								<div class="bg-white border border-slate-200 rounded-xl p-3 grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-center shadow-2xs">
									<div class="lg:col-span-6 dialog-full-search">
										<MdxSearchInput
											v-model="searchQuery"
											:placeholder="__('Buscar producto, código o medida...')"
											:debounce="80"
											:enable-shortcut-listener="false"
											:shortcut-key="''"
											@search="filteredInventoryItems.length > 0 && selectItem(filteredInventoryItems[0])"
										/>
									</div>

									<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 lg:col-span-6">
										<MdxSelect
											v-model="invWarehouseFilter"
											:options="invWarehouseOptions"
											:placeholder="''"
											size="sm"
											:teleport="true"
										/>
										<MdxSelect
											v-model="invGroupFilter"
											:options="invGroupOptions"
											:placeholder="''"
											size="sm"
											:teleport="true"
										/>
									</div>
								</div>

								<!-- Standardized DataTable -->
								<div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
									<MdxDataTable
										:columns="inventoryTableColumns"
										:rows="paginatedInventoryItems"
										:loading="loadingInventoryReport && inventoryReportItems.length === 0"
										:sort-by="invSortKey === 'status_grouped' ? '' : invSortKey"
										:sort-order="invSortDir"
										row-key="item_code"
										pagination-mode="none"
										:page-size="0"
										:empty-title="__('No se encontraron productos con los filtros seleccionados.')"
										@sort="(key) => toggleInvSort(key)"
										@row-click="selectItem"
									>
										<template #cell-item_name="{ row }">
											<div class="min-w-0 py-0.5">
												<p class="text-xs font-bold text-slate-900 truncate leading-tight">
													{{ row.item_name }}
												</p>
												<p class="text-[11px] text-slate-500 truncate mt-0.5">
													<span class="font-mono text-slate-500">{{ row.item_code }}</span>
													<template v-if="shouldShowExtraMedida(row)"> · {{ row.custom_medida }}</template>
												</p>
											</div>
										</template>

										<template #cell-item_group="{ row }">
											<span class="text-xs text-slate-600 truncate block">{{ row.item_group || "—" }}</span>
										</template>

										<template #cell-warehouse_display="{ row }">
											<div class="min-w-0">
												<span class="text-xs font-semibold text-slate-800 truncate block">
													{{ cleanWarehouseName(row.display_warehouse_name) }}
												</span>
												<span v-if="!invWarehouseFilter && row.other_qty > 0" class="text-[10px] text-slate-500">
													+ {{ Math.floor(row.other_qty) }} {{ __("otros") }}
												</span>
											</div>
										</template>

										<template #cell-cost_rate="{ row }">
											<span class="text-xs font-semibold text-slate-700 tabular-nums">
												Bs. {{ Number(row.cost_rate || 0).toFixed(2) }}
											</span>
										</template>

										<template #cell-selling_rate="{ row }">
											<span class="text-xs font-extrabold text-slate-900 tabular-nums">
												Bs. {{ Number(row.selling_rate || 0).toFixed(2) }}
											</span>
										</template>

										<template #cell-display_qty="{ row }">
											<MdxBadge
												:variant="row.stock_level === 'out' ? 'danger' : row.stock_level === 'low' ? 'warning' : 'success'"
												size="sm"
											>
												{{ Math.floor(row.display_qty) }}
											</MdxBadge>
										</template>

										<template #cell-actions="{ row }">
											<div class="inline-flex items-center justify-end gap-1.5" @click.stop>
												<button
													type="button"
													@click="selectItem(row)"
													class="h-7 px-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
												>
													{{ settingsStore.canManageStock ? __("+ / − Stock") : __("Ver") }}
												</button>
												<button
													v-if="settingsStore.canManageItems"
													type="button"
													@click="openEditItemModal(row.item_code)"
													class="w-7 h-7 inline-flex items-center justify-center text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
													:title="__('Editar Producto')"
												>
													<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
														<path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
													</svg>
												</button>
											</div>
										</template>
									</MdxDataTable>
								</div>
							</div>

							<!-- Warehouses List (Selected Item Detail) -->
							<div
								v-else-if="warehouses && warehouses.length > 0 && !showVariantSelection"
								class="flex flex-col gap-3"
							>
								<!-- Back to Variants Navigation Bar -->
								<div
									v-if="variants.length > 0"
									class="flex flex-wrap items-center justify-between gap-2 p-3 bg-white border border-slate-200 rounded-xl shadow-2xs"
								>
									<div class="text-xs text-slate-700 text-start">
										<template v-if="selectedVariants.length === 1">
											<span class="text-slate-500">{{ __("Variante:") }}</span>
											<strong class="ms-1 font-bold text-slate-900">{{ selectedVariants[0].item_name }}</strong>
											<span class="ms-1 font-mono text-slate-400">({{ selectedVariants[0].item_code }})</span>
										</template>
										<template v-else>
											<strong class="font-bold text-slate-900">{{ selectedVariants.length }}</strong>
											{{ __("variantes seleccionadas") }}
										</template>
									</div>
									<MdxButton
										variant="secondary"
										size="sm"
										@click="showVariantSelection = true; activeQuickWarehouse = null"
									>
										{{ __("Volver a Variantes") }}
									</MdxButton>
								</div>

								<!-- Grouped Warehouses (Multiple Variants Selected) -->
								<template v-if="selectedVariants.length > 1">
									<div
										v-for="(warehouseGroup, warehouseName) in groupedWarehouses"
										:key="warehouseName"
										class="pos-wh-card p-4 text-start"
									>
										<div class="flex items-center justify-between gap-4 pb-3 mb-3 border-b border-slate-200">
											<div class="min-w-0">
												<h3 class="text-sm font-bold text-slate-900 truncate">
													{{ cleanWarehouseName(warehouseGroup[0].warehouse_name) }}
												</h3>
												<p class="text-xs text-slate-500 truncate">{{ warehouseGroup[0].company }}</p>
											</div>
											<span class="text-xs font-semibold text-slate-500 shrink-0">
												{{ warehouseGroup.length }}
												{{ warehouseGroup.length === 1 ? __("variant") : __("variants") }}
											</span>
										</div>

										<div class="space-y-2">
											<div
												v-for="warehouse in warehouseGroup"
												:key="`${warehouse.warehouse}-${warehouse.item_code}`"
												class="bg-slate-50 rounded-xl p-3 border border-slate-200 flex flex-wrap items-center justify-between gap-3"
											>
												<div class="min-w-0 flex-1">
													<p class="text-xs sm:text-sm font-bold text-slate-900 truncate">
														{{ getVariantName(warehouse.item_code) }}
													</p>
													<p class="text-[11px] text-slate-500 font-mono truncate">{{ warehouse.item_code }}</p>
												</div>

												<div class="flex items-center gap-3 shrink-0">
													<div class="text-end">
														<div class="text-sm font-extrabold text-slate-900 tabular-nums">
															{{ Math.floor(warehouse.available_qty) }} {{ getVariantUom(warehouse.item_code) }}
														</div>
														<div class="flex items-center justify-end gap-1 mt-0.5">
															<MdxBadge :variant="warehouse.available_qty > 0 ? 'success' : 'danger'" size="sm">
																{{ warehouse.available_qty > 0 ? __("Disponible") : __("Sin stock") }}
															</MdxBadge>
															<span v-if="warehouse.rate" class="text-[11px] text-slate-500">
																{{ formatPrice(warehouse.rate) }}
															</span>
														</div>
													</div>

													<MdxButton
														v-if="warehouse.available_qty > 0 || !settingsStore.shouldEnforceStockValidation()"
														variant="primary"
														size="sm"
														@click="sellFromWarehouse(warehouse)"
													>
														+ {{ __("Vender") }}
													</MdxButton>
												</div>
											</div>
										</div>
									</div>
								</template>

								<!-- Single Item / Single Variant Warehouse Cards -->
								<template v-else>
									<div
										v-for="warehouse in warehouses"
										:key="warehouse.warehouse"
										class="pos-wh-card p-4 text-start"
										:class="warehouse.available_qty > 0 ? '' : 'pos-wh-card--empty'"
									>
										<!-- Top Row: Warehouse Info (Left) + Neutral Qty & Status Badge (Right) -->
										<div class="flex items-start justify-between gap-3">
											<div class="min-w-0 flex-1">
												<h3 class="text-sm sm:text-base font-extrabold text-slate-900 leading-snug truncate">
													{{ cleanWarehouseName(warehouse.warehouse_name) }}
												</h3>
												<p class="text-xs text-slate-500 mt-0.5 truncate">{{ warehouse.company }}</p>
												<p
													v-if="warehouse.item_code && selectedVariants.length === 1"
													class="text-xs font-semibold text-slate-700 mt-1"
												>
													{{ getVariantName(warehouse.item_code) }}
												</p>
											</div>

											<div class="text-end shrink-0">
												<div class="text-base sm:text-lg font-extrabold text-slate-900 tabular-nums leading-tight">
													{{ Math.floor(warehouse.available_qty) }}
													{{ warehouse.item_code ? getVariantUom(warehouse.item_code) : displayUom }}
												</div>

												<div
													v-if="selectedBarcodeUom && convertToBarcodeUom(warehouse.available_qty) !== null"
													class="text-xs text-slate-500 font-medium tabular-nums"
												>
													≈ {{ Math.floor(convertToBarcodeUom(warehouse.available_qty) * 100) / 100 }}
													{{ selectedBarcodeUom }}
												</div>

												<div class="flex items-center justify-end gap-1.5 mt-1">
													<MdxBadge :variant="warehouse.available_qty > 0 ? 'success' : 'danger'" size="sm">
														{{ warehouse.available_qty > 0 ? __("Disponible") : __("Sin stock") }}
													</MdxBadge>
													<MdxBadge v-if="warehouse.reserved_qty > 0" variant="warning" size="sm">
														{{ __("{0} reserved", [Math.floor(warehouse.reserved_qty)]) }}
													</MdxBadge>
												</div>
											</div>
										</div>

										<!-- Actual vs Available note -->
										<div
											v-if="warehouse.actual_qty !== warehouse.available_qty"
											class="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500"
										>
											<span>{{ __("Actual Stock") }}</span>
											<span class="font-bold text-slate-700 tabular-nums">
												{{ Math.floor(warehouse.actual_qty) }}
												{{ warehouse.item_code ? getVariantUom(warehouse.item_code) : displayUom }}
											</span>
										</div>

										<!-- Action Buttons Row (White Neutral Secondary + Single Blue Primary) -->
										<div
											v-if="(settingsStore.canManageStock && selectedVariants.length <= 1) || warehouse.available_qty > 0 || !settingsStore.shouldEnforceStockValidation()"
											class="mt-3 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2"
										>
											<div class="flex flex-wrap items-center gap-2">
												<button
													v-if="settingsStore.canManageStock && selectedVariants.length <= 1"
													type="button"
													@click="toggleQuickStockForm(warehouse, 'add')"
													class="h-8 px-3 text-xs font-semibold rounded-lg border transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
													:class="
														activeQuickWarehouse === warehouse.warehouse && quickEntryMode === 'add'
															? 'bg-slate-900 text-white border-slate-900'
															: 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
													"
												>
													<svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2">
														<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
													</svg>
													<span>{{ __("Añadir Stock") }}</span>
												</button>

												<button
													v-if="settingsStore.canManageStock && selectedVariants.length <= 1 && (warehouse.actual_qty || 0) > 0"
													type="button"
													@click="toggleQuickStockForm(warehouse, 'subtract')"
													class="h-8 px-3 text-xs font-semibold rounded-lg border transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
													:class="
														activeQuickWarehouse === warehouse.warehouse && quickEntryMode === 'subtract'
															? 'bg-slate-900 text-white border-slate-900'
															: 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
													"
												>
													<svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2">
														<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12h-15" />
													</svg>
													<span>{{ __("Disminuir") }}</span>
												</button>
											</div>

											<div class="ms-auto">
												<MdxButton
													v-if="warehouse.available_qty > 0 || !settingsStore.shouldEnforceStockValidation()"
													variant="primary"
													size="sm"
													@click="sellFromWarehouse(warehouse)"
												>
													+ {{ __("Vender de aquí") }}
												</MdxButton>
												<MdxBadge v-else variant="neutral" size="md">
													{{ __("Sin stock") }}
												</MdxBadge>
											</div>
										</div>

										<!-- Inline Quick Add / Subtract Stock Panel (Neutral Slate) -->
										<div
											v-if="activeQuickWarehouse === warehouse.warehouse"
											class="mt-3 pt-3 border-t border-slate-200 bg-slate-50 rounded-xl p-3.5 space-y-3"
										>
											<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
												<span class="text-xs font-bold text-slate-800">
													{{
														quickEntryMode === "subtract"
															? __("¿Cuántas unidades quieres descontar del stock?")
															: __("¿Cuántas unidades quieres añadir al stock?")
													}}
												</span>

												<div class="flex items-center gap-2 text-xs text-slate-700 tabular-nums">
													<span>{{ __("Hay:") }} <strong>{{ Math.floor(warehouse.actual_qty || 0) }}</strong></span>
													<span>{{ quickEntryMode === "subtract" ? "−" : "+" }}</span>
													<span>{{ Math.max(0, Math.floor(Number(quickQty) || 0)) }}</span>
													<span>=</span>
													<MdxBadge :variant="quickEntryMode === 'subtract' ? 'warning' : 'success'" size="sm">
														{{ __("Quedarán:") }}
														{{
															quickEntryMode === "subtract"
																? Math.max(0, Math.floor((warehouse.actual_qty || 0) - Math.max(0, Number(quickQty) || 0)))
																: Math.floor((warehouse.actual_qty || 0) + Math.max(0, Number(quickQty) || 0))
														}}
													</MdxBadge>
												</div>
											</div>

											<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
												<div class="flex flex-wrap items-center gap-2">
													<div class="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
														<button
															type="button"
															@click="quickQty = Math.max(1, (Number(quickQty) || 1) - 1)"
															class="px-3.5 py-1.5 text-slate-700 hover:bg-slate-100 font-bold text-sm cursor-pointer"
														>
															−
														</button>
														<input
															v-model.number="quickQty"
															type="number"
															min="1"
															:max="quickEntryMode === 'subtract' ? Math.max(1, Math.floor(warehouse.actual_qty || 1)) : undefined"
															step="1"
															class="w-16 sm:w-20 text-center text-sm font-bold text-slate-900 border-x border-slate-200 py-1.5 focus:outline-none tabular-nums"
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
															class="px-3.5 py-1.5 text-slate-700 hover:bg-slate-100 font-bold text-sm cursor-pointer"
														>
															+
														</button>
													</div>

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
															class="h-8 px-2.5 text-xs font-bold rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors cursor-pointer"
														>
															{{ quickEntryMode === "subtract" ? `−${step}` : `+${step}` }}
														</button>
													</div>
												</div>

												<div class="flex items-center gap-2 w-full sm:w-auto sm:ms-auto justify-end">
													<MdxButton
														variant="secondary"
														size="sm"
														:disabled="submittingStock"
														@click="activeQuickWarehouse = null"
													>
														{{ __("Cancelar") }}
													</MdxButton>
													<MdxButton
														:variant="quickEntryMode === 'subtract' ? 'danger' : 'primary'"
														size="sm"
														:loading="submittingStock"
														@click="submitQuickStockEntry(warehouse)"
													>
														{{
															quickEntryMode === "subtract"
																? `${__("Descontar")} (−${Math.max(1, Math.floor(Number(quickQty) || 1))})`
																: `${__("Guardar")} (+${Math.max(1, Math.floor(Number(quickQty) || 1))})`
														}}
													</MdxButton>
												</div>
											</div>
										</div>
									</div>
								</template>
							</div>

							<!-- No Stock State -->
							<div
								v-else-if="(selectedItemCode || itemCode) && !showVariantSelection"
								class="flex-1 flex items-center justify-center py-12"
							>
								<div class="text-center">
									<div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-200 shadow-2xs">
										<svg class="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8">
											<path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
										</svg>
									</div>
									<p class="text-sm font-semibold text-slate-700">{{ __("No stock available") }}</p>
									<p class="mt-1 text-xs text-slate-500">{{ __("This item is out of stock in all warehouses") }}</p>
								</div>
							</div>
						</div>
					</div>

					<!-- ============================================================ -->
					<!-- TAB 2: PRODUCTOS (CREAR Y EDITAR)                            -->
					<!-- ============================================================ -->
					<div v-else-if="isSearchMode && activeTab === 'catalog'" class="flex-1 flex flex-col gap-3 text-start">
						<!-- Filter Bar -->
						<div class="bg-white border border-slate-200 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center shadow-2xs">
							<div class="sm:col-span-8 dialog-full-search">
								<MdxSearchInput
									v-model="catalogSearchQuery"
									:placeholder="__('Buscar producto por nombre, código, medida o categoría...')"
									:debounce="80"
									:enable-shortcut-listener="false"
									:shortcut-key="''"
								/>
							</div>
							<div class="sm:col-span-4">
								<MdxSelect
									v-model="catalogGroupFilter"
									:options="invGroupOptions"
									:placeholder="''"
									size="sm"
									:teleport="true"
								/>
							</div>
						</div>

						<!-- Catalog Table (Paginated via Footer) -->
						<div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
							<MdxDataTable
								:columns="catalogTableColumns"
								:rows="paginatedCatalogItems"
								row-key="item_code"
								pagination-mode="none"
								:page-size="0"
								:empty-title="__('No se encontraron productos con ese criterio.')"
								@row-click="(row) => openEditItemModal(row.item_code)"
							>
								<template #cell-item_display="{ row }">
									<div class="flex items-center gap-2.5 min-w-0 py-0.5">
										<div class="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
											<img
												v-if="row.image"
												:src="row.image"
												:alt="row.item_name"
												class="w-full h-full object-cover"
											/>
											<svg v-else class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8">
												<path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
											</svg>
										</div>
										<div class="min-w-0 flex-1">
											<p class="text-xs font-bold text-slate-900 truncate leading-tight">{{ row.item_name }}</p>
											<p class="text-[11px] text-slate-500 truncate mt-0.5">
												<span class="font-mono">{{ row.item_code }}</span>
												<template v-if="shouldShowExtraMedida(row)"> · {{ row.custom_medida }}</template>
												<template v-if="row.has_variants">
													· {{ row.variants_total ? `${row.variants_total} ${__("variantes")}` : __("Con variantes") }}
												</template>
											</p>
										</div>
									</div>
								</template>

								<template #cell-item_group="{ row }">
									<span class="text-xs text-slate-600 truncate block">{{ row.item_group || "—" }}</span>
								</template>

								<template #cell-stock_display="{ row }">
									<div class="inline-flex items-center gap-1.5">
										<span class="text-xs text-slate-500 truncate max-w-[110px]">
											{{ cleanWarehouseName(row.warehouse_name || row.warehouse || "") }}
										</span>
										<MdxBadge :variant="(row.actual_qty ?? 0) > 0 ? 'success' : 'danger'" size="sm">
											{{ Math.floor(row.actual_qty ?? 0) }}
										</MdxBadge>
									</div>
								</template>

								<template #cell-rate_display="{ row }">
									<span class="text-xs font-extrabold text-slate-900 tabular-nums">
										Bs. {{ Number(row.rate || row.price_list_rate || 0).toFixed(2) }}
										<span class="text-[10px] font-normal text-slate-500">/ {{ row.stock_uom || row.uom || __("Pieza") }}</span>
									</span>
								</template>

								<template #cell-actions="{ row }">
									<div class="inline-flex justify-end" @click.stop>
										<MdxButton
											variant="secondary"
											size="sm"
											@click="openEditItemModal(row.item_code)"
										>
											{{ __("Editar") }}
										</MdxButton>
									</div>
								</template>
							</MdxDataTable>
						</div>
					</div>

					<!-- ============================================================ -->
					<!-- TAB 3: AÑADIR INVENTARIO MASIVO                              -->
					<!-- ============================================================ -->
					<div v-else-if="isSearchMode && activeTab === 'batch_entry'" class="flex-1 flex flex-col gap-3 text-start">
						<!-- Clean White Configuration Card -->
						<div class="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<div>
									<label class="block text-xs font-bold text-slate-700 mb-1.5">
										{{ __("Almacén donde entra la mercadería") }}
									</label>
									<MdxSelect
										v-model="batchWarehouse"
										:options="batchWarehouseOptions"
										:placeholder="__('Seleccionar almacén...')"
										size="sm"
										:teleport="true"
									/>
								</div>
								<div>
									<label class="block text-xs font-bold text-slate-700 mb-1.5">
										{{ __("Nota opcional") }}
									</label>
									<input
										v-model="batchRemarks"
										type="text"
										:placeholder="__('Ej: Llegó de fábrica o importación')"
										class="w-full h-8 px-3 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
									/>
								</div>
							</div>

							<!-- Search to Add Items -->
							<div class="relative dialog-full-search">
								<MdxSearchInput
									v-model="batchSearchQuery"
									:placeholder="__('Buscar producto por nombre o código para añadir...')"
									:debounce="120"
									:enable-shortcut-listener="false"
									:shortcut-key="''"
									@update:modelValue="handleBatchSearchInput"
									@search="selectFirstBatchResult"
									@clear="batchSearchResults = []"
								/>

								<div
									v-if="batchSearchResults.length > 0"
									class="absolute start-0 end-0 z-30 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto"
								>
									<button
										v-for="item in batchSearchResults"
										:key="item.item_code"
										type="button"
										@click="addBatchItem(item)"
										class="w-full text-start px-3.5 py-2.5 flex items-center justify-between gap-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer"
									>
										<div class="min-w-0">
											<p class="text-xs font-bold text-slate-900 truncate">{{ item.item_name }}</p>
											<p class="text-[11px] text-slate-500 font-mono truncate">{{ item.item_code }}</p>
										</div>
										<div class="flex items-center gap-2 shrink-0">
											<MdxBadge variant="neutral" size="sm">
												{{ __("Stock:") }} {{ Math.floor(item.actual_qty || 0) }}
											</MdxBadge>
											<span class="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold">
												+ {{ __("Agregar") }}
											</span>
										</div>
									</button>
								</div>
							</div>
						</div>

						<!-- Batch Items List -->
						<div v-if="batchItems.length > 0" class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
							<div class="divide-y divide-slate-100">
								<div
									v-for="(row, idx) in batchItems"
									:key="row.item_code"
									class="p-3.5 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50/70"
								>
									<div class="flex-1 min-w-[200px]">
										<p class="text-xs sm:text-sm font-bold text-slate-900">{{ row.item_name }}</p>
										<div class="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 tabular-nums">
											<span class="font-mono">{{ row.item_code }}</span>
											<span>·</span>
											<span>{{ __("Hay:") }} <strong class="text-slate-700">{{ Math.floor(row.actual_qty || 0) }}</strong></span>
											<MdxBadge variant="success" size="sm">
												{{ __("Quedarán:") }} {{ Math.floor((row.actual_qty || 0) + (Number(row.qty) || 0)) }}
											</MdxBadge>
										</div>
									</div>

									<div class="flex items-center gap-2 shrink-0">
										<button
											type="button"
											@click="row.qty = (Number(row.qty) || 0) + 5"
											class="h-8 px-2.5 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg transition-colors cursor-pointer"
										>
											+5
										</button>
										<button
											type="button"
											@click="row.qty = (Number(row.qty) || 0) + 10"
											class="h-8 px-2.5 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg transition-colors cursor-pointer"
										>
											+10
										</button>

										<div class="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white h-8">
											<button
												type="button"
												@click="row.qty = Math.max(1, (Number(row.qty) || 1) - 1)"
												class="px-2.5 h-full text-slate-700 hover:bg-slate-100 font-bold text-xs cursor-pointer"
											>
												−
											</button>
											<input
												v-model.number="row.qty"
												type="number"
												min="1"
												step="1"
												class="w-16 text-center text-xs font-bold text-slate-900 border-x border-slate-200 py-1 focus:outline-none tabular-nums"
											/>
											<button
												type="button"
												@click="row.qty = (Number(row.qty) || 0) + 1"
												class="px-2.5 h-full text-slate-700 hover:bg-slate-100 font-bold text-xs cursor-pointer"
											>
												+
											</button>
										</div>

										<button
											type="button"
											@click="batchItems.splice(idx, 1)"
											class="w-8 h-8 flex items-center justify-center bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-500 hover:text-red-700 rounded-lg transition-colors cursor-pointer"
											:title="__('Quitar de la lista')"
										>
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
												<path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
											</svg>
										</button>
									</div>
								</div>
							</div>

							<!-- Submit Footer Strip -->
							<div class="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
								<div class="text-xs text-slate-600 tabular-nums">
									<strong class="text-slate-900">{{ batchItems.length }}</strong> {{ __("producto(s)") }} ·
									{{ __("Total unidades a añadir:") }}
									<strong class="text-slate-900">
										+{{ batchItems.reduce((acc, r) => acc + (Number(r.qty) || 0), 0) }}
									</strong>
								</div>
								<div class="flex items-center gap-2">
									<MdxButton
										variant="secondary"
										size="sm"
										:disabled="submittingStock"
										@click="batchItems = []"
									>
										{{ __("Limpiar Lista") }}
									</MdxButton>
									<MdxButton
										variant="primary"
										size="sm"
										:loading="submittingStock"
										:disabled="batchItems.length === 0"
										@click="submitBatchStockEntry"
									>
										{{ __("Guardar Ingreso") }}
									</MdxButton>
								</div>
							</div>
						</div>

						<!-- Empty Batch State -->
						<div
							v-else
							class="flex-1 flex flex-col items-center justify-center py-12 text-center bg-white border border-dashed border-slate-300 rounded-xl"
						>
							<div class="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-200">
								<svg class="h-7 w-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8">
									<path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
								</svg>
							</div>
							<p class="text-sm font-semibold text-slate-700">
								{{ __("Busque arriba los productos que llegaron para sumarlos al stock") }}
							</p>
							<p class="text-xs text-slate-500 mt-1">
								{{ __("Puede agregar varios productos antes de confirmar el ingreso") }}
							</p>
						</div>
					</div>

					<!-- ============================================================ -->
					<!-- TAB 4: HISTORIAL DE MOVIMIENTOS Y ANULACIÓN                  -->
					<!-- ============================================================ -->
					<div v-else-if="isSearchMode && activeTab === 'history'" class="flex-1 flex flex-col gap-3 text-start">
						<div v-if="loadingHistory" class="flex-1 flex flex-col items-center justify-center py-12">
							<div class="animate-spin rounded-full h-9 w-9 border-b-2 border-blue-600 mx-auto"></div>
							<p class="mt-3 text-xs font-medium text-slate-500">{{ __("Cargando historial...") }}</p>
						</div>

						<div
							v-else-if="stockEntriesHistory.length === 0"
							class="flex-1 flex flex-col items-center justify-center text-center py-12"
						>
							<div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-200 shadow-2xs">
								<svg class="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8">
									<path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
							<p class="text-sm font-semibold text-slate-700">{{ __("No hay ingresos de stock recientes.") }}</p>
						</div>

						<!-- Horizontal 4-Zone Stock History Cards -->
						<div v-else class="flex flex-col gap-3">
							<div
								v-for="entry in paginatedHistoryEntries"
								:key="entry.name"
								class="pos-wh-card flex flex-col overflow-hidden"
								:class="entry.docstatus === 2 ? 'pos-wh-card--cancelled' : ''"
							>
								<div class="px-4 py-3.5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
									<!-- Zone 1: Entry ID, Status & Timestamp -->
									<div class="w-full lg:w-[240px] shrink-0 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-slate-200 pb-3 lg:pb-0 lg:pe-4">
										<div class="flex items-center gap-1.5 mb-1 flex-wrap">
											<h4 class="text-sm md:text-base font-extrabold text-slate-900 tabular-nums">
												{{ entry.name }}
											</h4>
											<MdxBadge
												:variant="entry.docstatus === 2 ? 'danger' : entry.purpose === 'Material Receipt' ? 'success' : 'warning'"
												size="sm"
											>
												{{
													entry.docstatus === 2
														? __("Anulado")
														: entry.purpose === "Material Receipt"
														? __("Ingreso (+)")
														: __("Salida (-)")
												}}
											</MdxBadge>
										</div>
										<p class="text-xs text-slate-500 tabular-nums">
											{{ entry.posting_date }} {{ (entry.posting_time || "").slice(0, 5) }}
										</p>
									</div>

									<!-- Zone 2: Warehouse & Remarks -->
									<div class="w-full lg:w-[220px] shrink-0 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-slate-200 pb-3 lg:pb-0 lg:pe-4 min-w-0">
										<span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
											{{ __("Almacén") }}
										</span>
										<p class="text-sm font-bold text-slate-900 truncate mt-0.5">
											{{ cleanWarehouseName(entry.warehouse_name) || "—" }}
										</p>
										<p v-if="entry.remarks" class="text-xs text-slate-500 mt-1 truncate" :title="entry.remarks">
											{{ entry.remarks }}
										</p>
									</div>

									<!-- Zone 3: Items Preview & Expandable MdxDataTable -->
									<div class="flex-1 min-w-0 border-b lg:border-b-0 lg:border-r border-slate-200 pb-3 lg:pb-0 lg:pe-4 flex flex-col justify-center">
										<div class="flex items-center justify-between gap-2 mb-1.5">
											<span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
												{{ __("Detalle de Items") }} ({{ entry.items?.length || 0 }})
											</span>
											<button
												v-if="(entry.items?.length || 0) > 0"
												type="button"
												@click="toggleHistoryDetail(entry.name)"
												class="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 px-1.5 py-0.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
											>
												<span>{{ isHistoryExpanded(entry.name) ? __("Ocultar detalle") : __("Ver detalle") }}</span>
												<svg
													class="w-3.5 h-3.5 transition-transform duration-150"
													:class="isHistoryExpanded(entry.name) ? 'rotate-180' : ''"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
													stroke-width="2"
												>
													<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
												</svg>
											</button>
										</div>
										<div class="flex flex-wrap items-center gap-1.5">
											<span
												v-for="(it, iIdx) in (entry.items || []).slice(0, 2)"
												:key="iIdx"
												class="text-[11px] bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg truncate max-w-[240px] font-medium"
											>
												{{ it.item_name }}
												<strong class="text-slate-900 ms-1 tabular-nums">
													{{ it.direction === "in" ? "+" : "−" }}{{ Math.floor(it.qty) }}
												</strong>
											</span>
											<button
												v-if="(entry.items?.length || 0) > 2"
												type="button"
												@click="toggleHistoryDetail(entry.name)"
												class="text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer"
												:class="
													isHistoryExpanded(entry.name)
														? 'bg-slate-900 border-slate-900 text-white'
														: 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
												"
											>
												{{ isHistoryExpanded(entry.name) ? __("Menos") : `+${entry.items.length - 2} ${__("más")}` }}
											</button>
										</div>
									</div>

									<!-- Zone 4: Total Units & Neutral Cancel Action -->
									<div class="w-full lg:w-auto shrink-0 flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-3.5">
										<div class="flex flex-col lg:items-end shrink-0 whitespace-nowrap text-start lg:text-end">
											<span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">
												{{ __("Total Unidades") }}
											</span>
											<span class="text-base md:text-lg font-extrabold text-slate-900 tabular-nums mt-1">
												{{ getHistoryTotalUnits(entry) }}
											</span>
										</div>

										<button
											v-if="entry.docstatus === 1 && settingsStore.canManageStock"
											type="button"
											@click="cancellingEntryName = cancellingEntryName === entry.name ? '' : entry.name; cancelReason = ''"
											class="h-8 px-3 text-xs font-semibold bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-700 hover:text-red-700 rounded-lg transition-colors cursor-pointer shadow-2xs"
										>
											{{ __("Anular") }}
										</button>
									</div>
								</div>

								<!-- Expandable Items MdxDataTable -->
								<div
									v-if="isHistoryExpanded(entry.name) && (entry.items?.length || 0) > 0"
									class="border-t border-slate-200 bg-slate-50/80 px-4 py-3 inv-subtable"
								>
									<MdxDataTable
										:columns="historyDetailColumns"
										:rows="buildHistoryDetailRows(entry)"
										row-key="_rowKey"
										pagination-mode="none"
										:page-size="0"
									>
										<template #cell-line_no="{ row }">
											<span class="text-xs font-semibold text-slate-400 tabular-nums">{{ row.line_no }}</span>
										</template>
										<template #cell-item_name="{ row }">
											<span class="text-xs font-semibold text-slate-900">{{ row.item_name }}</span>
										</template>
										<template #cell-qty_display="{ row }">
											<span class="text-xs font-extrabold text-slate-900 tabular-nums">{{ row.qty_display }}</span>
										</template>
									</MdxDataTable>
								</div>

								<!-- Inline Cancellation Confirmation -->
								<div
									v-if="cancellingEntryName === entry.name"
									class="border-t border-slate-200 bg-slate-50 px-4 py-3 flex flex-wrap items-center gap-2"
								>
									<input
										v-model="cancelReason"
										type="text"
										:placeholder="__('Motivo de la anulación (ej: Me equivoqué de cantidad)...')"
										class="flex-1 min-w-[200px] h-8 px-3 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
										@keydown.enter.prevent="confirmCancelStockEntry(entry)"
									/>
									<MdxButton
										variant="secondary"
										size="sm"
										:disabled="submittingStock"
										@click="cancellingEntryName = ''"
									>
										{{ __("Cancelar") }}
									</MdxButton>
									<MdxButton
										variant="danger"
										size="sm"
										:loading="submittingStock"
										@click="confirmCancelStockEntry(entry)"
									>
										{{ __("Confirmar Anulación") }}
									</MdxButton>
								</div>
							</div>
						</div>
					</div>
				</template>
			</div>
		</div>

		<!-- Standardized Modal Footer (Contextual Totals + Pagination + Close) -->
		<template #footer>
			<div
				v-if="isReady"
				class="flex flex-wrap items-center justify-between gap-3 w-full"
			>
				<!-- Left: Contextual Totals -->
				<div class="text-xs text-slate-600 text-start">
					<template v-if="isSearchMode && activeTab === 'lookup' && !selectedItemCode && !showVariantSelection">
						<div class="flex flex-wrap items-center gap-x-3 gap-y-1 tabular-nums">
							<span class="font-bold text-slate-500 uppercase text-[11px]">
								{{ __("Totales ({0} prod.):", [filteredInventoryItems.length]) }}
							</span>
							<span v-if="effectiveShowCostPrice">
								{{ __("Costo:") }}
								<strong class="font-extrabold text-slate-900">Bs. {{ formatPrice(inventorySummary.totalCostValue) || "0.00" }}</strong>
							</span>
							<span>
								{{ __("Venta:") }}
								<strong class="font-extrabold text-slate-900">Bs. {{ formatPrice(inventorySummary.totalSellingValue) || "0.00" }}</strong>
							</span>
							<MdxBadge variant="neutral" size="md">
								{{ inventorySummary.totalUnits }} uds
							</MdxBadge>
						</div>
					</template>

					<template v-else-if="(!isSearchMode || activeTab === 'lookup') && (selectedItemCode || itemCode) && warehouses.length > 0 && !showVariantSelection">
						<div class="tabular-nums">
							<span class="font-medium">{{ __("Total disponible") }}:</span>
							<strong class="ms-1.5 text-slate-900 font-extrabold text-sm">
								{{ totalAvailable }} {{ displayUom }}
							</strong>
							<span class="ms-1.5 text-slate-500">
								{{
									warehouses.length === 1
										? __("en 1 almacén")
										: __("en {0} almacenes", [warehouses.length])
								}}
							</span>
						</div>
					</template>
				</div>

				<!-- Center: Standardized Pagination (When > 1 Page) -->
				<div v-if="activePaginationState.totalPages > 1" class="flex items-center gap-2.5">
					<button
						type="button"
						@click="setActivePage(activePaginationState.currentPage - 1)"
						:disabled="activePaginationState.currentPage <= 1"
						class="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
						</svg>
					</button>
					<span class="text-xs font-bold text-slate-700 tabular-nums whitespace-nowrap">
						{{ __("Página {0} de {1}", [activePaginationState.currentPage, activePaginationState.totalPages]) }}
						<span class="text-slate-400 font-medium">({{ __("Total: {0}", [activePaginationState.totalCount]) }})</span>
					</span>
					<button
						type="button"
						@click="setActivePage(activePaginationState.currentPage + 1)"
						:disabled="activePaginationState.currentPage >= activePaginationState.totalPages"
						class="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
						</svg>
					</button>
				</div>

				<!-- Right: Standardized Close Button -->
				<MdxButton variant="secondary" class="ms-auto" @click="closeDialog">
					{{ __("Cerrar") }}
				</MdxButton>
			</div>
		</template>
	</MdxModal>

	<!-- Quick Create / Edit Product Modal -->
	<ItemQuickFormDialog
		v-model="showItemQuickForm"
		:pos-profile="posProfile || shiftStore.profileName"
		:item-code="editingCatalogItemCode"
		@saved="handleCatalogItemSaved"
		@switch-item="openEditItemModal"
	/>

	<!-- Universal Synchronization Overlay -->
	<MdxSyncOverlay :show="Boolean(isRefreshingDialog)" :label="__('Sincronizando...')" />
</template>

<script setup>
/**
 * WarehouseAvailabilityDialog.vue
 *
 * Inventory & Product Hub / Single-Item Warehouse Stock Lookup
 * Standardized with mdx_ui corporate components (MdxModal, MdxSegmentedControl,
 * MdxSearchInput, MdxSelect, MdxDataTable, MdxButton, MdxBadge, MdxSyncOverlay).
 */
import { ref, computed, watch } from "vue";
import { call } from "frappe-ui";
import {
	MdxBadge,
	MdxButton,
	MdxDataTable,
	MdxModal,
	MdxSearchInput,
	MdxSegmentedControl,
	MdxSelect,
	MdxSyncOverlay,
} from "mdx_ui";
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
	posProfile: String,
	mode: {
		type: String,
		default: "item",
	},
});

const emit = defineEmits(["update:modelValue", "close", "edit-item"]);

const show = computed({
	get: () => props.modelValue,
	set: (val) => emit("update:modelValue", val),
});

function closeDialog() {
	emit("update:modelValue", false);
	emit("close");
}

const isSearchMode = computed(() => props.mode === "search");

// Search state
const searchQuery = ref("");
const searchResults = ref([]);
const searching = ref(false);
const selectedResultIndex = ref(-1);
const showSearchResults = ref(false);
let searchDebounce = null;

// Selected item state
const selectedItemCode = ref("");
const selectedItemName = ref("");
const selectedItemImage = ref("");
const selectedUom = ref("Nos");
const selectedItemHasVariants = ref(false);
const selectedBarcodeUom = ref("");
const selectedItemUoms = ref([]);
const selectedItemObj = ref(null);

// Variant state
const variants = ref([]);
const selectedVariants = ref([]);
const loadingVariants = ref(false);
const showVariantSelection = ref(false);
const variantDialogSearch = ref("");
const variantDialogFilter = ref("all");

// Warehouse availability state
const loading = ref(false);
const isRefreshingDialog = ref(false);
const error = ref(null);
const warehouses = ref([]);
const isReady = ref(false);

const cartStore = usePOSCartStore();
const shiftStore = usePOSShiftStore();
const settingsStore = usePOSSettingsStore();
const stockStore = useStockStore();
const itemSearchStore = useItemSearchStore();
const { showSuccess, showError } = useToast();

// Tabs & Quick Adjustment State
const activeTab = ref("lookup");
const activeQuickWarehouse = ref(null);
const quickEntryMode = ref("add");
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
const expandedHistoryIds = ref(new Set());
const historyCurrentPage = ref(1);
const HISTORY_PAGE_SIZE = 10;

// Current Inventory Overview & Catalog State
const loadingInventoryReport = ref(false);
const inventoryReportItems = ref([]);
const inventoryWarehouses = ref([]);
const inventoryGroups = ref([]);
const inventoryCompany = ref("");
const inventoryDefaultThreshold = ref(10);

const invWarehouseFilter = ref("");
const invGroupFilter = ref("");
const invStatusFilter = ref("");
const showCostPrice = ref(false);
const serverCanViewCostPrice = ref(null);
const canViewCostPrice = computed(() =>
	serverCanViewCostPrice.value !== null
		? serverCanViewCostPrice.value
		: settingsStore.canViewCostPrice
);
const effectiveShowCostPrice = computed(() => canViewCostPrice.value && showCostPrice.value);

const invSortKey = ref("status_grouped");
const invSortDir = ref("desc");
const invCurrentPage = ref(1);
const INV_PAGE_SIZE = 25;

const catalogSearchQuery = ref("");
const catalogGroupFilter = ref("");
const catalogCurrentPage = ref(1);
const CATALOG_PAGE_SIZE = 25;
const showItemQuickForm = ref(false);
const editingCatalogItemCode = ref("");

// Segmented Tabs Config
const inventoryTabOptions = computed(() => {
	const opts = [
		{
			value: "lookup",
			label: __("Inventario / Stock"),
			badge: inventoryReportItems.value.length || undefined,
		},
	];
	if (settingsStore.canManageItems) {
		opts.push({
			value: "catalog",
			label: __("Productos (Crear / Editar)"),
			badge: (itemSearchStore.allItems || []).length || undefined,
		});
	}
	if (settingsStore.canManageStock) {
		opts.push(
			{
				value: "batch_entry",
				label: __("Añadir Inventario Masivo"),
				badge: batchItems.value.length || undefined,
			},
			{
				value: "history",
				label: __("Historial / Anular"),
				badge: stockEntriesHistory.value.length || undefined,
			}
		);
	}
	return opts;
});

// Table Columns Configs (mdx_ui MdxDataTable)
const inventoryTableColumns = computed(() => {
	const cols = [
		{ key: "item_name", label: __("Producto / Medida"), sortable: true, width: 290, align: "left", primary: true },
		{ key: "item_group", label: __("Categoría"), sortable: true, width: 170, align: "left", hideOnMobile: true },
		{ key: "warehouse_display", label: __("Almacén"), width: 165, align: "left" },
	];
	if (effectiveShowCostPrice.value) {
		cols.push({ key: "cost_rate", label: __("Costo"), sortable: true, width: 120, align: "right" });
	}
	cols.push(
		{ key: "selling_rate", label: __("Precio"), sortable: true, width: 125, align: "right" },
		{ key: "display_qty", label: __("Cantidad"), sortable: true, width: 110, align: "center" },
		{ key: "actions", label: __("Acción"), width: 135, align: "right" }
	);
	return cols;
});

const catalogTableColumns = computed(() => [
	{ key: "item_display", label: __("Producto"), width: 320, align: "left", primary: true },
	{ key: "item_group", label: __("Categoría"), width: 170, align: "left", hideOnMobile: true },
	{ key: "stock_display", label: __("Stock"), width: 175, align: "left" },
	{ key: "rate_display", label: __("Precio"), width: 140, align: "right" },
	{ key: "actions", label: __("Acción"), width: 110, align: "right" },
]);

const historyDetailColumns = computed(() => [
	{ key: "line_no", label: "#", width: 48, align: "center", hideOnMobile: true },
	{ key: "item_name", label: __("Producto"), width: 320, align: "left", primary: true },
	{ key: "qty_display", label: __("Cantidad"), width: 110, align: "right" },
]);

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
			loading.value = true;
			isReady.value = false;
			error.value = null;

			if (isSearchMode.value) {
				resetSearchState();
				isReady.value = true;
				loading.value = false;
				loadInventoryReport();
			} else if (props.itemCode) {
				try {
					const itemResponse = await call("pos_next.api.items.get_items", {
						pos_profile: props.posProfile,
						search_term: props.itemCode,
						start: 0,
						limit: 1,
					});
					const item = itemResponse?.[0];
					selectedItemObj.value = item;
					selectedItemImage.value = item?.image || "";
					if (item && item.has_variants) {
						selectedItemCode.value = props.itemCode;
						selectedItemName.value = props.itemName || props.itemCode;
						selectedItemHasVariants.value = true;
						isReady.value = true;
						await loadVariants();
					} else {
						isReady.value = true;
						await loadAvailability();
					}
				} catch (err) {
					console.error("Error checking item variants:", err);
					isReady.value = true;
					await loadAvailability();
				}
			} else {
				isReady.value = true;
				loading.value = false;
			}
		} else {
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
	selectedItemObj.value = null;
	variants.value = [];
	selectedVariants.value = [];
	showVariantSelection.value = false;
	warehouses.value = [];
	error.value = null;
	invCurrentPage.value = 1;
	catalogCurrentPage.value = 1;
	historyCurrentPage.value = 1;
}

async function refreshActiveView() {
	isRefreshingDialog.value = true;
	const activeProfile = props.posProfile || shiftStore.profileName;
	try {
		if (!isSearchMode.value || selectedItemCode.value) {
			if (showVariantSelection.value) {
				await loadVariants();
			} else {
				await loadAvailability();
			}
		} else if (activeTab.value === "lookup") {
			await loadInventoryReport();
		} else if (activeTab.value === "catalog") {
			await Promise.all([
				itemSearchStore.loadAllItems(activeProfile, true),
				loadInventoryReport(),
			]);
		} else if (activeTab.value === "batch_entry") {
			availableCompanyWarehouses.value = [];
			await loadCompanyWarehouses();
		} else if (activeTab.value === "history") {
			await loadStockEntriesHistory();
		}
		showSuccess(__("Datos actualizados correctamente"));
	} catch (err) {
		console.error("Error refreshing inventory view:", err);
	} finally {
		isRefreshingDialog.value = false;
	}
}

function handleSearchInput(val) {
	if (!selectedItemCode.value) return;
	selectedResultIndex.value = -1;
	const queryStr = String(val ?? searchQuery.value ?? "");
	showSearchResults.value = true;

	if (searchDebounce) {
		clearTimeout(searchDebounce);
	}

	if (queryStr.length < 1) {
		searchResults.value = [];
		searching.value = false;
		return;
	}

	searching.value = true;
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
			limit: 15,
		});
		searchResults.value = response || [];
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

function selectFirstResult() {
	if (searchResults.value.length > 0) {
		const index = selectedResultIndex.value >= 0 ? selectedResultIndex.value : 0;
		selectItem(searchResults.value[index]);
	}
}

async function selectItem(item) {
	loading.value = true;
	selectedItemObj.value = item;
	selectedItemCode.value = item.item_code;
	selectedItemName.value = item.item_name;
	selectedItemImage.value = item.image || "";
	selectedUom.value = item.stock_uom || item.uom || "Nos";
	selectedItemHasVariants.value = item.has_variants || false;
	selectedItemUoms.value = item.item_uoms || [];

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

	if (selectedItemHasVariants.value) {
		await loadVariants();
	} else {
		await loadAvailability();
	}
}

function clearSearch() {
	searchQuery.value = "";
	searchResults.value = [];
	selectedResultIndex.value = -1;
	showSearchResults.value = false;
}

function clearSelectedItem() {
	selectedItemCode.value = "";
	selectedItemName.value = "";
	selectedItemImage.value = "";
	selectedUom.value = "Nos";
	selectedItemHasVariants.value = false;
	selectedBarcodeUom.value = "";
	selectedItemUoms.value = [];
	selectedItemObj.value = null;
	variants.value = [];
	selectedVariants.value = [];
	showVariantSelection.value = false;
	warehouses.value = [];
	error.value = null;
	clearSearch();
}

function convertToBarcodeUom(qty) {
	if (!selectedBarcodeUom.value || !selectedItemUoms.value.length) return null;
	const uomData = selectedItemUoms.value.find((u) => u.uom === selectedBarcodeUom.value);
	if (!uomData || !uomData.conversion_factor) return null;
	return qty / uomData.conversion_factor;
}

function getDialogVariantPrimaryLabel(variant) {
	const attrs = Object.values(variant?.attributes || {}).filter(Boolean);
	if (attrs.length > 0) {
		return attrs.join(" · ");
	}
	return variant?.item_name || variant?.item_code || "";
}

const inStockDialogVariantsCount = computed(() =>
	(variants.value || []).filter((v) => Number(v.actual_qty || 0) > 0).length
);

const filteredDialogVariants = computed(() => {
	let list = [...(variants.value || [])].sort((a, b) => {
		const aHas = Number(a.actual_qty || 0) > 0 ? 1 : 0;
		const bHas = Number(b.actual_qty || 0) > 0 ? 1 : 0;
		return bHas - aHas;
	});
	if (variantDialogFilter.value === "in_stock") {
		list = list.filter((v) => Number(v.actual_qty || 0) > 0);
	}
	const q = (variantDialogSearch.value || "").trim().toLowerCase();
	if (q) {
		list = list.filter((v) => {
			const attrStr = Object.values(v.attributes || {}).join(" ").toLowerCase();
			return (
				attrStr.includes(q) ||
				(v.item_name || "").toLowerCase().includes(q) ||
				(v.item_code || "").toLowerCase().includes(q)
			);
		});
	}
	return list;
});

function openSingleVariantAvailability(variant) {
	if (!variant) return;
	selectedVariants.value = [variant];
	showVariantSelection.value = false;
	loadAvailability();
}

async function loadVariants() {
	const templateItem = isSearchMode.value ? selectedItemCode.value : props.itemCode;
	if (!templateItem || !props.posProfile) return;

	loadingVariants.value = true;
	variants.value = [];
	selectedVariants.value = [];
	variantDialogSearch.value = "";
	variantDialogFilter.value = "all";
	showVariantSelection.value = true;
	error.value = null;

	try {
		const response = await call("pos_next.api.items.get_item_variants", {
			template_item: templateItem,
			pos_profile: props.posProfile,
		});
		variants.value = response || [];
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
			if (!Array.isArray(list)) return [];
			const profileWh = shiftStore.profileWarehouse;
			return [...list].sort((a, b) => {
				if (profileWh) {
					if (a.warehouse === profileWh && b.warehouse !== profileWh) return -1;
					if (b.warehouse === profileWh && a.warehouse !== profileWh) return 1;
				}
				return (b.available_qty || 0) - (a.available_qty || 0);
			});
		};

		if (selectedVariants.value.length > 0) {
			const itemCodes = selectedVariants.value.map((v) => v.item_code);
			const response = await call("pos_next.api.items.get_item_warehouse_availability", {
				item_codes: JSON.stringify(itemCodes),
				company: props.company,
				include_zero_stock:
					selectedVariants.value.length === 1 || settingsStore.canManageStock ? 1 : 0,
				pos_profile: props.posProfile || shiftStore.currentProfile,
			});
			warehouses.value = sortWithProfileWarehouseFirst(response || []);
		} else {
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

	const targetWarehouse = w.warehouse || w.name;
	const profileWh = shiftStore.profileWarehouse || shiftStore.currentProfile?.warehouse || "";
	const availQty = Number(w.available_qty ?? w.actual_qty ?? 0);

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
		warehouse: targetWarehouse,
		actual_qty: availQty,
		stock_qty: availQty,
		original_stock: availQty,
		warehouse_stock_qty: availQty,
		is_external_warehouse: Boolean(profileWh && targetWarehouse && targetWarehouse !== profileWh),
	};

	try {
		cartStore.addItem(itemToSell, 1, true, shiftStore.currentProfile);
		closeDialog();
	} catch (err) {
		console.error("Error adding item to cart from warehouse:", err);
		showError(err.message || __("No se pudo agregar el producto al carrito"));
	}
}

function applyStockBinUpdates(updatedBins) {
	if (!Array.isArray(updatedBins) || updatedBins.length === 0) return;

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

	for (const bin of updatedBins) {
		const vTarget = variants.value.find((v) => v.item_code === bin.item_code);
		if (vTarget && (!vTarget.warehouse || !bin.warehouse || vTarget.warehouse === bin.warehouse)) {
			vTarget.actual_qty = bin.actual_qty;
			if (bin.other_qty !== undefined) {
				vTarget.other_qty = bin.other_qty;
			}
		}
	}

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
			warehouse: b.warehouse,
			actual_qty: b.actual_qty,
			other_qty: b.other_qty,
			variants_total: b.variants_total,
			variants_in_stock: b.variants_in_stock,
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
					if (upd.other_qty !== undefined) {
						target.other_qty = upd.other_qty;
					}
					if (upd.variants_total !== undefined) {
						target.variants_total = upd.variants_total;
					}
					if (upd.variants_in_stock !== undefined) {
						target.variants_in_stock = upd.variants_in_stock;
					}
				}
			}
		};
		updateItemArrQty(itemSearchStore.allItems);
		updateItemArrQty(itemSearchStore.searchResults);
		itemSearchStore.invalidateCache();
	}

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

	if (isSearchMode.value) {
		loadInventoryReport();
	}
}

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
	}
}

function toggleInvSort(key) {
	if (key === "display_qty") {
		if (invSortKey.value === "status_grouped") {
			invSortKey.value = "display_qty";
			invSortDir.value = "desc";
		} else if (invSortKey.value === "display_qty" && invSortDir.value === "desc") {
			invSortDir.value = "asc";
		} else {
			invSortKey.value = "status_grouped";
			invSortDir.value = "desc";
		}
		invCurrentPage.value = 1;
		return;
	}
	if (invSortKey.value === key) {
		invSortDir.value = invSortDir.value === "asc" ? "desc" : "asc";
	} else {
		invSortKey.value = key;
		invSortDir.value = "asc";
	}
	invCurrentPage.value = 1;
}

function shouldShowExtraMedida(row) {
	const medida = String(row?.custom_medida || "").trim();
	if (!medida) return false;
	const itemName = String(row?.item_name || "").toLowerCase();
	const coreMedida = medida.replace(/\s*cm$/i, "").toLowerCase();
	return !itemName.includes(coreMedida);
}

function cleanWarehouseName(name) {
	return (name || "").replace(/\s*-\s*[A-Z0-9]+$/i, "");
}

const invWarehouseOptions = computed(() => [
	{ label: __("Almacén: Todos"), value: "" },
	...(inventoryWarehouses.value || []).map((wh) => ({
		label: wh.warehouse_name || wh.warehouse,
		value: wh.warehouse,
	})),
]);

const invGroupOptions = computed(() => [
	{ label: __("Categoría: Todas"), value: "" },
	...(inventoryGroups.value || []).map((grp) => ({
		label: grp,
		value: grp,
	})),
]);

const batchWarehouseOptions = computed(() =>
	(availableCompanyWarehouses.value || []).map((wh) => ({
		label: wh.warehouse_name || wh.warehouse || wh.name,
		value: wh.warehouse || wh.name,
	}))
);

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
		inventoryCompany.value =
			data.company || props.company || shiftStore.profileCompany || __("Empresa");
		inventoryDefaultThreshold.value =
			Number(data.default_low_stock_threshold) || settingsStore.lowStockThreshold || 10;
		if (data.can_view_cost_price !== undefined) {
			serverCanViewCostPrice.value = Boolean(data.can_view_cost_price);
			if (!serverCanViewCostPrice.value) {
				showCostPrice.value = false;
				if (invSortKey.value === "cost_rate") {
					invSortKey.value = "status_grouped";
				}
			}
		}
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

	return (inventoryReportItems.value || [])
		.filter((it) => {
			if (!whFilter) return true;
			const whQty = Number(it.by_warehouse?.[whFilter] ?? 0);
			return it.warehouse === whFilter || whQty !== 0;
		})
		.map((it) => {
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

	const filtered = enrichedInventoryRows.value.filter((row) => {
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

	const statusRank = { safe: 1, low: 2, out: 3 };
	const sortKey = invSortKey.value;
	const dirMultiplier = invSortDir.value === "asc" ? 1 : -1;

	return [...filtered].sort((a, b) => {
		if (sortKey === "status_grouped") {
			const rankDiff = (statusRank[a.stock_level] || 2) - (statusRank[b.stock_level] || 2);
			if (rankDiff !== 0) return rankDiff;
			const grpDiff = (a.item_group || "").localeCompare(b.item_group || "", "es");
			if (grpDiff !== 0) return grpDiff;
			return (a.item_name || "").localeCompare(b.item_name || "", "es");
		}
		if (sortKey === "display_qty" || sortKey === "selling_rate" || sortKey === "cost_rate") {
			const diff = Number(a[sortKey] || 0) - Number(b[sortKey] || 0);
			if (diff !== 0) return diff * dirMultiplier;
			return (a.item_name || "").localeCompare(b.item_name || "", "es");
		}
		const strDiff = String(a[sortKey] || "").localeCompare(String(b[sortKey] || ""), "es");
		if (strDiff !== 0) return strDiff * dirMultiplier;
		return (a.item_name || "").localeCompare(b.item_name || "", "es");
	});
});

const invTotalPages = computed(() =>
	Math.ceil(filteredInventoryItems.value.length / INV_PAGE_SIZE) || 1
);

const paginatedInventoryItems = computed(() => {
	const start = (invCurrentPage.value - 1) * INV_PAGE_SIZE;
	return filteredInventoryItems.value.slice(start, start + INV_PAGE_SIZE);
});

watch([searchQuery, invWarehouseFilter, invGroupFilter, invStatusFilter], () => {
	invCurrentPage.value = 1;
});

const inventorySummary = computed(() => {
	let totalUnits = 0;
	let lowStockCount = 0;
	let outOfStockCount = 0;
	let totalCostValue = 0;
	let totalSellingValue = 0;

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

	const includeCost = Boolean(effectiveShowCostPrice.value);
	const companyTitle =
		inventoryCompany.value || props.company || shiftStore.profileCompany || __("Empresa");
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
		low: "Stock Bajo",
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
					<td>
						<strong>${escapeHtml(r.item_name)}</strong>${
							shouldShowExtraMedida(r)
								? ` <span style="color:#475569;font-size:10px;">(${escapeHtml(r.custom_medida)})</span>`
								: ""
						}
					</td>
					<td>${escapeHtml(r.item_group)}</td>
					<td>${escapeHtml(cleanWarehouseName(r.display_warehouse_name))}</td>
					${
						includeCost
							? `<td style="text-align:right;white-space:nowrap;">Bs. ${Number(r.cost_rate || 0).toFixed(2)}</td>`
							: ""
					}
					<td style="text-align:right;font-weight:600;white-space:nowrap;">Bs. ${Number(r.selling_rate || 0).toFixed(2)}</td>
					<td style="text-align:center;font-weight:800;font-size:11.5px;">${qty}</td>
					<td style="text-align:center;font-size:9.5px;">${statusBadge}</td>
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
		@page { size: letter portrait; margin: 9mm 10mm; }
		body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; font-size: 10.5px; margin: 0; padding: 0; }
		.header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1e293b; padding-bottom: 7px; margin-bottom: 8px; }
		.title { font-size: 16px; font-weight: 800; margin: 0; color: #0f172a; }
		.subtitle { font-size: 11px; font-weight: 600; color: #334155; margin: 2px 0 0 0; }
		.meta { text-align: right; font-size: 9.5px; color: #475569; line-height: 1.35; }
		.filters-bar { display: flex; flex-wrap: wrap; gap: 12px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 5px; padding: 6px 10px; margin-bottom: 8px; font-size: 10px; }
		table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
		th { background: #1e293b; color: #ffffff; font-size: 9.5px; text-transform: uppercase; padding: 4.5px 6px; text-align: left; border: 1px solid #1e293b; }
		td { padding: 3.5px 6px; border: 1px solid #cbd5e1; vertical-align: middle; line-height: 1.25; }
		tr:nth-child(even) td { background: #f8fafc; }
		.signatures { display: flex; justify-content: space-around; margin-top: 28px; text-align: center; font-size: 10.5px; color: #334155; page-break-inside: avoid; }
		.sig-line { width: 190px; border-top: 1px solid #334155; padding-top: 4px; }
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
				<th style="width:24px;text-align:center;">#</th>
				<th>Producto / Medida</th>
				<th style="width:118px;">Categoría</th>
				<th style="width:115px;">Almacén</th>
				${includeCost ? '<th style="width:74px;text-align:right;">Costo Fáb.</th>' : ""}
				<th style="width:76px;text-align:right;">Precio Venta</th>
				<th style="width:52px;text-align:center;">Cant.</th>
				<th style="width:50px;text-align:center;">Estado</th>
				<th style="width:62px;text-align:center;">Físico</th>
			</tr>
		</thead>
		<tbody>
			${tableRowsHtml}
		</tbody>
		<tfoot>
			<tr style="background:#e2e8f0;font-weight:800;border-top:2px solid #1e293b;">
				<td colspan="3" style="text-align:left;text-transform:uppercase;font-size:10px;color:#0f172a;">
					TOTAL INVENTARIO (${rows.length} prod.)
				</td>
				<td style="text-align:right;text-transform:uppercase;font-size:9.5px;color:#334155;">
					TOTALES:
				</td>
				${
					includeCost
						? `<td style="text-align:right;white-space:nowrap;">Bs. ${inventorySummary.value.totalCostValue.toFixed(2)}</td>`
						: ""
				}
				<td style="text-align:right;white-space:nowrap;">Bs. ${inventorySummary.value.totalSellingValue.toFixed(2)}</td>
				<td style="text-align:center;white-space:nowrap;">${inventorySummary.value.totalUnits} uds</td>
				<td colspan="2"></td>
			</tr>
		</tfoot>
	</table>

	<div class="signatures">
		<div class="sig-line">Responsable de Almacén</div>
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

// Product Catalog (Create / Edit)
const filteredCatalogItems = computed(() => {
	const list = itemSearchStore.allItems || [];
	const q = (catalogSearchQuery.value || "").trim().toLowerCase();
	const grp = catalogGroupFilter.value;
	return list.filter((it) => {
		if (grp && it.item_group !== grp) return false;
		if (!q) return true;
		return (
			(it.item_name || "").toLowerCase().includes(q) ||
			(it.item_code || "").toLowerCase().includes(q) ||
			(it.item_group || "").toLowerCase().includes(q) ||
			(it.custom_medida || "").toLowerCase().includes(q)
		);
	});
});

const catalogTotalPages = computed(() =>
	Math.ceil(filteredCatalogItems.value.length / CATALOG_PAGE_SIZE) || 1
);

const paginatedCatalogItems = computed(() => {
	const start = (catalogCurrentPage.value - 1) * CATALOG_PAGE_SIZE;
	return filteredCatalogItems.value.slice(start, start + CATALOG_PAGE_SIZE);
});

watch([catalogSearchQuery, catalogGroupFilter], () => {
	catalogCurrentPage.value = 1;
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

async function handleCatalogItemSaved({ item, archivedItemCode }) {
	const activeProfile = props.posProfile || shiftStore.profileName;
	if (archivedItemCode) {
		await itemSearchStore.upsertCatalogItem(
			{ item_code: archivedItemCode, disabled: 1 },
			null
		);
	}
	await itemSearchStore.upsertCatalogItem(item, activeProfile);
	loadInventoryReport();

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

	if (
		(selectedItemCode.value || props.itemCode) &&
		item?.item_code === (selectedItemCode.value || props.itemCode)
	) {
		selectedItemName.value = item.item_name;
		if (item.image) {
			selectedItemImage.value = item.image;
		}
		await loadAvailability();
	}
}

// Quick Stock Adjustment
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
		showError(
			`No puede descontar más de las ${Math.floor(warehouse.actual_qty || 0)} unidades disponibles.`
		);
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

// Batch Receipt Handlers
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

function handleBatchSearchInput(val) {
	if (batchSearchDebounce) {
		clearTimeout(batchSearchDebounce);
	}
	const q = String(val ?? batchSearchQuery.value ?? "").trim();
	if (q.length < 1) {
		batchSearchResults.value = [];
		return;
	}
	batchSearchDebounce = setTimeout(async () => {
		try {
			const res = await call("pos_next.api.items.get_items", {
				pos_profile: props.posProfile || shiftStore.profileName,
				search_term: q,
				include_variants: 1,
				start: 0,
				limit: 15,
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

// Stock Entry History Handlers
const historyTotalPages = computed(() =>
	Math.ceil(stockEntriesHistory.value.length / HISTORY_PAGE_SIZE) || 1
);

const paginatedHistoryEntries = computed(() => {
	const start = (historyCurrentPage.value - 1) * HISTORY_PAGE_SIZE;
	return stockEntriesHistory.value.slice(start, start + HISTORY_PAGE_SIZE);
});

function isHistoryExpanded(name) {
	return Boolean(name && expandedHistoryIds.value.has(name));
}

function toggleHistoryDetail(name) {
	if (!name) return;
	const next = new Set(expandedHistoryIds.value);
	if (next.has(name)) {
		next.delete(name);
	} else {
		next.add(name);
	}
	expandedHistoryIds.value = next;
}

function buildHistoryDetailRows(entry) {
	return (entry?.items || []).map((it, idx) => ({
		_rowKey: `${entry.name}-${idx}`,
		line_no: idx + 1,
		item_name: it.item_name || it.item_code || "—",
		qty_display: `${it.direction === "in" ? "+" : "−"}${Math.floor(it.qty || 0)}`,
	}));
}

function getHistoryTotalUnits(entry) {
	const total = (entry?.items || []).reduce((acc, it) => acc + Math.floor(it.qty || 0), 0);
	const sign = entry?.purpose === "Material Receipt" ? "+" : "";
	return `${sign}${total} uds`;
}

async function loadStockEntriesHistory() {
	loadingHistory.value = true;
	cancellingEntryName.value = null;
	cancelReason.value = "";
	expandedHistoryIds.value = new Set();
	historyCurrentPage.value = 1;
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

// Unified Active Tab Pagination Bridge for Footer
const activePaginationState = computed(() => {
	if (!isSearchMode.value) {
		return { currentPage: 1, totalPages: 1, totalCount: 0 };
	}
	if (activeTab.value === "lookup" && !selectedItemCode.value && !showVariantSelection.value) {
		return {
			currentPage: invCurrentPage.value,
			totalPages: invTotalPages.value,
			totalCount: filteredInventoryItems.value.length,
		};
	}
	if (activeTab.value === "catalog") {
		return {
			currentPage: catalogCurrentPage.value,
			totalPages: catalogTotalPages.value,
			totalCount: filteredCatalogItems.value.length,
		};
	}
	if (activeTab.value === "history") {
		return {
			currentPage: historyCurrentPage.value,
			totalPages: historyTotalPages.value,
			totalCount: stockEntriesHistory.value.length,
		};
	}
	return { currentPage: 1, totalPages: 1, totalCount: 0 };
});

function setActivePage(page) {
	const clamped = Math.max(1, Math.min(activePaginationState.value.totalPages, page));
	if (activeTab.value === "lookup") {
		invCurrentPage.value = clamped;
	} else if (activeTab.value === "catalog") {
		catalogCurrentPage.value = clamped;
	} else if (activeTab.value === "history") {
		historyCurrentPage.value = clamped;
	}
}

function formatPrice(price) {
	if (!price) return "";
	const num = Number(price);
	if (isNaN(num)) return "";
	return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
</script>

<style scoped>
.dialog-full-search :deep(.mdx-search),
.dialog-variant-search :deep(.mdx-search) {
	max-width: none;
}

.dialog-variant-search :deep(.mdx-search__input) {
	height: 32px;
}

.pos-wh-canvas {
	background-color: #eef2f6;
}

.pos-wh-card {
	background-color: #ffffff;
	border: 1px solid #cbd5e1;
	border-left: 4px solid #2563eb;
	border-radius: 0.875rem;
	box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04);
	transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.pos-wh-card--empty {
	border-left-color: #94a3b8;
}

.pos-wh-card--cancelled {
	background-color: #f8fafc;
	border-left-color: #94a3b8;
	box-shadow: none;
}

.inv-subtable :deep(.mdx-table-scroll) {
	background-color: #ffffff;
}

.inv-subtable :deep(.mdx-table__row) {
	cursor: default;
}

.inv-subtable :deep(.mdx-table__row:last-child .mdx-table__td) {
	border-bottom: none;
}
</style>
