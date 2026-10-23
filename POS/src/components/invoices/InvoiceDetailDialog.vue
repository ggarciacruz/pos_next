<template>
	<Dialog v-model="show" :options="{ title: __('Invoice Details'), size: '5xl' }">
		<template #body-content>
			<div v-if="loading" class="text-center py-12">
				<div
					class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"
				></div>
				<p class="mt-3 text-sm text-gray-500">{{ __("Loading invoice details...") }}</p>
			</div>

			<div
				v-else-if="invoiceData"
				class="flex flex-col gap-4 max-h-[calc(100vh-17rem)] sm:max-h-[calc(100vh-15rem)] overflow-y-auto px-1 pe-2 -me-2"
			>
				<!-- Invoice Header -->
				<div
					class="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-3.5 sm:p-4 border border-indigo-100"
				>
					<div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
						<div class="flex-1">
							<div class="flex items-center gap-3 mb-2 flex-wrap">
								<h3 class="text-lg md:text-xl font-bold text-gray-900">
									{{ invoiceData.name }}
								</h3>
								<span
									v-if="invoiceData.is_return"
									class="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800"
								>
									{{ __("Return Invoice") }}
								</span>
								<span
									v-else
									:class="[
										'px-3 py-1 text-xs font-semibold rounded-full',
										getInvoiceStatusColor(invoiceData),
									]"
								>
									{{ __(invoiceData.status) }}
								</span>
							</div>
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
								<div class="text-start">
									<span class="text-gray-600">{{ __("Customer:") }}</span>
									<span class="ms-2 font-semibold text-gray-900">{{
										invoiceData.customer_name || invoiceData.customer
									}}</span>
								</div>
								<div class="text-start">
									<span class="text-gray-600">{{ __("Date:") }}</span>
									<span class="ms-2 font-medium text-gray-900"
										>{{ formatDate(invoiceData.posting_date) }}
										{{ formatTime(invoiceData.posting_time) }}</span
									>
								</div>
								<div v-if="invoiceData.return_against" class="text-start">
									<span class="text-gray-600">{{ __("Return Against:") }}</span>
									<span class="ms-2 font-medium text-gray-900">{{
										invoiceData.return_against
									}}</span>
								</div>
							</div>
						</div>
						<div class="text-start sm:text-end">
							<div class="text-xs text-gray-500 mb-1">{{ __("Grand Total") }}</div>
							<div class="text-xl md:text-2xl font-bold text-indigo-600">
								{{ formatCurrency(invoiceData.grand_total) }}
							</div>
						</div>
					</div>
				</div>

				<!-- Return Type Notice: Added to Customer Credit (no payments, negative outstanding) -->
				<div
					v-if="invoiceData.is_return && isAddedToCustomerCredit"
					class="bg-gradient-to-r rtl:bg-gradient-to-l from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200"
				>
					<div class="flex items-start gap-3">
						<div
							class="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0"
						>
							<svg
								class="w-4 h-4 text-blue-700"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
								/>
							</svg>
						</div>
						<div class="text-start flex-1">
							<h4 class="text-sm font-semibold text-blue-900">
								{{ __("Added to Customer Credit") }}
							</h4>
							<p class="text-xs text-blue-700 mt-1">
								{{
									__(
										"The return amount was added to the customer credit balance. No cash refund was given."
									)
								}}
							</p>
						</div>
					</div>
				</div>

				<!-- Return Type Notice: Cash Refund (has payments) -->
				<div
					v-else-if="invoiceData.is_return && isCashRefund"
					class="bg-gradient-to-r rtl:bg-gradient-to-l from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200"
				>
					<div class="flex items-start gap-3">
						<div
							class="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center flex-shrink-0"
						>
							<svg
								class="w-4 h-4 text-green-700"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
								/>
							</svg>
						</div>
						<div class="text-start flex-1">
							<h4 class="text-sm font-semibold text-green-900">
								{{ __("Cash Refund") }}
							</h4>
							<p class="text-xs text-green-700 mt-1">
								{{ __("The customer received a cash refund for this return.") }}
							</p>
						</div>
					</div>
				</div>

				<!-- Pay on Account Notice (for original credit sales) -->
				<div
					v-else-if="!invoiceData.is_return && isCreditSale"
					class="bg-gradient-to-r rtl:bg-gradient-to-l from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200"
				>
					<div class="flex items-start gap-3">
						<div
							class="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0"
						>
							<svg
								class="w-4 h-4 text-amber-700"
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
						<div class="text-start flex-1">
							<h4 class="text-sm font-semibold text-amber-900">
								{{ __("Pay on Account") }}
							</h4>
							<p class="text-xs text-amber-700 mt-1">
								{{
									__(
										"This invoice was sold on credit. The customer owes the full amount."
									)
								}}
							</p>
						</div>
					</div>
				</div>

				<!-- Items Section -->
				<div>
					<h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center">
						<svg
							class="w-4 h-4 me-2"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 6h16M4 12h16M4 18h16"
							/>
						</svg>
						{{ __("Items") }}
					</h4>
					<!-- Mobile Cards View -->
					<div class="md:hidden flex flex-col gap-3">
						<div
							v-for="(item, idx) in invoiceData.items"
							:key="idx"
							class="bg-white border border-gray-200 rounded-lg p-3"
						>
							<!-- Item Name & Amount Row -->
							<div class="flex items-center justify-between gap-3 mb-2">
								<div class="flex-1 min-w-0 text-center">
									<div class="text-sm font-semibold text-gray-900">
										{{ item.item_name || item.item_code }}{{ (item.custom_medida || item.medida) ? ' (' + (item.custom_medida || item.medida) + ')' : '' }}
									</div>
								</div>
							</div>
							<!-- Details Grid -->
							<div
								class="grid grid-cols-3 gap-2 text-center border-t border-gray-100 pt-2"
							>
								<div>
									<div class="text-xs text-gray-500">{{ __("Qty") }}</div>
									<div class="text-sm font-medium text-gray-900">
										{{ item.quantity }}
									</div>
								</div>
								<div>
									<div class="text-xs text-gray-500">{{ __("Rate") }}</div>
									<div class="text-sm font-medium text-gray-900">
										{{ formatCurrency(item.rate) }}
									</div>
								</div>
								<div>
									<div class="text-xs text-gray-500">{{ __("Amount") }}</div>
									<div class="text-sm font-semibold text-gray-900">
										{{ formatCurrency(item.amount) }}
									</div>
								</div>
							</div>
							<!-- Discount Row (if applicable) -->
							<div
								v-if="item.discount_percentage"
								class="text-center text-xs text-orange-600 mt-2 pt-2 border-t border-gray-100"
							>
								{{ __("Discount:") }} {{ item.discount_percentage }}%
							</div>
						</div>
					</div>
					<!-- Desktop Table View -->
					<div class="hidden md:block border border-gray-200 rounded-lg overflow-hidden">
						<table class="min-w-full divide-y divide-gray-200">
							<thead class="bg-gray-50">
								<tr>
									<th
										class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider"
									>
										{{ __("Item") }}
									</th>
									<th
										class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider"
									>
										{{ __("Qty") }}
									</th>
									<th
										class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider"
									>
										{{ __("Rate") }}
									</th>
									<th
										class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider"
									>
										{{ __("Discount") }}
									</th>
									<th
										class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider"
									>
										{{ __("Amount") }}
									</th>
								</tr>
							</thead>
							<tbody class="bg-white divide-y divide-gray-200">
								<tr
									v-for="(item, idx) in invoiceData.items"
									:key="idx"
									class="hover:bg-gray-50"
								>
									<td class="px-4 py-3 text-center">
										<div class="text-sm font-medium text-gray-900">
											{{ item.item_name || item.item_code }}{{ (item.custom_medida || item.medida) ? ' (' + (item.custom_medida || item.medida) + ')' : '' }}
										</div>
									</td>
									<td class="px-4 py-3 text-center text-sm text-gray-900">
										{{ item.quantity }}
									</td>
									<td class="px-4 py-3 text-center text-sm text-gray-900">
										{{ formatCurrency(item.rate) }}
									</td>
									<td class="px-4 py-3 text-center text-sm text-gray-600">
										{{
											item.discount_percentage
												? `${item.discount_percentage}%`
												: "-"
										}}
									</td>
									<td
										class="px-4 py-3 text-center text-sm font-semibold text-gray-900"
									>
										{{ formatCurrency(item.amount) }}
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>

				<!-- Totals Section -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
					<!-- Payment Info -->
					<div v-if="invoiceData.payments && invoiceData.payments.length > 0">
						<h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center">
							<svg
								class="w-4 h-4 me-2"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
								/>
							</svg>
							{{ __("Payments") }}
						</h4>
						<div class="flex flex-col gap-2">
							<div
								v-for="(payment, idx) in invoiceData.payments"
								:key="idx"
								class="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded-lg"
							>
								<div class="text-start">
									<div class="text-sm font-medium text-gray-900">
										{{ payment.mode_of_payment }}
									</div>
									<div v-if="payment.account" class="text-xs text-gray-500">
										{{ payment.account }}
									</div>
								</div>
								<div class="text-sm font-semibold text-green-700">
									{{ formatCurrency(payment.amount) }}
								</div>
							</div>
						</div>
					</div>

					<!-- Summary -->
					<div>
						<h4 class="text-sm font-semibold text-gray-700 mb-3 text-start">
							{{ __("Summary") }}
						</h4>
						<div
							class="flex flex-col gap-2 bg-gray-50 p-4 rounded-lg border border-gray-200"
						>
							<div class="flex justify-between text-sm">
								<span class="text-gray-600">{{ __("Net Total:") }}</span>
								<span class="font-medium text-gray-900">{{
									formatCurrency(invoiceData.net_total || invoiceData.total)
								}}</span>
							</div>
							<div
								v-if="invoiceData.total_taxes_and_charges"
								class="flex justify-between text-sm"
							>
								<span class="text-gray-600">{{ __("Taxes:") }}</span>
								<span class="font-medium text-gray-900">{{
									formatCurrency(invoiceData.total_taxes_and_charges)
								}}</span>
							</div>
							<div
								v-if="invoiceData.discount_amount"
								class="flex justify-between text-sm"
							>
								<span class="text-gray-600">{{ __("Discount:") }}</span>
								<span class="font-medium text-red-600"
									>-{{ formatCurrency(invoiceData.discount_amount) }}</span
								>
							</div>
							<div class="pt-2 border-t border-gray-300 flex justify-between">
								<span class="font-semibold text-gray-900">{{
									__("Grand Total:")
								}}</span>
								<span class="font-bold text-lg text-indigo-600">{{
									formatCurrency(invoiceData.grand_total)
								}}</span>
							</div>
							<div
								v-if="invoiceData.paid_amount"
								class="flex justify-between text-sm"
							>
								<span class="text-gray-600">{{ __("Paid Amount:") }}</span>
								<span class="font-semibold text-green-600">{{
									formatCurrency(invoiceData.paid_amount)
								}}</span>
							</div>
							<!-- For return invoices with negative outstanding (credit to customer) -->
							<div
								v-if="invoiceData.is_return && invoiceData.outstanding_amount < 0"
								class="flex justify-between text-sm"
							>
								<span class="text-gray-600">{{ __("Customer Credit:") }}</span>
								<span class="font-semibold text-blue-600">{{
									formatCurrency(Math.abs(invoiceData.outstanding_amount))
								}}</span>
							</div>
							<!-- For regular invoices with outstanding (customer owes) -->
							<div
								v-else-if="
									invoiceData.outstanding_amount &&
									invoiceData.outstanding_amount > 0
								"
								class="flex justify-between text-sm"
							>
								<span class="text-gray-600">{{ __("Outstanding:") }}</span>
								<span class="font-semibold text-orange-600">{{
									formatCurrency(invoiceData.outstanding_amount)
								}}</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Additional Info -->
				<div
					v-if="invoiceData.remarks"
					class="bg-gray-50 p-4 rounded-lg border border-gray-200"
				>
					<h4 class="text-sm font-semibold text-gray-700 mb-2 text-start">
						{{ __("Remarks") }}
					</h4>
					<p class="text-sm text-gray-600 text-start">{{ invoiceData.remarks }}</p>
				</div>

				<!-- Cancel Invoice Confirmation Panel -->
				<div
					v-if="showCancelConfirm && canCancelCurrentInvoice"
					class="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col gap-3 text-start"
				>
					<div class="flex items-start gap-3">
						<div class="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
							</svg>
						</div>
						<div class="flex-1">
							<h4 class="text-sm font-bold text-red-900">
								{{ __("¿Confirmas anular la nota {0}?", [invoiceData.name]) }}
							</h4>
							<p class="text-xs text-red-700 mt-1">
								{{ __("Esta acción dejará la nota en estado Cancelado, anulará los cobros/anticipos asociados y reingresará los muebles al stock del almacén.") }}
							</p>
						</div>
					</div>
					<div>
						<label class="block text-xs font-semibold text-red-900 mb-1">
							{{ __("Motivo de anulación (opcional)") }}
						</label>
						<input
							v-model="cancelReason"
							type="text"
							:placeholder="__('Ej: Error en digitación de productos o cliente...')"
							class="w-full px-3 py-2 text-xs bg-white border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-800"
							@keyup.enter="confirmCancelInvoice"
						/>
					</div>
					<div class="flex items-center justify-end gap-2">
						<button
							type="button"
							:disabled="cancellingInvoice"
							@click="showCancelConfirm = false"
							class="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
						>
							{{ __("No, volver") }}
						</button>
						<button
							type="button"
							:disabled="cancellingInvoice"
							@click="confirmCancelInvoice"
							class="px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
						>
							<svg v-if="cancellingInvoice" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
							</svg>
							<span>{{ cancellingInvoice ? __("Anulando...") : __("Sí, Anular Venta") }}</span>
						</button>
					</div>
				</div>
			</div>

			<div v-else class="text-center py-12">
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
						d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<p class="mt-2 text-sm text-gray-500">
					{{ __("Failed to load invoice details") }}
				</p>
			</div>
		</template>
		<template #actions>
			<div
				class="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-4 w-full"
			>
				<div class="flex items-center gap-2">
					<Button variant="subtle" @click="show = false">
						{{ __("Close") }}
					</Button>
					<button
						v-if="canCancelCurrentInvoice && !showCancelConfirm"
						type="button"
						@click="showCancelConfirm = true"
						class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
					>
						<svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
						</svg>
						<span>{{ __("Anular Venta") }}</span>
					</button>
				</div>
				<div class="flex flex-wrap sm:flex-nowrap gap-2 justify-end">
					<Button variant="outline" @click="handlePrint">
						<template #prefix>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
								/>
							</svg>
						</template>
						{{ __("Print Ticket (Thermal)") }}
					</Button>
					<Button variant="solid" theme="blue" @click="handlePrintPDF">
						{{ __("Print PDF (Letter Size)") }}
					</Button>
					<button
						v-if="posSettingsStore.enableWhatsappSend"
						type="button"
						@click="handleWhatsApp"
						class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-xs cursor-pointer"
						style="background-color: #16a34a; color: #ffffff;"
					>
						<svg class="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 24 24">
							<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
						</svg>
						<span>{{ __("Enviar por WhatsApp") }}</span>
					</button>
				</div>
			</div>
		</template>
	</Dialog>
