/**
 * POS Next - Application Entry Point
 *
 * Initialization sequence:
 * 1. Register PWA service worker
 * 2. Configure Vue app with plugins and global components
 * 3. Authenticate user and initialize CSRF token (in parallel)
 * 4. Preload bootstrap data for faster page rendering
 * 5. Register router and mount app
 */

import { createPinia } from "pinia";
import { createApp } from "vue";

import App from "./App.vue";
import { session, sessionUser } from "./data/session";
import { userResource } from "./data/user";
import router from "./router";
import {
	createCSRFAwareRequest,
	ensureCSRFToken,
	getCSRFTokenFromCookie,
	onCSRFTokenRefresh,
} from "./utils/csrf";
import { logger } from "./utils/logger";
import { offlineWorker } from "./utils/offline/workerClient";
import translationPlugin from "./utils/translation";
import { initSocket } from "./socket";

import {
	Alert,
	Badge,
	Button,
	Dialog,
	ErrorMessage,
	FormControl,
	Input,
	TextInput,
	frappeRequest,
	pageMetaPlugin,
	resourcesPlugin,
	setConfig,
} from "frappe-ui";

// MDX UI — Shared design tokens, utilities, and operational theme
import "mdx_ui/styles/tokens.css";
import "mdx_ui/styles/breakpoints.css";
import "mdx_ui/styles/transitions.css";
import "mdx_ui/styles/utilities.css";
import "mdx_ui/themes/operational.css";

import "./index.css";

import { installMdxUI } from "mdx_ui";

const log = logger.create("Main");

// =============================================================================
// PWA Service Worker Registration
// =============================================================================

if ("serviceWorker" in navigator) {
	window.addEventListener(
		"load",
		() => {
			import("virtual:pwa-register").then(({ registerSW }) => {
				registerSW({
					immediate: true,
					onNeedRefresh: () => log.info("New content available, reloading..."),
					onOfflineReady: () => log.info("App ready to work offline"),
					onRegistered: (reg) => log.info("Service Worker registered", reg),
					onRegisterError: (err) => log.error("Service Worker registration error", err),
				});
			});
		},
		{ passive: true }
	);
}

// =============================================================================
// Global Components (available in all templates without import)
// =============================================================================

const globalComponents = {
	Button,
	TextInput,
	Input,
	FormControl,
	ErrorMessage,
	Dialog,
	Alert,
	Badge,
};

// =============================================================================
// CSRF Token Management
// =============================================================================

/** Sync CSRF token to offline worker for authenticated API calls */
async function syncCSRFTokenToWorker() {
	if (window.csrf_token && typeof window.csrf_token === "string") {
		try {
			await offlineWorker.setCSRFToken(window.csrf_token);
			log.debug("CSRF token synced to worker");
		} catch (error) {
			log.warn("Failed to sync CSRF token to worker", error);
		}
	}
}

// =============================================================================
// Application Initialization
// =============================================================================

async function initializeApp() {
	const app = createApp(App);
	const pinia = createPinia();

	// Keep worker in sync when CSRF token refreshes
	onCSRFTokenRefresh((newToken) => {
		offlineWorker.setCSRFToken(newToken).catch((error) => {
			log.warn("Failed to sync refreshed CSRF token to worker", error);
		});
	});

	// Enable automatic CSRF token refresh on 401/403 errors
	const csrfAwareFrappeRequest = createCSRFAwareRequest(frappeRequest);
	setConfig("resourceFetcher", csrfAwareFrappeRequest);

	// Register core plugins (defer translationPlugin until CSRF token is ready)
	app.use(pinia);
	app.use(resourcesPlugin);
	app.use(pageMetaPlugin);

	// Register global components
	for (const key in globalComponents) {
		app.component(key, globalComponents[key]);
	}
	installMdxUI(app);

	// Disable double-tap zoom on mobile for faster touch response
	app.directive("touch-action", {
		mounted: (el) => (el.style.touchAction = "manipulation"),
	});

	// -------------------------------------------------------------------------
	// Authentication: If the browser has a non-Guest user_id cookie, verify the
	// server session and refresh CSRF token via GET first so no subsequent POST
	// requests trigger HTTP 400/403 errors. When unauthenticated (Guest), skip
	// all authenticated API calls until login succeeds.
	// -------------------------------------------------------------------------

	let user = null;
	if (sessionUser()) {
		let csrfReady = false;
		try {
			log.debug("Fetching fresh CSRF token via GET...");
			csrfReady = await ensureCSRFToken({ forceRefresh: true, silent: true });
			if (csrfReady) {
				await syncCSRFTokenToWorker();
			}
		} catch {
			log.debug("CSRF fetch failed, will retry on first API call");
		}

		if (csrfReady) {
			try {
				if (!userResource.loading) {
					await userResource.fetch();
				} else {
					await userResource.promise;
				}
				user = sessionUser();
			} catch (error) {
				log.debug("User not logged in", error?.message || "No session");
				user = null;
			}
		}
	}

	session.user = user;
	log.info(`User authenticated: ${session.user}`);

	// Initialize translation plugin after session state is resolved
	app.use(translationPlugin);

	// -------------------------------------------------------------------------
	// Bootstrap Preload (non-blocking, improves perceived performance)
	// -------------------------------------------------------------------------

	if (user) {
		import("./stores/bootstrap")
			.then(async ({ useBootstrapStore }) => {
				const bootstrapStore = useBootstrapStore();
				try {
					await bootstrapStore.loadInitialData();
					// Initialize precision settings from bootstrap data
					const { initPrecision } = await import("./utils/currency");
					initPrecision(bootstrapStore.getPreloadedPrecision());
					log.debug("Precision settings initialized from bootstrap");

					// Initialize Socket.IO with correct site name from bootstrap
					if (typeof window !== "undefined") {
						if (!window.frappe) window.frappe = {};
						const siteName = bootstrapStore.getSiteName();
						window.frappe.realtime = initSocket(siteName);

						// Ensure connection is established
						if (
							window.frappe.realtime &&
							typeof window.frappe.realtime.connect === "function"
						) {
							window.frappe.realtime.connect();
							log.info("Socket initialized and connecting...", { siteName });
						}
					}
				} catch (error) {
					log.debug("Bootstrap preload failed (non-critical)", error);
				}
			})
			.catch(() => {});
	}

	// -------------------------------------------------------------------------
	// Mount Application
	// -------------------------------------------------------------------------

	log.debug("Registering router, auth state:", session.isLoggedIn);
	app.use(router);
	app.mount("#app");

	// -------------------------------------------------------------------------
	// Scheduled CSRF Token Refresh (every 30 minutes)
	// -------------------------------------------------------------------------

	setInterval(async () => {
		log.debug("Scheduled CSRF token refresh");
		await ensureCSRFToken({ forceRefresh: true, silent: true });
		await syncCSRFTokenToWorker();
	}, 30 * 60 * 1000);
}

initializeApp();
