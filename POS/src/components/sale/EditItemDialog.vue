<template>
	<MdxModal
		v-model="show"
		:title="__('Edit Item Details')"
		:size="dialogSize"
		:bodyClass="isCompactViewport ? '!p-3 sm:!p-4' : '!p-4 sm:!p-5'"
	>
		<template v-if="localItem" #header-actions>
			<div class="hidden sm:flex items-center gap-2">
				<span
					v-if="localItem.item_code && localItem.item_code !== localItem.item_name"
					class="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-mono font-semibold text-slate-700"
				>
					{{ localItem.item_code }}
				</span>
				<span
					v-if="localItem.is_stock_item"
					class="px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-semibold tabular-nums"
					:class="availableStockQty > 0 ? 'text-slate-700' : 'text-red-600'"
				>
					{{ currentWarehouseLabel }}: {{ availableStockSummary }}
				</span>
			</div>
		</template>

		<!-- Body Content -->
		<div v-if="localItem" class="h-full flex flex-col gap-3">
			<!-- Compact Item Identity Strip + Dynamic Multi-UOM / Multi-Warehouse Selectors (only when >1 option) -->
			<div
				class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-2.5 border-b border-slate-200 shrink-0"
			>
				<div class="flex items-center gap-3 min-w-0 flex-1">
					<!-- Item Image -->
					<div
						class="w-11 h-11 bg-slate-50 border border-slate-200 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden"
					>
						<img
							v-if="localItem.image"
							:src="localItem.image"
							:alt="localItem.item_name"
							class="w-full h-full object-cover"
						/>
						<svg
							v-else
							class="h-5 w-5 text-slate-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
							/>
						</svg>
					</div>

					<!-- Item Name & Contextual Equivalence / List Price -->
					<div class="min-w-0 flex-1">
						<h3 class="text-sm sm:text-base font-bold text-slate-900 truncate">
							{{ localItem.item_name }}
						</h3>
						<div
							class="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-0.5 text-xs text-slate-500 tabular-nums"
						>
							<span v-if="hasCoverageCalculator" class="font-semibold text-slate-700">
								1 {{ currentUnitLabel }} = {{ formatArea(coveragePerUnit) }}
								{{ settingsStore.coverageUom }}
							</span>
							<span v-if="hasCoverageCalculator" class="text-slate-300 select-none">|</span>
							<span v-if="hasCoverageCalculator">
								{{ __("List:") }} {{ formatCurrency(listCoverageRate) }} /
								{{ settingsStore.coverageUom }} ({{ formatCurrency(originalPriceListRate) }} /
								{{ currentUnitLabel }})
							</span>
							<span v-else>
								{{ __("List:") }} {{ formatCurrency(originalPriceListRate) }} /
								{{ currentUnitLabel }}
							</span>
							<span
								v-if="localItem.is_stock_item"
								class="sm:hidden font-semibold"
								:class="availableStockQty > 0 ? 'text-slate-700' : 'text-red-600'"
							>
								· {{ availableStockSummary }}
							</span>
						</div>
					</div>
				</div>

				<!-- Dynamic UOM / Warehouse Selectors ONLY when multiple options actually exist -->
				<div
					v-if="showUomSelector || showWarehouseSelector"
					class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 lg:w-auto lg:min-w-[320px] shrink-0"
				>
					<div v-if="showUomSelector">
						<label class="block text-[11px] font-bold text-slate-600 mb-1 text-start">
							{{ __("UOM") }}
						</label>
						<MdxSelect
							v-model="localUom"
							:options="uomOptions"
							size="sm"
							:showSearch="false"
							:teleport="true"
						/>
					</div>
					<div v-if="showWarehouseSelector">
						<label class="block text-[11px] font-bold text-slate-600 mb-1 text-start">
							{{ __("Warehouse") }}
						</label>
						<MdxSelect
							v-model="localWarehouse"
							:options="warehouseOptions"
							size="sm"
							:showSearch="warehouseOptions.length > 5"
							:teleport="true"
							@update:modelValue="handleWarehouseChange"
						/>
					</div>
				</div>
			</div>

			<!-- ========================================================================= -->
			<!-- ROW 1: PRIMARY CONTROLS (1. Quantity & Coverage  |  2. Selling Price)     -->
			<!-- ========================================================================= -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-stretch shrink-0">
				<!-- BLOCK 1: QUANTITY & COVERAGE -->
				<div
					class="bg-slate-50/70 border border-slate-200 rounded-2xl p-3.5 flex flex-col justify-between gap-2.5"
				>
					<div class="flex items-center justify-between gap-2">
						<div class="min-w-0">
							<h4 class="text-xs sm:text-[13px] font-bold text-slate-900">
								1. {{ __("Quantity to Sell") }}
							</h4>
							<p class="text-[11px] text-slate-500 mt-0.5">
								<template v-if="hasCoverageCalculator">
									{{
										__("Enter {0} or surface in {1}; the other calculates automatically.", [
											currentUnitLabel,
											settingsStore.coverageUom,
										])
									}}
								</template>
								<template v-else>
									{{ __("Specify the quantity in {0}.", [currentUnitLabel]) }}
								</template>
							</p>
						</div>
						<span
							v-if="localItem?.is_resolved_barcode"
							class="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-700 shrink-0"
						>
							{{ __("Locked") }}
						</span>
					</div>

					<!-- Paired Inputs when Coverage Calculator is Active (Units = Coverage Area) -->
					<div
						v-if="hasCoverageCalculator"
						class="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-end gap-2.5"
					>
						<!-- Primary Unit Stepper -->
						<div>
							<label class="block text-xs font-semibold text-slate-700 mb-1 text-start">
								{{ __("Quantity in {0}", [currentUnitLabel]) }}
							</label>
							<div
								v-if="localItem?.has_serial_no && localSerials.length > 0"
								class="w-full h-10 border border-slate-200 rounded-xl bg-white flex items-center justify-center"
							>
								<span class="text-sm font-bold text-slate-700 tabular-nums">{{
									localSerials.length
								}}</span>
							</div>
							<div
								v-else-if="localItem?.is_resolved_barcode"
								class="w-full h-10 border border-amber-200 rounded-xl bg-amber-50 flex items-center justify-center"
							>
								<span class="text-sm font-bold text-amber-700 tabular-nums">{{
									localQuantity
								}}</span>
							</div>
							<div
								v-else
								class="w-full h-10 border border-slate-300 rounded-xl bg-white flex items-center overflow-hidden shadow-2xs"
							>
								<button
									type="button"
									@click="decrementQuantity"
									class="w-10 h-full bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 font-bold text-base transition-colors flex items-center justify-center border-e border-slate-200 touch-manipulation"
								>
									−
								</button>
								<div class="flex-1 h-full flex items-center justify-center px-2">
									<input
										v-model.number="localQuantity"
										type="number"
										min="1"
										step="1"
										inputmode="numeric"
										class="w-full text-center border-0 text-sm sm:text-base font-bold text-slate-900 focus:outline-none focus:ring-0 bg-transparent tabular-nums"
										@input="handleQuantityInput"
										@blur="handleQuantityBlur"
										@keydown.enter="$event.target.blur()"
									/>
								</div>
								<button
									type="button"
									@click="incrementQuantity"
									class="w-10 h-full bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 font-bold text-base transition-colors flex items-center justify-center border-s border-slate-200 touch-manipulation"
								>
									+
								</button>
							</div>
						</div>

						<!-- Equality Visual Connector -->
						<div
							class="hidden sm:flex items-center justify-center h-10 text-slate-400 font-extrabold text-base select-none px-0.5"
							aria-hidden="true"
						>
							=
						</div>

						<!-- Equivalent / Requested Surface Area Input -->
						<div>
							<label class="block text-xs font-semibold text-slate-700 mb-1 text-start">
								{{ __("Surface ({0})", [settingsStore.coverageUom]) }}
							</label>
							<div class="relative h-10">
								<input
									v-model.number="localRequiredArea"
									type="number"
									min="0"
									step="0.01"
									inputmode="decimal"
									:disabled="Boolean(localItem?.is_resolved_barcode)"
									class="w-full h-10 bg-white border border-slate-300 rounded-xl px-3 pe-12 text-sm sm:text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 tabular-nums shadow-2xs"
									@input="handleAreaInput"
								/>
								<span
									class="absolute inset-y-0 end-0 pe-3 flex items-center text-slate-400 text-xs font-bold pointer-events-none"
								>
									{{ settingsStore.coverageUom }}
								</span>
							</div>
						</div>
					</div>

					<!-- Standard Single Stepper when Coverage Calculator is Inactive -->
					<div v-else>
						<label class="block text-xs font-semibold text-slate-700 mb-1 text-start">
							{{ __("Quantity") }} ({{ currentUnitLabel }})
						</label>
						<div
							v-if="localItem?.has_serial_no && localSerials.length > 0"
							class="w-full h-10 border border-slate-200 rounded-xl bg-white flex items-center justify-center"
						>
							<span class="text-sm font-bold text-slate-700 tabular-nums">{{
								localSerials.length
							}}</span>
						</div>
						<div
							v-else-if="localItem?.is_resolved_barcode"
							class="w-full h-10 border border-amber-200 rounded-xl bg-amber-50 flex items-center justify-center"
						>
							<span class="text-sm font-bold text-amber-700 tabular-nums">{{
								localQuantity
							}}</span>
						</div>
						<div
							v-else
							class="w-full h-10 border border-slate-300 rounded-xl bg-white flex items-center overflow-hidden shadow-2xs"
						>
							<button
								type="button"
								@click="decrementQuantity"
								class="w-11 h-full bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 font-bold text-base transition-colors flex items-center justify-center border-e border-slate-200 touch-manipulation"
							>
								−
							</button>
							<div class="flex-1 h-full flex items-center justify-center px-2">
								<input
									v-model.number="localQuantity"
									type="number"
									min="0.0001"
									step="any"
									inputmode="decimal"
									class="w-full text-center border-0 text-sm sm:text-base font-bold text-slate-900 focus:outline-none focus:ring-0 bg-transparent tabular-nums"
									@input="handleQuantityInput"
									@blur="handleQuantityBlur"
									@keydown.enter="$event.target.blur()"
								/>
							</div>
							<button
								type="button"
								@click="incrementQuantity"
								class="w-11 h-full bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 font-bold text-base transition-colors flex items-center justify-center border-s border-slate-200 touch-manipulation"
							>
								+
							</button>
						</div>
					</div>

					<!-- Integer Unit Rounding Suggestions with explicit coverage delta -->
					<div v-if="hasCoverageCalculator && boxRoundingOptions.length === 2" class="space-y-1.5">
						<p class="text-[11px] font-semibold text-slate-600">
							{{
								__("Choose whole {0} to cover {1} {2}:", [
									currentUnitLabel,
									formatArea(pendingAreaTarget),
									settingsStore.coverageUom,
								])
							}}
						</p>
						<div class="grid grid-cols-2 gap-2">
							<button
								v-for="opt in boxRoundingOptions"
								:key="opt.units"
								type="button"
								@click="applyRoundedBoxes(opt.units)"
								:class="
									localQuantity === opt.units
										? 'bg-slate-900 border-slate-900 text-white'
										: 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
								"
								class="px-3 py-1.5 rounded-xl border text-start transition-colors touch-manipulation flex items-center justify-between gap-2 cursor-pointer"
							>
								<span class="text-xs font-bold tabular-nums">
									{{ opt.units }} {{ currentUnitLabel }}
								</span>
								<span
									:class="
										localQuantity === opt.units ? 'text-slate-300' : 'text-slate-500'
									"
									class="text-[11px] font-medium tabular-nums"
								>
									{{ formatArea(opt.area) }} {{ settingsStore.coverageUom }}
									({{ opt.delta >= 0 ? "+" : "" }}{{ formatArea(opt.delta) }})
								</span>
							</button>
						</div>
					</div>

					<!-- Universal Live Stock Exceeded Warning + 1-Click Adjust Button -->
					<div
						v-if="isExceedingStock"
						class="flex flex-wrap items-center justify-between gap-2 bg-red-50/90 border border-red-200 rounded-xl px-3 py-2"
					>
						<div class="flex items-center gap-2 min-w-0">
							<svg
								class="w-4 h-4 text-red-600 shrink-0"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								stroke-width="2"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
								/>
							</svg>
							<span class="text-[11px] font-semibold text-red-800 leading-tight">
								{{
									__("Exceeds available stock by {0} {1}", [
										formatArea(stockShortfallQty),
										currentUnitLabel,
									])
								}}
								<template v-if="hasCoverageCalculator">
									({{ formatArea(stockShortfallArea) }} {{ settingsStore.coverageUom }})
								</template>
							</span>
						</div>
						<button
							v-if="maxAvailableWholeUnits > 0 && !localItem?.is_resolved_barcode"
							type="button"
							@click="adjustToMaxAvailableStock"
							class="px-2.5 py-1 rounded-lg bg-white border border-red-200 hover:bg-red-100 text-[11px] font-bold text-red-700 transition-colors cursor-pointer shrink-0"
						>
							{{
								__("Adjust to max ({0})", [
									`${maxAvailableWholeUnits} ${currentUnitLabel}`,
								])
							}}
						</button>
					</div>
				</div>

				<!-- BLOCK 2: SELLING PRICE, TARGET TOTAL NEGOTIATION & OPTIONAL DISCOUNT -->
				<div
					class="bg-slate-50/70 border border-slate-200 rounded-2xl p-3.5 flex flex-col justify-between gap-2.5"
				>
					<div class="flex items-center justify-between gap-2">
						<div class="min-w-0">
							<h4 class="text-xs sm:text-[13px] font-bold text-slate-900">
								2. {{ __("Selling Price") }}
							</h4>
							<p class="text-[11px] text-slate-500 mt-0.5">
								<template v-if="hasCoverageCalculator && canEditRate">
									{{
										__("Edit the price per {0} or per {1}; both stay synchronized.", [
											settingsStore.coverageUom,
											currentUnitLabel,
										])
									}}
								</template>
								<template v-else-if="canEditRate">
									{{ __("Adjust the unit selling price if needed.") }}
								</template>
								<template v-else>
									{{ rateEditDisabledReason }}
								</template>
							</p>
						</div>
						<div class="flex items-center gap-1.5 shrink-0">
							<button
								v-if="canEditRate && isPriceModified"
								type="button"
								@click="resetToListPrice"
								class="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[11px] font-semibold text-slate-700 transition-colors cursor-pointer"
							>
								{{ __("Reset to list") }}
							</button>
							<span
								v-if="hasPricingRules && settingsStore.allowUserToEditRate"
								class="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-700 flex items-center gap-1"
							>
								<FeatherIcon name="lock" class="w-3 h-3" />
								{{ __("Locked (offer applied)") }}
							</span>
						</div>
					</div>

					<!-- Paired Bidirectional Price Inputs when Coverage Calculator is Active -->
					<div
						v-if="hasCoverageCalculator"
						class="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-end gap-2.5"
					>
						<!-- Price per Coverage UOM -->
						<div>
							<label class="block text-xs font-semibold text-slate-700 mb-1 text-start">
								{{ __("Price per {0}", [settingsStore.coverageUom]) }}
							</label>
							<div class="relative h-10">
								<span
									class="absolute inset-y-0 start-0 ps-3 flex items-center text-slate-400 text-xs font-bold pointer-events-none"
								>
									{{ currencySymbol }}
								</span>
								<input
									v-model.number="localCoverageRate"
									type="number"
									min="0"
									step="0.01"
									inputmode="decimal"
									:readonly="!canEditRate"
									:class="
										canEditRate
											? 'bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
											: 'bg-slate-100 text-slate-500 cursor-not-allowed'
									"
									class="w-full h-10 border border-slate-300 rounded-xl ps-10 pe-3 text-sm sm:text-base font-bold text-slate-900 tabular-nums shadow-2xs"
									:title="rateEditDisabledReason"
									@input="handleCoverageRateInput"
								/>
							</div>
						</div>

						<!-- Bidirectional SVG Connector -->
						<div
							class="hidden sm:flex items-center justify-center h-10 text-slate-400 px-0.5"
							aria-hidden="true"
						>
							<svg
								class="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								stroke-width="2"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M7 16l-4-4m0 0l4-4m-4 4h18m-4 4l4-4m0 0l-4-4"
								/>
							</svg>
						</div>

						<!-- Price per Primary Unit -->
						<div>
							<label class="block text-xs font-semibold text-slate-700 mb-1 text-start">
								{{ __("Price per {0}", [currentUnitLabel]) }}
							</label>
							<div class="relative h-10">
								<span
									class="absolute inset-y-0 start-0 ps-3 flex items-center text-slate-400 text-xs font-bold pointer-events-none"
								>
									{{ currencySymbol }}
								</span>
								<input
									v-model.number="localRate"
									type="number"
									min="0"
									step="0.01"
									inputmode="decimal"
									:readonly="!canEditRate"
									:class="
										canEditRate
											? 'bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
											: 'bg-slate-100 text-slate-500 cursor-not-allowed'
									"
									class="w-full h-10 border border-slate-300 rounded-xl ps-10 pe-3 text-sm sm:text-base font-bold text-slate-900 tabular-nums shadow-2xs"
									:title="rateEditDisabledReason"
									@input="handleBoxRateInput"
								/>
							</div>
						</div>
					</div>

					<!-- Standard Unit Rate Input when Coverage Calculator is Inactive -->
					<div v-else>
						<label class="block text-xs font-semibold text-slate-700 mb-1 text-start">
							{{ __("Price per {0}", [currentUnitLabel]) }}
						</label>
						<div class="relative h-10">
							<span
								class="absolute inset-y-0 start-0 ps-3 flex items-center text-slate-400 text-xs font-bold pointer-events-none"
							>
								{{ currencySymbol }}
							</span>
							<input
								v-model.number="localRate"
								type="number"
								min="0"
								step="0.01"
								inputmode="decimal"
								:readonly="!canEditRate"
								:class="
									canEditRate
										? 'bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
										: 'bg-slate-100 text-slate-500 cursor-not-allowed'
								"
								class="w-full h-10 border border-slate-300 rounded-xl ps-10 pe-3 text-sm sm:text-base font-bold text-slate-900 tabular-nums shadow-2xs"
								:title="rateEditDisabledReason"
								@input="handleBoxRateInput"
							/>
						</div>
					</div>

					<!-- Universal Negotiation Row: Target Closed Line Total + Collapsible Discount -->
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-end">
						<div v-if="canEditRate">
							<label class="block text-[11px] font-semibold text-slate-600 mb-1 text-start">
								{{ __("Target line total (negotiated)") }}
							</label>
							<div class="relative h-9">
								<span
									class="absolute inset-y-0 start-0 ps-3 flex items-center text-slate-400 text-xs font-bold pointer-events-none"
								>
									{{ currencySymbol }}
								</span>
								<input
									v-model.number="targetLineTotal"
									type="number"
									min="0"
									step="0.01"
									inputmode="decimal"
									class="w-full h-9 bg-white border border-slate-200 rounded-xl ps-10 pe-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 tabular-nums"
									@input="handleTargetTotalInput"
								/>
							</div>
						</div>

						<!-- Collapsible Optional Discount -->
						<div v-if="settingsStore.allowItemDiscount" :class="{ 'sm:col-span-2': !canEditRate }">
							<div
								v-if="!showDiscountSection && (!discountValue || discountValue <= 0)"
								class="h-9 flex items-center justify-between bg-white border border-slate-200/80 rounded-xl px-3"
							>
								<span class="text-xs text-slate-500">{{ __("Item Discount") }}</span>
								<button
									type="button"
									@click="showDiscountSection = true"
									class="text-xs font-semibold text-slate-700 hover:text-slate-950 underline underline-offset-2 cursor-pointer"
								>
									+ {{ __("Add discount") }}
								</button>
							</div>
							<div v-else class="flex items-center gap-1.5">
								<div class="w-28 shrink-0">
									<MdxSelect
										v-model="discountType"
										:options="discountTypeOptions"
										size="sm"
										:showSearch="false"
										:teleport="true"
										@update:modelValue="handleDiscountTypeChange"
									/>
								</div>
								<div class="relative h-9 flex-1 min-w-0">
									<input
										v-model.number="discountValue"
										type="number"
										min="0"
										:max="discountType === 'percentage' ? 100 : undefined"
										step="0.01"
										class="w-full h-9 bg-white border border-slate-200 rounded-xl px-2.5 pe-7 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 tabular-nums"
										@input="calculateDiscount"
									/>
									<span
										class="absolute inset-y-0 end-0 pe-2.5 flex items-center text-slate-400 text-xs font-bold pointer-events-none"
									>
										{{ discountType === "percentage" ? "%" : currencySymbol }}
									</span>
								</div>
								<button
									type="button"
									@click="clearAndHideDiscount"
									class="h-9 px-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer shrink-0"
									:title="__('Remove')"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
					</div>
				</div>
			</div>

			<!-- ========================================================================= -->
			<!-- ROW 2: ASSISTANT & LIVE COMMERCIAL SUMMARY (Fills Full Screen, Zero Scroll)-->
			<!-- ========================================================================= -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-stretch flex-1 min-h-0">
				<!-- BLOCK 3: COVERAGE DIMENSIONS & WASTE ASSISTANT (Opt-in via enable_coverage_calculator) -->
				<div
					v-if="hasCoverageCalculator"
					class="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-col justify-between gap-3 min-h-0"
				>
					<div class="flex flex-col gap-3 min-h-0 flex-1">
						<div class="flex items-center justify-between gap-2">
							<div>
								<h4 class="text-xs sm:text-[13px] font-bold text-slate-900">
									3. {{ __("Area & Waste Assistant") }} ({{ __("Optional") }})
								</h4>
								<p class="text-[11px] text-slate-500 mt-0.5">
									{{
										__(
											"Add cutting margin or calculate total {0} from room dimensions.",
											[settingsStore.coverageUom]
										)
									}}
								</p>
							</div>
							<button
								v-if="hasActiveRooms || wastePercent > 0"
								type="button"
								@click="resetAssistant"
								class="text-[11px] font-semibold text-slate-500 hover:text-slate-900 underline underline-offset-2 cursor-pointer shrink-0"
							>
								{{ __("Clear") }}
							</button>
						</div>

						<!-- Waste / Margin Presets -->
						<div>
							<label class="block text-[11px] font-semibold text-slate-600 mb-1.5 text-start">
								{{ __("Cutting waste / extra margin:") }}
							</label>
							<div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
								<button
									v-for="preset in wastePresets"
									:key="preset.value"
									type="button"
									:disabled="Boolean(localItem?.is_resolved_barcode)"
									@click="applyWastePercent(preset.value)"
									:class="
										wastePercent === preset.value
											? 'bg-slate-900 border-slate-900 text-white'
											: 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
									"
									class="px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-colors cursor-pointer touch-manipulation disabled:opacity-50"
								>
									{{ preset.label }}
								</button>
							</div>
						</div>

						<!-- Multi-Room / Section Dimension Calculator (Length x Width) -->
						<div class="flex flex-col gap-1.5 min-h-0 flex-1">
							<div class="flex items-center justify-between">
								<label class="text-[11px] font-semibold text-slate-600">
									{{ __("Calculate by dimensions (Length × Width):") }}
								</label>
								<button
									v-if="roomDimensions.length < 6"
									type="button"
									:disabled="Boolean(localItem?.is_resolved_barcode)"
									@click="addRoomRow"
									class="text-[11px] font-bold text-slate-700 hover:text-slate-950 cursor-pointer disabled:opacity-50"
								>
									+ {{ __("Add space") }}
								</button>
							</div>

							<div class="flex flex-col gap-1.5 overflow-y-auto max-h-36 pe-0.5">
								<div
									v-for="(room, idx) in roomDimensions"
									:key="room.id"
									class="grid grid-cols-[1.1fr_0.9fr_auto_0.9fr_auto_auto] items-center gap-1.5"
								>
									<input
										v-model="room.label"
										type="text"
										:placeholder="__('Space {0}', [idx + 1])"
										class="h-8 bg-slate-50 border border-slate-200 rounded-lg px-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 min-w-0"
									/>
									<input
										v-model.number="room.length"
										type="number"
										min="0"
										step="0.01"
										inputmode="decimal"
										:placeholder="__('Length')"
										class="h-8 bg-white border border-slate-200 rounded-lg px-2 text-xs font-bold text-slate-900 text-center focus:outline-none focus:border-blue-500 tabular-nums min-w-0"
										@input="handleRoomsChange"
									/>
									<span class="text-slate-400 text-xs font-bold select-none">×</span>
									<input
										v-model.number="room.width"
										type="number"
										min="0"
										step="0.01"
										inputmode="decimal"
										:placeholder="__('Width')"
										class="h-8 bg-white border border-slate-200 rounded-lg px-2 text-xs font-bold text-slate-900 text-center focus:outline-none focus:border-blue-500 tabular-nums min-w-0"
										@input="handleRoomsChange"
									/>
									<span
										class="text-[11px] font-bold text-slate-700 tabular-nums text-end min-w-[54px]"
									>
										{{
											room.length > 0 && room.width > 0
												? `${formatArea(room.length * room.width)} ${settingsStore.coverageUom}`
												: "—"
										}}
									</span>
									<button
										v-if="roomDimensions.length > 1"
										type="button"
										@click="removeRoomRow(idx)"
										class="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
										:title="__('Remove')"
									>
										<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M6 18L18 6M6 6l12 12"
											/>
										</svg>
									</button>
									<span v-else class="w-7"></span>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- BLOCK 4: LIVE COMMERCIAL BREAKDOWN (Universal for ALL clients) -->
				<div
					:class="[
						'bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-col justify-between gap-2.5',
						!hasCoverageCalculator ? 'md:col-span-2' : '',
					]"
				>
					<div class="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
						<h4 class="text-xs sm:text-[13px] font-bold text-slate-900">
							{{ hasCoverageCalculator ? "4." : "3." }} {{ __("Commercial Line Summary") }}
						</h4>
						<MdxBadge
							v-if="localItem.is_stock_item"
							:variant="isExceedingStock ? 'danger' : 'success'"
							size="sm"
						>
							{{
								isExceedingStock
									? __("Short by {0} {1}", [
											formatArea(stockShortfallQty),
											currentUnitLabel,
										])
									: __("Stock available")
							}}
						</MdxBadge>
					</div>

					<div class="flex flex-col gap-2 text-xs flex-1 justify-center">
						<template v-if="hasCoverageCalculator">
							<div class="flex items-center justify-between gap-2">
								<span class="text-slate-500">{{ __("Net required surface:") }}</span>
								<span class="font-semibold text-slate-800 tabular-nums">
									{{ formatArea(effectiveNetArea) }} {{ settingsStore.coverageUom }}
								</span>
							</div>
							<div v-if="wastePercent > 0" class="flex items-center justify-between gap-2">
								<span class="text-slate-500">
									{{ __("Waste margin (+{0}%):", [wastePercent]) }}
								</span>
								<span class="font-semibold text-slate-800 tabular-nums">
									+{{ formatArea(wasteAreaAmount) }} {{ settingsStore.coverageUom }}
								</span>
							</div>
							<div class="flex items-center justify-between gap-2">
								<span class="text-slate-500">{{ __("Actual delivered coverage:") }}</span>
								<span class="font-bold text-slate-900 tabular-nums">
									{{ localQuantity }} {{ currentUnitLabel }} →
									{{ formatArea(effectiveCoverageArea) }} {{ settingsStore.coverageUom }}
								</span>
							</div>
							<div class="border-t border-slate-100 my-0.5"></div>
						</template>

						<div class="flex items-center justify-between gap-2">
							<span class="text-slate-500">{{ __("List price value:") }}</span>
							<span class="font-semibold text-slate-700 tabular-nums">
								{{ formatCurrency(listLineSubtotal) }}
							</span>
						</div>

						<div class="flex items-center justify-between gap-2">
							<span class="text-slate-500">{{ __("Price adjustment vs list:") }}</span>
							<span
								class="font-bold tabular-nums"
								:class="
									priceVarianceAmount < -0.01
										? 'text-emerald-700'
										: priceVarianceAmount > 0.01
											? 'text-slate-900'
											: 'text-slate-500'
								"
							>
								{{ priceVarianceLabel }}
							</span>
						</div>

						<div
							v-if="localItem.is_stock_item"
							class="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-100"
						>
							<span class="text-slate-500">
								{{ __("Availability in {0}:", [currentWarehouseLabel]) }}
							</span>
							<span
								class="font-bold tabular-nums"
								:class="isExceedingStock ? 'text-red-600' : 'text-slate-900'"
							>
								{{ availableStockSummary }}
							</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Serial Numbers Section (only for serialized items) -->
			<div
				v-if="localItem?.has_serial_no && localSerials.length > 0"
				class="bg-slate-50/70 border border-slate-200 rounded-2xl p-3 shrink-0"
			>
				<div class="flex items-center justify-between mb-2">
					<label class="block text-xs font-bold text-slate-700 text-start">
						{{ __("Serial Numbers") }}
					</label>
					<MdxBadge variant="neutral" size="sm">{{ localSerials.length }}</MdxBadge>
				</div>
				<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 max-h-24 overflow-y-auto">
					<div
						v-for="(serial, index) in localSerials"
						:key="serial"
						class="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-white border border-slate-200/80 rounded-xl"
					>
						<div class="flex items-center gap-2 min-w-0">
							<span
								class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-white text-[11px] font-bold shrink-0"
							>
								{{ index + 1 }}
							</span>
							<span class="text-xs font-semibold text-slate-900 font-mono truncate">{{
								serial
							}}</span>
						</div>
						<button
							type="button"
							@click="removeSerial(serial)"
							:disabled="localSerials.length <= 1"
							class="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
							:title="
								localSerials.length <= 1
									? __('Cannot remove last serial')
									: __('Remove serial')
							"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
			</div>
		</div>

		<template #footer-left>
			<div v-if="localItem" class="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
				<span class="text-xs sm:text-sm font-semibold text-slate-600 tabular-nums">
					{{ localQuantity }} {{ currentUnitLabel }}
					<template v-if="hasCoverageCalculator">
						({{ formatArea(effectiveCoverageArea) }} {{ settingsStore.coverageUom }})
					</template>
				</span>
				<span
					v-if="calculatedDiscount > 0"
					class="text-xs font-semibold text-red-600 tabular-nums"
				>
					{{ __("Discount:") }} -{{ formatCurrency(calculatedDiscount) }}
				</span>
				<div class="flex items-baseline gap-1.5">
					<span class="text-xs sm:text-sm font-bold text-slate-700">{{ __("Total:") }}</span>
					<span class="text-base sm:text-lg font-black text-slate-900 tabular-nums">
						{{ formatCurrency(calculatedTotal) }}
					</span>
				</div>
			</div>
		</template>

		<template #footer>
			<MdxButton variant="secondary" @click="cancel">
				{{ __("Cancel") }}
			</MdxButton>
			<MdxButton
				variant="primary"
				:loading="isCheckingStock"
				:disabled="!hasStock || isCheckingStock"
				@click="updateItem"
			>
				<span v-if="isCheckingStock">{{ __("Checking Stock...") }}</span>
				<span v-else-if="!hasStock">{{ __("No Stock Available") }}</span>
				<span v-else>{{ __("Update Item") }}</span>
			</MdxButton>
		</template>
	</MdxModal>
