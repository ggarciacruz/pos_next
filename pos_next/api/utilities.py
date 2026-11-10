# Copyright (c) 2024, POS Next and contributors
# For license information, please see license.txt


import json

import frappe
from frappe import _
from frappe.utils import cint


@frappe.whitelist(allow_guest=True)
def get_csrf_token():
	"""
	Get CSRF token for the current session.
	Only returns CSRF token if user is authenticated with a valid session.

	Security checks:
	- User must be authenticated (not Guest)
	- Session must be valid
	- User must be enabled
	"""
	if (
		frappe.session.user == "Guest"
		or not frappe.session.sid
		or frappe.session.sid == "Guest"
	):
		return {"csrf_token": None, "session_id": "Guest", "authenticated": False}

	if not frappe.db.get_value("User", frappe.session.user, "enabled"):
		return {"csrf_token": None, "session_id": "Guest", "authenticated": False}

	csrf_token = frappe.sessions.get_csrf_token()

	if not csrf_token:
		frappe.throw(_("Failed to generate CSRF token"), frappe.ValidationError)

	return {
		"csrf_token": csrf_token,
		"session_id": frappe.session.sid,
		"user": frappe.session.user,
		"authenticated": True,
	}


def _parse_list_parameter(value, param_name="parameter"):
	"""
	Parse a list parameter that may come as JSON string or list.

	Args:
		value: Value to parse (string or list)
		param_name: Name of parameter for error messages

	Returns:
		list: Parsed list value
	"""
	if isinstance(value, str):
		try:
			value = value.strip()
			return json.loads(value) if value else []
		except json.JSONDecodeError as e:
			frappe.throw(_("Could not parse '{0}' as JSON: {1}").format(param_name, str(e)))

	if not isinstance(value, list):
		return []

	return value


def check_user_company():
	"""Check if the authenticated user has a company linked to them."""
	user = frappe.session.user

	permission = frappe.db.get_value(
		"User Permission", {"user": user, "allow": "Company"}, ["for_value"], as_dict=True
	)

	if permission:
		company_name = frappe.db.get_value("Company", permission.for_value, "company_name")
		return {"has_company": True, "company": company_name or ""}

	return {"has_company": False, "company": ""}


def get_wallet_payment_modes():
	"""
	Get list of Mode of Payment names that are marked as wallet payments.

	Returns:
		list: List of Mode of Payment names with is_wallet_payment=1
	"""
	return frappe.get_all("Mode of Payment", filters={"is_wallet_payment": 1}, pluck="name")


def is_wallet_payment_mode(mode_of_payment):
	"""
	Check if a Mode of Payment is a wallet payment.

	Args:
		mode_of_payment: Mode of Payment name

	Returns:
		bool: True if the mode is a wallet payment
	"""
	if not mode_of_payment:
		return False

	return cint(frappe.get_cached_value("Mode of Payment", mode_of_payment, "is_wallet_payment"))


POS_MANAGER_ROLES = (
	"System Manager",
	"Nexus POS Manager",
)


def user_is_pos_manager(user=None) -> bool:
	"""Return True if the user holds an administrative/management role for POS configuration and costing."""
	target_user = user or frappe.session.user
	if not target_user or target_user == "Guest":
		return False
	if target_user == "Administrator":
		return True
	roles = frappe.get_roles(target_user)
	return any(role in roles for role in POS_MANAGER_ROLES)


def user_can_view_cost_price(pos_profile=None, visibility_mode=None, user=None) -> bool:
	"""
	Evaluate whether the given user is allowed to view and edit cost/factory prices in POS.

	Modes supported on POS Settings (`cost_price_visibility`):
	- 'Managers Only' (default): Only users with management roles (`POS_MANAGER_ROLES`).
	- 'All Users': Any authenticated user assigned to the POS Profile.
	- 'Hidden': Hidden for everyone in the POS interface.
	"""
	target_user = user or frappe.session.user
	if not target_user or target_user == "Guest":
		return False

	mode = visibility_mode
	if not mode and pos_profile and frappe.db.has_column("POS Settings", "cost_price_visibility"):
		mode = frappe.db.get_value(
			"POS Settings", {"pos_profile": pos_profile, "enabled": 1}, "cost_price_visibility"
		)

	mode = (mode or "Managers Only").strip()
	if mode == "Hidden":
		return False
	if mode == "All Users":
		return True
	return user_is_pos_manager(target_user)


