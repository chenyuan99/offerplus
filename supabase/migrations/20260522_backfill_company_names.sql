-- Backfill company_name from company_link for existing records where company_name is null.
-- Handles LinkedIn, Greenhouse, Workday, iCIMS, Eightfold, careers.* subdomains,
-- and direct company sites. Indeed URLs are skipped (no extractable company name).

UPDATE applications
SET company_name = CASE

  -- LinkedIn: https://www.linkedin.com/company/<slug>
  WHEN company_link ~ 'linkedin\.com/company/[^/?#]+'
  THEN initcap(replace(
    regexp_replace(company_link, '^.*/company/([^/?#]+).*$', '\1'),
    '-', ' '
  ))

  -- Greenhouse: https://job-boards.greenhouse.io/<company> or boards.greenhouse.io/<company>
  WHEN company_link ~ '(job-boards|boards)\.greenhouse\.io/[^/?#]+'
  THEN initcap(replace(
    regexp_replace(company_link, '^.*greenhouse\.io/([^/?#]+).*$', '\1'),
    '-', ' '
  ))

  -- Workday: <company>.wd*.myworkdayjobs.com
  WHEN company_link ~ '[^.]+\.wd[0-9]*\.myworkdayjobs\.com'
  THEN initcap(replace(
    regexp_replace(company_link, '^https?://([^.]+)\.wd[0-9]*\.myworkdayjobs\.com.*$', '\1'),
    '-', ' '
  ))

  -- iCIMS: careers-<company>.icims.com / us-careers-<company>.icims.com / uscareers-<company>.icims.com
  WHEN company_link ~ '[^.]+\.icims\.com'
  THEN initcap(replace(
    regexp_replace(
      regexp_replace(company_link, '^https?://([^.]+)\.icims\.com.*$', '\1'),
      '^(uscareers-|us-careers-|careers-)', ''
    ),
    '-', ' '
  ))

  -- Eightfold: <company>.eightfold.ai (not the root domain)
  WHEN company_link ~ 'https?://[^.]+\.eightfold\.ai'
  THEN initcap(replace(
    regexp_replace(company_link, '^https?://([^.]+)\.eightfold\.ai.*$', '\1'),
    '-', ' '
  ))

  -- careers.* or jobs.* subdomain: careers.<company>.tld → <company>
  WHEN company_link ~ 'https?://(careers|jobs)\.[^.]+\.'
  THEN initcap(replace(
    regexp_replace(company_link, '^https?://(careers|jobs)\.([^.]+)\..*$', '\2'),
    '-', ' '
  ))

  -- <company>.recruiting.com
  WHEN company_link ~ '[^.]+\.recruiting\.com'
  THEN initcap(replace(
    regexp_replace(company_link, '^https?://([^.]+)\.recruiting\.com.*$', '\1'),
    '-', ' '
  ))

  -- Direct company sites: strip www., extract first domain segment before TLD
  -- e.g. plaid.com → Plaid, motherduck.com → Motherduck, jerry.ai → Jerry
  -- Skips Indeed (no meaningful company in the URL)
  WHEN company_link IS NOT NULL
    AND company_link NOT LIKE '%indeed.com%'
  THEN initcap(replace(
    split_part(
      regexp_replace(
        regexp_replace(company_link, '^https?://(www\.)?', ''),
        '\.(com|io|ai|co|org|net|app|careers)(/.*)?$', ''
      ),
      '.', 1
    ),
    '-', ' '
  ))

  ELSE NULL
END
WHERE company_name IS NULL OR company_name = '';
