"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCheckDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_check_dto_1 = require("./create-check.dto");
class UpdateCheckDto extends (0, mapped_types_1.PartialType)(create_check_dto_1.CreateCheckDto) {
}
exports.UpdateCheckDto = UpdateCheckDto;
//# sourceMappingURL=update-check.dto.js.map