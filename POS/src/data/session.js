import router from "@/router";
import { createResource } from "frappe-ui";
import { computed, reactive } from "vue";

import { ensureCSRFToken } from "@/utils/csrf";
import { cleanupUserSession } from "@/utils/sessionCleanup";
import { initTranslations } from "@/utils/translation";
import { useBootstrapStore } from "@/stores/bootstrap";
import { userResource, userData } from "./user";

export function sessionUser() {
	const cookies = new URLSearchParams(document.cookie.split("; ").join("&"));
	let _sessionUser = cookies.get("user_id");
	if (_sessionUser === "Guest") {
		_sessionUser = null;
	}
	return _sessionUser;
}

export const session = reactive({
	login: createResource({
		url: "login",
		makeParams({ email, password }) {
			return {
				usr: email,
				pwd: password,
			};
		},
		async onSuccess(data) {
			const bootstrapStore = useBootstrapStore();
			bootstrapStore.reset();

			// Initialize CSRF token immediately after successful login
			await ensureCSRFToken({ forceRefresh: true });

			await userResource.reload();

			// Refresh userData from cookies after login
			// The auto-refresh interval will also pick this up, but we do it immediately for responsiveness
			userData.refresh();

			// Load server translations and fresh bootstrap BEFORE flipping session.user
			// so <router-view :key="translationVersion" /> does not destroy Login.vue
			// while ShiftOpeningDialog is opening.
			await Promise.allSettled([
				initTranslations(),
				bootstrapStore.loadInitialData(),
			]);

			session.user = sessionUser() || userResource.data || null;
			session.login.reset();
		},
		onError(error) {
			console.error("Login error:", error);
		},
	}),
	logout: createResource({
		url: "logout",
		async onSuccess() {
			userResource.reset();
			session.user = null;
			await router.replace({ name: "Login" });
			await cleanupUserSession();
		},
		async onError(error) {
			console.error("Logout error:", error);
			// Even if logout fails on server, clear local session
			userResource.reset();
			session.user = null;
			await router.replace({ name: "Login" });
			await cleanupUserSession();
		},
	}),
	user: sessionUser(),
	isLoggedIn: computed(() => !!session.user),
});
