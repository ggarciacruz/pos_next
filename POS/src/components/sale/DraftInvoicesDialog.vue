<template>
	<MdxModal
		v-model="show"
		size="full"
		:noPadding="true"
	>
		<!-- Header -->
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
						{{ __("Cargar Venta / Cotización") }}
					</h2>
					<p class="text-xs text-slate-500 mt-0.5 truncate">
						{{ __("Gestione e importe sus documentos directamente a la caja") }}
					</p>
				</div>
			</div>
			<div class="flex items-center gap-2 shrink-0">
				<!-- Refresh Button -->
				<MdxButton
					variant="secondary"
					size="sm"
					:loading="isRefreshing"
					@click="refreshData"
				>
					<span class="inline-flex items-center gap-1.5">
						<svg
							v-if="!isRefreshing"
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

				<!-- Close Button -->
				<button
					type="button"
					@click="show = false"
					class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer focus:outline-none"
				>
					<svg
						class="w-5 h-5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
		</template>

		<!-- Body Content (Pinned Toolbar + Full-Height Scrollable Area) -->
		<div class="flex-1 min-h-0 flex flex-col bg-slate-50/50">
			<!-- Search and Segmented Filter Header (mdx_ui) -->
			<div class="shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
				<!-- Standardized Segmented Switcher (mdx_ui) -->
				<div class="w-full lg:w-auto min-w-0">
					<MdxSegmentedControl
						v-model="activeTab"
						:options="draftTabOptions"
						size="sm"
						:full-width="false"
						:scrollable="true"
					/>
				</div>

				<!-- Controls: Pending Filter, Queue Sort & Standardized Search Input (mdx_ui) -->
				<div class="flex flex-wrap items-center gap-2 w-full lg:w-auto">
					<!-- Only Pending Filter -->
					<button
						type="button"
						@click="onlyPending = !onlyPending"
						class="h-9 px-3 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer focus:outline-none shrink-0"
						:class="
							onlyPending
								? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
								: 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
						"
					>
						<svg
							class="w-3.5 h-3.5"
							:class="onlyPending ? 'text-white' : 'text-slate-400'"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							stroke-width="2.2"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
							/>
						</svg>
						<span>{{ __("Solo pendientes") }}</span>
					</button>

					<!-- Queue Sorting Button -->
					<button
						type="button"
						@click="sortByWaiting = !sortByWaiting"
						class="h-9 px-3 text-xs font-bold rounded-lg border transition-all flex items-center gap-2 cursor-pointer focus:outline-none shrink-0"
						:class="
							sortByWaiting
								? 'bg-amber-50 text-amber-800 border-amber-300 shadow-2xs'
								: 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
						"
					>
						<svg
							class="w-3.5 h-3.5"
							:class="sortByWaiting ? 'text-amber-600 animate-pulse' : 'text-slate-400'"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							stroke-width="2.5"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<span>{{ sortByWaiting ? __("Mayor Espera") : __("Recientes") }}</span>
					</button>

					<!-- Standardized Instant Search Box (mdx_ui) -->
					<div class="flex-1 lg:w-72 xl:w-80 min-w-[200px] draft-search-box">
						<MdxSearchInput
							v-model="searchQuery"
							:placeholder="__('Buscar por número o cliente...')"
							:debounce="80"
							:enable-shortcut-listener="false"
							:shortcut-key="''"
						/>
					</div>
				</div>
			</div>

			<!-- Scrollable List / Vertically Centered Empty State -->
			<div class="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 flex flex-col pos-draft-canvas">
				<!-- Empty State -->
				<div
					v-if="filteredDrafts.length === 0"
					class="flex-1 flex flex-col items-center justify-center text-center py-12"
				>
					<div
						class="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-200 shadow-2xs"
					>
						<svg
							class="h-8 w-8 text-slate-400"
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
					<p class="text-sm font-semibold text-slate-700">
						{{
							searchQuery
								? __("No se encontraron resultados")
								: activeTab === "quotations"
								? __("No hay cotizaciones")
								: activeTab === "pre_sales"
								? __("No hay órdenes de venta")
								: __("No hay documentos pendientes")
						}}
					</p>
					<p class="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
						{{
							searchQuery
								? __("Intente buscar con términos diferentes o borre el filtro")
								: activeTab === "quotations"
								? __("Cree cotizaciones en el mostrador para recuperarlas aquí")
								: activeTab === "pre_sales"
								? __("Guarde las ventas como órdenes de venta para continuar más tarde")
								: __("Las órdenes de venta y cotizaciones registradas aparecerán aquí")
						}}
					</p>
				</div>

				<!-- Drafts Horizontal List Layout -->
				<div v-else class="flex flex-col gap-3">
					<div
						v-for="draft in paginatedDrafts"
						:key="draft.draft_id"
						class="flex flex-col overflow-hidden"
						:class="
							isDraftAlreadyProcessed(draft)
								? 'pos-draft-card pos-draft-card--processed'
								: isDraftQuotation(draft)
								? 'pos-draft-card pos-draft-card--quotation group'
								: 'pos-draft-card group'
						"
					>
						<!-- Card Summary Row -->
						<div
							class="px-4 py-3.5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 cursor-pointer"
							@click="handleCardRowClick(draft)"
						>
							<!-- Zone 1: Doc ID, Type & Status -->
							<div class="w-full lg:w-[240px] shrink-0 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-slate-200 pb-3 lg:pb-0 lg:pe-4">
								<div class="flex items-center gap-1.5 mb-1.5 flex-wrap">
									<h4
										class="text-sm md:text-base font-extrabold tabular-nums transition-colors"
										:class="
											isDraftAlreadyProcessed(draft)
												? 'text-slate-600'
												: 'text-slate-900 group-hover:text-blue-600'
										"
									>
										{{ draft.draft_id }}
									</h4>
									<MdxBadge
										:variant="isDraftQuotation(draft) ? 'info' : 'neutral'"
										size="sm"
									>
										{{ isDraftQuotation(draft) ? __("Cotización") : __("Pre-venta") }}
									</MdxBadge>
									<MdxBadge
										v-if="isDraftAlreadyProcessed(draft)"
										variant="success"
										size="sm"
									>
										{{ isDraftQuotation(draft) ? __("Ordenada") : __("Vendido") }}
									</MdxBadge>
									<MdxBadge
										v-else-if="draft.docstatus === 1"
										variant="warning"
										size="sm"
										:dot="true"
									>
										{{ __("Pendiente") }}
									</MdxBadge>
									<MdxBadge
										v-else
										variant="neutral"
										size="sm"
									>
										{{ __("Borrador") }}
									</MdxBadge>
								</div>
								<div class="flex items-center gap-2 flex-wrap">
									<p class="text-xs text-slate-500">
										{{ formatDateTime(draft.created_at) }}
									</p>
									<span
										v-if="!isDraftAlreadyProcessed(draft)"
										class="inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2 py-0.5 rounded-md border uppercase tracking-wider"
										:class="
											getWaitingStatus(draft.created_at) === 'critical'
												? 'bg-red-50 text-red-700 border-red-200'
												: getWaitingStatus(draft.created_at) === 'warning'
												? 'bg-amber-50 text-amber-700 border-amber-200'
												: 'bg-emerald-50 text-emerald-700 border-emerald-200'
										"
									>
										<span class="relative flex h-1.5 w-1.5 shrink-0">
											<span
												v-if="getWaitingStatus(draft.created_at) === 'critical'"
												class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"
											></span>
											<span
												class="relative inline-flex rounded-full h-1.5 w-1.5"
												:class="
													getWaitingStatus(draft.created_at) === 'critical'
														? 'bg-red-500'
														: getWaitingStatus(draft.created_at) === 'warning'
														? 'bg-amber-500'
														: 'bg-emerald-500'
												"
											></span>
										</span>
										{{ getTimeAgo(draft.created_at) }}
									</span>
								</div>
							</div>

							<!-- Zone 2: Customer & Salesperson -->
							<div class="w-full lg:w-[230px] shrink-0 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-slate-200 pb-3 lg:pb-0 lg:pe-4 min-w-0">
								<span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
									{{ __("Cliente") }}
								</span>
								<p
									class="text-sm font-bold truncate leading-snug mt-0.5"
									:class="isDraftAlreadyProcessed(draft) ? 'text-slate-600' : 'text-slate-900'"
								>
									{{ draft.customer?.customer_name || draft.customer?.name || draft.customer }}
								</p>
								<div v-if="draft.owner" class="text-xs text-slate-500 mt-1 flex items-center gap-1 truncate">
									<span class="font-bold text-slate-400 uppercase text-[9px] tracking-wider">{{ __("Vendedor:") }}</span>
									<span class="font-semibold text-slate-600 truncate">
										{{ userNamesMap[draft.owner] || draft.owner.split("@")[0].toUpperCase() }}
									</span>
								</div>
							</div>

							<!-- Zone 3: Compact Items Preview + Expand Trigger (Zero Inner Scrollbar) -->
							<div class="flex-1 min-w-0 border-b lg:border-b-0 lg:border-r border-slate-200 pb-3 lg:pb-0 lg:pe-4 flex flex-col justify-center">
								<div class="flex items-center justify-between gap-2 mb-1.5">
									<span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
										{{ __("Detalle de Items") }} ({{ draft.items?.length || 0 }})
									</span>
									<button
										v-if="(draft.items?.length || 0) > 0"
										type="button"
										@click.stop="toggleExpandDraft(draft.draft_id)"
										class="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 px-1.5 py-0.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
									>
										<span>{{ isDraftExpanded(draft.draft_id) ? __("Ocultar detalle") : __("Ver detalle") }}</span>
										<svg
											class="w-3.5 h-3.5 transition-transform duration-150"
											:class="isDraftExpanded(draft.draft_id) ? 'rotate-180' : ''"
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
										v-for="(item, idx) in getPreviewItems(draft)"
										:key="idx"
										class="text-[11px] border px-2.5 py-1 rounded-lg truncate max-w-[240px] xl:max-w-[280px] font-medium"
										:class="
											isDraftAlreadyProcessed(draft)
												? 'bg-white border-slate-200 text-slate-600'
												: 'bg-slate-50 border-slate-200 text-slate-700'
										"
										:title="`${item.item_name || item.item_code}${(item.custom_medida || item.medida) ? ' (' + (item.custom_medida || item.medida) + ')' : ''}`"
									>
										{{ item.item_name || item.item_code }}{{ (item.custom_medida || item.medida) ? " (" + (item.custom_medida || item.medida) + ")" : "" }}
										<span class="text-slate-900 font-extrabold ms-1">x{{ item.quantity || item.qty }}</span>
									</span>
									<button
										v-if="getHiddenItemsCount(draft) > 0"
										type="button"
										@click.stop="toggleExpandDraft(draft.draft_id)"
										class="text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer shrink-0"
										:class="
											isDraftExpanded(draft.draft_id)
												? 'bg-slate-900 border-slate-900 text-white'
												: 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
										"
									>
										{{ isDraftExpanded(draft.draft_id) ? __("Menos") : `+${getHiddenItemsCount(draft)} ${__("más")}` }}
									</button>
								</div>
							</div>

						<!-- Zone 4: Amount & Quick Actions -->
						<div class="w-full lg:w-auto shrink-0 flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-3.5">
							<div class="flex flex-col lg:items-end shrink-0 whitespace-nowrap">
								<span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none whitespace-nowrap">
									{{
										isDraftAlreadyProcessed(draft)
											? (isDraftQuotation(draft) ? __("Total Cotizado") : __("Vendido"))
											: __("Total a Cobrar")
									}}
								</span>
								<span
									class="text-base md:text-lg font-extrabold tabular-nums whitespace-nowrap mt-1"
									:class="isDraftAlreadyProcessed(draft) ? 'text-slate-500' : 'text-slate-900'"
								>
									{{ formatCurrency(calculateTotal(draft.items)) }}
								</span>
							</div>

							<div class="flex items-center gap-1.5 shrink-0" @click.stop>
								<MdxButton
									v-if="!isDraftAlreadyProcessed(draft)"
									variant="primary"
									size="sm"
									@click.stop="handleDraftClick(draft)"
								>
									{{ bootstrapStore.canCheckout() ? __("Cobrar") : __("Cargar") }}
								</MdxButton>
								<button
									v-if="props.allowPrintDraftInvoices"
									type="button"
									@click.stop="handlePrintDraft(draft)"
									class="w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg transition-all touch-manipulation shadow-2xs"
									:title="__('Imprimir Ticket')"
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
											d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
										/>
									</svg>
								</button>
								<button
									type="button"
									@click.stop="handlePrintDraftPDF(draft)"
									class="h-8 px-2.5 inline-flex items-center justify-center gap-1 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-700 hover:text-red-700 rounded-lg transition-all touch-manipulation shadow-2xs"
									:title="__('Abrir PDF Tamaño Carta')"
								>
									<svg
										class="w-3.5 h-3.5 text-red-600 shrink-0"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										stroke-width="2"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
										/>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M14 2v6h6M9 15h6M9 11h2"
										/>
									</svg>
									<span class="text-[11px] font-extrabold tracking-tight">PDF</span>
								</button>
								<button
									v-if="posSettingsStore.enableWhatsappSend"
									type="button"
									@click.stop="handleWhatsAppDraft(draft)"
									class="w-8 h-8 flex items-center justify-center bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-slate-600 hover:text-emerald-700 rounded-lg transition-all touch-manipulation shadow-2xs"
									:title="__('Enviar por WhatsApp')"
								>
									<svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
										<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
									</svg>
								</button>
								<button
									v-if="canDiscardDrafts && !isDraftAlreadyProcessed(draft)"
									type="button"
									@click.stop="handleDeleteDraft(draft.draft_id)"
									class="w-8 h-8 flex items-center justify-center bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-700 rounded-lg transition-all touch-manipulation shadow-2xs"
									:title="__('Anular / descartar documento')"
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
											d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
										/>
									</svg>
								</button>
							</div>
						</div>
						</div>

						<!-- Expandable Items Detail Sub-Table Accordion (mdx_ui MdxDataTable) -->
						<div
							v-if="isDraftExpanded(draft.draft_id)"
							class="border-t border-slate-200 bg-slate-50/80 px-4 py-3 draft-items-subtable"
							@click.stop
						>
							<MdxDataTable
								:columns="draftItemColumns"
								:rows="getDraftTableRows(draft)"
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
		</div>

		<!-- Footer (Actions & Pagination) -->
		<template #footer>
			<div
				class="flex items-center w-full gap-3"
				:class="totalPages > 1 ? 'justify-between' : 'justify-end'"
			>
				<div v-if="totalPages > 1" class="hidden sm:block"></div>

				<!-- Center: Pagination Controls -->
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
						<span class="text-slate-400 font-medium">({{ __("Total: {0}", [filteredDrafts.length]) }})</span>
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

				<!-- Right: Close Button -->
				<MdxButton variant="secondary" @click="show = false">
					{{ __("Cerrar") }}
				</MdxButton>
			</div>
		</template>
	</MdxModal>

	<!-- Delete Single Draft Confirmation (mdx_ui) -->
	<MdxConfirmDialog
		v-model="showDeleteDialog"
		variant="danger"
		icon="trash"
		:title="__('¿Anular / Descartar Documento?')"
		:message="__('¿Desea anular y retirar este documento pendiente de la bandeja?')"
		:cancel-text="__('Cancelar')"
		:confirm-text="__('Sí, descartar')"
		@confirm="confirmDeleteDraft"
	/>
