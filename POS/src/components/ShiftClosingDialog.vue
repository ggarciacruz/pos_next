<template>
	<MdxModal
		v-model="open"
		:title="__('Cierre y Arqueo de Caja')"
		:subtitle="closingData ? cleanProfileName(closingData.pos_profile) : ''"
		size="5xl"
		:persistent="showDifferenceWarningModal || submitResource.loading"
	>
		<template #header-icon>
			<svg class="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
				<rect x="2" y="5" width="20" height="14" rx="2" />
				<path stroke-linecap="round" d="M2 10h20M15 15h3" />
			</svg>
		</template>

		<div class="flex flex-col gap-4">
			<div v-if="closingDataResource.loading" class="py-12 flex justify-center">
				<MdxLoadingSpinner size="lg" :label="__('Cargando datos del turno...')" />
			</div>

			<div v-else-if="closingData" class="flex flex-col gap-4">
				<!-- Idle Warning -->
				<div
					v-if="showIdleWarning"
					class="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-center gap-2.5 text-start"
				>
					<FeatherIcon name="alert-triangle" class="w-4 h-4 text-amber-600 shrink-0" />
					<p class="text-xs md:text-sm text-amber-900 font-medium">
						{{
							__(
								"This dialog has been open for over a minute. Please close the shift or close this dialog to resume the shift timer."
							)
						}}
					</p>
				</div>

				<!-- Executive Shift Banner & 4 KPIs -->
				<div
					v-if="shouldShowSummary"
					class="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col gap-4"
				>
					<div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
						<div class="text-start">
							<div class="flex items-center gap-2 flex-wrap">
								<h3 class="text-sm md:text-base font-bold text-slate-900">
									{{ cleanProfileName(closingData.pos_profile) }}
								</h3>
								<MdxBadge
									v-if="showSuccessReport"
									variant="success"
									size="sm"
								>
									{{ __("Turno Cerrado") }}
								</MdxBadge>
								<MdxBadge
									v-else
									variant="info"
									size="sm"
								>
									{{ __("En Proceso de Arqueo") }}
								</MdxBadge>
							</div>
							<p class="text-xs text-slate-500 mt-0.5 tabular-nums">
								{{ __("Apertura:") }} {{ formatDateTime(closingData.period_start_date) }}
								<template v-if="closingData.opened_by_full_name">
									· {{ __("Abierto por:") }} <strong class="text-slate-700">{{ closingData.opened_by_full_name }}</strong>
								</template>
								<template
									v-if="
										closingData.closed_by_full_name &&
										closingData.opened_by_user &&
										closingData.closed_by_user !== closingData.opened_by_user
									"
								>
									· {{ __("Cierre por:") }} <strong class="text-slate-700">{{ closingData.closed_by_full_name }}</strong>
								</template>
							</p>
						</div>

						<div class="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-end">
							<span class="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
								{{ __("Duración del Turno") }}
							</span>
							<span class="text-sm md:text-base font-bold text-slate-900 tabular-nums">
								{{ getShiftDuration() }}
							</span>
						</div>
					</div>

					<div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
						<!-- Gross Sales -->
						<div class="bg-slate-50/70 border border-slate-200 rounded-xl p-3 text-start">
							<span class="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
								{{ __("Ventas Brutas") }}
							</span>
							<div class="text-lg md:text-xl font-bold text-slate-900 mt-0.5 tabular-nums truncate">
								{{ formatCurrency(grossSales) }}
							</div>
							<span class="text-[11px] text-slate-500">
								{{ __("{0} comprobantes", [closingData.sales_count || salesInvoiceCount]) }}
							</span>
						</div>

						<!-- Returns OR Taxes -->
						<div
							v-if="hasReturns"
							class="bg-slate-50/70 border border-slate-200 rounded-xl p-3 text-start"
						>
							<span class="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
								{{ __("Devoluciones") }}
							</span>
							<div class="text-lg md:text-xl font-bold text-slate-900 mt-0.5 tabular-nums truncate">
								-{{ formatCurrency(closingData.returns_total) }}
							</div>
							<span class="text-[11px] text-slate-500">
								{{ __("{0} notas", [closingData.returns_count]) }}
							</span>
						</div>
						<div
							v-else
							class="bg-slate-50/70 border border-slate-200 rounded-xl p-3 text-start"
						>
							<span class="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
								{{ __("Impuestos") }}
							</span>
							<div class="text-lg md:text-xl font-bold text-slate-900 mt-0.5 tabular-nums truncate">
								{{ formatCurrency(totalTax) }}
							</div>
							<span class="text-[11px] text-slate-500">{{ __("IVA débito neto") }}</span>
						</div>

						<!-- Net Sales -->
						<div class="bg-slate-50/70 border border-slate-200 rounded-xl p-3 text-start">
							<span class="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
								{{ __("Ventas Netas") }}
							</span>
							<div class="text-lg md:text-xl font-bold text-slate-900 mt-0.5 tabular-nums truncate">
								{{ formatCurrency(closingData.grand_total) }}
							</div>
							<span class="text-[11px] text-slate-500">{{ __("Total facturado / notas") }}</span>
						</div>

						<!-- Overall Reconciliation Status -->
						<div class="bg-white border border-slate-200 rounded-xl p-3 text-start flex flex-col justify-between">
							<div class="flex items-center justify-between gap-1">
								<span class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
									{{ __("Varianza Total") }}
								</span>
								<MdxBadge
									:variant="
										!canSubmit
											? 'warning'
											: getTotalDifference === 0
												? 'success'
												: getTotalDifference > 0
													? 'info'
													: 'danger'
									"
									size="sm"
								>
									{{
										!canSubmit
											? __("Pendiente")
											: getTotalDifference === 0
												? __("Cuadrado")
												: getTotalDifference > 0
													? __("Sobrante")
													: __("Faltante")
									}}
								</MdxBadge>
							</div>
							<div
								:class="[
									'text-lg md:text-xl font-extrabold mt-0.5 tabular-nums truncate',
									!canSubmit
										? 'text-slate-400'
										: getTotalDifference === 0
											? 'text-slate-900'
											: getTotalDifference > 0
												? 'text-blue-700'
												: 'text-red-700',
								]"
							>
								{{ getTotalDifference > 0 ? "+" : "" }}{{ formatCurrency(getTotalDifference) }}
							</div>
							<span class="text-[11px] text-slate-500 tabular-nums">
								{{ __("Esperado:") }} {{ formatCurrency(getTotalExpected) }}
							</span>
						</div>
					</div>
				</div>

				<!-- Accounting Confirmation Notice (Post-Closing) -->
				<div
					v-if="showSuccessReport && (closedDifferenceJournalEntry || closedExpenseJournalEntry || hasCashDifference)"
					class="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex flex-col gap-1.5 text-start"
				>
					<div class="flex items-center gap-2 text-xs md:text-sm font-bold text-slate-900">
						<svg class="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<span>{{ __("Respaldo Contable del Cierre") }}</span>
					</div>
					<p v-if="closedDifferenceJournalEntry" class="text-xs text-slate-700 tabular-nums">
						{{
							closedDifferenceAmount < 0
								? __("Faltante de Caja (Gasto) contabilizado automáticamente por {0}. Asiento:", [formatCurrency(Math.abs(closedDifferenceAmount))])
								: __("Sobrante de Caja (Ingreso) contabilizado automáticamente por {0}. Asiento:", [formatCurrency(Math.abs(closedDifferenceAmount))])
						}}
						<strong class="text-slate-900">{{ closedDifferenceJournalEntry }}</strong>
					</p>
					<p v-else-if="hasCashDifference" class="text-xs text-slate-600">
						{{ __("Diferencia de arqueo registrada en el cierre (pendiente de contabilización desde Desk).") }}
					</p>
					<p v-if="closedExpenseJournalEntry" class="text-xs text-slate-700 tabular-nums">
						{{ __("Gastos Menores de Caja contabilizados automáticamente. Asiento:") }}
						<strong class="text-slate-900">{{ closedExpenseJournalEntry }}</strong>
					</p>
				</div>

				<!-- Cashier Activity Breakdown (especially useful for shared shifts) -->
				<div
					v-if="shouldShowSummary && closingData.cashier_breakdown && closingData.cashier_breakdown.length > 0"
					class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs"
				>
					<div class="px-4 py-2.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
						<h3 class="text-xs md:text-sm font-bold text-slate-900">
							{{ __("Operaciones del Turno por Usuario") }}
						</h3>
						<span class="text-[11px] font-semibold text-slate-500 tabular-nums">
							{{ __("{0} participantes", [closingData.cashier_breakdown.length]) }}
						</span>
					</div>
					<div class="divide-y divide-slate-100">
						<div
							v-for="uRow in closingData.cashier_breakdown"
							:key="uRow.user"
							class="px-4 py-2.5 flex items-center justify-between gap-3 text-xs"
						>
							<div class="min-w-0 text-start">
								<span class="font-semibold text-slate-900 block truncate">
									{{ uRow.full_name || uRow.user }}
								</span>
								<span class="text-[11px] text-slate-500 tabular-nums">
									{{ __("{0} ventas", [uRow.sales_count || 0]) }}
									<template v-if="uRow.returns_count">
										· {{ __("{0} devoluciones", [uRow.returns_count]) }}
									</template>
								</span>
							</div>
							<span class="text-xs md:text-sm font-bold text-slate-900 tabular-nums shrink-0">
								{{ formatCurrency(uRow.net_total) }}
							</span>
						</div>
					</div>
				</div>

				<!-- No Sales Notice -->
				<div
					v-if="shouldShowSummary && invoiceCount === 0"
					class="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3 text-start"
				>
					<svg class="h-5 w-5 text-slate-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<p class="text-xs text-slate-600">
						<strong class="text-slate-800">{{ __("Turno sin ventas registradas.") }}</strong>
						{{ __("El monto esperado corresponde únicamente al fondo de apertura menos gastos de caja.") }}
					</p>
				</div>

				<!-- VENDOR NOTICE (when !canCheckout) -->
				<div
					v-if="isInEntryMode && !canCheckout"
					class="p-4 bg-white border border-slate-200 rounded-2xl text-start flex flex-col gap-3 shadow-2xs"
				>
					<div class="flex items-center gap-3 text-slate-900 font-bold text-sm">
						<div class="w-9 h-9 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl flex items-center justify-center">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<div>
							<h4>{{ __("Resumen de Cierre Comercial (Perfil Vendedor)") }}</h4>
							<p class="text-xs text-slate-500 font-normal mt-0.5">
								{{ __("Finalización de jornada comercial sin manejo de dinero ni arqueo de caja físico.") }}
							</p>
						</div>
					</div>
					<div class="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
						<div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
							<span class="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">
								{{ __("Total Operaciones") }}
							</span>
							<span class="text-base font-bold text-slate-900 tabular-nums">
								{{ closingData.sales_count || salesInvoiceCount }}
							</span>
						</div>
						<div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
							<span class="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">
								{{ __("Monto Total Preventas") }}
							</span>
							<span class="text-base font-bold text-slate-900 tabular-nums">
								{{ formatCurrency(closingData.grand_total) }}
							</span>
						</div>
					</div>
				</div>

				<!-- CASHIER RECONCILIATION -->
				<template v-else-if="canCheckout">
					<!-- HERO CARD: Physical Cash Reconciliation + Denomination Counter -->
					<div
						v-for="(payment, idx) in cashReconciliationRows"
						:key="`cash-${idx}`"
						class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs"
					>
						<div class="px-4 py-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
							<div class="flex items-center gap-3 text-start">
								<div class="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
									<FeatherIcon :name="getPaymentIcon(payment.mode_of_payment)" class="w-5 h-5" />
								</div>
								<div>
									<div class="flex items-center gap-2 flex-wrap">
										<h4 class="text-sm md:text-base font-bold text-slate-900">
											{{ __("Arqueo de Efectivo en Caja") }} ({{ __(payment.mode_of_payment) }})
										</h4>
										<MdxBadge
											v-if="shouldShowSummary"
											:variant="getPaymentBadgeVariant(payment)"
											size="sm"
										>
											{{ getPaymentStatusText(payment) }}
										</MdxBadge>
									</div>
									<p class="text-xs text-slate-500 mt-0.5">
										{{ reconciliationMessage }}
									</p>
								</div>
							</div>

							<div class="flex items-center gap-2 ms-auto">
								<div class="text-end">
									<label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
										{{ __("Efectivo Real Contado *") }}
									</label>
									<input
										:value="payment.closing_amount ?? ''"
										@input="(e) => onManualClosingInput(payment, e.target.value)"
										type="number"
										step="0.01"
										min="0"
										placeholder="0.00"
										:disabled="showSuccessReport || submitResource.loading"
										:aria-label="__('Ingrese el efectivo real contado')"
										class="w-44 h-10 px-3 text-base md:text-lg text-end font-extrabold bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-500 transition-all tabular-nums"
									/>
								</div>
							</div>
						</div>

						<div class="p-4 flex flex-col gap-4">
							<!-- 4-Column Accounting Formula Strip (only when expected figures are visible) -->
							<div
								v-if="shouldShowSummary"
								class="grid grid-cols-2 lg:grid-cols-4 gap-2.5 bg-slate-50 border border-slate-200 rounded-xl p-3 text-start"
							>
								<div class="px-2 py-1">
									<span class="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
										{{ __("Fondo Apertura") }}
									</span>
									<span class="text-sm md:text-base font-bold text-slate-900 tabular-nums">
										{{ formatCurrency(payment.opening_amount) }}
									</span>
								</div>
								<div class="px-2 py-1 lg:border-s lg:border-slate-200">
									<span class="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
										+ {{ __("Cobros Efectivo") }}
									</span>
									<span class="text-sm md:text-base font-bold text-slate-900 tabular-nums">
										{{ formatCurrency(getGrossCashSales(payment)) }}
									</span>
								</div>
								<div class="px-2 py-1 lg:border-s lg:border-slate-200">
									<span class="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
										- {{ __("Gastos de Caja") }}
									</span>
									<span class="text-sm md:text-base font-bold text-slate-700 tabular-nums">
										{{ formatCurrency(totalShiftExpenses) }}
									</span>
								</div>
								<div class="px-3 py-1.5 rounded-lg bg-white border border-slate-200">
									<span class="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
										= {{ __("Esperado Neto") }}
									</span>
									<span class="text-sm md:text-base font-extrabold text-slate-900 tabular-nums">
										{{ formatCurrency(payment.expected_amount) }}
									</span>
								</div>
							</div>

							<!-- Denomination Counter -->
							<CashDenominationCounter
								v-model="closingData.closing_denominations"
								v-model:exchange-rate="closingData.usd_exchange_rate"
								:disabled="showSuccessReport || submitResource.loading"
								@total-change="(val) => onCashDenominationTotal(payment, val)"
							/>

							<!-- Difference Callout when non-zero -->
							<div
								v-if="
									shouldShowSummary &&
									payment._touched &&
									payment.closing_amount !== null &&
									payment.closing_amount !== undefined &&
									payment.closing_amount !== '' &&
									payment.difference !== 0
								"
								:class="[
									'flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border text-start',
									payment.difference > 0
										? 'bg-slate-50 border-slate-300'
										: 'bg-red-50/70 border-red-200',
								]"
							>
								<div>
									<span
										:class="[
											'text-xs font-bold block',
											payment.difference > 0 ? 'text-slate-900' : 'text-red-900',
										]"
									>
										{{ payment.difference > 0 ? __("Sobrante en Efectivo") : __("Faltante en Efectivo") }}
									</span>
									<span class="text-[11px] text-slate-600">
										<template v-if="autoPostCashDifferences">
											{{
												payment.difference > 0
													? __("El conteo físico supera al efectivo neto esperado. Al cerrar el turno se contabilizará automáticamente como ingreso contra Caja.")
													: __("Revise el conteo por cortes o gastos menores. Si mantiene la diferencia al cerrar, se contabilizará automáticamente como gasto contra Caja.")
											}}
										</template>
										<template v-else>
											{{
												payment.difference > 0
													? __("El conteo físico supera al efectivo neto esperado.")
													: __("Revise el conteo por cortes o gastos menores de caja.")
											}}
										</template>
									</span>
								</div>
								<span
									:class="[
										'text-base font-extrabold tabular-nums shrink-0',
										payment.difference > 0 ? 'text-blue-700' : 'text-red-700',
									]"
								>
									{{ payment.difference > 0 ? "+" : "" }}{{ formatCurrency(payment.difference) }}
								</span>
							</div>
						</div>
					</div>

					<!-- COMPACT CARD: Non-Cash / Bank & Digital Methods -->
					<div
						v-if="nonCashReconciliationRows.length > 0"
						class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs"
					>
						<div class="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
							<div class="text-start">
								<h4 class="text-sm font-bold text-slate-900">
									{{ __("Medios Digitales y Bancarios (QR / Transferencias)") }}
								</h4>
								<p class="text-xs text-slate-500">
									{{ __("Verifique el monto recibido en bancos o medios electrónicos.") }}
								</p>
							</div>
							<MdxButton
								v-if="shouldShowSummary && !showSuccessReport"
								variant="secondary"
								size="sm"
								:disabled="submitResource.loading"
								@click="matchAllNonCashExpected"
							>
								{{ __("Igualar Todos al Esperado") }}
							</MdxButton>
						</div>

						<div class="divide-y divide-slate-100">
							<div
								v-for="(payment, idx) in nonCashReconciliationRows"
								:key="`noncash-${idx}`"
								class="px-4 py-3 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
							>
								<div class="flex items-center gap-3 min-w-[180px] flex-1 text-start">
									<div class="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
										<FeatherIcon :name="getPaymentIcon(payment.mode_of_payment)" class="w-4 h-4" />
									</div>
									<div class="min-w-0">
										<div class="flex items-center gap-2 flex-wrap">
											<span class="text-sm font-semibold text-slate-900">
												{{ __(payment.mode_of_payment) }}
											</span>
											<MdxBadge
												v-if="shouldShowSummary"
												:variant="getPaymentBadgeVariant(payment)"
												size="sm"
											>
												{{ getPaymentStatusText(payment) }}
											</MdxBadge>
										</div>
										<div v-if="shouldShowSummary" class="text-xs text-slate-500 mt-0.5 tabular-nums">
											{{ __("Esperado:") }} <strong class="text-slate-700">{{ formatCurrency(payment.expected_amount) }}</strong>
											<span v-if="Number(payment.opening_amount || 0) > 0" class="ms-2">
												({{ __("Apertura:") }} {{ formatCurrency(payment.opening_amount) }})
											</span>
										</div>
									</div>
								</div>

								<div class="flex items-center gap-2 ms-auto">
									<button
										v-if="shouldShowSummary && !showSuccessReport"
										type="button"
										:disabled="submitResource.loading"
										@click="matchExpectedAmount(payment)"
										class="px-2.5 h-9 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
										:title="__('Copiar monto esperado')"
									>
										{{ __("Igualar") }}
									</button>
									<input
										:value="payment.closing_amount ?? ''"
										@input="(e) => onManualClosingInput(payment, e.target.value)"
										type="number"
										step="0.01"
										min="0"
										placeholder="0.00"
										:disabled="showSuccessReport || submitResource.loading"
										:aria-label="__('Enter actual amount for {0}', [payment.mode_of_payment])"
										class="w-36 md:w-40 h-9 px-3 text-sm text-end font-bold bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-500 tabular-nums"
									/>
								</div>
							</div>
						</div>
					</div>
				</template>

				<!-- Gastos Menores / Salidas de Efectivo del Turno + Observaciones -->
				<div
					v-if="canCheckout"
					class="bg-white border border-slate-200 rounded-2xl shadow-2xs p-4 flex flex-col gap-3.5"
				>
					<div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
						<div class="text-start">
							<div class="flex items-center gap-2">
								<h3 class="text-sm font-bold text-slate-900">
									{{ __("Gastos Menores y Salidas de Efectivo") }}
								</h3>
								<MdxBadge v-if="totalShiftExpenses > 0" variant="neutral" size="sm">
									-{{ formatCurrency(totalShiftExpenses) }}
								</MdxBadge>
							</div>
							<p class="text-xs text-slate-500 mt-0.5">
								{{ __("Registre almuerzos, pasajes, agua o entregas a rendir pagadas con efectivo de caja.") }}
							</p>
						</div>
						<MdxButton
							v-if="!showSuccessReport"
							variant="secondary"
							size="sm"
							:disabled="submitResource.loading"
							@click="addShiftExpense"
						>
							{{ __("Agregar Gasto de Caja") }}
						</MdxButton>
					</div>

					<div
						v-if="!closingData.shift_expenses || closingData.shift_expenses.length === 0"
						class="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500 text-start"
					>
						{{ __("Sin gastos menores registrados en este turno. Si retiró efectivo de caja, haga clic en \"Agregar Gasto de Caja\".") }}
					</div>

					<div v-else class="flex flex-col gap-2">
						<!-- Desktop Column Labels -->
						<div class="hidden md:grid md:grid-cols-12 gap-2 px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-start">
							<div class="md:col-span-3">{{ __("Categoría") }}</div>
							<div class="md:col-span-2">{{ __("Respaldo Fiscal") }}</div>
							<div class="md:col-span-2">{{ __("N° Factura / Recibo") }}</div>
							<div class="md:col-span-3">{{ __("Concepto / Detalle") }}</div>
							<div class="md:col-span-2 text-end pe-8">{{ __("Monto Bs.") }}</div>
						</div>

						<div
							v-for="(exp, expIdx) in closingData.shift_expenses"
							:key="`exp-${expIdx}`"
							class="grid grid-cols-1 md:grid-cols-12 gap-2 items-center bg-slate-50 border border-slate-200 rounded-xl p-2.5"
						>
							<div class="md:col-span-3">
								<MdxSelect
									v-model="exp.category"
									:options="expenseCategoryOptions"
									:searchable="false"
									size="sm"
									:teleport="true"
									:disabled="showSuccessReport || submitResource.loading"
								/>
							</div>
							<div class="md:col-span-2">
								<MdxSelect
									v-model="exp.receipt_type"
									:options="expenseReceiptOptions"
									:searchable="false"
									size="sm"
									:teleport="true"
									:disabled="showSuccessReport || submitResource.loading"
								/>
							</div>
							<div class="md:col-span-2">
								<input
									v-model="exp.invoice_no"
									type="text"
									:disabled="showSuccessReport || submitResource.loading"
									:placeholder="exp.receipt_type === 'Con Factura' ? __('N° Factura') : __('N° Recibo (opc.)')"
									class="w-full h-9 px-2.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-500"
								/>
							</div>
							<div class="md:col-span-3">
								<input
									v-model="exp.description"
									type="text"
									:disabled="showSuccessReport || submitResource.loading"
									:placeholder="__('Detalle (ej. Almuerzo / Agua)')"
									class="w-full h-9 px-2.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-500"
								/>
							</div>
							<div class="md:col-span-2 flex items-center gap-1.5">
								<input
									v-model.number="exp.amount"
									@input="recalculateCashAfterExpenses"
									type="number"
									min="0"
									step="0.50"
									placeholder="0.00"
									:disabled="showSuccessReport || submitResource.loading"
									class="w-full h-9 px-2.5 text-xs text-end font-bold bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-500 tabular-nums"
								/>
								<button
									v-if="!showSuccessReport"
									type="button"
									@click="removeShiftExpense(expIdx)"
									:disabled="submitResource.loading"
									class="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
									:title="__('Quitar gasto')"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
									</svg>
								</button>
							</div>
						</div>

						<div class="flex items-center justify-end gap-3 px-3 pt-1 text-xs text-slate-600">
							<span>{{ __("Subtotal Gastos de Caja:") }}</span>
							<strong class="text-sm text-slate-900 tabular-nums">{{ formatCurrency(totalShiftExpenses) }}</strong>
						</div>
					</div>

					<!-- Observaciones del Cierre -->
					<div class="text-start pt-1">
						<label class="block text-xs font-bold text-slate-700 mb-1.5">
							{{ __("Observaciones del Cierre (Opcional)") }}
						</label>
						<textarea
							v-model="closingData.closing_observations"
							rows="2"
							:disabled="showSuccessReport || submitResource.loading"
							:placeholder="__('Notas o aclaraciones del turno para administración...')"
							class="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-500"
						></textarea>
					</div>
				</div>

				<!-- Collapsible Invoice Details -->
				<div
					v-if="shouldShowSummary && invoiceCount > 0"
					class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs"
				>
					<button
						type="button"
						@click="showInvoiceDetails = !showInvoiceDetails"
						:aria-expanded="showInvoiceDetails"
						class="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
					>
						<div class="text-start">
							<h3 class="text-sm font-bold text-slate-900">
								{{ __("Detalle de Comprobantes del Turno") }}
							</h3>
							<p class="text-xs text-slate-500 tabular-nums">
								{{ __("{0} transacciones · {1}", [invoiceCount, formatCurrency(closingData.grand_total)]) }}
							</p>
						</div>
						<div class="flex items-center gap-2 text-xs font-semibold text-slate-600">
							<span>{{ showInvoiceDetails ? __("Ocultar") : __("Ver detalle") }}</span>
							<svg
								:class="['h-4 w-4 text-slate-400 transition-transform', showInvoiceDetails ? 'rotate-180' : '']"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
							</svg>
						</div>
					</button>

					<div v-show="showInvoiceDetails" class="border-t border-slate-200">
						<!-- Mobile Card View -->
						<div class="md:hidden divide-y divide-slate-200">
							<div
								v-for="(invoice, idx) in closingData.pos_transactions"
								:key="idx"
								class="p-3 bg-white"
							>
								<div class="flex justify-between items-start mb-1">
									<div class="flex items-center gap-2">
										<span class="text-xs font-semibold text-slate-900 tabular-nums">
											{{ invoice.pos_invoice || invoice.sales_invoice || __("N/A") }}
										</span>
										<MdxBadge :variant="invoice.is_return ? 'danger' : 'success'" size="sm">
											{{ invoice.is_return ? __("Devolución") : __("Venta") }}
										</MdxBadge>
									</div>
									<span class="text-sm font-bold text-slate-900 tabular-nums">
										{{ formatCurrency(invoice.grand_total) }}
									</span>
								</div>
								<div class="flex justify-between items-center text-xs text-slate-500">
									<span class="truncate">{{ invoice.customer }}</span>
									<span class="tabular-nums">{{ formatTime(invoice.posting_date) }}</span>
								</div>
							</div>
						</div>

						<!-- Desktop Table View -->
						<div class="hidden md:block overflow-x-auto max-h-64 overflow-y-auto">
							<table class="min-w-full divide-y divide-slate-200">
								<thead class="bg-slate-50 sticky top-0">
									<tr>
										<th class="px-4 py-2.5 text-start text-[11px] font-bold text-slate-500 uppercase">{{ __("Comprobante") }}</th>
										<th class="px-4 py-2.5 text-start text-[11px] font-bold text-slate-500 uppercase">{{ __("Tipo") }}</th>
										<th class="px-4 py-2.5 text-start text-[11px] font-bold text-slate-500 uppercase">{{ __("Cliente") }}</th>
										<th class="px-4 py-2.5 text-start text-[11px] font-bold text-slate-500 uppercase">{{ __("Hora") }}</th>
										<th class="px-4 py-2.5 text-end text-[11px] font-bold text-slate-500 uppercase">{{ __("Monto") }}</th>
									</tr>
								</thead>
								<tbody class="bg-white divide-y divide-slate-100">
									<tr
										v-for="(invoice, idx) in closingData.pos_transactions"
										:key="idx"
										class="hover:bg-slate-50/70"
									>
										<td class="text-start px-4 py-2.5 whitespace-nowrap text-xs font-semibold text-slate-900 tabular-nums">
											{{ invoice.pos_invoice || invoice.sales_invoice || __("N/A") }}
										</td>
										<td class="text-start px-4 py-2.5 whitespace-nowrap">
											<MdxBadge :variant="invoice.is_return ? 'danger' : 'success'" size="sm">
												{{ invoice.is_return ? __("Devolución") : __("Venta") }}
											</MdxBadge>
										</td>
										<td class="text-start px-4 py-2.5 whitespace-nowrap text-xs text-slate-700">
											{{ invoice.customer }}
										</td>
										<td class="text-start px-4 py-2.5 whitespace-nowrap text-xs text-slate-500 tabular-nums">
											{{ formatTime(invoice.posting_date) }}
										</td>
										<td class="text-end px-4 py-2.5 whitespace-nowrap text-xs font-bold text-slate-900 tabular-nums">
											{{ formatCurrency(invoice.grand_total) }}
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</div>

				<!-- Collapsible Tax Summary -->
				<div
					v-if="shouldShowSummary && closingData.taxes && closingData.taxes.length > 0"
					class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs"
				>
					<div class="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
						<h3 class="text-sm font-bold text-slate-900">
							{{ __("Resumen de Impuestos") }}
						</h3>
						<span class="text-sm font-bold text-slate-900 tabular-nums">
							{{ formatCurrency(totalTax) }}
						</span>
					</div>
					<div class="px-4 py-2.5 divide-y divide-slate-100">
						<div
							v-for="(tax, idx) in closingData.taxes"
							:key="idx"
							class="flex items-center justify-between py-2 text-xs"
						>
							<span class="font-medium text-slate-700">{{ tax.account_head }} ({{ formatQuantity(tax.rate) }}%)</span>
							<span class="font-bold text-slate-900 tabular-nums">{{ formatCurrency(tax.amount) }}</span>
						</div>
					</div>
				</div>

				<!-- Error Display -->
				<div
					v-if="submitResource.error || (errorMessage && !closingDataResource.error)"
					class="rounded-xl bg-red-50 border border-red-200 p-3.5 text-start"
				>
					<div class="flex gap-2.5">
						<svg class="h-5 w-5 text-red-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
								clip-rule="evenodd"
							/>
						</svg>
						<div class="flex-1">
							<h4 class="text-xs md:text-sm font-bold text-red-900">
								{{ __("Error al cerrar turno") }}
							</h4>
							<p class="text-xs md:text-sm text-red-700 mt-0.5">
								{{ errorMessage || submitResource.error }}
							</p>
							<button
								v-if="errorMessage"
								type="button"
								@click="errorMessage = ''"
								class="mt-1.5 text-xs font-semibold text-red-700 hover:text-red-900 underline cursor-pointer"
							>
								{{ __("Cerrar aviso") }}
							</button>
						</div>
					</div>
				</div>
			</div>

			<!-- Error State -->
			<div
				v-else-if="closingDataResource.error || errorMessage"
				class="rounded-xl bg-red-50 border border-red-200 p-4 text-start"
			>
				<div class="flex gap-3">
					<svg class="h-5 w-5 text-red-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
							clip-rule="evenodd"
						/>
					</svg>
					<div>
						<h3 class="text-sm font-bold text-red-900">
							{{ __("Failed to Load Shift Data") }}
						</h3>
						<p class="text-xs md:text-sm text-red-700 mt-1">
							{{ errorMessage || closingDataResource.error }}
						</p>
					</div>
				</div>
			</div>
		</div>

		<template #footer-left>
			<MdxButton
				variant="secondary"
				@click="closeDialog"
				:disabled="submitResource.loading"
			>
				{{ showSuccessReport ? __("Close") : __("Cancel") }}
			</MdxButton>
		</template>

		<template #footer>
			<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
				<div
					v-if="!canSubmit && closingData && !showSuccessReport"
					class="text-xs text-amber-700 font-semibold text-center sm:text-end"
				>
					{{ __("Falta registrar monto real en: {0}", [missingPaymentModes.join(", ")]) }}
				</div>

				<div
					v-if="showSuccessReport"
					class="text-xs md:text-sm text-emerald-700 font-semibold text-center sm:text-end inline-flex items-center justify-center gap-1.5"
				>
					<svg class="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
					</svg>
					<span>{{ __("Turno cerrado correctamente") }}</span>
				</div>

				<div
					v-if="eodPrintFailed"
					class="text-xs text-amber-700 font-medium text-center sm:text-end"
				>
					{{ __("EOD report pending print") }}
				</div>

				<MdxButton
					v-if="!showSuccessReport"
					variant="primary"
					@click="handleCloseShiftClick"
					:loading="submitResource.loading"
					:disabled="!canSubmit"
				>
					{{
						submitResource.loading
							? __("Closing Shift...")
							: !canCheckout
								? __("Finalizar Jornada de Ventas")
								: __("Close Shift")
					}}
				</MdxButton>

				<MdxButton
					v-if="showSuccessReport && closedShiftName"
					variant="secondary"
					@click="handleLetterClosingPrint"
					:loading="letterPrintLoading"
				>
					{{ __("Hoja de Cierre (Carta PDF)") }}
				</MdxButton>

				<MdxButton
					v-if="showSuccessReport && closedShiftName"
					variant="primary"
					@click="handleManualEodPrint"
					:loading="retryPrintLoading"
				>
					{{ __("Print EOD Report") }}
				</MdxButton>
			</div>
		</template>

		<!-- Confirmation Warning Modal when Cash Difference exists -->
		<MdxModal
			v-model="showDifferenceWarningModal"
			:title="__('Aviso de Diferencia en Arqueo de Caja')"
			:subtitle="closingData ? cleanProfileName(closingData.pos_profile) : ''"
			size="md"
			:persistent="submitResource.loading"
		>
			<template #header-icon>
				<svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
				</svg>
			</template>

			<div class="flex flex-col gap-4 text-start">
				<div
					:class="[
						'rounded-xl border p-3.5',
						cashDifferenceAmount < 0 ? 'bg-red-50/70 border-red-200' : 'bg-amber-50 border-amber-200',
					]"
				>
					<p :class="['text-xs md:text-sm font-bold', cashDifferenceAmount < 0 ? 'text-red-900' : 'text-amber-900']">
						{{
							cashDifferenceAmount < 0
								? __("Se detectó un Faltante de Efectivo en el cierre de turno.")
								: __("Se detectó un Sobrante de Efectivo en el cierre de turno.")
						}}
					</p>
					<p class="text-xs text-slate-700 mt-1 leading-relaxed">
						<template v-if="autoPostCashDifferences">
							{{
								cashDifferenceAmount < 0
									? __("Al confirmar el cierre, el sistema generará automáticamente un asiento contable contra Caja llevando el faltante directamente a cuenta de Gasto. Si hubo un error al contar o registrar gastos menores, vuelva atrás para corregirlo.")
									: __("Al confirmar el cierre, el sistema generará automáticamente un asiento contable contra Caja registrando el sobrante en cuenta de Ingreso. Si hubo un error en el conteo, vuelva atrás para corregirlo.")
							}}
						</template>
						<template v-else>
							{{
								__("El turno se cerrará registrando esta diferencia en el arqueo. Si hubo un error en el conteo o falta registrar un gasto menor, vuelva atrás para corregirlo.")
							}}
						</template>
					</p>
				</div>

				<div class="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col gap-2 text-xs md:text-sm">
					<div class="flex items-center justify-between text-slate-600">
						<span>{{ __("Efectivo Esperado Neto") }}</span>
						<span class="font-semibold text-slate-900 tabular-nums">{{ formatCurrency(expectedCashTotal) }}</span>
					</div>
					<div class="flex items-center justify-between text-slate-600">
						<span>{{ __("Efectivo Real Contado") }}</span>
						<span class="font-semibold text-slate-900 tabular-nums">{{ formatCurrency(countedCashTotal) }}</span>
					</div>
					<div class="pt-2 border-t border-slate-200 flex items-center justify-between">
						<span class="font-bold text-slate-900">
							{{ cashDifferenceAmount < 0 ? __("Faltante en Caja") : __("Sobrante en Caja") }}
						</span>
						<span
							:class="[
								'text-base font-extrabold tabular-nums',
								cashDifferenceAmount < 0 ? 'text-red-700' : 'text-blue-700',
							]"
						>
							{{ cashDifferenceAmount > 0 ? "+" : "" }}{{ formatCurrency(cashDifferenceAmount) }}
						</span>
					</div>
				</div>
			</div>

			<template #footer-left>
				<MdxButton
					variant="secondary"
					@click="showDifferenceWarningModal = false"
					:disabled="submitResource.loading"
				>
					{{ __("Revisar Conteo") }}
				</MdxButton>
			</template>

			<template #footer>
				<MdxButton
					variant="primary"
					@click="confirmAndSubmitClosing"
					:loading="submitResource.loading"
				>
					{{ autoPostCashDifferences ? __("Confirmar y Contabilizar Cierre") : __("Confirmar Cierre") }}
				</MdxButton>
			</template>
		</MdxModal>
	</MdxModal>
