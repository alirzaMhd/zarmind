"use strict";
// ===================================
// User & Employee Types
// ===================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupplierStatus = exports.CustomerStatus = exports.CustomerType = exports.EmploymentType = exports.EmploymentStatus = exports.UserStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    UserRole["ADMIN"] = "ADMIN";
    UserRole["MANAGER"] = "MANAGER";
    UserRole["SALES_STAFF"] = "SALES_STAFF";
    UserRole["ACCOUNTANT"] = "ACCOUNTANT";
    UserRole["WAREHOUSE_STAFF"] = "WAREHOUSE_STAFF";
    UserRole["VIEWER"] = "VIEWER";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "ACTIVE";
    UserStatus["INACTIVE"] = "INACTIVE";
    UserStatus["SUSPENDED"] = "SUSPENDED";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var EmploymentStatus;
(function (EmploymentStatus) {
    EmploymentStatus["ACTIVE"] = "ACTIVE";
    EmploymentStatus["ON_LEAVE"] = "ON_LEAVE";
    EmploymentStatus["SUSPENDED"] = "SUSPENDED";
    EmploymentStatus["TERMINATED"] = "TERMINATED";
    EmploymentStatus["RESIGNED"] = "RESIGNED";
})(EmploymentStatus || (exports.EmploymentStatus = EmploymentStatus = {}));
var EmploymentType;
(function (EmploymentType) {
    EmploymentType["FULL_TIME"] = "FULL_TIME";
    EmploymentType["PART_TIME"] = "PART_TIME";
    EmploymentType["CONTRACT"] = "CONTRACT";
    EmploymentType["TEMPORARY"] = "TEMPORARY";
})(EmploymentType || (exports.EmploymentType = EmploymentType = {}));
// ===================================
// Customer (CRM) & Supplier Types
// ===================================
var CustomerType;
(function (CustomerType) {
    CustomerType["INDIVIDUAL"] = "INDIVIDUAL";
    CustomerType["BUSINESS"] = "BUSINESS";
})(CustomerType || (exports.CustomerType = CustomerType = {}));
var CustomerStatus;
(function (CustomerStatus) {
    CustomerStatus["ACTIVE"] = "ACTIVE";
    CustomerStatus["INACTIVE"] = "INACTIVE";
    CustomerStatus["BLACKLISTED"] = "BLACKLISTED";
})(CustomerStatus || (exports.CustomerStatus = CustomerStatus = {}));
var SupplierStatus;
(function (SupplierStatus) {
    SupplierStatus["ACTIVE"] = "ACTIVE";
    SupplierStatus["INACTIVE"] = "INACTIVE";
    SupplierStatus["BLACKLISTED"] = "BLACKLISTED";
})(SupplierStatus || (exports.SupplierStatus = SupplierStatus = {}));
//# sourceMappingURL=user.types.js.map