</template>

<script setup>
import { useToast } from "@/composables/useToast";
import { usePOSSettingsStore } from "@/stores/posSettings";
import { useSerialNumberStore } from "@/stores/serialNumber";
import { getItemStock } from "@/utils/stockValidator";
import {
	formatCurrency as formatCurrencyUtil,
	getCurrencySymbol,
	roundCurrency,
} from "@/utils/currency";
import { FeatherIcon, createResource } from "frappe-ui";
import { MdxBadge, MdxButton, MdxModal, MdxSelect } from "mdx_ui";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

const { showSuccess, showError, showWarning } = useToast();
const settingsStore = usePOSSettingsStore();
const serialStore = useSerialNumberStore();

const props = defineProps({
	modelValue: Boolean,
	item: Object,
	warehouses: {
		type: Array,
		default: () => [],
	},
	currency: {
		type: String,
		default: "EGP",
	},
});

const emit = defineEmits(["update:modelValue", "update-item"]);

// Viewport tracking to occupy full screen with standard margin on compact screens and avoid vertical scroll
const viewportWidth = ref(typeof window !== "undefined" ? window.innerWidth : 1280);
const viewportHeight = ref(typeof window !== "undefined" ? window.innerHeight : 800);

function updateViewport() {
	if (typeof window === "undefined") return;
	viewportWidth.value = window.innerWidth;
	viewportHeight.value = window.innerHeight;
}

