<template>
	<!-- Full Page Overlay -->
	<Transition name="fade">
		<div
			v-if="show"
			class="fixed inset-0 bg-black bg-opacity-50 z-[300]"
			@click.self="handleClose"
		>
			<!-- Main Container -->
			<div class="fixed inset-0 flex items-center justify-center p-4">
				<div
					class="w-full h-full max-w-[95vw] max-h-[95vh] bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col"
				>
					<!-- Header -->
					<div
						class="flex items-center justify-between px-5 py-3 border-b bg-gradient-to-r from-indigo-50 to-purple-50"
					>
						<div class="flex items-center gap-2.5">
							<div class="p-1.5 bg-indigo-100 rounded-lg">
								<svg
									class="w-5 h-5 text-indigo-600"
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
							<div>
								<h2 class="text-base font-bold text-gray-900 leading-tight">
									{{ __("Invoice Management") }}
								</h2>
								<p class="text-xs text-gray-600 flex items-center">
									{{ __("Manage all your invoices in one place") }}
								</p>
							</div>
						</div>
						<div class="flex items-center gap-2">
							<Button
								@click="refreshCurrentTab"
								:loading="loading"
								variant="ghost"
								size="sm"
							>
								<template #prefix>
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
											d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
										/>
									</svg>
								</template>
								{{ __("Refresh") }}
							</Button>
							<button
								@click="handleClose"
								class="p-1.5 hover:bg-white/50 rounded-lg transition-colors"
							>
								<svg
									class="w-5 h-5 text-gray-600"
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

					<!-- Tabs Navigation -->
					<div class="border-b border-gray-200 bg-gray-50">
						<nav class="flex gap-1 px-4 overflow-x-auto" :aria-label="__('Tabs')">
							<button
								v-for="tab in tabs"
								:key="tab.id"
								@click="activeTab = tab.id"
								:class="[
									'px-3.5 py-2.5 text-xs font-semibold transition-all border-b-2 relative whitespace-nowrap',
									activeTab === tab.id
										? getTabActiveClass(tab.id)
										: 'text-gray-600 border-transparent hover:text-gray-800 hover:border-gray-300',
								]"
							>
								<div class="flex items-center gap-1.5">
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
											:d="tab.icon"
										/>
									</svg>
									<span>{{ tab.label }}</span>
									<span
										v-if="tab.badge && tab.badge() > 0"
										:class="[
											'ms-0.5 px-1.5 py-0.5 text-[11px] font-bold rounded-full leading-none',
											activeTab === tab.id
												? getBadgeActiveClass(tab.id)
												: getBadgeInactiveClass(tab.id),
										]"
									>
										{{ tab.badge() }}
									</span>
								</div>
							</button>
						</nav>
					</div>

					<!-- Tab Content -->
					<div class="flex-1 overflow-y-auto bg-gray-50">
						<!-- Loading State -->
						<div
							v-if="loading && activeTab === 'partial'"
							class="flex flex-col items-center justify-center py-12"
						>
							<div
								class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mb-3"
							></div>
							<p class="text-xs font-medium text-gray-600">
								{{ __("Loading {0}...", [currentTabLabel]) }}
							</p>
						</div>

						<!-- Tab Content -->
						<div class="p-4">
							<!-- Unpaid Tab -->
							<div v-if="activeTab === 'partial'" class="flex flex-col gap-2.5">
								<!-- Filter Buttons + Summary inline bar -->
								<div class="flex flex-wrap items-center justify-between gap-2">
									<div class="flex items-center gap-1.5 flex-wrap">
										<button
											@click="unpaidFilter = 'all'"
											:class="[
												'px-3 py-1.5 rounded-lg font-semibold text-xs transition-all',
												unpaidFilter === 'all'
													? 'bg-orange-500 text-white shadow-xs'
													: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
											]"
										>
											{{ __("All ({0})", [unpaidInvoices.length]) }}
										</button>
										<button
											@click="unpaidFilter = 'partial'"
											:class="[
												'px-3 py-1.5 rounded-lg font-semibold text-xs transition-all',
												unpaidFilter === 'partial'
													? 'bg-orange-500 text-white shadow-xs'
													: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
											]"
										>
											{{
												__("Partially Paid ({0})", [
													unpaidInvoices.filter(
														(inv) => inv.status === "Partly Paid"
													).length,
												])
											}}
										</button>
										<button
											@click="unpaidFilter = 'unpaid'"
											:class="[
												'px-3 py-1.5 rounded-lg font-semibold text-xs transition-all',
												unpaidFilter === 'unpaid'
													? 'bg-orange-500 text-white shadow-xs'
													: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
											]"
										>
											{{
												__("Unpaid ({0})", [
													unpaidInvoices.filter(
														(inv) => inv.status === "Unpaid"
													).length,
												])
											}}
										</button>
										<button
											@click="unpaidFilter = 'overdue'"
											:class="[
												'px-3 py-1.5 rounded-lg font-semibold text-xs transition-all',
												unpaidFilter === 'overdue'
													? 'bg-red-500 text-white shadow-xs'
													: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
											]"
										>
											{{
												__("Overdue ({0})", [
													unpaidInvoices.filter(
														(inv) => inv.status === "Overdue"
													).length,
												])
											}}
										</button>
									</div>

									<!-- Compact Summary Pill -->
									<div
										v-if="filteredUnpaidSummary.count > 0"
										class="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg px-3.5 py-1.5 flex items-center gap-4 text-xs"
									>
										<div class="flex items-center gap-1.5">
											<span class="text-orange-700 font-semibold">{{ __("Outstanding Payments") }}:</span>
											<span class="text-sm font-bold text-gray-900 tabular-nums">
												{{ formatCurrency(filteredUnpaidSummary.total_outstanding) }}
											</span>
										</div>
										<div class="h-3.5 w-px bg-orange-200"></div>
										<div class="flex items-center gap-2 text-gray-600">
											<span>{{ __("{0} invoices", [filteredUnpaidSummary.count]) }}</span>
											<span>·</span>
											<span class="font-semibold text-green-700 tabular-nums">
												{{ __("{0} paid", [formatCurrency(filteredUnpaidSummary.total_paid)]) }}
											</span>
										</div>
									</div>
								</div>

								<!-- Offline Warning -->
								<div
									v-if="isOffline()"
									class="bg-yellow-50 border border-yellow-300 rounded-lg p-3 flex items-center gap-3"
								>
									<svg
										class="w-5 h-5 text-yellow-600 flex-shrink-0"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
										/>
									</svg>
									<div class="flex-1 text-start">
										<p class="text-sm font-medium text-yellow-800">
											{{ __("You are offline") }}
										</p>
										<p class="text-xs text-yellow-700">
											{{
												__(
													"Payments cannot be added while offline. Connect to the internet to add payments."
												)
											}}
										</p>
									</div>
								</div>

								<!-- Empty State -->
								<div
									v-if="filteredUnpaidInvoices.length === 0"
									class="flex flex-col items-center justify-center py-16 text-center"
								>
									<svg
										class="w-16 h-16 text-gray-400 mb-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
									<p class="text-gray-600 font-medium">
										{{ __("No Unpaid Invoices") }}
									</p>
									<p class="text-gray-500 text-sm mt-1">
										{{ __("All invoices are fully paid") }}
									</p>
								</div>

								<!-- Invoices List -->
								<div v-else class="flex flex-col gap-2">
									<div
										v-for="invoice in filteredUnpaidInvoices"
										:key="invoice.name"
										class="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden hover:border-gray-300 transition-all"
									>
										<!-- Compact Single-Row Invoice Card -->
										<div class="px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3">
											<!-- Left: Document + Status + Customer + Date -->
											<div class="min-w-[210px] flex-1">
												<div class="flex items-center gap-2">
													<h3 class="text-sm font-bold text-gray-900 tabular-nums">
														{{ invoice.name }}
													</h3>
													<span
														:class="[
															'px-2 py-0.5 text-[11px] font-semibold rounded-full',
															getInvoiceStatusColor(invoice),
														]"
													>
														{{ __(invoice.status) }}
													</span>
												</div>
												<div class="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-xs text-gray-600">
													<div class="flex items-center font-medium text-gray-800">
														<svg
															class="w-3.5 h-3.5 me-1 text-gray-400"
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
														{{ invoice.customer_name || invoice.customer }}
													</div>
													<div class="flex items-center text-gray-500 tabular-nums">
														<svg
															class="w-3.5 h-3.5 me-1 text-gray-400"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
															/>
														</svg>
														{{ formatDate(invoice.posting_date) }}
														{{ formatTime(invoice.posting_time) }}
													</div>
												</div>
											</div>

											<!-- Center: Inline Financial Summary -->
											<div class="flex items-center gap-2 sm:gap-3 text-xs tabular-nums">
												<div class="px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-200/80 text-right">
													<div class="text-[10px] text-gray-500 leading-tight">
														{{ __("Total Amount") }}
													</div>
													<div class="text-xs sm:text-sm font-bold text-gray-900">
														{{ formatCurrency(invoice.grand_total) }}
													</div>
												</div>
												<div class="px-2.5 py-1 bg-green-50/70 rounded-lg border border-green-100 text-right">
													<div class="text-[10px] text-gray-500 leading-tight">
														{{ __("Paid") }}
													</div>
													<div class="text-xs sm:text-sm font-bold text-green-600">
														{{ formatCurrency(invoice.paid_amount) }}
													</div>
												</div>
												<div class="px-2.5 py-1 bg-orange-50/80 rounded-lg border border-orange-200/80 text-right">
													<div class="text-[10px] text-orange-700 font-medium leading-tight">
														{{ __("Saldo Pendiente") }}
													</div>
													<div class="text-xs sm:text-sm font-bold text-orange-600">
														{{ formatCurrency(invoice.outstanding_amount) }}
													</div>
												</div>
											</div>

											<!-- Right: Compact Action Buttons -->
											<div class="flex items-center gap-1.5">
												<button
													type="button"
													@click="$emit('print-invoice', invoice)"
													class="px-2.5 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
													:title="__('Print')"
												>
													<svg class="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
													</svg>
													<span class="hidden sm:inline">{{ __("Print") }}</span>
												</button>
												<button
													v-if="posSettingsStore.enableWhatsappSend"
													type="button"
													@click="$emit('whatsapp-invoice', invoice)"
													class="px-2.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1"
													style="background-color: #16a34a; color: #ffffff;"
													:title="__('Enviar por WhatsApp')"
												>
													<svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
														<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
													</svg>
													<span class="hidden sm:inline">WhatsApp</span>
												</button>
												<button
													v-if="canCancelInvoice(invoice)"
													type="button"
													@click="openCancelModal(invoice)"
													class="px-2.5 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
													:title="__('Anular Venta')"
												>
													<svg class="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
													</svg>
													<span class="hidden sm:inline">{{ __("Anular") }}</span>
												</button>
												<button
													@click="selectInvoiceForPayment(invoice)"
													:disabled="
														loadingInvoiceDetails || isOffline()
													"
													:title="
														isOffline()
															? __(
																	'Payments cannot be added while offline'
															  )
															: ''
													"
													class="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
												>
													<LoadingIndicator
														v-if="loadingInvoiceDetails"
														class="w-3.5 h-3.5"
													/>
													{{ __("Add Payment") }}
												</button>
											</div>
										</div>

										<!-- Optional Partial Payment Progress & History (only when there are payments) -->
										<div
											v-if="(invoice.paid_amount || 0) > 0 || (invoice.payments && invoice.payments.length > 0)"
											class="px-3.5 py-2 bg-gray-50/70 border-t border-gray-100"
										>
											<div
												v-if="(invoice.paid_amount || 0) > 0 && invoice.grand_total > 0"
												class="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden mb-1.5"
											>
												<div
													class="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300"
													:style="{
														width: `${Math.min(100, (invoice.paid_amount / invoice.grand_total) * 100)}%`,
													}"
												></div>
											</div>
											<div
												v-if="invoice.payments && invoice.payments.length > 0"
												class="flex flex-wrap items-center gap-1.5"
											>
												<span class="text-[11px] font-medium text-gray-500 me-1">
													{{ __("Payment History") }}:
												</span>
												<div
													v-for="(payment, idx) in invoice.payments"
													:key="idx"
													:class="[
														'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px]',
														payment.source === 'Payment Entry'
															? 'bg-blue-50 border-blue-200 text-blue-800'
															: 'bg-white border-gray-200 text-gray-700',
													]"
												>
													<span class="font-medium">{{ payment.mode_of_payment || __("N/A") }}</span>
													<span class="font-bold tabular-nums">{{ formatCurrency(payment.amount) }}</span>
													<span v-if="payment.posting_date" class="text-[10px] text-gray-400">
														({{ formatDate(payment.posting_date) }})
													</span>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>

							<!-- Invoice History Tab -->
							<div v-if="activeTab === 'history'">
								<!-- Filters Component -->
								<div class="mb-3">
									<InvoiceFilters
										:unique-customers="invoiceFilters.uniqueCustomers.value"
										:unique-products="invoiceFilters.uniqueProducts.value"
										:filter-stats="invoiceFilters.filterStats.value"
									/>
								</div>

								<!-- Empty State -->
								<div
									v-if="filteredHistoryInvoices.length === 0"
									class="flex flex-col items-center justify-center py-12 text-center"
								>
									<svg
										class="w-12 h-12 text-gray-400 mb-3"
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
									<p class="text-gray-600 font-medium text-sm">
										{{ __("No invoices found") }}
									</p>
								</div>

								<!-- Invoices Grid - Compact 3 columns on XL screens -->
								<div v-else class="grid gap-2.5 lg:grid-cols-2 xl:grid-cols-3">
									<div
										v-for="invoice in filteredHistoryInvoices"
										:key="invoice.name"
										class="bg-white border border-gray-200 rounded-xl shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
									>
										<!-- Compact Card Header -->
										<div
											class="bg-gradient-to-r from-indigo-50/70 to-blue-50/70 px-3.5 py-2 border-b border-gray-200 flex items-center justify-between gap-2"
										>
											<div class="flex items-center gap-2 min-w-0">
												<h3 class="text-sm font-bold text-gray-900 truncate tabular-nums">
													{{ invoice.name }}
												</h3>
												<span
													:class="[
														'text-[11px] px-2 py-0.5 rounded-full font-semibold shrink-0',
														getInvoiceStatusColor(invoice),
													]"
												>
													{{ __(invoice.status) }}
												</span>
											</div>
											<div class="text-end shrink-0 flex items-baseline gap-1.5">
												<span class="text-[10px] text-gray-500 uppercase">{{ __("Total") }}</span>
												<span class="text-sm font-bold text-indigo-600 tabular-nums">
													{{ formatCurrency(invoice.grand_total) }}
												</span>
											</div>
										</div>

										<!-- Compact Card Body -->
										<div class="px-3.5 py-2.5 flex flex-col gap-2">
											<!-- Customer + Date & Time on one line -->
											<div class="flex items-center justify-between gap-2 text-xs">
												<div class="flex items-center min-w-0 font-semibold text-gray-900 truncate">
													<svg
														class="w-3.5 h-3.5 text-gray-400 me-1.5 shrink-0"
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
													<span class="truncate">{{ invoice.customer_name || invoice.customer }}</span>
												</div>
												<div class="flex items-center text-[11px] text-gray-500 tabular-nums shrink-0">
													<svg
														class="w-3.5 h-3.5 text-gray-400 me-1 shrink-0"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
														/>
													</svg>
													{{ formatDate(invoice.posting_date) }}
													{{ formatTime(invoice.posting_time) }}
												</div>
											</div>

											<!-- Payment Details in 3 columns -->
											<div
												class="grid grid-cols-3 gap-2 pt-1.5 border-t border-gray-100 text-xs"
											>
												<div>
													<div class="text-[10px] text-gray-500 leading-tight">
														{{ __("Paid") }}
													</div>
													<div class="text-xs font-semibold text-green-600 tabular-nums mt-0.5">
														{{ formatCurrency(invoice.paid_amount || 0) }}
													</div>
												</div>
												<div>
													<div class="text-[10px] text-gray-500 leading-tight">
														{{ __("Saldo Pendiente") }}
													</div>
													<div class="text-xs font-semibold text-orange-600 tabular-nums mt-0.5">
														{{ formatCurrency(invoice.outstanding_amount || 0) }}
													</div>
												</div>
												<div class="min-w-0">
													<div class="text-[10px] text-gray-500 leading-tight">
														{{ __("Payment Mode") }}
													</div>
													<div
														class="text-xs font-semibold text-gray-800 truncate mt-0.5"
														:title="formatPaymentModes(invoice)"
													>
														{{ formatPaymentModes(invoice) }}
													</div>
												</div>
											</div>
										</div>

										<!-- Compact Card Footer with Actions -->
										<div
											class="px-3 py-1.5 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-1.5"
										>
											<button
												@click="$emit('view-invoice', invoice)"
												class="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors flex items-center gap-1"
												:title="__('View Details')"
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
														d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
													/>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
													/>
												</svg>
												<span>{{ __("View") }}</span>
											</button>
											<button
												@click="$emit('print-invoice', invoice)"
												class="px-2.5 py-1 text-xs font-semibold text-green-600 bg-green-50 hover:bg-green-100 rounded-md transition-colors flex items-center gap-1"
												:title="__('Print')"
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
														d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
													/>
												</svg>
												<span>{{ __("Print") }}</span>
											</button>
											<button
												v-if="posSettingsStore.enableWhatsappSend"
												type="button"
												@click="$emit('whatsapp-invoice', invoice)"
												class="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors flex items-center gap-1"
												style="background-color: #16a34a; color: #ffffff;"
												:title="__('Enviar por WhatsApp')"
											>
												<svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
													<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
												</svg>
												<span>WhatsApp</span>
											</button>
											<button
												v-if="canCancelInvoice(invoice)"
												type="button"
												@click="openCancelModal(invoice)"
												class="px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
												:title="__('Anular Venta')"
											>
												<svg class="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
												</svg>
												<span>{{ __("Anular") }}</span>
											</button>
										</div>
									</div>
								</div>
							</div>

							<!-- Draft Invoices Tab -->
							<div v-if="activeTab === 'drafts'">
								<!-- Empty State -->
								<div
									v-if="draftInvoices.length === 0"
									class="flex flex-col items-center justify-center py-16 text-center"
								>
									<svg
										class="w-16 h-16 text-gray-400 mb-4"
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
									<p class="text-gray-600 font-medium">
										{{ __("No draft invoices") }}
									</p>
									<p class="text-gray-500 text-sm mt-1">
										{{ __("Save invoices as drafts to continue later") }}
									</p>
								</div>

								<!-- Drafts Grid -->
								<div v-else class="grid gap-4">
									<div
										v-for="draft in draftInvoices"
										:key="draft.draft_id"
										class="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-purple-400 transition-all cursor-pointer"
										@click="$emit('load-draft', draft)"
									>
										<div class="flex items-start justify-between mb-2">
											<div class="flex-1">
												<h4 class="text-sm font-semibold text-gray-900">
													{{ draft.draft_id }}
												</h4>
												<p
													v-if="draft.customer"
													class="text-xs text-gray-500 mt-0.5"
												>
													{{
														__("Customer: {0}", [
															draft.customer?.customer_name ||
																draft.customer?.name ||
																draft.customer,
														])
													}}
												</p>
												<p class="text-xs text-gray-400 mt-0.5">
													{{ formatDateTime(draft.created_at) }}
												</p>
											</div>
											<button
												@click.stop="$emit('delete-draft', draft.draft_id)"
												class="text-gray-400 hover:text-red-600 transition-colors p-1"
												:title="__('Delete draft')"
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
														d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
													/>
												</svg>
											</button>
										</div>

										<div class="flex items-center justify-between text-xs">
											<span class="text-gray-600">{{
												__("{0} item(s)", [draft.items?.length || 0])
											}}</span>
											<span class="font-bold text-purple-600">{{
												formatCurrency(calculateDraftTotal(draft.items))
											}}</span>
										</div>

										<!-- Items Preview -->
										<div
											v-if="draft.items && draft.items.length > 0"
											class="mt-2 pt-2 border-t border-gray-100"
										>
											<div class="flex flex-wrap gap-1">
												<span
													v-for="(item, idx) in draft.items.slice(0, 3)"
													:key="idx"
													class="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded"
												>
													{{ item.item_name }} ({{
														item.quantity || item.qty
													}})
												</span>
												<span
													v-if="draft.items.length > 3"
													class="text-[10px] text-gray-500 px-1.5 py-0.5"
												>
													{{ __("+{0} more", [draft.items.length - 3]) }}
												</span>
											</div>
										</div>
									</div>
								</div>
							</div>

							<!-- Return Invoices Tab -->
							<div v-if="activeTab === 'returns'">
								<!-- Empty State -->
								<div
									v-if="returnInvoices.length === 0"
									class="flex flex-col items-center justify-center py-16 text-center"
								>
									<svg
										class="w-16 h-16 text-gray-400 mb-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
										/>
									</svg>
									<p class="text-gray-600 font-medium">
										{{ __("No return invoices") }}
									</p>
									<p class="text-gray-500 text-sm mt-1">
										{{ __("Return invoices will appear here") }}
									</p>
								</div>

								<!-- Returns Grid -->
								<div v-else class="grid gap-4">
									<div
										v-for="invoice in returnInvoices"
										:key="invoice.name"
										class="bg-white border border-red-200 rounded-lg p-4 hover:shadow-md transition-all"
									>
										<div class="flex items-start justify-between">
											<div class="flex-1">
												<div class="flex items-center gap-2 mb-1">
													<h4
														class="text-sm font-semibold text-gray-900"
													>
														{{ invoice.name }}
													</h4>
													<span
														class="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-800"
													>
														{{ __("Return") }}
													</span>
												</div>
												<div
													class="flex items-center gap-4 text-xs text-gray-600"
												>
													<span>{{ invoice.customer_name }}</span>
													<span>{{
														formatDate(invoice.posting_date)
													}}</span>
													<span v-if="invoice.return_against">{{
														__("Against: {0}", [
															invoice.return_against,
														])
													}}</span>
												</div>
											</div>

											<div class="text-end ms-4">
												<p class="text-sm font-bold text-red-600">
													-{{
														formatCurrency(
															Math.abs(invoice.grand_total)
														)
													}}
												</p>
												<div class="flex items-center gap-1 mt-2">
													<button
														@click="$emit('view-invoice', invoice)"
														class="p-1.5 hover:bg-blue-50 rounded transition-colors"
														:title="__('View Details')"
													>
														<svg
															class="w-4 h-4 text-blue-600"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
															/>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
															/>
														</svg>
													</button>
													<button
														@click="$emit('print-invoice', invoice)"
														class="p-1.5 hover:bg-green-50 rounded transition-colors"
														:title="__('Print')"
													>
														<svg
															class="w-4 h-4 text-green-600"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
															/>
														</svg>
													</button>
													<button
														v-if="posSettingsStore.enableWhatsappSend"
														type="button"
														@click="$emit('whatsapp-invoice', invoice)"
														class="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded transition-colors"
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

							<!-- Despachos en Camión Tab -->
							<div v-if="activeTab === 'despachos'" class="flex flex-col gap-4">
								<!-- Dispatch Toolbar & Filters -->
								<div class="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-gray-200">
									<div class="flex items-center gap-2 flex-wrap">
										<button
											@click="dispatchesFilter = 'pending'"
											:class="[
												'px-3.5 py-1.5 rounded-lg font-medium text-xs transition-all flex items-center gap-1.5',
												dispatchesFilter === 'pending'
													? 'bg-amber-600 text-white shadow-sm'
													: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
											]"
										>
											<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
											{{ __("Por Despachar ({0})", [pendingDispatches.length]) }}
										</button>
										<button
											@click="dispatchesFilter = 'delivered'"
											:class="[
												'px-3.5 py-1.5 rounded-lg font-medium text-xs transition-all flex items-center gap-1.5',
												dispatchesFilter === 'delivered'
													? 'bg-green-600 text-white shadow-sm'
													: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
											]"
										>
											<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
											</svg>
											{{ __("Entregados ({0})", [deliveredDispatches.length]) }}
										</button>
										<button
											@click="dispatchesFilter = 'all'"
											:class="[
												'px-3.5 py-1.5 rounded-lg font-medium text-xs transition-all',
												dispatchesFilter === 'all'
													? 'bg-gray-800 text-white shadow-sm'
													: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
											]"
										>
											{{ __("Todos ({0})", [allDispatches.length]) }}
										</button>
									</div>

									<div class="flex items-center gap-2">
										<!-- Filter by date -->
										<div class="flex items-center gap-1.5 bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs">
											<span class="text-gray-500 font-medium">{{ __("Fecha:") }}</span>
											<input
												type="date"
												v-model="dispatchDateFilter"
												class="text-xs bg-transparent border-none p-0 focus:ring-0 text-gray-800"
											/>
											<button
												v-if="dispatchDateFilter"
												@click="dispatchDateFilter = ''"
												class="text-gray-400 hover:text-gray-600 ml-1 text-xs"
												:title="__('Limpiar fecha')"
											>
												✕
											</button>
										</div>

										<!-- Driver Portal Direct Link -->
										<a
											href="/despacho"
											target="_blank"
											class="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-medium text-xs px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors no-underline"
											:title="__('Abrir Portal Móvil de Choferes en nueva pestaña')"
										>
											<svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
											</svg>
											<span>{{ __("Portal Chofer") }}</span>
										</a>

										<!-- Print Dispatch Sheet button -->
										<button
											@click="openDispatchPlanSheet"
											class="bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
											:title="__('Imprimir Planilla de Carga y Ruta para el Chofer')"
										>
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
											</svg>
											<span>{{ __("Planilla Diaria de Despacho") }}</span>
										</button>
									</div>
								</div>

								<!-- Empty state -->
								<div
									v-if="filteredDispatches.length === 0"
									class="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-dashed border-gray-300 p-8"
								>
									<div class="p-3 bg-amber-50 rounded-full mb-3 text-amber-600">
										<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
										</svg>
									</div>
									<h3 class="text-sm font-semibold text-gray-900 mb-1">
										{{ __("No hay despachos registrados") }}
									</h3>
									<p class="text-xs text-gray-500 max-w-sm">
										{{ __("Las ventas marcadas con 'Despacho en Camión' aparecerán aquí organizadas para la carga del camión y cobro.") }}
									</p>
								</div>

								<!-- Dispatch Cards Grid -->
								<div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
									<div
										v-for="dispatch in filteredDispatches"
										:key="dispatch.name"
										class="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-3 relative"
										:class="[
											isDispatchDelivered(dispatch)
												? 'border-green-200 bg-green-50/20'
												: 'border-amber-200 bg-amber-50/10'
										]"
									>
										<!-- Card Header -->
										<div class="flex items-start justify-between gap-2">
											<div>
												<span class="text-xs font-mono font-bold text-gray-800">
													{{ dispatch.name }}
												</span>
												<h4 class="text-sm font-bold text-gray-900 leading-tight mt-0.5">
													{{ dispatch.customer_name || dispatch.customer }}
												</h4>
											</div>
											<!-- Status Badge -->
											<span
												:class="[
													'px-2.5 py-1 text-[11px] font-bold rounded-full flex items-center gap-1',
													isDispatchDelivered(dispatch)
														? 'bg-green-100 text-green-800 border border-green-300'
														: 'bg-amber-100 text-amber-800 border border-amber-300'
												]"
											>
												<span class="w-1.5 h-1.5 rounded-full" :class="isDispatchDelivered(dispatch) ? 'bg-green-600' : 'bg-amber-600'"></span>
												{{ dispatch.custom_estado_entrega || __('Pendiente de Carga') }}
											</span>
										</div>

										<!-- Delivery Details -->
										<div class="bg-gray-50 rounded-lg p-2.5 flex flex-col gap-1.5 text-xs border border-gray-100">
											<!-- Date -->
											<div class="flex items-center gap-1.5 text-gray-700">
												<svg class="w-3.5 h-3.5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
												</svg>
												<span class="font-semibold text-gray-600">{{ __('Entrega:') }}</span>
												<span class="font-medium text-gray-900">{{ formatDate(dispatch.custom_fecha_entrega) || __('Hoy') }}</span>
											</div>

											<!-- Stall / Address -->
											<div v-if="dispatch.custom_direccion_entrega" class="flex items-start gap-1.5 text-gray-700">
												<svg class="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
												</svg>
												<span class="font-semibold text-gray-600">{{ __('Puesto/Dir:') }}</span>
												<span class="font-medium text-gray-900 leading-tight">{{ dispatch.custom_direccion_entrega }}</span>
											</div>

											<!-- Phone -->
											<div v-if="dispatch.custom_telefono_contacto" class="flex items-center gap-1.5 text-gray-700">
												<svg class="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
												</svg>
												<span class="font-semibold text-gray-600">{{ __('Tel:') }}</span>
												<a :href="'tel:' + dispatch.custom_telefono_contacto" class="font-semibold text-blue-600 hover:underline">
													{{ dispatch.custom_telefono_contacto }}
												</a>
											</div>

											<!-- Collection Mode -->
											<div v-if="dispatch.custom_modalidad_cobro_chofer" class="flex items-center gap-1.5 pt-1 border-t border-gray-200/60">
												<span class="font-semibold text-gray-600">{{ __('Modalidad:') }}</span>
												<span class="font-medium text-gray-800">
													{{ dispatch.custom_modalidad_cobro_chofer === 'Cobrar al Chofer Contra Entrega' ? __('Pagar al Chofer Contra Entrega') : dispatch.custom_modalidad_cobro_chofer }}
												</span>
											</div>
										</div>

										<!-- Financial Summary & Balance to Collect -->
										<div class="flex items-center justify-between pt-1">
											<div>
												<span class="text-[10px] text-gray-500 block uppercase font-bold">{{ __('Total') }}</span>
												<span class="text-sm font-bold text-gray-900">{{ formatCurrency(dispatch.grand_total) }}</span>
											</div>
											<div class="text-right">
												<span class="text-[10px] text-gray-500 block uppercase font-bold">{{ __('Saldo a Cobrar') }}</span>
												<span
													:class="[
														'text-sm font-bold',
														(dispatch.outstanding_amount || 0) > 0.01
															? 'text-red-600'
															: 'text-green-600'
													]"
												>
													{{ (dispatch.outstanding_amount || 0) > 0.01 ? formatCurrency(dispatch.outstanding_amount) : __('Pagado') }}
												</span>
											</div>
										</div>

										<!-- Card Actions -->
										<div class="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
											<div class="flex items-center gap-1">
												<button
													@click="$emit('view-invoice', dispatch.name)"
													class="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
													:title="__('Ver Detalle')"
												>
													<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
													</svg>
												</button>
												<button
													@click="$emit('print-invoice', dispatch)"
													class="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
													:title="__('Imprimir Nota de Venta')"
												>
													<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
													</svg>
												</button>
												<button
													v-if="posSettingsStore.enableWhatsappSend"
													type="button"
													@click="$emit('whatsapp-invoice', dispatch)"
													class="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
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
													class="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
													:title="__('Anular Venta')"
												>
													<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
													</svg>
												</button>
											</div>

											<!-- Mark Delivered Button -->
											<button
												v-if="!isDispatchDelivered(dispatch)"
												@click="markAsDelivered(dispatch)"
												:disabled="loadingDelivery[dispatch.name]"
												class="bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:opacity-50 text-white font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
												style="background-color: #16a34a; color: #ffffff;"
											>
												<svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
												</svg>
												<span class="text-white">{{ loadingDelivery[dispatch.name] ? __('Guardando...') : __('Marcar Entregado') }}</span>
											</button>
											<span v-else class="text-xs text-green-700 font-semibold flex items-center gap-1">
												<svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
												</svg>
												{{ dispatch.custom_estado_entrega || __('Entregado') }}
											</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</Transition>

	<!-- Payment Dialog -->
	<PaymentDialog
		v-model="showPaymentDialog"
		:grand-total="selectedInvoice?.outstanding_amount || 0"
		:subtotal="selectedInvoice?.grand_total || 0"
		:items="selectedInvoice?.items || []"
		:customer="selectedInvoice?.customer_name || selectedInvoice?.customer"
		:pos-profile="posProfile"
		:currency="currency"
		:is-offline="false"
		:allow-partial-payment="true"
		@payment-completed="handlePaymentCompleted"
	/>

	<!-- Cancel Invoice Confirmation Modal -->
	<Transition name="fade">
		<div
			v-if="invoiceToCancel"
			class="fixed inset-0 bg-black/60 z-[450] flex items-center justify-center p-4"
			@click.self="closeCancelModal"
		>
			<div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 flex flex-col gap-4 text-start border border-gray-200">
				<div class="flex items-start gap-3">
					<div class="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
						</svg>
					</div>
					<div class="flex-1 min-w-0">
						<h3 class="text-base font-bold text-gray-900">
							{{ __("¿Anular la venta {0}?", [invoiceToCancel.name]) }}
						</h3>
						<p class="text-xs text-gray-600 mt-1">
							{{ __("Cliente:") }} <strong class="text-gray-900">{{ invoiceToCancel.customer_name || invoiceToCancel.customer }}</strong> · {{ __("Total:") }} <strong class="text-red-600">{{ formatCurrency(invoiceToCancel.grand_total) }}</strong>
						</p>
						<p class="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5 mt-2">
							{{ __("Se anularán automáticamente los cobros/anticipos vinculados y los muebles se reingresarán al stock del almacén.") }}
						</p>
					</div>
				</div>

				<div>
					<label class="block text-xs font-semibold text-gray-700 mb-1">
						{{ __("Motivo de anulación (opcional)") }}
					</label>
					<input
						v-model="cancelReason"
						type="text"
						:placeholder="__('Ej: Error en digitación de productos o cliente...')"
						class="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-800"
						@keyup.enter="confirmCancelInvoice"
					/>
				</div>

				<div class="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
					<button
						type="button"
						:disabled="cancellingInvoice"
						@click="closeCancelModal"
						class="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
					>
						{{ __("No, volver") }}
					</button>
					<button
						type="button"
						:disabled="cancellingInvoice"
						@click="confirmCancelInvoice"
						class="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
					>
						<svg v-if="cancellingInvoice" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
						</svg>
						<span>{{ cancellingInvoice ? __("Anulando...") : __("Sí, Anular Venta") }}</span>
					</button>
				</div>
			</div>
		</div>
	</Transition>
