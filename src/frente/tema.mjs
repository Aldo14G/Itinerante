// Tema Astryx «Itinerante» (SPEC-MIGRACION-ASTRYX §1). Variables CSS sobre la paleta B; no se usa theme-neutral.
// Lo compila a CSS scripts/build-tema-astryx.mjs (src/frente/tema-itinerante.css), así el HTML del servidor ya trae el tema
// y la página se lee igual sin JavaScript.
import { defineTheme } from '@astryxdesign/core/theme';
import { PALETA as P } from './paleta.mjs';

const LETRA = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export const TEMA_NOMBRE = 'itinerante';

export const temaItinerante = defineTheme({
  name: TEMA_NOMBRE,
  tokens: {
    '--color-accent': P.turquesaTinta,
    '--color-accent-muted': 'rgba(35, 104, 97, 0.14)',
    '--color-on-accent': P.blanco,
    '--color-text-primary': P.hollin,
    '--color-text-secondary': P.piedra,
    '--color-text-accent': P.turquesaTinta,
    '--color-icon-primary': P.hollin,
    '--color-icon-secondary': P.piedra,
    '--color-icon-accent': P.turquesaTinta,
    '--color-background-body': P.papel,
    '--color-background-surface': P.papel,
    '--color-background-card': P.papel,
    '--color-background-popover': P.papel,
    '--color-background-muted': P.cal,
    '--color-background-inverted': P.mosaico,
    '--color-neutral': 'rgba(90, 64, 55, 0.12)',
    '--color-overlay-hover': 'rgba(29, 20, 17, 0.06)',
    '--color-overlay-pressed': 'rgba(29, 20, 17, 0.12)',
    '--color-success': P.patio,
    '--focus-outline-color': P.turquesaTinta,
    '--focus-outline-width': '3px',
    '--focus-outline-offset': '2px',
    '--font-family-body': LETRA,
    '--font-family-heading': LETRA,
    '--radius-element': '10px',
    '--radius-container': '16px',
  },
  motion: { tempo: 1, character: 'standard' },
  components: {
    // Objetivos táctiles de 44 px o más (WCAG 2.5.5): Astryx trae botones de 28–36 px.
    button: { base: { minHeight: '44px', minWidth: '44px' } },
  },
});
