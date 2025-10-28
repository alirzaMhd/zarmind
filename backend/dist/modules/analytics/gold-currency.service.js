"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var GoldCurrencyService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoldCurrencyService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
let GoldCurrencyService = GoldCurrencyService_1 = class GoldCurrencyService {
    constructor(httpService) {
        this.httpService = httpService;
        this.logger = new common_1.Logger(GoldCurrencyService_1.name);
    }
    async getGoldAndCurrencyPrices() {
        try {
            // For now, we'll use mock data since free APIs have limitations
            // In production, you would integrate with real APIs like:
            // - Metals-API for gold prices
            // - ExchangeRates-API for currency rates
            // - Or Iranian-specific APIs if available
            const goldPrices = [
                {
                    type: 'طلا 18 عیار',
                    price: 2850000,
                    unit: 'ریال',
                    change: 15000,
                    changePercent: 0.53,
                },
                {
                    type: 'طلا 24 عیار',
                    price: 3800000,
                    unit: 'ریال',
                    change: 20000,
                    changePercent: 0.53,
                },
                {
                    type: 'نیم سکه',
                    price: 12500000,
                    unit: 'ریال',
                    change: 50000,
                    changePercent: 0.40,
                },
                {
                    type: 'سکه تمام',
                    price: 25000000,
                    unit: 'ریال',
                    change: 100000,
                    changePercent: 0.40,
                },
                {
                    type: 'نیم بهار آزادی',
                    price: 12000000,
                    unit: 'ریال',
                    change: 45000,
                    changePercent: 0.38,
                },
                {
                    type: 'ربع بهار آزادی',
                    price: 6000000,
                    unit: 'ریال',
                    change: 25000,
                    changePercent: 0.42,
                },
            ];
            const currencyRates = [
                {
                    currency: 'دلار آمریکا',
                    rate: 420000,
                    change: 2000,
                    changePercent: 0.48,
                },
                {
                    currency: 'یورو',
                    rate: 460000,
                    change: 1500,
                    changePercent: 0.33,
                },
                {
                    currency: 'پوند انگلیس',
                    rate: 530000,
                    change: 3000,
                    changePercent: 0.57,
                },
                {
                    currency: 'ین ژاپن',
                    rate: 2800,
                    change: 15,
                    changePercent: 0.54,
                },
                {
                    currency: 'فرانک سوئیس',
                    rate: 470000,
                    change: 1800,
                    changePercent: 0.38,
                },
                {
                    currency: 'درهم امارات',
                    rate: 114000,
                    change: 500,
                    changePercent: 0.44,
                },
            ];
            return {
                goldPrices,
                currencyRates,
                lastUpdated: new Date().toISOString(),
            };
        }
        catch (error) {
            this.logger.error('Failed to fetch gold and currency prices:', error);
            throw new Error('Failed to fetch gold and currency prices');
        }
    }
    // Method to fetch real data from external APIs (for future implementation)
    async fetchRealGoldPrices() {
        // This would integrate with real APIs like Metals-API
        // For now, return mock data
        return [];
    }
    async fetchRealCurrencyRates() {
        // This would integrate with real APIs like ExchangeRates-API
        // For now, return mock data
        return [];
    }
};
exports.GoldCurrencyService = GoldCurrencyService;
exports.GoldCurrencyService = GoldCurrencyService = GoldCurrencyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof axios_1.HttpService !== "undefined" && axios_1.HttpService) === "function" ? _a : Object])
], GoldCurrencyService);
//# sourceMappingURL=gold-currency.service.js.map