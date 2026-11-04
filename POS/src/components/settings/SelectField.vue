<template>
	<div class="p-2 rounded-xl hover:bg-slate-50 transition-colors">
		<label class="block text-sm font-medium text-slate-900 mb-1">
			{{ label }}
		</label>
		<MdxSelect
			:modelValue="modelValue"
			@update:modelValue="$emit('update:modelValue', $event)"
			:options="options"
			:placeholder="__('-- Select --')"
			:teleport="true"
		/>
		<p v-if="description" class="text-xs text-slate-500 mt-1 leading-tight">
			{{ description }}
		</p>
	</div>
</template>

<script setup>
import { MdxSelect } from "mdx_ui";

defineProps({
	modelValue: {
		type: [String, Number],
		default: "",
	},
	label: {
		type: String,
		required: true,
	},
	description: {
		type: String,
		default: "",
	},
	options: {
		type: Array,
		default: () => [],
	},
});

defineEmits(["update:modelValue"]);
</script>
