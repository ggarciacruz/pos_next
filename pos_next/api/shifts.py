# Copyright (c) 2024, POS Next and contributors
# For license information, please see license.txt


import json

import frappe
from frappe import _
from frappe.utils import get_datetime, nowdate, nowtime

from pos_next.api.utilities import get_wallet_payment_modes


@frappe.whitelist()
def get_opening_dialog_data():
	"""Get data required for opening shift dialog"""
	data = {}

	# Get POS Profiles where current user is defined in POS Profile User table
	pos_profiles_data = frappe.db.sql(
		"""
		SELECT DISTINCT p.name, p.company, p.currency, p.warehouse, p.selling_price_list
		FROM `tabPOS Profile` p
		INNER JOIN `tabPOS Profile User` u ON u.parent = p.name
		WHERE p.disabled = 0 AND u.user = %s
		ORDER BY p.name
		""",
		frappe.session.user,
		as_dict=1,
	)

	data["pos_profiles_data"] = pos_profiles_data

	# Derive companies from accessible POS Profiles
	company_names = []
	for profile in pos_profiles_data:
		if profile.company and profile.company not in company_names:
			company_names.append(profile.company)
	data["companies"] = [{"name": c} for c in company_names]

	# Get payment methods for POS profiles (exclude wallet payment methods)
	pos_profiles_list = [p.name for p in pos_profiles_data]

	if pos_profiles_list:
		# Exclude wallet payment modes from opening balance
		wallet_modes = get_wallet_payment_modes()

		payment_filters = {"parent": ["in", pos_profiles_list]}
		if wallet_modes:
			payment_filters["mode_of_payment"] = ["not in", wallet_modes]

		data["payments_method"] = frappe.get_list(
			"POS Payment Method",
			filters=payment_filters,
			fields=["*"],
			limit_page_length=0,
			order_by="parent",
			ignore_permissions=True,
		)

		# Set currency from pos profile
		for mode in data["payments_method"]:
			mode["currency"] = frappe.get_cached_value("POS Profile", mode["parent"], "currency")
	else:
		data["payments_method"] = []

	return data


def _is_shift_management_enabled(pos_profile):
	"""Check whether shift management (opening/closing cash count) is enabled for a POS Profile."""
	if not pos_profile:
		return True
	try:
		val = frappe.db.get_value(
			"POS Settings",
			{"pos_profile": pos_profile, "enabled": 1},
			"enable_shift_management",
		)
		if val is None:
			return True
		return bool(int(val))
	except Exception:
		return True


def _is_shared_shift_enabled(pos_profile):
	"""Check whether open POS shifts are shared across all authorized users of this POS Profile."""
	if not pos_profile:
		return False
	try:
		from frappe.utils import cint
		from pos_next.api.constants import get_safe_pos_settings_dict

		settings = get_safe_pos_settings_dict(pos_profile, require_enabled=True)
		return bool(cint(settings.get("enable_shift_management", 1)) and cint(settings.get("share_open_shift_across_users")))
	except Exception:
		return False


def user_can_access_pos_profile(user, pos_profile):
	"""Return True if user is assigned to pos_profile or holds an elevated POS/system manager role."""
	if not user or user == "Guest" or not pos_profile:
		return False
	if frappe.db.exists("POS Profile User", {"parent": pos_profile, "user": user}):
		return True
	roles = set(frappe.get_roles(user))
	return bool(roles & {"System Manager", "Administrator", "Nexus POS Manager", "Sales Manager"})


def find_open_shift_for_profile(pos_profile):
	"""Return the latest open POS Opening Shift for a given POS Profile, or None."""
	if not pos_profile:
		return None
	rows = frappe.db.get_all(
		"POS Opening Shift",
		filters={
			"pos_profile": pos_profile,
			"pos_closing_shift": ["is", "not set"],
			"docstatus": 1,
			"status": "Open",
		},
		fields=["name", "pos_profile", "period_start_date", "status", "user"],
		order_by="period_start_date desc",
		limit=1,
	)
	return rows[0] if rows else None