onMounted(() => {
	updateViewport();
	if (typeof window !== "undefined") {
		window.addEventListener("resize", updateViewport);
	}
});

onUnmounted(() => {
	if (typeof window !== "undefined") {
		window.removeEventListener("resize", updateViewport);
	}
});

const isCompactViewport = computed(
	() => viewportWidth.value < 1024 || viewportHeight.value < 680
);

const dialogSize = computed(() => "full");

// Local state
const localItem = ref(null);
const localQuantity = ref(1);
const localUom = ref("");
const localRate = ref(0);
const localWarehouse = ref("");
const discountType = ref("percentage");
const discountValue = ref(0);
const showDiscountSection = ref(false);
const liveWarehouseStock = ref(null);
const calculatedSubtotal = ref(0);
const calculatedDiscount = ref(0);
const calculatedTotal = ref(0);
const hasStock = ref(true);
const isCheckingStock = ref(false);
const isInitializingItem = ref(false);
const uomRateRequestId = ref(0);
const localSerials = ref([]); // List of serial numbers for this item
const removedSerials = ref([]); // Track serials removed during this edit session
const originalSerials = ref([]); // Original serials when dialog opened
const originalPriceListRate = ref(0); // Original price_list_rate when dialog opened (for rate edit validation)
const localRequiredArea = ref(0);
const localCoverageRate = ref(0);
const pendingAreaTarget = ref(0);
const isEditingCoverageRate = ref(false);
const isEditingArea = ref(false);
const targetLineTotal = ref(0);
const isEditingTargetTotal = ref(false);
const wastePercent = ref(0);
const netAreaBase = ref(0);
let nextRoomId = 2;
const roomDimensions = ref([{ id: 1, label: "", length: null, width: null }]);