</template>

<script setup>
import { FeatherIcon } from "frappe-ui";
import { MdxModal, MdxButton, MdxLoadingSpinner, MdxSelect, MdxBadge } from "mdx_ui";
import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useShift, shiftState } from "../composables/useShift";
import { useFormatters } from "../composables/useFormatters";
import { useToast } from "../composables/useToast";
import { usePOSSettingsStore } from "../stores/posSettings";
import { usePOSShiftStore } from "../stores/posShift";
import { printEODReport, printLetterClosingSheet } from "../utils/printEod";
import { qzConnected } from "../utils/qzTray";
import CashDenominationCounter from "./common/CashDenominationCounter.vue";
import { useBootstrapStore } from "../stores/bootstrap";

const bootstrapStore = useBootstrapStore();
const canCheckout = computed(() => bootstrapStore.canCheckout());

const props = defineProps({
	modelValue: {
		type: Boolean,
		required: true,
	},
	openingShift: {
		type: String,
		required: true,
		validator: (value) => value && value.length > 0,
	},
});

const emit = defineEmits(["update:modelValue", "shift-closed"]);

const open = computed({
	get: () => props.modelValue,
	set: (value) => emit("update:modelValue", value),
});

const { getClosingShiftData, submitClosingShift } = useShift();
const { formatCurrency, formatQuantity, formatDateTime, formatTime } = useFormatters();

