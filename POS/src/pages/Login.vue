<template>
	<div class="mdx-login" :class="{ 'mdx-login--mounted': mounted }">
		<!-- Background -->
		<div class="mdx-login__bg">
			<div class="mdx-login__bg-gradient" />
			<div class="mdx-login__orb mdx-login__orb--1" />
			<div class="mdx-login__orb mdx-login__orb--2" />
		</div>

		<!-- Hero section — Logo & Brand -->
		<div class="mdx-login__hero">
			<div class="mdx-login__logo-wrap">
				<div class="mdx-login__logo-inner">
					<img
						:src="'/assets/pos_next/pos/icon.svg'"
						alt="MDX POS"
						class="mdx-login__logo-img"
					/>
				</div>
			</div>

			<h1 class="mdx-login__title">MDX POS</h1>
			<p class="mdx-login__subtitle">{{ __("Punto de Venta & Gestión Comercial") }}</p>
		</div>

		<!-- Form sheet -->
		<div class="mdx-login__sheet">
			<div class="mdx-login__sheet-handle" />

			<div class="mb-5 hidden lg:block">
				<h2 class="text-xl font-extrabold text-slate-900 tracking-tight">
					{{ __("Iniciar Sesión") }}
				</h2>
				<p class="mt-1 text-xs font-medium text-slate-500">
					{{ __("Ingrese sus credenciales para acceder al punto de venta") }}
				</p>
			</div>

			<form class="mdx-login__form" @submit.prevent="submit">
				<!-- Email / Username -->
				<div class="mdx-login__field">
					<svg
						width="18"
						height="18"
						class="mdx-login__field-icon"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<rect x="2" y="4" width="20" height="16" rx="3" />
						<path d="m2 7 10 6 10-6" />
					</svg>
					<input
						v-model="loginForm.email"
						required
						name="email"
						type="text"
						autocomplete="username"
						:placeholder="__('Usuario o correo electrónico')"
						:disabled="isBusy"
					/>
				</div>

				<!-- Password -->
				<div class="mdx-login__field">
					<svg
						width="18"
						height="18"
						class="mdx-login__field-icon"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<rect x="3" y="11" width="18" height="11" rx="2" />
						<path d="M7 11V7a5 5 0 0110 0v4" />
						<circle cx="12" cy="16" r="1" />
					</svg>
					<input
						v-model="loginForm.password"
						required
						name="password"
						:type="showPassword ? 'text' : 'password'"
						autocomplete="current-password"
						:placeholder="__('Contraseña')"
						:disabled="isBusy"
						class="mdx-login__input-password"
					/>
					<button
						type="button"
						@click="showPassword = !showPassword"
						class="mdx-login__eye-btn"
						:disabled="isBusy"
						tabindex="-1"
						:aria-label="
							showPassword ? __('Ocultar contraseña') : __('Mostrar contraseña')
						"
					>
						<FeatherIcon
							:name="showPassword ? 'eye-off' : 'eye'"
							class="h-4.5 w-4.5"
							:stroke-width="2"
						/>
					</button>
				</div>

				<!-- Error message -->
				<Transition
					enter-active-class="mdx-login__error-enter"
					enter-from-class="mdx-login__error-from"
				>
					<div v-if="session.login.error" class="mdx-login__error">
						<svg
							width="16"
							height="16"
							class="shrink-0"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
						>
							<path
								d="m21.73 18-8-14a2 2 0 00-3.48 0l-8 14A2 2 0 004 21h16a2 2 0 001.73-3Z"
							/>
							<line x1="12" y1="9" x2="12" y2="13" />
							<line x1="12" y1="17" x2="12.01" y2="17" />
						</svg>
						<span>{{
							session.login.error.messages
								? session.login.error.messages.join("\n")
								: __("Credenciales inválidas")
						}}</span>
					</div>
				</Transition>

				<!-- Submit button -->
				<button
					type="submit"
					:disabled="isBusy"
					class="mdx-login__submit mdx-pressable"
				>
					<svg
						v-if="isBusy"
						width="20"
						height="20"
						class="mdx-login__spinner"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
					>
						<path d="M21 12a9 9 0 1 1-6.219-8.56" />
					</svg>
					<span>{{
						isBusy ? __("Iniciando sesión...") : __("Iniciar Sesión")
					}}</span>
					<svg
						v-if="!isBusy"
						width="20"
						height="20"
						class="mdx-login__arrow"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="round"
					>
						<path d="M5 12h14m-6-6 6 6-6 6" />
					</svg>
				</button>
			</form>

			<!-- Footer -->
			<div class="mdx-login__footer">
				<div class="mdx-login__powered">
					Powered by <strong>Mandox</strong>
				</div>
			</div>
		</div>

		<!-- Shift Opening Dialog -->
		<ShiftOpeningDialog
			v-model="showShiftDialog"
			@shift-opened="handleShiftOpened"
			@dialog-closed="handleDialogClosed"
		/>
	</div>