</template>

<script setup>
import {
	DEFAULT_CURRENCY,
	DEFAULT_LOCALE,
	formatCurrency as formatCurrencyUtil,
	roundCurrency,
} from "@/utils/currency";
import { deleteDraft, getAllDrafts } from "@/utils/draftManager";
import { parseFrappeDateTime } from "@/utils/date";
import { printInvoice } from "@/utils/printInvoice";
import { useToast } from "@/composables/useToast";
import { useBootstrapStore } from "@/stores/bootstrap";
import { usePOSShiftStore } from "@/stores/posShift";
import { usePOSDraftsStore } from "@/stores/posDrafts";
import { usePOSSettingsStore } from "@/stores/posSettings";
import { call } from "frappe-ui";
import {
	MdxBadge,
	MdxButton,
	MdxConfirmDialog,
	MdxDataTable,
	MdxModal,
	MdxSearchInput,
	MdxSegmentedControl,
} from "mdx_ui";
import { db } from "@/utils/offline/db";
import { onMounted, ref, watch, computed } from "vue";

const PREVIEW_ITEMS_LIMIT = 2;

const { showSuccess, showError, showWarning } = useToast();
const bootstrapStore = useBootstrapStore();
const shiftStore = usePOSShiftStore();
const draftsStore = usePOSDraftsStore();
const posSettingsStore = usePOSSettingsStore();

