export const env = {
  isLocal: process.env.NEXT_PUBLIC_APP_ENV === 'local',
  isDevelopment: process.env.NEXT_PUBLIC_APP_ENV === 'development',
  isStaging: process.env.NEXT_PUBLIC_APP_ENV === 'staging',
  isProduction: process.env.NEXT_PUBLIC_APP_ENV === 'production',
  currentEnvironment: process.env.NEXT_PUBLIC_APP_ENV,
};