const wastePresets = computed(() => [
	{ value: 0, label: __("0% Exact") },
	{ value: 5, label: "+5%" },
	{ value: 10, label: __("+10% Std.") },
	{ value: 15, label: __("+15% Diag.") },
]);

const getItemDetailsResource = createResource({
	url: "pos_next.api.items.get_item_details",
	auto: false,
});

const show = computed({
	get: () => props.modelValue,
	set: (val) => emit("update:modelValue", val),
});

const availableUoms = computed(() => {
	if (!localItem.value || !localItem.value.item_uoms) return [];
	const lockCov =
		settingsStore.enableCoverageCalculator &&
		settingsStore.lockCoverageUomDirectSale &&
		settingsStore.coverageUom &&
		localItem.value.stock_uom !== settingsStore.coverageUom;
	return localItem.value.item_uoms.filter(
		(u) =>
			u.uom !== localItem.value.stock_uom &&
			(!lockCov || u.uom !== settingsStore.coverageUom)
	);
});

const coveragePerUnit = computed(() => {
	if (
		!settingsStore.enableCoverageCalculator ||
		!settingsStore.coverageUom ||
		!localItem.value ||
		!localItem.value.stock_uom ||
		localItem.value.stock_uom === settingsStore.coverageUom
	) {
		return 0;
	}
	const covEntry = localItem.value.item_uoms?.find(
		(u) => u.uom === settingsStore.coverageUom
	);
	const rawFactor = Number(covEntry?.conversion_factor || 0);
	if (!rawFactor || rawFactor <= 0) return 0;
	return settingsStore.coverageFactorMode === "Divide" ? 1 / rawFactor : rawFactor;
});

