"use strict";
// Export all types and enums from all files
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentType = exports.SettingCategory = exports.NotificationPriority = exports.NotificationType = void 0;
__exportStar(require("./financial.types"), exports);
__exportStar(require("./inventory.types"), exports);
__exportStar(require("./report.types"), exports);
__exportStar(require("./transaction.types"), exports);
__exportStar(require("./user.types"), exports);
var NotificationType;
(function (NotificationType) {
    NotificationType["LOW_INVENTORY"] = "LOW_INVENTORY";
    NotificationType["OUT_OF_STOCK"] = "OUT_OF_STOCK";
    NotificationType["CHECK_DUE"] = "CHECK_DUE";
    NotificationType["CHECK_BOUNCED"] = "CHECK_BOUNCED";
    NotificationType["PAYMENT_OVERDUE"] = "PAYMENT_OVERDUE";
    NotificationType["PAYMENT_RECEIVED"] = "PAYMENT_RECEIVED";
    NotificationType["EMPLOYEE_BIRTHDAY"] = "EMPLOYEE_BIRTHDAY";
    NotificationType["CUSTOMER_BIRTHDAY"] = "CUSTOMER_BIRTHDAY";
    NotificationType["CUSTOMER_ANNIVERSARY"] = "CUSTOMER_ANNIVERSARY";
    NotificationType["WORK_ORDER_DUE"] = "WORK_ORDER_DUE";
    NotificationType["SYSTEM_ALERT"] = "SYSTEM_ALERT";
    NotificationType["APPROVAL_REQUIRED"] = "APPROVAL_REQUIRED";
    NotificationType["CUSTOM"] = "CUSTOM";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var NotificationPriority;
(function (NotificationPriority) {
    NotificationPriority["LOW"] = "LOW";
    NotificationPriority["MEDIUM"] = "MEDIUM";
    NotificationPriority["HIGH"] = "HIGH";
    NotificationPriority["URGENT"] = "URGENT";
})(NotificationPriority || (exports.NotificationPriority = NotificationPriority = {}));
var SettingCategory;
(function (SettingCategory) {
    SettingCategory["GENERAL"] = "GENERAL";
    SettingCategory["COMPANY"] = "COMPANY";
    SettingCategory["TAX"] = "TAX";
    SettingCategory["CURRENCY"] = "CURRENCY";
    SettingCategory["EMAIL"] = "EMAIL";
    SettingCategory["NOTIFICATION"] = "NOTIFICATION";
    SettingCategory["SECURITY"] = "SECURITY";
    SettingCategory["INTEGRATION"] = "INTEGRATION";
    SettingCategory["PRINTER"] = "PRINTER";
    SettingCategory["BACKUP"] = "BACKUP";
})(SettingCategory || (exports.SettingCategory = SettingCategory = {}));
var DocumentType;
(function (DocumentType) {
    DocumentType["INVOICE"] = "INVOICE";
    DocumentType["RECEIPT"] = "RECEIPT";
    DocumentType["CONTRACT"] = "CONTRACT";
    DocumentType["LICENSE"] = "LICENSE";
    DocumentType["CERTIFICATE"] = "CERTIFICATE";
    DocumentType["ID_DOCUMENT"] = "ID_DOCUMENT";
    DocumentType["PRODUCT_IMAGE"] = "PRODUCT_IMAGE";
    DocumentType["CHECK_IMAGE"] = "CHECK_IMAGE";
    DocumentType["EXPENSE_RECEIPT"] = "EXPENSE_RECEIPT";
    DocumentType["OTHER"] = "OTHER";
})(DocumentType || (exports.DocumentType = DocumentType = {}));
