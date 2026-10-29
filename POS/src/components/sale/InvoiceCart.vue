<!--
  InvoiceCart.vue - Shopping Cart Component for POS System

  ============================================================================
  OVERVIEW
  ============================================================================
  This component displays the shopping cart in the POS interface, including:
  - Customer selection/search with instant in-memory filtering
  - Cart items list with quantity controls, UOM selection, and pricing
  - Offers and coupon application buttons
  - Order totals (subtotal, discount, tax, grand total)
  - Checkout and Hold order actions
  - Quick action buttons when cart is empty

  ============================================================================
  COMPONENT STRUCTURE
  ============================================================================

  1. HEADER SECTION (Customer Selection)
     - Shows selected customer info with edit/remove options
     - Search input with instant filtering from cached customer list
     - Dropdown with search results and "Create New Customer" option
     - Works offline using cached customer data

  2. ACTION BUTTONS SECTION (Offers & Coupons)
     - "Offers" button - Shows available promotional offers
     - "Coupon" button - Apply coupon/gift card codes
     - Badge indicators show count of available/applied offers

  3. CART ITEMS SECTION
     - Scrollable list of cart items
     - Each item shows: thumbnail, name, badges (free/discount), price, quantity controls
     - Quantity controls: increment/decrement buttons + manual input
     - UOM (Unit of Measure) dropdown selector
     - Serial item support with edit dialog
     - Empty cart state with quick action buttons

  4. TOTALS SECTION
     - Total Quantity
     - Subtotal
     - Discount (highlighted when applied)
     - Tax
     - Grand Total (emphasized)

  5. ACTION BUTTONS
     - Checkout - Proceed to payment
     - Hold - Save as draft order

  ============================================================================
  FEATURES
  ============================================================================

  - Offline Support: Customer search works offline using cached data
  - Instant Search: In-memory customer filtering for zero-latency results
  - Smart Quantity Steps: Automatically detects decimal precision for +/- buttons
  - UOM Conversion: Change units with automatic price recalculation
  - Serial Number Support: Special handling for serialized inventory items
  - Responsive Design: Adapts to mobile and desktop layouts
  - Touch Optimized: Large tap targets and touch feedback
  - RTL Support: Fully supports right-to-left languages

  ============================================================================