def find_active_open_shift_for_user(user=None):
	"""
	Resolve active open POS Opening Shift for user:
	1) Own open shift (`user == session user`).
	2) Any open shift on an accessible enabled POS Profile configured with `share_open_shift_across_users`.
	"""
	if not user:
		user = frappe.session.user
	if not user or user == "Guest":
		return None

	own_shifts = frappe.db.get_all(
		"POS Opening Shift",
		filters={
			"user": user,
			"pos_closing_shift": ["is", "not set"],
			"docstatus": 1,
			"status": "Open",
		},
		fields=["name", "pos_profile", "period_start_date", "status", "user"],
		order_by="period_start_date desc",
		limit=1,
	)
	if own_shifts:
		return own_shifts[0]

	assigned_profiles = frappe.db.sql(
		"""
		SELECT p.name
		FROM `tabPOS Profile` p
		INNER JOIN `tabPOS Profile User` u ON u.parent = p.name
		WHERE p.disabled = 0 AND u.user = %s
		ORDER BY u.`default` DESC, p.name ASC
		""",
		(user,),
		as_dict=True,
	)
	for prof in assigned_profiles:
		if _is_shared_shift_enabled(prof.name):
			shared_shift = find_open_shift_for_profile(prof.name)
			if shared_shift:
				return shared_shift

	return None


def _build_shift_response(shift_name, as_dict=False):
	"""Build standard POS shift payload expected by frontend bootstrap and useShift."""
	shift_doc = frappe.get_doc("POS Opening Shift", shift_name)
	pos_profile_doc = frappe.get_doc("POS Profile", shift_doc.pos_profile)
	company_doc = frappe.get_doc("Company", pos_profile_doc.company)
	return {
		"pos_opening_shift": shift_doc.as_dict() if as_dict else shift_doc,
		"pos_profile": pos_profile_doc,
		"company": company_doc,
		"server_now": str(get_datetime()),
	}


def ensure_auto_open_shift_for_user(user=None):
	"""
	If the user has no open POS Opening Shift and their default/first accessible
	POS Profile has enable_shift_management = 0, automatically create and submit
	an open shift in the background so they enter the POS transparently.
	"""
	if not user:
		user = frappe.session.user
	if not user or user == "Guest":
		return None

	profiles = frappe.db.sql(
		"""
		SELECT p.name, p.company, u.`default` as is_default
		FROM `tabPOS Profile` p
		INNER JOIN `tabPOS Profile User` u ON u.parent = p.name
		WHERE p.disabled = 0 AND u.user = %s
		ORDER BY u.`default` DESC, p.name ASC
		""",
		(user,),
		as_dict=True,
	)
	if not profiles:
		return None

	target_profile = profiles[0]
	if _is_shift_management_enabled(target_profile.name):
		return None

	payment_methods = frappe.get_all(
		"POS Payment Method",
		filters={"parent": target_profile.name},
		fields=["mode_of_payment"],
		order_by="idx asc",
	)
	balance_details = [
		{"mode_of_payment": m.mode_of_payment, "amount": 0}
		for m in payment_methods
	]

	new_pos_opening = frappe.get_doc(
		{
			"doctype": "POS Opening Shift",
			"period_start_date": get_datetime(),
			"posting_date": nowdate(),
			"posting_time": nowtime(),
			"user": user,
			"pos_profile": target_profile.name,
			"company": target_profile.company,
			"status": "Open",
			"balance_details": balance_details,
		}
	)
	new_pos_opening.insert(ignore_permissions=True)
	new_pos_opening.submit()
	frappe.db.commit()
	return new_pos_opening


@frappe.whitelist()
def check_opening_shift(user=None):
	"""Check if user has an active own or shared open shift."""
	if not user:
		user = frappe.session.user

	shift_data = find_active_open_shift_for_user(user)
	if not shift_data:
		auto_shift = ensure_auto_open_shift_for_user(user)
		if not auto_shift:
			return None
		shift_data = {"name": auto_shift.name}

	return _build_shift_response(shift_data["name"], as_dict=False)


