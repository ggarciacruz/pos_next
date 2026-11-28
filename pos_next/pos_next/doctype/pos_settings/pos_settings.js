// Copyright (c) 2024, BrainWise and contributors
// For license information, please see license.txt

frappe.ui.form.on("POS Settings", {
	refresh(frm) {
		// Set query for loyalty program filtered by POS Profile company
		frm.set_query("default_loyalty_program", function () {
			if (!frm.doc.__company) {
				return { filters: {} };
			}
			return {
				filters: {
					company: frm.doc.__company,
				},
			};
		});

		const company_account_query = function () {
			const filters = { is_group: 0 };
			if (frm.doc.__company) {
				filters.company = frm.doc.__company;
			}
			return { filters };
		};
		frm.set_query("cash_shortage_account", company_account_query);
		frm.set_query("cash_overage_account", company_account_query);

		// Fetch company when form loads
		if (frm.doc.pos_profile) {
			fetch_pos_profile_company(frm);
		}
	},

	pos_profile(frm) {
		const prev_company = frm.doc.__company || null;
		// Clear loyalty program when POS Profile changes
		frm.set_value("default_loyalty_program", "");
		frm.doc.__company = null;

		if (frm.doc.pos_profile) {
			frappe.db.get_value("POS Profile", frm.doc.pos_profile, "company", (r) => {
				if (r && r.company) {
					frm.doc.__company = r.company;
					if (prev_company && prev_company !== r.company) {
						frm.set_value("cash_shortage_account", "");
						frm.set_value("cash_overage_account", "");
					}
				}
			});
		} else {
			frm.set_value("cash_shortage_account", "");
			frm.set_value("cash_overage_account", "");
		}
	},
});

function fetch_pos_profile_company(frm) {
	frappe.db.get_value("POS Profile", frm.doc.pos_profile, "company", (r) => {
		if (r && r.company) {
			frm.doc.__company = r.company;
		}
	});
}
