import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1)
    .default("mysql://root:password@localhost:3306/ms_test"),
  JWT_SECRET: z.string().min(16).default("change-me-to-a-long-random-secret"),
  APP_URL: z.string().default("http://localhost:3000"),
  UPLOAD_DIR: z.string().default("uploads"),
  MAX_UPLOAD_MB: z.coerce.number().positive().default(50),
  CROWD_TESTER_BASE_PRICE: z.coerce.number().positive().default(35),
  DEVELOPER_TESTER_BASE_PRICE: z.coerce.number().positive().default(85),
  COUNTRY_MULTIPLIER_STEP: z.coerce.number().min(0).default(0.08),
  PLATFORM_MULTIPLIER_STEP: z.coerce.number().min(0).default(0.05),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  APP_URL: process.env.APP_URL,
  UPLOAD_DIR: process.env.UPLOAD_DIR,
  MAX_UPLOAD_MB: process.env.MAX_UPLOAD_MB,
  CROWD_TESTER_BASE_PRICE: process.env.CROWD_TESTER_BASE_PRICE,
  DEVELOPER_TESTER_BASE_PRICE: process.env.DEVELOPER_TESTER_BASE_PRICE,
  COUNTRY_MULTIPLIER_STEP: process.env.COUNTRY_MULTIPLIER_STEP,
  PLATFORM_MULTIPLIER_STEP: process.env.PLATFORM_MULTIPLIER_STEP,
});
