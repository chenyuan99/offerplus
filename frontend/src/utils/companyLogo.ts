export const getCompanyLogo = (domain: string, size: number = 40): string => {
  // Use Logo.dev API - add token via environment variable
  const token = import.meta.env.VITE_LOGO_DEV_TOKEN || '';
  const tokenParam = token ? `?token=${token}` : '';
  return `https://img.logo.dev/${domain}${tokenParam}`;
};

export const getCompanyDomain = (hostname: string): string => {
  // Extract main domain from hostname (e.g., nvidia.com from www.nvidia.com)
  return hostname.replace('www.', '').split('.').slice(-2).join('.');
};
