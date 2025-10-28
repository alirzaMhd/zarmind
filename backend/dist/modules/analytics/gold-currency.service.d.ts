import { HttpService } from '@nestjs/axios';
export interface GoldPrice {
    type: string;
    price: number;
    unit: string;
    change: number;
    changePercent: number;
}
export interface CurrencyRate {
    currency: string;
    rate: number;
    change: number;
    changePercent: number;
}
export interface GoldCurrencyData {
    goldPrices: GoldPrice[];
    currencyRates: CurrencyRate[];
    lastUpdated: string;
}
export declare class GoldCurrencyService {
    private readonly httpService;
    private readonly logger;
    constructor(httpService: HttpService);
    getGoldAndCurrencyPrices(): Promise<GoldCurrencyData>;
    private fetchRealGoldPrices;
    private fetchRealCurrencyRates;
}
//# sourceMappingURL=gold-currency.service.d.ts.map