</template>

<script setup>
import InvoiceFilters from "@/components/invoices/InvoiceFilters.vue";
import PaymentDialog from "@/components/sale/PaymentDialog.vue";
import { useInvoiceFilters } from "@/composables/useInvoiceFilters";
import { useInvoiceFiltersStore } from "@/stores/invoiceFilters";
import { DEFAULT_CURRENCY, formatCurrency as formatCurrencyUtil } from "@/utils/currency";
import { getInvoiceStatusColor } from "@/utils/invoice";
import { useFormatters } from "@/composables/useFormatters";
import { useToast } from "@/composables/useToast";
import { Button, call, LoadingIndicator } from "frappe-ui";
import { computed, onMounted, ref, watch } from "vue";
import { isOffline } from "@/utils/offline/offlineState";
import {
	cacheUnpaidInvoices,
	getCachedUnpaidInvoices,
	cacheUnpaidSummary,
	getCachedUnpaidSummary,
} from "@/utils/offline/sync";
import { logger } from "@/utils/logger";
import { usePOSSettingsStore } from "@/stores/posSettings";

const log = logger.create("InvoiceManagement");
const { showSuccess, showError } = useToast();
const { formatDate, formatDateTime, formatTime } = useFormatters();
const posSettingsStore = usePOSSettingsStore();

