"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateGeneralGoodsDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_general_goods_dto_1 = require("./create-general-goods.dto");
class UpdateGeneralGoodsDto extends (0, mapped_types_1.PartialType)(create_general_goods_dto_1.CreateGeneralGoodsDto) {
}
exports.UpdateGeneralGoodsDto = UpdateGeneralGoodsDto;
//# sourceMappingURL=update-general-goods.dto.js.map