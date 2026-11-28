<template>
	<MdxModal
		v-model="show"
		size="full"
		:noPadding="true"
	>
		<!-- Standardized Corporate Modal Header -->
		<template #header>
			<div class="flex items-center gap-3 min-w-0">
				<div class="w-9 h-9 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center shrink-0">
					<svg
						class="w-5 h-5 text-blue-600"
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
				</div>
				<div class="min-w-0 text-start">
					<h2 class="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
						{{ __("Invoice Management") }}
					</h2>
					<p class="text-xs text-slate-500 mt-0.5 truncate">
						{{ __("Manage all your invoices in one place") }}
					</p>
				</div>
			</div>

			<div class="flex items-center gap-2 shrink-0">
				<div v-if="showProfileSelector" class="hidden md:block w-52 lg:w-60">
					<MdxSelect
						v-model="selectedProfileFilter"
						:options="profileFilterOptions"
						:placeholder="''"
						size="sm"
						:teleport="true"
					/>
				</div>

				<MdxButton
					variant="secondary"
					size="sm"
					:loading="isRefreshingModal"
					@click="refreshCurrentTab"
				>
					<span class="inline-flex items-center gap-1.5">
						<svg
							v-if="!isRefreshingModal"
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
					@click="handleClose"
					class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer focus:outline-none"
					:title="__('Cerrar')"
				>
					<svg
						class="w-5 h-5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
		</template>

		<!-- Body Content (Pinned Toolbar + Full-Height Scrollable Canvas) -->
		<div class="flex-1 min-h-0 flex flex-col bg-slate-50/50">
			<!-- Pinned White Toolbar -->
			<div class="shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-col gap-2.5">
				<!-- Mobile Profile Scope Selector (if enabled) -->
				<div v-if="showProfileSelector" class="md:hidden w-full">
					<MdxSelect
						v-model="selectedProfileFilter"
						:options="profileFilterOptions"
						:placeholder="''"
						size="sm"
						:teleport="true"
					/>
				</div>

				<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
					<!-- Standardized Segmented Tabs (Left) -->
					<div class="w-full lg:w-auto min-w-0">
						<MdxSegmentedControl
							v-model="activeTab"
							:options="segmentedTabOptions"
							size="sm"
							:full-width="false"
							:scrollable="true"
						/>
					</div>

					<!-- Contextual Right Controls by Active Tab -->
					<div
						v-if="activeTab === 'partial'"
						class="flex flex-wrap items-center gap-2 w-full lg:w-auto lg:justify-end"
					>
						<div class="flex items-center gap-1.5 flex-wrap">
							<button
								v-for="chip in unpaidFilterChips"
								:key="chip.value"
								type="button"
								@click="unpaidFilter = chip.value"
								class="h-8 px-2.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer whitespace-nowrap"
								:class="
									unpaidFilter === chip.value
										? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
										: 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
								"
							>
								{{ chip.label }} ({{ chip.count }})
							</button>
						</div>
						<div class="flex-1 lg:w-64 xl:w-72 min-w-[200px] inv-search-box">
							<MdxSearchInput
								v-model="unpaidSearchQuery"
								:placeholder="__('Buscar por número o cliente...')"
								:debounce="80"
								:enable-shortcut-listener="false"
								:shortcut-key="''"
							/>
						</div>
					</div>

					<div
						v-else-if="activeTab === 'drafts'"
						class="flex items-center gap-2 w-full lg:w-auto lg:justify-end"
					>
						<div class="flex-1 lg:w-72 xl:w-80 min-w-[200px] inv-search-box">
							<MdxSearchInput
								v-model="draftsSearchQuery"
								:placeholder="__('Buscar orden por número o cliente...')"
								:debounce="80"
								:enable-shortcut-listener="false"
								:shortcut-key="''"
							/>
						</div>
					</div>

					<div
						v-else-if="activeTab === 'returns'"
						class="flex items-center gap-2 w-full lg:w-auto lg:justify-end"
					>
						<div class="flex-1 lg:w-72 xl:w-80 min-w-[200px] inv-search-box">
							<MdxSearchInput
								v-model="returnsSearchQuery"
								:placeholder="__('Buscar devolución o cliente...')"
								:debounce="80"
								:enable-shortcut-listener="false"
								:shortcut-key="''"
							/>
						</div>
					</div>

					<div
						v-else-if="activeTab === 'despachos'"
						class="flex flex-wrap items-center gap-2 w-full lg:w-auto lg:justify-end"
					>
						<div class="flex items-center gap-1.5 flex-wrap">
							<button
								v-for="chip in dispatchFilterChips"
								:key="chip.value"
								type="button"
								@click="dispatchesFilter = chip.value"
								class="h-8 px-2.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer whitespace-nowrap"
								:class="
									dispatchesFilter === chip.value
										? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
										: 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
								"
							>
								{{ chip.label }} ({{ chip.count }})
							</button>
						</div>

						<div class="w-36 shrink-0">
							<MdxDatePicker v-model="dispatchDateFilter" size="sm" />
						</div>

						<a
							href="/despacho"
							target="_blank"
							class="h-8 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs rounded-lg inline-flex items-center gap-1.5 transition-colors no-underline shadow-2xs shrink-0"
							:title="__('Abrir Portal Móvil de Choferes en nueva pestaña')"
						>
							<svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
							</svg>
							<span>{{ __("Portal Chofer") }}</span>
						</a>

						<MdxButton variant="secondary" size="sm" @click="openDispatchPlanSheet">
							<span class="inline-flex items-center gap-1.5">
								<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
								</svg>
								<span>{{ __("Planilla Diaria de Despacho") }}</span>
							</span>
						</MdxButton>
					</div>

					<div
						v-else-if="activeTab === 'pickups'"
						class="flex flex-wrap items-center gap-2 w-full lg:w-auto lg:justify-end"
					>
						<div class="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
							<button
								type="button"
								@click="setPickupStatusFilter('open')"
								:class="[
									'px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer whitespace-nowrap',
									pickupStatusFilter === 'open'
										? 'bg-slate-900 text-white shadow-2xs'
										: 'text-slate-600 hover:text-slate-900',
								]"
							>
								{{ __("Pendientes ({0})", [pickupCounts.total_open]) }}
							</button>
							<button
								type="button"
								@click="setPickupStatusFilter('Entregado')"
								:class="[
									'px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer whitespace-nowrap',
									pickupStatusFilter === 'Entregado'
										? 'bg-slate-900 text-white shadow-2xs'
										: 'text-slate-600 hover:text-slate-900',
								]"
							>
								{{ __("Entregados ({0})", [pickupCounts.delivered]) }}
							</button>
						</div>

						<div class="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
							<button
								type="button"
								@click="pickupViewMode = 'orders'"
								:class="[
									'px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer whitespace-nowrap',
									pickupViewMode === 'orders'
										? 'bg-white text-slate-900 shadow-2xs'
										: 'text-slate-600 hover:text-slate-900',
								]"
							>
								{{ __("Por Venta") }}
							</button>
							<button
								type="button"
								@click="pickupViewMode = 'summary'"
								:class="[
									'px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer whitespace-nowrap',
									pickupViewMode === 'summary'
										? 'bg-white text-slate-900 shadow-2xs'
										: 'text-slate-600 hover:text-slate-900',
								]"
							>
								{{ __("Resumen por Producto ({0})", [pickupProductSummary.length]) }}
							</button>
						</div>

						<div class="flex-1 lg:w-56 min-w-[180px] inv-search-box">
							<MdxSearchInput
								v-model="pickupSearch"
								:placeholder="__('Buscar cliente, venta o producto...')"
								:debounce="80"
								:enable-shortcut-listener="false"
								:shortcut-key="''"
							/>
						</div>

						<MdxButton
							v-if="pickupViewMode === 'summary' && pickupProductSummary.length > 0"
							variant="secondary"
							size="sm"
							@click="exportPickupSummaryCsv"
						>
							{{ __("Exportar CSV") }}
						</MdxButton>
					</div>
				</div>
			</div>

			<!-- Scrollable List Canvas -->
			<div class="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 flex flex-col pos-inv-canvas">
				<!-- Loading State (Partial Initial Load) -->
				<div
					v-if="loading && activeTab === 'partial' && filteredUnpaidInvoices.length === 0"
					class="flex-1 flex flex-col items-center justify-center py-12"
				>
					<div class="animate-spin rounded-full h-9 w-9 border-b-2 border-blue-600 mb-3"></div>
					<p class="text-xs font-medium text-slate-600">
						{{ __("Loading {0}...", [currentTabLabel]) }}
					</p>
				</div>

				<!-- ============================================================ -->
				<!-- TAB 1: UNPAID / PARTIALLY PAID INVOICES                      -->
				<!-- ============================================================ -->
				<div v-else-if="activeTab === 'partial'" class="flex-1 flex flex-col gap-3">
					<!-- Clean Summary Strip (Neutral Slate) -->
					<div
						v-if="filteredUnpaidSummary.count > 0"
						class="bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs"
					>
						<div class="flex items-center gap-2">
							<span class="text-slate-500 font-bold uppercase tracking-wider text-[11px]">
								{{ __("Outstanding Payments") }}:
							</span>
							<span class="text-sm font-extrabold text-slate-900 tabular-nums">
								{{ formatCurrency(filteredUnpaidSummary.total_outstanding) }}
							</span>
						</div>
						<div class="flex items-center gap-3 text-slate-600 tabular-nums">
							<span>{{ __("{0} invoices", [filteredUnpaidSummary.count]) }}</span>
							<span class="text-slate-300">|</span>
							<span>
								{{ __("Paid") }}:
								<strong class="font-bold text-slate-900">{{ formatCurrency(filteredUnpaidSummary.total_paid) }}</strong>
							</span>
						</div>
					</div>

					<!-- Offline Warning -->
					<div
						v-if="isOffline()"
						class="bg-white border border-amber-200 rounded-xl p-3 flex items-center gap-3"
					>
						<div class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
							<svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
							</svg>
						</div>
						<div class="flex-1 text-start">
							<p class="text-xs font-bold text-slate-900">{{ __("You are offline") }}</p>
							<p class="text-xs text-slate-500">
								{{ __("Payments cannot be added while offline. Connect to the internet to add payments.") }}
							</p>
						</div>
					</div>

					<!-- Empty State -->
					<div
						v-if="filteredUnpaidInvoices.length === 0"
						class="flex-1 flex flex-col items-center justify-center text-center py-12"
					>
						<div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-200 shadow-2xs">
							<svg class="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8">
								<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<p class="text-sm font-semibold text-slate-700">{{ __("No Unpaid Invoices") }}</p>
						<p class="text-xs text-slate-500 mt-1">{{ __("All invoices are fully paid") }}</p>
					</div>

					<!-- Horizontal 4-Zone Unpaid Cards -->
					<div v-else class="flex flex-col gap-3">
						<div
							v-for="invoice in paginatedUnpaidInvoices"
							:key="invoice.name"
							class="pos-inv-row-card flex flex-col overflow-hidden group"
						>
							<div class="px-4 py-3.5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
								<!-- Zone 1: Invoice ID, Status & Timestamp -->
								<div class="w-full lg:w-[240px] shrink-0 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-slate-200 pb-3 lg:pb-0 lg:pe-4 text-start">
									<div class="flex items-center gap-1.5 mb-1 flex-wrap">
										<h4 class="text-sm md:text-base font-extrabold text-slate-900 tabular-nums">
											{{ invoice.name }}
										</h4>
										<MdxBadge :variant="getInvoiceBadgeVariant(invoice)" size="sm">
											{{ __(invoice.status) }}
										</MdxBadge>
									</div>
									<p class="text-xs text-slate-500 tabular-nums">
										{{ formatDate(invoice.posting_date) }} {{ formatTime(invoice.posting_time) }}
									</p>
									<p
										v-if="showProfileSelector && (invoice.pos_profile_label || invoice.pos_profile)"
										class="text-[11px] font-medium text-slate-500 mt-0.5 truncate"
									>
										{{ invoice.pos_profile_label || invoice.pos_profile }}
									</p>
								</div>

								<!-- Zone 2: Customer & Salesperson -->
								<div class="w-full lg:w-[220px] shrink-0 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-slate-200 pb-3 lg:pb-0 lg:pe-4 min-w-0 text-start">
									<span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
										{{ __("Cliente") }}
									</span>
									<p class="text-sm font-bold text-slate-900 truncate leading-snug mt-0.5">
										{{ invoice.customer_name || invoice.customer }}
									</p>
									<div v-if="invoice.owner_full_name || invoice.owner" class="text-xs text-slate-500 mt-1 flex items-center gap-1 truncate">
										<span class="font-bold text-slate-400 uppercase text-[9px] tracking-wider">{{ __("Vendedor:") }}</span>
										<span class="font-semibold text-slate-600 truncate">
											{{ invoice.owner_full_name || invoice.owner.split("@")[0] }}
										</span>
									</div>
								</div>

								<!-- Zone 3: Amounts Breakdown & Payment History Pills -->
								<div class="flex-1 min-w-0 border-b lg:border-b-0 lg:border-r border-slate-200 pb-3 lg:pb-0 lg:pe-4 flex flex-col justify-center text-start gap-1.5">
									<div class="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs tabular-nums">
										<div>
											<span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{{ __("Total Amount") }}</span>
											<span class="font-bold text-slate-900">{{ formatCurrency(invoice.grand_total) }}</span>
										</div>
										<div>
											<span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{{ __("Paid") }}</span>
											<span class="font-bold text-slate-700">{{ formatCurrency(invoice.paid_amount) }}</span>
										</div>
										<div v-if="(invoice.paid_amount || 0) > 0 && invoice.grand_total > 0" class="min-w-[90px] flex-1 max-w-[160px]">
											<div class="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
												<span>{{ __("Avance") }}</span>
												<span class="font-bold text-slate-700">{{ Math.min(100, Math.round((invoice.paid_amount / invoice.grand_total) * 100)) }}%</span>
											</div>
											<div class="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
												<div
													class="h-full bg-blue-600 transition-all duration-300"
													:style="{ width: `${Math.min(100, (invoice.paid_amount / invoice.grand_total) * 100)}%` }"
												></div>
											</div>
										</div>
									</div>

									<div v-if="invoice.payments && invoice.payments.length > 0" class="flex flex-wrap items-center gap-1.5">
										<span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 me-0.5">
											{{ __("Cobros:") }}
										</span>
										<span
											v-for="(payment, idx) in invoice.payments"
											:key="idx"
											class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[11px] text-slate-700 tabular-nums"
										>
											<span class="font-medium">{{ payment.mode_of_payment || __("N/A") }}</span>
											<span class="font-bold text-slate-900">{{ formatCurrency(payment.amount) }}</span>
											<span v-if="payment.posting_date" class="text-[10px] text-slate-400">
												({{ formatDate(payment.posting_date) }})
											</span>
										</span>
									</div>
								</div>

								<!-- Zone 4: Outstanding Amount & Actions -->
								<div class="w-full lg:w-auto shrink-0 flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-3.5">
									<div class="flex flex-col lg:items-end shrink-0 whitespace-nowrap text-start lg:text-end">
										<span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">
											{{ __("Saldo Pendiente") }}
										</span>
										<span class="text-base md:text-lg font-extrabold text-slate-900 tabular-nums mt-1">
											{{ formatCurrency(invoice.outstanding_amount) }}
										</span>
									</div>

									<div class="flex items-center gap-1.5 shrink-0">
										<MdxButton
											variant="primary"
											size="sm"
											:loading="loadingInvoiceDetails"
											:disabled="isOffline()"
											:title="isOffline() ? __('Payments cannot be added while offline') : ''"
											@click="selectInvoiceForPayment(invoice)"
										>
											{{ __("Add Payment") }}
										</MdxButton>

										<button
											type="button"
											@click="$emit('print-invoice', invoice)"
											class="w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg transition-all shadow-2xs cursor-pointer"
											:title="__('Print')"
										>
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
												<path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
											</svg>
										</button>

										<button
											type="button"
											@click="openDocumentPDF(invoice.doctype || 'Sales Invoice', invoice.name)"
											class="h-8 px-2.5 inline-flex items-center justify-center gap-1 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-700 hover:text-red-700 rounded-lg transition-all shadow-2xs cursor-pointer"
											:title="__('Abrir PDF Tamaño Carta')"
										>
											<svg class="w-3.5 h-3.5 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
												<path stroke-linecap="round" stroke-linejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
												<path stroke-linecap="round" stroke-linejoin="round" d="M14 2v6h6M9 15h6M9 11h2" />
											</svg>
											<span class="text-[11px] font-extrabold tracking-tight">PDF</span>
										</button>

										<button
											v-if="posSettingsStore.enableWhatsappSend"
											type="button"
											@click="$emit('whatsapp-invoice', invoice)"
											class="w-8 h-8 flex items-center justify-center bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-slate-600 hover:text-emerald-700 rounded-lg transition-all shadow-2xs cursor-pointer"
											:title="__('Enviar por WhatsApp')"
										>
											<svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
												<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
											</svg>
										</button>

										<button
											v-if="canCancelInvoice(invoice)"
											type="button"
											@click="openCancelModal(invoice)"
											class="w-8 h-8 flex items-center justify-center bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-700 rounded-lg transition-all shadow-2xs cursor-pointer"
											:title="__('Anular Venta')"
										>
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
												<path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
											</svg>
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- ============================================================ -->
				<!-- TAB 2: INVOICE HISTORY                                       -->
				<!-- ============================================================ -->
				<div v-else-if="activeTab === 'history'" class="flex-1 flex flex-col gap-3">
					<InvoiceFilters
						:unique-customers="invoiceFilters.uniqueCustomers.value"
						:unique-products="invoiceFilters.uniqueProducts.value"
						:filter-stats="invoiceFilters.filterStats.value"
					/>

					<!-- Empty State -->
					<div
						v-if="filteredHistoryInvoices.length === 0"
						class="flex-1 flex flex-col items-center justify-center text-center py-12"
					>
						<div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-200 shadow-2xs">
							<svg class="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8">
								<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
						</div>
						<p class="text-sm font-semibold text-slate-700">{{ __("No invoices found") }}</p>
						<p class="text-xs text-slate-500 mt-1">{{ __("Intente ajustar los filtros de búsqueda") }}</p>
					</div>

					<!-- Horizontal 4-Zone History Rows -->
					<div v-else class="flex flex-col gap-3">
						<div
							v-for="invoice in paginatedHistoryInvoices"
							:key="invoice.name"
							class="pos-inv-row-card flex flex-col overflow-hidden group"
						>
							<div
								class="px-4 py-3.5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 cursor-pointer"
								@click="$emit('view-invoice', invoice)"
							>
								<!-- Zone 1: Invoice ID, Status & Timestamp -->
								<div class="w-full lg:w-[240px] shrink-0 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-slate-200 pb-3 lg:pb-0 lg:pe-4 text-start">
									<div class="flex items-center gap-1.5 mb-1 flex-wrap">
										<h4 class="text-sm md:text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors tabular-nums">
											{{ invoice.name }}
										</h4>
										<MdxBadge :variant="getInvoiceBadgeVariant(invoice)" size="sm">
											{{ __(invoice.status) }}
										</MdxBadge>
									</div>
									<p class="text-xs text-slate-500 tabular-nums">
										{{ formatDate(invoice.posting_date) }} {{ formatTime(invoice.posting_time) }}
									</p>
									<p
										v-if="showProfileSelector && (invoice.pos_profile_label || invoice.pos_profile)"
										class="text-[11px] font-medium text-slate-500 mt-0.5 truncate"
									>
										{{ invoice.pos_profile_label || invoice.pos_profile }}
									</p>
								</div>

								<!-- Zone 2: Customer, Salesperson & Payment Mode -->
								<div class="w-full lg:w-[230px] shrink-0 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-slate-200 pb-3 lg:pb-0 lg:pe-4 min-w-0 text-start">
									<span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
										{{ __("Cliente") }}
									</span>
									<p class="text-sm font-bold text-slate-900 truncate leading-snug mt-0.5">
										{{ invoice.customer_name || invoice.customer }}
									</p>
									<div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 mt-1">
										<span v-if="invoice.owner_full_name || invoice.owner" class="truncate">
											<span class="font-bold text-slate-400 uppercase text-[9px] tracking-wider">{{ __("Vendedor:") }}</span>
											{{ invoice.owner_full_name || invoice.owner.split("@")[0] }}
										</span>
										<span class="truncate text-slate-600 font-medium" :title="formatPaymentModes(invoice)">
											{{ formatPaymentModes(invoice) }}
										</span>
									</div>
								</div>

								<!-- Zone 3: Items Preview & Expandable MdxDataTable + Balance Summary -->
								<div class="flex-1 min-w-0 border-b lg:border-b-0 lg:border-r border-slate-200 pb-3 lg:pb-0 lg:pe-4 flex flex-col justify-center text-start">
									<template v-if="Array.isArray(invoice.items) && invoice.items.length > 0">
										<div class="flex items-center justify-between gap-2 mb-1.5">
											<span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
												{{ __("Detalle de Items") }} ({{ invoice.items.length }})
											</span>
											<button
												type="button"
												@click.stop="toggleExpandRow(`inv-${invoice.name}`)"
												class="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 px-1.5 py-0.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
											>
												<span>{{ isRowExpanded(`inv-${invoice.name}`) ? __("Ocultar detalle") : __("Ver detalle") }}</span>
												<svg
													class="w-3.5 h-3.5 transition-transform duration-150"
													:class="isRowExpanded(`inv-${invoice.name}`) ? 'rotate-180' : ''"
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
												v-for="(item, idx) in getPreviewItems(invoice.items)"
												:key="idx"
												class="text-[11px] bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg truncate max-w-[240px] xl:max-w-[280px] font-medium"
											>
												{{ item.item_name || item.item_code }}{{ (item.custom_medida || item.medida) ? " (" + (item.custom_medida || item.medida) + ")" : "" }}
												<span class="text-slate-900 font-extrabold ms-1">x{{ item.quantity || item.qty }}</span>
											</span>
											<button
												v-if="getHiddenItemsCount(invoice.items) > 0"
												type="button"
												@click.stop="toggleExpandRow(`inv-${invoice.name}`)"
												class="text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer shrink-0"
												:class="
													isRowExpanded(`inv-${invoice.name}`)
														? 'bg-slate-900 border-slate-900 text-white'
														: 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
												"
											>
												{{ isRowExpanded(`inv-${invoice.name}`) ? __("Menos") : `+${getHiddenItemsCount(invoice.items)} ${__("más")}` }}
											</button>
										</div>
									</template>
									<div v-else class="flex flex-wrap items-center gap-4 text-xs tabular-nums">
										<div>
											<span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{{ __("Paid") }}</span>
											<span class="font-bold text-slate-900">{{ formatCurrency(invoice.paid_amount || 0) }}</span>
										</div>
										<div v-if="(invoice.outstanding_amount || 0) > 0.01">
											<span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{{ __("Saldo Pendiente") }}</span>
											<span class="font-bold text-slate-700">{{ formatCurrency(invoice.outstanding_amount || 0) }}</span>
										</div>
									</div>
								</div>

								<!-- Zone 4: Grand Total & Neutral Actions -->
								<div class="w-full lg:w-auto shrink-0 flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-3.5" @click.stop>
									<div class="flex flex-col lg:items-end shrink-0 whitespace-nowrap text-start lg:text-end">
										<span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">
											{{ __("Total") }}
										</span>
										<span class="text-base md:text-lg font-extrabold text-slate-900 tabular-nums mt-1">
											{{ formatCurrency(invoice.grand_total) }}
										</span>
										<span
											v-if="(invoice.outstanding_amount || 0) > 0.01"
											class="text-[11px] font-semibold text-slate-500 tabular-nums"
										>
											{{ __("Saldo:") }} {{ formatCurrency(invoice.outstanding_amount) }}
										</span>
									</div>

									<div class="flex items-center gap-1.5 shrink-0">
										<MdxButton
											variant="secondary"
											size="sm"
											@click="$emit('view-invoice', invoice)"
										>
											{{ __("View") }}
										</MdxButton>

										<button
											type="button"
											@click="$emit('print-invoice', invoice)"
											class="w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg transition-all shadow-2xs cursor-pointer"
											:title="__('Print')"
										>
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
												<path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
											</svg>
										</button>

										<button
											type="button"
											@click="openDocumentPDF(invoice.doctype || 'Sales Invoice', invoice.name)"
											class="h-8 px-2.5 inline-flex items-center justify-center gap-1 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-700 hover:text-red-700 rounded-lg transition-all shadow-2xs cursor-pointer"
											:title="__('Abrir PDF Tamaño Carta')"
										>
											<svg class="w-3.5 h-3.5 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
												<path stroke-linecap="round" stroke-linejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
												<path stroke-linecap="round" stroke-linejoin="round" d="M14 2v6h6M9 15h6M9 11h2" />
											</svg>
											<span class="text-[11px] font-extrabold tracking-tight">PDF</span>
										</button>

										<button
											v-if="posSettingsStore.enableWhatsappSend"
											type="button"
											@click="$emit('whatsapp-invoice', invoice)"
											class="w-8 h-8 flex items-center justify-center bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-slate-600 hover:text-emerald-700 rounded-lg transition-all shadow-2xs cursor-pointer"
											:title="__('Enviar por WhatsApp')"
										>
											<svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
												<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
											</svg>
										</button>

										<button
											v-if="canCancelInvoice(invoice)"
											type="button"
											@click="openCancelModal(invoice)"
											class="w-8 h-8 flex items-center justify-center bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-700 rounded-lg transition-all shadow-2xs cursor-pointer"
											:title="__('Anular Venta')"
										>
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
												<path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
											</svg>
										</button>
									</div>
								</div>
							</div>

							<!-- Expandable Items Detail Sub-Table (MdxDataTable) -->
							<div
								v-if="isRowExpanded(`inv-${invoice.name}`) && Array.isArray(invoice.items) && invoice.items.length > 0"
								class="border-t border-slate-200 bg-slate-50/80 px-4 py-3 inv-items-subtable"
								@click.stop
							>
								<MdxDataTable
									:columns="detailItemColumns"
									:rows="buildDetailTableRows(invoice.items, `inv-${invoice.name}`)"
									row-key="_rowKey"
									pagination-mode="none"
									:page-size="0"
									:empty-title="__('Sin artículos registrados')"
								>
									<template #cell-line_no="{ row }">
										<span class="text-xs font-semibold text-slate-400 tabular-nums">{{ row.line_no }}</span>
									</template>
									<template #cell-item_code="{ row }">
										<span class="text-xs font-bold text-slate-700 tabular-nums">{{ row.item_code }}</span>
									</template>
									<template #cell-item_display="{ row }">
										<div class="min-w-0">
											<p class="text-xs font-semibold text-slate-900 truncate">{{ row.item_name }}</p>
											<p v-if="row.medida" class="text-[11px] text-slate-500 truncate">{{ row.medida }}</p>
										</div>
									</template>
									<template #cell-warehouse_display="{ row }">
										<span class="text-xs text-slate-600">{{ row.warehouse_display }}</span>
									</template>
									<template #cell-qty_display="{ row }">
										<span class="text-xs font-bold text-slate-900 tabular-nums">{{ row.qty_display }}</span>
									</template>
									<template #cell-rate_display="{ row }">
										<span class="text-xs text-slate-700 tabular-nums">{{ row.rate_display }}</span>
									</template>
									<template #cell-amount_display="{ row }">
										<span class="text-xs font-extrabold text-slate-900 tabular-nums">{{ row.amount_display }}</span>
									</template>
								</MdxDataTable>
							</div>
						</div>
					</div>
				</div>

				<!-- ============================================================ -->
				<!-- TAB 3: DRAFTS / SALES ORDERS / QUOTATIONS                    -->
				<!-- ============================================================ -->
				<div v-else-if="activeTab === 'drafts'" class="flex-1 flex flex-col">
					<!-- Empty State -->
					<div
						v-if="filteredDrafts.length === 0"
						class="flex-1 flex flex-col items-center justify-center text-center py-12"
					>
						<div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-200 shadow-2xs">
							<svg class="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8">
								<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
						</div>
						<p class="text-sm font-semibold text-slate-700">
							{{ draftsSearchQuery ? __("No se encontraron resultados") : __("No draft invoices") }}
						</p>
						<p class="text-xs text-slate-500 mt-1">
							{{ __("Save invoices as drafts to continue later") }}
						</p>
					</div>

					<!-- Horizontal 4-Zone Cards (Matching DraftInvoicesDialog) -->
					<div v-else class="flex flex-col gap-3">
						<div
							v-for="draft in paginatedDrafts"
							:key="draft.draft_id"
							class="pos-inv-row-card flex flex-col overflow-hidden group"
							:class="isDraftQuotation(draft) ? 'pos-inv-row-card--quotation' : ''"
						>
							<div
								class="px-4 py-3.5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 cursor-pointer"
								@click="$emit('load-draft', draft)"
							>
								<!-- Zone 1: Doc ID, Type & Status -->
								<div class="w-full lg:w-[240px] shrink-0 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-slate-200 pb-3 lg:pb-0 lg:pe-4 text-start">
									<div class="flex items-center gap-1.5 mb-1 flex-wrap">
										<h4 class="text-sm md:text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors tabular-nums">
											{{ draft.draft_id }}
										</h4>
										<MdxBadge :variant="isDraftQuotation(draft) ? 'info' : 'neutral'" size="sm">
											{{ isDraftQuotation(draft) ? __("Cotización") : __("Pre-venta") }}
										</MdxBadge>
										<MdxBadge
											v-if="draft.docstatus === 1"
											variant="warning"
											size="sm"
											:dot="true"
										>
											{{ __("Pendiente") }}
										</MdxBadge>
										<MdxBadge v-else variant="neutral" size="sm">
											{{ __("Borrador") }}
										</MdxBadge>
									</div>
									<p class="text-xs text-slate-500 tabular-nums">
										{{ formatDateTime(draft.created_at) }}
									</p>
								</div>

								<!-- Zone 2: Customer & Salesperson -->
								<div class="w-full lg:w-[230px] shrink-0 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-slate-200 pb-3 lg:pb-0 lg:pe-4 min-w-0 text-start">
									<span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
										{{ __("Cliente") }}
									</span>
									<p class="text-sm font-bold text-slate-900 truncate leading-snug mt-0.5">
										{{ draft.customer?.customer_name || draft.customer?.name || draft.customer || __("Sin cliente") }}
									</p>
									<div v-if="draft.owner" class="text-xs text-slate-500 mt-1 flex items-center gap-1 truncate">
										<span class="font-bold text-slate-400 uppercase text-[9px] tracking-wider">{{ __("Vendedor:") }}</span>
										<span class="font-semibold text-slate-600 truncate">
											{{ draft.owner_full_name || draft.owner.split("@")[0] }}
										</span>
									</div>
								</div>

								<!-- Zone 3: Items Preview & Expand Trigger -->
								<div class="flex-1 min-w-0 border-b lg:border-b-0 lg:border-r border-slate-200 pb-3 lg:pb-0 lg:pe-4 flex flex-col justify-center text-start">
									<div class="flex items-center justify-between gap-2 mb-1.5">
										<span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
											{{ __("Detalle de Items") }} ({{ draft.items?.length || 0 }})
										</span>
										<button
											v-if="(draft.items?.length || 0) > 0"
											type="button"
											@click.stop="toggleExpandRow(`draft-${draft.draft_id}`)"
											class="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 px-1.5 py-0.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
										>
											<span>{{ isRowExpanded(`draft-${draft.draft_id}`) ? __("Ocultar detalle") : __("Ver detalle") }}</span>
											<svg
												class="w-3.5 h-3.5 transition-transform duration-150"
												:class="isRowExpanded(`draft-${draft.draft_id}`) ? 'rotate-180' : ''"
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
											v-for="(item, idx) in getPreviewItems(draft.items)"
											:key="idx"
											class="text-[11px] bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg truncate max-w-[240px] xl:max-w-[280px] font-medium"
										>
											{{ item.item_name || item.item_code }}{{ (item.custom_medida || item.medida) ? " (" + (item.custom_medida || item.medida) + ")" : "" }}
											<span class="text-slate-900 font-extrabold ms-1">x{{ item.quantity || item.qty }}</span>
										</span>
										<button
											v-if="getHiddenItemsCount(draft.items) > 0"
											type="button"
											@click.stop="toggleExpandRow(`draft-${draft.draft_id}`)"
											class="text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer shrink-0"
											:class="
												isRowExpanded(`draft-${draft.draft_id}`)
													? 'bg-slate-900 border-slate-900 text-white'
													: 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
											"
										>
											{{ isRowExpanded(`draft-${draft.draft_id}`) ? __("Menos") : `+${getHiddenItemsCount(draft.items)} ${__("más")}` }}
										</button>
									</div>
								</div>

								<!-- Zone 4: Amount & Quick Actions -->
								<div class="w-full lg:w-auto shrink-0 flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-3.5" @click.stop>
									<div class="flex flex-col lg:items-end shrink-0 whitespace-nowrap text-start lg:text-end">
										<span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">
											{{ __("Total a Cobrar") }}
										</span>
										<span class="text-base md:text-lg font-extrabold text-slate-900 tabular-nums mt-1">
											{{ formatCurrency(calculateDraftTotal(draft.items)) }}
										</span>
									</div>

									<div class="flex items-center gap-1.5 shrink-0">
										<MdxButton
											variant="primary"
											size="sm"
											@click.stop="$emit('load-draft', draft)"
										>
											{{ bootstrapStore.canCheckout() ? __("Vender / Cobrar") : __("Cargar") }}
										</MdxButton>

										<button
											v-if="isServerDraft(draft.draft_id)"
											type="button"
											@click.stop="
												$emit('print-invoice', {
													name: draft.draft_id,
													doctype: draft.doctype || 'Sales Order',
												})
											"
											class="w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg transition-all shadow-2xs cursor-pointer"
											:title="__('Imprimir')"
										>
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
												<path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
											</svg>
										</button>

										<button
											v-if="isServerDraft(draft.draft_id)"
											type="button"
											@click.stop="openDraftPDF(draft)"
											class="h-8 px-2.5 inline-flex items-center justify-center gap-1 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-700 hover:text-red-700 rounded-lg transition-all shadow-2xs cursor-pointer"
											:title="__('Abrir PDF Tamaño Carta')"
										>
											<svg class="w-3.5 h-3.5 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
												<path stroke-linecap="round" stroke-linejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
												<path stroke-linecap="round" stroke-linejoin="round" d="M14 2v6h6M9 15h6M9 11h2" />
											</svg>
											<span class="text-[11px] font-extrabold tracking-tight">PDF</span>
										</button>

										<button
											v-if="posSettingsStore.enableWhatsappSend"
											type="button"
											@click.stop="
												$emit('whatsapp-invoice', {
													name: draft.draft_id,
													draft_id: draft.draft_id,
													doctype: draft.doctype,
													items: draft.items || [],
													customer: draft.customer,
													customer_name: draft.customer?.customer_name || draft.customer?.name || draft.customer,
													grand_total: calculateDraftTotal(draft.items),
													posting_date: draft.created_at,
												})
											"
											class="w-8 h-8 flex items-center justify-center bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-slate-600 hover:text-emerald-700 rounded-lg transition-all shadow-2xs cursor-pointer"
											:title="__('Enviar por WhatsApp')"
										>
											<svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
												<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
											</svg>
										</button>

										<button
											v-if="canDiscardDrafts"
											type="button"
											@click.stop="$emit('delete-draft', draft.draft_id)"
											class="w-8 h-8 flex items-center justify-center bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-700 rounded-lg transition-all shadow-2xs cursor-pointer"
											:title="__('Anular / descartar documento')"
										>
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
												<path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
											</svg>
										</button>
									</div>
								</div>
							</div>

							<!-- Expandable Items Detail Sub-Table (MdxDataTable) -->
							<div
								v-if="isRowExpanded(`draft-${draft.draft_id}`)"
								class="border-t border-slate-200 bg-slate-50/80 px-4 py-3 inv-items-subtable"
								@click.stop
							>
								<MdxDataTable
									:columns="detailItemColumns"
									:rows="buildDetailTableRows(draft.items, `draft-${draft.draft_id}`)"
									row-key="_rowKey"
									pagination-mode="none"
									:page-size="0"
									:empty-title="__('Sin artículos registrados')"
								>
									<template #cell-line_no="{ row }">
										<span class="text-xs font-semibold text-slate-400 tabular-nums">{{ row.line_no }}</span>
									</template>
									<template #cell-item_code="{ row }">
										<span class="text-xs font-bold text-slate-700 tabular-nums">{{ row.item_code }}</span>
									</template>
									<template #cell-item_display="{ row }">
										<div class="min-w-0">
											<p class="text-xs font-semibold text-slate-900 truncate">{{ row.item_name }}</p>
											<p v-if="row.medida" class="text-[11px] text-slate-500 truncate">{{ row.medida }}</p>
										</div>
									</template>
									<template #cell-warehouse_display="{ row }">
										<span class="text-xs text-slate-600">{{ row.warehouse_display }}</span>
									</template>
									<template #cell-qty_display="{ row }">
										<span class="text-xs font-bold text-slate-900 tabular-nums">{{ row.qty_display }}</span>
									</template>
									<template #cell-rate_display="{ row }">
										<span class="text-xs text-slate-700 tabular-nums">{{ row.rate_display }}</span>
									</template>
									<template #cell-amount_display="{ row }">
										<span class="text-xs font-extrabold text-slate-900 tabular-nums">{{ row.amount_display }}</span>
									</template>
								</MdxDataTable>
							</div>
						</div>
					</div>
				</div>

				<!-- ============================================================ -->
				<!-- TAB 4: RETURN INVOICES                                       -->
				<!-- ============================================================ -->
				<div v-else-if="activeTab === 'returns'" class="flex-1 flex flex-col">
					<!-- Empty State -->
					<div
						v-if="filteredReturnInvoices.length === 0"
						class="flex-1 flex flex-col items-center justify-center text-center py-12"
					>
						<div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-200 shadow-2xs">
							<svg class="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8">
								<path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
							</svg>
						</div>
						<p class="text-sm font-semibold text-slate-700">{{ __("No return invoices") }}</p>
						<p class="text-xs text-slate-500 mt-1">{{ __("Return invoices will appear here") }}</p>
					</div>

					<!-- Horizontal 4-Zone Return Cards -->
					<div v-else class="flex flex-col gap-3">
						<div
							v-for="invoice in paginatedReturnInvoices"
							:key="invoice.name"
							class="pos-inv-row-card pos-inv-row-card--return flex flex-col overflow-hidden group"
						>
							<div
								class="px-4 py-3.5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 cursor-pointer"
								@click="$emit('view-invoice', invoice)"
							>
								<!-- Zone 1: Return ID & Status -->
								<div class="w-full lg:w-[240px] shrink-0 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-slate-200 pb-3 lg:pb-0 lg:pe-4 text-start">
									<div class="flex items-center gap-1.5 mb-1 flex-wrap">
										<h4 class="text-sm md:text-base font-extrabold text-slate-900 tabular-nums">
											{{ invoice.name }}
										</h4>
										<MdxBadge variant="danger" size="sm">
											{{ __("Return") }}
										</MdxBadge>
									</div>
									<p class="text-xs text-slate-500 tabular-nums">
										{{ formatDate(invoice.posting_date) }} {{ formatTime(invoice.posting_time) }}
									</p>
									<p
										v-if="showProfileSelector && (invoice.pos_profile_label || invoice.pos_profile)"
										class="text-[11px] font-medium text-slate-500 mt-0.5 truncate"
									>
										{{ invoice.pos_profile_label || invoice.pos_profile }}
									</p>
								</div>

								<!-- Zone 2: Customer & Salesperson -->
								<div class="w-full lg:w-[220px] shrink-0 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-slate-200 pb-3 lg:pb-0 lg:pe-4 min-w-0 text-start">
									<span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
										{{ __("Cliente") }}
									</span>
									<p class="text-sm font-bold text-slate-900 truncate leading-snug mt-0.5">
										{{ invoice.customer_name || invoice.customer }}
									</p>
									<div v-if="invoice.owner_full_name || invoice.owner" class="text-xs text-slate-500 mt-1 truncate">
										<span class="font-bold text-slate-400 uppercase text-[9px] tracking-wider">{{ __("Vendedor:") }}</span>
										{{ invoice.owner_full_name || invoice.owner.split("@")[0] }}
									</div>
								</div>

								<!-- Zone 3: Return Reference & Items Preview -->
								<div class="flex-1 min-w-0 border-b lg:border-b-0 lg:border-r border-slate-200 pb-3 lg:pb-0 lg:pe-4 flex flex-col justify-center text-start gap-1.5">
									<div v-if="invoice.return_against" class="flex items-center gap-1.5 flex-wrap">
										<span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
											{{ __("Documento Origen:") }}
										</span>
										<span class="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 tabular-nums">
											{{ invoice.return_against }}
										</span>
									</div>
									<div v-if="Array.isArray(invoice.items) && invoice.items.length > 0" class="flex flex-wrap gap-1.5">
										<span
											v-for="(item, idx) in getPreviewItems(invoice.items)"
											:key="idx"
											class="text-[11px] bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg truncate max-w-[240px] font-medium"
										>
											{{ item.item_name || item.item_code }}
											<span class="text-slate-900 font-extrabold ms-1">x{{ Math.abs(item.quantity || item.qty || 0) }}</span>
										</span>
									</div>
								</div>

								<!-- Zone 4: Return Amount & Actions -->
								<div class="w-full lg:w-auto shrink-0 flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-3.5" @click.stop>
									<div class="flex flex-col lg:items-end shrink-0 whitespace-nowrap text-start lg:text-end">
										<span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">
											{{ __("Total Devuelto") }}
										</span>
										<span class="text-base md:text-lg font-extrabold text-slate-900 tabular-nums mt-1">
											-{{ formatCurrency(Math.abs(invoice.grand_total)) }}
										</span>
									</div>

									<div class="flex items-center gap-1.5 shrink-0">
										<MdxButton
											variant="secondary"
											size="sm"
											@click="$emit('view-invoice', invoice)"
										>
											{{ __("View") }}
										</MdxButton>

										<button
											type="button"
											@click="$emit('print-invoice', invoice)"
											class="w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg transition-all shadow-2xs cursor-pointer"
											:title="__('Print')"
										>
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
												<path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
											</svg>
										</button>

										<button
											type="button"
											@click="openDocumentPDF(invoice.doctype || 'Sales Invoice', invoice.name)"
											class="h-8 px-2.5 inline-flex items-center justify-center gap-1 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-700 hover:text-red-700 rounded-lg transition-all shadow-2xs cursor-pointer"
											:title="__('Abrir PDF Tamaño Carta')"
										>
											<svg class="w-3.5 h-3.5 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
												<path stroke-linecap="round" stroke-linejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
												<path stroke-linecap="round" stroke-linejoin="round" d="M14 2v6h6M9 15h6M9 11h2" />
											</svg>
											<span class="text-[11px] font-extrabold tracking-tight">PDF</span>
										</button>

										<button
											v-if="posSettingsStore.enableWhatsappSend"
											type="button"
											@click="$emit('whatsapp-invoice', invoice)"
											class="w-8 h-8 flex items-center justify-center bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-slate-600 hover:text-emerald-700 rounded-lg transition-all shadow-2xs cursor-pointer"
											:title="__('Enviar por WhatsApp')"
										>
											<svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
												<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
											</svg>
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- ============================================================ -->
				<!-- TAB 5: DESPACHOS EN CAMION                                   -->
				<!-- ============================================================ -->
				<div v-else-if="activeTab === 'despachos'" class="flex-1 flex flex-col">
					<!-- Empty State -->
					<div
						v-if="filteredDispatches.length === 0"
						class="flex-1 flex flex-col items-center justify-center text-center py-12"
					>
						<div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-200 shadow-2xs">
							<svg class="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8">
								<path stroke-linecap="round" stroke-linejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
							</svg>
						</div>
						<p class="text-sm font-semibold text-slate-700">{{ __("No hay despachos registrados") }}</p>
						<p class="text-xs text-slate-500 mt-1 max-w-sm">
							{{ __("Las ventas marcadas con 'Despacho en Camión' aparecerán aquí organizadas para la carga del camión y cobro.") }}
						</p>
					</div>

					<!-- Horizontal 4-Zone Dispatch Cards -->
					<div v-else class="flex flex-col gap-3">
						<div
							v-for="dispatch in paginatedDispatches"
							:key="dispatch.name"
							class="pos-inv-row-card flex flex-col overflow-hidden"
							:class="isDispatchDelivered(dispatch) ? 'pos-inv-row-card--delivered' : ''"
						>
							<div class="px-4 py-3.5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
								<!-- Zone 1: Doc ID, Delivery Status & Scheduled Date -->
								<div class="w-full lg:w-[240px] shrink-0 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-slate-200 pb-3 lg:pb-0 lg:pe-4 text-start">
									<div class="flex items-center gap-1.5 mb-1 flex-wrap">
										<h4 class="text-sm md:text-base font-extrabold text-slate-900 tabular-nums">
											{{ dispatch.name }}
										</h4>
										<MdxBadge :variant="isDispatchDelivered(dispatch) ? 'success' : 'warning'" size="sm">
											{{ dispatch.custom_estado_entrega || __("Pendiente de Carga") }}
										</MdxBadge>
									</div>
									<p class="text-xs text-slate-500">
										<span class="font-semibold">{{ __("Entrega:") }}</span>
										{{ formatDate(dispatch.custom_fecha_entrega) || __("Hoy") }}
									</p>
									<p
										v-if="showProfileSelector && (dispatch.pos_profile_label || dispatch.pos_profile)"
										class="text-[11px] font-medium text-slate-500 mt-0.5 truncate"
									>
										{{ dispatch.pos_profile_label || dispatch.pos_profile }}
									</p>
								</div>

								<!-- Zone 2: Customer & Contact Phone -->
								<div class="w-full lg:w-[220px] shrink-0 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-slate-200 pb-3 lg:pb-0 lg:pe-4 min-w-0 text-start">
									<span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
										{{ __("Cliente") }}
									</span>
									<p class="text-sm font-bold text-slate-900 truncate leading-snug mt-0.5">
										{{ dispatch.customer_name || dispatch.customer }}
									</p>
									<div v-if="dispatch.custom_telefono_contacto" class="text-xs text-slate-600 mt-1 truncate tabular-nums">
										<span class="font-bold text-slate-400 uppercase text-[9px] tracking-wider">{{ __("Tel:") }}</span>
										<a :href="`tel:${dispatch.custom_telefono_contacto}`" class="font-semibold text-slate-700 hover:underline ms-1">
											{{ dispatch.custom_telefono_contacto }}
										</a>
									</div>
								</div>

								<!-- Zone 3: Delivery Address & Collection Mode -->
								<div class="flex-1 min-w-0 border-b lg:border-b-0 lg:border-r border-slate-200 pb-3 lg:pb-0 lg:pe-4 flex flex-col justify-center text-start gap-1">
									<div v-if="dispatch.custom_direccion_entrega">
										<span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
											{{ __("Puesto / Dirección") }}
										</span>
										<p class="text-xs font-medium text-slate-800 leading-snug">
											{{ dispatch.custom_direccion_entrega }}
										</p>
									</div>
									<div v-if="dispatch.custom_modalidad_cobro_chofer" class="text-xs text-slate-600">
										<span class="font-bold text-slate-400 uppercase text-[9px] tracking-wider">{{ __("Modalidad:") }}</span>
										<span class="ms-1 font-medium text-slate-700">
											{{
												dispatch.custom_modalidad_cobro_chofer === "Cobrar al Chofer Contra Entrega"
													? __("Pagar al Chofer Contra Entrega")
													: dispatch.custom_modalidad_cobro_chofer
											}}
										</span>
									</div>
								</div>

								<!-- Zone 4: Balance & Actions -->
								<div class="w-full lg:w-auto shrink-0 flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-3.5">
									<div class="flex flex-col lg:items-end shrink-0 whitespace-nowrap text-start lg:text-end">
										<span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">
											{{ (dispatch.outstanding_amount || 0) > 0.01 ? __("Saldo a Cobrar") : __("Total") }}
										</span>
										<span class="text-base md:text-lg font-extrabold text-slate-900 tabular-nums mt-1">
											{{
												(dispatch.outstanding_amount || 0) > 0.01
													? formatCurrency(dispatch.outstanding_amount)
													: formatCurrency(dispatch.grand_total)
											}}
										</span>
										<span v-if="(dispatch.outstanding_amount || 0) <= 0.01" class="text-[11px] font-semibold text-slate-500">
											{{ __("Pagado") }}
										</span>
									</div>

									<div class="flex items-center gap-1.5 shrink-0">
										<MdxButton
											v-if="!isDispatchDelivered(dispatch)"
											variant="primary"
											size="sm"
											:loading="Boolean(loadingDelivery[dispatch.name])"
											@click="markAsDelivered(dispatch)"
										>
											{{ __("Marcar Entregado") }}
										</MdxButton>

										<button
											type="button"
											@click="$emit('view-invoice', dispatch.name)"
											class="h-8 px-2.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-all shadow-2xs cursor-pointer"
											:title="__('Ver Detalle')"
										>
											{{ __("Ver") }}
										</button>

										<button
											type="button"
											@click="$emit('print-invoice', dispatch)"
											class="w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg transition-all shadow-2xs cursor-pointer"
											:title="__('Imprimir Nota de Venta')"
										>
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
												<path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
											</svg>
										</button>

										<button
											v-if="posSettingsStore.enableWhatsappSend"
											type="button"
											@click="$emit('whatsapp-invoice', dispatch)"
											class="w-8 h-8 flex items-center justify-center bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-slate-600 hover:text-emerald-700 rounded-lg transition-all shadow-2xs cursor-pointer"
											:title="__('Enviar por WhatsApp')"
										>
											<svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
												<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
											</svg>
										</button>

										<button
											v-if="canCancelInvoice(dispatch)"
											type="button"
											@click="openCancelModal(dispatch)"
											class="w-8 h-8 flex items-center justify-center bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-700 rounded-lg transition-all shadow-2xs cursor-pointer"
											:title="__('Anular Venta')"
										>
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
												<path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
											</svg>
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- ============================================================ -->
				<!-- TAB 6: POR ENTREGAR (CUSTODY / PICKUPS)                      -->
				<!-- ============================================================ -->
				<div v-else-if="activeTab === 'pickups'" class="flex-1 flex flex-col gap-3">
					<!-- Loading -->
					<div v-if="loadingPickups" class="flex-1 flex flex-col items-center justify-center py-12">
						<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700 mb-2"></div>
						<p class="text-xs text-slate-500">{{ __("Cargando entregas pendientes...") }}</p>
					</div>

					<!-- View 1: Product Custody Summary (MdxDataTable) -->
					<div v-else-if="pickupViewMode === 'summary'" class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
						<div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 text-start">
							{{ __("Mercadería ya vendida (descontada del stock disponible) que permanece físicamente en almacén esperando retiro del cliente.") }}
						</div>
						<MdxDataTable
							:columns="pickupSummaryColumns"
							:rows="paginatedPickupProductSummary"
							row-key="_rowKey"
							pagination-mode="none"
							:page-size="0"
							:empty-title="__('No hay mercadería pendiente en custodia')"
						>
							<template #cell-item_code="{ row }">
								<span class="text-xs font-mono font-bold text-slate-700">{{ row.item_code }}</span>
							</template>
							<template #cell-item_name="{ row }">
								<span class="text-xs font-semibold text-slate-900">{{ row.item_name }}</span>
							</template>
							<template #cell-pending_display="{ row }">
								<div class="text-end tabular-nums">
									<div class="text-xs font-extrabold text-slate-900">
										{{ formatPickupQty(row.total_pending_qty) }} {{ row.uom }}
									</div>
									<div v-if="row.coverage_uom && row.total_pending_coverage > 0" class="text-[11px] text-slate-500">
										{{ formatPickupQty(row.total_pending_coverage) }} {{ row.coverage_uom }}
									</div>
								</div>
							</template>
							<template #cell-system_stock_qty="{ row }">
								<span class="text-xs text-slate-700 tabular-nums">{{ formatPickupQty(row.system_stock_qty) }}</span>
							</template>
							<template #cell-expected_physical_qty="{ row }">
								<span class="text-xs font-bold text-slate-900 tabular-nums">{{ formatPickupQty(row.expected_physical_qty) }}</span>
							</template>
							<template #cell-orders_count="{ row }">
								<span class="text-xs font-semibold text-slate-700 tabular-nums">{{ row.orders_count }}</span>
							</template>
						</MdxDataTable>
					</div>

					<!-- View 2: Orders List -->
					<div v-else class="flex-1 flex flex-col">
						<div
							v-if="filteredPickupControls.length === 0"
							class="flex-1 flex flex-col items-center justify-center text-center py-12"
						>
							<div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-200 shadow-2xs">
								<svg class="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8">
									<path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
								</svg>
							</div>
							<p class="text-sm font-semibold text-slate-700">
								{{ pickupStatusFilter === "open" ? __("No hay entregas pendientes") : __("No hay entregas completadas") }}
							</p>
							<p class="text-xs text-slate-500 mt-1">
								{{ __("Cuando marques una venta como entrega pendiente o parcial al cobrar, aparecerá aquí.") }}
							</p>
						</div>

						<div v-else class="flex flex-col gap-3">
							<div
								v-for="ctrl in paginatedPickupControls"
								:key="ctrl.name"
								class="pos-inv-row-card p-4 flex flex-col gap-2.5 text-start"
							>
								<!-- Top Header -->
								<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
									<div class="min-w-0">
										<div class="flex items-center gap-2 flex-wrap">
											<span class="text-sm font-extrabold text-slate-900">{{ ctrl.customer_name || ctrl.customer }}</span>
											<MdxBadge
												:variant="ctrl.status === 'Entregado' ? 'success' : ctrl.status === 'Parcial' ? 'warning' : 'info'"
												size="sm"
											>
												{{ ctrl.status }}
											</MdxBadge>
											<span v-if="Number(ctrl.outstanding_amount || 0) > 0.01" class="text-xs font-semibold text-slate-600 tabular-nums">
												· {{ __("Saldo pago:") }} {{ formatCurrency(ctrl.outstanding_amount) }}
											</span>
										</div>
										<div class="text-xs text-slate-500 mt-0.5 tabular-nums">
											{{ ctrl.reference_name }} · {{ ctrl.posting_date }}
											<span v-if="ctrl.notes" class="text-slate-600"> · {{ ctrl.notes }}</span>
										</div>
									</div>

									<div class="flex items-center gap-1.5 shrink-0 flex-wrap">
										<MdxButton
											v-if="ctrl.status === 'Pendiente' || ctrl.status === 'Parcial'"
											variant="primary"
											size="sm"
											@click="openPickupDialog(ctrl)"
										>
											{{ __("Registrar Entrega") }}
										</MdxButton>
										<MdxButton
											variant="secondary"
											size="sm"
											@click="emit('view-invoice', ctrl.reference_name)"
										>
											{{ __("Ver venta") }}
										</MdxButton>
										<MdxButton
											v-if="ctrl.logs && ctrl.logs.length > 0"
											variant="secondary"
											size="sm"
											@click="handlePrintPickupLog(ctrl, ctrl.logs[0])"
										>
											{{ __("Constancia") }}
										</MdxButton>
										<MdxButton
											v-if="posSettingsStore.enableWhatsappSend"
											variant="secondary"
											size="sm"
											@click="handlePickupWhatsApp(ctrl)"
										>
											{{ __("WhatsApp") }}
										</MdxButton>
									</div>
								</div>

								<!-- Items Progress List -->
								<div class="bg-slate-50 border border-slate-200/80 rounded-lg divide-y divide-slate-200/70">
									<div
										v-for="it in ctrl.items"
										:key="it.name"
										class="px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs"
									>
										<div class="min-w-0 flex-1">
											<span class="font-semibold text-slate-800">{{ it.item_name }}</span>
											<span class="text-slate-400 ms-1.5 font-mono text-[11px]">{{ it.item_code }}</span>
										</div>
										<div class="flex items-center gap-3 tabular-nums shrink-0 text-slate-600">
											<span>
												{{ __("Retirado:") }}
												<strong class="text-slate-900">{{ formatPickupQty(it.qty_delivered) }} / {{ formatPickupQty(it.qty_sold) }}</strong>
												{{ it.uom }}
											</span>
											<span class="font-bold text-slate-900">
												{{ __("Faltan:") }} {{ formatPickupQty(it.qty_pending) }} {{ it.uom }}
												<template v-if="it.coverage_uom && it.coverage_pending > 0">
													({{ formatPickupQty(it.coverage_pending) }} {{ it.coverage_uom }})
												</template>
											</span>
										</div>
									</div>
								</div>

								<!-- Collapsible History Logs -->
								<div v-if="ctrl.logs && ctrl.logs.length > 0">
									<button
										type="button"
										@click="togglePickupHistory(ctrl.name)"
										class="text-[11px] font-semibold text-slate-600 hover:text-slate-900 cursor-pointer flex items-center gap-1"
									>
										<span>
											{{
												expandedPickupLogs[ctrl.name]
													? __("Ocultar historial de retiros ({0})", [ctrl.logs.length])
													: __("Ver historial de retiros ({0})", [ctrl.logs.length])
											}}
										</span>
									</button>
									<div
										v-if="expandedPickupLogs[ctrl.name]"
										class="mt-1.5 border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white"
									>
										<div
											v-for="lg in ctrl.logs"
											:key="lg.name"
											class="px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]"
										>
											<div class="min-w-0 flex-1">
												<div class="font-semibold text-slate-800">{{ lg.items_summary }}</div>
												<div class="text-slate-500 mt-0.5">
													{{ formatDateTime(lg.delivery_datetime) }} · {{ __("Retiró:") }} {{ lg.received_by || "-" }} · {{ __("Atendió:") }} {{ lg.delivered_by_name }}
													<span v-if="lg.notes"> · {{ lg.notes }}</span>
												</div>
											</div>
											<MdxButton
												variant="secondary"
												size="sm"
												@click="handlePrintPickupLog(ctrl, lg)"
											>
												{{ __("Imprimir") }}
											</MdxButton>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Standardized Modal Footer (Pagination + Close) -->
		<template #footer>
			<div
				class="flex items-center w-full gap-3"
				:class="totalPages > 1 ? 'justify-between' : 'justify-end'"
			>
				<div v-if="totalPages > 1" class="hidden sm:block"></div>

				<div v-if="totalPages > 1" class="flex items-center gap-3">
					<button
						type="button"
						@click="currentPage--"
						:disabled="currentPage === 1"
						class="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer focus:outline-none"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
						</svg>
					</button>
					<span class="text-xs font-bold text-slate-700 tabular-nums">
						{{ __("Página {0} de {1}", [currentPage, totalPages]) }}
						<span class="text-slate-400 font-medium">({{ __("Total: {0}", [currentListTotal]) }})</span>
					</span>
					<button
						type="button"
						@click="currentPage++"
						:disabled="currentPage === totalPages"
						class="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer focus:outline-none"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
						</svg>
					</button>
				</div>

				<MdxButton variant="secondary" @click="handleClose">
					{{ __("Cerrar") }}
				</MdxButton>
			</div>
		</template>
	</MdxModal>

	<!-- Pickup / Partial Delivery Modal -->
	<PickupDeliveryDialog
		v-model="showPickupDialog"
		:control="selectedPickupControl"
		:currency="currency"
		@delivery-recorded="handlePickupRecorded"
	/>

	<!-- Payment Dialog -->
	<PaymentDialog
		v-model="showPaymentDialog"
		:grand-total="selectedInvoice?.outstanding_amount || 0"
		:subtotal="selectedInvoice?.grand_total || 0"
		:items="selectedInvoice?.items || []"
		:customer="selectedInvoice?.customer_name || selectedInvoice?.customer"
		:existing-invoice="selectedInvoice"
		:pos-profile="posProfile"
		:currency="currency"
		:is-offline="false"
		:allow-partial-payment="true"
		@payment-completed="handlePaymentCompleted"
	/>

	<!-- Cancel Invoice Confirmation Modal (Standardized MdxModal) -->
	<MdxModal
		:modelValue="Boolean(invoiceToCancel)"
		@update:modelValue="(val) => { if (!val) closeCancelModal(); }"
		size="md"
		:persistent="cancellingInvoice"
	>
		<template #header>
			<div class="flex items-center gap-3 min-w-0">
				<div class="w-9 h-9 rounded-xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center shrink-0">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
					</svg>
				</div>
				<div class="min-w-0 text-start">
					<h3 class="text-sm sm:text-base font-bold text-slate-900 truncate">
						{{ __("¿Anular la venta {0}?", [invoiceToCancel?.name || ""]) }}
					</h3>
					<p v-if="invoiceToCancel" class="text-xs text-slate-500 truncate mt-0.5">
						{{ invoiceToCancel.customer_name || invoiceToCancel.customer }} · {{ formatCurrency(invoiceToCancel.grand_total) }}
					</p>
				</div>
			</div>
			<button
				type="button"
				:disabled="cancellingInvoice"
				@click="closeCancelModal"
				class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</template>

		<div v-if="invoiceToCancel" class="space-y-3 text-start">
			<p class="text-xs text-slate-700 bg-red-50 border border-red-200 rounded-xl p-3">
				{{ __("Se anularán automáticamente los cobros/anticipos vinculados y los productos se reingresarán al stock del almacén.") }}
			</p>

			<div>
				<label class="block text-xs font-semibold text-slate-700 mb-1.5">
					{{ __("Motivo de anulación (opcional)") }}
				</label>
				<input
					v-model="cancelReason"
					type="text"
					:placeholder="__('Ej: Error en digitación de productos o cliente...')"
					class="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
					@keyup.enter="confirmCancelInvoice"
				/>
			</div>
		</div>

		<template #footer>
			<div class="flex items-center justify-end gap-2 w-full">
				<MdxButton
					variant="secondary"
					size="sm"
					:disabled="cancellingInvoice"
					@click="closeCancelModal"
				>
					{{ __("No, volver") }}
				</MdxButton>
				<MdxButton
					variant="danger"
					size="sm"
					:loading="cancellingInvoice"
					@click="confirmCancelInvoice"
				>
					{{ cancellingInvoice ? __("Anulando...") : __("Sí, Anular Venta") }}
				</MdxButton>
			</div>
		</template>
	</MdxModal>

	<!-- Universal Synchronization Floating Overlay -->
	<MdxSyncOverlay :show="Boolean(isRefreshingModal)" :label="__('Sincronizando...')" />