const props = defineProps({
	modelValue: Boolean,
	posProfile: String,
	currency: {
		type: String,
		default: DEFAULT_CURRENCY,
	},
	// Pass in data from parent stores
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
const activeTab = ref("partial");

// Initialize filter store and composable
const filterStore = useInvoiceFiltersStore();

// Create a computed ref for history invoices to use with filter composable
const historyInvoicesRef = computed(() => props.historyInvoices);
const invoiceFilters = useInvoiceFilters(historyInvoicesRef);

// Unpaid invoices data
const unpaidInvoices = ref([]);
const unpaidFilter = ref("all"); // "all", "partial", "unpaid"
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
		await Promise.all([loadUnpaidInvoices(), loadUnpaidSummary()]);
		emit("refresh-history");
		emit("invoice-cancelled", targetName);
	} catch (error) {
		log.error("Error cancelling invoice:", error);
		showError(error.message || __("No se pudo anular la nota de venta"));
	} finally {
		cancellingInvoice.value = false;
	}
}

// Filtered unpaid invoices based on payment amounts
const filteredUnpaidInvoices = computed(() => {
	if (unpaidFilter.value === "partial") {
		// Partially paid: status is 'Partly Paid' only
		return unpaidInvoices.value.filter((inv) => inv.status === "Partly Paid");
	}
	if (unpaidFilter.value === "unpaid") {
		// Totally unpaid: status is 'Unpaid'
		return unpaidInvoices.value.filter((inv) => inv.status === "Unpaid");
	}
	if (unpaidFilter.value === "overdue") {
		// Overdue: invoice status is Overdue
		return unpaidInvoices.value.filter((inv) => inv.status === "Overdue");
	}
	return unpaidInvoices.value; // "all"
});

