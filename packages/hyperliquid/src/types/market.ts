export interface HyperliquidPerpetualMarket {
  assetIndex: number;
  coin: string;
  symbol: string;
  szDecimals: number;
  maxLeverage: number;
  marginTableId: number;
  isDelisted: boolean;

  fundingRate: string;
  openInterest: string;
  previousDayPrice: string;
  dailyNotionalVolume: string;
  oraclePrice: string;
  markPrice: string;
  midPrice: string | null;
  premium: string | null;
}
