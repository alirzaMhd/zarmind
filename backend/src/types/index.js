"use strict";
// ==========================================
// ZARMIND - Type Definitions
// ==========================================
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadRequestError = exports.DatabaseError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.ValidationError = exports.AppError = exports.CURRENCY = exports.WEIGHT_UNITS = exports.CARAT_OPTIONS = exports.EntityType = exports.AuditAction = exports.WeightUnit = exports.TransactionType = exports.SaleStatus = exports.PaymentMethod = exports.SaleType = exports.ProductType = exports.ProductCategory = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["MANAGER"] = "manager";
    UserRole["EMPLOYEE"] = "employee";
    UserRole["VIEWER"] = "viewer";
})(UserRole || (exports.UserRole = UserRole = {}));
var ProductCategory;
(function (ProductCategory) {
    ProductCategory["GOLD"] = "gold";
    ProductCategory["SILVER"] = "silver";
    ProductCategory["PLATINUM"] = "platinum";
    ProductCategory["DIAMOND"] = "diamond";
    ProductCategory["GEMSTONE"] = "gemstone"; // سنگ قیمتی
})(ProductCategory || (exports.ProductCategory = ProductCategory = {}));
var ProductType;
(function (ProductType) {
    ProductType["RING"] = "ring";
    ProductType["NECKLACE"] = "necklace";
    ProductType["BRACELET"] = "bracelet";
    ProductType["EARRING"] = "earring";
    ProductType["ANKLET"] = "anklet";
    ProductType["BANGLE"] = "bangle";
    ProductType["CHAIN"] = "chain";
    ProductType["PENDANT"] = "pendant";
    ProductType["COIN"] = "coin";
    ProductType["BAR"] = "bar";
    ProductType["SET"] = "set";
    ProductType["OTHER"] = "other"; // سایر
})(ProductType || (exports.ProductType = ProductType = {}));
var SaleType;
(function (SaleType) {
    SaleType["CASH"] = "cash";
    SaleType["INSTALLMENT"] = "installment";
    SaleType["EXCHANGE"] = "exchange";
    SaleType["REPAIR"] = "repair"; // تعمیر
})(SaleType || (exports.SaleType = SaleType = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH"] = "cash";
    PaymentMethod["CARD"] = "card";
    PaymentMethod["TRANSFER"] = "transfer";
    PaymentMethod["CHECK"] = "check";
    PaymentMethod["MIXED"] = "mixed"; // ترکیبی
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var SaleStatus;
(function (SaleStatus) {
    SaleStatus["DRAFT"] = "draft";
    SaleStatus["COMPLETED"] = "completed";
    SaleStatus["PARTIAL"] = "partial";
    SaleStatus["CANCELLED"] = "cancelled";
    SaleStatus["RETURNED"] = "returned"; // مرجوعی
})(SaleStatus || (exports.SaleStatus = SaleStatus = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType["SALE"] = "sale";
    TransactionType["PURCHASE"] = "purchase";
    TransactionType["RETURN"] = "return";
    TransactionType["PAYMENT"] = "payment";
    TransactionType["EXPENSE"] = "expense";
    TransactionType["ADJUSTMENT"] = "adjustment"; // تسویه
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var WeightUnit;
(function (WeightUnit) {
    WeightUnit["GRAM"] = "gram";
    WeightUnit["KILOGRAM"] = "kilogram";
    WeightUnit["MITHQAL"] = "mithqal";
    WeightUnit["OUNCE"] = "ounce"; // اونس
})(WeightUnit || (exports.WeightUnit = WeightUnit = {}));
var AuditAction;
(function (AuditAction) {
    AuditAction["CREATE"] = "create";
    AuditAction["UPDATE"] = "update";
    AuditAction["DELETE"] = "delete";
    AuditAction["VIEW"] = "view";
    AuditAction["LOGIN"] = "login";
    AuditAction["LOGOUT"] = "logout";
    AuditAction["CANCEL"] = "cancel";
    AuditAction["RESTORE"] = "restore";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
var EntityType;
(function (EntityType) {
    EntityType["USER"] = "user";
    EntityType["PRODUCT"] = "product";
    EntityType["CUSTOMER"] = "customer";
    EntityType["SALE"] = "sale";
    EntityType["TRANSACTION"] = "transaction";
    EntityType["PAYMENT"] = "payment";
})(EntityType || (exports.EntityType = EntityType = {}));
// ==========================================
// CONSTANTS
// ==========================================
exports.CARAT_OPTIONS = [18, 21, 22, 24];
exports.WEIGHT_UNITS = {
    GRAM: 'gram',
    KILOGRAM: 'kilogram',
    MITHQAL: 'mithqal',
    OUNCE: 'ounce'
};
exports.CURRENCY = {
    IRR: 'ریال',
    IRT: 'تومان',
    USD: 'دلار'
};
// ==========================================
// ERROR TYPES
// ==========================================
var AppError = /** @class */ (function (_super) {
    __extends(AppError, _super);
    function AppError(message, statusCode) {
        if (statusCode === void 0) { statusCode = 500; }
        var _this = _super.call(this, message) || this;
        _this.statusCode = statusCode;
        _this.isOperational = true;
        Error.captureStackTrace(_this, _this.constructor);
        return _this;
    }
    return AppError;
}(Error));
exports.AppError = AppError;
var ValidationError = /** @class */ (function (_super) {
    __extends(ValidationError, _super);
    function ValidationError(message, errors) {
        if (errors === void 0) { errors = []; }
        var _this = _super.call(this, message, 400) || this;
        _this.errors = errors;
        return _this;
    }
    return ValidationError;
}(AppError));
exports.ValidationError = ValidationError;
var UnauthorizedError = /** @class */ (function (_super) {
    __extends(UnauthorizedError, _super);
    function UnauthorizedError(message) {
        if (message === void 0) { message = 'Unauthorized'; }
        return _super.call(this, message, 401) || this;
    }
    return UnauthorizedError;
}(AppError));
exports.UnauthorizedError = UnauthorizedError;
var ForbiddenError = /** @class */ (function (_super) {
    __extends(ForbiddenError, _super);
    function ForbiddenError(message) {
        if (message === void 0) { message = 'Forbidden'; }
        return _super.call(this, message, 403) || this;
    }
    return ForbiddenError;
}(AppError));
exports.ForbiddenError = ForbiddenError;
var NotFoundError = /** @class */ (function (_super) {
    __extends(NotFoundError, _super);
    function NotFoundError(message) {
        if (message === void 0) { message = 'Resource not found'; }
        return _super.call(this, message, 404) || this;
    }
    return NotFoundError;
}(AppError));
exports.NotFoundError = NotFoundError;
var ConflictError = /** @class */ (function (_super) {
    __extends(ConflictError, _super);
    function ConflictError(message) {
        if (message === void 0) { message = 'Resource conflict'; }
        return _super.call(this, message, 409) || this;
    }
    return ConflictError;
}(AppError));
exports.ConflictError = ConflictError;
var DatabaseError = /** @class */ (function (_super) {
    __extends(DatabaseError, _super);
    function DatabaseError(message) {
        if (message === void 0) { message = 'Database error'; }
        return _super.call(this, message, 500) || this;
    }
    return DatabaseError;
}(AppError));
exports.DatabaseError = DatabaseError;
var BadRequestError = /** @class */ (function (_super) {
    __extends(BadRequestError, _super);
    function BadRequestError(message) {
        if (message === void 0) { message = 'Bad request'; }
        return _super.call(this, message, 400) || this;
    }
    return BadRequestError;
}(AppError));
exports.BadRequestError = BadRequestError;