-->
<template>
	<div ref="cartContainerRef" class="flex flex-col h-full bg-white relative overflow-hidden">
		<!-- Header with Customer -->
		<div class="px-2.5 py-2 border-b border-gray-200 bg-gray-50">
			<!-- Inline Customer Search/Selection -->
			<div ref="customerSearchContainer" class="relative">
				<div v-if="customer">
					<!-- Two Cards Layout: Customer Card + Document Type Card -->
					<div class="flex items-stretch gap-2">
						<!-- Customer Card -->
						<div
							class="flex-1 flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl p-1.5 shadow-sm min-w-0"
						>
							<!-- Customer Avatar & Info -->
							<div class="flex items-center gap-2 min-w-0 flex-1 px-1.5 py-1">
								<div
									class="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0"
								>
									<svg
										class="w-4 h-4 text-white"
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
								</div>
								<div class="min-w-0 flex-1">
									<p
										class="text-xs font-semibold text-gray-900 truncate leading-tight"
									>
										{{ customer.customer_name || customer.name }}
									</p>
									<p
										v-if="customer.mobile_no"
										class="text-[10px] text-gray-500 truncate leading-tight"
									>
										{{ customer.mobile_no }}
									</p>
								</div>
							</div>

							<!-- Action Buttons -->
							<div class="flex items-center gap-0.5 flex-shrink-0" @click.stop>
								<button
									type="button"
									@click.stop="$emit('edit-customer', customer)"
									class="w-7 h-7 flex items-center justify-center text-blue-500 hover:bg-blue-50 active:bg-blue-100 rounded-lg transition-colors touch-manipulation"
									:title="__('Edit customer details')"
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
											d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
										/>
									</svg>
								</button>
								<button
									type="button"
									@click.stop="$emit('create-customer', '')"
									class="w-7 h-7 flex items-center justify-center text-green-600 hover:bg-green-50 active:bg-green-100 rounded-lg transition-colors touch-manipulation"
									:title="__('Create new customer')"
								>
									<svg
										class="w-4 h-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										stroke-width="2.5"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M12 4v16m8-8H4"
										/>
									</svg>
								</button>
								<button
									type="button"
									@click.stop="removeCustomer"
									class="w-7 h-7 flex items-center justify-center text-red-500 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors touch-manipulation"
									:title="__('Remove customer')"
								>
									<svg
										class="w-4 h-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										stroke-width="2.5"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								</button>
							</div>
						</div>

						<!-- Document Type Card -->
						<div
							v-if="settingsStore.allowSalesOrder"
							class="flex items-center bg-white border border-gray-200 rounded-xl p-1.5 shadow-sm flex-shrink-0"
						>
							<div class="flex items-center bg-gray-100 rounded-lg p-0.5">
								<button
									type="button"
									@click="selectDocType('Sales Invoice')"
									class="px-2.5 py-1.5 text-[11px] font-semibold rounded-md transition-all duration-200 flex items-center gap-1"
									:class="
										cartStore.targetDoctype === 'Sales Invoice'
											? 'bg-white text-blue-600 shadow-sm'
											: 'text-gray-500 hover:text-gray-700'
									"
									:title="__('Sales Invoice')"
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
											d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
										/>
									</svg>
									<span>{{ __("Invoice") }}</span>
								</button>
								<button
									type="button"
									@click="selectDocType('Sales Order')"
									class="px-2.5 py-1.5 text-[11px] font-semibold rounded-md transition-all duration-200 flex items-center gap-1"
									:class="
										cartStore.targetDoctype === 'Sales Order'
											? 'bg-white text-orange-600 shadow-sm'
											: 'text-gray-500 hover:text-gray-700'
									"
									:title="__('Sales Order')"
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
											d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
										/>
									</svg>
									<span>{{ __("Order") }}</span>
								</button>
							</div>
						</div>
					</div>
				</div>
				<div v-else>
					<div class="flex gap-1.5">
						<!-- Search Input -->
						<div class="relative flex-1">
							<!-- Search Icon Prefix -->
							<div
								class="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none"
							>
								<svg
									v-if="customersLoaded"
									class="w-4 h-4 text-gray-400"
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
								<div
									v-else
									class="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-blue-500"
								></div>
							</div>

							<!-- Native Input for Instant Search -->
							<input
								id="cart-customer-search"
								name="cart-customer-search"
								:value="customerSearch"
								@input="handleSearchInput"
								@focus="handleSearchFocus"
								@blur="handleSearchBlur"
								type="text"
								:placeholder="__('Search or add customer...')"
								class="w-full h-10 ps-9 pe-3 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-shadow"
								:disabled="!customersLoaded"
								@keydown="handleKeydown"
								autocomplete="off"
								:aria-label="__('Search customer in cart')"
							/>
						</div>

						<!-- Quick Create Customer Button -->
						<button
							type="button"
							@click="createNewCustomer"
							class="flex items-center justify-center w-10 h-10 bg-green-500 hover:bg-green-600 active:bg-green-700 rounded-xl text-white transition-colors shadow-sm hover:shadow touch-manipulation flex-shrink-0"
							:title="__('Create new customer')"
							:aria-label="__('Create new customer')"
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
									d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
								/>
							</svg>
						</button>

						<!-- Document Type Toggle (Sales Invoice / Sales Order) -->
						<div
							v-if="settingsStore.allowSalesOrder"
							class="flex items-center bg-gray-100 rounded-xl p-0.5 h-10"
						>
							<button
								type="button"
								@click="selectDocType('Sales Invoice')"
								class="h-full px-2.5 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5"
								:class="
									cartStore.targetDoctype === 'Sales Invoice'
										? 'bg-white text-blue-600 shadow-sm'
										: 'text-gray-500 hover:text-gray-700'
								"
								:title="__('Sales Invoice')"
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
										d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
									/>
								</svg>
								<span class="hidden sm:inline">{{ __("Invoice") }}</span>
							</button>
							<button
								type="button"
								@click="selectDocType('Sales Order')"
								class="h-full px-2.5 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5"
								:class="
									cartStore.targetDoctype === 'Sales Order'
										? 'bg-white text-orange-600 shadow-sm'
										: 'text-gray-500 hover:text-gray-700'
								"
								:title="__('Sales Order')"
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
										d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
									/>
								</svg>
								<span class="hidden sm:inline">{{ __("Order") }}</span>
							</button>
						</div>
					</div>
				</div>

				<!-- Customer Dropdown -->
				<div
					v-if="customerSearchFocused || customerSearch.trim().length >= 1"
					class="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl flex flex-col max-h-[calc(100vh-140px)] overflow-hidden will-change-transform"
				>
					<!-- Customers Header -->
					<div
						v-if="customerResults.length > 0"
						class="px-3 py-1.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between flex-shrink-0"
					>
						<span
							class="text-[10px] font-semibold text-gray-500 uppercase tracking-wide"
						>
							{{
								customerSearch.trim().length > 0
									? __("Resultados de búsqueda")
									: __("Clientes")
							}}
						</span>
						<span class="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
							{{ customerResults.length }}
						</span>
					</div>

					<!-- Customer Results -->
					<div
						v-if="customerResults.length > 0"
						class="flex-1 max-h-[calc(100vh-200px)] overflow-y-auto overscroll-contain"
					>
						<button
							type="button"
							v-for="(cust, index) in customerResults"
							:key="cust.name"
							@mousedown.prevent="selectCustomer(cust)"
							:class="[
								'w-full text-start px-3 py-2 flex items-center border-b border-gray-100 last:border-0 touch-manipulation select-none cursor-pointer active:bg-blue-200',
								index === selectedIndex
									? 'bg-blue-100'
									: 'hover:bg-blue-50 active:bg-blue-100',
							]"
						>
							<div class="flex-1 min-w-0 pointer-events-none">
								<p class="text-xs font-semibold text-gray-900 truncate">
									{{ cust.customer_name }}
								</p>
								<p v-if="cust.mobile_no" class="text-[10px] text-gray-500">
									{{ cust.mobile_no }}
								</p>
							</div>
						</button>
					</div>

					<!-- No Results + Create New Option -->
					<div v-else-if="customerSearch.trim().length >= 1" class="flex-shrink-0">
						<div
							class="px-3 py-2 text-center text-[11px] font-medium text-gray-700 border-b border-gray-100"
						>
							{{ __('No results for "{0}"', [customerSearch]) }}
						</div>
					</div>

					<!-- Create New Customer Option -->
					<button
						type="button"
						v-if="customerSearch.trim().length >= 1"
						@mousedown.prevent="createNewCustomer"
						class="w-full text-start px-3 py-2 hover:bg-green-50 active:bg-green-100 flex items-center gap-2 border-t border-gray-200 touch-manipulation select-none cursor-pointer flex-shrink-0 bg-white"
					>
						<div
							class="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 pointer-events-none"
						>
							<svg
								class="w-3 h-3 text-green-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 4v16m8-8H4"
								/>
							</svg>
						</div>
						<div class="flex-1 pointer-events-none">
							<p class="text-[11px] font-medium text-green-700">
								{{ __("Create New Customer") }}
							</p>
							<p class="text-[9px] text-green-600">"{{ customerSearch }}"</p>
						</div>
					</button>
				</div>
			</div>
		</div>

		<!-- Active Pre-sale / Quotation Banner -->
		<div
			v-if="cartStore.currentDraftId"
			class="px-2.5 py-1.5 bg-yellow-50 border-b border-yellow-200 flex items-center justify-between flex-shrink-0 gap-2"
		>
			<div class="flex items-center gap-1.5 min-w-0 flex-1">
				<svg
					class="w-4 h-4 text-yellow-600 flex-shrink-0"
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
				<span class="text-xs font-semibold text-yellow-800 truncate">
					{{ isQuotationDraft ? __("Cotización activa") : __("Pre-venta activa") }}: {{ cartStore.currentDraftId }}
				</span>
			</div>
			<!-- Action buttons: Re-print Ticket, Re-print PDF, Unlink -->
			<div class="flex items-center gap-1 flex-shrink-0">
				<button
					type="button"
					@click="emit('print-active-ticket')"
					class="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-yellow-800 bg-yellow-100 hover:bg-yellow-200 rounded-md border border-yellow-300 transition-colors shadow-2xs"
					:title="__('Imprimir Ticket Térmico')"
				>
					<svg class="w-3.5 h-3.5 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
					</svg>
					<span>{{ __("Ticket") }}</span>
				</button>
				<button
					type="button"
					@click="emit('print-active-pdf')"
					class="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-2xs transition-colors"
					:title="__('Imprimir PDF Tamaño Carta')"
				>
					<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
					</svg>
					<span>{{ __("PDF Carta") }}</span>
				</button>
				<button
					v-if="settingsStore.enableWhatsappSend"
					type="button"
					@click="emit('whatsapp-active-draft')"
					class="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-2xs transition-colors"
					style="background-color: #16a34a; color: #ffffff;"
					:title="__('Enviar por WhatsApp')"
				>
					<svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
						<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
					</svg>
					<span>WhatsApp</span>
				</button>
				<button
					type="button"
					@click="clearActiveDraft"
					class="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 rounded-md p-1 transition-colors ms-0.5"
					:title="__('Desvincular documento')"
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
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
		</div>

		<!-- Main Cart Body: Unified High-Density Stream -->
		<div class="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-gray-50">
				<!-- Action Buttons Section -->
				<div v-if="items.length > 0" class="px-2.5 py-1 border-b border-gray-200 bg-white">
					<div class="flex items-center justify-between">
						<h2 class="text-xs font-bold text-gray-900">{{ __("Cart Items") }} <span class="text-gray-400 font-semibold text-[11px]">({{ items.length }})</span></h2>
				<div class="flex items-center gap-1">
					<!-- Clear Cart Button -->
					<button
						@click="$emit('clear-cart')"
						class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors touch-manipulation"
						type="button"
						:title="__('Clear all items')"
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
								d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V5a2 2 0 00-2-2h-2a2 2 0 00-2 2v2M4 7h16"
							/>
						</svg>
						<span>{{ __("Clear") }}</span>
					</button>
					<!-- Sort Dropdown -->
					<div class="relative" ref="cartSortContainer">
						<button
							@click="toggleCartSortDropdown"
							:class="[
								'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors touch-manipulation',
								cartSortBy
									? 'text-blue-600 hover:bg-blue-50'
									: 'text-gray-600 hover:bg-gray-50',
							]"
							:title="
								cartSortBy
									? cartSortOrder === 'asc'
										? __('Sorted by {0} A-Z', [getCartSortLabel()])
										: __('Sorted by {0} Z-A', [getCartSortLabel()])
									: __('Sort cart items')
							"
							:aria-label="__('Sort cart items')"
							type="button"
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
									d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
								/>
							</svg>
							<span>{{ __("Sort") }}</span>
						</button>

						<!-- Sort Dropdown Menu -->
						<div
							v-if="showCartSortDropdown"
							@click.stop
							class="absolute end-0 mt-1 w-52 bg-white rounded-lg shadow-xl border border-gray-200 z-[9999]"
						>
							<div class="py-2">
								<div
									class="px-3 py-2 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100"
								>
									{{ __("Sort Cart") }}
								</div>
								<div class="py-1">
									<!-- No Sorting (clear) -->
									<button
										@click="handleCartSortToggle(null)"
										:class="[
											'w-full px-3 py-2 text-sm transition-colors flex items-center justify-between group',
											!cartSortBy
												? 'bg-blue-50 text-blue-700'
												: 'text-gray-700 hover:bg-gray-50',
										]"
										type="button"
									>
										<span class="flex items-center gap-2.5">
											<svg
												class="w-4 h-4 text-gray-400 group-hover:text-gray-600"
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
											<span>{{ __("No Sorting") }}</span>
										</span>
									</button>

									<div class="h-px bg-gray-100 my-1"></div>

									<!-- Sort Options Loop -->
									<button
										v-for="option in CART_SORT_OPTIONS"
										:key="option.field"
										@click="handleCartSortToggle(option.field)"
										:class="[
											'w-full px-3 py-2 text-sm transition-colors flex items-center justify-between group',
											cartSortBy === option.field
												? 'bg-blue-50 text-blue-700'
												: 'text-gray-700 hover:bg-gray-50',
										]"
										type="button"
									>
										<span class="flex items-center gap-2.5">
											<svg
												class="w-4 h-4 text-gray-400 group-hover:text-gray-600"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													:d="option.icon"
												/>
											</svg>
											<span>{{ option.label }}</span>
										</span>
										<!-- Sort direction icon -->
										<svg
											class="w-5 h-5"
											:class="
												cartSortBy === option.field
													? 'text-blue-600'
													: 'text-gray-300'
											"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												:d="
													CART_SORT_ICONS[
														getCartSortIconState(option.field)
													]
												"
											/>
										</svg>
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Offers & Coupon Buttons -->
			<div v-if="showPromoButtons" class="flex gap-2">
				<!-- View All Offers Button -->
				<button
					type="button"
					@click="$emit('show-offers')"
					class="relative flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 hover:border-green-400 hover:from-green-100 hover:to-emerald-100 hover:shadow-sm transition-all min-w-0 touch-manipulation active:scale-[0.98]"
					:aria-label="__('View all available offers')"
				>
					<svg
						class="w-3.5 h-3.5 text-green-600 flex-shrink-0"
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
					<span class="text-[11px] font-bold text-green-700">{{ __("Offers") }}</span>
					<!-- Badge shows ONLY applied offers count - NOT eligible/pending offers -->
					<!-- This prevents confusion where offers show as "applied" before backend validation -->
					<span
						v-if="appliedOfferCount > 0"
						class="bg-green-600 text-white text-[9px] font-bold rounded-full px-1.5 py-0.5 flex-shrink-0 min-w-[16px] text-center"
					>
						{{ appliedOfferCount }}
					</span>
				</button>

				<!-- Enter Coupon Code Button -->
				<button
					type="button"
					@click="$emit('apply-coupon')"
					class="relative flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 hover:border-purple-400 hover:from-purple-100 hover:to-violet-100 hover:shadow-sm transition-all min-w-0 touch-manipulation active:scale-[0.98]"
					:aria-label="__('Apply coupon code')"
				>
					<svg
						class="w-3.5 h-3.5 text-purple-600 flex-shrink-0"
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<path
							fill-rule="evenodd"
							d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z"
							clip-rule="evenodd"
						/>
					</svg>
					<span class="text-[11px] font-bold text-purple-700">{{ __("Coupon") }}</span>
					<span
						v-if="availableGiftCards.length > 0"
						class="bg-purple-600 text-white text-[9px] font-bold rounded-full px-1.5 py-0.5 flex-shrink-0 min-w-[16px] text-center"
					>
						{{ availableGiftCards.length }}
					</span>
				</button>
			</div>
		</div>

		<!-- Cart Items -->
		<div class="flex-1 overflow-y-auto p-0.5 sm:p-1.5 bg-gray-50">
			<div
				v-if="items.length === 0"
				class="flex flex-col items-center justify-center h-full px-3 sm:px-4 py-6"
			>
				<!-- Empty Cart Icon & Message -->
				<div
					class="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3"
				>
					<svg
						class="h-7 w-7 sm:h-8 sm:w-8 text-gray-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
						/>
					</svg>
				</div>
				<p class="text-xs sm:text-sm font-semibold text-gray-900 mb-1">
					{{ __("Your cart is empty") }}
				</p>
				<p class="text-[10px] sm:text-xs text-gray-500 mb-5 sm:mb-6">
					{{ __("Select items to start or choose a quick action") }}
				</p>

				<!-- Quick Actions Grid -->
				<div class="grid grid-cols-2 gap-2 sm:gap-2.5 w-full max-w-lg">
					<!-- View Shift -->
					<button
						type="button"
						@click="$emit('view-shift')"
						class="flex flex-col items-center justify-center p-3 sm:p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 active:bg-blue-100 transition-colors shadow-sm hover:shadow touch-manipulation group"
						:title="__('View current shift details')"
					>
						<div
							class="w-9 h-9 sm:w-10 sm:h-10 bg-blue-50 rounded-full flex items-center justify-center mb-2 group-hover:bg-blue-100 transition-colors"
						>
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
									d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
								/>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
								/>
							</svg>
						</div>
						<span class="text-[11px] sm:text-xs font-semibold text-gray-700">{{
							__("View Shift")
						}}</span>
					</button>

					<!-- Draft Invoices -->
					<button
						v-if="settingsStore.allowSalesOrder || settingsStore.allowQuotation"
						type="button"
						@click="$emit('show-drafts')"
						class="flex flex-col items-center justify-center p-3 sm:p-4 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 active:bg-purple-100 transition-colors shadow-sm hover:shadow touch-manipulation group"
						:title="__('View draft invoices')"
					>
						<div
							class="w-9 h-9 sm:w-10 sm:h-10 bg-purple-50 rounded-full flex items-center justify-center mb-2 group-hover:bg-purple-100 transition-colors"
						>
							<svg
								class="w-5 h-5 text-purple-600"
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
						<span class="text-[11px] sm:text-xs font-semibold text-gray-700">{{
							__("Draft Invoices")
						}}</span>
					</button>

					<!-- Sales History -->
					<button
						type="button"
						@click="handleInvoiceHistory"
						class="flex flex-col items-center justify-center p-3 sm:p-4 bg-white border border-gray-200 rounded-lg active:bg-gray-100 transition-colors shadow-sm hover:shadow touch-manipulation group"
						:class="!canCheckout ? 'opacity-80 cursor-not-allowed' : 'hover:border-gray-300 hover:bg-gray-50'"
						:title="__('View sales history')"
					>
						<div
							class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-2 transition-colors"
							:class="!canCheckout ? 'bg-gray-100' : 'bg-gray-50 group-hover:bg-gray-100'"
						>
							<svg
								v-if="!canCheckout"
								class="w-5 h-5 text-gray-400"
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
							</svg>
							<svg
								v-else
								class="w-5 h-5 text-gray-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						</div>
						<span class="text-[11px] sm:text-xs font-semibold text-gray-700">{{
							__("Sales History")
						}}</span>
					</button>

					<!-- Return Sale -->
					<button
						type="button"
						@click="handleReturnInvoice"
						class="flex flex-col items-center justify-center p-3 sm:p-4 bg-white border border-gray-200 rounded-lg active:bg-gray-100 transition-colors shadow-sm hover:shadow touch-manipulation group"
						:class="!canCheckout ? 'opacity-80 cursor-not-allowed' : 'hover:border-red-300 hover:bg-red-50'"
						:title="__('Process return sale')"
					>
						<div
							class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-2 transition-colors"
							:class="!canCheckout ? 'bg-gray-100' : 'bg-red-50 group-hover:bg-red-100'"
						>
							<svg
								v-if="!canCheckout"
								class="w-5 h-5 text-gray-400"
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
							</svg>
							<svg
								v-else
								class="w-5 h-5 text-red-600"
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
						</div>
						<span class="text-[11px] sm:text-xs font-semibold text-gray-700">{{
							__("Return Sale")
						}}</span>
					</button>

					<!-- Close Shift (Enabled for all roles: Cashier physical reconciliation & Vendor commercial summary) -->
					<button
						type="button"
						@click="handleCloseShift"
						class="flex flex-col items-center justify-center p-3 sm:p-4 bg-white border border-gray-200 rounded-lg active:bg-gray-100 transition-colors shadow-sm hover:shadow touch-manipulation group hover:border-orange-300 hover:bg-orange-50 cursor-pointer"
						:title="__('Close current shift')"
					>
						<div
							class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-2 transition-colors bg-orange-50 group-hover:bg-orange-100"
						>
							<svg
								class="w-5 h-5 text-orange-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
								/>
							</svg>
						</div>
						<span class="text-[11px] sm:text-xs font-semibold text-gray-700">{{
							__("Cerrar Turno")
						}}</span>
					</button>

					<!-- Create Customer -->
					<button
						type="button"
						@click="$emit('create-customer', '')"
						class="flex flex-col items-center justify-center p-3 sm:p-4 bg-white border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 active:bg-green-100 transition-colors shadow-sm hover:shadow touch-manipulation group"
						:title="__('Create new customer')"
					>
						<div
							class="w-9 h-9 sm:w-10 sm:h-10 bg-green-50 rounded-full flex items-center justify-center mb-2 group-hover:bg-green-100 transition-colors"
						>
							<svg
								class="w-5 h-5 text-green-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
								/>
							</svg>
						</div>
						<span class="text-[11px] sm:text-xs font-semibold text-gray-700">{{
							__("Create Customer")
						}}</span>
					</button>
				</div>
			</div>

			<!-- Cart Items List (High-Density Tabular Rows) -->
			<div
				v-else
				class="flex flex-col gap-1 w-full"
			>
				<div
					v-for="(item, index) in sortedItems"
					:key="
						item.item_code +
						'-' +
						(item.uom || '') +
						(item.is_free_item ? '-free' : '')
					"
					@click="item.is_free_item ? null : openEditDialog(item)"
					:class="[
						'group flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 rounded-lg transition-all duration-100 border border-transparent hover:border-blue-200 hover:bg-blue-50/50 cursor-pointer bg-white mb-0.5 shadow-2xs',
						item.is_free_item ? 'bg-green-50/50 border-green-200 cursor-default' : ''
					]"
				>
					<!-- Thumbnail (compact 32px) -->
					<div
						class="w-8 h-8 rounded-md bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-200"
					>
						<img
							v-if="item.image"
							:src="item.image"
							:alt="item.item_name"
							loading="lazy"
							width="32"
							height="32"
							decoding="async"
							class="w-full h-full object-cover"
						/>
						<svg
							v-else
							class="h-4 w-4 text-gray-400"
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

					<!-- Title & Group (Flex-1: expands gracefully when wider) -->
					<div class="flex-1 min-w-0 flex flex-col justify-center">
						<div class="flex items-center gap-1.5 min-w-0">
							<h4
								class="text-xs sm:text-sm font-bold text-gray-900 truncate leading-tight"
								:title="getItemTitle(item)"
							>
								{{ getItemTitle(item) }}
							</h4>
							<span
								v-if="item.custom_medida || item.medida"
								class="text-gray-500 font-semibold text-[11px] shrink-0"
							>
								({{ item.custom_medida || item.medida }})
							</span>
							<!-- Free Item Badge -->
							<span
								v-if="item.free_qty && item.free_qty > 0"
								class="inline-flex items-center px-1.5 py-0.5 bg-green-600 text-white rounded-full text-[9px] font-bold shrink-0"
							>
								{{ item.is_free_item ? __("FREE") : __("+{0} FREE", [item.free_qty]) }}
							</span>
							<!-- Discount Badge -->
							<span
								v-if="item.discount_amount && item.discount_amount > 0"
								class="inline-flex items-center px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-full text-[9px] font-bold shrink-0"
							>
								{{ __("-{0}%", [Number(item.discount_percentage).toFixed(0)]) }}
							</span>
						</div>
						<div class="text-[10px] text-gray-400 font-medium truncate leading-none mt-0.5 select-none">
							{{ item.item_group || '-' }}
						</div>
					</div>

					<!-- Stepper Quantity Counter -->
					<div class="flex items-center shrink-0" @click.stop>
						<!-- Free items: static badge -->
						<div
							v-if="item.is_free_item"
							class="flex items-center bg-green-100 border border-green-300 rounded px-2 h-6"
						>
							<span class="text-xs font-bold text-green-700">{{ item.quantity }}</span>
						</div>
						<!-- Serial items badge -->
						<div
							v-else-if="item.has_serial_no && item.serial_no"
							class="flex items-center gap-1"
						>
							<div class="flex items-center bg-blue-50 border border-blue-200 rounded px-1.5 h-6">
								<FeatherIcon name="hash" class="w-3 h-3 text-blue-500 me-0.5" />
								<span class="text-xs font-bold text-blue-700">{{ item.quantity }}</span>
							</div>
							<button
								type="button"
								@click="openEditDialog(item)"
								class="flex items-center justify-center w-6 h-6 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded transition-colors"
								:title="__('Edit serials')"
							>
								<FeatherIcon name="edit-2" class="w-3 h-3" />
							</button>
						</div>
						<!-- Normal Stepper -->
						<div
							v-else
							:class="[
								'flex items-center bg-white border rounded-md overflow-hidden h-6',
								item.is_resolved_barcode ? 'border-amber-300 bg-amber-50' : 'border-gray-200'
							]"
						>
							<button
								type="button"
								@click="decrementQuantity(item)"
								:disabled="item.is_resolved_barcode"
								class="w-5 sm:w-6 h-full flex items-center justify-center text-gray-600 hover:bg-gray-100 active:bg-gray-200 border-e border-gray-200 font-bold transition-colors touch-manipulation disabled:opacity-40"
								:title="__('Decrease quantity')"
							>
								<svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M20 12H4" /></svg>
							</button>
							<input
								:value="formatQuantity(item.quantity)"
								@input="updateQuantity(item, $event.target.value)"
								@blur="handleQuantityBlur(item)"
								@keydown.enter="$event.target.blur()"
								type="text"
								inputmode="decimal"
								:disabled="item.is_resolved_barcode"
								class="w-9 sm:w-11 h-full text-center border-0 text-xs font-bold focus:outline-none bg-white text-gray-900 focus:ring-1 focus:ring-blue-500"
							/>
							<button
								type="button"
								@click="incrementQuantity(item)"
								:disabled="item.is_resolved_barcode"
								class="w-5 sm:w-6 h-full flex items-center justify-center text-gray-600 hover:bg-gray-100 active:bg-gray-200 border-s border-gray-200 font-bold transition-colors touch-manipulation disabled:opacity-40"
								:title="__('Increase quantity')"
							>
								<svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4" /></svg>
							</button>
						</div>
					</div>

					<!-- UOM Selector Dropdown -->
					<div class="relative shrink-0" @click.stop>
						<button
							type="button"
							@click="toggleUomDropdown(item)"
							:disabled="item.is_resolved_barcode || !item.item_uoms || item.item_uoms.length === 0"
							:class="[
								'h-6 text-[10px] sm:text-[11px] font-semibold rounded px-1.5 sm:px-2 transition-all flex items-center gap-1 min-w-[38px] border',
								item.is_resolved_barcode
									? 'bg-amber-100 text-amber-700 border-amber-300 cursor-not-allowed'
									: item.item_uoms && item.item_uoms.length > 0
									? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 cursor-pointer'
									: 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed opacity-60'
							]"
							:title="item.item_uoms && item.item_uoms.length > 0 ? __('Click to change unit') : __('Only one unit available')"
						>
							<span class="max-w-[60px] truncate">{{ item.uom || item.stock_uom || __("Nos", null, "UOM") }}</span>
							<svg
								v-if="item.item_uoms && item.item_uoms.length > 0"
								class="w-2.5 h-2.5 text-blue-500 transition-transform pointer-events-none"
								:class="openUomDropdown === `${item.item_code}-${item.uom}` ? 'rotate-180' : ''"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
							</svg>
						</button>
						<!-- Dropdown options -->
						<div
							v-if="openUomDropdown === `${item.item_code}-${item.uom}` && item.item_uoms && item.item_uoms.length > 0"
							class="absolute top-full end-0 mt-0.5 bg-white border border-blue-300 rounded-lg shadow-xl z-50 min-w-[110px] overflow-hidden"
						>
							<button
								type="button"
								@click="selectUom(item, item.stock_uom)"
								:class="[
									'w-full text-start px-2 py-1.5 text-xs font-semibold border-b border-gray-100 transition-colors',
									(item.uom || item.stock_uom) === item.stock_uom ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-blue-50'
								]"
							>
								{{ item.stock_uom || __("Nos", null, "UOM") }}
							</button>
							<button
								v-for="uomData in item.item_uoms"
								:key="uomData.uom"
								type="button"
								@click="selectUom(item, uomData.uom)"
								:class="[
									'w-full text-start px-2 py-1.5 text-xs font-semibold border-b border-gray-100 last:border-0 transition-colors',
									(item.uom || item.stock_uom) === uomData.uom ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-blue-50'
								]"
							>
								{{ uomData.uom }}
							</button>
						</div>
					</div>

					<!-- Unit Price -->
					<div class="text-end shrink-0 hidden sm:block min-w-[65px]">
						<span class="text-[11px] font-semibold text-gray-500">
							{{ formatCurrency(item.rate) }}
						</span>
					</div>

					<!-- Item Total Amount -->
					<div class="text-end shrink-0 min-w-[75px]">
						<span class="text-xs sm:text-sm font-extrabold text-blue-600 leading-none">
							{{ formatCurrency(item.amount || item.rate * item.quantity) }}
						</span>
					</div>

					<!-- Delete Button -->
					<button
						v-if="!item.is_free_item"
						type="button"
						@click.stop="$emit('remove-item', item.item_code, item.uom)"
						class="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-600 hover:bg-red-50 rounded transition-colors shrink-0 touch-manipulation active:scale-90"
						:title="__('Remove item')"
					>
						<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
					</button>
				</div>
			</div>
		</div>

		<!-- Bottom: Order Summary & Actions (Always Unified at Bottom of Cart) -->
		<div v-if="items.length > 0" class="bg-white border-t border-gray-200 p-2.5 sm:p-3 shrink-0 space-y-2">
			<!-- Summary Details: Subtotal, Additional Discount, Taxes -->
			<div class="space-y-1 text-xs text-gray-600">
				<div class="flex items-center justify-between">
					<span>{{ __("Subtotal") }} ({{ formatQuantity(totalQuantity) }} {{ totalQuantity === 1 ? __('ud') : __('uds') }})</span>
					<span class="font-bold text-gray-900">{{ formatCurrency(displaySubtotal) }}</span>
				</div>
				<!-- Global Additional Discount Row (Interactive) -->
				<div
					v-if="settingsStore.allowAdditionalDiscount"
					@click="openCartDiscountDialog"
					class="flex items-center justify-between cursor-pointer hover:text-orange-600 transition-colors group select-none py-0.5"
				>
					<span class="font-medium flex items-center gap-1">
						{{ __("Additional Discount") }}
						<span v-if="cartStore.additionalDiscount > 0" class="text-[10px] font-bold text-orange-600">
							({{ discountType === 'percentage' ? localDiscount + '%' : '~' + calculatedPercentEquivalent.toFixed(1) + '%' }})
						</span>
						<svg class="w-2.5 h-2.5 text-gray-400 group-hover:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
						</svg>
						<button
							v-if="cartStore.additionalDiscount > 0"
							type="button"
							@click.stop="resetCartDiscount"
							class="p-0.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors ml-1"
							:title="__('Quitar descuento')"
						>
							<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
						</button>
					</span>
					<span
						class="font-bold"
						:class="cartStore.additionalDiscount > 0 ? 'text-red-600' : 'text-blue-600 hover:underline'"
					>
						{{ cartStore.additionalDiscount > 0 ? '-' + formatCurrency(cartStore.additionalDiscount) : '+ ' + __('Agregar') }}
					</span>
				</div>
				<!-- Discount Display if applied -->
				<div v-if="discountAmount > 0" class="flex items-center justify-between text-red-700">
					<div class="flex items-center gap-1">
						<svg class="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clip-rule="evenodd" /></svg>
						<span class="font-medium">{{ __("Discount") }}</span>
					</div>
					<span class="font-bold text-red-600">-{{ formatCurrency(discountAmount) }}</span>
				</div>
				<!-- Tax (only if > 0) -->
				<div v-if="taxAmount > 0" class="flex items-center justify-between text-gray-600">
					<span class="font-medium">{{ __("Tax") }}</span>
					<span class="font-bold text-gray-900">{{ formatCurrency(taxAmount) }}</span>
				</div>
			</div>

			<!-- Grand Total Card -->
			<div class="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl px-3.5 py-2">
				<div class="flex items-center gap-2">
					<span class="text-xs font-bold text-gray-700 uppercase tracking-wider">{{ __("Grand Total") }}</span>
					<span v-if="totalDiscount > 0" class="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">
						{{ __("Ahorro") }}: {{ formatCurrency(totalDiscount) }}
					</span>
				</div>
				<span class="text-xl sm:text-2xl font-black text-blue-700 tracking-tight">
					{{ formatCurrency(cartStore.grandTotal || grandTotal) }}
				</span>
			</div>

			<!-- Action Buttons -->
			<div class="space-y-1.5 pt-0.5">
				<!-- Checkout Button (100% width) -->
				<button
					type="button"
					@click="handleProceedToPayment"
					:disabled="items.length === 0"
					class="w-full h-11 font-bold text-white transition-all touch-manipulation active:scale-[0.99] flex items-center justify-center gap-2 rounded-xl text-sm shadow-sm"
					:class="[
						items.length === 0
							? 'bg-gray-300 cursor-not-allowed'
							: !canCheckout
								? 'bg-gray-400 opacity-80 cursor-not-allowed shadow-none'
								: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-sm hover:shadow active:scale-[0.99]'
					]"
					:aria-label="__('Proceed to payment')"
				>
					<svg v-if="!canCheckout" class="w-4 h-4 text-yellow-200" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
					</svg>
					<svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
					</svg>
					<span v-if="!canCheckout">{{ __("Solo Cajero (Cobro Deshabilitado)") }}</span>
					<span v-else>{{ __("Vender / Cobrar") }}</span>
				</button>

				<!-- Pre-venta & Cotización (Dual compact row) -->
				<div
					v-if="settingsStore.allowSalesOrder || settingsStore.allowQuotation"
					class="grid gap-2"
					:class="
						settingsStore.allowSalesOrder && settingsStore.allowQuotation
							? 'grid-cols-2'
							: 'grid-cols-1'
					"
				>
					<button
						v-if="settingsStore.allowSalesOrder"
						type="button"
						@click="$emit('save-draft', true)"
						class="h-8 px-2.5 rounded-lg font-bold text-xs text-orange-700 bg-orange-50 hover:bg-orange-100 active:bg-orange-200 border border-orange-200 transition-all flex items-center justify-center gap-1.5 shadow-2xs active:scale-[0.98] touch-manipulation"
						:title="__('Guardar como Pre-venta (Orden de Venta)')"
					>
						<span class="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0"></span>
						<span class="truncate">{{ __("Pre-venta") }}</span>
					</button>
					<button
						v-if="settingsStore.allowQuotation"
						type="button"
						@click="$emit('save-quotation', true)"
						class="h-8 px-2.5 rounded-lg font-bold text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border border-blue-200 transition-all flex items-center justify-center gap-1.5 shadow-2xs active:scale-[0.98] touch-manipulation"
						:title="__('Guardar como Cotización')"
					>
						<span class="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></span>
						<span class="truncate">{{ __("Cotización") }}</span>
					</button>
				</div>
			</div>
		</div>
	</div>

		<!-- Edit Item Dialog -->
		<EditItemDialog
			v-model="showEditDialog"
			:item="selectedItem"
			:warehouses="warehouses"
			:currency="currency"
			@update-item="handleUpdateItem"
		/>

		<!-- Global Discount Dialog -->
		<div
			v-if="showDiscountDialog"
			class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
		>
			<div class="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col border border-gray-100">
				<!-- Header -->
				<div class="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
					<div class="flex items-center gap-1.5">
						<svg class="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
						</svg>
						<span class="text-sm font-bold text-gray-900">{{ __("Descuento Adicional") }}</span>
					</div>
					<button
						type="button"
						@click="showDiscountDialog = false"
						class="text-gray-400 hover:text-gray-600 transition-colors"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<!-- Content -->
				<div class="p-4 space-y-4">
					<!-- Display Value -->
					<div class="flex items-center justify-between text-xs text-gray-500">
						<span>{{ __("Monto Descontado") }}</span>
						<span class="font-bold text-red-600 text-sm">
							-{{ formatCurrency(discountType === 'percentage' ? Math.round((subtotal * (localDiscount || 0)) / 100) : (localDiscount || 0)) }}
						</span>
					</div>

					<!-- Form Controls -->
					<div class="space-y-3.5">
						<!-- Unit selectors (percentage vs fixed amount) -->
						<div class="flex gap-2">
							<button
								type="button"
								@click="discountType = 'percentage'; handleCartDiscountChange()"
								class="flex-1 py-2 font-bold text-xs rounded-lg transition-all border"
								:class="discountType === 'percentage' ? 'bg-orange-600 border-orange-600 text-white shadow-sm' : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'"
							>
								{{ __("Porcentaje (%)") }}
							</button>
							<button
								type="button"
								@click="discountType = 'amount'; handleCartDiscountChange()"
								class="flex-1 py-2 font-bold text-xs rounded-lg transition-all border"
								:class="discountType === 'amount' ? 'bg-orange-600 border-orange-600 text-white shadow-sm' : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'"
							>
								{{ __("Monto Fijo (Bs.)") }}
							</button>
						</div>

						<!-- Input field with symmetric increment/decrement buttons -->
						<div class="flex items-center border border-orange-300 rounded-lg bg-white overflow-hidden w-full">
							<button
								type="button"
								@click="decrementCartDiscount"
								class="h-10 w-12 flex items-center justify-center text-orange-600 hover:bg-orange-50 active:bg-orange-100 transition-colors flex-shrink-0 border-r border-gray-100"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
								</svg>
							</button>
							<input
								type="number"
								v-model.number="localDiscount"
								@input="handleCartDiscountChange"
								@blur="finalizeCartDiscountRounding"
								@keydown.enter="applyCartDiscount"
								class="flex-1 h-10 px-3 text-base font-bold text-center bg-transparent border-none focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
								min="0"
								step="1"
							/>
							<button
								type="button"
								@click="incrementCartDiscount"
								class="h-10 w-12 flex items-center justify-center text-orange-600 hover:bg-orange-50 active:bg-orange-100 transition-colors flex-shrink-0 border-l border-gray-100"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
								</svg>
							</button>
						</div>
					</div>

					<!-- Helper / descriptive text -->
					<div v-if="discountType === 'percentage' && localDiscount > 0" class="text-[10px] text-gray-400 text-center select-none font-medium">
						{{ __("Se aplicará un descuento redondeado de aproximadamente -{0}", [formatCurrency(Math.round((subtotal * (localDiscount || 0)) / 100))]) }}
						<span v-if="subtotal > 0" class="text-[9px] font-semibold text-gray-500 block mt-0.5">
							({{ __("Porcentaje real aproximado: {0}%", [((Math.round((subtotal * (localDiscount || 0)) / 100) / subtotal) * 100).toFixed(1)]) }})
						</span>
					</div>
					<div v-if="discountType === 'amount' && localDiscount > 0" class="text-[10px] text-gray-400 text-center select-none font-medium">
						{{ __("Equivale a aproximadamente un {0}% del subtotal", [calculatedPercentEquivalent.toFixed(1)]) }}
					</div>
				</div>

				<!-- Actions -->
				<div class="px-4 py-3 bg-gray-50 border-t border-gray-100 flex flex-col gap-2">
					<div class="flex gap-2">
						<button
							type="button"
							@click="showDiscountDialog = false"
							class="flex-1 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
						>
							{{ __("Cancelar") }}
						</button>
						<button
							type="button"
							@click="applyCartDiscount"
							class="flex-1 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md active:scale-[0.98] transition-all"
						>
							{{ __("Aplicar") }}
						</button>
					</div>
					<button
						v-if="cartStore.additionalDiscount > 0"
						type="button"
						@click="resetCartDiscount(); showDiscountDialog = false"
						class="w-full py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
					>
						{{ __("Quitar Descuento") }}
					</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