// Filtered summary based on selected filter
const filteredUnpaidSummary = computed(() => {
	const filtered = filteredUnpaidInvoices.value;

	return {
		count: filtered.length,
		total_outstanding: filtered.reduce((sum, inv) => sum + (inv.outstanding_amount || 0), 0),
		total_paid: filtered.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0),
	};
});

// Return invoices (filtered from history)
const returnInvoices = computed(() => {
	const allInvoices = Array.isArray(props.historyInvoices) ? props.historyInvoices : [];
	return allInvoices.filter((inv) => inv.is_return);
});

// Filtered history using the composable (exclude returns, show in separate tab)
const filteredHistoryInvoices = computed(() => {
	// Filter out return invoices, then apply all filters from the store
	const allInvoices = Array.isArray(props.historyInvoices) ? props.historyInvoices : [];
	const nonReturnInvoices = allInvoices.filter((inv) => !inv.is_return);

	// Use the filter composable with non-return invoices
	const tempInvoicesRef = computed(() => nonReturnInvoices);
	const tempFilters = useInvoiceFilters(tempInvoicesRef);

	return tempFilters.filteredInvoices.value;
});

// Dispatches state & computeds
const dispatchesFilter = ref("pending"); // "pending", "delivered", "all"
const dispatchDateFilter = ref("");
const loadingDelivery = ref({});

