<template>
	<MdxModal
		v-model="show"
		:title="isSalesOrder ? __('Complete Sales Order') : __('Complete Payment')"
		:size="dynamicDialogSize"
		:bodyClass="isMobileView ? '!p-2.5' : '!p-3.5'"
	>
		<!-- Two Column Layout - responsive on mobile (6.5"+) and desktop -->
		<div
			:class="[
				'grid grid-cols-1 lg:grid-cols-5 items-start lg:items-stretch',
				dynamicGap,
			]"
		>
			<!-- Left Column (2/5): Delivery + Sales Person + Invoice Summary -->
			<div
				:class="[
					'lg:col-span-2 flex flex-col min-h-0',
					isSmallMobile ? 'gap-1.5' : 'gap-2',
				]"
			>
				<!-- Despacho / Entrega en Camión (Compacto & Sobrio) -->
				<div class="bg-slate-50 border border-slate-200 rounded-xl p-2 flex flex-col gap-1.5 shrink-0">
					<div class="flex items-center justify-between">
						<label class="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-800">
							<input
								type="checkbox"
								v-model="requiresDelivery"
								class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
							/>
							<span class="flex items-center gap-1.5">
								<svg class="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
								</svg>
								{{ __("Despacho en Camión") }}
							</span>
						</label>
						<MdxBadge v-if="requiresDelivery" variant="info" size="sm">
							{{ isSalesOrder ? __('Pedido') : __('Venta con Envío') }}
						</MdxBadge>
					</div>

					<!-- Campos de Despacho Compactos (Fecha + Teléfono en 1 fila, sin saltos de línea en etiquetas) -->
					<div v-if="requiresDelivery" class="flex flex-col gap-1.5 pt-1.5 border-t border-slate-200/80 text-xs">
						<div class="grid grid-cols-2 gap-1.5">
							<!-- Fecha de Entrega -->
							<div class="flex items-center gap-1.5 min-w-0">
								<label class="text-[11px] font-semibold text-slate-600 whitespace-nowrap shrink-0">{{ __("Fecha:") }}</label>
								<input
									type="date"
									v-model="deliveryDate"
									:min="today"
									class="flex-1 min-w-0 h-7 border border-slate-200 rounded-lg px-1.5 text-[11px] font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
								/>
							</div>

							<!-- Teléfono de Contacto -->
							<div class="flex items-center gap-1.5 min-w-0">
								<label class="text-[11px] font-semibold text-slate-600 whitespace-nowrap shrink-0">{{ __("Tel:") }}</label>
								<input
									type="text"
									v-model="deliveryPhone"
									:placeholder="__('Ej: 77012345')"
									class="flex-1 min-w-0 h-7 border border-slate-200 rounded-lg px-2 text-[11px] font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
								/>
							</div>
						</div>

						<!-- Dirección o Puesto de Entrega -->
						<div class="flex items-center gap-1.5">
							<label class="text-[11px] font-semibold text-slate-600 w-14 whitespace-nowrap shrink-0">{{ __("Dirección:") }}</label>
							<input
								type="text"
								v-model="deliveryAddress"
								:placeholder="__('Ej: La Ramada, Pasillo 4, Puesto 18')"
								class="flex-1 min-w-0 h-7 border border-slate-200 rounded-lg px-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
							/>
						</div>

						<!-- Modalidad de Cobro al Chofer (MdxSelect) -->
						<div class="flex items-center gap-1.5">
							<label class="text-[11px] font-semibold text-slate-600 w-14 whitespace-nowrap shrink-0">{{ __("Cobro:") }}</label>
							<div class="flex-1 min-w-0">
								<MdxSelect
									v-model="driverCollectionMode"
									:options="driverCollectionOptions"
									:placeholder="''"
									size="sm"
									:showSearch="false"
									:teleport="true"
								/>
							</div>
						</div>
					</div>
				</div>

				<!-- Toggle for Official Invoice (Facturado) -->
				<div
					v-if="!isSalesOrder && settingsStore.enableSiatFiscalFormat"
					class="bg-slate-50 border border-slate-200 rounded-xl p-2.5 transition-all"
				>
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<svg
								class="w-4 h-4 text-slate-600 flex-shrink-0"
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
							<span class="text-xs font-bold text-slate-800">
								{{ __("¿Emitir Factura? (C/ Fact.)") }}
							</span>
						</div>
						<label class="relative inline-flex items-center cursor-pointer">
							<input
								type="checkbox"
								v-model="emitOfficialInvoice"
								class="sr-only peer"
							/>
							<div
								class="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-600"
							></div>
						</label>
					</div>

					<!-- Inline NIT / CI and Razón Social inputs when Emitir Factura is active -->
					<div v-if="emitOfficialInvoice" class="mt-2.5 pt-2.5 border-t border-slate-200/80 space-y-2">
						<div>
							<label class="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-0.5">
								{{ __("NIT / CI *") }}
							</label>
							<input
								v-model="billingNit"
								type="text"
								:placeholder="__('Ej. 4829102015 o CI')"
								class="w-full px-2.5 py-1.5 text-xs font-medium text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
							/>
						</div>
						<div>
							<label class="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-0.5">
								{{ __("Razón Social / Nombre Factura *") }}
							</label>
							<input
								v-model="billingRazonSocial"
								type="text"
								:placeholder="__('Nombre o Razón Social a facturar')"
								class="w-full px-2.5 py-1.5 text-xs font-medium text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
							/>
						</div>
					</div>
				</div>

					<!-- Sales Person Selection (Compact) -->
					<div
						v-if="settingsStore.enableSalesPersons"
						:class="[
							'rounded-lg p-2',
							!isSalesPersonValid
								? 'bg-red-50 border-2 border-red-300'
								: 'bg-purple-50 border border-purple-200',
						]"
					>
						<!-- Single Mode: Show selected person or dropdown -->
						<template v-if="settingsStore.isSingleSalesPerson">
							<!-- Show selected person as a nice display -->
							<div
								v-if="selectedSalesPersons.length > 0"
								class="flex items-center justify-between"
							>
								<div class="flex items-center gap-2">
									<svg
										class="w-4 h-4 text-purple-600"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
										/>
									</svg>
									<span class="text-sm font-medium text-gray-900">
										{{
											selectedSalesPersons[0].sales_person_name ||
											selectedSalesPersons[0].sales_person
										}}
									</span>
								</div>
								<button
									@click="clearSalesPersons"
									class="text-purple-500 hover:text-purple-700 p-1 rounded hover:bg-purple-100"
									:title="__('Change sales person')"
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
											d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
										/>
									</svg>
								</button>
							</div>
							<!-- Show dropdown when no selection -->
							<div v-else ref="salesPersonDropdownRef">
								<label
									class="text-xs font-medium text-purple-700 flex items-center gap-1 mb-1"
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
											d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
										/>
									</svg>
									{{ __("Sales Person") }}
									<span class="text-red-500">*</span>
									<!-- Refresh: re-fetch sales persons from server -->
									<button
										@click.prevent="refreshSalesPersons"
										class="ms-auto p-0.5 text-purple-500 hover:text-purple-700 rounded hover:bg-purple-100 transition-colors"
										:class="{ 'animate-spin': loadingSalesPersons }"
										:title="__('Refresh sales persons')"
										:disabled="loadingSalesPersons"
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
												d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
											/>
										</svg>
									</button>
								</label>
								<div class="relative">
									<input
										v-model="salesPersonSearch"
										type="text"
										:placeholder="
											loadingSalesPersons
												? __('Loading...')
												: __('Select sales person...')
										"
										@focus="onSalesPersonFocus"
										@blur="handleSalesPersonBlur"
										class="w-full px-3 py-2 ps-3 pe-8 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
										:class="
											!isSalesPersonValid
												? 'border-red-300'
												: 'border-purple-300'
										"
									/>
									<svg
										class="w-4 h-4 text-purple-500 absolute end-2 top-1/2 -translate-y-1/2 pointer-events-none transition-transform"
										:class="{ 'rotate-180': salesPersonDropdownOpen }"
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
									<!-- Dropdown -->
									<div
										v-if="
											salesPersonDropdownOpen &&
											availableSalesPersons.length > 0
										"
										class="absolute z-50 mt-1 w-full max-h-40 overflow-y-auto border border-purple-200 rounded-lg bg-white shadow-lg"
									>
										<div
											v-for="person in availableSalesPersons"
											:key="person.name"
											@mousedown.prevent="addSalesPerson(person)"
											class="flex items-center justify-between p-2 hover:bg-purple-50 cursor-pointer border-b border-purple-100 last:border-b-0 text-xs"
										>
											<span class="font-medium text-gray-900">{{
												person.sales_person_name || person.name
											}}</span>
											<span
												v-if="person.commission_rate"
												class="text-purple-500 text-[10px]"
											>
												{{ person.commission_rate }}% {{ __("comm.") }}
											</span>
										</div>
									</div>
									<!-- No Results -->
									<div
										v-if="
											salesPersonDropdownOpen &&
											availableSalesPersons.length === 0 &&
											!loadingSalesPersons
										"
										class="absolute z-50 mt-1 w-full border border-purple-200 rounded-lg bg-white shadow-lg"
									>
										<div class="text-center py-3 text-xs text-gray-500">
											{{ __("No sales persons available") }}
										</div>
									</div>
								</div>
								<!-- Validation message -->
								<div
									v-if="!isSalesPersonValid"
									class="mt-1 text-xs text-red-600 flex items-center gap-1"
								>
									<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
										<path
											fill-rule="evenodd"
											d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
											clip-rule="evenodd"
										/>
									</svg>
									{{ __("Sales person is required") }}
								</div>
							</div>
						</template>

						<!-- Multiple Mode: Show label, dropdown, and chips -->
						<template v-else>
							<!-- Label with required indicator -->
							<div class="flex items-center justify-between mb-1.5">
								<label
									class="text-xs font-medium text-purple-700 flex items-center gap-1"
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
											d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
										/>
									</svg>
									{{ __("Sales Persons") }}
									<span class="text-red-500">*</span>
									<!-- Refresh: re-fetch sales persons from server -->
									<button
										@click.prevent="refreshSalesPersons"
										class="ms-1 p-0.5 text-purple-500 hover:text-purple-700 rounded hover:bg-purple-100 transition-colors"
										:class="{ 'animate-spin': loadingSalesPersons }"
										:title="__('Refresh sales persons')"
										:disabled="loadingSalesPersons"
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
												d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
											/>
										</svg>
									</button>
								</label>
								<span
									v-if="selectedSalesPersons.length > 0"
									class="text-[10px] text-purple-600"
								>
									{{ __("Total: {0}%", [Math.round(totalSalesAllocation)]) }}
								</span>
							</div>

							<!-- Search Input with dropdown -->
							<div class="relative" ref="salesPersonDropdownRef">
								<input
									v-model="salesPersonSearch"
									type="text"
									:placeholder="
										loadingSalesPersons
											? __('Loading...')
											: selectedSalesPersons.length > 0
											? __('Add another...')
											: __('Select sales person...')
									"
									@focus="onSalesPersonFocus"
									@blur="handleSalesPersonBlur"
									class="w-full px-3 py-2 ps-3 pe-8 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
									:class="
										!isSalesPersonValid
											? 'border-red-300'
											: 'border-purple-300'
									"
								/>
								<svg
									class="w-4 h-4 text-purple-500 absolute end-2 top-1/2 -translate-y-1/2 pointer-events-none transition-transform"
									:class="{ 'rotate-180': salesPersonDropdownOpen }"
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

								<!-- Dropdown Results -->
								<div
									v-if="
										salesPersonDropdownOpen && availableSalesPersons.length > 0
									"
									class="absolute z-50 mt-1 w-full max-h-40 overflow-y-auto border border-purple-200 rounded-lg bg-white shadow-lg"
								>
									<div
										v-for="person in availableSalesPersons"
										:key="person.name"
										@mousedown.prevent="addSalesPerson(person)"
										class="flex items-center justify-between p-2 hover:bg-purple-50 cursor-pointer border-b border-purple-100 last:border-b-0 text-xs"
									>
										<span class="font-medium text-gray-900">{{
											person.sales_person_name || person.name
										}}</span>
										<span
											v-if="person.commission_rate"
											class="text-purple-500 text-[10px]"
										>
											{{ person.commission_rate }}% {{ __("comm.") }}
										</span>
									</div>
								</div>

								<!-- No Results -->
								<div
									v-if="
										salesPersonDropdownOpen &&
										availableSalesPersons.length === 0 &&
										!loadingSalesPersons
									"
									class="absolute z-50 mt-1 w-full border border-purple-200 rounded-lg bg-white shadow-lg"
								>
									<div class="text-center py-3 text-xs text-gray-500">
										{{
											salesPersons.length === 0
												? __("No sales persons available")
												: __("All sales persons selected")
										}}
									</div>
								</div>
							</div>

							<!-- Validation message -->
							<div
								v-if="!isSalesPersonValid"
								class="mt-1 text-xs text-red-600 flex items-center gap-1"
							>
								<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
										clip-rule="evenodd"
									/>
								</svg>
								{{ __("Sales person is required") }}
							</div>

							<!-- Selected Sales Persons (chips) -->
							<div
								v-if="selectedSalesPersons.length > 0"
								class="mt-2 flex flex-wrap gap-1"
							>
								<div
									v-for="person in selectedSalesPersons"
									:key="person.sales_person"
									class="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 border border-purple-300 rounded text-xs"
								>
									<span class="font-medium text-gray-900 truncate max-w-[120px]">
										{{ person.sales_person_name || person.sales_person }}
									</span>
									<span class="text-purple-600 font-semibold">
										{{ Math.round(person.allocated_percentage) }}%
									</span>
									<button
										@click="removeSalesPerson(person.sales_person)"
										class="text-purple-500 hover:text-purple-700"
									>
										<svg
											class="w-3 h-3"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											<path
												fill-rule="evenodd"
												d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
												clip-rule="evenodd"
											/>
										</svg>
									</button>
								</div>
								<!-- Clear all button -->
								<button
									v-if="selectedSalesPersons.length > 1"
									@click="clearSalesPersons"
									class="inline-flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:text-red-700"
								>
									<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
										<path
											fill-rule="evenodd"
											d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
											clip-rule="evenodd"
										/>
									</svg>
									{{ __("Clear all") }}
								</button>
							</div>
						</template>
					</div>

					<!-- Outstanding Balance Row (full width, two columns) -->
					<div
						v-if="customerCreditEnabled && totalAvailableCredit !== 0"
						:class="[
							'rounded-lg border px-2.5 py-1.5 flex items-center justify-between shrink-0',
							totalAvailableCredit < 0
								? 'bg-red-50 border-red-200'
								: 'bg-emerald-50 border-emerald-200',
						]"
					>
						<span
							:class="[
								'text-xs font-semibold',
								totalAvailableCredit < 0 ? 'text-red-700' : 'text-emerald-700',
							]"
						>
							{{
								totalAvailableCredit < 0
									? __("Outstanding Balance")
									: __("Credit Balance")
							}}
						</span>
						<!-- Show remaining credit (after used amount is deducted) for positive balance -->
						<span
							:class="[
								'text-sm font-bold tabular-nums',
								totalAvailableCredit < 0 ? 'text-red-600' : 'text-emerald-600',
							]"
						>
							{{
								totalAvailableCredit < 0
									? formatCurrency(Math.abs(totalAvailableCredit))
									: formatCurrency(remainingAvailableCredit)
							}}
						</span>
					</div>

					<!-- Invoice Summary -->
					<div
						class="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col flex-1 min-h-0"
					>
						<!-- Header (compact 1-line layout with customer name) -->
						<div class="px-3 py-1.5 border-b border-slate-200 bg-slate-50 shrink-0">
							<div class="flex items-center justify-between gap-2">
								<div class="flex items-center gap-1.5 min-w-0">
									<h3
										:class="[
											'text-slate-900 font-bold text-start shrink-0',
											dynamicTextSize.header,
										]"
									>
										{{ __("Resumen de Venta") }}
									</h3>
									<span v-if="customer" class="text-slate-300 select-none">·</span>
									<span
										v-if="customer"
										class="text-slate-600 text-xs font-semibold truncate"
									>
										{{ customer?.customer_name || customer?.name || customer }}
									</span>
								</div>
								<MdxBadge variant="neutral" size="sm">
									{{
										items.length === 1
											? __("1 item")
											: __("{0} items", [items.length])
									}}
								</MdxBadge>
							</div>
						</div>

						<!-- Promotional offers & coupons (same entry points as cart — usable while paying) -->
						<div v-if="showPromoButtons" class="px-3 py-2 border-b border-slate-100 bg-slate-50/80 shrink-0">
							<div class="flex gap-2">
								<button
									type="button"
									@click="emit('show-offers')"
									class="relative flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-all min-w-0 touch-manipulation active:scale-[0.98]"
									:aria-label="__('View all available offers')"
								>
									<svg
										class="w-3.5 h-3.5 text-slate-600 flex-shrink-0"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										stroke-width="2"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
										/>
									</svg>
									<span class="text-[11px] font-bold text-slate-700">{{
										__("Offers")
									}}</span>
									<span
										v-if="appliedOfferCount > 0"
										class="bg-slate-800 text-white text-[9px] font-bold rounded-full px-1.5 py-0.5 flex-shrink-0 min-w-[16px] text-center"
									>
										{{ appliedOfferCount }}
									</span>
								</button>
								<button
									type="button"
									@click="emit('show-coupon')"
									class="relative flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-all min-w-0 touch-manipulation active:scale-[0.98]"
									:aria-label="__('Apply coupon or gift card')"
								>
									<svg
										class="w-3.5 h-3.5 text-slate-600 flex-shrink-0"
										fill="currentColor"
										viewBox="0 0 20 20"
									>
										<path
											fill-rule="evenodd"
											d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z"
											clip-rule="evenodd"
										/>
									</svg>
									<span class="text-[11px] font-bold text-slate-700">{{
										__("Coupon")
									}}</span>
								</button>
							</div>
						</div>

						<!-- Items List (scrollable, compact so all controls fit without clipping) -->
						<div
							v-if="items.length > 0"
							class="flex-1 overflow-y-auto divide-y divide-slate-100 min-h-[52px] max-h-28 lg:max-h-36"
						>
							<div
								v-for="(item, index) in items"
								:key="index"
								:class="[
									'px-3 py-1.5 flex flex-col gap-0.5',
									item.is_free_item ? 'bg-emerald-50/60' : 'hover:bg-slate-50/70',
								]"
							>
								<!-- Main Item -->
								<div class="flex items-start justify-between gap-2">
									<div class="flex-1 min-w-0 text-start">
										<div
											:class="[
												'font-bold text-xs lg:text-sm truncate',
												item.is_free_item
													? 'text-emerald-700'
													: 'text-slate-900',
											]"
											:title="getItemTitle(item)"
										>
											{{ getItemTitle(item) }}<span v-if="item.custom_medida || item.medida" class="text-slate-500 font-semibold text-xs ml-1">({{ item.custom_medida || item.medida }})</span><span
												v-if="item.is_free_item"
												class="text-xs font-bold"
											>
												({{ __("Free") }})</span>
										</div>
										<!-- Subtitle: Item Group + Price × Qty -->
										<div class="flex items-center gap-1.5 text-[11px] text-slate-500 tabular-nums">
											<span class="text-slate-400 font-semibold truncate max-w-[120px]">{{ item.item_group || '-' }}</span>
											<span>·</span>
											<span>{{ formatCurrency(item.rate || item.price_list_rate) }} × {{ item.qty || item.quantity }}</span>
										</div>
									</div>
									<div class="text-xs lg:text-sm font-bold text-slate-900 text-end tabular-nums">
										{{
											formatCurrency(
												item.amount ||
													(item.qty || item.quantity) *
														(item.rate || item.price_list_rate)
											)
										}}
									</div>
								</div>

								<!-- Free Item (same-item case: free qty attached to a paid item) -->
								<div
									v-if="!item.is_free_item && item?.free_qty > 0"
									class="flex justify-between items-center gap-2 bg-emerald-50/60 px-2 py-1 rounded border border-emerald-100"
								>
									<div class="flex-1 min-w-0 text-start">
										<div
											class="font-medium text-xs text-emerald-700 truncate flex items-center gap-1"
											:title="getItemTitle(item)"
										>
											<svg
												class="w-3 h-3 flex-shrink-0"
												fill="currentColor"
												viewBox="0 0 20 20"
											>
												<path
													fill-rule="evenodd"
													d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
													clip-rule="evenodd"
												/>
											</svg>
											{{ getItemTitle(item) }}<span v-if="item.custom_medida || item.medida" class="text-emerald-600 font-semibold text-[10px] ml-1">({{ item.custom_medida || item.medida }})</span> ({{
												__("Free")
											}})
										</div>
										<div
											class="text-[10px] text-emerald-600 font-semibold mt-0.5 opacity-80 ps-4"
										>
											{{ item.item_group || '-' }}
										</div>
										<div
											class="text-[10px] text-emerald-600 mt-0.5 opacity-80 ps-4"
										>
											{{ item.free_qty }} {{ item.uom || item.stock_uom }}
										</div>
									</div>
									<div class="text-xs font-bold text-emerald-700 text-end tabular-nums">
										{{ formatCurrency(0) }}
									</div>
								</div>
							</div>
						</div>
						<div
							v-else
							class="flex-1 px-3 py-4 text-center text-slate-400 text-sm flex items-center justify-center"
						>
							{{ __("No items") }}
						</div>

						<!-- Amounts Breakdown -->
						<div class="border-t border-slate-200 bg-slate-50 px-3 py-2 space-y-1 shrink-0">
							<!-- Additional Discount Row (1 sola fila compacta: MdxSegmentedControl + Stepper) -->
							<div
								v-if="settingsStore.allowAdditionalDiscount"
								class="pb-1.5 mb-1 border-b border-dashed border-slate-200"
							>
								<!-- Label with calculated amount -->
								<div class="flex items-center justify-between gap-2 mb-1">
									<div class="flex items-center gap-1.5 min-w-0">
										<svg
											class="w-3.5 h-3.5 text-slate-500 flex-shrink-0"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
											/>
										</svg>
										<span class="text-xs font-bold text-slate-700">{{
											__("Additional Discount")
										}}</span>
										<span v-if="calculatedPercentEquivalent > 0" class="text-[10px] font-semibold text-slate-400 ml-1 select-none">
											(~{{ calculatedPercentEquivalent.toFixed(1) }}%)
										</span>
										<button
											v-if="localAdditionalDiscount > 0"
											type="button"
											@click="resetAdditionalDiscount"
											class="text-[10px] font-semibold text-slate-400 hover:text-red-600 transition-colors ml-1.5 underline select-none"
										>
											{{ __("Quitar") }}
										</button>
									</div>
									<span
										v-if="localAdditionalDiscount > 0"
										class="text-xs font-bold text-red-600 tabular-nums"
									>
										-{{ formatCurrency(calculatedAdditionalDiscount) }}
									</span>
								</div>
								<!-- Form Controls en 1 sola línea horizontal -->
								<div class="grid grid-cols-12 gap-1.5 items-center">
									<!-- Unit Selectors (MdxSegmentedControl) -->
									<div class="col-span-5">
										<MdxSegmentedControl
											v-model="additionalDiscountType"
											:options="discountTypeOptions"
											size="sm"
											@change="handleAdditionalDiscountTypeChange"
										/>
									</div>

									<!-- Input Field with symmetric Slate buttons -->
									<div class="col-span-7 flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden h-[34px]">
										<!-- Decrement Button -->
										<button
											type="button"
											@click="decrementDiscount"
											:disabled="localAdditionalDiscount <= 0"
											class="h-full w-9 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:text-slate-300 disabled:hover:bg-transparent transition-colors flex-shrink-0 border-r border-slate-200 touch-manipulation"
										>
											<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
											</svg>
										</button>
										<!-- Input -->
										<input
											type="number"
											v-model.number="localAdditionalDiscount"
											@input="handleAdditionalDiscountChange"
											@keypress="preventDecimalInput"
											@blur="finalizeDiscountRounding"
											@keydown.enter="finalizeDiscountRounding"
											placeholder="0"
											min="0"
											:max="additionalDiscountType === 'percentage' ? 100 : subtotal"
											step="1"
											class="flex-1 min-w-0 h-full px-1.5 text-xs font-bold text-slate-900 text-center bg-transparent border-none focus:outline-none focus:ring-0 tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
										/>
										<!-- Increment Button -->
										<button
											type="button"
											@click="incrementDiscount"
											class="h-full w-9 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors flex-shrink-0 border-l border-slate-200 touch-manipulation"
										>
											<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
											</svg>
										</button>
									</div>
								</div>
							</div>
							<!-- Subtotal -->
							<div class="flex items-center justify-between text-xs">
								<span class="text-slate-500 font-medium text-start">{{ __("Subtotal") }}</span>
								<span class="font-semibold text-slate-800 text-end tabular-nums">{{
									formatCurrency(subtotal)
								}}</span>
							</div>
							<!-- Tax -->
							<div
								v-if="taxAmount > 0"
								class="flex items-center justify-between text-xs"
							>
								<span class="text-slate-500 font-medium text-start">{{ __("Tax") }}</span>
								<span class="font-semibold text-slate-800 text-end tabular-nums">{{
									formatCurrency(taxAmount)
								}}</span>
							</div>
							<!-- Discount (shows the calculated additional discount amount) -->
							<div
								v-if="discountAmount > 0"
								class="flex items-center justify-between text-xs"
							>
								<span class="text-slate-500 font-medium text-start">
									{{ __("Discount") }}
									<span v-if="subtotal > 0" class="text-[9px] font-semibold text-slate-400 ml-1 select-none">(~{{ ((discountAmount / subtotal) * 100).toFixed(1) }}%)</span>
								</span>
								<span class="font-bold text-red-600 text-end tabular-nums">-{{ formatCurrency(discountAmount) }}</span>
							</div>
							<!-- Grand Total -->
							<div
								class="flex items-center justify-between pt-2 mt-1 border-t border-slate-200"
							>
								<span
									:class="[
										'font-extrabold text-slate-900 text-start',
										isCompactMode ? 'text-sm' : 'text-base',
									]"
									>{{ __("Grand Total") }}</span
								>
								<span
									:class="[
										'font-black text-slate-900 text-end tabular-nums',
										dynamicTextSize.grandTotal,
									]"
									>{{ formatCurrency(grandTotal) }}</span
								>
							</div>
						</div>

						<!-- Payment Status - Two Equal Halves (Sobriedad Corporativa Slate) -->
						<div class="border-t border-slate-200">
							<div class="grid grid-cols-2 divide-x divide-slate-200">
								<!-- Paid (Left Half) -->
								<div
									:class="[
										'bg-white text-center',
										isCompactMode ? 'p-2' : 'p-2.5',
									]"
								>
									<div
										class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5"
									>
										{{ __("Paid") }}
									</div>
									<div
										:class="[
											'font-black text-slate-900 tabular-nums',
											dynamicTextSize.amount,
										]"
									>
										{{ formatCurrency(totalPaid) }}
									</div>
								</div>
								<!-- Remaining / Change (Right Half) -->
								<div
									v-if="remainingAmount > 0 && !applyWriteOff"
									:class="[
										'bg-white text-center',
										isCompactMode ? 'p-2' : 'p-2.5',
									]"
								>
									<div
										class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5"
									>
										{{ __("Remaining") }}
									</div>
									<div
										:class="[
											'font-black text-amber-600 tabular-nums',
											dynamicTextSize.amount,
										]"
									>
										{{ formatCurrency(remainingAmount) }}
									</div>
								</div>
								<!-- Write-off Applied -->
								<div
									v-else-if="applyWriteOff && canWriteOff"
									:class="[
										'bg-white text-center',
										isCompactMode ? 'p-2' : 'p-2.5',
									]"
								>
									<div
										class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5"
									>
										{{ __("Write Off") }}
									</div>
									<div
										:class="[
											'font-black text-slate-700 tabular-nums',
											dynamicTextSize.amount,
										]"
									>
										{{ formatCurrency(writeOffAmount) }}
									</div>
								</div>
								<div
									v-else-if="changeAmount > 0 && allowsOverpayment"
									:class="[
										'bg-emerald-50/50 text-center',
										isCompactMode ? 'p-2' : 'p-2.5',
									]"
								>
									<div
										class="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-0.5"
									>
										{{ __("Change Due") }}
									</div>
									<div
										:class="[
											'font-black text-emerald-600 tabular-nums',
											dynamicTextSize.amount,
										]"
									>
										{{ formatCurrency(changeAmount) }}
									</div>
								</div>
								<!-- Exact Amount Warning (when overpayment not allowed) -->
								<div
									v-else-if="changeAmount > 0 && !allowsOverpayment"
									:class="[
										'bg-red-50/50 text-center',
										isCompactMode ? 'p-2' : 'p-2.5',
									]"
								>
									<div
										class="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-0.5"
									>
										{{ __("Overpayment") }}
									</div>
									<div
										:class="['font-black text-red-600 tabular-nums', dynamicTextSize.amount]"
									>
										{{ formatCurrency(changeAmount) }}
									</div>
								</div>
								<div
									v-else
									:class="[
										'bg-emerald-50/50 flex flex-col items-center justify-center',
										isCompactMode ? 'p-2' : 'p-2.5',
									]"
								>
									<svg
										class="w-4 h-4 text-emerald-600 mb-0.5"
										fill="currentColor"
										viewBox="0 0 20 20"
									>
										<path
											fill-rule="evenodd"
											d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
											clip-rule="evenodd"
										/>
									</svg>
									<span
										:class="['font-bold text-emerald-600', dynamicTextSize.body]"
										>{{ __("Fully Paid") }}</span
									>
								</div>
							</div>
						</div>

						<!-- Write-Off Toggle -->
						<div
							v-if="canWriteOff"
							class="border-t border-gray-200 px-4 py-3 bg-white"
						>
							<div class="flex items-center justify-between mb-1.5">
								<span
									class="text-xs font-medium text-gray-500 uppercase tracking-wider"
									>{{ __("Write Off") }}</span
								>
								<span class="text-xs text-gray-400"
									>{{ __("Max") }}: {{ formatCurrency(writeOffLimit) }}</span
								>
							</div>
							<div
								class="relative h-12 rounded-lg overflow-hidden select-none cursor-pointer border"
								:class="
									applyWriteOff
										? 'bg-teal-500 border-teal-500'
										: 'bg-gray-100 border-gray-200'
								"
								@click="applyWriteOff = !applyWriteOff"
								style="transition: all 0.25s ease"
							>
								<!-- Center Text -->
								<div
									class="absolute inset-0 flex items-center justify-center z-10"
								>
									<span
										class="text-base font-semibold tracking-wide"
										:class="applyWriteOff ? 'text-white' : 'text-gray-700'"
									>
										{{ formatCurrency(remainingAmount) }}
									</span>
								</div>

								<!-- Toggle Handle -->
								<div
									class="absolute top-1.5 bottom-1.5 w-11 rounded-md flex items-center justify-center z-20 bg-white border border-gray-200"
									:style="{
										left: applyWriteOff ? 'calc(100% - 3rem)' : '0.375rem',
										transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
										boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
									}"
								>
									<svg
										v-if="applyWriteOff"
										class="w-5 h-5 text-teal-500"
										fill="currentColor"
										viewBox="0 0 20 20"
									>
										<path
											fill-rule="evenodd"
											d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
											clip-rule="evenodd"
										/>
									</svg>
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
											d="M9 5l7 7-7 7"
										/>
									</svg>
								</div>
							</div>
						</div>
					</div>
				</div>
				<!-- End Left Column -->

				<!-- Right Column (3/5): Payment Methods + Quick Amounts + Numpad -->
				<div
					ref="rightColumnRef"
					:class="[
						'lg:col-span-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between',
						isSmallMobile ? 'p-2' : 'p-2.5 lg:p-3',
					]"
				>
					<!-- Payment Methods -->
					<div :class="isSmallMobile ? 'mb-1.5' : 'mb-2 lg:mb-3'">
						<div
							:class="[
								'flex items-center justify-between gap-2',
								isSmallMobile ? 'mb-1' : 'mb-1.5 lg:mb-2',
							]"
						>
							<div class="flex items-center gap-2 min-w-0">
								<span
									:class="[
										'text-start font-bold text-slate-500 uppercase tracking-wider',
										isSmallMobile ? 'text-[10px]' : 'text-[11px]',
									]"
								>
									{{ __("Payment Method") }}
								</span>
								<MdxBadge
									v-if="lastSelectedMethod && getSelectedMethodAccountName(lastSelectedMethod)"
									variant="neutral"
									size="sm"
								>
									{{ getSelectedMethodAccountName(lastSelectedMethod) }}
								</MdxBadge>
							</div>
							<!-- Clear All Payments Button -->
							<button
								v-if="paymentEntries.length > 0"
								type="button"
								@click="clearAll"
								:class="[
									'text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors',
									isSmallMobile ? 'p-1' : 'p-1.5',
								]"
								:title="__('Clear all payments')"
							>
								<svg
									:class="isSmallMobile ? 'w-4 h-4' : 'w-4 h-4'"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
									/>
								</svg>
							</button>
						</div>
						<div v-if="loadingPaymentMethods" class="py-2">
							<MdxLoadingSpinner size="sm" :text="__('Loading...')" />
						</div>
						<div
							v-else-if="filteredPaymentMethods.length > 0"
							:class="[
								'flex flex-wrap',
								isSmallMobile ? 'gap-1.5' : 'gap-2',
							]"
						>
							<button
								v-for="method in filteredPaymentMethods"
								:key="method.mode_of_payment"
								type="button"
								@pointerdown="onPaymentMethodDown(method, $event)"
								@pointerup="onPaymentMethodUp(method)"
								@pointerleave="onPaymentMethodCancel"
								@pointercancel="onPaymentMethodCancel"
								:disabled="
									isWalletPaymentMethod(method.mode_of_payment) &&
									availableWalletBalance <= 0 &&
									getMethodTotal(method.mode_of_payment) === 0
								"
								:class="[
									'inline-flex items-center rounded-xl border transition-all font-bold select-none touch-manipulation',
									isSmallMobile
										? 'gap-1.5 px-2.5 h-8 text-xs'
										: 'gap-2 px-3 lg:px-4 h-9 text-xs lg:h-10 lg:text-sm',
									lastSelectedMethod?.mode_of_payment === method.mode_of_payment
										? 'border-blue-600 bg-blue-600 text-white shadow-sm'
										: isWalletPaymentMethod(method.mode_of_payment) && availableWalletBalance <= 0
										? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
										: 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700',
								]"
							>
								<!-- Icono Vectorial SVG por Tipo de Pago (Cero Emojis) -->
								<svg
									v-if="String(method.mode_of_payment || '').toLowerCase().includes('qr')"
									class="w-4 h-4 flex-shrink-0"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									viewBox="0 0 24 24"
								>
									<rect x="3" y="3" width="7" height="7" rx="1" />
									<rect x="14" y="3" width="7" height="7" rx="1" />
									<rect x="3" y="14" width="7" height="7" rx="1" />
									<path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 19h2M19 14v2" />
								</svg>
								<svg
									v-else-if="isCashPaymentMethod(method)"
									class="w-4 h-4 flex-shrink-0"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									viewBox="0 0 24 24"
								>
									<rect x="2" y="6" width="20" height="12" rx="2" />
									<circle cx="12" cy="12" r="2" />
									<path d="M6 12h.01M18 12h.01" />
								</svg>
								<svg
									v-else-if="isWalletPaymentMethod(method.mode_of_payment)"
									class="w-4 h-4 flex-shrink-0"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									viewBox="0 0 24 24"
								>
									<path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
									<path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
									<path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" />
								</svg>
								<svg
									v-else
									class="w-4 h-4 flex-shrink-0"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									viewBox="0 0 24 24"
								>
									<path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
								</svg>

								<span class="truncate max-w-[110px] lg:max-w-none">{{
									__(method.mode_of_payment)
								}}</span>
								<!-- Wallet Balance Badge -->
								<span
									v-if="
										isWalletPaymentMethod(method.mode_of_payment) &&
										walletInfo.wallet_enabled
									"
									:class="[
										'font-bold rounded px-1.5 py-0.5 text-[10px]',
										lastSelectedMethod?.mode_of_payment === method.mode_of_payment
											? 'bg-white/20 text-white'
											: 'bg-slate-100 text-slate-600',
									]"
								>
									{{ formatCurrency(availableWalletBalance) }}
								</span>
								<!-- Payment Amount Badge -->
								<span
									v-if="getMethodTotal(method.mode_of_payment) > 0"
									:class="[
										'font-bold rounded px-1.5 py-0.5 text-[11px] tabular-nums',
										lastSelectedMethod?.mode_of_payment === method.mode_of_payment
											? 'bg-white/20 text-white'
											: 'bg-blue-50 text-blue-700',
									]"
								>
									{{ formatCurrency(getMethodTotal(method.mode_of_payment)) }}
								</span>
							</button>
							<!-- Credit Balance as Payment Method -->
							<button
								v-if="
									customerCreditEnabled &&
									(remainingAvailableCredit > 0 ||
										getMethodTotal('Customer Credit') > 0)
								"
								type="button"
								@click="applyCustomerCredit"
								:disabled="remainingAmount === 0 || remainingAvailableCredit === 0"
								:class="[
									'inline-flex items-center rounded-xl border transition-all font-bold',
									isSmallMobile
										? 'gap-1.5 px-2.5 h-8 text-xs'
										: 'gap-2 px-3 lg:px-4 h-9 text-xs lg:h-10 lg:text-sm',
									remainingAmount === 0 || remainingAvailableCredit === 0
										? 'opacity-50 cursor-not-allowed'
										: 'cursor-pointer',
									getMethodTotal('Customer Credit') > 0
										? 'border-blue-600 bg-blue-600 text-white'
										: 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700',
								]"
							>
								<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
									<rect x="2" y="5" width="20" height="14" rx="2" />
									<line x1="2" y1="10" x2="22" y2="10" />
								</svg>
								<span class="truncate">{{ __("Credit Balance") }}</span>
								<span
									v-if="getMethodTotal('Customer Credit') > 0"
									class="font-bold bg-white/20 text-white rounded px-1.5 py-0.5 text-[11px] tabular-nums"
								>
									{{ formatCurrency(getMethodTotal("Customer Credit")) }}
								</span>
							</button>
						</div>
						<div
							v-else
							:class="['text-slate-500', isSmallMobile ? 'text-xs' : 'text-sm']"
						>
							{{ __("No payment methods available") }}
						</div>

						<!-- Exact Amount Mode Info Banner -->
						<div
							v-if="
								isExactAmountModeActive &&
								paymentEntries.length > 0 &&
								hasNonCashPayment
							"
							class="mt-2"
						>
							<MdxBadge :variant="!isExactAmountValid ? 'danger' : 'success'" size="md">
								{{
									!isExactAmountValid
										? __("Total must equal invoice amount")
										: __("Payment amount is correct")
								}}
							</MdxBadge>
						</div>
					</div>

					<!-- Quick Amounts Area (Desktop) -->
					<div
						v-if="lastSelectedMethod && remainingAmount > 0"
						class="hidden lg:block"
						:class="isCompactMode ? 'mb-2' : 'mb-3'"
					>
						<div class="w-full">
							<button
								v-for="amount in quickAmounts"
								:key="amount"
								type="button"
								@click="addCustomPayment(lastSelectedMethod, amount)"
								:disabled="isQuickAmountDisabled(amount)"
								:class="[
									'w-full font-bold rounded-xl border transition-all flex items-center justify-between shadow-sm',
									isCompactMode ? 'px-3.5 py-2 text-sm' : 'px-4 py-2.5 text-sm',
									isQuickAmountDisabled(amount)
										? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed'
										: 'bg-white border-slate-300 hover:border-blue-600 hover:bg-blue-50/40 text-slate-900',
								]"
							>
								<span class="flex items-center gap-2 text-xs font-bold text-slate-700">
									<svg class="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
									</svg>
									<span>{{ __("Cobrar Monto Exacto") }}</span>
								</span>
								<span class="text-base font-black text-slate-900 tabular-nums tracking-tight">
									{{ formatCurrency(amount) }}
								</span>
							</button>
						</div>
					</div>
					<div
						v-else-if="
							!lastSelectedMethod &&
							remainingAmount > 0 &&
							!selectedReceivableAccount
						"
						class="hidden lg:block"
						:class="[
							'bg-white border border-slate-200 rounded-xl text-center',
							isCompactMode ? 'mb-2 p-2' : 'mb-3 p-2.5',
						]"
					>
						<p class="text-xs font-medium text-slate-500">
							{{ __("Select a payment method to start") }}
						</p>
					</div>

					<!-- Mobile Payment Section (6.5"+ Screens) -->
					<div
						class="lg:hidden flex flex-col"
						:class="isSmallMobile ? 'gap-1.5' : 'gap-2'"
					>
						<!-- Mobile Quick Amounts + Custom Input -->
						<div
							v-if="lastSelectedMethod && remainingAmount > 0"
							:class="['space-y-1.5 flex-shrink-0', isSmallMobile ? 'mb-1' : 'mb-1.5']"
						>
							<!-- Quick Amounts Row (Monto Exacto) -->
							<div class="w-full">
								<button
									v-for="amount in quickAmounts"
									:key="amount"
									type="button"
									@click="addCustomPayment(lastSelectedMethod, amount)"
									:disabled="isQuickAmountDisabled(amount)"
									:class="[
										'w-full font-bold rounded-xl border transition-colors flex items-center justify-between shadow-sm touch-manipulation',
										isSmallMobile ? 'py-2 px-3 text-xs' : 'py-2.5 px-3.5 text-xs',
										isQuickAmountDisabled(amount)
											? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed'
											: 'bg-white border-slate-300 active:bg-slate-50 text-slate-900',
									]"
								>
									<span class="flex items-center gap-1.5 font-bold text-slate-700">
										<svg class="w-3.5 h-3.5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
											<path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
										</svg>
										<span>{{ __("Cobrar Monto Exacto") }}</span>
									</span>
									<span class="font-black text-slate-900 tabular-nums">
										{{ formatCurrency(amount) }}
									</span>
								</button>
							</div>

							<!-- Custom Amount Row -->
							<div class="flex gap-1.5">
								<div class="relative flex-1">
									<span
										:class="[
											'absolute start-3 top-1/2 -translate-y-1/2 font-semibold',
											isSmallMobile ? 'text-xs' : 'text-xs',
											isExactAmountModeActive &&
											!isCashPaymentMethod(lastSelectedMethod)
												? 'text-slate-300'
												: 'text-slate-400',
										]"
										>{{ currencySymbol }}</span
									>
									<input
										v-model="mobileCustomAmount"
										type="number"
										inputmode="decimal"
										:placeholder="
											isExactAmountModeActive &&
											!isCashPaymentMethod(lastSelectedMethod)
												? __('Exact amount only')
												: __('Custom')
										"
										min="0"
										step="0.01"
										:disabled="
											isExactAmountModeActive &&
											!isCashPaymentMethod(lastSelectedMethod)
										"
										:class="[
											'w-full border rounded-xl focus:outline-none font-bold tabular-nums',
											isSmallMobile
												? 'h-9 ps-8 pe-2.5 text-xs'
												: 'h-10 ps-8 pe-3 text-sm',
											isExactAmountModeActive &&
											!isCashPaymentMethod(lastSelectedMethod)
												? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed'
												: 'bg-white border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
										]"
									/>
								</div>
								<MdxButton
									variant="primary"
									:size="isSmallMobile ? 'sm' : 'md'"
									:disabled="
										(isExactAmountModeActive &&
											!isCashPaymentMethod(lastSelectedMethod)) ||
										!mobileCustomAmount ||
										mobileCustomAmount <= 0
									"
									@click="addMobileCustomPayment"
								>
									{{ __("Add") }}
								</MdxButton>
							</div>
						</div>

						<!-- Mobile: Select payment method prompt -->
						<div
							v-else-if="
								!lastSelectedMethod &&
								remainingAmount > 0 &&
								!selectedReceivableAccount
							"
							:class="[
								'bg-white border border-slate-200 rounded-xl text-center',
								isSmallMobile ? 'p-2 mb-1' : 'p-2.5 mb-1.5',
							]"
						>
							<p
								:class="isSmallMobile ? 'text-xs' : 'text-xs'"
								class="text-slate-500 font-medium"
							>
								{{ __("Select a payment method") }}
							</p>
						</div>

						<!-- Mobile Action Buttons - Always visible at bottom (MdxButton) -->
						<div
							:class="['flex-shrink-0', isSmallMobile ? 'space-y-1.5' : 'space-y-2']"
						>
							<!-- Two buttons side by side when both needed -->
							<div
								v-if="
									lastSelectedMethod &&
									remainingAmount > 0 &&
									allowCreditSale &&
									paymentEntries.length === 0
								"
								class="grid grid-cols-2 gap-2"
							>
								<MdxButton
									variant="secondary"
									:size="isSmallMobile ? 'sm' : 'md'"
									:loading="isSubmitting"
									:disabled="isSubmitting"
									fullWidth
									@click="addCreditAccountPayment"
								>
									{{ isSubmitting ? __("Processing...") : __("Pago a Cuenta") }}
								</MdxButton>
								<MdxButton
									variant="primary"
									:size="isSmallMobile ? 'sm' : 'md'"
									fullWidth
									@click="addCustomPayment(lastSelectedMethod, remainingAmount)"
								>
									{{ __("Pay") }} {{ formatCurrency(remainingAmount) }}
								</MdxButton>
							</div>

							<!-- Single Pay button (when no credit sale option) -->
							<MdxButton
								v-else-if="lastSelectedMethod && remainingAmount > 0"
								variant="primary"
								:size="isSmallMobile ? 'sm' : 'md'"
								:disabled="isSubmitting"
								fullWidth
								@click="addCustomPayment(lastSelectedMethod, remainingAmount)"
							>
								{{ __("Pay") }} {{ formatCurrency(remainingAmount) }}
							</MdxButton>

							<!-- Complete / Partial Payment Button -->
							<MdxButton
								v-if="
									(remainingAmount === 0 || (applyWriteOff && canWriteOff) || (allowPartialPayment && totalPaid > 0)) &&
									totalPaid > 0
								"
								variant="primary"
								:size="isSmallMobile ? 'sm' : 'md'"
								:loading="isSubmitting"
								:disabled="isSubmitting || !canComplete"
								fullWidth
								@click="completePayment"
							>
								{{ isSubmitting ? __("Processing...") : paymentButtonText }}
							</MdxButton>
						</div>
					</div>
					<!-- End Mobile Payment Section -->

					<!-- Numeric Keypad (Desktop only — Sobriedad Corporativa Slate) -->
					<div
						:class="[
							'hidden lg:block bg-white rounded-xl border border-slate-200',
							isCompactMode ? 'p-2.5' : 'p-3',
						]"
					>
						<!-- Amount Display -->
						<div
							:class="[
								'bg-slate-50 border border-slate-200/80 rounded-xl',
								isCompactMode ? 'p-2 mb-2' : 'p-3 mb-2.5',
							]"
						>
							<div
								dir="ltr"
								:class="[
									'font-black text-slate-900 text-center flex items-center justify-center gap-2',
									isCompactMode ? 'text-xl' : 'text-2xl',
								]"
							>
								<span class="text-slate-500 font-bold text-lg">{{ currencySymbol }}</span>
								<span class="font-mono tracking-wider tabular-nums">{{
									numpadDisplay || "0.00"
								}}</span>
							</div>
						</div>

						<!-- Keypad Grid (4 columns) -->
						<div :class="['grid grid-cols-4', isCompactMode ? 'gap-1.5' : 'gap-2']">
							<!-- Row 1: 7, 8, 9, Backspace -->
							<button
								v-for="num in ['7', '8', '9']"
								:key="num"
								type="button"
								@click="numpadInput(num)"
								:class="[
									dynamicNumpadSize.key,
									'text-xl font-bold rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 transition-all active:scale-95',
								]"
							>
								{{ num }}
							</button>
							<button
								type="button"
								@click="numpadBackspace"
								:class="[
									dynamicNumpadSize.key,
									'text-lg font-bold rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-600 transition-all active:scale-95 flex items-center justify-center',
								]"
							>
								<svg
									class="w-5 h-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z"
									/>
								</svg>
							</button>

							<!-- Row 2: 4, 5, 6, Clear -->
							<button
								v-for="num in ['4', '5', '6']"
								:key="num"
								type="button"
								@click="numpadInput(num)"
								:class="[
									dynamicNumpadSize.key,
									'text-xl font-bold rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 transition-all active:scale-95',
								]"
							>
								{{ num }}
							</button>
							<button
								type="button"
								@click="numpadClear"
								:class="[
									dynamicNumpadSize.key,
									'text-base font-bold rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-600 transition-all active:scale-95',
								]"
							>
								C
							</button>

							<!-- Row 3: 1, 2, 3, Add (spans 2 rows) -->
							<button
								v-for="num in ['1', '2', '3']"
								:key="num"
								type="button"
								@click="numpadInput(num)"
								:class="[
									dynamicNumpadSize.key,
									'text-xl font-bold rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 transition-all active:scale-95',
								]"
							>
								{{ num }}
							</button>
							<button
								type="button"
								@click="numpadAddPayment"
								:disabled="!numpadValue || numpadValue <= 0 || !lastSelectedMethod"
								:class="[
									dynamicNumpadSize.addBtn,
									'row-span-2 text-base font-bold rounded-xl transition-all active:scale-95',
									!numpadValue || numpadValue <= 0 || !lastSelectedMethod
										? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
										: 'bg-blue-600 border border-blue-600 hover:bg-blue-700 text-white shadow-sm',
								]"
							>
								{{ __("Add") }}
							</button>

							<!-- Row 4: 00, 0, . -->
							<button
								type="button"
								@click="numpadInput('00')"
								:class="[
									dynamicNumpadSize.key,
									'text-xl font-bold rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 transition-all active:scale-95',
								]"
							>
								00
							</button>
							<button
								type="button"
								@click="numpadInput('0')"
								:class="[
									dynamicNumpadSize.key,
									'text-xl font-bold rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 transition-all active:scale-95',
								]"
							>
								0
							</button>
							<button
								type="button"
								@click="numpadInput('.')"
								:disabled="numpadDisplay.includes('.')"
								:class="[
									dynamicNumpadSize.key,
									'text-xl font-bold rounded-xl transition-all active:scale-95',
									numpadDisplay.includes('.')
										? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
										: 'bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800',
								]"
							>
								.
							</button>
						</div>
					</div>

					<!-- Action Buttons - Below Keypad (Desktop only — MdxButton) -->
					<div
						:class="[
							'hidden lg:flex items-center gap-2.5',
							isCompactMode ? 'mt-2' : 'mt-3',
						]"
					>
						<!-- Pay on Account Button (Secondary MdxButton) -->
						<MdxButton
							v-if="allowCreditSale"
							class="flex-1"
							variant="secondary"
							:size="isCompactMode ? 'md' : 'lg'"
							:loading="isSubmitting"
							:disabled="paymentEntries.length > 0 || isSubmitting"
							@click="addCreditAccountPayment"
						>
							{{ isSubmitting ? __("Processing...") : __("Pago a Cuenta") }}
						</MdxButton>

						<!-- Complete/Partial Payment Button (Primary MdxButton) -->
						<MdxButton
							class="flex-1"
							variant="primary"
							:size="isCompactMode ? 'md' : 'lg'"
							:loading="isSubmitting"
							:disabled="!canComplete || isSubmitting"
							@click="completePayment"
						>
							{{ isSubmitting ? __("Processing...") : paymentButtonText }}
						</MdxButton>
					</div>
				</div>
				<!-- End Right Column -->
			</div>
			<!-- End Two Column Layout -->
	</MdxModal>

	<!-- Confirmación de sobrepago estandarizada con MdxConfirmDialog -->
	<MdxConfirmDialog
		v-model="overpayConfirmVisible"
		:title="overpayConfirmTitle"
		:message="overpayConfirmMessage"
		icon="warning"
		variant="primary"
		:confirmText="__('Continue')"
		:cancelText="__('Cancel')"
		@confirm="resolveOverpayConfirm(true)"
		@cancel="resolveOverpayConfirm(false)"
	/>
