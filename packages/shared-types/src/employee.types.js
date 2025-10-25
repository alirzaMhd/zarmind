"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveStatus = exports.LeaveType = exports.AttendanceStatus = void 0;
var AttendanceStatus;
(function (AttendanceStatus) {
    AttendanceStatus["PRESENT"] = "PRESENT";
    AttendanceStatus["ABSENT"] = "ABSENT";
    AttendanceStatus["LATE"] = "LATE";
    AttendanceStatus["HALF_DAY"] = "HALF_DAY";
    AttendanceStatus["LEAVE"] = "LEAVE";
    AttendanceStatus["HOLIDAY"] = "HOLIDAY";
    AttendanceStatus["SICK"] = "SICK";
})(AttendanceStatus || (exports.AttendanceStatus = AttendanceStatus = {}));
var LeaveType;
(function (LeaveType) {
    LeaveType["ANNUAL"] = "ANNUAL";
    LeaveType["SICK"] = "SICK";
    LeaveType["UNPAID"] = "UNPAID";
    LeaveType["MATERNITY"] = "MATERNITY";
    LeaveType["PATERNITY"] = "PATERNITY";
    LeaveType["EMERGENCY"] = "EMERGENCY";
    LeaveType["OTHER"] = "OTHER";
})(LeaveType || (exports.LeaveType = LeaveType = {}));
var LeaveStatus;
(function (LeaveStatus) {
    LeaveStatus["PENDING"] = "PENDING";
    LeaveStatus["APPROVED"] = "APPROVED";
    LeaveStatus["REJECTED"] = "REJECTED";
    LeaveStatus["CANCELLED"] = "CANCELLED";
})(LeaveStatus || (exports.LeaveStatus = LeaveStatus = {}));
//# sourceMappingURL=employee.types.js.map