</template>

<script setup>
import { useFormatters } from "@/composables/useFormatters";
import { useToast } from "@/composables/useToast";
import { DEFAULT_CURRENCY, formatCurrency as formatCurrencyUtil } from "@/utils/currency";
import { getInvoiceStatusColor } from "@/utils/invoice";
import { logger } from "@/utils/logger";
import { hydrateLocalOnlyInvoice, isLocalOnlyInvoiceName } from "@/utils/printInvoice";
import { isOffline } from "@/utils/offline/offlineState";
import { Button, Dialog, call } from "frappe-ui";
import { db } from "@/utils/offline/db";
import { usePOSSettingsStore } from "@/stores/posSettings";
import { ref, watch, nextTick, computed } from "vue";

const log = logger.create("InvoiceDetailDialog");
const { formatDate, formatTime } = useFormatters();
const { showSuccess, showError } = useToast();
const posSettingsStore = usePOSSettingsStore();

const props = defineProps({
	modelValue: Boolean,
	invoiceName: String,
	posProfile: String,
	currency: {
		type: String,
		default: DEFAULT_CURRENCY,
	},
});

function formatCurrency(amount) {
	return formatCurrencyUtil(Number.parseFloat(amount || 0), props.currency);
}

const emit = defineEmits(["update:modelValue", "print-invoice", "whatsapp-invoice", "invoice-cancelled"]);