/**
 * ============================================================================
 * IMPORTS
 * ============================================================================
 */
import { usePOSCartStore } from "@/stores/posCart";
import { usePOSSettingsStore } from "@/stores/posSettings";
import { usePOSOffersStore } from "@/stores/posOffers";
import { useCustomerSearchStore } from "@/stores/customerSearch";
import { DEFAULT_CURRENCY, formatCurrency as formatCurrencyUtil } from "@/utils/currency";
import { useFormatters } from "@/composables/useFormatters";
import { useCartSort } from "@/composables/useCartSort";
import { isOffline } from "@/utils/offline";
import { offlineWorker } from "@/utils/offline/workerClient";
import { logger } from "@/utils/logger";
import { FeatherIcon } from "frappe-ui";
import { useBootstrapStore } from "@/stores/bootstrap";
import { useToast } from "@/composables/useToast";

const log = logger.create("InvoiceCart");
import { createResource } from "frappe-ui";
import { computed, onBeforeUnmount, onMounted, ref, watch, nextTick } from "vue";
import EditItemDialog from "./EditItemDialog.vue";

/**
 * ============================================================================
 * STORES & COMPOSABLES
 * ============================================================================
 */
const cartStore = usePOSCartStore(); // Pinia store for cart state management
const settingsStore = usePOSSettingsStore(); // Pinia store for POS settings
const offersStore = usePOSOffersStore(); // Pinia store for offers/promotions
const customerSearchStore = useCustomerSearchStore(); // Pinia store for customer search
const bootstrapStore = useBootstrapStore();
const { showWarning } = useToast();
const { formatQuantity } = useFormatters(); // Quantity formatting utilities
const showPromoButtons = ref(false); // Cambiar a true si el cliente desea habilitar Ofertas y Cupones en el futuro.