const canDiscardDrafts = computed(
	() => bootstrapStore.canCheckout() && posSettingsStore.canCancelInvoice
);

const props = defineProps({
	modelValue: Boolean,
	currency: {
		type: String,
		default: DEFAULT_CURRENCY,
	},
	allowPrintDraftInvoices: {
		type: Boolean,
		default: false,
	},
});

const emit = defineEmits(["update:modelValue", "load-draft", "drafts-updated", "whatsapp-invoice"]);

const show = ref(props.modelValue);
const drafts = ref([]);
const showDeleteDialog = ref(false);
const draftToDelete = ref(null);
const activeTab = ref("all"); // "all", "pre_sales" or "quotations"
const searchQuery = ref("");
const isRefreshing = ref(false);
const currentPage = ref(1);
const pageSize = 10;
const sortByWaiting = ref(false);
const onlyPending = ref(false);
const expandedDraftIds = ref(new Set());

function isDraftExpanded(draftId) {
	return Boolean(draftId && expandedDraftIds.value.has(draftId));
}

function toggleExpandDraft(draftId) {
	if (!draftId) return;
	const next = new Set(expandedDraftIds.value);
	if (next.has(draftId)) {
		next.delete(draftId);
	} else {
		next.add(draftId);
	}
	expandedDraftIds.value = next;
}