function cleanProfileName(name) {
	return name ? String(name).replace(/\s*-\s*[A-Z0-9]{2,5}$/, "").trim() : "";
}
const { showSuccess, showWarning } = useToast();
const posSettingsStore = usePOSSettingsStore();
const { hideExpectedAmount, autoPostCashDifferences } = storeToRefs(posSettingsStore);

const shiftStore = usePOSShiftStore();

const closingData = ref(null);
const closingDataResource = getClosingShiftData;
const submitResource = submitClosingShift;
const showInvoiceDetails = ref(false);
const showSuccessReport = ref(false); // Track if shift is closed and showing report
const showDifferenceWarningModal = ref(false);
const closedDifferenceJournalEntry = ref("");
const closedExpenseJournalEntry = ref("");
const closedDifferenceAmount = ref(0);
const errorMessage = ref(""); // User-friendly error message
const eodPrintFailed = ref(null);
const closedShiftName = ref(null);
const retryPrintLoading = ref(false);
const letterPrintLoading = ref(false);
const showIdleWarning = ref(false);
let _idleWarningTimer = null;

const expenseCategoryOptions = [
	{ value: "Alimentación y refrigerio", label: "Alimentación y refrigerio" },
	{ value: "Pasajes y transporte", label: "Pasajes y transporte" },
	{ value: "Agua, limpieza e insumos", label: "Agua, limpieza e insumos" },
	{ value: "Fletes y carguío", label: "Fletes y carguío" },
	{ value: "Combustible", label: "Combustible" },
	{ value: "Entrega a rendir", label: "Entrega a rendir" },
	{ value: "Otros gastos", label: "Otros gastos" },
];