const cartContainerRef = ref(null);
const cartWidth = ref(420);
let cartResizeObserver = null;

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

const canCheckout = computed(() => bootstrapStore.canCheckout());

const isQuotationDraft = computed(() => {
	const draftId = cartStore.currentDraftId;
	return draftId && (
		draftId.includes("-QTN-") ||
		draftId.includes("-COT-") ||
		draftId.startsWith("QTN-") ||
		draftId.startsWith("COT-")
	);
});

function clearActiveDraft() {
	cartStore.currentDraftId = null;
	if (cartStore.invoiceItems) {
		cartStore.invoiceItems.forEach(item => {
			item.so_detail = null;
		});
	}
}

function handleProceedToPayment() {
	if (!canCheckout.value) {
		showWarning(
			__("Tu perfil de usuario es Vendedor. Solo estás autorizado a generar Pre-ventas y Cotizaciones. El cobro debe ser procesado en la caja por un Cajero.")
		);
		return;
	}
	emit("proceed-to-payment");
}

function handleCloseShift() {
	emit("close-shift");
}

function handleInvoiceHistory() {
	if (!canCheckout.value) {
		showWarning(__("This function is reserved for cashiers."));
		return;
	}
	emit("show-history");
}

function handleReturnInvoice() {
	if (!canCheckout.value) {
		showWarning(__("This function is reserved for cashiers."));
		return;
	}
	emit("show-return");
}

