import { defineConfig } from 'vite';

// GitHub Pages project site: https://<user>.github.io/<repo>/
const repoName = 'glaucoma-drop-calendar';

export default defineConfig({
  base: `/${repoName}/`,
});
