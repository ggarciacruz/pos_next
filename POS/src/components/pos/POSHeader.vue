<template>
	<div class="pos-header-wrapper">
		<MdxNavbar
			class="pos-mdx-navbar"
			:class="{ 'pos-mdx-navbar--collapsed': navbarCollapsed }"
			:show-hamburger="hasOpenShift"
			logo="/assets/pos_next/pos/icon.svg"
			app-name="MANDOX POS"
			:subtitle="profileName"
			@toggle-menu="$emit('toggle-menu')"
			@toggle-collapse="toggleNavbar"
		>
			<template #left>
				<!-- Shift & Time Telemetry -->
				<div class="flex items-center gap-1.5 sm:gap-4 min-w-0">
					<!-- Time and Shift Duration - Desktop -->
					<div class="hidden lg:flex items-center gap-3 ms-2 flex-shrink-0">
						<!-- Current Time -->
						<StatusBadge
							variant="blue"
							size="sm"
							:icon="timeIcon"
							:text="currentTime"
						/>

						<!-- Shift Duration -->
						<StatusBadge
							v-if="hasOpenShift && shiftDuration"
							variant="green"
							size="xs"
							:icon="shiftIcon"
							:label="__('Shift Open:')"
							:value="shiftDuration"
						/>
					</div>

					<!-- Mobile Time Display - Compact -->
					<div
						class="flex lg:hidden items-center text-[10px] text-slate-600 font-semibold flex-shrink-0 ms-1"
					>
						<span class="hidden xs:inline whitespace-nowrap">{{ currentTime }}</span>
					</div>
				</div>
			</template>

			<!-- Empty center slot so #left and #right use full horizontal width -->
			<template #default>
				<span></span>
			</template>

			<template #right>
				<!-- WiFi/Offline Status (Unified 36x36px mdx_ui .app-nav-btn) -->
				<button
					type="button"
					@click="$emit('sync-click')"
					:class="[
						'app-nav-btn touch-manipulation',
						isSyncing ? 'animate-pulse' : '',
					]"
					:title="
						isOffline
							? __('Offline ({0} pending)', [pendingInvoicesCount])
							: __('Online - Click to sync')
					"
					:aria-label="
						isOffline ? __('Offline mode active') : __('Online mode active')
					"
				>
					<svg
						v-if="!isOffline"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M5 12.55a11 11 0 0 1 14.08 0" />
						<path d="M1.42 9a16 16 0 0 1 21.16 0" />
						<path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
						<circle cx="12" cy="20" r="1.5" fill="currentColor" />
					</svg>
					<svg
						v-else
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<line x1="2" y1="2" x2="22" y2="22" />
						<path d="M8.5 16.5a5 5 0 0 1 7 0" />
						<path d="M2 8.82a15 15 0 0 1 4.17-2.65" />
						<path d="M10.66 5c4.01-.36 8.14.9 11.34 3.82" />
						<path d="M5.5 12.5a10 10 0 0 1 3.5-2" />
						<line x1="12" y1="20" x2="12.01" y2="20" />
					</svg>
					<span
						v-if="pendingInvoicesCount > 0"
						class="app-nav-badge"
					>
						{{ pendingInvoicesCount }}
					</span>
					<span
						v-else
						class="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ring-1 ring-white"
						:class="isOffline ? 'bg-amber-500' : 'bg-emerald-500'"
					></span>
				</button>

				<!-- Cache Status Indicator (Unified 36x36px mdx_ui .app-nav-btn) -->
				<div class="relative inline-flex items-center">
					<button
						type="button"
						@click="showCacheTooltip = !showCacheTooltip"
						@blur="handleBlur"
						class="app-nav-btn touch-manipulation"
						:title="getCacheAriaLabel()"
						:aria-label="getCacheAriaLabel()"
					>
						<svg
							v-if="cacheSyncing || isRefreshing"
							class="animate-spin"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							viewBox="0 0 24 24"
						>
							<path d="M21 12a9 9 0 1 1-6.219-8.56" />
						</svg>
						<svg
							v-else
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<ellipse cx="12" cy="5" rx="9" ry="3" />
							<path d="M3 5V19A9 3 0 0 0 21 19V5" />
							<path d="M3 12A9 3 0 0 0 21 12" />
						</svg>
						<span
							v-if="cacheSyncing && cacheStats?.items > 0"
							class="absolute -bottom-1 -end-1 bg-amber-500 text-white text-[8px] font-bold rounded-full px-1 min-w-[18px] h-3.5 flex items-center justify-center shadow-xs animate-pulse"
							:title="__('Syncing: {0} items', [formatNumber(cacheStats.items)])"
						>
							{{ formatCompactNumber(cacheStats.items) }}
						</span>
						<span
							v-else
							class="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ring-1 ring-white"
							:class="getCacheDotClass()"
						></span>
					</button>

						<!-- Tooltip -->
						<div
							v-if="showCacheTooltip"
							@mousedown.prevent
							class="absolute top-full mt-2 z-[999] w-[90vw] max-w-[240px] sm:max-w-[260px]"
							:style="{ left: '50%', transform: 'translateX(-50%)' }"
						>
							<div
								class="bg-gray-900 text-white text-xs rounded-lg shadow-xl py-2 px-2.5 sm:px-3"
							>
								<!-- Arrow -->
								<div class="absolute bottom-full mb-px left-1/2 -translate-x-1/2">
									<div
										class="border-[5px] sm:border-4 border-transparent border-b-gray-900"
									></div>
								</div>

								<!-- Header -->
								<div
									class="flex items-center justify-between mb-1.5 sm:mb-2 pb-1.5 sm:pb-2 border-b border-gray-700"
								>
									<span class="font-semibold text-[11px] sm:text-xs">{{
										__("Cache")
									}}</span>
									<span
										class="px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold uppercase"
										:class="getCacheStatusBadgeClass()"
									>
										{{ getCacheStatus() }}
									</span>
								</div>

								<!-- Sync Progress Banner (shown during sync) -->
								<div
									v-if="cacheSyncing"
									class="mb-2 p-2 bg-orange-500/20 rounded-lg"
								>
									<div class="flex items-center gap-2 mb-1.5">
										<svg
											class="w-4 h-4 animate-spin text-orange-400"
											fill="none"
											viewBox="0 0 24 24"
										>
											<circle
												class="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												stroke-width="4"
											></circle>
											<path
												class="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
											></path>
										</svg>
										<span class="text-orange-300 font-semibold text-[11px]">{{
											__("Syncing for offline...")
										}}</span>
									</div>
									<div class="text-center">
										<span class="text-white font-bold text-lg">{{
											formatNumber(cacheStats?.items || 0)
										}}</span>
										<span class="text-gray-400 text-[10px] ms-1">{{
											__("items cached")
										}}</span>
									</div>
									<div class="mt-1.5 text-[9px] text-gray-400 text-center">
										{{ __("Barcode scanning works for cached items") }}
									</div>
								</div>

								<!-- Stats -->
								<div class="flex flex-col gap-1 sm:gap-1.5 text-[10px] sm:text-xs">
									<div class="flex items-center justify-between">
										<span class="text-gray-400">{{ __("Items:") }}</span>
										<span class="font-semibold">{{
											formatNumber(cacheStats?.items || 0)
										}}</span>
									</div>
									<div
										v-if="cacheStats?.lastSync"
										class="flex items-center justify-between"
									>
										<span class="text-gray-400">{{ __("Last Sync:") }}</span>
										<span class="font-semibold text-[9px] sm:text-[10px]">{{
											formatLastSync()
										}}</span>
									</div>
									<div
										v-if="!cacheSyncing && stockSyncActive"
										class="flex items-center justify-between"
									>
										<span class="text-gray-400">{{ __("Auto-Sync:") }}</span>
										<span
											class="text-green-400 font-semibold flex items-center gap-1"
										>
											<div
												class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"
											></div>
											{{ __("Active") }}
										</span>
									</div>
								</div>

								<!-- Clear Cache Button -->
								<div
									class="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-gray-700"
								>
									<button
										@click="handleClearCacheClick"
										:disabled="isOffline"
										:class="[
											'w-full px-2 py-1.5 sm:py-2 rounded transition-colors font-semibold text-[10px] sm:text-[11px] flex items-center justify-center gap-1.5',
											isOffline
												? 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
												: 'bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 active:scale-95',
										]"
										:title="
											isOffline
												? __('Cannot clear cache while offline')
												: __('Clear all cached data')
										"
									>
										<svg
											class="w-2.5 h-2.5 sm:w-3 sm:h-3"
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
										{{ __("Clear Cache") }}
									</button>
								</div>
							</div>
						</div>
					</div>

					<!-- Printer - Visible only when QZ Tray Silent Print is enabled -->
					<div v-if="hasOpenShift && silentPrintEnabled" class="hidden md:block relative">
						<ActionButton
							:icon="printerIcon"
							:title="
								qzConnected
									? __('Silent Print: Connected')
									: __('Silent Print: Disconnected')
							"
							@click="$emit('printer-click')"
						/>
						<span
							class="absolute top-0.5 end-0.5 w-2 h-2 rounded-full border border-white"
							:class="qzConnected ? 'bg-green-500' : 'bg-red-500'"
						></span>
					</div>

					<!-- Refresh -->
					<ActionButton
						:icon="refreshIcon"
						:title="isRefreshing ? __('Refreshing...') : __('Refresh')"
						@click="$emit('refresh-click')"
						:class="[
							'touch-manipulation',
							isRefreshing ? 'animate-spin' : '',
						]"
						:aria-label="
							isRefreshing ? __('Refreshing...') : __('Refresh items and customers')
						"
					/>

					<!-- User Menu -->
					<UserMenu
						:user-name="userName"
						:profile-name="profileName"
						:profile-image="userImage"
						@logout="$emit('logout')"
						@menu-opened="$emit('menu-opened')"
						@menu-closed="$emit('menu-closed')"
					>
						<template #menu-items>
							<slot name="menu-items"></slot>
						</template>
						<template #additional-actions>
							<slot name="additional-actions"></slot>
						</template>
					</UserMenu>
			</template>
		</MdxNavbar>

		<!-- Floating indicator to expand the navbar when collapsed -->
		<transition name="mdx-slide-down">
			<button
				v-if="navbarCollapsed"
				class="pos-navbar-expand-trigger"
				@click="toggleNavbar"
				:aria-label="__('Expand navbar')"
				:title="__('Expandir barra superior')"
			>
				<svg
					width="12"
					height="12"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="3.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="m6 9 6 6 6-6" />
				</svg>
				<span v-if="isOffline" class="pos-navbar-expand-dot"></span>
			</button>
		</transition>
	</div>
