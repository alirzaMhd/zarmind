"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManagementModule = void 0;
const common_1 = require("@nestjs/common");
const branches_module_1 = require("./submodules/branches/branches.module");
let ManagementModule = class ManagementModule {
};
exports.ManagementModule = ManagementModule;
exports.ManagementModule = ManagementModule = __decorate([
    (0, common_1.Module)({
        imports: [branches_module_1.BranchesModule],
        exports: [branches_module_1.BranchesModule],
    })
], ManagementModule);
//# sourceMappingURL=management.module.js.map