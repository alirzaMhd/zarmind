"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkshopsModule = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("../../core/database/database.module");
// Import controllers
const work_orders_controller_1 = require("./submodules/work-orders/work-orders.controller");
const workshops_controller_1 = require("./workshops.controller");
// Import services
const work_orders_service_1 = require("./submodules/work-orders/work-orders.service");
const workshops_service_1 = require("./workshops.service");
let WorkshopsModule = class WorkshopsModule {
};
exports.WorkshopsModule = WorkshopsModule;
exports.WorkshopsModule = WorkshopsModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule],
        // WorkOrdersController must be registered BEFORE WorkshopsController
        // to prevent route conflicts (/workshops/work-orders vs /workshops/:id)
        controllers: [work_orders_controller_1.WorkOrdersController, workshops_controller_1.WorkshopsController],
        providers: [work_orders_service_1.WorkOrdersService, workshops_service_1.WorkshopsService],
        exports: [workshops_service_1.WorkshopsService, work_orders_service_1.WorkOrdersService],
    })
], WorkshopsModule);
//# sourceMappingURL=workshops.module.js.map