</template>

<script setup>
import { usePOSSettingsStore } from "@/stores/posSettings";
import { useCustomerSearchStore } from "@/stores/customerSearch";
import {
	DEFAULT_CURRENCY,
	formatCurrency as formatCurrencyUtil,
	getCurrencySymbol,
	roundCurrency,
} from "@/utils/currency";
import { offlineWorker } from "@/utils/offline/workerClient";
import { logger } from "@/utils/logger";
import { createResource, call } from "frappe-ui";
import {
	MdxBadge,
	MdxButton,
	MdxConfirmDialog,
	MdxLoadingSpinner,
	MdxModal,
	MdxSegmentedControl,
	MdxSelect,
} from "mdx_ui";
import { computed, ref, watch, nextTick } from "vue";
import { useToast } from "@/composables/useToast";
import { useLongPress } from "@/composables/useLongPress";
import { usePaymentNumpad } from "@/composables/usePaymentNumpad";
import { useResponsivePayment } from "@/composables/useResponsivePayment";
import { useQuickAmounts } from "@/composables/useQuickAmounts";

const log = logger.create("PaymentDialog");
const settingsStore = usePOSSettingsStore();
const { showWarning, showInfo } = useToast();

const driverCollectionOptions = computed(() => [
	{ value: "", label: __("— Sin especificar (En blanco) —") },
	{ value: "Pagar al Chofer Contra Entrega", label: __("Pagar al Chofer Contra Entrega") },
	{ value: "Ya Pagado en Fábrica / Transferencia", label: __("Ya Pagado (Solo Entregar)") },
	{ value: "A Crédito / Con Saldo", label: __("A Crédito / Con Saldo (Recabar Firma)") },
]);

