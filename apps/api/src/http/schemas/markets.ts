import { z } from "zod";

export const perpetualMarketSchema = z.object({
  coin: z.string(),
  symbol: z.string(),
  szDecimals: z.number().int().nonnegative(),
  maxLeverage: z.number().nonnegative(),
  marginTableId: z.number().nonnegative(),
  isDelisted: z.boolean(),

  fundingRate: z.string(),
  openInterest: z.string(),
  previousDayPrice: z.string(),
  dailyNotionalVolume: z.string(),
  oraclePrice: z.string(),
  markPrice: z.string(),
  midPrice: z.string().nullable(),
  premium: z.string().nullable(),
});

export const perpetualMarketsSchema = z.array(perpetualMarketSchema);

export type PerpetualMarketResponse = z.infer<
  typeof perpetualMarketSchema
>;