</template>

<script setup>
import InvoiceFilters from "@/components/invoices/InvoiceFilters.vue";
import PickupDeliveryDialog from "@/components/invoices/PickupDeliveryDialog.vue";
import PaymentDialog from "@/components/sale/PaymentDialog.vue";
import {
	formatPickupQty,
	openPickupWhatsApp,
	printPickupReceipt,
} from "@/utils/pickupReceipt";
import { useInvoiceFilters } from "@/composables/useInvoiceFilters";
import { useRealtimeStock } from "@/composables/useRealtimeStock";
import { useInvoiceFiltersStore } from "@/stores/invoiceFilters";
import { DEFAULT_CURRENCY, formatCurrency as formatCurrencyUtil, roundCurrency } from "@/utils/currency";
import { getLocalDateString } from "@/utils/date";
import { useFormatters } from "@/composables/useFormatters";
import { useToast } from "@/composables/useToast";
import { call } from "frappe-ui";
import {
	MdxBadge,
	MdxButton,
	MdxDataTable,
	MdxDatePicker,
	MdxModal,
	MdxSearchInput,
	MdxSegmentedControl,
	MdxSelect,
	MdxSyncOverlay,
} from "mdx_ui";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { isOffline } from "@/utils/offline/offlineState";
import {
	cacheUnpaidInvoices,
	getCachedUnpaidInvoices,
	cacheUnpaidSummary,
	getCachedUnpaidSummary,
} from "@/utils/offline/sync";
import { logger } from "@/utils/logger";
import { useBootstrapStore } from "@/stores/bootstrap";
import { usePOSSettingsStore } from "@/stores/posSettings";

