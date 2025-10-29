import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
export interface BrsApiGoldItem {
    date: string;
    time: string;
    time_unix: number;
    symbol: string;
    name_en: string;
    name: string;
    price: number;
    change_value: number;
    change_percent: number;
    unit: string;
}
export interface BrsApiCurrencyItem {
    date: string;
    time: string;
    time_unix: number;
    symbol: string;
    name_en: string;
    name: string;
    price: number;
    change_value: number;
    change_percent: number;
    unit: string;
}
export interface BrsApiCryptoItem {
    date: string;
    time: string;
    time_unix: number;
    symbol: string;
    name_en: string;
    name: string;
    price: string;
    change_percent: number;
    market_cap: number;
    unit: string;
    description: string;
}
export interface BrsApiResponse {
    gold: BrsApiGoldItem[];
    currency: BrsApiCurrencyItem[];
    cryptocurrency: BrsApiCryptoItem[];
}
export interface GoldPrice {
    type: string;
    price: number;
    unit: string;
    change: number;
    changePercent: number;
    symbol: string;
    nameEn: string;
    lastUpdated: string;
}
export interface CurrencyRate {
    currency: string;
    rate: number;
    change: number;
    changePercent: number;
    symbol: string;
    nameEn: string;
    lastUpdated: string;
}
export interface CryptoPrice {
    symbol: string;
    name: string;
    nameEn: string;
    price: string;
    changePercent: number;
    marketCap: number;
    unit: string;
    description: string;
    lastUpdated: string;
}
export interface GoldCurrencyData {
    goldPrices: GoldPrice[];
    currencyRates: CurrencyRate[];
    cryptoPrices: CryptoPrice[];
    lastUpdated: string;
}
export declare class GoldCurrencyService {
    private readonly httpService;
    private readonly configService;
    private readonly logger;
    private readonly brsApiUrl;
    private readonly brsApiKey;
    constructor(httpService: HttpService, configService: ConfigService);
    getGoldAndCurrencyPrices(): Promise<GoldCurrencyData>;
    private getMockData;
}
//# sourceMappingURL=gold-currency.service.d.ts.map