const discountTypeOptions = computed(() => [
	{ value: "percentage", label: "%" },
	{ value: "amount", label: getCurrencySymbol(props.currency || DEFAULT_CURRENCY) },
]);

const props = defineProps({
	modelValue: Boolean,
	grandTotal: {
		type: Number,
		default: 0,
	},
	subtotal: {
		type: Number,
		default: 0,
	},
	posProfile: String,
	currency: {
		type: String,
		default: DEFAULT_CURRENCY,
	},
	isOffline: {
		type: Boolean,
		default: false,
	},
	allowPartialPayment: {
		type: Boolean,
		default: false,
	},
	allowCreditSale: {
		type: Boolean,
		default: false,
	},
	allowCustomerCreditPayment: {
		type: Boolean,
		default: false,
	},
	customer: {
		type: [String, Object],
		default: null,
	},
	items: {
		type: Array,
		default: () => [],
	},
	taxAmount: {
		type: Number,
		default: 0,
	},
	discountAmount: {
		type: Number,
		default: 0,
	},
	company: {
		type: String,
		default: "",
	},
	additionalDiscount: {
		type: Number,
		default: 0,
	},
	targetDoctype: {
		type: String,
		default: "Sales Invoice",
	},
	isSubmitting: {
		type: Boolean,
		default: false,
	},
	writeOffLimit: {
		type: Number,
		default: 0,
	},
	allowWriteOff: {
		type: Boolean,
		default: false,
	},
	/** Count of pricing rules / offers currently applied (for badge). */
	appliedOfferCount: {
		type: Number,
		default: 0,
	},
});