const PREVIEW_ITEMS_LIMIT = 2;
const PAGE_SIZE = 10;

const log = logger.create("InvoiceManagement");
const { showSuccess, showError } = useToast();
const { formatDate, formatDateTime, formatTime } = useFormatters();
const { onInvoiceCreated } = useRealtimeStock();
const bootstrapStore = useBootstrapStore();
const posSettingsStore = usePOSSettingsStore();
const canDiscardDrafts = computed(
	() => bootstrapStore.canCheckout() && posSettingsStore.canCancelInvoice
);

const props = defineProps({
	modelValue: Boolean,
	posProfile: String,
	currency: {
		type: String,
		default: DEFAULT_CURRENCY,
	},
	historyInvoices: {
		type: Array,
		default: () => [],
	},
	draftInvoices: {
		type: Array,
		default: () => [],
	},
});

const emit = defineEmits([
	"update:modelValue",
	"view-invoice",
	"print-invoice",
	"whatsapp-invoice",
	"load-draft",
	"delete-draft",
	"refresh-history",
	"invoice-cancelled",
]);

const show = ref(props.modelValue);
const loading = ref(false);
const isRefreshingModal = ref(false);
const activeTab = ref("partial");
const currentPage = ref(1);
const expandedRowIds = ref(new Set());