const allDispatches = computed(() => {
	const allInvoices = Array.isArray(props.historyInvoices) ? props.historyInvoices : [];
	return allInvoices.filter(
		(inv) => Boolean(
			inv.custom_direccion_entrega ||
			(inv.custom_fecha_entrega && inv.custom_estado_entrega && inv.custom_estado_entrega !== "Entregado en Tienda") ||
			(inv.custom_estado_entrega && ["Pendiente de Entrega", "En Ruta de Despacho", "Pendiente de Carga", "En Camino"].includes(inv.custom_estado_entrega))
		)
	);
});

const pendingDispatches = computed(() => {
	return allDispatches.value.filter(
		(inv) => !isDispatchDelivered(inv)
	);
});

const deliveredDispatches = computed(() => {
	return allDispatches.value.filter(
		(inv) => isDispatchDelivered(inv)
	);
});

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
	return dispatch.custom_estado_entrega === "Entregado" || dispatch.custom_estado_entrega === "Entregado al Cliente";
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

// Tabs configuration
const tabs = computed(() => [
	{
		id: "partial",
		label: __("Unpaid"),
		icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",
		color: "orange",
		activeClass: "text-orange-600",
		badge: () => unpaidInvoices.value.length,
	},
	{
		id: "despachos",
		label: __("Despachos"),
		icon: "M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0",
		color: "amber",
		activeClass: "text-amber-600",
		badge: () => pendingDispatches.value.length,
	},
	{
		id: "history",
		label: __("Invoice History"),
		icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
		color: "indigo",
		activeClass: "text-indigo-600",
		badge: () => filteredHistoryInvoices.value.length,
	},
	{
		id: "drafts",
		label: __("Drafts"),
		icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
		color: "purple",
		activeClass: "text-purple-600",
		badge: () => props.draftInvoices.length,
	},
	{
		id: "returns",
		label: __("Returns"),
		icon: "M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6",
		color: "red",
		activeClass: "text-red-600",
		badge: () => returnInvoices.value.length,
	},
]);

