import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'pg-flow-dev-secret-2026',
  phonepe: {
    merchantId: process.env.PHONEPE_MERCHANT_ID || 'PHONEPE_UAT_MERCHANT',
    saltKey: process.env.PHONEPE_SALT_KEY || 'test-salt-key',
    saltIndex: process.env.PHONEPE_SALT_INDEX || '1',
    env: process.env.PHONEPE_ENV || 'UAT',
  },
  s3: {
    bucketName: process.env.S3_BUCKET_NAME || 'pg-flow-complaints',
    region: process.env.AWS_REGION || 'auto',
  },
};