@frappe.whitelist()
def create_opening_shift(
	pos_profile,
	company,
	balance_details,
	opening_denominations=None,
	usd_exchange_rate=6.96,
	opening_observations=None,
):
	"""Create a new POS Opening Shift (or return existing shared open shift on same profile)."""
	from frappe.utils import cint, flt

	if frappe.session.user == "Guest":
		frappe.throw(_("Autenticación requerida"), frappe.AuthenticationError)
	if not user_can_access_pos_profile(frappe.session.user, pos_profile):
		frappe.throw(
			_("No tiene acceso al Perfil de POS {0}.").format(pos_profile),
			frappe.PermissionError,
		)

	balance_details = json.loads(balance_details) if isinstance(balance_details, str) else balance_details
	if isinstance(opening_denominations, str):
		opening_denominations = json.loads(opening_denominations) if opening_denominations.strip() else []
	opening_denominations = opening_denominations or []

	shift_mgmt_enabled = _is_shift_management_enabled(pos_profile)

	if not shift_mgmt_enabled:
		# Continuous mode (no shift closing/reconciliation):
		# Reuse existing open shift for this profile (updating period_start_date to make it active),
		# or create a new open shift if the user has never opened this profile before.
		existing_for_profile = frappe.db.get_all(
			"POS Opening Shift",
			filters={
				"user": frappe.session.user,
				"pos_profile": pos_profile,
				"pos_closing_shift": ["is", "not set"],
				"docstatus": 1,
				"status": "Open",
			},
			fields=["name"],
			order_by="period_start_date desc",
			limit=1,
		)
		if existing_for_profile:
			shift_name = existing_for_profile[0]["name"]
			frappe.db.set_value("POS Opening Shift", shift_name, "period_start_date", get_datetime())
			frappe.db.commit()
			return _build_shift_response(shift_name, as_dict=True)
	else:
		# If another authorized cashier already opened this shared register, join it idempotently
		if _is_shared_shift_enabled(pos_profile):
			shared_open = find_open_shift_for_profile(pos_profile)
			if shared_open:
				return _build_shift_response(shared_open["name"], as_dict=True)

		# Standard check: user must not already have another open shift
		existing_shift = check_opening_shift(frappe.session.user)
		if existing_shift:
			frappe.throw(
				_("You already have an open shift: {0}").format(existing_shift["pos_opening_shift"].name)
			)

	formatted_denominations = []
	for row in opening_denominations:
		qty = cint(row.get("quantity") or 0)
		val = flt(row.get("denomination_value") or 0)
		if qty > 0 and val > 0:
			formatted_denominations.append(
				{
					"currency": row.get("currency") or "BOB",
					"denomination_type": row.get("denomination_type") or "Billete",
					"denomination_value": val,
					"quantity": qty,
					"subtotal": round(qty * val, 2),
				}
			)

	new_pos_opening = frappe.get_doc(
		{
			"doctype": "POS Opening Shift",
			"period_start_date": get_datetime(),
			"posting_date": nowdate(),
			"posting_time": nowtime(),
			"user": frappe.session.user,
			"pos_profile": pos_profile,
			"company": company,
			"status": "Open",
			"usd_exchange_rate": flt(usd_exchange_rate or 6.96),
			"opening_observations": (opening_observations or "").strip(),
		}
	)

	# Add balance details - map opening_amount to amount
	formatted_balance_details = []
	for detail in balance_details:
		formatted_balance_details.append(
			{"mode_of_payment": detail.get("mode_of_payment"), "amount": detail.get("opening_amount", 0)}
		)

	new_pos_opening.set("balance_details", formatted_balance_details)
	if formatted_denominations:
		new_pos_opening.set("opening_denominations", formatted_denominations)
	new_pos_opening.insert(ignore_permissions=True)
	new_pos_opening.submit()

	data = {}
	data["pos_opening_shift"] = new_pos_opening.as_dict()
	data["pos_profile"] = frappe.get_doc("POS Profile", pos_profile)
	data["company"] = frappe.get_doc("Company", company)
	data["server_now"] = str(get_datetime())

	return data


@frappe.whitelist()
def get_closing_shift_data(opening_shift):
	"""Get data for closing shift"""
	from pos_next.pos_next.doctype.pos_closing_shift.pos_closing_shift import make_closing_shift_from_opening

	try:
		# Get the opening shift document
		opening_shift_doc = frappe.get_doc("POS Opening Shift", opening_shift)

		# Convert to dict with proper datetime serialization
		opening_shift_dict = opening_shift_doc.as_dict()
		opening_shift_json = json.dumps(opening_shift_dict, default=str)

		# Create closing shift from opening shift (returns a dict)
		closing_data = make_closing_shift_from_opening(opening_shift_json)

		# Ensure datetime values are JSON serializable
		return json.loads(json.dumps(closing_data, default=str))
	except Exception as e:
		frappe.log_error(frappe.get_traceback(), "Get Closing Shift Data Error")
		frappe.throw(_("Error getting closing shift data: {0}").format(str(e)))


@frappe.whitelist()
def submit_closing_shift(closing_shift):
	"""Submit closing shift"""
	from pos_next.pos_next.doctype.pos_closing_shift.pos_closing_shift import (
		submit_closing_shift as submit_shift,
	)

	try:
		# closing_shift is already a JSON string from frontend
		# If it's a dict, convert to JSON string
		if isinstance(closing_shift, dict):
			closing_shift = json.dumps(closing_shift)

		result = submit_shift(closing_shift)
		shift_vals = (
			frappe.db.get_value(
				"POS Closing Shift",
				result,
				["difference_journal_entry", "expense_journal_entry", "cash_difference_amount"],
				as_dict=True,
			)
			or {}
		)
		return {"name": result, "status": "success", **shift_vals}
	except Exception as e:
		frappe.log_error(frappe.get_traceback(), "Submit Closing Shift Error")
		frappe.throw(_("Error submitting closing shift: {0}").format(str(e)))