const show = ref(props.modelValue);
const loading = ref(false);
const invoiceData = ref(null);
const showCancelConfirm = ref(false);
const cancelReason = ref("");
const cancellingInvoice = ref(false);

const canCancelCurrentInvoice = computed(() => {
	if (!posSettingsStore.canCancelInvoice || !invoiceData.value) return false;
	if (isOffline()) return false;
	if (Number(invoiceData.value.docstatus) !== 1) return false;
	if (invoiceData.value.status === "Cancelled" || invoiceData.value.status === "Cancelado") return false;
	if (isLocalOnlyInvoiceName(invoiceData.value.name)) return false;
	return true;
});

// Computed: Check if this is a credit sale (Pay on Account - no payments, full outstanding)
const isCreditSale = computed(() => {
	if (!invoiceData.value) return false;
	const hasNoPayments = !invoiceData.value.payments || invoiceData.value.payments.length === 0;
	const totalPaid =
		invoiceData.value.payments?.reduce((sum, p) => sum + Math.abs(p.amount || 0), 0) || 0;
	const grandTotal = Math.abs(invoiceData.value.grand_total || 0);
	const outstanding = Math.abs(invoiceData.value.outstanding_amount || 0);
	// Credit sale if no payments and outstanding equals grand total
	return hasNoPayments || (totalPaid < 0.01 && Math.abs(outstanding - grandTotal) < 0.01);
});