/**
 * ============================================================================
 * PROPS
 * ============================================================================
 * @prop {Array} items - Cart items array with item details (item_code, quantity, rate, etc.)
 * @prop {Object} customer - Selected customer object (name, customer_name, mobile_no)
 * @prop {Number} subtotal - Cart subtotal before tax and discounts
 * @prop {Number} taxAmount - Total tax amount
 * @prop {Number} discountAmount - Total discount amount applied
 * @prop {Number} grandTotal - Final total (subtotal - discount + tax)
 * @prop {String} posProfile - Current POS Profile name
 * @prop {String} currency - Currency code for formatting (e.g., "USD", "EUR")
 * @prop {Array} appliedOffers - List of currently applied promotional offers
 * @prop {Array} warehouses - Available warehouses for item selection
 */
const props = defineProps({
	items: {
		type: Array,
		default: () => [],
	},
	customer: Object,
	subtotal: {
		type: Number,
		default: 0,
	},
	taxAmount: {
		type: Number,
		default: 0,
	},
	discountAmount: {
		type: Number,
		default: 0,
	},
	grandTotal: {
		type: Number,
		default: 0,
	},
	posProfile: String,
	currency: {
		type: String,
		default: DEFAULT_CURRENCY,
	},
	appliedOffers: {
		type: Array,
		default: () => [],
	},
	warehouses: {
		type: Array,
		default: () => [],
	},
});

