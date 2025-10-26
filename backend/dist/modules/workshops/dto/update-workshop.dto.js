"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateWorkshopDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_workshop_dto_1 = require("./create-workshop.dto");
class UpdateWorkshopDto extends (0, mapped_types_1.PartialType)(create_workshop_dto_1.CreateWorkshopDto) {
}
exports.UpdateWorkshopDto = UpdateWorkshopDto;
//# sourceMappingURL=update-workshop.dto.js.map