// Computed: Check if this return was added to customer credit (no payments, negative outstanding)
const isAddedToCustomerCredit = computed(() => {
	if (!invoiceData.value || !invoiceData.value.is_return) return false;
	const hasNoPayments = !invoiceData.value.payments || invoiceData.value.payments.length === 0;
	const totalPaid =
		invoiceData.value.payments?.reduce((sum, p) => sum + Math.abs(p.amount || 0), 0) || 0;
	const hasNegativeOutstanding = (invoiceData.value.outstanding_amount || 0) < 0;
	// Added to customer credit if no payments AND outstanding is negative
	return (hasNoPayments || totalPaid < 0.01) && hasNegativeOutstanding;
});

// Computed: Check if this return was a cash refund (has payments)
const isCashRefund = computed(() => {
	if (!invoiceData.value || !invoiceData.value.is_return) return false;
	const totalPaid =
		invoiceData.value.payments?.reduce((sum, p) => sum + Math.abs(p.amount || 0), 0) || 0;
	// Cash refund if payments were made (refund given)
	return totalPaid >= 0.01;
});

watch(
	() => props.modelValue,
	(val) => {
		show.value = val;
		if (val && props.invoiceName) {
			loadInvoiceDetails();
		}
	}
);

watch(show, async (val) => {
	emit("update:modelValue", val);
	if (!val) {
		// Clear data when closing
		invoiceData.value = null;
		showCancelConfirm.value = false;
		cancelReason.value = "";
	} else {
		// Ensure dialog appears above other dialogs
		await nextTick();
		const dialogs = document.querySelectorAll(".modal-container, .modal-backdrop");
		dialogs.forEach((dialog) => {
			const title = dialog.querySelector('[class*="title"]');
			if (title && title.textContent?.includes("Invoice Details")) {
				dialog.style.zIndex = "400";
			}
		});
	}
});

