"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateStoneDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_stone_dto_1 = require("./create-stone.dto");
class UpdateStoneDto extends (0, mapped_types_1.PartialType)(create_stone_dto_1.CreateStoneDto) {
}
exports.UpdateStoneDto = UpdateStoneDto;
//# sourceMappingURL=stones.service.js.map