const emit = defineEmits([
	"update:modelValue",
	"payment-completed",
	"update-additional-discount",
	"show-offers",
	"show-coupon",
]);

const show = computed({
	get: () => props.modelValue,
	set: (val) => emit("update:modelValue", val),
});

function getItemTitle(item) {
	if (!item) return "";
	const mode = settingsStore.itemTitleDisplay;
	if (mode === "Item Code") {
		return item.item_code;
	}
	if (mode === "Item Name & Code" && item.item_code && item.item_name && item.item_code !== item.item_name) {
		return `${item.item_name} (${item.item_code})`;
	}
	return item.item_name || item.item_code;
}

const paymentMethods = ref([]);
const loadingPaymentMethods = ref(false);
const lastSelectedMethod = ref(null);
// "Pay on Receivable Account": AR accounts offered as payment options. Selecting one makes
// it the single active payment way (like Cash); the amount allocated to it becomes the
// invoice outstanding on that account (its debit_to).
const receivableAccounts = ref([]);
const selectedReceivableAccount = ref("");
const customAmount = ref("");
const paymentEntries = ref([]);
const customerCredit = ref([]);
const customerBalance = ref({
	total_outstanding: 0,
	total_credit: 0,
	net_balance: 0,
});
const loadingCredit = ref(false);

