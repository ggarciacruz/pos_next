<template>
	<MdxUserMenu
		:userName="userName"
		:userRole="profileName || ''"
		:profileImage="profileImage || ''"
		:logoutLabel="__('Logout')"
		@logout="$emit('logout')"
		@menu-opened="$emit('menu-opened')"
		@menu-closed="
			showLanguageDropdown = false;
			$emit('menu-closed');
		"
	>
		<template #menu-items="{ close }">
			<div class="py-1" @click="close()">
				<slot name="menu-items"></slot>
			</div>
			<hr v-if="showDivider" class="my-1 border-slate-100" />
			<div @click="close()">
				<slot name="additional-actions"></slot>
			</div>
		</template>

		<template #additional-actions="{ close }">
			<!-- Language Switcher (Inside User Menu on all devices) -->
			<div class="border-t border-slate-100">
				<button
					type="button"
					@click.stop="showLanguageDropdown = !showLanguageDropdown"
					class="w-full text-start px-3.5 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
				>
					<svg
						class="w-4 h-4 text-slate-500"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
						/>
					</svg>
					<span class="flex-1">{{ __("Language") }}</span>
					<div class="flex items-center gap-2">
						<img
							:src="supportedLocales[locale]?.flagUrlSvg"
							:alt="supportedLocales[locale]?.name"
							class="w-5 h-3.5 object-cover rounded-sm shadow-sm"
						/>
						<svg
							class="w-3.5 h-3.5 text-slate-400 transition-transform"
							:class="{ 'rotate-180': showLanguageDropdown }"
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
					</div>
				</button>

				<div v-if="showLanguageDropdown" class="bg-slate-50 border-t border-slate-100">
					<button
						v-for="(config, code) in supportedLocales"
						:key="code"
						type="button"
						@click.stop="handleLanguageChange(code, close)"
						class="w-full text-start px-4 py-2 text-xs font-semibold flex items-center gap-3 transition-colors"
						:class="
							locale === code
								? 'bg-blue-50 text-blue-700'
								: 'text-slate-600 hover:bg-slate-100'
						"
					>
						<img
							:src="config.flagUrlSvg"
							:alt="config.name"
							class="w-5 h-3.5 object-cover rounded-sm shadow-sm ms-5"
						/>
						<span class="flex-1">{{ config.nativeName }}</span>
						<svg
							v-if="locale === code"
							class="w-3.5 h-3.5 text-blue-600"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path
								fill-rule="evenodd"
								d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
								clip-rule="evenodd"
							/>
						</svg>
					</button>
				</div>
			</div>
		</template>
	</MdxUserMenu>
</template>

<script setup>
import { ref } from "vue";
import { MdxUserMenu } from "mdx_ui";
import { useLocale } from "@/composables/useLocale";

const { locale, supportedLocales, changeLocale } = useLocale();

defineProps({
	userName: {
		type: String,
		required: true,
	},
	profileName: {
		type: String,
		default: null,
	},
	profileImage: {
		type: String,
		default: null,
	},
	showLogout: {
		type: Boolean,
		default: true,
	},
	showDivider: {
		type: Boolean,
		default: true,
	},
});

defineEmits(["logout", "menu-opened", "menu-closed"]);

const showLanguageDropdown = ref(false);

async function handleLanguageChange(code, closeFn) {
	if (code === locale.value) {
		return;
	}
	if (typeof closeFn === "function") closeFn();
	await changeLocale(code);
}
</script>
