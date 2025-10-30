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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoldCurrencyService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
let GoldCurrencyService = GoldCurrencyService_1 = class GoldCurrencyService {
    constructor(httpService, configService) {
        this.httpService = httpService;
        this.configService = configService;
        this.logger = new common_1.Logger(GoldCurrencyService_1.name);
        this.brsApiUrl = this.configService.get('BRS_API_URL') || 'https://BrsApi.ir/Api/Market/Gold_Currency.php';
        this.brsApiKey = this.configService.get('BRS_API_KEY') || 'Bbzp94KNAdGza3d84tB8igHzrDhECbgB';
    }
    async getGoldAndCurrencyPrices() {
        try {
            this.logger.log('Fetching gold and currency prices from BrsApi...');
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.brsApiUrl}?key=${this.brsApiKey}`));
            const apiData = response.data;
            const lastUpdated = new Date().toISOString();
            // Transform gold data
            const goldPrices = apiData.gold.map(item => ({
                type: item.name,
                price: item.price,
                unit: item.unit,
                change: item.change_value,
                changePercent: item.change_percent,
                symbol: item.symbol,
                nameEn: item.name_en,
                lastUpdated: new Date(item.time_unix * 1000).toISOString(),
            }));
            // Transform currency data
            const currencyRates = apiData.currency.map(item => ({
                currency: item.name,
                rate: item.price,
                change: item.change_value,
                changePercent: item.change_percent,
                symbol: item.symbol,
                nameEn: item.name_en,
                lastUpdated: new Date(item.time_unix * 1000).toISOString(),
            }));
            // Transform cryptocurrency data
            const cryptoPrices = apiData.cryptocurrency.map(item => ({
                symbol: item.symbol,
                name: item.name,
                nameEn: item.name_en,
                price: item.price,
                changePercent: item.change_percent,
                marketCap: item.market_cap,
                unit: item.unit,
                description: item.description,
                lastUpdated: new Date(item.time_unix * 1000).toISOString(),
            }));
            this.logger.log(`Successfully fetched ${goldPrices.length} gold prices, ${currencyRates.length} currency rates, and ${cryptoPrices.length} crypto prices`);
            return {
                goldPrices,
                currencyRates,
                cryptoPrices,
                lastUpdated,
            };
        }
        catch (error) {
            this.logger.error('Failed to fetch gold and currency prices from BrsApi:', error);
            // Fallback to mock data if API fails
            this.logger.warn('Falling back to mock data due to API failure');
            return this.getMockData();
        }
    }
    // Fallback method that returns mock data when API is unavailable
    getMockData() {
        const goldPrices = [
            {
                type: 'طلا 18 عیار',
                price: 2850000,
                unit: 'تومان',
                change: 15000,
                changePercent: 0.53,
                symbol: 'IR_GOLD_18K',
                nameEn: '18K Gold',
                lastUpdated: new Date().toISOString(),
            },
            {
                type: 'طلا 24 عیار',
                price: 3800000,
                unit: 'تومان',
                change: 20000,
                changePercent: 0.53,
                symbol: 'IR_GOLD_24K',
                nameEn: '24K Gold',
                lastUpdated: new Date().toISOString(),
            },
            {
                type: 'نیم سکه',
                price: 12500000,
                unit: 'تومان',
                change: 50000,
                changePercent: 0.40,
                symbol: 'IR_COIN_HALF',
                nameEn: 'Half Coin',
                lastUpdated: new Date().toISOString(),
            },
            {
                type: 'سکه تمام',
                price: 25000000,
                unit: 'تومان',
                change: 100000,
                changePercent: 0.40,
                symbol: 'IR_COIN_FULL',
                nameEn: 'Full Coin',
                lastUpdated: new Date().toISOString(),
            },
        ];
        const currencyRates = [
            {
                currency: 'دلار آمریکا',
                rate: 420000,
                change: 2000,
                changePercent: 0.48,
                symbol: 'USD',
                nameEn: 'US Dollar',
                lastUpdated: new Date().toISOString(),
            },
            {
                currency: 'یورو',
                rate: 460000,
                change: 1500,
                changePercent: 0.33,
                symbol: 'EUR',
                nameEn: 'Euro',
                lastUpdated: new Date().toISOString(),
            },
            {
                currency: 'پوند انگلیس',
                rate: 530000,
                change: 3000,
                changePercent: 0.57,
                symbol: 'GBP',
                nameEn: 'British Pound',
                lastUpdated: new Date().toISOString(),
            },
        ];
        const cryptoPrices = [
            {
                symbol: 'BTC',
                name: 'بیت‌کوین',
                nameEn: 'Bitcoin',
                price: '112818.88',
                changePercent: -0.86,
                marketCap: 2249400560760,
                unit: 'دلار',
                description: 'اولین و معروف‌ترین رمزارز جهان',
                lastUpdated: new Date().toISOString(),
            },
            {
                symbol: 'ETH',
                name: 'اتریوم',
                nameEn: 'Ethereum',
                price: '4012',
                changePercent: -2.43,
                marketCap: 484833338942,
                unit: 'دلار',
                description: 'پلتفرم پیشرو برای قراردادهای هوشمند',
                lastUpdated: new Date().toISOString(),
            },
        ];
        return {
            goldPrices,
            currencyRates,
            cryptoPrices,
            lastUpdated: new Date().toISOString(),
        };
    }
};
exports.GoldCurrencyService = GoldCurrencyService;
exports.GoldCurrencyService = GoldCurrencyService = GoldCurrencyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], GoldCurrencyService);
//# sourceMappingURL=gold-currency.service.js.map