// Tab-level quick search inputs
const unpaidSearchQuery = ref("");
const draftsSearchQuery = ref("");
const returnsSearchQuery = ref("");

const filterStore = useInvoiceFiltersStore();

// Multi-POS profile scope filter for POS Managers
const scopeProfiles = ref([]);
const selectedProfileFilter = ref("ALL");

const showProfileSelector = computed(
	() => posSettingsStore.canManagePOSSettings && scopeProfiles.value.length > 1
);

const profileFilterOptions = computed(() => [
	{ label: __("Todos los Puntos de Venta"), value: "ALL" },
	...scopeProfiles.value.map((p) => ({
		label: p.label || p.value,
		value: p.value,
	})),
]);

async function loadScopeProfiles() {
	if (!props.posProfile || !posSettingsStore.canManagePOSSettings || isOffline()) {
		scopeProfiles.value = [];
		return;
	}
	try {
		const res = await call("pos_next.api.pos_profile.get_scope_pos_profiles", {
			pos_profile: props.posProfile,
		});
		scopeProfiles.value = Array.isArray(res) ? res : [];
	} catch (err) {
		log.warn("Failed to load scope POS profiles:", err);
	}
}

const scopedHistoryInvoices = computed(() => {
	const allInvoices = Array.isArray(props.historyInvoices) ? props.historyInvoices : [];
	if (!showProfileSelector.value || selectedProfileFilter.value === "ALL") {
		return allInvoices;
	}
	return allInvoices.filter((inv) => inv.pos_profile === selectedProfileFilter.value);
});