const expenseReceiptOptions = [
	{ value: "Sin Factura", label: "Sin Factura" },
	{ value: "Con Factura", label: "Con Factura" },
];

const totalShiftExpenses = computed(() => {
	const rows = closingData.value?.shift_expenses || [];
	return Math.round(rows.reduce((sum, r) => sum + (Number.parseFloat(r.amount) || 0), 0) * 100) / 100;
});

function isCashMethod(modeName) {
	if (!modeName) return false;
	const cashMode = closingData.value?.cash_mode_of_payment;
	if (cashMode && modeName === cashMode) return true;
	const lower = String(modeName).toLowerCase();
	return lower.includes("cash") || lower.includes("efectivo");
}

const cashReconciliationRows = computed(() =>
	(closingData.value?.payment_reconciliation || []).filter((p) => isCashMethod(p.mode_of_payment))
);

const nonCashReconciliationRows = computed(() =>
	(closingData.value?.payment_reconciliation || []).filter((p) => !isCashMethod(p.mode_of_payment))
);

const expectedCashTotal = computed(() =>
	Math.round(
		cashReconciliationRows.value.reduce((sum, p) => sum + (Number.parseFloat(p.expected_amount) || 0), 0) * 100
	) / 100
);

const countedCashTotal = computed(() =>
	Math.round(
		cashReconciliationRows.value.reduce((sum, p) => sum + (Number.parseFloat(p.closing_amount) || 0), 0) * 100
	) / 100
);

