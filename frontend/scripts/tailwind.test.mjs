import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import postcss from 'postcss';
import config from '../postcss.config.js';

test('PostCSS compiles the application stylesheet and migrated utilities', async () => {
  const plugins = await Promise.all(Object.entries(config.plugins).map(async ([name, options]) => {
    const { default: plugin } = await import(name);
    return plugin(options);
  }));
  const from = new URL('../src/index.css', import.meta.url).pathname;
  const source = await readFile(from, 'utf8');
  const { css } = await postcss(plugins).process(source, { from });
  assert.doesNotMatch(css, /@(?:import ['"]tailwindcss|tailwind)\b/);
  for (const selector of ['.flex', '.shrink-0', '.grow', '.shadow-xs', '.outline-hidden', '.bg-black\\/50', '.bg-gray-600\\/50']) {
    assert.ok(css.includes(`${selector} {`), `Missing generated utility: ${selector}`);
  }
});