const historyInvoicesRef = computed(() => scopedHistoryInvoices.value);
const invoiceFilters = useInvoiceFilters(historyInvoicesRef);

// Unpaid invoices data
const unpaidInvoices = ref([]);
const unpaidFilter = ref("all");
const unpaidSummary = ref({
	count: 0,
	total_outstanding: 0,
	total_paid: 0,
});
const selectedInvoice = ref(null);
const showPaymentDialog = ref(false);
const invoiceToCancel = ref(null);
const cancelReason = ref("");
const cancellingInvoice = ref(false);

const scopedUnpaidInvoices = computed(() => {
	if (!showProfileSelector.value || selectedProfileFilter.value === "ALL") {
		return unpaidInvoices.value;
	}
	return unpaidInvoices.value.filter((inv) => inv.pos_profile === selectedProfileFilter.value);
});

const unpaidFilterChips = computed(() => [
	{ value: "all", label: __("Todos"), count: scopedUnpaidInvoices.value.length },
	{
		value: "partial",
		label: __("Parcialmente Pagado"),
		count: scopedUnpaidInvoices.value.filter((inv) => inv.status === "Partly Paid").length,
	},
	{
		value: "unpaid",
		label: __("Impagado"),
		count: scopedUnpaidInvoices.value.filter((inv) => inv.status === "Unpaid").length,
	},
	{
		value: "overdue",
		label: __("Vencido"),
		count: scopedUnpaidInvoices.value.filter((inv) => inv.status === "Overdue").length,
	},
]);