</template>

<script setup>
import { FeatherIcon } from "frappe-ui";
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import ShiftOpeningDialog from "../components/ShiftOpeningDialog.vue";
import { session } from "../data/session";
import { useBootstrapStore } from "../stores/bootstrap";
import { useSessionLock } from "../composables/useSessionLock";
import { cleanupUserSession } from "../utils/sessionCleanup";
import { ensureCSRFToken } from "../utils/csrf";
import { offlineWorker } from "../utils/offline/workerClient";
import { logger } from "@/utils/logger";

const log = logger.create("Login");

const router = useRouter();
const bootstrapStore = useBootstrapStore();
const { cachePasswordHashFromLogin } = useSessionLock();

const loginForm = reactive({
	email: "",
	password: "",
});

const showShiftDialog = ref(false);
const showPassword = ref(false);
const mounted = ref(false);
const isRedirecting = ref(false);
const isBusy = computed(() => session.login.loading || isRedirecting.value);

function proceedAfterAuth() {
	const preloadedShift = bootstrapStore.getPreloadedShift();
	const preloadedSettings = bootstrapStore.getPreloadedPOSSettings();
	if (preloadedShift && preloadedSettings && Number(preloadedSettings.enable_shift_management ?? 1) === 0) {
		router.push({ name: "POSSale" });
		return;
	}
	isRedirecting.value = false;
	showShiftDialog.value = true;
}

// Reset state when login page mounts
onMounted(async () => {
	setTimeout(() => {
		mounted.value = true;
	}, 100);

	// Clear any login errors
	if (session.login.error) {
		session.login.reset();
	}

	// Only clear state if user is NOT logged in
	// If user is already logged in (e.g., after successful login or remount), open shift dialog
	if (!session.isLoggedIn) {
		loginForm.email = "";
		loginForm.password = "";
		showPassword.value = false;
		isRedirecting.value = false;
		showShiftDialog.value = false;
		await cleanupUserSession();
	} else {
		proceedAfterAuth();
	}
});

function submit() {
	if (!loginForm.email || !loginForm.password || isBusy.value) {
		return;
	}

	isRedirecting.value = true;
	session.login.submit({
		email: loginForm.email.trim(),
		password: loginForm.password,
	});
}

// Reset redirecting flag if login fails
watch(
	() => session.login.error,
	(err) => {
		if (err) {
			isRedirecting.value = false;
		}
	}
);

// Watch for successful login
watch(
	() => session.isLoggedIn,
	async (isLoggedIn) => {
		if (isLoggedIn) {
			// Initialize CSRF token after successful login
			try {
				log.info("User logged in, initializing CSRF token...");
				await ensureCSRFToken();

				// Sync CSRF token to worker for background API calls
				if (window.csrf_token) {
					await offlineWorker.setCSRFToken(window.csrf_token);
				}
			} catch (error) {
				log.error("Failed to initialize CSRF token after login:", error);
			}

			// Cache password hash for offline session unlock
			await cachePasswordHashFromLogin(loginForm.password);

			// Enter POS directly if shift management is disabled and shift is ready, otherwise open shift dialog
			proceedAfterAuth();
		}
	}
);