// Wallet state
const walletInfo = ref({
	wallet_enabled: false,
	wallet_exists: false,
	wallet_balance: 0,
	wallet_name: null,
});
const loadingWallet = ref(false);
const walletPaymentMethods = ref(new Set()); // Set of mode_of_payment names that are wallet payments

// Delivery state for truck dispatch
const requiresDelivery = ref(false);
const deliveryDate = ref("");
const deliveryAddress = ref("");
const deliveryPhone = ref("");
const driverCollectionMode = ref("");
const today = new Date().toISOString().split("T")[0];
const isSalesOrder = computed(() => props.targetDoctype === "Sales Order");
const emitOfficialInvoice = ref(false);
const billingNit = ref("");
const billingRazonSocial = ref("");
const customerSearchStore = useCustomerSearchStore();

// Column refs for height matching
const rightColumnRef = ref(null);
const rightColumnMinHeight = ref("auto");

// Use responsive payment composable for viewport tracking and dynamic sizing
const {
	dynamicDialogSize,
	isMobileView,
	dialogContentMaxHeight,
	dynamicLeftColumnHeight,
	isCompactMode,
	isSmallMobile,
	dynamicGap,
	dynamicTextSize,
	dynamicButtonHeight,
	mobileButtonSize,
	dynamicNumpadSize,
} = useResponsivePayment();

const showPromoButtons = computed(() => settingsStore.enablePromotions);

// Calculate and sync column heights when dialog opens
function syncColumnHeights() {
	nextTick(() => {
		if (rightColumnRef.value) {
			const rightHeight = rightColumnRef.value.offsetHeight;
			// Preserve initial height to prevent shrinking when Quick Amounts is hidden
			rightColumnMinHeight.value = `${rightHeight}px`;
		}
	});
}

// Watch for dialog open to sync heights
watch(
	() => props.modelValue,
	(isOpen) => {
		if (isOpen) {
			// Reset min height when dialog opens so we can measure fresh
			rightColumnMinHeight.value = "auto";
			// Small delay to ensure DOM is rendered
			setTimeout(syncColumnHeights, 100);
		}
	}
);

// Handle Enter key from numpad keyboard input
function handleNumpadEnter(value) {
	if (value > 0 && lastSelectedMethod.value) {
		numpadAddPayment();
	} else if (remainingAmount.value === 0 && totalPaid.value > 0 && canComplete.value) {
		// If fully paid and can complete, trigger complete payment
		completePayment();
	}
}

// Use numpad composable for keypad input handling with keyboard support
const { numpadDisplay, numpadValue, numpadInput, numpadBackspace, numpadClear, setNumpadValue } =
	usePaymentNumpad({
		isEnabled: computed(() => props.modelValue), // Only enabled when dialog is open
		onEnter: handleNumpadEnter,
	});

// Mobile custom amount state
const mobileCustomAmount = ref("");

function addMobileCustomPayment() {
	const amount = Number.parseFloat(mobileCustomAmount.value);
	if (amount > 0 && lastSelectedMethod.value) {
		addCustomPayment(lastSelectedMethod.value, amount);
		mobileCustomAmount.value = "";
	}
}

function numpadAddPayment() {
	if (numpadValue.value > 0 && lastSelectedMethod.value) {
		addCustomPayment(lastSelectedMethod.value, numpadValue.value);
		numpadClear();
	}
}

// Additional discount state
const localAdditionalDiscount = ref(0);
// Initialize discount type from settings (default to percentage if enabled, otherwise amount)
const additionalDiscountType = ref(settingsStore.usePercentageDiscount ? "percentage" : "amount");

const paymentMethodsResource = createResource({
	url: "pos_next.api.pos_profile.get_payment_methods",
	makeParams() {
		return {
			pos_profile: props.posProfile,
		};
	},
	auto: false,
	onSuccess(data) {
		paymentMethods.value = data?.message || data || [];
		// Set first method as last selected for quick amounts
		if (paymentMethods.value.length > 0) {
			const defaultMethod = paymentMethods.value.find((m) => m.default);
			lastSelectedMethod.value = defaultMethod || paymentMethods.value[0];
		}
		// Identify wallet payment methods
		identifyWalletPaymentMethods();
	},
});

// Receivable accounts for "Pay on Receivable Account" (empty unless credit sales enabled)
const receivableAccountsResource = createResource({
	url: "pos_next.api.pos_profile.get_receivable_accounts",
	makeParams() {
		return {
			pos_profile: props.posProfile,
		};
	},
	auto: false,
	onSuccess(data) {
		receivableAccounts.value = data?.message || data || [];
	},
});

const customerCreditResource = createResource({
	url: "pos_next.api.credit_sales.get_available_credit",
	makeParams() {
		const customerName = props.customer?.name || props.customer;
		log.debug("[PaymentDialog] Fetching credit for customer:", customerName);
		return {
			customer: customerName,
			company: props.company,
			pos_profile: props.posProfile,
		};
	},
	auto: false,
	onSuccess(data) {
		log.debug("[PaymentDialog] Customer credit loaded:", data);
		customerCredit.value = data || [];
		// Note: loadingCredit is managed by customerBalanceResource since it provides the net_balance for UI
		log.debug("[PaymentDialog] Total available credit:", totalAvailableCredit.value);
	},
	onError(error) {
		log.error("[PaymentDialog] Error loading customer credit:", error);
		customerCredit.value = [];
		// Note: loadingCredit is managed by customerBalanceResource since it provides the net_balance for UI
	},
});

const customerBalanceResource = createResource({
	url: "pos_next.api.credit_sales.get_customer_balance",
	makeParams() {
		const customerName = props.customer?.name || props.customer;
		log.debug("[PaymentDialog] Fetching balance for customer:", customerName);
		return {
			customer: customerName,
			company: props.company,
		};
	},
	auto: false,
	onSuccess(data) {
		log.debug("[PaymentDialog] Customer balance loaded:", data);
		customerBalance.value = data || {
			total_outstanding: 0,
			total_credit: 0,
			net_balance: 0,
		};
		log.debug("[PaymentDialog] Net balance:", customerBalance.value.net_balance);
		loadingCredit.value = false;
	},
	onError(error) {
		log.error("[PaymentDialog] Error loading customer balance:", error);
		customerBalance.value = {
			total_outstanding: 0,
			total_credit: 0,
			net_balance: 0,
		};
		loadingCredit.value = false;
	},
});

// Wallet resource
const walletInfoResource = createResource({
	url: "pos_next.api.wallet.get_wallet_info",
	makeParams() {
		const customerName = props.customer?.name || props.customer;
		log.debug("[PaymentDialog] Fetching wallet info for customer:", customerName);
		return {
			customer: customerName,
			company: props.company,
			pos_profile: props.posProfile,
		};
	},
	auto: false,
	onSuccess(data) {
		log.debug("[PaymentDialog] Wallet info loaded:", data);
		walletInfo.value = data || {
			wallet_enabled: false,
			wallet_exists: false,
			wallet_balance: 0,
			wallet_name: null,
		};
		loadingWallet.value = false;
	},
	onError(error) {
		log.error("[PaymentDialog] Error loading wallet info:", error);
		walletInfo.value = {
			wallet_enabled: false,
			wallet_exists: false,
			wallet_balance: 0,
			wallet_name: null,
		};
		loadingWallet.value = false;
	},
});

// Identify which payment methods are wallet payments (batch query)
async function identifyWalletPaymentMethods() {
	walletPaymentMethods.value = new Set();

	if (paymentMethods.value.length === 0) return;

	try {
		// Single batch API call instead of N individual calls
		const methodNames = paymentMethods.value.map((m) => m.mode_of_payment);
		const result = await call("pos_next.api.pos_profile.get_wallet_payment_flags", {
			methods: methodNames,
		});

		if (result) {
			for (const [methodName, isWallet] of Object.entries(result)) {
				if (isWallet) {
					walletPaymentMethods.value.add(methodName);
					log.debug("[PaymentDialog] Wallet payment method identified:", methodName);
				}
			}
		}
	} catch (error) {
		log.error("[PaymentDialog] Error checking wallet payment methods:", error);
	}
}

// Check if a payment method is a wallet payment
function isWalletPaymentMethod(methodName) {
	return walletPaymentMethods.value.has(methodName);
}

// Check if a payment method is a cash payment (allows overpayment/change)
function isCashPaymentMethod(method) {
	if (!method) return false;
	// Check by account_type first (most reliable - from linked Account)
	const accountType = (method.account_type || "").toLowerCase();
	if (accountType === "cash") return true;
	// Fallback to Mode of Payment type
	const type = (method.type || "").toLowerCase();
	if (type === "cash") return true;
	// Check by mode_of_payment name as fallback
	const name = (method.mode_of_payment || "").toLowerCase();
	return name.includes("cash") || name.includes("نقد") || name.includes("نقدي");
}

function getSelectedMethodAccountName(method) {
	if (!method) return "";
	let found = method;
	if (!found.account && !found.account_name && method.mode_of_payment) {
		found = paymentMethods.value?.find((m) => m.mode_of_payment === method.mode_of_payment) || method;
	}

	let num = found.account_number || "";
	let name = found.account_name || found.account || "";

	if (!num && name.includes(" - ")) {
		const parts = name.split(" - ");
		if (/^\d[\d\.]+\d$/.test(parts[0])) {
			num = parts[0];
			name = parts.slice(1).join(" - ");
		}
	}

	name = name.replace(/ - NE$/, "").trim();

	if (num && name) {
		return `${num} - ${name}`;
	} else if (name) {
		return name;
	} else if (num) {
		return num;
	}
	return "";
}

// Get available wallet balance for payment (considering already added wallet payments)
const availableWalletBalance = computed(() => {
	const totalWalletPayments = paymentEntries.value
		.filter((p) => isWalletPaymentMethod(p.mode_of_payment))
		.reduce((sum, p) => sum + (p.amount || 0), 0);
	return Math.max(0, walletInfo.value.wallet_balance - totalWalletPayments);
});

// Filter payment methods - hide wallet methods when loyalty is not enabled
const filteredPaymentMethods = computed(() => {
	return paymentMethods.value.filter((method) => {
		// If it's a wallet payment method, only show when loyalty/wallet is enabled
		if (isWalletPaymentMethod(method.mode_of_payment)) {
			return walletInfo.value.wallet_enabled;
		}
		return true;
	});
});

// Sales Persons state
const salesPersons = ref([]);
const selectedSalesPersons = ref([]);
const salesPersonSearch = ref("");
const loadingSalesPersons = ref(false);
const salesPersonDropdownOpen = ref(false);
const salesPersonDropdownRef = ref(null);

const salesPersonsResource = createResource({
	url: "pos_next.api.pos_profile.get_sales_persons",
	makeParams() {
		return {
			pos_profile: props.posProfile,
		};
	},
	auto: false,
	onSuccess(data) {
		log.debug("[PaymentDialog] Sales persons loaded:", data);
		const persons = data?.message || data || [];
		salesPersons.value = persons;
		loadingSalesPersons.value = false;
		// Cache for offline use
		if (persons.length > 0 && props.posProfile) {
			const personsWithProfile = persons.map((p) => ({
				...p,
				pos_profile: props.posProfile,
			}));
			offlineWorker.cacheSalesPersons(personsWithProfile).catch(() => {});
		}
	},
	onError(error) {
		log.error("[PaymentDialog] Error loading sales persons:", error);
		salesPersons.value = [];
		loadingSalesPersons.value = false;
	},
});

// Computed: Available sales persons (exclude already selected, filter by search)
const availableSalesPersons = computed(() => {
	const selectedIds = selectedSalesPersons.value.map((p) => p.sales_person);
	const searchLower = (salesPersonSearch.value || "").toLowerCase();

	return salesPersons.value
		.filter((person) => {
			// Exclude already selected
			if (selectedIds.includes(person.name)) {
				return false;
			}
			// Filter by search term if provided
			if (searchLower) {
				const name = (person.sales_person_name || person.name || "").toLowerCase();
				return name.includes(searchLower);
			}
			return true;
		})
		.slice(0, 10); // Limit to 10 results for performance
});

// Computed: Total allocation percentage
const totalSalesAllocation = computed(() => {
	return selectedSalesPersons.value.reduce((sum, p) => sum + (p.allocated_percentage || 0), 0);
});

// Computed: Validation - sales person is required when enabled and online
const isSalesPersonValid = computed(() => {
	// If sales persons feature is disabled, always valid
	if (!settingsStore.enableSalesPersons) {
		return true;
	}
	// Skip validation when offline — sales persons can't be fetched,
	// don't block the sale. Team data is omitted from offline invoices.
	if (props.isOffline) {
		return true;
	}
	// At least one sales person must be selected
	return selectedSalesPersons.value.length > 0;
});

