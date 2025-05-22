import { generateSitemap } from '../src/server/sitemap';

export default async function handler(req, res) {
  return generateSitemap();
}