const currentTabLabel = computed(() => {
	return tabs.value.find((t) => t.id === activeTab.value)?.label || "";
});

// Tab class helpers
function getTabActiveClass(tabId) {
	switch (tabId) {
		case "partial":
			return "text-orange-600 border-orange-500";
		case "despachos":
			return "text-amber-600 border-amber-500";
		case "history":
			return "text-indigo-600 border-indigo-500";
		case "drafts":
			return "text-purple-600 border-purple-500";
		case "returns":
			return "text-red-600 border-red-500";
		default:
			return "text-gray-600 border-gray-500";
	}
}

// Badge class helpers
function getBadgeActiveClass(tabId) {
	switch (tabId) {
		case "partial":
			return "bg-orange-100 text-orange-700";
		case "despachos":
			return "bg-amber-100 text-amber-700";
		case "history":
			return "bg-indigo-100 text-indigo-700";
		case "drafts":
			return "bg-purple-100 text-purple-700";
		case "returns":
			return "bg-red-100 text-red-700";
		default:
			return "bg-gray-100 text-gray-700";
	}
}

function getBadgeInactiveClass(tabId) {
	switch (tabId) {
		case "partial":
			return "bg-gray-200 text-gray-600";
		case "despachos":
			return "bg-gray-200 text-gray-600";
		case "history":
			return "bg-gray-200 text-gray-600";
		case "drafts":
			return "bg-gray-200 text-gray-600";
		case "returns":
			return "bg-gray-200 text-gray-600";
		default:
			return "bg-gray-200 text-gray-600";
	}
}