// Helper functions for sales persons
function addSalesPerson(person) {
	// For Single mode, replace the existing selection with 100%
	if (settingsStore.isSingleSalesPerson) {
		selectedSalesPersons.value = [
			{
				sales_person: person.name,
				sales_person_name: person.sales_person_name || person.name,
				allocated_percentage: 100,
				commission_rate: person.commission_rate,
			},
		];
		// Close dropdown after single selection
		salesPersonSearch.value = "";
		salesPersonDropdownOpen.value = false;
	} else {
		// For Multiple mode, add to the list and redistribute evenly
		selectedSalesPersons.value.push({
			sales_person: person.name,
			sales_person_name: person.sales_person_name || person.name,
			allocated_percentage: 0, // Will be recalculated
			commission_rate: person.commission_rate,
		});
		// Redistribute commission evenly among all selected
		redistributeCommission();
		// Keep dropdown open for multiple selection, just clear search
		salesPersonSearch.value = "";
		// Keep dropdown open so user can continue selecting
	}
}

function removeSalesPerson(personName) {
	const index = selectedSalesPersons.value.findIndex((p) => p.sales_person === personName);
	if (index > -1) {
		selectedSalesPersons.value.splice(index, 1);
		// Redistribute commission among remaining
		if (selectedSalesPersons.value.length > 0) {
			redistributeCommission();
		}
	}
}

function clearSalesPersons() {
	selectedSalesPersons.value = [];
	salesPersonSearch.value = "";
}

// Force re-fetch sales persons — from server when online, from cache when offline
async function refreshSalesPersons() {
	if (loadingSalesPersons.value) return;
	loadingSalesPersons.value = true;
	if (props.isOffline) {
		try {
			const cached = await offlineWorker.getCachedSalesPersons(props.posProfile);
			salesPersons.value = cached || [];
		} catch {
			salesPersons.value = [];
		}
		loadingSalesPersons.value = false;
	} else {
		salesPersonsResource.fetch();
	}
}

// Auto-retry fetch when dropdown opens and list is empty
function onSalesPersonFocus() {
	salesPersonDropdownOpen.value = true;
	// If list is empty and not loading, re-fetch as a safety net
	if (salesPersons.value.length === 0 && !loadingSalesPersons.value && props.posProfile) {
		refreshSalesPersons();
	}
}

// Redistribute commission evenly among all selected sales persons
function redistributeCommission() {
	const count = selectedSalesPersons.value.length;
	if (count === 0) return;

	const evenShare = 100 / count;
	selectedSalesPersons.value.forEach((person) => {
		person.allocated_percentage = evenShare;
	});
}

// Handle blur event for dropdown
function handleSalesPersonBlur() {
	// Delay closing to allow click events on dropdown items
	setTimeout(() => {
		salesPersonDropdownOpen.value = false;
	}, 150);
}

// Load payment methods - from cache if offline, from server if online
async function loadPaymentMethods() {
	// Guard: Don't load if posProfile is not set or already loading
	if (!props.posProfile) {
		log.warn("PaymentDialog: Cannot load payment methods - posProfile is not set");
		return;
	}

	// Skip if already loading or already loaded for this profile
	if (loadingPaymentMethods.value) {
		return;
	}

	loadingPaymentMethods.value = true;

	try {
		if (props.isOffline) {
			// Load from cache when offline using worker
			const cached = await offlineWorker.getCachedPaymentMethods(props.posProfile);
			if (cached && cached.length > 0) {
				paymentMethods.value = cached;
				if (paymentMethods.value.length > 0) {
					const defaultMethod = paymentMethods.value.find((m) => m.default);
					lastSelectedMethod.value = defaultMethod || paymentMethods.value[0];
				}
			}
		} else {
			// Load from server when online
			await paymentMethodsResource.fetch();
			// Receivable accounts for "Pay on Receivable Account" (online only)
			receivableAccountsResource.fetch();
		}
	} catch (error) {
		log.error("Error loading payment methods:", error);
	} finally {
		loadingPaymentMethods.value = false;
	}
}

// Currency symbol for display
const currencySymbol = computed(() => getCurrencySymbol(props.currency));

const totalPaid = computed(() => {
	const sum = paymentEntries.value.reduce((sum, entry) => sum + (entry.amount || 0), 0);
	return roundCurrency(sum);
});

// Customer credit payment is enabled if either:
// - allowCreditSale is enabled (allows going into debt AND using credit)
// - allowCustomerCreditPayment is enabled (only allows using positive credit)
const customerCreditEnabled = computed(() => {
	return props.allowCreditSale || props.allowCustomerCreditPayment;
});

const totalAvailableCredit = computed(() => {
	// Use net_balance: negative means customer has credit, positive means they owe
	// Return negative of net_balance so positive = credit available, negative = outstanding
	return roundCurrency(-customerBalance.value.net_balance);
});

// Remaining credit after deducting what's already been applied as payment
const remainingAvailableCredit = computed(() => {
	const usedCredit = getMethodTotal("Customer Credit");
	const remaining = totalAvailableCredit.value - usedCredit;
	return remaining > 0 ? roundCurrency(remaining) : 0;
});

// Calculate the actual discount amount based on type (percentage or fixed amount)
const calculatedAdditionalDiscount = computed(() => {
	if (additionalDiscountType.value === "percentage") {
		return Math.floor((props.subtotal * localAdditionalDiscount.value) / 100);
	}
	return Math.floor(localAdditionalDiscount.value);
});

// Calculate percentage equivalent dynamically for display
const calculatedPercentEquivalent = computed(() => {
	if (props.subtotal <= 0) return 0;
	return ((calculatedAdditionalDiscount.value || 0) / props.subtotal) * 100;
});

const remainingAmount = computed(() => {
	const remaining = roundCurrency(props.grandTotal) - totalPaid.value;
	return remaining > 0 ? roundCurrency(remaining) : 0;
});

const changeAmount = computed(() => {
	const change = totalPaid.value - roundCurrency(props.grandTotal);
	return change > 0 ? roundCurrency(change) : 0;
});

// ===========================================
// Write-Off Logic
// When enabled, allows small remaining amounts to be written off
// ===========================================

// Check if write-off is possible for the current remaining amount
const canWriteOff = computed(() => {
	// Write-off is only possible if:
	// 1. Write-off is allowed (setting enabled and limit > 0)
	// 2. There is a remaining amount to write off
	// 3. Remaining amount is within the write-off limit
	// 4. There is at least one payment entry
	return (
		props.allowWriteOff &&
		props.writeOffLimit > 0 &&
		remainingAmount.value > 0 &&
		remainingAmount.value <= props.writeOffLimit &&
		paymentEntries.value.length > 0
	);
});

// State to track if user wants to write off
const applyWriteOff = ref(false);

// Slide track ref for write-off slider
const slideTrack = ref(null);

// Slide position (0-100%)
const slidePosition = ref(0);
const isDragging = ref(false);

// Watch applyWriteOff to sync with slidePosition
watch(applyWriteOff, (newVal) => {
	if (!isDragging.value) {
		slidePosition.value = newVal ? 100 : 0;
	}
});

// Smooth slide to activate write-off
const startSlide = (e) => {
	e.preventDefault();
	const track = slideTrack.value;
	if (!track) return;

	isDragging.value = true;
	const rect = track.getBoundingClientRect();
	const trackWidth = rect.width;
	const handleWidth = 48; // w-12 = 3rem = 48px

	const getX = (event) => {
		if (event.touches && event.touches.length > 0) {
			return event.touches[0].clientX - rect.left;
		}
		return event.clientX - rect.left;
	};

	const startX = getX(e);
	const startPosition = slidePosition.value;

	const onMove = (event) => {
		event.preventDefault();
		const currentX = event.touches
			? event.touches[0].clientX - rect.left
			: event.clientX - rect.left;
		const deltaX = currentX - startX;
		const deltaPercent = (deltaX / (trackWidth - handleWidth)) * 100;

		let newPosition = startPosition + deltaPercent;
		newPosition = Math.max(0, Math.min(100, newPosition));
		slidePosition.value = newPosition;
	};

	const onEnd = () => {
		isDragging.value = false;

		// Snap to activated or deactivated based on threshold
		if (slidePosition.value > 40) {
			slidePosition.value = 100;
			applyWriteOff.value = true;
		} else {
			slidePosition.value = 0;
			applyWriteOff.value = false;
		}

		document.removeEventListener("mousemove", onMove);
		document.removeEventListener("mouseup", onEnd);
		document.removeEventListener("touchmove", onMove);
		document.removeEventListener("touchend", onEnd);
	};

	document.addEventListener("mousemove", onMove);
	document.addEventListener("mouseup", onEnd);
	document.addEventListener("touchmove", onMove, { passive: false });
	document.addEventListener("touchend", onEnd);
};

// The amount to be written off (0 if not applying write-off)
const writeOffAmount = computed(() => {
	if (canWriteOff.value && applyWriteOff.value) {
		return remainingAmount.value;
	}
	return 0;
});

// Effective remaining amount after write-off
const effectiveRemainingAmount = computed(() => {
	if (applyWriteOff.value && canWriteOff.value) {
		return 0;
	}
	return remainingAmount.value;
});

// ===========================================
// Exact Amount Validation Logic
// When useExactAmount is enabled:
// - Cash only: allows overpayment (change)
// - Non-cash only: must be exact amount
// - Mixed (cash + non-cash): must be exact total
// ===========================================

// Check if exact amount mode is active
// Note: Backend validation in POS Settings already prevents enabling use_exact_amount
// together with allow_credit_sale or allow_partial_payment
const isExactAmountModeActive = computed(() => {
	return settingsStore.useExactAmount;
});

// Check if payment entries contain any cash payments
const hasCashPayment = computed(() => {
	return paymentEntries.value.some((entry) => {
		const method = paymentMethods.value.find(
			(m) => m.mode_of_payment === entry.mode_of_payment
		);
		return isCashPaymentMethod(method);
	});
});

// Check if payment entries contain any non-cash payments
const hasNonCashPayment = computed(() => {
	return paymentEntries.value.some((entry) => {
		const method = paymentMethods.value.find(
			(m) => m.mode_of_payment === entry.mode_of_payment
		);
		return method && !isCashPaymentMethod(method) && !entry.is_customer_credit;
	});
});

// Check if current payment scenario allows overpayment (change)
const allowsOverpayment = computed(() => {
	// If exact amount mode is not active, allow overpayment
	if (!isExactAmountModeActive.value) return true;

	// If no payments yet, default to allowing overpayment
	if (paymentEntries.value.length === 0) return true;

	// Cash only: allows overpayment
	if (hasCashPayment.value && !hasNonCashPayment.value) return true;

	// Non-cash or mixed: no overpayment allowed
	return false;
});

// Check if current payment is valid according to exact amount rules
const isExactAmountValid = computed(() => {
	if (!isExactAmountModeActive.value) return true;

	// If no payments, it's valid (nothing to validate yet)
	if (paymentEntries.value.length === 0) return true;

	// Cash only: always valid (allows overpayment)
	if (hasCashPayment.value && !hasNonCashPayment.value) return true;

	// Non-cash or mixed: total paid must not exceed grand total
	return totalPaid.value <= roundCurrency(props.grandTotal);
});

const canComplete = computed(() => {
	// Check sales person validation first (mandatory when enabled)
	if (!isSalesPersonValid.value) {
		return false;
	}

	// Check exact amount validation
	if (!isExactAmountValid.value) {
		return false;
	}

	// "Pay on Receivable Account": the chosen account holds the unpaid balance
	if (selectedReceivableAccount.value && props.allowCreditSale) {
		return totalPaid.value <= roundCurrency(props.grandTotal) + 0.01;
	}

	// If partial payment is allowed, can complete with any amount > 0
	if (props.allowPartialPayment) {
		return totalPaid.value > 0 && paymentEntries.value.length > 0;
	}

	// If write-off is applied and covers the remaining amount, can complete
	if (applyWriteOff.value && canWriteOff.value) {
		return paymentEntries.value.length > 0;
	}

	// Otherwise require full payment
	return remainingAmount.value === 0 && paymentEntries.value.length > 0;
});

const paymentButtonText = computed(() => {
	// Show "Complete Payment" if fully paid or write-off covers remaining
	if (remainingAmount.value === 0 || (applyWriteOff.value && canWriteOff.value)) {
		return __("Complete Payment");
	}
	if (props.allowPartialPayment && totalPaid.value > 0) {
		return __("Partial Payment");
	}
	return __("Complete Payment");
});

// Use quick amounts composable for smart amount suggestions
// Cash methods show rounded/ceil amounts (physical denominations),
// non-cash methods show the exact fractional amount
const isLastMethodCash = computed(() => {
	return !lastSelectedMethod.value || isCashPaymentMethod(lastSelectedMethod.value);
});
const { quickAmounts } = useQuickAmounts(remainingAmount, isLastMethodCash);

// Whether a quick amount button should be disabled in exact-amount mode
// Non-cash methods can only pay the exact remaining — no rounding allowed
function isQuickAmountDisabled(amount) {
	return (
		isExactAmountModeActive.value &&
		!isCashPaymentMethod(lastSelectedMethod.value) &&
		amount !== roundCurrency(remainingAmount.value)
	);
}

// Preload payment methods and sales persons when posProfile is set.
// Watches both posProfile AND enableSalesPersons to fix a race condition:
// posProfile is available immediately (from shiftStore), but POS settings
// load asynchronously (from bootstrap/API). When settings load after the
// posProfile watcher fires, enableSalesPersons is still "Disabled" (default)
// and the sales persons fetch gets skipped entirely. By watching both
// dependencies, the fetch triggers as soon as both conditions are met,
// regardless of which resolves first.
watch(
	() => [props.posProfile, settingsStore.enableSalesPersons],
	([newProfile, salesPersonsEnabled]) => {
		if (!newProfile) return;

		// Payment methods have their own internal loading guard
		loadPaymentMethods();

		// Fetch sales persons only when: feature is enabled, not already loaded, and not in-flight
		if (salesPersonsEnabled && salesPersons.value.length === 0 && !loadingSalesPersons.value) {
			refreshSalesPersons();
		}
	},
	{ immediate: true }
);