const cashDifferenceAmount = computed(() =>
	Math.round(
		cashReconciliationRows.value.reduce((sum, p) => sum + (Number.parseFloat(p.difference) || 0), 0) * 100
	) / 100
);

const hasCashDifference = computed(() => Math.abs(cashDifferenceAmount.value) >= 0.01);

function hasClosingInput(payment) {
	return (
		payment?._touched &&
		payment.closing_amount !== null &&
		payment.closing_amount !== undefined &&
		String(payment.closing_amount).trim() !== ""
	);
}

function getPaymentBadgeVariant(payment) {
	if (!hasClosingInput(payment)) return "warning";
	if (payment.difference === 0) return "success";
	return payment.difference > 0 ? "info" : "danger";
}

function getPaymentStatusText(payment) {
	if (!hasClosingInput(payment)) return __("Pendiente");
	if (payment.difference === 0) return __("Cuadrado");
	if (payment.difference > 0) return __("Sobrante {0}", [formatCurrency(payment.difference)]);
	return __("Faltante {0}", [formatCurrency(Math.abs(payment.difference))]);
}

function getGrossCashSales(payment) {
	const gross = Number.parseFloat(payment.gross_expected_amount ?? payment.expected_amount) || 0;
	const opening = Number.parseFloat(payment.opening_amount) || 0;
	return Math.round((gross - opening) * 100) / 100;
}

