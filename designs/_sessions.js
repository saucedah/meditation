// Shared session list (same content across all 5 designs)
window.SESSIONS = [
  // Cleansing + Breathwork
  { id: 'limpieza', cat: 'cleansing', emoji: '✨', title: 'Limpieza Energética', desc: 'Mantras y cánticos de elevación espiritual.', duration: '31m' },
  { id: 'wim-hof',  cat: 'cleansing', emoji: '🧘', title: 'Meditación Cuántica', desc: 'Viaje al interior con el método Wim Hof.', duration: '23m' },
  // Frequencies
  { id: 'third-eye', cat: 'frequency', emoji: '👁️', title: 'Tercer Ojo', desc: '963 + 852 + 639 Hz · glándula pineal y chakra del corazón.', duration: '71m' },
  { id: 'oneness',   cat: 'frequency', emoji: '🕉️', title: 'Unidad', desc: '963 Hz · regreso a la fuente.', duration: '63m' },
  { id: 'positive',  cat: 'frequency', emoji: '🌟', title: 'Energía Positiva', desc: 'Atrae paz, abundancia y éxito.', duration: '60m' },
  { id: 'angels',    cat: 'frequency', emoji: '😇', title: 'Ángeles & Arcángeles', desc: '432 Hz · sanación de cuerpo, alma y espíritu.', duration: '60m' },
  // RA Series
  { id: 'ra-1', cat: 'ra', emoji: '①', title: 'RA 1 · Dualidad y Trinidad',     desc: 'Activación de la dualidad y la trinidad.', duration: '13m' },
  { id: 'ra-2', cat: 'ra', emoji: '②', title: 'RA 2 · Luz Pránica',              desc: 'Respiración pránica de 4 tiempos y limpieza con luz blanca.', duration: '14m' },
  { id: 'ra-3', cat: 'ra', emoji: '③', title: 'RA 3 · Iluminación del Cuerpo',   desc: 'Limpieza detallada de órganos y sistemas con luz blanca.', duration: '27m' },
  { id: 'ra-4-1', cat: 'ra', emoji: '④', title: 'RA 4.1 · Líneas Temporales',    desc: 'Cerrar líneas temporales.', duration: '9m' },
  { id: 'ra-4-2', cat: 'ra', emoji: '④', title: 'RA 4.2 · Implantes',            desc: 'Desparasitación y eliminación de implantes.', duration: '9m' },
  { id: 'ra-5', cat: 'ra', emoji: '⑤', title: 'RA 5 · Conexión con la Existencia', desc: 'Viaje guiado a la naturaleza y compasión universal.', duration: '49m' },
  { id: 'ra-6', cat: 'ra', emoji: '⑥', title: 'RA 6 · Niño Interior',            desc: 'Sanación del niño interior.', duration: '42m' },
  { id: 'ra-7', cat: 'ra', emoji: '⑦', title: 'RA 7 · Cámara del Corazón',       desc: 'Entrada a la Cámara Sagrada del Corazón.', duration: '57m' },
  // Extracts
  { id: 'meditacion-consciente', cat: 'extracts', emoji: '🌌', title: 'Meditación Consciente',          desc: 'Visualización de chakras girando, guiada con música.', duration: '23m' },
  { id: 'sanacion-vidas-pasadas', cat: 'extracts', emoji: '🌀', title: 'Sanación de Vidas Pasadas',     desc: 'Visualización dentro de una gran pirámide; luz dorada.', duration: '60m' },
  { id: 'cuerpos-sutiles', cat: 'extracts', emoji: '🔮', title: 'Activación de Cuerpos Sutiles',         desc: 'Mantras de los 12 cuerpos hasta el yo soy.', duration: '48m' },
  { id: 'activation-pineal', cat: 'extracts', emoji: '🌙', title: 'Activación de Glándula Pineal',      desc: 'Visualización numérica y descalcificación.', duration: '10m' },
];
window.CATEGORIES = [
  { id: 'cleansing', label: 'Limpieza & Sanación' },
  { id: 'frequency', label: 'Frecuencias' },
  { id: 'ra',        label: 'Serie RA' },
  { id: 'extracts',  label: 'Otras Meditaciones' },
];
