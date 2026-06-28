import {
	deleteDraft,
	getDraftsCount,
	saveDraft,
	getAllDrafts,
	updateDraft,
} from "@/utils/draftManager";
import { useToast } from "@/composables/useToast";
import { defineStore } from "pinia";
import { ref } from "vue";
import { call } from "@/utils/apiWrapper";
import { isOffline } from "@/utils/offline";
import { usePOSShiftStore } from "./posShift";

export const usePOSDraftsStore = defineStore("posDrafts", () => {
	// Use custom toast
	const { showSuccess, showError, showWarning } = useToast();
	const shiftStore = usePOSShiftStore();

	// State
	const draftsCount = ref(0);
	const drafts = ref([]);

	// Actions
	async function updateDraftsCount() {
		try {
			if (!isOffline()) {
				await loadDrafts();
			} else {
				draftsCount.value = await getDraftsCount();
			}
		} catch (error) {
			console.error("Error getting drafts count:", error);
		}
	}

	async function loadDrafts() {
		try {
			if (!isOffline()) {
				const shiftName = shiftStore.currentShift?.name;
				if (shiftName) {
					const serverDrafts = await call("pos_next.api.invoices.get_draft_invoices", {
						pos_opening_shift: shiftName
					});
					drafts.value = (serverDrafts || []).map(draft => ({
						draft_id: draft.name,
						customer: draft.customer,
						created_at: draft.creation,
						items: (draft.items || []).map(item => ({
							item_code: item.item_code,
							item_name: item.item_name,
							rate: item.rate,
							price_list_rate: item.price_list_rate,
							quantity: item.qty || item.quantity,
							uom: item.uom,
							stock_uom: item.stock_uom || item.uom,
							custom_medida: item.custom_medida || "",
							image: item.image,
							so_detail: item.name, // Link to Sales Order Item child row ID
						})),
						applied_offers: draft.applied_offers || [],
					}));
					draftsCount.value = drafts.value.length;
					return;
				}
			}
			
			// Fallback to local
			drafts.value = await getAllDrafts();
			draftsCount.value = drafts.value.length;
		} catch (error) {
			console.error("Error loading drafts:", error);
			// Fallback to local
			drafts.value = await getAllDrafts();
			draftsCount.value = drafts.value.length;
		}
	}

	async function saveDraftInvoice(
		invoiceItems,
		customer,
		posProfile,
		appliedOffers = [],
		draftId = null
	) {
		if (invoiceItems.length === 0) {
			showWarning(__("Cannot save an empty cart as draft"));
			return null;
		}

		if (!customer) {
			showWarning(__("Please select a customer before saving a pre-sale"));
			return null;
		}

		try {
			if (!isOffline()) {
				const today = new Date().toISOString().split("T")[0];
				const formattedItems = invoiceItems.map(item => ({
					item_code: item.item_code,
					item_name: item.item_name,
					qty: item.quantity,
					rate: item.rate,
					price_list_rate: item.price_list_rate,
					uom: item.uom,
					custom_medida: item.custom_medida || "",
					delivery_date: today, // Required for Sales Order Item
				}));

				const invoiceData = {
					doctype: "Sales Order",
					pos_profile: posProfile,
					posa_pos_opening_shift: shiftStore.currentShift?.name,
					customer: customer?.name || customer,
					items: formattedItems,
					delivery_date: today, // Required for Sales Order
					transaction_date: today, // Required for Sales Order
				};

				// If we are updating an existing server draft
				if (draftId && !draftId.startsWith("DRAFT-")) {
					invoiceData.name = draftId;
				}

				const result = await call("pos_next.api.invoices.update_invoice", {
					data: invoiceData
				});

				const serverDoc = result?.data || result;
				if (!serverDoc || !serverDoc.name) {
					throw new Error("Invalid server draft response");
				}

				const savedDraft = {
					draft_id: serverDoc.name,
					customer: serverDoc.customer,
					created_at: serverDoc.creation,
					items: invoiceItems,
					applied_offers: appliedOffers,
				};

				await loadDrafts();
				showSuccess(__("Invoice saved as draft successfully"));
				return savedDraft;
			} else {
				const draftData = {
					pos_profile: posProfile,
					customer: customer,
					items: invoiceItems,
					applied_offers: appliedOffers,
				};

				let savedDraft;
				if (draftId && draftId.startsWith("DRAFT-")) {
					savedDraft = await updateDraft(draftId, draftData);
				} else {
					savedDraft = await saveDraft(draftData);
				}

				await loadDrafts();
				showSuccess(__("Invoice saved as draft successfully"));
				return savedDraft;
			}
		} catch (error) {
			console.error("Error saving draft:", error);
			const errorMsg = error.message || error.messages?.[0] || error.exception || __("Failed to save draft");
			showError(errorMsg);
			return null;
		}
	}

	async function loadDraft(draft) {
		try {
			showSuccess(__("Draft invoice loaded successfully"));

			return {
				items: (draft.items || []).map(item => ({
					...item,
					so_detail: item.so_detail,
				})),
				customer: draft.customer,
				applied_offers: draft.applied_offers || [],
			};
		} catch (error) {
			console.error("Error loading draft:", error);
			showError(__("Failed to load draft"));
			throw error;
		}
	}

	async function deleteDraftById(draftId) {
		try {
			if (!isOffline() && !draftId.startsWith("DRAFT-")) {
				await call("pos_next.api.invoices.delete_invoice", {
					invoice: draftId
				});
			} else {
				await deleteDraft(draftId);
			}
			await loadDrafts();
			showSuccess(__("Draft deleted successfully"));
		} catch (error) {
			console.error("Error deleting draft:", error);
			showError(__("Failed to delete draft"));
		}
	}

	return {
		// State
		draftsCount,
		drafts,

		// Actions
		updateDraftsCount,
		loadDrafts,
		saveDraftInvoice,
		loadDraft,
		deleteDraft: deleteDraftById,
	};
});