function matchExpectedAmount(payment) {
	if (!payment || showSuccessReport.value || submitResource.loading) return;
	const expected = Math.round((Number.parseFloat(payment.expected_amount) || 0) * 100) / 100;
	updateClosingAmount(payment, expected.toFixed(2));
}

function matchAllNonCashExpected() {
	for (const payment of nonCashReconciliationRows.value) {
		matchExpectedAmount(payment);
	}
}

function recalculateCashAfterExpenses() {
	if (!closingData.value?.payment_reconciliation) return;
	const totalExp = totalShiftExpenses.value;
	closingData.value.total_shift_expenses = totalExp;
	for (const payment of closingData.value.payment_reconciliation) {
		if (isCashMethod(payment.mode_of_payment)) {
			const gross = Number.parseFloat(payment.gross_expected_amount ?? payment.expected_amount) || 0;
			payment.expected_amount = Math.round((gross - totalExp) * 100) / 100;
			calculateDifference(payment);
		}
	}
}

function addShiftExpense() {
	if (!closingData.value) return;
	if (!Array.isArray(closingData.value.shift_expenses)) {
		closingData.value.shift_expenses = [];
	}
	closingData.value.shift_expenses.push(
		reactive({
			category: "Alimentación y refrigerio",
			receipt_type: "Sin Factura",
			invoice_no: "",
			description: "",
			amount: null,
		})
	);
}