const hasCoverageCalculator = computed(() => coveragePerUnit.value > 0);

const effectiveCoverageArea = computed(() => {
	if (!hasCoverageCalculator.value) return 0;
	return Math.round(Number(localQuantity.value || 0) * coveragePerUnit.value * 10000) / 10000;
});

const boxRoundingOptions = computed(() => {
	if (!hasCoverageCalculator.value || pendingAreaTarget.value <= 0) return [];
	const exact = pendingAreaTarget.value / coveragePerUnit.value;
	const lower = Math.max(1, Math.floor(exact + 1e-7));
	const upper = Math.max(1, Math.ceil(exact - 1e-7));
	if (lower === upper) return [];
	const lowerArea = Math.round(lower * coveragePerUnit.value * 10000) / 10000;
	const upperArea = Math.round(upper * coveragePerUnit.value * 10000) / 10000;
	return [
		{
			units: lower,
			area: lowerArea,
			delta: Math.round((lowerArea - pendingAreaTarget.value) * 10000) / 10000,
		},
		{
			units: upper,
			area: upperArea,
			delta: Math.round((upperArea - pendingAreaTarget.value) * 10000) / 10000,
		},
	];
});

const roomsTotalArea = computed(() => {
	let sum = 0;
	for (const r of roomDimensions.value) {
		const l = Number.parseFloat(r.length);
		const w = Number.parseFloat(r.width);
		if (l > 0 && w > 0 && !Number.isNaN(l) && !Number.isNaN(w)) {
			sum += l * w;
		}
	}
	return Math.round(sum * 10000) / 10000;
});

const hasActiveRooms = computed(() => roomsTotalArea.value > 0);

const effectiveNetArea = computed(() => {
	if (!hasCoverageCalculator.value) return 0;
	if (hasActiveRooms.value) return roomsTotalArea.value;
	if (netAreaBase.value > 0) return netAreaBase.value;
	return effectiveCoverageArea.value;
});

const wasteAreaAmount = computed(() => {
	if (!hasCoverageCalculator.value || wastePercent.value <= 0) return 0;
	return Math.round(effectiveNetArea.value * (wastePercent.value / 100) * 10000) / 10000;
});

function formatArea(val) {
	const num = Number(val || 0);
	return Number(num.toFixed(4)).toString();
}

const currencySymbol = computed(() => getCurrencySymbol(props.currency));

// Check if item has pricing rules applied (promotional offers)
const hasPricingRules = computed(() => {
	if (!localItem.value) return false;
	return Boolean(localItem.value.pricing_rules) && localItem.value.pricing_rules.length > 0;
});

// Rate editing is allowed only if:
// 1. POS Settings allows rate editing AND
// 2. Item does NOT have pricing rules (promotional offers) applied
const canEditRate = computed(() => {
	return settingsStore.allowUserToEditRate && !hasPricingRules.value;
});

// Tooltip message for why rate editing is disabled
const rateEditDisabledReason = computed(() => {
	if (!settingsStore.allowUserToEditRate) {
		return __("Rate editing is disabled");
	}
	if (hasPricingRules.value) {
		return __("Locked (offer applied)");
	}
	return "";
});

