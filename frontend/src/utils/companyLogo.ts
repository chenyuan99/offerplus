export const getCompanyLogo = (domain: string, size: number = 40): string => {
  // Use Logo.dev API - add token via environment variable
  const token = import.meta.env.NEXT_PUBLIC_LOGO_DEV_TOKEN || '';
  const tokenParam = token ? `?token=${token}` : '';
  return `https://img.logo.dev/${domain}${tokenParam}`;
};

export const getCompanyDomain = (hostname: string): string => {
  // Extract main domain from hostname (e.g., nvidia.com from www.nvidia.com)
  return hostname.replace('www.', '').split('.').slice(-2).join('.');
};

const toTitleCase = (slug: string): string =>
  slug.replace(/[-_.]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();

export const extractCompanyNameFromUrl = (companyLink: string): string => {
  try {
    const url = new URL(companyLink);
    const hostname = url.hostname.replace('www.', '');
    const pathname = url.pathname;

    // LinkedIn company pages: /company/<slug>
    if (hostname.includes('linkedin.com')) {
      const match = pathname.match(/\/company\/([^/]+)/);
      if (match) return toTitleCase(match[1]);
    }

    // Greenhouse: job-boards.greenhouse.io/<company> or boards.greenhouse.io/<company>
    if (hostname === 'job-boards.greenhouse.io' || hostname === 'boards.greenhouse.io') {
      const slug = pathname.split('/').filter(Boolean)[0];
      if (slug) return toTitleCase(slug);
    }

    // Lever: jobs.lever.co/<company>
    if (hostname === 'jobs.lever.co') {
      const slug = pathname.split('/').filter(Boolean)[0];
      if (slug) return toTitleCase(slug);
    }

    // Workday: <company>.wd5.myworkdayjobs.com
    if (hostname.includes('myworkdayjobs.com')) {
      return toTitleCase(hostname.split('.')[0]);
    }

    // Eightfold: <company>.eightfold.ai
    if (hostname.includes('eightfold.ai') && hostname !== 'eightfold.ai') {
      return toTitleCase(hostname.split('.')[0]);
    }

    return hostname;
  } catch {
    return companyLink;
  }
};
