"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkOrderPriority = exports.WorkOrderStatus = exports.WorkshopStatus = exports.CoinType = exports.StoneType = exports.GoldPurity = exports.ProductStatus = exports.ProductCategory = void 0;
var ProductCategory;
(function (ProductCategory) {
    ProductCategory["RAW_GOLD"] = "RAW_GOLD";
    ProductCategory["MANUFACTURED_PRODUCT"] = "MANUFACTURED_PRODUCT";
    ProductCategory["STONE"] = "STONE";
    ProductCategory["COIN"] = "COIN";
    ProductCategory["CURRENCY"] = "CURRENCY";
    ProductCategory["GENERAL_GOODS"] = "GENERAL_GOODS";
})(ProductCategory || (exports.ProductCategory = ProductCategory = {}));
var ProductStatus;
(function (ProductStatus) {
    ProductStatus["IN_STOCK"] = "IN_STOCK";
    ProductStatus["SOLD"] = "SOLD";
    ProductStatus["RESERVED"] = "RESERVED";
    ProductStatus["IN_WORKSHOP"] = "IN_WORKSHOP";
    ProductStatus["RETURNED"] = "RETURNED";
    ProductStatus["DAMAGED"] = "DAMAGED";
})(ProductStatus || (exports.ProductStatus = ProductStatus = {}));
var GoldPurity;
(function (GoldPurity) {
    GoldPurity["K18"] = "K18";
    GoldPurity["K21"] = "K21";
    GoldPurity["K22"] = "K22";
    GoldPurity["K24"] = "K24";
})(GoldPurity || (exports.GoldPurity = GoldPurity = {}));
var StoneType;
(function (StoneType) {
    StoneType["DIAMOND"] = "DIAMOND";
    StoneType["RUBY"] = "RUBY";
    StoneType["EMERALD"] = "EMERALD";
    StoneType["SAPPHIRE"] = "SAPPHIRE";
    StoneType["PEARL"] = "PEARL";
    StoneType["TOPAZ"] = "TOPAZ";
    StoneType["AMETHYST"] = "AMETHYST";
    StoneType["TURQUOISE"] = "TURQUOISE";
    StoneType["ONYX"] = "ONYX";
    StoneType["OTHER"] = "OTHER";
})(StoneType || (exports.StoneType = StoneType = {}));
var CoinType;
(function (CoinType) {
    CoinType["BAHAR_AZADI"] = "BAHAR_AZADI";
    CoinType["GERAMI"] = "GERAMI";
    CoinType["HALF_BAHAR"] = "HALF_BAHAR";
    CoinType["QUARTER_BAHAR"] = "QUARTER_BAHAR";
    CoinType["NIM_AZADI"] = "NIM_AZADI";
    CoinType["ROB_AZADI"] = "ROB_AZADI";
    CoinType["OTHER"] = "OTHER";
})(CoinType || (exports.CoinType = CoinType = {}));
// Workshop management
var WorkshopStatus;
(function (WorkshopStatus) {
    WorkshopStatus["ACTIVE"] = "ACTIVE";
    WorkshopStatus["INACTIVE"] = "INACTIVE";
    WorkshopStatus["SUSPENDED"] = "SUSPENDED";
})(WorkshopStatus || (exports.WorkshopStatus = WorkshopStatus = {}));
var WorkOrderStatus;
(function (WorkOrderStatus) {
    WorkOrderStatus["PENDING"] = "PENDING";
    WorkOrderStatus["ACCEPTED"] = "ACCEPTED";
    WorkOrderStatus["IN_PROGRESS"] = "IN_PROGRESS";
    WorkOrderStatus["QUALITY_CHECK"] = "QUALITY_CHECK";
    WorkOrderStatus["COMPLETED"] = "COMPLETED";
    WorkOrderStatus["DELIVERED"] = "DELIVERED";
    WorkOrderStatus["CANCELLED"] = "CANCELLED";
    WorkOrderStatus["REJECTED"] = "REJECTED";
})(WorkOrderStatus || (exports.WorkOrderStatus = WorkOrderStatus = {}));
var WorkOrderPriority;
(function (WorkOrderPriority) {
    WorkOrderPriority["LOW"] = "LOW";
    WorkOrderPriority["MEDIUM"] = "MEDIUM";
    WorkOrderPriority["HIGH"] = "HIGH";
    WorkOrderPriority["URGENT"] = "URGENT";
})(WorkOrderPriority || (exports.WorkOrderPriority = WorkOrderPriority = {}));
//# sourceMappingURL=inventory.types.js.map