function canCancelInvoice(invoice) {
	if (!posSettingsStore.canCancelInvoice || !invoice) return false;
	if (isOffline()) return false;
	if (invoice.docstatus !== undefined && Number(invoice.docstatus) !== 1) return false;
	if (invoice.status === "Cancelled" || invoice.status === "Cancelado") return false;
	return true;
}

function openCancelModal(invoice) {
	invoiceToCancel.value = invoice;
	cancelReason.value = "";
}

function closeCancelModal() {
	if (cancellingInvoice.value) return;
	invoiceToCancel.value = null;
	cancelReason.value = "";
}

async function confirmCancelInvoice() {
	if (!invoiceToCancel.value?.name || cancellingInvoice.value) return;
	cancellingInvoice.value = true;
	const targetName = invoiceToCancel.value.name;
	try {
		await call("pos_next.api.invoices.cancel_pos_invoice", {
			invoice_name: targetName,
			reason: cancelReason.value,
			pos_profile: props.posProfile,
		});
		showSuccess(
			__("Nota de venta {0} anulada correctamente. El stock fue reingresado al almacén.", [
				targetName,
			])
		);
		invoiceToCancel.value = null;
		cancelReason.value = "";
		await Promise.all([
			loadUnpaidInvoices(),
			loadUnpaidSummary(),
			posSettingsStore.enablePickupTracking ? loadPickupControls() : Promise.resolve(),
		]);
		emit("refresh-history");
		emit("invoice-cancelled", targetName);
	} catch (error) {
		log.error("Error cancelling invoice:", error);
		showError(error.message || __("No se pudo anular la nota de venta"));
	} finally {
		cancellingInvoice.value = false;
	}
}