async function loadInvoiceDetails() {
	if (!props.invoiceName) return;

	loading.value = true;
	try {
		let result = null;
		if (isLocalOnlyInvoiceName(props.invoiceName)) {
			// Hydrate from sessionStorage first, fall back to IndexedDB so a
			// post-reload detail view still resolves offline receipts.
			const cached = await hydrateLocalOnlyInvoice({ name: props.invoiceName });
			if (cached?.items?.length > 0) {
				result = JSON.parse(JSON.stringify(cached));
				result.items = result.items.map((item) => ({
					...item,
					quantity: item.quantity ?? item.qty,
				}));
			}
		} else {
			result = await call("pos_next.api.invoices.get_invoice", {
				invoice_name: props.invoiceName,
			});

			// Map server 'qty' to 'quantity' for internal consistency
			if (result && result.items) {
				result.items = result.items.map((item) => ({
					...item,
					quantity: item.qty,
				}));
			}
		}

		if (result && result.items) {
			// Hydrate missing custom_medida from IndexedDB cache
			const promises = result.items.map(async (item) => {
				if (!item.custom_medida && item.item_code) {
					const cached = await db.items.get(item.item_code);
					if (cached && cached.custom_medida) {
						item.custom_medida = cached.custom_medida;
					}
				}
			});
			await Promise.all(promises);
			invoiceData.value = result;
		} else {
			invoiceData.value = null;
		}
	} catch (error) {
		log.error("Error loading invoice details:", error);
		invoiceData.value = null;
	} finally {
		loading.value = false;
	}
}