def clean_pos_profile_label(profile_name: str, company: str = None) -> str:
	"""Return a human-friendly POS Profile display label without trailing company abbreviation."""
	if not profile_name:
		return ""
	resolved_company = company or frappe.get_cached_value("POS Profile", profile_name, "company")
	if resolved_company:
		abbr = frappe.get_cached_value("Company", resolved_company, "abbr")
		suffix = f" - {abbr}" if abbr else ""
		if suffix and profile_name.endswith(suffix):
			return profile_name[: -len(suffix)].strip()
	return profile_name


def get_accessible_pos_profiles_for_scope(
	pos_profile: str, filter_profile: str = None, user: str = None
) -> list[str]:
	"""
	Determine the list of POS Profiles whose transactions should be visible in the current scope.

	Rules:
	- Non-manager users (cashiers) are strictly isolated to `[pos_profile]`.
	- Managers (`System Manager` / `Nexus POS Manager`) see all active POS Profiles of the
	  same Company that they have access to, or a single `[filter_profile]` when selected.
	"""
	if not pos_profile:
		frappe.throw(_("POS Profile is required"))

	target_user = user or frappe.session.user
	if not target_user or target_user == "Guest":
		frappe.throw(_("Authentication required"), frappe.AuthenticationError)

	company = frappe.db.get_value("POS Profile", pos_profile, "company")
	if not company:
		frappe.throw(_("POS Profile {0} does not exist").format(pos_profile))

	has_direct_access = bool(
		frappe.db.exists("POS Profile User", {"parent": pos_profile, "user": target_user})
	)
	is_manager = user_is_pos_manager(target_user)

	if not has_direct_access and not is_manager and not frappe.has_permission("Sales Invoice", "read"):
		frappe.throw(_("You don't have access to this POS Profile"), frappe.PermissionError)

	if not is_manager:
		return [pos_profile]

	roles = frappe.get_roles(target_user)
	if target_user == "Administrator" or "System Manager" in roles:
		accessible_profiles = frappe.get_all(
			"POS Profile",
			filters={"company": company, "disabled": 0},
			pluck="name",
			order_by="name asc",
		)
	else:
		rows = frappe.db.sql(
			"""
			SELECT DISTINCT p.name
			FROM `tabPOS Profile` p
			INNER JOIN `tabPOS Profile User` u ON u.parent = p.name
			WHERE p.company = %(company)s
				AND p.disabled = 0
				AND u.user = %(user)s
			ORDER BY p.name ASC
			""",
			{"company": company, "user": target_user},
			as_dict=True,
		)
		accessible_profiles = [r.name for r in rows]

	if pos_profile not in accessible_profiles:
		accessible_profiles.insert(0, pos_profile)

	cleaned_filter = (filter_profile or "").strip()
	if cleaned_filter and cleaned_filter.upper() != "ALL":
		if cleaned_filter not in accessible_profiles:
			frappe.throw(_("You don't have access to POS Profile {0}").format(cleaned_filter), frappe.PermissionError)
		return [cleaned_filter]

	return accessible_profiles


def enrich_invoices_with_scope_metadata(invoices: list, company: str = None) -> list:
	"""Batch-attach `owner_full_name` and `pos_profile_label` to invoice dicts."""
	if not invoices:
		return invoices

	owners = list({inv.get("owner") for inv in invoices if inv.get("owner")})
	owner_map = {}
	if owners:
		user_rows = frappe.get_all(
			"User",
			filters={"name": ["in", owners]},
			fields=["name", "full_name"],
		)
		owner_map = {u.name: (u.full_name or u.name) for u in user_rows}

	label_cache = {}
	for inv in invoices:
		prof = inv.get("pos_profile")
		if prof:
			if prof not in label_cache:
				label_cache[prof] = clean_pos_profile_label(prof, company=company)
			inv["pos_profile_label"] = label_cache[prof]
		owner = inv.get("owner")
		if owner:
			inv["owner_full_name"] = owner_map.get(owner) or owner.split("@")[0]

	return invoices