// Watchers
watch(
	() => props.modelValue,
	(val) => {
		show.value = val;
		if (val) {
			loadUnpaidInvoices();
			loadUnpaidSummary();
			// Also request history refresh if we don't have data
			if (props.historyInvoices.length === 0) {
				emit("refresh-history");
			}
		}
	}
);

watch(show, (val) => {
	emit("update:modelValue", val);
});

// Watch for tab changes to emit refresh event for history/returns tabs
watch(activeTab, (newTab) => {
	// Always emit refresh event when switching to history or returns tabs
	// This ensures up-to-date outstanding amounts and invoice data
	if (newTab === "history" || newTab === "returns") {
		emit("refresh-history");
	} else if (newTab === "partial") {
		// Refresh unpaid invoices when switching to partial tab
		loadUnpaidInvoices();
		loadUnpaidSummary();
	}
});

// Methods
function handleClose() {
	show.value = false;
}

async function refreshCurrentTab() {
	if (activeTab.value === "partial") {
		await Promise.all([loadUnpaidInvoices(), loadUnpaidSummary()]);
	} else if (activeTab.value === "history") {
		// Request parent to refresh history data
		emit("refresh-history");
	} else if (activeTab.value === "drafts") {
		// Drafts are passed from parent, emit event if needed
		emit("refresh-history");
	} else if (activeTab.value === "returns") {
		// Returns would also need a refresh
		emit("refresh-history");
	}
}