const filteredUnpaidInvoices = computed(() => {
	let baseList = scopedUnpaidInvoices.value;
	if (unpaidFilter.value === "partial") {
		baseList = baseList.filter((inv) => inv.status === "Partly Paid");
	} else if (unpaidFilter.value === "unpaid") {
		baseList = baseList.filter((inv) => inv.status === "Unpaid");
	} else if (unpaidFilter.value === "overdue") {
		baseList = baseList.filter((inv) => inv.status === "Overdue");
	}

	const q = unpaidSearchQuery.value.trim().toLowerCase();
	if (!q) return baseList;
	return baseList.filter((inv) => {
		const hay = [inv.name, inv.customer_name, inv.customer, inv.owner_full_name]
			.filter(Boolean)
			.join(" ")
			.toLowerCase();
		return hay.includes(q);
	});
});

const filteredUnpaidSummary = computed(() => {
	const filtered = filteredUnpaidInvoices.value;
	return {
		count: filtered.length,
		total_outstanding: filtered.reduce((sum, inv) => sum + (inv.outstanding_amount || 0), 0),
		total_paid: filtered.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0),
	};
});

// Return invoices
const returnInvoices = computed(() => scopedHistoryInvoices.value.filter((inv) => inv.is_return));

const filteredReturnInvoices = computed(() => {
	const q = returnsSearchQuery.value.trim().toLowerCase();
	if (!q) return returnInvoices.value;
	return returnInvoices.value.filter((inv) => {
		const hay = [inv.name, inv.customer_name, inv.customer, inv.return_against]
			.filter(Boolean)
			.join(" ")
			.toLowerCase();
		return hay.includes(q);
	});
});

// Drafts filtered by search
const filteredDrafts = computed(() => {
	const list = Array.isArray(props.draftInvoices) ? props.draftInvoices : [];
	const q = draftsSearchQuery.value.trim().toLowerCase();
	if (!q) return list;
	return list.filter((draft) => {
		const custName =
			draft.customer?.customer_name || draft.customer?.name || draft.customer || "";
		return (
			String(draft.draft_id || "").toLowerCase().includes(q) ||
			String(custName).toLowerCase().includes(q)
		);
	});
});

// Filtered history using the composable (exclude returns, shown in separate tab)
const filteredHistoryInvoices = computed(() => {
	const nonReturnInvoices = scopedHistoryInvoices.value.filter((inv) => !inv.is_return);
	const tempInvoicesRef = computed(() => nonReturnInvoices);
	const tempFilters = useInvoiceFilters(tempInvoicesRef);
	return tempFilters.filteredInvoices.value;
});

// Dispatches state & computeds
const dispatchesFilter = ref("pending");
const dispatchDateFilter = ref("");
const loadingDelivery = ref({});

const allDispatches = computed(() => {
	return scopedHistoryInvoices.value.filter((inv) =>
		Boolean(
			inv.custom_direccion_entrega ||
				(inv.custom_fecha_entrega &&
					inv.custom_estado_entrega &&
					inv.custom_estado_entrega !== "Entregado en Tienda") ||
				(inv.custom_estado_entrega &&
					[
						"Pendiente de Entrega",
						"En Ruta de Despacho",
						"Pendiente de Carga",
						"En Camino",
					].includes(inv.custom_estado_entrega))
		)
	);
});

const pendingDispatches = computed(() =>
	allDispatches.value.filter((inv) => !isDispatchDelivered(inv))
);

const deliveredDispatches = computed(() =>
	allDispatches.value.filter((inv) => isDispatchDelivered(inv))
);

const dispatchFilterChips = computed(() => [
	{ value: "pending", label: __("Por Despachar"), count: pendingDispatches.value.length },
	{ value: "delivered", label: __("Entregados"), count: deliveredDispatches.value.length },
	{ value: "all", label: __("Todos"), count: allDispatches.value.length },
]);

const filteredDispatches = computed(() => {
	let list = allDispatches.value;
	if (dispatchesFilter.value === "pending") {
		list = pendingDispatches.value;
	} else if (dispatchesFilter.value === "delivered") {
		list = deliveredDispatches.value;
	}
	if (dispatchDateFilter.value) {
		list = list.filter((inv) => inv.custom_fecha_entrega === dispatchDateFilter.value);
	}
	return list;
});

function isDispatchDelivered(dispatch) {
	return (
		dispatch.custom_estado_entrega === "Entregado" ||
		dispatch.custom_estado_entrega === "Entregado al Cliente"
	);
}

async function markAsDelivered(dispatch) {
	if (!dispatch || !dispatch.name) return;
	loadingDelivery.value[dispatch.name] = true;
	try {
		await call("pos_next.api.invoices.mark_invoice_delivered", {
			invoice_name: dispatch.name,
			estado: "Entregado",
		});
		dispatch.custom_estado_entrega = "Entregado";
		showSuccess(__("Despacho marcado como entregado"));
		emit("refresh-history");
	} catch (error) {
		log.error("Error marking dispatch as delivered:", error);
		showError(__("No se pudo actualizar el estado de entrega"));
	} finally {
		loadingDelivery.value[dispatch.name] = false;
	}
}

function openDispatchPlanSheet() {
	window.open("/app/query-report/Planilla%20Diaria%20de%20Despacho", "_blank");
}

// Pickup / Pending Delivery Custody State
const loadingPickups = ref(false);
const pickupControls = ref([]);
const pickupProductSummary = ref([]);
const pickupCounts = ref({ pending: 0, partial: 0, delivered: 0, total_open: 0 });
const pickupStatusFilter = ref("open");
const pickupViewMode = ref("orders");
const pickupSearch = ref("");
const expandedPickupLogs = ref({});
const showPickupDialog = ref(false);
const selectedPickupControl = ref(null);

const filteredPickupControls = computed(() => {
	const q = pickupSearch.value.trim().toLowerCase();
	if (!q) return pickupControls.value;
	return pickupControls.value.filter((ctrl) => {
		const haystack = [
			ctrl.name,
			ctrl.reference_name,
			ctrl.customer,
			ctrl.customer_name,
			ctrl.notes,
			...(ctrl.items || []).map((it) => `${it.item_code} ${it.item_name}`),
		]
			.filter(Boolean)
			.join(" ")
			.toLowerCase();
		return haystack.includes(q);
	});
});

const filteredPickupProductSummary = computed(() => {
	const q = pickupSearch.value.trim().toLowerCase();
	const list = pickupProductSummary.value.map((row) => ({
		...row,
		_rowKey: `${row.item_code}::${row.uom}`,
	}));
	if (!q) return list;
	return list.filter(
		(row) =>
			String(row.item_code || "").toLowerCase().includes(q) ||
			String(row.item_name || "").toLowerCase().includes(q)
	);
});

const pickupSummaryColumns = computed(() => [
	{ key: "item_code", label: __("Código"), width: 120, align: "left" },
	{ key: "item_name", label: __("Producto"), width: 300, align: "left", primary: true },
	{ key: "pending_display", label: __("En Custodia (Pendiente)"), width: 165, align: "right" },
	{ key: "system_stock_qty", label: __("Stock Sistema"), width: 120, align: "right" },
	{ key: "expected_physical_qty", label: __("Físico Esperado"), width: 130, align: "right" },
	{ key: "orders_count", label: __("Ventas"), width: 90, align: "center" },
]);

// Tabs for MdxSegmentedControl
const segmentedTabOptions = computed(() => {
	const list = [
		{
			value: "partial",
			label: __("Unpaid"),
			badge: scopedUnpaidInvoices.value.length,
		},
	];
	if (posSettingsStore.enablePickupTracking) {
		list.push({
			value: "pickups",
			label: __("Por Entregar"),
			badge: pickupCounts.value.total_open,
		});
	}
	if (posSettingsStore.enableDeliveryDispatch) {
		list.push({
			value: "despachos",
			label: __("Despachos"),
			badge: pendingDispatches.value.length,
		});
	}
	list.push(
		{
			value: "history",
			label: __("Invoice History"),
			badge: filteredHistoryInvoices.value.length,
		},
		{
			value: "drafts",
			label: __("Drafts"),
			badge: props.draftInvoices.length,
		},
		{
			value: "returns",
			label: __("Returns"),
			badge: returnInvoices.value.length,
		}
	);
	return list;
});

const currentTabLabel = computed(
	() => segmentedTabOptions.value.find((t) => t.value === activeTab.value)?.label || ""
);

// Pagination Computeds
const currentListTotal = computed(() => {
	switch (activeTab.value) {
		case "partial":
			return filteredUnpaidInvoices.value.length;
		case "history":
			return filteredHistoryInvoices.value.length;
		case "drafts":
			return filteredDrafts.value.length;
		case "returns":
			return filteredReturnInvoices.value.length;
		case "despachos":
			return filteredDispatches.value.length;
		case "pickups":
			return pickupViewMode.value === "orders"
				? filteredPickupControls.value.length
				: filteredPickupProductSummary.value.length;
		default:
			return 0;
	}
});

const totalPages = computed(() => Math.ceil(currentListTotal.value / PAGE_SIZE) || 1);

function paginateSlice(arr) {
	const start = (currentPage.value - 1) * PAGE_SIZE;
	return arr.slice(start, start + PAGE_SIZE);
}

const paginatedUnpaidInvoices = computed(() => paginateSlice(filteredUnpaidInvoices.value));
const paginatedHistoryInvoices = computed(() => paginateSlice(filteredHistoryInvoices.value));
const paginatedDrafts = computed(() => paginateSlice(filteredDrafts.value));
const paginatedReturnInvoices = computed(() => paginateSlice(filteredReturnInvoices.value));
const paginatedDispatches = computed(() => paginateSlice(filteredDispatches.value));
const paginatedPickupControls = computed(() => paginateSlice(filteredPickupControls.value));
const paginatedPickupProductSummary = computed(() =>
	paginateSlice(filteredPickupProductSummary.value)
);

watch(
	[
		activeTab,
		selectedProfileFilter,
		unpaidFilter,
		unpaidSearchQuery,
		draftsSearchQuery,
		returnsSearchQuery,
		dispatchesFilter,
		dispatchDateFilter,
		pickupStatusFilter,
		pickupViewMode,
		pickupSearch,
		() => filterStore.searchTerm,
		() => filterStore.status,
		() => filterStore.customer,
		() => filterStore.product,
		() => filterStore.dateFrom,
		() => filterStore.dateTo,
	],
	() => {
		currentPage.value = 1;
		expandedRowIds.value = new Set();
	}
);

watch(currentPage, () => {
	expandedRowIds.value = new Set();
});

// Shared Detail Table & Badge Helpers
const detailItemColumns = computed(() => [
	{ key: "line_no", label: "#", width: 48, align: "center", hideOnMobile: true },
	{ key: "item_code", label: __("Código"), width: 110, align: "left" },
	{ key: "item_display", label: __("Producto / Medida"), width: 320, align: "left", primary: true },
	{ key: "warehouse_display", label: __("Almacén"), width: 145, align: "left" },
	{ key: "qty_display", label: __("Cant."), width: 100, align: "right" },
	{ key: "rate_display", label: __("P. Unit."), width: 115, align: "right" },
	{ key: "amount_display", label: __("Subtotal"), width: 120, align: "right" },
]);

function isRowExpanded(rowKey) {
	return Boolean(rowKey && expandedRowIds.value.has(rowKey));
}

function toggleExpandRow(rowKey) {
	if (!rowKey) return;
	const next = new Set(expandedRowIds.value);
	if (next.has(rowKey)) {
		next.delete(rowKey);
	} else {
		next.add(rowKey);
	}
	expandedRowIds.value = next;
}

function getPreviewItems(items) {
	return Array.isArray(items) ? items.slice(0, PREVIEW_ITEMS_LIMIT) : [];
}

function getHiddenItemsCount(items) {
	return Math.max(0, (Array.isArray(items) ? items.length : 0) - PREVIEW_ITEMS_LIMIT);
}

function formatWarehouseLabel(warehouse) {
	const raw = String(warehouse || "").trim();
	if (!raw) return "—";
	return raw.replace(/\s+-\s+[A-Z0-9]{1,6}$/i, "").trim() || raw;
}