</template>

<script setup>
import ActionButton from "@/components/common/ActionButton.vue";
import StatusBadge from "@/components/common/StatusBadge.vue";
import UserMenu from "@/components/common/UserMenu.vue";
import { DEFAULT_LOCALE } from "@/utils/currency";
import MdxNavbar from "mdx_ui/components/MdxNavbar.vue";
import { onMounted, ref } from "vue";

const showCacheTooltip = ref(false);
const navbarCollapsed = ref(false);

const emit = defineEmits([
	"sync-click",
	"printer-click",
	"refresh-click",
	"menu-click",
	"toggle-menu",
	"logout",
	"menu-opened",
	"menu-closed",
	"clear-cache",
]);

function updateCssVariable() {
	if (typeof document !== "undefined") {
		const heightVal = navbarCollapsed.value ? "0px" : "4rem";
		document.documentElement.style.setProperty("--mdx-navbar-height", heightVal);
		document.documentElement.style.setProperty("--header-height", heightVal);
	}
}

function toggleNavbar() {
	navbarCollapsed.value = !navbarCollapsed.value;
	updateCssVariable();
	try {
		localStorage.setItem("pos_navbar_collapsed", navbarCollapsed.value ? "1" : "0");
	} catch {}
}

onMounted(() => {
	try {
		const saved = localStorage.getItem("pos_navbar_collapsed");
		if (saved !== null) {
			navbarCollapsed.value = saved === "1";
		}
	} catch {}
	updateCssVariable();
});