function handlePrint() {
	if (!invoiceData.value) return;
	emit("print-invoice", invoiceData.value);
}

function handlePrintPDF() {
	if (!invoiceData.value?.name) return;
	const url = `/printview?doctype=Sales%20Invoice&name=${encodeURIComponent(invoiceData.value.name)}&format=Nota%20de%20Venta%20Muebles%20Ruffino`;
	window.open(url, "_blank");
}

function handleWhatsApp() {
	if (!invoiceData.value) return;
	emit("whatsapp-invoice", invoiceData.value);
}

async function confirmCancelInvoice() {
	if (!invoiceData.value?.name || cancellingInvoice.value) return;
	cancellingInvoice.value = true;
	try {
		await call("pos_next.api.invoices.cancel_pos_invoice", {
			invoice_name: invoiceData.value.name,
			reason: cancelReason.value,
			pos_profile: props.posProfile,
		});
		showSuccess(
			__("Nota de venta {0} anulada correctamente. El stock fue reingresado al almacén.", [
				invoiceData.value.name,
			])
		);
		const cancelledName = invoiceData.value.name;
		showCancelConfirm.value = false;
		cancelReason.value = "";
		show.value = false;
		emit("invoice-cancelled", cancelledName);
	} catch (error) {
		log.error("Error cancelling invoice:", error);
		showError(error.message || __("No se pudo anular la nota de venta"));
	} finally {
		cancellingInvoice.value = false;
	}
}
</script>

<style scoped>
/* Custom scrollbar for invoice details body */
.overflow-y-auto::-webkit-scrollbar {
	width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
	background: #f8fafc;
	border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
	background: #cbd5e1;
	border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
	background: #94a3b8;
}
</style>