function getPreviewItems(draft) {
	return (draft?.items || []).slice(0, PREVIEW_ITEMS_LIMIT);
}

function getHiddenItemsCount(draft) {
	return Math.max(0, (draft?.items?.length || 0) - PREVIEW_ITEMS_LIMIT);
}

function formatWarehouseLabel(warehouse) {
	const raw = String(warehouse || "").trim();
	if (!raw) return "—";
	return raw.replace(/\s+-\s+[A-Z0-9]{1,6}$/i, "").trim() || raw;
}

const draftItemColumns = computed(() => [
	{ key: "line_no", label: "#", width: 48, align: "center", hideOnMobile: true },
	{ key: "item_code", label: __("Código"), width: 110, align: "left" },
	{ key: "item_display", label: __("Producto / Medida"), width: 320, align: "left", primary: true },
	{ key: "warehouse_display", label: __("Almacén"), width: 145, align: "left" },
	{ key: "qty_display", label: __("Cant."), width: 100, align: "right" },
	{ key: "rate_display", label: __("P. Unit."), width: 115, align: "right" },
	{ key: "amount_display", label: __("Subtotal"), width: 120, align: "right" },
]);

function getDraftTableRows(draft) {
	return (draft?.items || []).map((item, idx) => {
		const qty = Number(item.quantity ?? item.qty ?? 0);
		const rate = Number(item.rate ?? 0);
		const amount = Number(item.amount ?? roundCurrency(qty * roundCurrency(rate)));
		const uom = item.uom || item.stock_uom || "";
		const medida = item.custom_medida || item.medida || "";
		const itemName = item.item_name || item.item_code || "";
		return {
			_rowKey: item.so_detail || item.name || `${draft?.draft_id || "draft"}-${idx}`,
			line_no: idx + 1,
			item_code: item.item_code || "—",
			item_name: itemName,
			medida,
			item_display: medida ? `${itemName} (${medida})` : itemName,
			warehouse_display: formatWarehouseLabel(item.warehouse),
			qty,
			uom,
			qty_display: uom ? `${qty} ${uom}` : `${qty}`,
			rate_display: formatCurrency(rate),
			amount_display: formatCurrency(amount),
		};
	});
}