// Options for SelectInput components
const uomOptions = computed(() => {
	if (!localItem.value) return [];
	const options = [{ value: localItem.value.stock_uom, label: localItem.value.stock_uom }];
	if (availableUoms.value.length > 0) {
		availableUoms.value.forEach((uomData) => {
			options.push({ value: uomData.uom, label: uomData.uom });
		});
	}
	return options;
});

const warehouseOptions = computed(() => {
	if (props.warehouses.length > 0) {
		return props.warehouses.map((w) => ({
			value: w.name,
			label: w.warehouse || w.name,
		}));
	}
	return [{ value: localWarehouse.value, label: localWarehouse.value || __("Default") }];
});

const showUomSelector = computed(
	() => !localItem.value?.is_resolved_barcode && uomOptions.value.length > 1
);

const showWarehouseSelector = computed(() => warehouseOptions.value.length > 1);

const currentUnitLabel = computed(
	() => localUom.value || localItem.value?.stock_uom || __("Nos", null, "UOM")
);

const currentWarehouseLabel = computed(() => {
	const found = warehouseOptions.value.find((w) => w.value === localWarehouse.value);
	return found?.label || localWarehouse.value || __("Warehouse");
});

const availableStockQty = computed(() => {
	if (liveWarehouseStock.value !== null && liveWarehouseStock.value !== undefined) {
		return Number(liveWarehouseStock.value);
	}
	if (!localItem.value) return 0;
	return Number(
		localItem.value.original_stock ??
			localItem.value.actual_qty ??
			localItem.value.stock_qty ??
			0
	);
});

const availableStockSummary = computed(() => {
	const qty = Math.floor(availableStockQty.value);
	if (hasCoverageCalculator.value && qty > 0) {
		const area = formatArea(qty * coveragePerUnit.value);
		return `${qty} ${currentUnitLabel.value} (${area} ${settingsStore.coverageUom})`;
	}
	return `${qty} ${currentUnitLabel.value}`;
});

const listCoverageRate = computed(() => {
	if (!hasCoverageCalculator.value || coveragePerUnit.value <= 0) return 0;
	return roundCurrency(Number(originalPriceListRate.value || 0) / coveragePerUnit.value);
});

const maxAvailableWholeUnits = computed(() => {
	const stock = Number(availableStockQty.value || 0);
	if (stock <= 0) return 0;
	return hasCoverageCalculator.value && settingsStore.lockCoverageUomDirectSale
		? Math.floor(stock)
		: Math.round(stock * 10000) / 10000;
});

const isExceedingStock = computed(() => {
	if (!localItem.value?.is_stock_item) return false;
	return Number(localQuantity.value || 0) > Math.max(0, Number(availableStockQty.value || 0)) + 1e-7;
});

const stockShortfallQty = computed(() => {
	if (!isExceedingStock.value) return 0;
	return (
		Math.round(
			Math.max(0, Number(localQuantity.value || 0) - Math.max(0, Number(availableStockQty.value || 0))) *
				10000
		) / 10000
	);
});

const stockShortfallArea = computed(() => {
	if (!hasCoverageCalculator.value || !isExceedingStock.value) return 0;
	return Math.round(stockShortfallQty.value * coveragePerUnit.value * 10000) / 10000;
});

const listLineSubtotal = computed(() =>
	roundCurrency(Number(originalPriceListRate.value || 0) * Number(localQuantity.value || 0))
);

const priceVarianceAmount = computed(() =>
	roundCurrency(Number(calculatedTotal.value || 0) - listLineSubtotal.value)
);

const isPriceModified = computed(
	() =>
		Math.abs(Number(localRate.value || 0) - Number(originalPriceListRate.value || 0)) > 0.009 ||
		Number(discountValue.value || 0) > 0
);

const priceVarianceLabel = computed(() => {
	const diff = priceVarianceAmount.value;
	if (Math.abs(diff) < 0.01) {
		return __("List price (0%)");
	}
	const pct =
		listLineSubtotal.value > 0 ? Math.abs((diff / listLineSubtotal.value) * 100).toFixed(1) : "0.0";
	const sign = diff < 0 ? "-" : "+";
	return `${sign}${formatCurrency(Math.abs(diff))} (${sign}${pct}%)`;
});

const discountTypeOptions = computed(() => [
	{ value: "percentage", label: __("Percentage (%)") },
	{ value: "amount", label: __("Amount") },
]);

// Initialize local state when item changes
watch(
	() => props.item,
	(newItem) => {
		if (newItem) {
			isInitializingItem.value = true;
			localItem.value = { ...newItem };
			localQuantity.value = newItem.quantity || 1;
			localUom.value = newItem.uom || newItem.stock_uom || __("Nos");
			localRate.value = newItem.rate || 0;
			// Store original price_list_rate for rate edit validation
			originalPriceListRate.value = newItem.price_list_rate || newItem.rate || 0;
			localWarehouse.value = newItem.warehouse || props.warehouses[0]?.name || "";
			liveWarehouseStock.value = null;

			// Initialize serial numbers
			if (newItem.has_serial_no && newItem.serial_no) {
				const serials = newItem.serial_no.split("\n").filter((s) => s.trim());
				localSerials.value = [...serials];
				originalSerials.value = [...serials]; // Keep original for cancel
				removedSerials.value = []; // Reset removed serials tracker
				// For serial items, quantity must match serial count
				localQuantity.value = serials.length;
			} else {
				localSerials.value = [];
				originalSerials.value = [];
				removedSerials.value = [];
			}

			// Initialize discount
			if (newItem.discount_percentage && newItem.discount_percentage > 0) {
				discountType.value = "percentage";
				discountValue.value = newItem.discount_percentage;
				showDiscountSection.value = true;
			} else if (newItem.discount_amount && newItem.discount_amount > 0) {
				discountType.value = "amount";
				discountValue.value = newItem.discount_amount;
				showDiscountSection.value = true;
			} else {
				discountType.value = "percentage";
				discountValue.value = 0;
				showDiscountSection.value = false;
			}

			// Reset stock check & assistant state
			hasStock.value = true;
			isCheckingStock.value = false;
			pendingAreaTarget.value = 0;
			wastePercent.value = 0;
			nextRoomId = 2;
			roomDimensions.value = [{ id: 1, label: "", length: null, width: null }];

			calculateTotals();
			if (hasCoverageCalculator.value) {
				const initArea =
					Math.round(localQuantity.value * coveragePerUnit.value * 10000) / 10000;
				localRequiredArea.value = initArea;
				netAreaBase.value = initArea;
			} else {
				localRequiredArea.value = 0;
				netAreaBase.value = 0;
			}
			isInitializingItem.value = false;
		}
	},
	{ immediate: true }
);

watch(localUom, (newUom, oldUom) => {
	if (!newUom || newUom === oldUom || isInitializingItem.value) return;
	handleUomChange(newUom);
});

/**
 * Intelligently determine the step size based on current quantity
 * - Whole numbers (1, 2, 3): step by 1
 * - Multiples of 0.5 (1.5, 2.5): step by 0.5
 * - Multiples of 0.25 (0.25, 0.75): step by 0.25
 * - Multiples of 0.1 (0.1, 0.3): step by 0.1
 * - Other decimals: step by 0.01
 */
function getSmartStep(quantity) {
	// Check if it's a whole number
	if (quantity === Math.floor(quantity)) {
		return 1;
	}

	// Round to 4 decimal places to avoid floating point errors
	const rounded = Math.round(quantity * 10000) / 10000;

	// Check if it's a multiple of 0.5
	if (Math.abs(rounded % 0.5) < 0.0001) {
		return 0.5;
	}

	// Check if it's a multiple of 0.25
	if (Math.abs(rounded % 0.25) < 0.0001) {
		return 0.25;
	}

	// Check if it's a multiple of 0.1
	if (Math.abs(rounded % 0.1) < 0.0001) {
		return 0.1;
	}

	// For other decimals, use 0.01 for fine control
	return 0.01;
}

