// workOrdersModel.js
//
// Shared constants and helper functions for work order data.
// Import from here instead of duplicating across components.

export const WORK_ORDER_STATUS_LABELS = {
    open: "Åpen",
    quotation: "Tilbud",
    valuation: "Takst",
    finished: "Ferdig",
    paid: "Betalt",
    deleted: "Slettet",
};

export const WORK_ORDER_STATUS_COLORS = {
    open: "warning",
    finished: "primary",
    paid: "success",
    deleted: "danger",
};

/**
 * Returns a human-readable label for a bike object.
 * @param {object|null} bike
 * @returns {string}
 */
export function bikeLabel(bike) {
    if (!bike) return "–";
    const ref = bike.license_plate || bike.vin || "Ingen regnr/vin";
    return `${bike.model_year || ""} ${bike.make || ""} ${bike.model || ""} (${ref})`.trim();
}
