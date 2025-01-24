export const getCompanyLogo = (companyName: string, size: number = 40): string => {
  // Clean up company name for better logo matching
  const cleanName = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();

  // Use Clearbit Logo API
  return `https://logo.clearbit.com/${cleanName}.com?size=${size}`;
};

export const getCompanyDomain = (companyName: string): string => {
  return companyName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim() + '.com';
};
