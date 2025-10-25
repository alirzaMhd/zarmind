"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePerformanceDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_performance_dto_1 = require("./create-performance.dto");
class UpdatePerformanceDto extends (0, mapped_types_1.PartialType)(create_performance_dto_1.CreatePerformanceDto) {
}
exports.UpdatePerformanceDto = UpdatePerformanceDto;
//# sourceMappingURL=update-performance.dto.js.map