const sortedDrafts = computed(() => {
	const list = [...filteredDrafts.value];
	list.sort((a, b) => {
		const procA = isDraftAlreadyProcessed(a) ? 1 : 0;
		const procB = isDraftAlreadyProcessed(b) ? 1 : 0;
		if (procA !== procB) return procA - procB;

		const dateA = a.created_at ? new Date(a.created_at) : 0;
		const dateB = b.created_at ? new Date(b.created_at) : 0;
		return sortByWaiting.value ? dateA - dateB : dateB - dateA;
	});
	return list;
});

const totalPages = computed(() => {
	return Math.ceil(sortedDrafts.value.length / pageSize) || 1;
});

const paginatedDrafts = computed(() => {
	const start = (currentPage.value - 1) * pageSize;
	const end = start + pageSize;
	return sortedDrafts.value.slice(start, end);
});

watch([activeTab, searchQuery, sortByWaiting, onlyPending], () => {
	currentPage.value = 1;
	expandedDraftIds.value = new Set();
});

watch(currentPage, () => {
	expandedDraftIds.value = new Set();
});

async function refreshData() {
	isRefreshing.value = true;
	try {
		await loadDrafts();
		showSuccess(__("Datos actualizados correctamente"));
	} catch (error) {
		console.error("Error refreshing drafts:", error);
	} finally {
		isRefreshing.value = false;
	}
}

