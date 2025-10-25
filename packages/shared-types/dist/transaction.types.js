"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReturnReason = exports.ReturnStatus = exports.ReturnType = exports.PurchaseStatus = exports.SaleStatus = void 0;
// ===================================
// Sales Interfaces
// ===================================
var SaleStatus;
(function (SaleStatus) {
    SaleStatus["DRAFT"] = "DRAFT";
    SaleStatus["COMPLETED"] = "COMPLETED";
    SaleStatus["CANCELLED"] = "CANCELLED";
    SaleStatus["REFUNDED"] = "REFUNDED";
    SaleStatus["PARTIALLY_REFUNDED"] = "PARTIALLY_REFUNDED";
})(SaleStatus || (exports.SaleStatus = SaleStatus = {}));
// ===================================
// Purchases Interfaces
// ===================================
var PurchaseStatus;
(function (PurchaseStatus) {
    PurchaseStatus["PENDING"] = "PENDING";
    PurchaseStatus["PARTIALLY_RECEIVED"] = "PARTIALLY_RECEIVED";
    PurchaseStatus["COMPLETED"] = "COMPLETED";
    PurchaseStatus["CANCELLED"] = "CANCELLED";
})(PurchaseStatus || (exports.PurchaseStatus = PurchaseStatus = {}));
// ===================================
// Returns Interfaces
// ===================================
var ReturnType;
(function (ReturnType) {
    ReturnType["CUSTOMER_RETURN"] = "CUSTOMER_RETURN";
    ReturnType["SUPPLIER_RETURN"] = "SUPPLIER_RETURN";
})(ReturnType || (exports.ReturnType = ReturnType = {}));
var ReturnStatus;
(function (ReturnStatus) {
    ReturnStatus["PENDING"] = "PENDING";
    ReturnStatus["APPROVED"] = "APPROVED";
    ReturnStatus["REJECTED"] = "REJECTED";
    ReturnStatus["COMPLETED"] = "COMPLETED";
})(ReturnStatus || (exports.ReturnStatus = ReturnStatus = {}));
var ReturnReason;
(function (ReturnReason) {
    ReturnReason["DEFECTIVE"] = "DEFECTIVE";
    ReturnReason["WRONG_ITEM"] = "WRONG_ITEM";
    ReturnReason["CUSTOMER_REQUEST"] = "CUSTOMER_REQUEST";
    ReturnReason["QUALITY_ISSUE"] = "QUALITY_ISSUE";
    ReturnReason["OTHER"] = "OTHER";
})(ReturnReason || (exports.ReturnReason = ReturnReason = {}));
//# sourceMappingURL=transaction.types.js.map