// Watch for dialog being closed via X button (v-model update)
// When user closes dialog without action, navigate to POSSale
watch(showShiftDialog, (isOpen, wasOpen) => {
	// Only navigate if dialog was open and is now closed, and user is logged in
	if (wasOpen === true && isOpen === false && session.isLoggedIn) {
		router.push({ name: "POSSale" });
	}
});

function handleShiftOpened() {
	// Navigate to POS sale after shift is opened
	router.push({ name: "POSSale" });
}

function handleDialogClosed({ reason }) {
	// Navigate to /pos when dialog is cancelled or resumed
	// "cancelled" means user closed dialog without action
	// "resumed" means user chose to resume existing shift
	// In both cases, navigate to POSSale (existing shift will be active)
	if (reason === "cancelled" || reason === "resumed") {
		router.push({ name: "POSSale" });
	}
}

// Clear error when user starts typing
watch([() => loginForm.email, () => loginForm.password], () => {
	if (session.login.error) {
		session.login.reset();
	}
});
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════════════════════════
   MDX Unified Login — Mobile-first responsive login (aligned with MdxLoginPage)
   ═══════════════════════════════════════════════════════════════════════════ */

.mdx-login {
	height: 100vh;
	height: 100dvh;
	width: 100%;
	display: flex;
	flex-direction: column;
	position: relative;
	overflow: hidden;
	font-family: var(--mdx-font-family, system-ui, -apple-system, sans-serif);
}

/* ── Background ───────────────────────────────────────────────────────── */
.mdx-login__bg {
	position: absolute;
	inset: 0;
}

