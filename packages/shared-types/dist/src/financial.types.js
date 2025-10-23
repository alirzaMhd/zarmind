"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankTransactionType = exports.CheckStatus = exports.CheckType = exports.CashTransactionType = exports.PaymentMethod = void 0;
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH"] = "CASH";
    PaymentMethod["CHECK"] = "CHECK";
    PaymentMethod["BANK_TRANSFER"] = "BANK_TRANSFER";
    PaymentMethod["CARD"] = "CARD";
    PaymentMethod["INSTALLMENT"] = "INSTALLMENT";
    PaymentMethod["TRADE_IN"] = "TRADE_IN";
    PaymentMethod["MIXED"] = "MIXED";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var CashTransactionType;
(function (CashTransactionType) {
    CashTransactionType["CASH_IN"] = "CASH_IN";
    CashTransactionType["CASH_OUT"] = "CASH_OUT";
    CashTransactionType["OPENING_BALANCE"] = "OPENING_BALANCE";
    CashTransactionType["CLOSING_BALANCE"] = "CLOSING_BALANCE";
    CashTransactionType["PETTY_CASH"] = "PETTY_CASH";
})(CashTransactionType || (exports.CashTransactionType = CashTransactionType = {}));
var CheckType;
(function (CheckType) {
    CheckType["RECEIVABLE"] = "RECEIVABLE";
    CheckType["PAYABLE"] = "PAYABLE";
})(CheckType || (exports.CheckType = CheckType = {}));
var CheckStatus;
(function (CheckStatus) {
    CheckStatus["PENDING"] = "PENDING";
    CheckStatus["DEPOSITED"] = "DEPOSITED";
    CheckStatus["CLEARED"] = "CLEARED";
    CheckStatus["BOUNCED"] = "BOUNCED";
    CheckStatus["CANCELLED"] = "CANCELLED";
    CheckStatus["CASHED"] = "CASHED";
    CheckStatus["TRANSFERRED"] = "TRANSFERRED";
})(CheckStatus || (exports.CheckStatus = CheckStatus = {}));
var BankTransactionType;
(function (BankTransactionType) {
    BankTransactionType["DEPOSIT"] = "DEPOSIT";
    BankTransactionType["WITHDRAWAL"] = "WITHDRAWAL";
    BankTransactionType["TRANSFER_IN"] = "TRANSFER_IN";
    BankTransactionType["TRANSFER_OUT"] = "TRANSFER_OUT";
    BankTransactionType["FEE"] = "FEE";
    BankTransactionType["INTEREST"] = "INTEREST";
    BankTransactionType["CHECK_DEPOSIT"] = "CHECK_DEPOSIT";
    BankTransactionType["CHECK_WITHDRAWAL"] = "CHECK_WITHDRAWAL";
})(BankTransactionType || (exports.BankTransactionType = BankTransactionType = {}));