// Pre-fetch customer balance when customer changes (before dialog opens)
// This ensures data is available immediately when dialog opens
watch(
	() => [props.customer, props.company, props.allowCreditSale, props.allowCustomerCreditPayment],
	([customer, company, allowCreditSale, allowCustomerCreditPayment]) => {
		const creditEnabled = allowCreditSale || allowCustomerCreditPayment;
		if (creditEnabled && customer && company) {
			log.debug("[PaymentDialog] Pre-fetching customer balance for:", customer);
			customerBalanceResource.fetch();
			customerCreditResource.fetch();
		}
	},
	{ immediate: true }
);

watch(show, (newVal) => {
	if (newVal) {
		// Reset state when dialog opens (but NOT customerBalance - it's pre-fetched)
		paymentEntries.value = [];
		customAmount.value = "";
		numpadClear();
		mobileCustomAmount.value = "";
		lastSelectedMethod.value = null;
		selectedReceivableAccount.value = "";
		customerCredit.value = [];
		// Refetch credit sources every time the dialog opens. The pre-fetch
		// watcher only fires when customer/company changes, so reopening the
		// dialog for the same customer would otherwise leave credit_details
		// empty and break "Apply Customer Credit" with an allocation error.
		// customerBalance is also refetched so the displayed balance reflects
		// any redemptions made by other cashiers since the last open.
		const creditEnabled = props.allowCreditSale || props.allowCustomerCreditPayment;
		if (creditEnabled && props.customer && props.company) {
			customerBalanceResource.fetch();
			customerCreditResource.fetch();
		}
		selectedSalesPersons.value = [];
		salesPersonSearch.value = "";
		applyWriteOff.value = false; // Reset write-off state

		// Setup Delivery information for truck dispatch & Tax Billing info
		deliveryDate.value = today;
		emitOfficialInvoice.value = false;
		const custKey = typeof props.customer === "object" ? props.customer?.name : props.customer;
		const matchedCustomer = customerSearchStore.allCustomers.find((c) => c.name === custKey);
		const defaultAddr = matchedCustomer?.primary_address || (typeof props.customer === "object" ? props.customer?.primary_address : "") || "";
		const defaultPhone = matchedCustomer?.mobile_no || (typeof props.customer === "object" ? props.customer?.mobile_no : "") || "";
		const defaultNit = matchedCustomer?.tax_id || (typeof props.customer === "object" ? props.customer?.tax_id : "") || "";
		const rawCustName = matchedCustomer?.customer_name || (typeof props.customer === "object" ? props.customer?.customer_name : props.customer) || "";
		const isWalkInCust = !rawCustName || rawCustName.toLowerCase().includes("mostrador") || rawCustName.toLowerCase() === "walk-in";
		const defaultRazonSocial =
			matchedCustomer?.custom_razon_social ||
			(typeof props.customer === "object" ? props.customer?.custom_razon_social : "") ||
			(isWalkInCust ? "" : rawCustName);

		deliveryAddress.value = defaultAddr;
		deliveryPhone.value = defaultPhone;
		billingNit.value = defaultNit;
		billingRazonSocial.value = defaultRazonSocial;
		requiresDelivery.value = isSalesOrder.value || Boolean(defaultAddr);
		driverCollectionMode.value = "";

		// Debug logging
		log.debug("[PaymentDialog] Dialog opened with props:", {
			allowCreditSale: props.allowCreditSale,
			allowCustomerCreditPayment: props.allowCustomerCreditPayment,
			allowWriteOff: props.allowWriteOff,
			writeOffLimit: props.writeOffLimit,
			customer: props.customer,
			company: props.company,
			posProfile: props.posProfile,
		});

		// Set default payment method if already loaded
		if (paymentMethods.value.length > 0 && !lastSelectedMethod.value) {
			const defaultMethod = paymentMethods.value.find((m) => m.default);
			lastSelectedMethod.value = defaultMethod || paymentMethods.value[0];
		}

		if (creditEnabled) {
			log.debug(
				"[PaymentDialog] Customer credit/balance refetch triggered, current balance:",
				customerBalance.value
			);
		}

		// Load wallet info if customer is selected
		if (props.customer && props.company) {
			log.debug("[PaymentDialog] Loading wallet info...");
			loadingWallet.value = true;
			walletInfoResource.fetch();
		} else {
			// Reset wallet info only if no customer
			walletInfo.value = {
				wallet_enabled: false,
				wallet_exists: false,
				wallet_balance: 0,
				wallet_name: null,
			};
		}
	}
});

// ===========================================
// Payment Method Press Handler (Long Press Support)
// Uses composable for clean, reusable press handling
// ===========================================

// Select payment method (tap action)
function selectPaymentMethod(method) {
	lastSelectedMethod.value = method;
	log.debug("[PaymentDialog] Selected payment method:", method.mode_of_payment);
}

// "Pay on Receivable Account": choose the account that holds the unpaid balance (the
// invoice's debit_to). It's a destination, not a tendered amount — the outstanding is
// grand_total minus the cash tendered. Tapping again clears it (back to default Debtors).
function toggleReceivableAccount(acc) {
	selectedReceivableAccount.value = selectedReceivableAccount.value === acc.name ? "" : acc.name;
	// Drop the active payment-method highlight so only one option looks active at a time.
	if (selectedReceivableAccount.value) {
		lastSelectedMethod.value = null;
	}
}

// Helper to get default non-wallet payment method
function getDefaultNonWalletMethod() {
	// First try to find the default method that's not a wallet payment
	const defaultMethod = paymentMethods.value.find(
		(m) => m.default && !isWalletPaymentMethod(m.mode_of_payment)
	);
	if (defaultMethod) return defaultMethod;

	// Otherwise, find any non-wallet method (preferably Cash)
	const cashMethod = paymentMethods.value.find(
		(m) =>
			!isWalletPaymentMethod(m.mode_of_payment) &&
			(m.mode_of_payment.toLowerCase().includes("cash") || m.type?.toLowerCase() === "cash")
	);
	if (cashMethod) return cashMethod;

	// Fall back to first non-wallet method
	return paymentMethods.value.find((m) => !isWalletPaymentMethod(m.mode_of_payment));
}

// Helper to switch to next payment method after partial wallet payment
function switchToNextPaymentMethod(partialAmount) {
	const nextMethod = getDefaultNonWalletMethod();
	if (nextMethod) {
		lastSelectedMethod.value = nextMethod;
		// Pre-fill numpad with remaining amount for convenience
		const newRemaining = roundCurrency(remainingAmount.value);
		if (newRemaining > 0) {
			setNumpadValue(newRemaining);
			// Also set mobile custom amount
			mobileCustomAmount.value = newRemaining.toFixed(2);
		}
		showInfo(
			__("Points applied: {0}. Please pay remaining {1} with {2}", [
				formatCurrency(partialAmount),
				formatCurrency(newRemaining),
				__(nextMethod.mode_of_payment),
			])
		);
	}
}

// Consolidate payment entries: if a row with the same mode already exists,
// add to it instead of creating a duplicate row.
function _upsertPaymentEntry(method, amt) {
	const existing = paymentEntries.value.find(
		(e) => e.mode_of_payment === method.mode_of_payment && !e.is_customer_credit
	);
	if (existing) {
		existing.amount = roundCurrency((existing.amount || 0) + amt);
	} else {
		paymentEntries.value.push({
			mode_of_payment: method.mode_of_payment,
			amount: roundCurrency(amt),
			type: method.type || __("Cash"),
			is_wallet_payment: isWalletPaymentMethod(method.mode_of_payment),
		});
	}
}

// Quick add payment (long press action)
function quickAddPayment(method) {
	if (remainingAmount.value <= 0) return;

	lastSelectedMethod.value = method;

	let amt = remainingAmount.value;
	let isPartialWalletPayment = false;

	// Wallet payment validation: limit to available balance
	if (isWalletPaymentMethod(method.mode_of_payment)) {
		const walletAvailable = availableWalletBalance.value;
		if (walletAvailable <= 0) {
			showWarning(__("No redeemable points available"));
			return;
		}
		if (amt > walletAvailable) {
			// Limit payment to available redeemable points
			amt = walletAvailable;
			isPartialWalletPayment = true;
		}
	}

	// Exact amount validation for non-cash payments
	if (isExactAmountModeActive.value && !isCashPaymentMethod(method)) {
		const currentNonCashTotal = paymentEntries.value
			.filter((entry) => {
				const m = paymentMethods.value.find(
					(pm) => pm.mode_of_payment === entry.mode_of_payment
				);
				return m && !isCashPaymentMethod(m) && !entry.is_customer_credit;
			})
			.reduce((sum, entry) => sum + (entry.amount || 0), 0);

		const maxAllowed = roundCurrency(props.grandTotal) - currentNonCashTotal;

		if (maxAllowed <= 0) {
			showWarning(__("Cannot add more non-cash payments. Use cash for overpayment."));
			return;
		}

		// For quick add (long press), always use exact remaining amount
		amt = maxAllowed;
	}

	// For mixed payments in exact amount mode, validate total doesn't exceed grand total
	if (isExactAmountModeActive.value && hasNonCashPayment.value && isCashPaymentMethod(method)) {
		const maxAllowed = roundCurrency(props.grandTotal) - totalPaid.value;
		if (maxAllowed <= 0) {
			showInfo(__("Invoice fully paid. No additional payment needed."));
			return;
		}
		// For quick add (long press), use exact remaining to complete payment
		amt = maxAllowed;
	}

	_upsertPaymentEntry(method, roundCurrency(amt));
	log.debug("[PaymentDialog] Long press payment added:", method.mode_of_payment);

	// If this was a partial wallet payment, switch to another payment method
	if (isPartialWalletPayment) {
		nextTick(() => {
			switchToNextPaymentMethod(amt);
		});
	}
}

// Initialize long press composable with callbacks
const {
	onPointerDown: handlePointerDown,
	onPointerUp: handlePointerUp,
	onPointerCancel: handlePointerCancel,
} = useLongPress({
	duration: 500,
	onTap: selectPaymentMethod,
	onLongPress: quickAddPayment,
});

// Wrapper handlers to pass method to composable
function onPaymentMethodDown(method, event) {
	handlePointerDown(event, method);
}

function onPaymentMethodUp(method) {
	handlePointerUp(method);
}

function onPaymentMethodCancel() {
	handlePointerCancel();
}

// Overpayment confirmation via nested Radix Dialog (no Teleport / pointer-events hacks)
const overpayConfirmVisible = ref(false);
const overpayConfirmTitle = ref("");
const overpayConfirmMessage = ref("");
let overpayConfirmResolve = null;

function showOverpayConfirm({ title, message }) {
	return new Promise((resolve) => {
		overpayConfirmTitle.value = title;
		overpayConfirmMessage.value = message;
		overpayConfirmResolve = resolve;
		overpayConfirmVisible.value = true;
	});
}

function resolveOverpayConfirm(result) {
	const resolve = overpayConfirmResolve;
	overpayConfirmResolve = null;
	overpayConfirmVisible.value = false;
	resolve?.(result);
}

// Handle Radix closing the confirm dialog (escape key / outside click)
watch(overpayConfirmVisible, (visible) => {
	if (!visible && overpayConfirmResolve) {
		const resolve = overpayConfirmResolve;
		overpayConfirmResolve = null;
		resolve(false);
	}
});

// Add custom amount for a method
async function addCustomPayment(method, amount) {
	log.debug("[PaymentDialog] Add custom payment:", {
		method: method.mode_of_payment,
		amount: amount,
		currentEntries: paymentEntries.value.length,
	});

	let amt = Number.parseFloat(amount);
	if (!amt || amt <= 0) return;

	let isPartialWalletPayment = false;

	// Wallet payment validation: limit to available balance
	if (isWalletPaymentMethod(method.mode_of_payment)) {
		const walletAvailable = availableWalletBalance.value;
		if (walletAvailable <= 0) {
			showWarning(__("No redeemable points available"));
			return;
		}
		if (amt > walletAvailable) {
			// Limit payment to available redeemable points
			amt = walletAvailable;
			isPartialWalletPayment = true;
		}
	}

	// Exact amount validation for non-cash payments
	if (isExactAmountModeActive.value && !isCashPaymentMethod(method)) {
		// Calculate the remaining amount after ALL existing payments (cash + non-cash)
		// Non-cash payments in exact amount mode must equal the remaining balance exactly
		const maxAllowed = roundCurrency(props.grandTotal - totalPaid.value);

		if (maxAllowed <= 0) {
			showWarning(__("Cannot add more non-cash payments. Use cash for overpayment."));
			return;
		}

		// Warn and reject if amount doesn't match exact remaining (use rounded comparison to avoid floating-point issues)
		if (roundCurrency(amt) !== maxAllowed) {
			showWarning(
				__("Non-cash payment must equal {0} exactly", [formatCurrency(maxAllowed)])
			);
			return;
		}

		// Use the maxAllowed value to ensure exact match
		amt = maxAllowed;
	}

	// For mixed payments in exact amount mode, validate total doesn't exceed grand total
	if (isExactAmountModeActive.value && hasNonCashPayment.value && isCashPaymentMethod(method)) {
		const newTotal = totalPaid.value + amt;
		if (newTotal > roundCurrency(props.grandTotal)) {
			showWarning(
				__("Mixed payment cannot exceed invoice total. Limit: {0}", [
					formatCurrency(roundCurrency(props.grandTotal) - totalPaid.value),
				])
			);
			return;
		}
	}

	// Block the action when adding this payment would cause a large overpayment.
	// This catches accidental double-adds (e.g., quick amount tap then numpad add)
	// that would result in giving back excessive change.
	if (allowsOverpayment.value && isCashPaymentMethod(method)) {
		const grandTotal = roundCurrency(props.grandTotal);
		const newTotal = roundCurrency(totalPaid.value + amt);
		const overpay = newTotal - grandTotal;
		if (grandTotal > 0 && overpay > 0 && overpay > grandTotal) {
			const confirmed = await showOverpayConfirm({
				title: __("Large Overpayment"),
				message: __("Change due would be {0}. Continue?", [formatCurrency(overpay)]),
			});
			if (!confirmed) return;
		}
	}

	_upsertPaymentEntry(method, amt);

	log.debug("[PaymentDialog] Payment added, new entries:", paymentEntries.value);
	customAmount.value = "";

	// If this was a partial wallet payment, switch to another payment method
	if (isPartialWalletPayment) {
		nextTick(() => {
			switchToNextPaymentMethod(amt);
		});
	}
}