const searchMatchedDrafts = computed(() => {
	const q = (searchQuery.value || "").toLowerCase().trim();

	return drafts.value.filter((draft) => {
		if (onlyPending.value && isDraftAlreadyProcessed(draft)) {
			return false;
		}
		if (!q) return true;

		const matchesId = draft.draft_id && String(draft.draft_id).toLowerCase().includes(q);
		const custName =
			draft.customer?.customer_name || draft.customer?.name || draft.customer || "";
		const matchesCustomer = String(custName).toLowerCase().includes(q);
		return Boolean(matchesId || matchesCustomer);
	});
});

const draftTabOptions = computed(() => {
	const list = searchMatchedDrafts.value;
	let quotationsCount = 0;
	for (const draft of list) {
		if (isDraftQuotation(draft)) {
			quotationsCount += 1;
		}
	}
	const preSalesCount = list.length - quotationsCount;

	return [
		{
			value: "all",
			label: __("Todos"),
			badge: list.length,
		},
		{
			value: "pre_sales",
			label: __("Órdenes de Venta"),
			badge: preSalesCount,
		},
		{
			value: "quotations",
			label: __("Cotizaciones"),
			badge: quotationsCount,
		},
	];
});

const filteredDrafts = computed(() => {
	if (activeTab.value === "all") {
		return searchMatchedDrafts.value;
	}
	return searchMatchedDrafts.value.filter((draft) => {
		const isQuotation = isDraftQuotation(draft);
		return activeTab.value === "quotations" ? isQuotation : !isQuotation;
	});
});

function isDraftQuotation(draft) {
	if (!draft) return false;
	if (draft.doctype === "Quotation") return true;

	const draftId = draft.draft_id;
	return draftId && (
		draftId.includes("-QTN-") ||
		draftId.includes("-COT-") ||
		draftId.startsWith("QTN-") ||
		draftId.startsWith("COT-")
	);
}