function syncQuantityToCoverageArea() {
	if (!hasCoverageCalculator.value) return;
	const area = Math.round(localQuantity.value * coveragePerUnit.value * 10000) / 10000;
	localRequiredArea.value = area;
	netAreaBase.value = area;
	wastePercent.value = 0;
}

function applyRequiredGrossArea(grossArea, preserveNetBase = null) {
	if (!hasCoverageCalculator.value || !grossArea || grossArea <= 0 || Number.isNaN(grossArea)) {
		pendingAreaTarget.value = 0;
		return;
	}
	isEditingArea.value = true;
	const roundedGross = Math.round(grossArea * 10000) / 10000;
	localRequiredArea.value = roundedGross;
	if (preserveNetBase !== null) {
		netAreaBase.value = Math.round(preserveNetBase * 10000) / 10000;
	}
	const exactUnits = roundedGross / coveragePerUnit.value;
	const lower = Math.max(1, Math.floor(exactUnits + 1e-7));
	const upper = Math.max(1, Math.ceil(exactUnits - 1e-7));
	if (lower === upper) {
		pendingAreaTarget.value = 0;
		localQuantity.value = lower;
	} else {
		pendingAreaTarget.value = roundedGross;
		localQuantity.value = upper;
	}
	calculateTotals();
	isEditingArea.value = false;
}

function incrementQuantity() {
	const step = getSmartStep(localQuantity.value);
	localQuantity.value = Math.round((localQuantity.value + step) * 10000) / 10000;
	pendingAreaTarget.value = 0;
	syncQuantityToCoverageArea();
	calculateTotals();
}

function decrementQuantity() {
	const step = getSmartStep(localQuantity.value);
	const newQty = Math.round((localQuantity.value - step) * 10000) / 10000;

	if (newQty > 0) {
		localQuantity.value = newQty;
		pendingAreaTarget.value = 0;
		syncQuantityToCoverageArea();
		calculateTotals();
	}
}

function handleQuantityInput() {
	// Allow any value during typing, just recalculate totals
	if (localQuantity.value > 0 && !isNaN(localQuantity.value)) {
		pendingAreaTarget.value = 0;
		if (hasCoverageCalculator.value && !isEditingArea.value) {
			syncQuantityToCoverageArea();
		}
		calculateTotals();
	}
}

function handleQuantityBlur() {
	// Validate and fix the quantity when user is done editing (leaves the field)
	if (!localQuantity.value || localQuantity.value <= 0 || isNaN(localQuantity.value)) {
		localQuantity.value = 1;
	} else if (hasCoverageCalculator.value && settingsStore.lockCoverageUomDirectSale) {
		localQuantity.value = Math.max(1, Math.round(localQuantity.value));
	} else {
		localQuantity.value = Math.round(localQuantity.value * 10000) / 10000;
	}
	if (hasCoverageCalculator.value && !pendingAreaTarget.value) {
		syncQuantityToCoverageArea();
	}
	calculateTotals();
}

function handleAreaInput() {
	if (!hasCoverageCalculator.value) return;
	const area = Number.parseFloat(localRequiredArea.value);
	if (!area || area <= 0 || Number.isNaN(area)) {
		pendingAreaTarget.value = 0;
		netAreaBase.value = 0;
		return;
	}
	// Typing directly into Surface sets the clean net base (respecting any active waste %)
	const netVal = wastePercent.value > 0 ? area / (1 + wastePercent.value / 100) : area;
	applyRequiredGrossArea(area, netVal);
}

function applyRoundedBoxes(units) {
	localQuantity.value = units;
	pendingAreaTarget.value = 0;
	if (hasCoverageCalculator.value) {
		localRequiredArea.value = Math.round(units * coveragePerUnit.value * 10000) / 10000;
	}
	calculateTotals();
}

function applyWastePercent(pct) {
	if (!hasCoverageCalculator.value) return;
	wastePercent.value = pct;
	const base =
		roomsTotalArea.value > 0
			? roomsTotalArea.value
			: netAreaBase.value > 0
				? netAreaBase.value
				: effectiveCoverageArea.value;
	if (!base || base <= 0) return;
	const gross = base * (1 + pct / 100);
	applyRequiredGrossArea(gross, base);
}

function handleRoomsChange() {
	if (!hasCoverageCalculator.value) return;
	const net = roomsTotalArea.value;
	if (net <= 0) return;
	const gross = net * (1 + wastePercent.value / 100);
	applyRequiredGrossArea(gross, net);
}

function addRoomRow() {
	if (roomDimensions.value.length >= 6) return;
	roomDimensions.value.push({ id: nextRoomId++, label: "", length: null, width: null });
}

function removeRoomRow(index) {
	if (roomDimensions.value.length <= 1) return;
	roomDimensions.value.splice(index, 1);
	handleRoomsChange();
}

function resetAssistant() {
	wastePercent.value = 0;
	nextRoomId = 2;
	roomDimensions.value = [{ id: 1, label: "", length: null, width: null }];
	const currentArea =
		Math.round(Number(localQuantity.value || 1) * coveragePerUnit.value * 10000) / 10000;
	netAreaBase.value = currentArea;
	localRequiredArea.value = currentArea;
	pendingAreaTarget.value = 0;
	calculateTotals();
}

function adjustToMaxAvailableStock() {
	if (maxAvailableWholeUnits.value <= 0) return;
	localQuantity.value = maxAvailableWholeUnits.value;
	pendingAreaTarget.value = 0;
	syncQuantityToCoverageArea();
	calculateTotals();
}

function handleBoxRateInput() {
	calculateTotals();
}

function handleCoverageRateInput() {
	if (!hasCoverageCalculator.value || !canEditRate.value) return;
	const covRate = Number.parseFloat(localCoverageRate.value);
	if (Number.isNaN(covRate) || covRate < 0) return;
	isEditingCoverageRate.value = true;
	discountValue.value = 0;
	showDiscountSection.value = false;
	localRate.value = roundCurrency(covRate * coveragePerUnit.value);
	calculateTotals();
	isEditingCoverageRate.value = false;
}

function handleTargetTotalInput() {
	if (!canEditRate.value) return;
	const desiredTotal = Number.parseFloat(targetLineTotal.value);
	if (Number.isNaN(desiredTotal) || desiredTotal < 0 || !localQuantity.value || localQuantity.value <= 0) {
		return;
	}
	isEditingTargetTotal.value = true;
	discountValue.value = 0;
	showDiscountSection.value = false;
	localRate.value = roundCurrency(desiredTotal / localQuantity.value);
	calculateTotals();
	isEditingTargetTotal.value = false;
}

function resetToListPrice() {
	if (!canEditRate.value) return;
	localRate.value = roundCurrency(originalPriceListRate.value);
	discountType.value = "percentage";
	discountValue.value = 0;
	showDiscountSection.value = false;
	calculateTotals();
}

function getConversionFactorForUom(uom) {
	if (!localItem.value) return 1;
	if (uom === localItem.value.stock_uom) return 1;
	const uomData = localItem.value.item_uoms?.find((itemUom) => itemUom.uom === uom);
	return uomData?.conversion_factor || 1;
}

async function getRateForUom(uom) {
	if (!localItem.value) return 0;

	// Primary source: fetch exact price_list_rate for selected UOM from backend.
	const posProfile = settingsStore.settings?.pos_profile || localItem.value.pos_profile;
	if (localItem.value.item_code && posProfile) {
		try {
			const itemDetails = await getItemDetailsResource.submit({
				item_code: localItem.value.item_code,
				pos_profile: posProfile,
				qty: localQuantity.value || 1,
				uom,
			});
			const serverRate = Number(itemDetails?.price_list_rate ?? itemDetails?.rate);
			if (!isNaN(serverRate) && serverRate > 0) {
				return serverRate;
			}
		} catch (error) {
			console.error("Error fetching UOM item price rate:", error);
		}
	}

	// Secondary source: preloaded UOM prices on item payload.
	if (localItem.value.uom_prices?.[uom] !== undefined) {
		return Number(localItem.value.uom_prices[uom]) || 0;
	}

	// Final fallback: keep current known item rate (no conversion-based pricing).
	return Number(localItem.value.price_list_rate || localItem.value.rate || localRate.value || 0);
}

