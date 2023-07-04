const lintStagedConfig = {
  '*.{csj,mjs,html,css,md}': ['prettier --write'],
  '*.{ts,tsx}': ['prettier --write', 'bash -c "pnpm lint:types"', 'eslint --fix'],
};

export default lintStagedConfig;
