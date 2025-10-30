import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

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

@Injectable()
export class GoldCurrencyService {
  private readonly logger = new Logger(GoldCurrencyService.name);
  private readonly brsApiUrl: string;
  private readonly brsApiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.brsApiUrl = this.configService.get<string>('BRS_API_URL') || 'https://BrsApi.ir/Api/Market/Gold_Currency.php';
    this.brsApiKey = this.configService.get<string>('BRS_API_KEY') || 'Bbzp94KNAdGza3d84tB8igHzrDhECbgB';
  }

  async getGoldAndCurrencyPrices(): Promise<GoldCurrencyData> {
    try {
      this.logger.log('Fetching gold and currency prices from BrsApi...');
      
      const response = await firstValueFrom(
        this.httpService.get<BrsApiResponse>(`${this.brsApiUrl}?key=${this.brsApiKey}`)
      );

      const apiData = response.data;
      const lastUpdated = new Date().toISOString();

      // Transform gold data
      const goldPrices: GoldPrice[] = apiData.gold.map(item => ({
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
      const currencyRates: CurrencyRate[] = apiData.currency.map(item => ({
        currency: item.name,
        rate: item.price,
        change: item.change_value,
        changePercent: item.change_percent,
        symbol: item.symbol,
        nameEn: item.name_en,
        lastUpdated: new Date(item.time_unix * 1000).toISOString(),
      }));

      // Transform cryptocurrency data
      const cryptoPrices: CryptoPrice[] = apiData.cryptocurrency.map(item => ({
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
    } catch (error) {
      this.logger.error('Failed to fetch gold and currency prices from BrsApi:', error);
      
      // Fallback to mock data if API fails
      this.logger.warn('Falling back to mock data due to API failure');
      return this.getMockData();
    }
  }

  // Fallback method that returns mock data when API is unavailable
  private getMockData(): GoldCurrencyData {
    const goldPrices: GoldPrice[] = [
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

    const currencyRates: CurrencyRate[] = [
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

    const cryptoPrices: CryptoPrice[] = [
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
}