function handleClearCacheClick() {
	showCacheTooltip.value = false;
	emit("clear-cache");
}

function handleBlur(event) {
	// Don't close if clicking inside the tooltip
	if (!event.relatedTarget || !event.currentTarget.parentElement.contains(event.relatedTarget)) {
		setTimeout(() => {
			showCacheTooltip.value = false;
		}, 200);
	}
}

const props = defineProps({
	currentTime: {
		type: String,
		required: true,
	},
	shiftDuration: {
		type: String,
		default: null,
	},
	hasOpenShift: {
		type: Boolean,
		default: false,
	},
	profileName: {
		type: String,
		default: null,
	},
	userName: {
		type: String,
		required: true,
	},
	userImage: {
		type: String,
		default: null,
	},
	isOffline: {
		type: Boolean,
		default: false,
	},
	isSyncing: {
		type: Boolean,
		default: false,
	},
	pendingInvoicesCount: {
		type: Number,
		default: 0,
	},
	isAnyDialogOpen: {
		type: Boolean,
		default: false,
	},
	cacheSyncing: {
		type: Boolean,
		default: false,
	},
	cacheStats: {
		type: Object,
		default: () => ({ items: 0, lastSync: null }),
	},
	stockSyncActive: {
		type: Boolean,
		default: false,
	},
	isRefreshing: {
		type: Boolean,
		default: false,
	},
	silentPrintEnabled: {
		type: Boolean,
		default: false,
	},
	qzConnected: {
		type: Boolean,
		default: false,
	},
});