function removeShiftExpense(idx) {
	if (!closingData.value?.shift_expenses) return;
	closingData.value.shift_expenses.splice(idx, 1);
	recalculateCashAfterExpenses();
}

function onCashDenominationTotal(payment, totalBob) {
	updateClosingAmount(payment, totalBob > 0 ? totalBob : 0);
}

function onManualClosingInput(payment, rawVal) {
	updateClosingAmount(payment, rawVal);
	if (isCashMethod(payment.mode_of_payment) && closingData.value?.closing_denominations?.length > 0) {
		closingData.value.closing_denominations = [];
	}
}

// Computed properties for real-time recalculation (defined before immediate watcher)
const invoiceCount = computed(() => {
	if (!closingData.value) return 0;
	const transactions = closingData.value.pos_transactions || [];
	return transactions.length;
});

// Watch dialog open state
watch(open, async (isOpen) => {
	if (isOpen && props.openingShift) {
		// Pause the shift duration counter in the header
		shiftStore.shiftTimerPaused = true;
		showIdleWarning.value = false;

		// Warn user if dialog stays open for more than 1 minute
		_idleWarningTimer = setTimeout(() => {
			showIdleWarning.value = true;
		}, 60_000);

		// Refresh POS settings to get latest hideExpectedAmount value
		await posSettingsStore.reloadSettings();
		loadClosingData();
	} else {
		// Resume the shift duration counter
		shiftStore.shiftTimerPaused = false;
		showIdleWarning.value = false;
		if (_idleWarningTimer) {
			clearTimeout(_idleWarningTimer);
			_idleWarningTimer = null;
		}
		eodPrintFailed.value = null;
		closedShiftName.value = null;
		showDifferenceWarningModal.value = false;
		closedDifferenceJournalEntry.value = "";
		closedExpenseJournalEntry.value = "";
		closedDifferenceAmount.value = 0;
		if (showSuccessReport.value) {
			showSuccessReport.value = false;
			closingData.value = null;
			showInvoiceDetails.value = false;
			errorMessage.value = "";
			emit("shift-closed");
		}
	}
}, { immediate: true });

onBeforeUnmount(() => {
	shiftStore.shiftTimerPaused = false;
	if (_idleWarningTimer) {
		clearTimeout(_idleWarningTimer);
		_idleWarningTimer = null;
	}
});

async function loadClosingData() {
	try {
		errorMessage.value = ""; // Clear any previous errors

		const data = await closingDataResource.submit({
			opening_shift: props.openingShift,
		});

		// Make payment_reconciliation reactive
		if (data.payment_reconciliation) {
			data.payment_reconciliation = data.payment_reconciliation.map((payment) => {
				const expectedVal = Number.parseFloat(payment.expected_amount) || 0;
				const openingVal = Number.parseFloat(payment.opening_amount) || 0;
				const autoZeroReady = !hideExpectedAmount.value && expectedVal === 0 && openingVal === 0;

				return reactive({
					...payment,
					gross_expected_amount: expectedVal,
					closing_amount: autoZeroReady ? 0 : null,
					difference: 0,
					_touched: autoZeroReady,
				});
			});

			// Calculate initial differences
			data.payment_reconciliation.forEach((payment) => {
				calculateDifference(payment);
			});
		}

		data.usd_exchange_rate = Number.parseFloat(data.usd_exchange_rate) || 6.96;
		data.closing_denominations = Array.isArray(data.closing_denominations) ? data.closing_denominations : [];
		data.shift_expenses = Array.isArray(data.shift_expenses) ? data.shift_expenses : [];
		data.closing_observations = data.closing_observations || "";
		data.total_shift_expenses = Number.parseFloat(data.total_shift_expenses) || 0;

		closingData.value = data;
	} catch (error) {
		console.error("Error loading closing data:", error);
		errorMessage.value =
			"Unable to load shift data. Please check your connection and try again.";
	}
}

function calculateDifference(payment) {
	if (
		payment.closing_amount === null ||
		payment.closing_amount === undefined ||
		String(payment.closing_amount).trim() === ""
	) {
		payment.difference = 0;
		return;
	}
	const closing = Number.parseFloat(payment.closing_amount) || 0;
	const expected = Number.parseFloat(payment.expected_amount) || 0;
	payment.difference = Math.round((closing - expected) * 100) / 100;
}

// New function to handle closing amount updates with proper reactivity
function updateClosingAmount(payment, value) {
	const trimmed = value === null || value === undefined ? "" : String(value).trim();
	payment.closing_amount = trimmed === "" ? null : value;
	payment._touched = trimmed !== "";
	calculateDifference(payment);
}

const missingPaymentModes = computed(() => {
	if (!closingData.value || !closingData.value.payment_reconciliation) return [];
	if (!canCheckout.value) return [];

	return closingData.value.payment_reconciliation
		.filter(
			(payment) =>
				!payment._touched ||
				payment.closing_amount === null ||
				payment.closing_amount === undefined ||
				String(payment.closing_amount).trim() === "" ||
				Number.isNaN(Number(payment.closing_amount))
		)
		.map((payment) => __(payment.mode_of_payment));
});

const canSubmit = computed(() => {
	if (!closingData.value || !closingData.value.payment_reconciliation) return false;
	if (!canCheckout.value) return true; // Vendor role: shift closing is always ready to submit

	return missingPaymentModes.value.length === 0;
});

function validateAndNormalizeShiftExpenses() {
	if (!closingData.value) return null;
	const cleanedExpenses = [];
	for (const exp of closingData.value.shift_expenses || []) {
		const desc = String(exp.description || "").trim();
		const amt = Number.parseFloat(exp.amount) || 0;
		if (!desc && amt <= 0) {
			continue;
		}
		if (amt > 0 && !desc) {
			errorMessage.value = __("Ingrese el detalle/concepto para cada gasto de caja registrado.");
			return null;
		}
		if (desc && amt <= 0) {
			errorMessage.value = __("Ingrese un monto mayor a cero para el gasto: {0}", [desc]);
			return null;
		}
		cleanedExpenses.push({
			category: exp.category || "Otros gastos",
			receipt_type: exp.receipt_type || "Sin Factura",
			invoice_no: String(exp.invoice_no || "").trim(),
			description: desc,
			amount: Math.round(amt * 100) / 100,
		});
	}
	return cleanedExpenses;
}

function handleCloseShiftClick() {
	if (!closingData.value) return;
	const cleanedExpenses = validateAndNormalizeShiftExpenses();
	if (!cleanedExpenses) return;
	closingData.value.shift_expenses = cleanedExpenses;
	recalculateCashAfterExpenses();
	if (closingData.value.payment_reconciliation) {
		closingData.value.payment_reconciliation.forEach((payment) => {
			calculateDifference(payment);
		});
	}

	if (canCheckout.value && hasCashDifference.value) {
		showDifferenceWarningModal.value = true;
		return;
	}
	submitClosing();
}

function confirmAndSubmitClosing() {
	showDifferenceWarningModal.value = false;
	submitClosing();
}