function isDraftAlreadyProcessed(draft) {
	if (!draft) return false;
	const isQuotation = isDraftQuotation(draft);
	if (isQuotation) {
		return draft.status === "Ordered";
	} else {
		return draft.status === "Billed" || draft.status === "Completed";
	}
}

function handleDraftClick(draft) {
	if (isDraftAlreadyProcessed(draft)) {
		showWarning(__("Este documento ya ha sido vendido o procesado."));
		return;
	}
	emit("load-draft", draft);
}

function handleCardRowClick(draft) {
	if (isDraftAlreadyProcessed(draft)) {
		toggleExpandDraft(draft?.draft_id);
		return;
	}
	handleDraftClick(draft);
}

watch(
	() => props.modelValue,
	(val) => {
		show.value = val;
		if (val) {
			loadDrafts();
		} else {
			expandedDraftIds.value = new Set();
		}
	}
);

watch(show, (val) => {
	emit("update:modelValue", val);
});

onMounted(() => {
	loadDrafts();
});

const userNamesMap = ref({});

async function loadOwnerNames(draftList) {
	if (!draftList || draftList.length === 0) return;

	const ownersToFetch = [...new Set(draftList.map((d) => d.owner).filter(Boolean))].filter(
		(owner) => !userNamesMap.value[owner]
	);

	if (ownersToFetch.length === 0) return;

	try {
		const users = await call("frappe.client.get_list", {
			doctype: "User",
			fields: ["name", "full_name"],
			filters: [["name", "in", ownersToFetch]],
			limit: 100,
		});
		if (users) {
			users.forEach((u) => {
				userNamesMap.value[u.name] = u.full_name;
			});
		}
	} catch (err) {
		console.warn("Failed to batch fetch user names:", err);
	}
}

async function loadDrafts() {
	try {
		await draftsStore.loadDrafts();
		drafts.value = draftsStore.drafts;

		// Hydrate owner names in batch
		await loadOwnerNames(drafts.value);

		// Hydrate missing custom_medida from IndexedDB cache
		const promises = drafts.value.map(async (draft) => {
			if (draft.items) {
				const itemPromises = draft.items.map(async (item) => {
					if (!item.custom_medida && item.item_code) {
						const cached = await db.items.get(item.item_code);
						if (cached && cached.custom_medida) {
							item.custom_medida = cached.custom_medida;
						}
					}
				});
				await Promise.all(itemPromises);
			}
		});
		await Promise.all(promises);
	} catch (error) {
		console.error("Error loading drafts:", error);
		showError(__("Failed to load draft invoices"));
	}
}

async function handlePrintDraft(draft) {
	if (!props.allowPrintDraftInvoices) {
		return;
	}

	try {
		const isQuotation = isDraftQuotation(draft);

		const invoiceData = {
			name: draft.draft_id,
			company: shiftStore.profileCompany,
			items: draft.items,
			payments: [],
			grand_total: calculateTotal(draft.items),
			posting_date: draft.created_at,
			customer_name: draft.customer?.customer_name || draft.customer?.name || draft.customer,
			status: isQuotation ? "Quotation" : "Draft",
			header: isQuotation ? "Quotation" : "Draft",
			footer: isQuotation
				? "Este documento es una cotización informativa y no representa una factura ni compromiso de compra. Válido por 3 días."
				: "Este documento es una orden de venta y no representa una factura válida ni un comprobante de pago oficial.",
		};
		await printInvoice(invoiceData);
	} catch (error) {
		console.error("Error printing draft:", error);
		showError(__("Failed to print draft"));
	}
}

function handlePrintDraftPDF(draft) {
	if (!draft || !draft.draft_id) return;
	const isQuotation = isDraftQuotation(draft);
	const doctype = draft.doctype || (isQuotation ? "Quotation" : "Sales Order");
	const url = posSettingsStore.buildLetterPdfUrl(
		doctype,
		draft.draft_id,
		shiftStore.currentProfile?.print_format || ""
	);
	window.open(url, "_blank");
}