/**
 * ============================================================================
 * EMITS
 * ============================================================================
 * Events emitted to parent component for cart operations
 */
const emit = defineEmits([
	"update-quantity", // (itemCode, newQty, uom?) - Update item quantity
	"remove-item", // (itemCode, uom?) - Remove item from cart
	"select-customer", // (customer) - Select/change customer
	"edit-customer", // (customer) - Open edit customer dialog
	"create-customer", // (searchText) - Open create customer dialog
	"proceed-to-payment", // () - Navigate to payment screen
	"clear-cart", // () - Clear all items from cart
	"save-draft", // () - Save current cart as draft/hold order
	"save-quotation", // () - Save current cart as Quotation
	"apply-coupon", // () - Open coupon application dialog
	"show-coupons", // () - Show available coupons
	"show-offers", // () - Show available offers dialog
	"remove-offer", // (offerId) - Remove applied offer
	"update-uom", // (itemCode, newUom) - Change item's unit of measure
	"edit-item", // (item) - Open item edit dialog
	"view-shift", // () - View current shift details
	"show-drafts", // () - Show draft/held orders
	"show-history", // () - Show invoice history
	"show-return", // () - Open return invoice dialog
	"close-shift", // () - Close current shift
	"update-additional-discount", // (discountAmount) - Update global discount
	"print-active-ticket", // () - Print thermal ticket for active quotation/pre-sale
	"print-active-pdf", // () - Print letter size PDF for active quotation/pre-sale
	"whatsapp-active-draft", // () - Send active quotation/pre-sale via WhatsApp
]);

// Cart sort composable (must be after defineProps)
const {
	cartSortBy,
	cartSortOrder,
	showCartSortDropdown,
	sortedItems,
	CART_SORT_OPTIONS,
	CART_SORT_ICONS,
	toggleCartSortDropdown,
	handleCartSortToggle,
	getCartSortLabel,
	getCartSortIconState,
} = useCartSort(() => props.items);

/**
 * ============================================================================
 * REACTIVE STATE
 * ============================================================================
 */
// Customer search state
const customerSearch = ref(""); // Current search query
const customerSearchContainer = ref(null); // Ref to search container for click-outside detection
const customerSearchFocused = ref(false); // Track if search input is focused
// Use Pinia store for allCustomers (shared with CustomerDialog, synced on customer creation)
const allCustomers = computed(() => customerSearchStore.allCustomers);
const customersLoaded = computed(
	() => !customerSearchStore.loading || customerSearchStore.allCustomers.length > 0
);
const selectedIndex = ref(-1); // Keyboard navigation index for search results
const availableGiftCards = ref([]); // Available gift cards for current customer
const previousCustomer = ref(null); // Store previous customer for restore on blur

// Edit item dialog state
const showEditDialog = ref(false); // Controls edit dialog visibility
const selectedItem = ref(null); // Item being edited

// Global discount dialog state
const showDiscountDialog = ref(false);
const localDiscount = ref(0);
const discountType = ref(settingsStore.usePercentageDiscount ? "percentage" : "amount");

// Calculate percentage equivalent dynamically for display
const calculatedPercentEquivalent = computed(() => {
	if (props.subtotal <= 0) return 0;
	return ((cartStore.additionalDiscount || 0) / props.subtotal) * 100;
});

// UOM dropdown state - tracks which item's UOM dropdown is open (by item_code)
const openUomDropdown = ref(null);

// Cart sort dropdown container (template ref for outside-click detection)
const cartSortContainer = ref(null);

/**
 * ============================================================================
 * API RESOURCES
 * ============================================================================
 * These resources handle data fetching from the server with offline support.
 * Data is cached in the service worker for offline access.
 */

/**
 * Customer Loading
 *
 * Uses the shared customerSearchStore for customer data.
 * This ensures customers are synced across all components (InvoiceCart, CustomerDialog).
 * New customers are immediately available after creation without page refresh.
 */
// Watch posProfile so customers and offers load as soon as the active shift/profile is resolved
watch(
	() => props.posProfile,
	(newProfile) => {
		if (newProfile) {
			customerSearchStore.loadAllCustomers(newProfile);
			offersStore.ensureOffersFetched(newProfile);
		}
	},
	{ immediate: true }
);

/**
 * Gift Cards Resource
 *
 * Fetches active coupon codes and gift cards for the selected customer.
 * - Only fetches when a customer is selected and online
 * - Reloads when customer changes (via watcher)
 * - Used for the "Coupon" button badge count
 *
 * @endpoint pos_next.api.offers.get_active_coupons
 */
const giftCardsResource = createResource({
	url: "pos_next.api.offers.get_active_coupons",
	makeParams() {
		return {
			customer: props.customer?.name || props.customer,
			company: props.posProfile, // Will get company from profile
		};
	},
	auto: false,
	onSuccess(data) {
		availableGiftCards.value = data?.message || data || [];
	},
});

/**
 * Watch for customer changes to load their gift cards.
 * Reloads gift cards resource when customer is selected (and online).
 * Clears gift cards when customer is removed or offline.
 */
watch(
	() => props.customer,
	(newCustomer) => {
		if (newCustomer && props.posProfile && !isOffline()) {
			giftCardsResource.reload();
		} else {
			availableGiftCards.value = [];
		}
	}
);

/**
 * ============================================================================
 * COMPUTED PROPERTIES
 * ============================================================================
 */

/**
 * Count of currently applied promotional offers.
 * Used for the badge on the "Offers" button.
 * @returns {Number} Count of applied offers
 */
const appliedOfferCount = computed(() => (props.appliedOffers || []).length);

/**
 * Pre-computed customer lookup map for O(1) access by ID.
 * Rebuilt when allCustomers changes.
 */
