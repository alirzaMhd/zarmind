"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCoinDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_coin_dto_1 = require("./create-coin.dto");
class UpdateCoinDto extends (0, mapped_types_1.PartialType)(create_coin_dto_1.CreateCoinDto) {
}
exports.UpdateCoinDto = UpdateCoinDto;
//# sourceMappingURL=update-coin.dto.js.map