async function loadUnpaidInvoices() {
	if (!props.posProfile) return;

	// Start loading immediately - show skeleton while fetching
	loading.value = true;

	// Load cached data immediately for instant display
	try {
		const cachedInvoices = await getCachedUnpaidInvoices(props.posProfile, {
			limit: 100,
		});
		if (cachedInvoices && cachedInvoices.length > 0) {
			unpaidInvoices.value = cachedInvoices;
			loading.value = false; // Hide skeleton once we have cached data
			log.debug("Loaded", cachedInvoices.length, "unpaid invoices from cache (instant)");
		}
	} catch (cacheError) {
		log.debug("No cached unpaid invoices available");
	}

	// If offline, we're done - use only cached data
	if (isOffline()) {
		log.info("Offline mode - using cached unpaid invoices");
		loading.value = false;
		return;
	}

	// Fetch fresh data from server in background
	try {
		const result = await call("pos_next.api.partial_payments.get_unpaid_invoices", {
			pos_profile: props.posProfile,
			limit: 100,
		});

		unpaidInvoices.value = result || [];

		// Cache for offline use
		if (result && result.length > 0) {
			cacheUnpaidInvoices(result, props.posProfile);
		}
	} catch (error) {
		log.error("Error loading unpaid invoices:", error);

		// If we already have cached data, don't show error
		if (unpaidInvoices.value.length === 0) {
			showError(error.message || __("Failed to load unpaid invoices"));
		}
	} finally {
		loading.value = false;
	}
}

async function loadUnpaidSummary() {
	if (!props.posProfile) return;

	// Load cached summary immediately for instant display
	try {
		const cachedSummary = await getCachedUnpaidSummary(props.posProfile);
		if (cachedSummary && (cachedSummary.count > 0 || cachedSummary.total_outstanding > 0)) {
			unpaidSummary.value = cachedSummary;
			log.debug("Loaded unpaid summary from cache (instant)");
		}
	} catch (cacheError) {
		log.debug("No cached unpaid summary available");
	}

	// If offline, we're done - use only cached data
	if (isOffline()) {
		log.info("Offline mode - using cached unpaid summary");
		return;
	}

	// Fetch fresh summary from server in background
	try {
		const result = await call("pos_next.api.partial_payments.get_unpaid_summary", {
			pos_profile: props.posProfile,
		});

		unpaidSummary.value = result || {
			count: 0,
			total_outstanding: 0,
			total_paid: 0,
		};

		// Cache for offline use
		if (result) {
			cacheUnpaidSummary(result, props.posProfile);
		}
	} catch (error) {
		log.error("Error loading summary:", error);
		// If we already have cached data, don't show any error - silent fail
	}
}

const loadingInvoiceDetails = ref(false);

async function selectInvoiceForPayment(invoice) {
	loadingInvoiceDetails.value = true;
	try {
		// Fetch full invoice details including items for the payment dialog
		const details = await call("pos_next.api.partial_payments.get_partial_payment_details", {
			invoice_name: invoice.name,
		});
		selectedInvoice.value = details;
		showPaymentDialog.value = true;
	} catch (error) {
		log.error("Error loading invoice details:", error);
		// Fallback to basic invoice data
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

		// Reload invoices and summary for partial tab
		await loadUnpaidInvoices();
		await loadUnpaidSummary();

		// Also refresh history data to show updated outstanding amounts
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

function getPaymentSourceLabel(source) {
	// Convert source to user-friendly label
	switch (source) {
		case "POS":
			return "POS";
		case "POS Payment Entry":
			return "POS";
		case "Payment Entry":
			return "Back Office";
		default:
			return source;
	}
}

function calculateDraftTotal(items) {
	if (!items || items.length === 0) return 0;
	return items.reduce(
		(sum, item) => sum + (item.quantity || item.qty || 0) * (item.rate || 0),
		0
	);
}

// Lifecycle
onMounted(() => {
	// Load saved filter presets from localStorage
	filterStore.loadSavedFiltersFromStorage();

	if (show.value) {
		loadUnpaidInvoices();
		loadUnpaidSummary();
	}
});
</script>

<style scoped>
/* Fade transition for overlay */
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

/* Slide down transition for filter panel */
.slide-down-enter-active,
.slide-down-leave-active {
	transition: all 0.3s ease-in-out;
	max-height: 600px;
	overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
	max-height: 0;
	opacity: 0;
	transform: translateY(-10px);
}

.slide-down-enter-to,
.slide-down-leave-from {
	max-height: 600px;
	opacity: 1;
	transform: translateY(0);
}
</style>
