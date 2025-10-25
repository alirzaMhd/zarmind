"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateRawGoldDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_raw_gold_dto_1 = require("./create-raw-gold.dto");
class UpdateRawGoldDto extends (0, mapped_types_1.PartialType)(create_raw_gold_dto_1.CreateRawGoldDto) {
}
exports.UpdateRawGoldDto = UpdateRawGoldDto;
//# sourceMappingURL=update-raw-gold.dto.js.map