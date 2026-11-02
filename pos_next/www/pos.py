# Copyright (c) 2026, Mandox and contributors
# For license information, please see license.txt

import frappe


def get_context(context):
	context.no_cache = 1
	context.disable_website_theme = True
	session_user = getattr(frappe.session, "user", None) or "Guest"
	context.session_user = session_user

	if session_user == "Guest" and hasattr(frappe.local, "cookie_manager"):
		try:
			req_cookies = getattr(frappe.request, "cookies", {}) or {}
			if req_cookies.get("user_id") and req_cookies.get("user_id") != "Guest":
				frappe.local.cookie_manager.delete_cookie(
					["full_name", "user_id", "sid", "user_image", "system_user"]
				)
		except Exception:
			pass

	csrf_token = ""
	if session_user != "Guest":
		try:
			csrf_token = frappe.sessions.get_csrf_token() or ""
		except Exception:
			csrf_token = ""

	context.boot = {
		"csrf_token": csrf_token,
		"session_user": session_user,
		"sitename": getattr(frappe.local, "site", ""),
	}

	return context