function handleWhatsAppDraft(draft) {
	if (!draft) return;
	const isQuotation = isDraftQuotation(draft);
	emit("whatsapp-invoice", {
		name: draft.draft_id,
		draft_id: draft.draft_id,
		doctype: draft.doctype || (isQuotation ? "Quotation" : "Sales Order"),
		items: draft.items || [],
		customer: draft.customer,
		customer_name: draft.customer?.customer_name || draft.customer?.name || draft.customer,
		grand_total: calculateTotal(draft.items),
		posting_date: draft.created_at,
	});
}

function handleDeleteDraft(draftId) {
	draftToDelete.value = draftId;
	showDeleteDialog.value = true;
}

async function confirmDeleteDraft() {
	const deleted = await draftsStore.deleteDraft(draftToDelete.value);
	showDeleteDialog.value = false;
	draftToDelete.value = null;
	if (!deleted) {
		return;
	}
	await loadDrafts();
	emit("drafts-updated");
}

function formatDateTime(dateStr) {
	const date = parseFrappeDateTime(dateStr);
	if (!date) return "";
	return date.toLocaleString(DEFAULT_LOCALE, {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function formatCurrency(amount) {
	return formatCurrencyUtil(Number.parseFloat(amount || 0), props.currency);
}

function calculateTotal(items) {
	if (!items || items.length === 0) return 0;
	return roundCurrency(
		items.reduce((sum, item) => {
			const qty = item.quantity || item.qty || 1;
			const rate = item.rate || 0;
			return sum + roundCurrency(qty * roundCurrency(rate));
		}, 0)
	);
}

function getTimeAgo(createdAt) {
	if (!createdAt) return "";
	const date = parseFrappeDateTime(createdAt);
	if (!date) return "";
	const now = new Date();
	const diffMs = Math.max(0, now - date);
	const diffMins = Math.floor(diffMs / 60000);

	if (diffMins < 1) return __("Just now");
	if (diffMins < 60) return __("{0} min ago", [diffMins]);

	const diffHours = Math.floor(diffMins / 60);
	if (diffHours < 24) return __("{0} hr ago", [diffHours]);

	const diffDays = Math.floor(diffHours / 24);
	return __("{0} day ago", [diffDays]);
}

function getWaitingStatus(createdAt) {
	if (!createdAt) return "normal";
	const date = parseFrappeDateTime(createdAt);
	if (!date) return "normal";
	const now = new Date();
	const diffMins = Math.max(0, Math.floor((now - date) / 60000));
	if (diffMins >= 20) return "critical";
	if (diffMins >= 10) return "warning";
	return "normal";
}
</script>

<style scoped>
.draft-search-box :deep(.mdx-search) {
	max-width: none;
}

.pos-draft-canvas {
	background-color: #eef2f6;
}

.pos-draft-card {
	background-color: #ffffff;
	border: 1px solid #cbd5e1;
	border-left: 4px solid #2563eb;
	border-radius: 0.875rem;
	box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04);
	transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.pos-draft-card--quotation {
	border-left-color: #0284c7;
}

.pos-draft-card:not(.pos-draft-card--processed):hover {
	border-color: #60a5fa;
	border-left-color: #1d4ed8;
	box-shadow: 0 6px 16px -4px rgba(15, 23, 42, 0.12), 0 2px 6px -2px rgba(37, 99, 235, 0.08);
}

.pos-draft-card--processed {
	background-color: #f8fafc;
	border: 1px solid #cbd5e1;
	border-left: 4px solid #94a3b8;
	box-shadow: none;
}

.draft-items-subtable :deep(.mdx-table-scroll) {
	background-color: #ffffff;
}

.draft-items-subtable :deep(.mdx-table__row) {
	cursor: default;
}

.draft-items-subtable :deep(.mdx-table__row:last-child .mdx-table__td) {
	border-bottom: none;
}
</style>