const customerMap = computed(() => {
	const map = new Map();
	for (const cust of allCustomers.value) {
		map.set(cust.name, cust);
	}
	return map;
});

/**
 * Instant customer search results with in-memory filtering.
 *
 * Performs zero-latency filtering on the cached customer list.
 * Searches across customer_name, mobile_no, and customer ID.
 * Returns max 20 results to keep dropdown performant.
 *
 * @returns {Array} Filtered customer objects matching search query
 */
const customerResults = computed(() => {
	const searchValue = customerSearch.value.trim().toLowerCase();

	// When focused with no search term, show all customers
	if (searchValue.length < 1) {
		if (customerSearchFocused.value) {
			return allCustomers.value;
		}
		return [];
	}

	// Instant in-memory filter across all customers
	return allCustomers.value.filter((cust) => {
		const name = (cust.customer_name || "").toLowerCase();
		const mobile = (cust.mobile_no || "").toLowerCase();
		const taxId = (cust.tax_id || "").toLowerCase();
		const id = (cust.name || "").toLowerCase();

		return (
			name.includes(searchValue) ||
			mobile.includes(searchValue) ||
			taxId.includes(searchValue) ||
			id.includes(searchValue)
		);
	});
});

/**
 * Reset keyboard selection index when search results change.
 * Ensures the selection doesn't point to a non-existent result.
 */
watch(customerResults, () => {
	selectedIndex.value = -1;
});

/**
 * Total quantity of all items in cart (including free items).
 * Sums quantity + free_qty for each cart item.
 * @returns {Number} Total item quantity
 */
const totalQuantity = computed(() => {
	return props.items.reduce((sum, item) => {
		const qty = item.quantity || 0;
		// For dedicated free item rows, quantity IS the free qty — don't double-count
		const freeQty = item.is_free_item ? 0 : item.free_qty || 0;
		return sum + qty + freeQty;
	}, 0);
});

/**
 * Display subtotal adjusted for tax-inclusive mode.
 *
 * When tax is inclusive, the raw subtotal from the store includes tax.
 * For clear cashier display, we show:
 * - Subtotal: Net amount (before tax) = gross - tax
 * - Tax: The extracted tax amount
 * - Grand Total: gross amount = Subtotal + Tax
 *
 * When tax is exclusive, subtotal is already net (before tax).
 *
 * @returns {Number} Subtotal amount to display (net amount before tax)
 */
const displaySubtotal = computed(() => {
	if (cartStore.taxInclusive) {
		// Tax inclusive: subtotal from store is gross (includes tax)
		// Display the net amount (before tax) for clarity
		return props.subtotal - props.taxAmount;
	}
	// Tax exclusive: subtotal is already net (before tax)
	return props.subtotal;
});

/**
 * Display grand total that visually equals Subtotal + Tax - Discount.
 *
 * This ensures the math is intuitive for cashiers:
 * Grand Total = displaySubtotal + Tax - Discount
 *
 * @returns {Number} Grand total amount to display
 */
const displayGrandTotal = computed(() => {
	// Always: displaySubtotal + tax - discount
	// This makes the display consistent and intuitive
	return displaySubtotal.value + props.taxAmount - props.discountAmount;
});

/**
 * ============================================================================
 * FUNCTIONS
 * ============================================================================
 */

// ─────────────────────────────────────────────────────────────────────────────
// Customer Search Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handle customer search input with instant reactivity.
 * Updates the customerSearch ref which triggers computed filtering.
 * @param {Event} event - Input event from search field
 */
function handleSearchInput(event) {
	customerSearch.value = event.target.value;
}

// Track if customer history has been loaded this session
const customerHistoryLoaded = ref(false);

/**
 * Handle search input focus - shows frequent customers dropdown.
 */
function handleSearchFocus() {
	customerSearchFocused.value = true;
	// Load customer history only once per session for faster subsequent focuses
	if (!customerHistoryLoaded.value) {
		customerSearchStore.loadCustomerHistory();
		customerHistoryLoaded.value = true;
	}
}

/**
 * Handle search input blur - hides dropdown after a short delay.
 * Short delay as fallback for keyboard/tab navigation (mousedown.prevent handles click cases).
 */
function handleSearchBlur() {
	// Reduced delay - mousedown.prevent handles most cases, this is just for keyboard nav
	setTimeout(() => {
		customerSearchFocused.value = false;
	}, 100);
}

/**
 * Handle keyboard navigation in customer search dropdown.
 * Supports:
 * - ArrowDown/ArrowUp: Navigate through results
 * - Enter: Select current or auto-select single result
 * - Escape: Clear search
 *
 * @param {KeyboardEvent} event - Keyboard event from search input
 */
function handleKeydown(event) {
	if (customerResults.value.length === 0) return;

	if (event.key === "ArrowDown") {
		event.preventDefault();
		selectedIndex.value = Math.min(selectedIndex.value + 1, customerResults.value.length - 1);
	} else if (event.key === "ArrowUp") {
		event.preventDefault();
		selectedIndex.value = Math.max(selectedIndex.value - 1, -1);
	} else if (event.key === "Enter") {
		event.preventDefault();
		if (selectedIndex.value >= 0 && selectedIndex.value < customerResults.value.length) {
			selectCustomer(customerResults.value[selectedIndex.value]);
		} else if (customerResults.value.length === 1) {
			// Auto-select if only one result
			selectCustomer(customerResults.value[0]);
		}
	} else if (event.key === "Escape") {
		customerSearch.value = "";
	}
}

/**
 * Select a customer from search results.
 * Emits select-customer event and resets search state.
 * Tracks customer selection for frequency-based suggestions.
 * @param {Object} cust - Customer object to select
 */
function selectCustomer(cust) {
	// Track selection for frequent customers feature
	customerSearchStore.trackCustomerSelection(cust.name);
	emit("select-customer", cust);
	customerSearch.value = "";
	selectedIndex.value = -1;
	customerSearchFocused.value = false;
	previousCustomer.value = null;
}

/**
 * Remove the selected customer.
 * Clears the customer and focuses the search input.
 */
async function removeCustomer() {
	previousCustomer.value = null;
	await clearCustomer();
}

/**
 * Clear the currently selected customer.
 * Emits select-customer with null to deselect.
 */
async function clearCustomer() {
	emit("select-customer", null);
	await nextTick();
	const searchInput = document.getElementById("cart-customer-search");
	if (searchInput) {
		searchInput.focus();
	}
}

/**
 * Open customer creation dialog with current search text.
 * Pre-fills the new customer name with the search query.
 */