// Cache status helpers
function getCacheDotClass() {
	if (!props.cacheStats || props.cacheStats.items === 0) {
		return "bg-red-500"; // Red: No cache
	}
	if (props.cacheSyncing || props.isRefreshing) {
		return "bg-amber-500"; // Amber: Syncing in progress
	}
	return "bg-emerald-500"; // Emerald Green: Cache ready
}

function getCacheStatus() {
	if (!props.cacheStats || props.cacheStats.items === 0) {
		return __("Empty");
	}
	if (props.cacheSyncing) {
		return __("Syncing");
	}
	return __("Ready");
}

function getCacheStatusBadgeClass() {
	if (!props.cacheStats || props.cacheStats.items === 0) {
		return "bg-red-500/20 text-red-300";
	}
	if (props.cacheSyncing) {
		return "bg-orange-500/20 text-orange-300";
	}
	return "bg-green-500/20 text-green-300";
}

function formatLastSync() {
	if (!props.cacheStats?.lastSync) {
		return __("Never");
	}
	const date = new Date(props.cacheStats.lastSync);
	return date.toLocaleTimeString(DEFAULT_LOCALE, {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});
}

function getCacheAriaLabel() {
	if (!props.cacheStats || props.cacheStats.items === 0) {
		return __("Cache empty");
	}
	if (props.cacheSyncing) {
		return __("Cache syncing");
	}
	return __("Cache ready");
}

function formatNumber(num) {
	if (!num) return "0";
	return num.toLocaleString();
}

function formatCompactNumber(num) {
	if (!num) return "0";
	if (num >= 1000) {
		return (num / 1000).toFixed(num >= 10000 ? 0 : 1) + "K";
	}
	return num.toString();
}

// SVG Path Icons
const timeIcon = "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z";
const shiftIcon =
	"M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z";
const printerIcon =
	"M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z";
const refreshIcon =
	"M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15";
</script>

<style scoped>
.pos-header-wrapper {
	position: relative;
	flex-shrink: 0;
	z-index: var(--mdx-z-navbar, 300);
}

.pos-mdx-navbar {
	transition: transform var(--mdx-duration-base, 250ms) cubic-bezier(0.16, 1, 0.3, 1),
		height var(--mdx-duration-base, 250ms) cubic-bezier(0.16, 1, 0.3, 1);
}

.pos-mdx-navbar--collapsed {
	height: 0 !important;
	min-height: 0 !important;
	max-height: 0 !important;
	overflow: hidden !important;
	padding-top: 0 !important;
	padding-bottom: 0 !important;
	border-bottom: none !important;
	opacity: 0;
	pointer-events: none;
}

.pos-navbar-expand-trigger {
	position: fixed;
	top: 0;
	left: 50%;
	transform: translateX(-50%);
	z-index: 900;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 38px;
	height: 18px;
	border-radius: 0 0 10px 10px;
	background: var(--mdx-bg-surface, #ffffff);
	border: 1px solid var(--mdx-border-strong, #bfcad8);
	border-top: none;
	color: var(--mdx-text-secondary, #475569);
	box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08);
	cursor: pointer;
	transition: all 0.18s ease;
}

.pos-navbar-expand-trigger:hover {
	color: var(--mdx-accent, #0050ff);
	height: 22px;
}

.pos-navbar-expand-dot {
	position: absolute;
	top: 3px;
	right: 6px;
	width: 6px;
	height: 6px;
	border-radius: 9999px;
	background: #f59e0b;
}
</style>