.mdx-login__bg-gradient {
	position: absolute;
	inset: 0;
	background: linear-gradient(
		160deg,
		var(--mdx-primary, #0050ff) 0%,
		color-mix(in srgb, var(--mdx-primary, #0050ff), black 40%) 50%,
		color-mix(in srgb, var(--mdx-primary-dark, #1e40af), black 30%) 100%
	);
}

.mdx-login__orb {
	position: absolute;
	border-radius: 50%;
	filter: blur(80px);
	pointer-events: none;
	opacity: 0.3;
}
.mdx-login__orb--1 {
	top: -10%;
	right: -15%;
	width: 300px;
	height: 300px;
	background: color-mix(in srgb, var(--mdx-primary, #0050ff), white 30%);
	animation: mdx-login-orb1 12s ease-in-out infinite alternate;
}
.mdx-login__orb--2 {
	bottom: 15%;
	left: -20%;
	width: 250px;
	height: 250px;
	background: color-mix(in srgb, var(--mdx-primary, #0050ff), blue 30%);
	animation: mdx-login-orb2 10s ease-in-out infinite alternate;
}

@keyframes mdx-login-orb1 {
	to {
		transform: translate(-30px, 20px) scale(1.15);
	}
}
@keyframes mdx-login-orb2 {
	to {
		transform: translate(25px, -15px) scale(1.1);
	}
}

/* ── Hero section ──────────────────────────────────────────────────────── */
.mdx-login__hero {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	position: relative;
	z-index: 10;
	padding: 0 var(--mdx-space-8, 32px);
	min-height: 0;
}

.mdx-login__logo-wrap {
	width: 88px;
	height: 88px;
	background: rgba(255, 255, 255, 0.1);
	backdrop-filter: blur(24px);
	-webkit-backdrop-filter: blur(24px);
	border-radius: 26px;
	padding: 10px;
	border: 1px solid rgba(255, 255, 255, 0.18);
	box-shadow: 0 16px 40px rgba(0, 0, 0, 0.25);
	animation: mdx-login-pop 0.6s ease-out;
}

.mdx-login__logo-inner {
	width: 100%;
	height: 100%;
	border-radius: 18px;
	overflow: hidden;
	display: flex;
	align-items: center;
	justify-content: center;
}
.mdx-login__logo-img {
	width: 100%;
	height: 100%;
	object-fit: contain;
}
@keyframes mdx-login-pop {
	from {
		opacity: 0;
		transform: scale(0.7);
	}
	to {
		opacity: 1;
		transform: scale(1);
	}
}

.mdx-login__title {
	margin-top: var(--mdx-space-4, 16px);
	font-size: 26px;
	font-weight: 900;
	color: white;
	letter-spacing: 0.02em;
	text-align: center;
}

.mdx-login__subtitle {
	margin-top: 6px;
	font-size: 9px;
	font-weight: 700;
	color: rgba(255, 255, 255, 0.55);
	text-transform: uppercase;
	letter-spacing: 0.35em;
	text-align: center;
}

/* ── Form sheet (mobile: bottom sheet) ─────────────────────────────────── */
.mdx-login__sheet {
	position: relative;
	z-index: 20;
	background: var(--mdx-bg-surface, white);
	border-radius: var(--mdx-radius-xl, 32px) var(--mdx-radius-xl, 32px) 0 0;
	padding: 20px 28px max(env(safe-area-inset-bottom, 16px), 16px);
	box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.15);
	animation: mdx-login-slide 0.45s ease-out 0.2s both;
}
@keyframes mdx-login-slide {
	from {
		transform: translateY(30px);
		opacity: 0;
	}
	to {
		transform: translateY(0);
		opacity: 1;
	}
}

.mdx-login__sheet-handle {
	width: 40px;
	height: 4px;
	background: var(--mdx-border-color, #e2e8f0);
	border-radius: 4px;
	margin: 0 auto var(--mdx-space-4, 16px);
}

.mdx-login__form {
	display: flex;
	flex-direction: column;
	gap: var(--mdx-space-3, 12px);
}

/* ── Input fields ──────────────────────────────────────────────────────── */
.mdx-login__field {
	position: relative;
}

.mdx-login__field input {
	width: 100%;
	padding: 14px 16px 14px 48px;
	border-radius: var(--mdx-radius-lg, 16px);
	border: 1.5px solid var(--mdx-border-color, #f1f5f9);
	background: var(--mdx-bg-surface-hover, #f8fafc);
	font-size: 15px;
	font-weight: 600;
	color: var(--mdx-text-primary, #0f172a);
	outline: none;
	transition: all 0.2s;
	font-family: inherit;
}
.mdx-login__field input.mdx-login__input-password {
	padding-right: 44px;
}
.mdx-login__field input::placeholder {
	color: var(--mdx-text-muted, #94a3b8);
	font-weight: 500;
}
.mdx-login__field input:focus {
	background: var(--mdx-bg-surface, white);
	border-color: var(--mdx-accent, #4f46e5);
	box-shadow: 0 0 0 3px var(--mdx-accent-glow, rgba(79, 70, 229, 0.1));
}

.mdx-login__field-icon {
	position: absolute;
	left: 16px;
	top: 50%;
	transform: translateY(-50%);
	width: 18px;
	height: 18px;
	color: var(--mdx-text-muted, #94a3b8);
	pointer-events: none;
}

.mdx-login__eye-btn {
	position: absolute;
	right: 12px;
	top: 50%;
	transform: translateY(-50%);
	padding: 6px;
	color: var(--mdx-text-muted, #94a3b8);
	background: transparent;
	border: none;
	cursor: pointer;
	border-radius: 8px;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: color 0.15s ease;
}
.mdx-login__eye-btn:hover {
	color: var(--mdx-text-primary, #0f172a);
}

/* ── Error ─────────────────────────────────────────────────────────────── */
.mdx-login__error {
	display: flex;
	align-items: center;
	gap: var(--mdx-space-2, 8px);
	background: var(--mdx-danger-light, #fef2f2);
	border: 1px solid rgba(239, 68, 68, 0.2);
	border-radius: var(--mdx-radius-md, 14px);
	padding: 10px 14px;
	font-size: 13px;
	font-weight: 700;
	color: var(--mdx-danger, #dc2626);
}

.mdx-login__error-enter {
	transition: all 0.2s ease;
}
.mdx-login__error-from {
	opacity: 0;
	transform: translateY(-6px);
}

/* ── Submit button ─────────────────────────────────────────────────────── */
.mdx-login__submit {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 10px;
	width: 100%;
	padding: 15px 24px;
	border-radius: var(--mdx-radius-lg, 16px);
	background: var(--mdx-accent, #4f46e5);
	color: var(--mdx-accent-text, white);
	font-size: 15px;
	font-weight: 900;
	border: none;
	cursor: pointer;
	box-shadow: 0 8px 24px var(--mdx-accent-glow, rgba(79, 70, 229, 0.3));
	transition: all 0.15s;
	margin-top: 2px;
	font-family: inherit;
}
.mdx-login__submit:hover:not(:disabled) {
	background: var(--mdx-accent-hover, #4338ca);
	transform: translateY(-1px);
	box-shadow: 0 12px 32px var(--mdx-accent-glow, rgba(79, 70, 229, 0.4));
}
.mdx-login__submit:active:not(:disabled) {
	transform: scale(0.97);
}
.mdx-login__submit:disabled {
	opacity: 0.65;
	cursor: not-allowed;
}

.mdx-login__spinner {
	width: 20px;
	height: 20px;
	animation: mdx-spin 0.6s linear infinite;
}
@keyframes mdx-spin {
	to {
		transform: rotate(360deg);
	}
}
.mdx-login__arrow {
	width: 20px;
	height: 20px;
	opacity: 0.4;
}

/* ── Footer ────────────────────────────────────────────────────────────── */
.mdx-login__footer {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4px;
	margin-top: var(--mdx-space-3, 12px);
}

.mdx-login__powered {
	font-size: 10px;
	color: var(--mdx-text-muted, #94a3b8);
}
.mdx-login__powered strong {
	color: var(--mdx-text-secondary, #64748b);
}

/* ═══════════════════════════════════════════════════════════════════════════
   TABLET (≥ 768px) — Centered card layout
   ═══════════════════════════════════════════════════════════════════════════ */
@media (min-width: 768px) {
	.mdx-login {
		align-items: center;
		justify-content: center;
	}
	.mdx-login__hero {
		flex: none;
		padding: 0 32px 24px;
	}
	.mdx-login__sheet {
		max-width: 420px;
		width: 100%;
		border-radius: var(--mdx-radius-xl, 32px);
		margin-bottom: 32px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	}
	.mdx-login__sheet-handle {
		display: none;
	}
}

/* ═══════════════════════════════════════════════════════════════════════════
   DESKTOP (≥ 1024px) — Split layout: hero left + form right
   ═══════════════════════════════════════════════════════════════════════════ */
@media (min-width: 1024px) {
	.mdx-login {
		flex-direction: row;
		align-items: stretch;
		justify-content: stretch;
	}

	.mdx-login__hero {
		flex: 1;
		padding: var(--mdx-space-8, 32px);
		justify-content: center;
	}
	.mdx-login__logo-wrap {
		width: 96px;
		height: 96px;
	}
	.mdx-login__title {
		font-size: 32px;
	}
	.mdx-login__subtitle {
		font-size: 10px;
		letter-spacing: 0.4em;
	}

	.mdx-login__sheet {
		width: 440px;
		max-width: 440px;
		height: 100vh;
		height: 100dvh;
		border-radius: 0;
		margin-bottom: 0;
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: var(--mdx-space-10, 40px) var(--mdx-space-8, 32px);
		box-shadow: -12px 0 40px rgba(0, 0, 0, 0.1);
		animation: mdx-login-slide-right 0.45s ease-out 0.2s both;
	}
	.mdx-login__sheet-handle {
		display: none;
	}

	.mdx-login__field input {
		padding: 16px 16px 16px 48px;
		font-size: 14px;
	}
	.mdx-login__submit {
		padding: 16px 24px;
	}
}

@keyframes mdx-login-slide-right {
	from {
		transform: translateX(30px);
		opacity: 0;
	}
	to {
		transform: translateX(0);
		opacity: 1;
	}
}

/* ═══════════════════════════════════════════════════════════════════════════
   WIDE DESKTOP (≥ 1280px)
   ═══════════════════════════════════════════════════════════════════════════ */
@media (min-width: 1280px) {
	.mdx-login__sheet {
		width: 480px;
		max-width: 480px;
		padding: var(--mdx-space-12, 48px) var(--mdx-space-10, 40px);
	}
}
</style>