function createNewCustomer() {
	const searchValue = customerSearch.value;
	// Close dropdown immediately
	customerSearch.value = "";
	customerSearchFocused.value = false;
	// Emit event to open customer creation dialog
	emit("create-customer", searchValue);
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get initials from a customer name for avatar display.
 * Returns first letter of first two words, or first two letters if single word.
 *
 * @param {String} name - Customer name
 * @returns {String} 2-letter initials (uppercase)
 */
function getInitials(name) {
	if (!name || !name.trim()) return "?";
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "?";
	const first = Array.from(parts[0])[0] || "?";
	if (parts.length >= 2) {
		const second = Array.from(parts[1])[0] || "?";
		return (first + second).toUpperCase();
	}
	return Array.from(parts[0]).slice(0, 2).join("").toUpperCase();
}

/**
 * Format a numeric amount as currency string.
 * Uses the component's currency prop for formatting.
 *
 * @param {Number} amount - Amount to format
 * @returns {String} Formatted currency string (e.g., "$1,234.56")
 */
function formatCurrency(amount) {
	return formatCurrencyUtil(Number.parseFloat(amount || 0), props.currency);
}

// ─────────────────────────────────────────────────────────────────────────────
// Quantity Control Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Intelligently determine the step size based on current quantity.
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

/**
 * Increment item quantity using smart step.
 * Uses getSmartStep to determine appropriate increment value.
 *
 * @param {Object} item - Cart item to increment
 */
function incrementQuantity(item) {
	// Prevent editing resolved barcode items
	if (item.is_resolved_barcode) return;

	const step = getSmartStep(item.quantity);
	const newQty = Math.round((item.quantity + step) * 10000) / 10000;
	emit("update-quantity", item.item_code, newQty, item.uom);
}

/**
 * Decrement item quantity using smart step.
 * Removes item if quantity would become zero or negative.
 *
 * @param {Object} item - Cart item to decrement
 */
function decrementQuantity(item) {
	// Prevent editing resolved barcode items
	if (item.is_resolved_barcode) return;

	const step = getSmartStep(item.quantity);
	const newQty = Math.round((item.quantity - step) * 10000) / 10000;

	if (newQty <= 0) {
		// If quantity would be 0 or negative, remove the item
		emit("remove-item", item.item_code, item.uom);
	} else {
		emit("update-quantity", item.item_code, newQty, item.uom);
	}
}

/**
 * Update quantity from direct input (manual typing).
 * Allows any positive number during typing without rounding.
 *
 * @param {Object} item - Cart item to update
 * @param {String} value - New quantity value from input
 */

function updateQuantity(item, value) {
	// Prevent editing resolved barcode items
	if (item.is_resolved_barcode) return;

	const qty = Number.parseFloat(value);

	// If the input isn't a valid number (e.g., user cleared the field), do nothing
	if (isNaN(qty)) return;

	// If quantity is zero or negative, remove the item from the cart
	if (qty <= 0) return emit("remove-item", item.item_code, item.uom);

	// For positive numbers, update quantity immediately (no rounding here while typing)
	emit("update-quantity", item.item_code, qty, item.uom);
}

/**
 * Handle quantity input blur - validate and round.
 * Called when user leaves the quantity input field.
 * - Removes item if quantity is 0 or invalid
 * - Rounds to 4 decimal places for consistency
 *
 * @param {Object} item - Cart item that lost focus
 */
function handleQuantityBlur(item) {
	// When user leaves the input field, round and validate
	if (!item.quantity || item.quantity <= 0) {
		// If quantity is 0 or invalid, remove the item
		emit("remove-item", item.item_code, item.uom);
	} else {
		// Round to 4 decimal places for consistency
		const roundedQty = Math.round(item.quantity * 10000) / 10000;
		if (roundedQty !== item.quantity) {
			emit("update-quantity", item.item_code, roundedQty, item.uom);
		}
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// UOM (Unit of Measure) Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Toggle UOM dropdown visibility for an item.
 * Uses unique key combining item_code + uom to handle same item with different UOMs.
 */
function toggleUomDropdown(itemCode, uom) {
	const key = `${itemCode}-${uom}`;
	openUomDropdown.value = openUomDropdown.value === key ? null : key;
}

/**
 * Select a UOM from dropdown - changes UOM and closes dropdown
 * Handles merging if target UOM already exists in cart
 */
async function selectUom(item, newUom) {
	if (item.uom === newUom) {
		openUomDropdown.value = null;
		return;
	}

	const currentUom = item.uom || item.stock_uom;
	await cartStore.changeItemUOM(item.item_code, newUom, currentUom);
	openUomDropdown.value = null;
	emit("update-uom", item.item_code, newUom);
}

// ─────────────────────────────────────────────────────────────────────────────
// Item Edit Dialog Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Open the edit item dialog for an item.
 * Creates a copy of the item to avoid mutating the original.
 * Used for serial number items and advanced editing.
 *
 * @param {Object} item - Cart item to edit
 */
function openEditDialog(item) {
	selectedItem.value = { ...item };
	showEditDialog.value = true;
}

/**
 * Handle item update from edit dialog.
 * Updates item via cart store and emits for parent compatibility.
 *
 * @param {Object} updatedItem - Updated item data from dialog
 */
async function handleUpdateItem(updatedItem) {
	// Get the original UOM from selectedItem (before any changes)
	const originalUom = selectedItem.value?.uom || selectedItem.value?.stock_uom;
	// Use store method to update item, passing original UOM to identify correct item
	await cartStore.updateItemDetails(updatedItem.item_code, updatedItem, originalUom);
	// Also emit for parent component compatibility
	emit("edit-item", updatedItem);
}

// ─────────────────────────────────────────────────────────────────────────────
// Event Handlers & Lifecycle
// ─────────────────────────────────────────────────────────────────────────────

function selectDocType(type) {
	cartStore.setTargetDoctype(type);
}

/**
 * Handle clicks outside interactive elements.
 * - Closes customer search dropdown when clicking outside
 * - Closes UOM dropdown when clicking outside
 * - Closes cart sort dropdown when clicking outside
 *
 * @param {MouseEvent} event - Click event
 */
function handleOutsideClick(event) {
	const target = event.target;

	// Close customer search if clicking outside
	if (
		customerSearchContainer.value &&
		target instanceof Node &&
		!customerSearchContainer.value.contains(target)
	) {
		customerSearch.value = "";

		// Restore previous customer if set and no customer selected
		if (previousCustomer.value && !props.customer) {
			emit("select-customer", previousCustomer.value);
			previousCustomer.value = null;
		}
	}

	// Close UOM dropdown if clicking outside
	if (openUomDropdown.value !== null) {
		// Check if click is outside all UOM dropdowns
		const clickedInsideUomDropdown =
			target instanceof Element && target.closest(".group\\/uom");
		if (!clickedInsideUomDropdown) {
			openUomDropdown.value = null;
		}
	}

	// Close cart sort dropdown if clicking outside
	if (
		showCartSortDropdown.value &&
		cartSortContainer.value &&
		target instanceof Node &&
		!cartSortContainer.value.contains(target)
	) {
		showCartSortDropdown.value = false;
	}
}

/**
 * Component mounted - register global click listener.
 * Used for click-outside detection on dropdowns.
 */
onMounted(() => {
	if (typeof document !== "undefined") {
		// Use mousedown instead of click to catch events before they are swallowed by other handlers
		document.addEventListener("mousedown", handleOutsideClick);
	}
	if (typeof ResizeObserver !== "undefined" && cartContainerRef.value) {
		cartResizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				if (entry.contentRect && entry.contentRect.width > 0) {
					cartWidth.value = entry.contentRect.width;
				}
			}
		});
		cartResizeObserver.observe(cartContainerRef.value);
	}
});

/**
 * Component unmounting - cleanup global click listener.
 * Prevents memory leaks by removing event listener.
 */
onBeforeUnmount(() => {
	if (typeof document !== "undefined") {
		document.removeEventListener("mousedown", handleOutsideClick);
	}
	if (cartResizeObserver) {
		cartResizeObserver.disconnect();
		cartResizeObserver = null;
	}
});

// Cart global discount handlers
function openCartDiscountDialog() {
	if (cartStore.additionalDiscount > 0) {
		if (discountType.value === "percentage") {
			const currentCalc = Math.round((props.subtotal * (localDiscount.value || 0)) / 100);
			if (currentCalc !== cartStore.additionalDiscount) {
				if (props.subtotal > 0) {
					localDiscount.value = Math.round((cartStore.additionalDiscount / props.subtotal) * 100);
				} else {
					localDiscount.value = cartStore.additionalDiscount;
					discountType.value = "amount";
				}
			}
		} else {
			localDiscount.value = cartStore.additionalDiscount;
			discountType.value = "amount";
		}
	} else {
		localDiscount.value = 0;
		discountType.value = settingsStore.usePercentageDiscount ? "percentage" : "amount";
	}
	showDiscountDialog.value = true;
}

function handleCartDiscountChange() {
	let value = localDiscount.value;
	let calculatedAmount = 0;

	if (discountType.value === "percentage") {
		// Limit percentage to maxDiscountAllowed
		if (settingsStore.maxDiscountAllowed > 0 && value > settingsStore.maxDiscountAllowed) {
			localDiscount.value = settingsStore.maxDiscountAllowed;
			value = settingsStore.maxDiscountAllowed;
			showWarning(__("Maximum allowed discount is {0}%", [settingsStore.maxDiscountAllowed]));
		}
		if (value > 100) {
			localDiscount.value = 100;
			value = 100;
		}
		calculatedAmount = (props.subtotal * value) / 100;
	} else {
		// Amount mode - force integer
		localDiscount.value = Math.round(value || 0);
		calculatedAmount = localDiscount.value;

		if (settingsStore.maxDiscountAllowed > 0 && props.subtotal > 0) {
			const percentageEquivalent = (calculatedAmount / props.subtotal) * 100;
			if (percentageEquivalent > settingsStore.maxDiscountAllowed) {
				const maxAmount = Math.round((props.subtotal * settingsStore.maxDiscountAllowed) / 100);
				localDiscount.value = maxAmount;
				calculatedAmount = maxAmount;
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

	// Ensure discount doesn't exceed subtotal
	calculatedAmount = Math.round(calculatedAmount);
	if (calculatedAmount > props.subtotal) {
		if (discountType.value === "amount") {
			localDiscount.value = Math.round(props.subtotal);
		}
		calculatedAmount = Math.round(props.subtotal);
	}
	if (calculatedAmount < 0) {
		localDiscount.value = 0;
	}
}

function finalizeCartDiscountRounding() {
	localDiscount.value = Math.round(localDiscount.value || 0);
	handleCartDiscountChange();
}

function applyCartDiscount() {
	finalizeCartDiscountRounding();

	let finalAmount = 0;
	if (discountType.value === "percentage") {
		finalAmount = Math.round((props.subtotal * (localDiscount.value || 0)) / 100);
	} else {
		finalAmount = localDiscount.value;
	}

	emit("update-additional-discount", finalAmount);
	showDiscountDialog.value = false;
	showSuccess(__("Additional discount updated"));
}

function resetCartDiscount() {
	localDiscount.value = 0;
	emit("update-additional-discount", 0);
	showSuccess(__("Additional discount removed"));
}

function incrementCartDiscount() {
	const step = discountType.value === "percentage" ? 1 : 5;
	localDiscount.value = (localDiscount.value || 0) + step;
	handleCartDiscountChange();
}

function decrementCartDiscount() {
	const step = discountType.value === "percentage" ? 1 : 5;
	const newValue = (localDiscount.value || 0) - step;
	localDiscount.value = newValue < 0 ? 0 : newValue;
	handleCartDiscountChange();
}
</script>
