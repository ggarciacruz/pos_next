<template>
	<button @click="$emit('click', $event)" :title="title" :class="buttonClasses" class="relative">
		<svg :class="iconClasses" :fill="iconFill" stroke="currentColor" viewBox="0 0 24 24">
			<path
				:stroke-linecap="strokeLinecap"
				:stroke-linejoin="strokeLinejoin"
				:stroke-width="strokeWidth"
				:d="icon"
			/>
		</svg>
		<span
			v-if="badge"
			class="absolute -top-1 -end-1 bg-orange-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center"
		>
			{{ badge }}
		</span>
	</button>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
	icon: {
		type: String,
		required: true,
	},
	title: {
		type: String,
		default: "",
	},
	variant: {
		type: String,
		default: "gray", // gray, green, orange, red, blue
		validator: (value) => ["gray", "green", "orange", "red", "blue"].includes(value),
	},
	size: {
		type: String,
		default: "md", // sm, md, lg
		validator: (value) => ["sm", "md", "lg"].includes(value),
	},
	badge: {
		type: [String, Number],
		default: null,
	},
	iconFill: {
		type: String,
		default: "none",
	},
	strokeLinecap: {
		type: String,
		default: "round",
	},
	strokeLinejoin: {
		type: String,
		default: "round",
	},
	strokeWidth: {
		type: String,
		default: "2",
	},
	animate: {
		type: Boolean,
		default: false,
	},
});

defineEmits(["click"]);

const buttonClasses = computed(() => {
	const base =
		"app-nav-btn group touch-manipulation";
	const animation = props.animate ? "animate-pulse" : "";
	return `${base} ${animation}`.trim();
});

const iconClasses = computed(() => {
	const sizes = {
		sm: "w-3.5 h-3.5 sm:w-4 sm:h-4",
		md: "w-[17px] h-[17px]",
		lg: "w-5 h-5 sm:w-6 sm:h-6",
	};

	const variants = {
		gray: "text-slate-700 group-hover:text-slate-900",
		green: "text-green-600",
		orange: "text-orange-600",
		red: "text-red-600",
		blue: "text-blue-600",
	};

	return `${sizes[props.size]} ${variants[props.variant]}`;
});
</script>