async function handleUomChange(newUom) {
	const selectedUom = newUom || localUom.value;
	if (!localItem.value || !selectedUom) {
		calculateTotals();
		return;
	}

	const requestId = ++uomRateRequestId.value;
	const fetchedRate = await getRateForUom(selectedUom);
	// Ignore stale responses if user changes UOM repeatedly.
	if (requestId !== uomRateRequestId.value) return;

	const newRate = roundCurrency(fetchedRate);
	const newConversionFactor = getConversionFactorForUom(selectedUom);

	// Keep local state consistent so update payload has correct UOM pricing metadata.
	localRate.value = newRate;
	originalPriceListRate.value = newRate;
	localItem.value.uom = selectedUom;
	localItem.value.conversion_factor = newConversionFactor;
	localItem.value.rate = newRate;
	localItem.value.price_list_rate = newRate;

	calculateTotals();
}

async function handleWarehouseChange() {
	if (!localItem.value || !localWarehouse.value) return;

	isCheckingStock.value = true;
	try {
		// Check stock availability in the new warehouse
		const availableStock = await getItemStock(localItem.value.item_code, localWarehouse.value);
		liveWarehouseStock.value = availableStock;
		const enforceStock = settingsStore.shouldEnforceStockValidation();

		if (availableStock <= 0) {
			hasStock.value = !enforceStock;
			if (enforceStock) {
				showError(
					__('"{0}" is not available in warehouse "{1}". Please select another warehouse.', [
						localItem.value.item_name,
						localWarehouse.value,
					])
				);
			} else {
				showWarning(
					__('"{0}" tiene stock {1} en "{2}" (se venderá en negativo).', [
						localItem.value.item_name,
						availableStock,
						localWarehouse.value,
					]),
					__("Aviso de stock")
				);
			}
		} else if (availableStock < localQuantity.value) {
			hasStock.value = !enforceStock;
			showWarning(
				__('Only {0} units of "{1}" available in "{2}". Current quantity: {3}', [
					availableStock,
					localItem.value.item_name,
					localWarehouse.value,
					localQuantity.value,
				])
			);
		} else {
			hasStock.value = true;
			showSuccess(
				__('{0} units available in "{1}"', [availableStock, localWarehouse.value])
			);
		}
	} catch (error) {
		console.error("Error checking warehouse stock:", error);
		hasStock.value = true; // Allow update if stock check fails
	} finally {
		isCheckingStock.value = false;
	}
}

function handleDiscountTypeChange() {
	// Reset discount value when type changes
	discountValue.value = 0;
	calculateTotals();
}

function clearAndHideDiscount() {
	discountType.value = "percentage";
	discountValue.value = 0;
	showDiscountSection.value = false;
	calculateTotals();
}

function calculateDiscount() {
	// Round to currency precision to prevent floating point precision issues (e.g., 10.000000000000002)
	if (
		discountValue.value !== null &&
		discountValue.value !== undefined &&
		!isNaN(discountValue.value)
	) {
		discountValue.value = roundCurrency(discountValue.value);
	}

	if (discountType.value === "percentage") {
		// Ensure percentage doesn't exceed 100
		if (discountValue.value > 100) {
			discountValue.value = 100;
		}
		calculatedDiscount.value = Math.floor(
			(calculatedSubtotal.value * discountValue.value) / 100
		);
	} else {
		// Ensure amount doesn't exceed subtotal
		if (discountValue.value > calculatedSubtotal.value) {
			discountValue.value = Math.floor(calculatedSubtotal.value);
		}
		calculatedDiscount.value = Math.floor(discountValue.value);
	}
	calculatedTotal.value = roundCurrency(calculatedSubtotal.value - calculatedDiscount.value);
}

function calculateTotals() {
	calculatedSubtotal.value = localRate.value * localQuantity.value;
	calculateDiscount();
	if (!isEditingTargetTotal.value) {
		targetLineTotal.value = roundCurrency(calculatedTotal.value);
	}
	if (hasCoverageCalculator.value && !isEditingCoverageRate.value) {
		const netUnitRate =
			localQuantity.value > 0
				? calculatedTotal.value / localQuantity.value
				: localRate.value;
		localCoverageRate.value = roundCurrency(netUnitRate / coveragePerUnit.value);
	}
}

function removeSerial(serialNo) {
	// Remove from local list
	const index = localSerials.value.indexOf(serialNo);
	if (index > -1) {
		localSerials.value.splice(index, 1);
		// Track removed serial (will be returned to cache on confirm)
		removedSerials.value.push(serialNo);
		// Update quantity to match serial count
		localQuantity.value = localSerials.value.length;
		calculateTotals();
	}
}

function formatCurrency(amount) {
	return formatCurrencyUtil(Number.parseFloat(amount || 0), props.currency);
}

function updateItem() {
	// Check if rate was manually edited
	const isRateManuallyEdited = localRate.value !== originalPriceListRate.value;

	// ========================================================================
	// RATE EDIT VALIDATION
	// ========================================================================
	if (settingsStore.allowUserToEditRate && isRateManuallyEdited) {
		// Validate rate is positive
		if (localRate.value <= 0) {
			showError(__("Rate must be greater than zero"));
			return;
		}

		// Validate against max discount if rate was reduced
		const maxDiscount = settingsStore.maxDiscountAllowed;
		if (maxDiscount > 0 && localRate.value < originalPriceListRate.value) {
			const discountPercent =
				((originalPriceListRate.value - localRate.value) / originalPriceListRate.value) *
				100;
			const roundedDiscount = Math.round(discountPercent * 100) / 100;

			if (roundedDiscount > maxDiscount) {
				showError(
					__("Rate reduction of {0}% exceeds maximum allowed discount of {1}%", [
						roundedDiscount.toFixed(2),
						maxDiscount,
					])
				);
				return;
			}
		}
	}

	const netUnitRate =
		localQuantity.value > 0
			? calculatedTotal.value / localQuantity.value
			: localRate.value;

	const updatedItem = {
		...localItem.value,
		quantity: localQuantity.value,
		uom: localUom.value,
		rate: localRate.value,
		// Preserve price_list_rate for reference (original price before any manual edits)
		price_list_rate: originalPriceListRate.value,
		warehouse: localWarehouse.value,
		discount_percentage: discountType.value === "percentage" ? discountValue.value : 0,
		discount_amount: discountType.value === "amount" ? discountValue.value : 0,
		// Track manual rate edits for audit logging
		is_rate_manually_edited: isRateManuallyEdited ? 1 : 0,
		original_rate: isRateManuallyEdited ? originalPriceListRate.value : null,
		...(hasCoverageCalculator.value
			? {
					coverage_qty:
						Math.round(localQuantity.value * coveragePerUnit.value * 10000) / 10000,
					coverage_rate: roundCurrency(netUnitRate / coveragePerUnit.value),
				}
			: {}),
	};

	// Update serial numbers if item has serials
	if (localItem.value.has_serial_no) {
		updatedItem.serial_no = localSerials.value.join("\n");
		updatedItem.quantity = localSerials.value.length;

		// Return removed serials to cache now that update is confirmed
		if (removedSerials.value.length > 0) {
			serialStore.returnSerials(localItem.value.item_code, removedSerials.value);
		}
	}

	emit("update-item", updatedItem);
	show.value = false;
}

function cancel() {
	show.value = false;
}
</script>

<style scoped>
/* Hide number input spinners */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
	appearance: none;
	-webkit-appearance: none;
	margin: 0;
}

input[type="number"] {
	appearance: textfield;
	-moz-appearance: textfield;
}

/* Use CSS custom properties from index.css for consistent z-index layering */
.z-dialog-overlay {
	z-index: var(--z-dialog-overlay, 400);
}

.z-dialog-content {
	z-index: var(--z-dialog-content, 500);
}
</style>