async function submitClosing() {
	if (!closingData.value) return;

	// Validate petty-cash expense rows and strip completely empty ones
	const cleanedExpenses = validateAndNormalizeShiftExpenses();
	if (!cleanedExpenses) return;
	closingData.value.shift_expenses = cleanedExpenses;
	recalculateCashAfterExpenses();

	try {
		errorMessage.value = ""; // Clear any previous errors

		// Ensure all differences are calculated
		if (closingData.value.payment_reconciliation) {
			closingData.value.payment_reconciliation.forEach((payment) => {
				calculateDifference(payment);
			});
		}

		// Submit to server
		const result = await submitResource.submit({ closing_shift: closingData.value });
		const payload = result ?? submitResource.data ?? {};
		const closingShiftName = payload?.name ?? submitResource.data?.name;
		closedDifferenceJournalEntry.value = payload?.difference_journal_entry || "";
		closedExpenseJournalEntry.value = payload?.expense_journal_entry || "";
		closedDifferenceAmount.value =
			Number.parseFloat(payload?.cash_difference_amount ?? cashDifferenceAmount.value) || 0;
		const successToast = closedDifferenceJournalEntry.value
			? __("Turno cerrado. Diferencia contabilizada automáticamente en el asiento {0}.", [
					closedDifferenceJournalEntry.value,
				])
			: __("Shift closed successfully");

		if (closingShiftName) {
			closedShiftName.value = closingShiftName;
			if (qzConnected.value || posSettingsStore.silentPrint) {
				try {
					await printEODReport(closingShiftName, { manual: false });
					eodPrintFailed.value = null;
				} catch (err) {
					showWarning(__("EOD report did not print. Use the Reprint button to retry."));
					if (closedDifferenceJournalEntry.value) {
						showSuccess(successToast);
					}
					eodPrintFailed.value = { closingShiftName };
					showSuccessReport.value = true;
					return;
				}
			} else {
				eodPrintFailed.value = null;
				showSuccess(successToast);
				showSuccessReport.value = true;
				return;
			}
		}

		showSuccess(successToast);
		showSuccessReport.value = true;
		if (invoiceCount.value > 0 && invoiceCount.value <= 10) {
			showInvoiceDetails.value = true;
		}
	} catch (error) {
		const rawServerMsg = Array.isArray(error?.messages) && error.messages.length ? error.messages[0] : "";
		const cleanServerMsg = rawServerMsg ? String(rawServerMsg).replace(/<[^>]*>/g, "").trim() : "";
		errorMessage.value =
			cleanServerMsg || __("No se pudo cerrar el turno. Verifique los montos e intente nuevamente.");
	}
}

async function handleLetterClosingPrint() {
	const targetName = closedShiftName.value || eodPrintFailed.value?.closingShiftName;
	if (!targetName) return;

	letterPrintLoading.value = true;
	try {
		await printLetterClosingSheet(targetName);
	} catch (err) {
		showWarning(err?.message || __("No se pudo abrir la hoja de cierre en tamaño carta."));
	} finally {
		letterPrintLoading.value = false;
	}
}

async function handleManualEodPrint() {
	const targetName = closedShiftName.value || eodPrintFailed.value?.closingShiftName;
	if (!targetName) return;

	retryPrintLoading.value = true;
	try {
		await printEODReport(targetName, { manual: true });
		eodPrintFailed.value = null;
		showSuccess(__("EOD report printed successfully"));
	} catch (err) {
		console.warn("[eod] manual print failed", err);
		showWarning(__("EOD report did not print. Please check QZ Tray and retry."));
	} finally {
		retryPrintLoading.value = false;
	}
}

function closeDialog() {
	// Emit shift-closed event if we're closing from success report
	if (showSuccessReport.value) {
		showSuccessReport.value = false;
		emit("shift-closed");
	}

	open.value = false;
	showDifferenceWarningModal.value = false;
	closedDifferenceJournalEntry.value = "";
	closedExpenseJournalEntry.value = "";
	closedDifferenceAmount.value = 0;
	closingData.value = null;
	showInvoiceDetails.value = false;
	errorMessage.value = ""; // Clear error messages
	eodPrintFailed.value = null;
	closedShiftName.value = null;
}

// UI State Computed Properties
const shouldShowSummary = computed(() => !hideExpectedAmount.value || showSuccessReport.value);

const isInEntryMode = computed(() => hideExpectedAmount.value && !showSuccessReport.value);

const reconciliationMessage = computed(() => {
	if (isInEntryMode.value) {
		return __("Enter the actual counted amounts for each payment method");
	}

	if (showSuccessReport.value && hideExpectedAmount.value) {
		return __("Shift closed successfully - Review the final reconciliation below");
	}
	return __("Count your cash and enter actual amounts below");

});

// Check if there are any return invoices
const hasReturns = computed(() => {
	if (!closingData.value) return false;
	return (closingData.value.returns_count || 0) > 0;
});

// Count of sales invoices (non-returns)
const salesInvoiceCount = computed(() => {
	if (!closingData.value) return 0;
	const transactions = closingData.value.pos_transactions || [];
	return transactions.filter((t) => !t.is_return).length;
});

const totalTax = computed(() => {
	if (!closingData.value || !closingData.value.taxes) return 0;
	return closingData.value.taxes.reduce(
		(sum, tax) => sum + Number.parseFloat(tax.amount || 0),
		0
	);
});

const grossSales = computed(() => {
	if (!closingData.value) return 0;
	return closingData.value.sales_total ?? closingData.value.grand_total ?? 0;
});
const getTotalExpected = computed(() => {
	if (!closingData.value || !closingData.value.payment_reconciliation) return 0;
	return closingData.value.payment_reconciliation.reduce(
		(sum, payment) => sum + Number.parseFloat(payment.expected_amount || 0),
		0
	);
});

const getTotalActual = computed(() => {
	if (!closingData.value || !closingData.value.payment_reconciliation) return 0;
	return closingData.value.payment_reconciliation.reduce(
		(sum, payment) => sum + Number.parseFloat(payment.closing_amount || 0),
		0
	);
});

const getTotalDifference = computed(() => {
	return getTotalActual.value - getTotalExpected.value;
});

function getSalesForPayment(payment) {
	return (
		Number.parseFloat(payment.expected_amount || 0) -
		Number.parseFloat(payment.opening_amount || 0)
	);
}

function getShiftDuration() {
	if (!closingData.value || !closingData.value.period_start_date) return __("N/A");

	// Use the same timezone-safe approach as the header timer
	const { _initialElapsedMs, _receivedAt } = shiftState.value;
	const diff = _initialElapsedMs + (Date.now() - (_receivedAt || Date.now()));
	if (diff < 0) return __("N/A");

	const days = Math.floor(diff / (1000 * 60 * 60 * 24));
	const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
	const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

	if (days > 0) {
		const dayLabel = days === 1 ? __("Day") : __("Days");
		return __("{0} {1} {2}h {3}m", [days, dayLabel, hours, minutes]);
	}
	if (hours > 0) {
		return __("{0}h {1}m", [hours, minutes]);
	}
	return __("{0}m", [minutes]);
}

function getPaymentIcon(method) {
	const methodLower = (method || "").toLowerCase();

	if (methodLower.includes("cash") || methodLower.includes("efectivo")) {
		return "dollar-sign";
	} else if (
		methodLower.includes("card") ||
		methodLower.includes("credit") ||
		methodLower.includes("debit") ||
		methodLower.includes("tarjeta")
	) {
		return "credit-card";
	} else if (
		methodLower.includes("mobile") ||
		methodLower.includes("wallet") ||
		methodLower.includes("upi") ||
		methodLower.includes("phone") ||
		methodLower.includes("qr")
	) {
		return "smartphone";
	} else if (
		methodLower.includes("bank") ||
		methodLower.includes("transfer") ||
		methodLower.includes("banco")
	) {
		return "briefcase";
	} else {
		return "file-text";
	}
}
</script>
