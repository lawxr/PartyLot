/** Demo fixtures are opt-in and are never enabled in a production build. */
export const isExplicitDevelopmentDemoMode = (): boolean =>
  process.env.NODE_ENV !== 'production' &&
  process.env.NEXT_PUBLIC_PARTYLOT_DEMO_MODE === 'true';

export const isPrivyConfigured = (): boolean => {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  return Boolean(
    appId &&
      appId.length === 25 &&
      !appId.toLowerCase().includes('demo') &&
      !appId.toLowerCase().includes('placeholder')
  );
};
