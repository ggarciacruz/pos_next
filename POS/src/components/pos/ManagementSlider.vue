<template>
	<!-- Desktop MDX Sidebar -->
	<MdxSidebar
		:items="sidebarItems"
		:bottom-items="bottomItems"
		:model-value="activeItem"
		:collapsed="sidebarCollapsed"
		logo="/assets/pos_next/pos/icon.svg"
		app-name="MDX POS"
		:user="userInfo"
		@update:model-value="handleMenuClick"
		@update:collapsed="sidebarCollapsed = $event"
		@logout="$emit('logout')"
	/>

	<!-- Mobile Sidebar Drawer Overlay -->
	<transition name="mdx-drawer-fade">
		<div
			v-if="mobileMenuOpen"
			class="pos-mdx-drawer-backdrop"
			@click="$emit('update:mobileMenuOpen', false)"
		>
			<div class="pos-mdx-drawer" @click.stop>
				<MdxSidebar
					:items="mobileSidebarItems"
					:model-value="activeItem"
					:collapsed="false"
					logo="/assets/pos_next/pos/icon.svg"
					app-name="MDX POS"
					:user="userInfo"
					is-mobile
					class="pos-mdx-drawer-sidebar"
					@update:model-value="handleMobileMenuClick"
					@update:collapsed="() => {}"
					@logout="$emit('logout')"
				/>
			</div>
		</div>
	</transition>
</template>

<script setup>
import MdxSidebar from "mdx_ui/components/MdxSidebar.vue";
import { computed, ref } from "vue";

const props = defineProps({
	activeItem: {
		type: String,
		default: "pos",
	},
	mobileMenuOpen: {
		type: Boolean,
		default: false,
	},
	userName: {
		type: String,
		default: "",
	},
	profileName: {
		type: String,
		default: "",
	},
});

const emit = defineEmits(["menu-clicked", "update:mobileMenuOpen", "logout"]);

const sidebarCollapsed = ref(true);

const userInfo = computed(() => ({
	fullName: props.userName || "Cajero POS",
	role: props.profileName || "Punto de Venta",
}));

const sidebarItems = computed(() => [
	{
		id: "pos",
		label: __("Punto de Venta"),
		shortLabel: __("Caja"),
		icon: "home",
	},
	{
		id: "invoices",
		label: __("Gestión de Ventas"),
		shortLabel: __("Ventas"),
		icon: "ledger",
	},
	{
		id: "products",
		label: __("Stock y Productos"),
		shortLabel: __("Stock"),
		icon: "box",
	},
	{
		id: "promotions",
		label: __("Promociones"),
		shortLabel: __("Promos"),
		icon: "tag",
	},
]);

const bottomItems = computed(() => [
	{
		id: "settings",
		label: __("Configuración POS"),
		shortLabel: __("Ajustes"),
		icon: "settings",
	},
]);

const mobileSidebarItems = computed(() => [
	...sidebarItems.value,
	...bottomItems.value,
]);

function handleMenuClick(menuItem) {
	emit("menu-clicked", menuItem);
}

function handleMobileMenuClick(menuItem) {
	emit("update:mobileMenuOpen", false);
	emit("menu-clicked", menuItem);
}
</script>

<style scoped>
.pos-mdx-drawer-backdrop {
	position: fixed;
	inset: 0;
	background: rgba(15, 23, 42, 0.55);
	backdrop-filter: blur(4px);
	-webkit-backdrop-filter: blur(4px);
	z-index: 950;
	display: flex;
}

.pos-mdx-drawer {
	width: 280px;
	max-width: 85vw;
	height: 100%;
	background: var(--mdx-bg-surface, #ffffff);
	box-shadow: 20px 0 40px rgba(0, 0, 0, 0.25);
	display: flex;
	flex-direction: column;
}

.pos-mdx-drawer-sidebar {
	display: flex !important;
	width: 100% !important;
	height: 100% !important;
}

.mdx-drawer-fade-enter-active,
.mdx-drawer-fade-leave-active {
	transition: opacity 0.22s ease;
}
.mdx-drawer-fade-enter-active .pos-mdx-drawer,
.mdx-drawer-fade-leave-active .pos-mdx-drawer {
	transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.mdx-drawer-fade-enter-from,
.mdx-drawer-fade-leave-to {
	opacity: 0;
}
.mdx-drawer-fade-enter-from .pos-mdx-drawer,
.mdx-drawer-fade-leave-to .pos-mdx-drawer {
	transform: translateX(-100%);
}
</style>
