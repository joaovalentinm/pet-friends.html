/**
 * Tokens do Design System da Pet Friends. Documentação: docs/DESIGN_SYSTEM.md
 * As telas usam classes do Tailwind (geradas de palette.js). Use este objeto
 * só onde classes não chegam (SVG inline, meta tags, gráficos).
 */
import palette from './palette.js';

export const colors = palette.semantic;
export const brand = palette.brand;
export const avatarColors = palette.avatarColors;