function buildDetailTableRows(items, prefix) {
	return (Array.isArray(items) ? items : []).map((item, idx) => {
		const qty = Number(item.quantity ?? item.qty ?? 0);
		const rate = Number(item.rate ?? 0);
		const amount = Number(item.amount ?? roundCurrency(qty * roundCurrency(rate)));
		const uom = item.uom || item.stock_uom || "";
		const medida = item.custom_medida || item.medida || "";
		const itemName = item.item_name || item.item_code || "";
		return {
			_rowKey: item.so_detail || item.name || `${prefix}-${idx}`,
			line_no: idx + 1,
			item_code: item.item_code || "—",
			item_name: itemName,
			medida,
			item_display: medida ? `${itemName} (${medida})` : itemName,
			warehouse_display: formatWarehouseLabel(item.warehouse),
			qty_display: uom ? `${qty} ${uom}` : `${qty}`,
			rate_display: formatCurrency(rate),
			amount_display: formatCurrency(amount),
		};
	});
}

function getInvoiceBadgeVariant(invoice) {
	if (!invoice) return "neutral";
	const status = String(invoice.status || "").toLowerCase();
	if (status === "overdue" || status === "cancelled" || status === "cancelado" || invoice.docstatus === 2) {
		return "danger";
	}
	if (status === "partly paid" || status === "partially paid" || status === "unpaid") {
		return "warning";
	}
	if (status === "credit note issued" || status === "return") {
		return "info";
	}
	if (status === "paid" || invoice.docstatus === 1) {
		return "success";
	}
	return "neutral";
}

function isServerDraft(draftId) {
	if (!draftId) return false;
	const idStr = String(draftId);
	return (
		!idStr.startsWith("LOCAL-") &&
		!idStr.startsWith("OFFLINE-") &&
		!idStr.startsWith("DRAFT-")
	);
}

function isDraftQuotation(draft) {
	const rawId = String(draft?.draft_id || "").toUpperCase();
	return draft?.doctype === "Quotation" || rawId.includes("-QTN-") || rawId.includes("-COT-");
}

function openDocumentPDF(doctype, name, profilePrintFormat = "") {
	if (!name) return;
	const url = posSettingsStore.buildLetterPdfUrl(doctype || "Sales Invoice", name, profilePrintFormat);
	window.open(url, "_blank");
}

function openDraftPDF(draft) {
	if (!draft || !draft.draft_id) return;
	const rawId = String(draft.draft_id).toUpperCase();
	const inferredDt =
		draft.doctype ||
		(rawId.includes("-QTN-") || rawId.includes("-COT-") ? "Quotation" : "Sales Order");
	openDocumentPDF(inferredDt, draft.draft_id);
}

async function loadPickupControls() {
	if (!props.posProfile || !posSettingsStore.enablePickupTracking || isOffline()) {
		return;
	}
	loadingPickups.value = true;
	try {
		const res = await call("pos_next.api.delivery_control.get_pending_deliveries", {
			pos_profile: props.posProfile,
			status_filter: pickupStatusFilter.value,
			filter_profile:
				selectedProfileFilter.value !== "ALL" ? selectedProfileFilter.value : undefined,
		});
		const data = res?.message || res || {};
		pickupControls.value = data.controls || [];
		pickupProductSummary.value = data.product_summary || [];
		pickupCounts.value = data.counts || { pending: 0, partial: 0, delivered: 0, total_open: 0 };
	} catch (err) {
		log.error("Error loading pending deliveries:", err);
	} finally {
		loadingPickups.value = false;
	}
}

function setPickupStatusFilter(mode) {
	pickupStatusFilter.value = mode;
	pickupViewMode.value = "orders";
	loadPickupControls();
}

function togglePickupHistory(controlName) {
	expandedPickupLogs.value = {
		...expandedPickupLogs.value,
		[controlName]: !expandedPickupLogs.value[controlName],
	};
}

function openPickupDialog(ctrl) {
	selectedPickupControl.value = ctrl;
	showPickupDialog.value = true;
}

function handlePickupRecorded() {
	loadPickupControls();
}

function handlePrintPickupLog(ctrl, lg) {
	printPickupReceipt(ctrl, lg);
}

function handlePickupWhatsApp(ctrl) {
	openPickupWhatsApp(ctrl, (ctrl.logs && ctrl.logs[0]) || null);
}

function exportPickupSummaryCsv() {
	const headers = [
		"Código",
		"Producto",
		"UDM",
		"En Custodia (Pendiente)",
		"UDM Cobertura",
		"Superficie Pendiente",
		"Stock Sistema",
		"Físico Esperado",
		"Ventas Pendientes",
	];
	const csvEscape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
	const rows = filteredPickupProductSummary.value.map((r) => [
		r.item_code,
		r.item_name,
		r.uom,
		r.total_pending_qty,
		r.coverage_uom || "",
		r.total_pending_coverage || 0,
		r.system_stock_qty,
		r.expected_physical_qty,
		r.orders_count,
	]);
	const csvContent =
		"\uFEFF" + [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
	const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `pendientes-entrega-${getLocalDateString()}.csv`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

// Watchers
watch(
	() => props.modelValue,
	(val) => {
		show.value = val;
		if (val) {
			currentPage.value = 1;
			loadScopeProfiles();
			loadUnpaidInvoices();
			loadUnpaidSummary();
			if (posSettingsStore.enablePickupTracking) {
				loadPickupControls();
			}
			if (props.historyInvoices.length === 0) {
				emit("refresh-history");
			}
		}
	},
	{ immediate: true }
);

watch(show, (val) => {
	emit("update:modelValue", val);
});

watch(activeTab, (newTab) => {
	if (newTab === "history" || newTab === "returns" || newTab === "despachos") {
		emit("refresh-history");
	} else if (newTab === "pickups") {
		loadPickupControls();
	} else if (newTab === "partial") {
		loadUnpaidInvoices();
		loadUnpaidSummary();
	}
});

function handleClose() {
	show.value = false;
}

async function refreshCurrentTab() {
	isRefreshingModal.value = true;
	try {
		if (activeTab.value === "partial") {
			await Promise.all([loadUnpaidInvoices(), loadUnpaidSummary()]);
		} else if (activeTab.value === "pickups") {
			await loadPickupControls();
		} else {
			emit("refresh-history");
			await new Promise((resolve) => setTimeout(resolve, 450));
		}
	} finally {
		isRefreshingModal.value = false;
	}
}

async function loadUnpaidInvoices() {
	if (!props.posProfile) return;
	loading.value = true;

	try {
		const cachedInvoices = await getCachedUnpaidInvoices(props.posProfile, {
			limit: 200,
		});
		if (cachedInvoices && cachedInvoices.length > 0) {
			unpaidInvoices.value = cachedInvoices;
			loading.value = false;
		}
	} catch (cacheError) {
		log.debug("No cached unpaid invoices available");
	}

	if (isOffline()) {
		loading.value = false;
		return;
	}

	try {
		const result = await call("pos_next.api.partial_payments.get_unpaid_invoices", {
			pos_profile: props.posProfile,
			limit: 200,
		});
		unpaidInvoices.value = result || [];
		if (result && result.length > 0) {
			cacheUnpaidInvoices(result, props.posProfile);
		}
	} catch (error) {
		log.error("Error loading unpaid invoices:", error);
		if (unpaidInvoices.value.length === 0) {
			showError(error.message || __("Failed to load unpaid invoices"));
		}
	} finally {
		loading.value = false;
	}
}

async function loadUnpaidSummary() {
	if (!props.posProfile) return;

	try {
		const cachedSummary = await getCachedUnpaidSummary(props.posProfile);
		if (cachedSummary && (cachedSummary.count > 0 || cachedSummary.total_outstanding > 0)) {
			unpaidSummary.value = cachedSummary;
		}
	} catch (cacheError) {
		log.debug("No cached unpaid summary available");
	}

	if (isOffline()) return;

	try {
		const result = await call("pos_next.api.partial_payments.get_unpaid_summary", {
			pos_profile: props.posProfile,
		});
		unpaidSummary.value = result || {
			count: 0,
			total_outstanding: 0,
			total_paid: 0,
		};
		if (result) {
			cacheUnpaidSummary(result, props.posProfile);
		}
	} catch (error) {
		log.error("Error loading summary:", error);
	}
}

const loadingInvoiceDetails = ref(false);

async function selectInvoiceForPayment(invoice) {
	loadingInvoiceDetails.value = true;
	try {
		const details = await call("pos_next.api.partial_payments.get_partial_payment_details", {
			invoice_name: invoice.name,
		});
		selectedInvoice.value = details;
		showPaymentDialog.value = true;
	} catch (error) {
		log.error("Error loading invoice details:", error);
		selectedInvoice.value = invoice;
		showPaymentDialog.value = true;
	} finally {
		loadingInvoiceDetails.value = false;
	}
}

async function handlePaymentCompleted(paymentData) {
	if (!selectedInvoice.value) return;

	try {
		await call("pos_next.api.partial_payments.add_payment_to_partial_invoice", {
			invoice_name: selectedInvoice.value.name,
			payments: paymentData.payments,
		});

		showSuccess(__("Payment added successfully"));
		await Promise.all([loadUnpaidInvoices(), loadUnpaidSummary()]);
		emit("refresh-history");
		selectedInvoice.value = null;
	} catch (error) {
		console.error("Error adding payment:", error);
		showError(error.message || __("Failed to add payment"));
	}
}

function formatCurrency(amount) {
	return formatCurrencyUtil(Number.parseFloat(amount || 0), props.currency);
}

function formatPaymentModes(invoice) {
	const payments = Array.isArray(invoice?.payments) ? invoice.payments : [];
	const validPayments = payments.filter((payment) => payment.mode_of_payment);

	if (validPayments.length === 0) {
		return __("Crédito / Sin cobro");
	}

	if (validPayments.length === 1) {
		return __(validPayments[0].mode_of_payment);
	}

	return validPayments
		.map((payment) => `${__(payment.mode_of_payment)} ${formatCurrency(payment.amount || 0)}`)
		.join(", ");
}

function calculateDraftTotal(items) {
	if (!items || items.length === 0) return 0;
	return items.reduce(
		(sum, item) => sum + (item.quantity || item.qty || 0) * (item.rate || 0),
		0
	);
}

let cleanupInvoiceRealtime = null;

onMounted(() => {
	filterStore.loadSavedFiltersFromStorage();

	if (show.value) {
		loadScopeProfiles();
		loadUnpaidInvoices();
		loadUnpaidSummary();
	}

	cleanupInvoiceRealtime = onInvoiceCreated((eventData) => {
		if (!show.value || !props.posProfile) return;
		if (posSettingsStore.canManagePOSSettings || eventData?.pos_profile === props.posProfile) {
			loadUnpaidInvoices();
			loadUnpaidSummary();
			emit("refresh-history");
		}
	});
});

onUnmounted(() => {
	if (cleanupInvoiceRealtime) {
		cleanupInvoiceRealtime();
	}
});
</script>

<style scoped>
.inv-search-box :deep(.mdx-search) {
	max-width: none;
}

.pos-inv-canvas {
	background-color: #eef2f6;
}

.pos-inv-row-card {
	background-color: #ffffff;
	border: 1px solid #cbd5e1;
	border-left: 4px solid #2563eb;
	border-radius: 0.875rem;
	box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04);
	transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.pos-inv-row-card--quotation {
	border-left-color: #0284c7;
}

.pos-inv-row-card--return {
	border-left-color: #dc2626;
}

.pos-inv-row-card--delivered {
	border-left-color: #16a34a;
}

.pos-inv-row-card:hover {
	border-color: #94a3b8;
	box-shadow: 0 4px 12px -2px rgba(15, 23, 42, 0.1);
}

.inv-items-subtable :deep(.mdx-table-scroll) {
	background-color: #ffffff;
}

.inv-items-subtable :deep(.mdx-table__row) {
	cursor: default;
}

.inv-items-subtable :deep(.mdx-table__row:last-child .mdx-table__td) {
	border-bottom: none;
}
</style>