// Apply existing customer credit to payment
function applyCustomerCredit() {
	log.debug("[PaymentDialog] Apply customer credit:", {
		totalCredit: totalAvailableCredit.value,
		remainingAmount: remainingAmount.value,
		currentEntries: paymentEntries.value.length,
	});

	if (remainingAmount.value === 0 || totalAvailableCredit.value === 0) return;

	// Calculate how much credit to apply (min of remaining amount and available credit)
	const creditToApply = Math.min(remainingAmount.value, totalAvailableCredit.value);

	// Add credit as a payment entry
	paymentEntries.value.push({
		mode_of_payment: "Customer Credit",
		amount: roundCurrency(creditToApply),
		type: "Credit",
		is_customer_credit: true,
		credit_details: customerCredit.value.map((credit) => ({
			...credit,
			credit_to_redeem: 0, // Will be calculated on backend
		})),
	});

	log.debug("[PaymentDialog] Existing credit applied, new entries:", paymentEntries.value);
}

function validateAndSyncCustomerBillingAndDelivery() {
	const shouldEmitInvoice = Boolean(
		!isSalesOrder.value && settingsStore.enableSiatFiscalFormat && emitOfficialInvoice.value
	);
	if (shouldEmitInvoice) {
		if (!billingNit.value.trim() || !billingRazonSocial.value.trim()) {
			showWarning(__("Ingrese el NIT / CI y la Razón Social para emitir factura."));
			return false;
		}
	}

	const custKey = typeof props.customer === "object" ? props.customer?.name : props.customer;
	const isWalkIn =
		!custKey ||
		String(custKey).toLowerCase().includes("mostrador") ||
		String(custKey).toLowerCase() === "walk-in";

	// Sync delivery address/phone
	if (requiresDelivery.value && (deliveryAddress.value || deliveryPhone.value) && custKey && !isWalkIn) {
		call("pos_next.api.invoices.update_customer_delivery_info", {
			customer_name: custKey,
			direccion: deliveryAddress.value,
			telefono: deliveryPhone.value,
		}).catch((err) => log.warn("Could not auto-save customer delivery info:", err));
	}

	// Sync NIT / Razón Social back to Customer record and local cache when billing is active
	if (shouldEmitInvoice && custKey && !isWalkIn) {
		const matchedCustomer = customerSearchStore.allCustomers.find((c) => c.name === custKey);
		const cleanNit = billingNit.value.trim();
		const cleanRazon = billingRazonSocial.value.trim();
		if (
			matchedCustomer &&
			(matchedCustomer.tax_id !== cleanNit || matchedCustomer.custom_razon_social !== cleanRazon)
		) {
			call("pos_next.api.customers.update_customer", {
				customer: custKey,
				customer_name: matchedCustomer.customer_name || custKey,
				mobile_no: requiresDelivery.value && deliveryPhone.value ? deliveryPhone.value : matchedCustomer.mobile_no || null,
				tax_id: cleanNit,
				custom_razon_social: cleanRazon,
				primary_address: requiresDelivery.value && deliveryAddress.value ? deliveryAddress.value : matchedCustomer.primary_address || null,
			})
				.then((res) => {
					const updated = res?.message || res;
					if (updated?.name) {
						customerSearchStore.addCustomerToCache(updated);
					}
				})
				.catch((err) => log.warn("Could not auto-save customer billing info:", err));
		}
	}

	return true;
}

// Add "Pay on Account" - Credit Sale (invoice with outstanding amount)
function addCreditAccountPayment() {
	log.debug("[PaymentDialog] Add credit account payment (Pay Later):", {
		grandTotal: props.grandTotal,
		currentPaid: totalPaid.value,
		remainingAmount: remainingAmount.value,
	});

	if (!validateAndSyncCustomerBillingAndDelivery()) {
		return;
	}

	const receivableAccount = selectedReceivableAccount.value || null;
	const shouldEmitInvoice = Boolean(
		!isSalesOrder.value && settingsStore.enableSiatFiscalFormat && emitOfficialInvoice.value
	);

	// Close dialog and complete as credit sale (0 payment)
	// The backend will create an invoice with outstanding amount
	const paymentData = {
		payments: [], // No payments - full amount on credit
		change_amount: 0,
		is_partial_payment: false,
		is_credit_sale: true, // Mark as credit sale
		paid_amount: 0,
		outstanding_amount: props.grandTotal,
		sales_team: selectedSalesPersons.value.length > 0 ? selectedSalesPersons.value : null,
		delivery_date: isSalesOrder.value ? deliveryDate.value : null,
		// Despacho / Delivery fields
		requires_delivery: requiresDelivery.value,
		custom_fecha_entrega: requiresDelivery.value ? deliveryDate.value : null,
		custom_direccion_entrega: requiresDelivery.value ? deliveryAddress.value : null,
		custom_telefono_contacto: requiresDelivery.value ? deliveryPhone.value : null,
		custom_modalidad_cobro_chofer:
			requiresDelivery.value && driverCollectionMode.value ? driverCollectionMode.value : null,
		custom_estado_entrega: requiresDelivery.value ? "Pendiente de Entrega" : null,
		// Write-off data
		write_off_amount: 0,
		is_write_off: false,
		receivable_account: receivableAccount,
		emit_official_invoice: shouldEmitInvoice,
		billing_nit: shouldEmitInvoice ? billingNit.value.trim() : null,
		billing_razon_social: shouldEmitInvoice ? billingRazonSocial.value.trim() : null,
	};

	log.debug("[PaymentDialog] Emitting credit sale payment-completed:", paymentData);
	emit("payment-completed", paymentData);
	show.value = false;
}

function clearAll() {
	paymentEntries.value = [];
	customAmount.value = "";
}

function completePayment() {
	log.debug("[PaymentDialog] Complete payment called:", {
		canComplete: canComplete.value,
		totalPaid: totalPaid.value,
		grandTotal: props.grandTotal,
		allowPartialPayment: props.allowPartialPayment,
		paymentEntries: paymentEntries.value,
		salesPersons: selectedSalesPersons.value,
		writeOff: {
			canWriteOff: canWriteOff.value,
			applyWriteOff: applyWriteOff.value,
			writeOffAmount: writeOffAmount.value,
		},
	});

	if (!canComplete.value) {
		log.warn("[PaymentDialog] Cannot complete - validation failed");
		return;
	}

	if (!validateAndSyncCustomerBillingAndDelivery()) {
		return;
	}

	// "Pay on Receivable Account": the chosen account holds the unpaid balance (the invoice's
	// debit_to). Tendered payments are real money; whatever is left (grand_total − tendered)
	// stays outstanding on that account — it is NOT a payment row.
	const receivableAccount = selectedReceivableAccount.value || null;
	const shouldEmitInvoice = Boolean(
		!isSalesOrder.value && settingsStore.enableSiatFiscalFormat && emitOfficialInvoice.value
	);

	// Partial when the tendered amount (plus write-off) doesn't cover the total.
	const effectivePaid = totalPaid.value + writeOffAmount.value;
	const isPartial = effectivePaid < props.grandTotal;
	const outstanding = isPartial ? roundCurrency(props.grandTotal - effectivePaid) : 0;

	const paymentData = {
		payments: paymentEntries.value,
		change_amount: changeAmount.value,
		is_partial_payment: isPartial,
		paid_amount: totalPaid.value,
		outstanding_amount: outstanding,
		sales_team: selectedSalesPersons.value.length > 0 ? selectedSalesPersons.value : null,
		delivery_date: isSalesOrder.value ? deliveryDate.value : null,
		// Despacho / Delivery fields
		requires_delivery: requiresDelivery.value,
		custom_fecha_entrega: requiresDelivery.value ? deliveryDate.value : null,
		custom_direccion_entrega: requiresDelivery.value ? deliveryAddress.value : null,
		custom_telefono_contacto: requiresDelivery.value ? deliveryPhone.value : null,
		custom_modalidad_cobro_chofer:
			requiresDelivery.value && driverCollectionMode.value ? driverCollectionMode.value : null,
		custom_estado_entrega: requiresDelivery.value ? "Pendiente de Entrega" : null,
		// Write-off data
		write_off_amount: writeOffAmount.value,
		is_write_off: writeOffAmount.value > 0,
		// Chosen receivable account → invoice debit_to. With no tendered payment it's a
		// full credit sale, so flag it to allow the no-payment submit (backend re-checks
		// the allow_credit_sale gate).
		receivable_account: receivableAccount,
		is_credit_sale: !!receivableAccount && paymentEntries.value.length === 0,
		emit_official_invoice: shouldEmitInvoice,
		billing_nit: shouldEmitInvoice ? billingNit.value.trim() : null,
		billing_razon_social: shouldEmitInvoice ? billingRazonSocial.value.trim() : null,
	};

	log.debug("[PaymentDialog] Emitting payment-completed:", paymentData);

	emit("payment-completed", paymentData);

	show.value = false;
}

function formatCurrency(amount) {
	return formatCurrencyUtil(Number.parseFloat(amount || 0), props.currency);
}

// Get total amount for a specific payment method
function getMethodTotal(methodName) {
	return paymentEntries.value
		.filter((entry) => entry.mode_of_payment === methodName)
		.reduce((sum, entry) => sum + (entry.amount || 0), 0);
}

// Additional discount handlers
function handleAdditionalDiscountChange() {
	let discountValue = localAdditionalDiscount.value;
	let discountAmount = 0;

	// If percentage mode, calculate amount
	if (additionalDiscountType.value === "percentage") {
		// Validate against max_discount_allowed if configured
		if (
			settingsStore.maxDiscountAllowed > 0 &&
			discountValue > settingsStore.maxDiscountAllowed
		) {
			localAdditionalDiscount.value = settingsStore.maxDiscountAllowed;
			discountValue = settingsStore.maxDiscountAllowed;
			// Show warning toast
			showWarning(
				__("Maximum allowed discount is {0}%", [settingsStore.maxDiscountAllowed])
			);
		}

		// Ensure percentage is between 0-100
		if (discountValue > 100) {
			localAdditionalDiscount.value = 100;
			discountValue = 100;
		}

		// Convert percentage to amount
		discountAmount = (props.subtotal * discountValue) / 100;
	} else {
		// Amount mode - force integer on input and amount
		localAdditionalDiscount.value = Math.floor(discountValue || 0);
		discountAmount = localAdditionalDiscount.value;

		// For amount mode, check if it exceeds percentage limit when converted
		if (settingsStore.maxDiscountAllowed > 0 && props.subtotal > 0) {
			const percentageEquivalent = (discountAmount / props.subtotal) * 100;
			if (percentageEquivalent > settingsStore.maxDiscountAllowed) {
				const maxAmount = Math.floor((props.subtotal * settingsStore.maxDiscountAllowed) / 100);
				localAdditionalDiscount.value = maxAmount;
				discountAmount = maxAmount;
				// Show warning toast
				showWarning(
					__("Maximum allowed discount is {0}% ({1} {2})", [
						settingsStore.maxDiscountAllowed,
						props.currency,
						maxAmount,
					])
				);
			}
		}
	}

	// Round the final discount amount to the lower integer (Math.floor)
	discountAmount = Math.floor(discountAmount);

	// Ensure discount doesn't exceed subtotal
	if (discountAmount > props.subtotal) {
		if (additionalDiscountType.value === "amount") {
			localAdditionalDiscount.value = Math.floor(props.subtotal);
		}
		discountAmount = Math.floor(props.subtotal);
	}

	// Ensure non-negative
	if (discountAmount < 0) {
		localAdditionalDiscount.value = 0;
		discountAmount = 0;
	}

	emit("update-additional-discount", discountAmount);
}

function finalizeDiscountRounding() {
	// Round input to lower integer based on active type (percentage or amount)
	localAdditionalDiscount.value = Math.floor(localAdditionalDiscount.value || 0);
	handleAdditionalDiscountChange();
}

function preventDecimalInput(event) {
	if (event.key === "." || event.key === "," || event.key === "e" || event.key === "E") {
		event.preventDefault();
	}
}

function handleAdditionalDiscountTypeChange() {
	// Don't reset - preserve last value when toggling type
	// Just recalculate to ensure it's within limits
	handleAdditionalDiscountChange();
}

function resetAdditionalDiscount() {
	localAdditionalDiscount.value = 0;
	handleAdditionalDiscountChange();
	showSuccess(__("Additional discount removed"));
}

function incrementDiscount() {
	const step = additionalDiscountType.value === "percentage" ? 1 : 5;
	localAdditionalDiscount.value = (localAdditionalDiscount.value || 0) + step;
	handleAdditionalDiscountChange();
}

function decrementDiscount() {
	const step = additionalDiscountType.value === "percentage" ? 1 : 5;
	const newValue = (localAdditionalDiscount.value || 0) - step;
	localAdditionalDiscount.value = newValue < 0 ? 0 : newValue;
	handleAdditionalDiscountChange();
}

// Watch for dialog open to sync additional discount from parent
watch(
	() => props.modelValue,
	(isOpen) => {
		if (isOpen) {
			// Only sync when dialog opens, not continuously
			localAdditionalDiscount.value = props.additionalDiscount || 0;
		}
	}
);
</script>
