/**
 * Maps a client timezone (from Intl.DateTimeFormat().resolvedOptions().timeZone)
 * to a country label for lead reporting. Focused on Latin America + common
 * regions for Meta Ads traffic directed at Colombian business owners.
 */
const TZ_TO_COUNTRY: Record<string, string> = {
  'America/Bogota': 'Colombia',
  'America/Mexico_City': 'México',
  'America/Monterrey': 'México',
  'America/Cancun': 'México',
  'America/Tijuana': 'México',
  'America/New_York': 'Estados Unidos',
  'America/Detroit': 'Estados Unidos',
  'America/Chicago': 'Estados Unidos',
  'America/Denver': 'Estados Unidos',
  'America/Phoenix': 'Estados Unidos',
  'America/Los_Angeles': 'Estados Unidos',
  'America/Santiago': 'Chile',
  'America/Lima': 'Perú',
  'America/Guayaquil': 'Ecuador',
  'America/Caracas': 'Venezuela',
  'America/Panama': 'Panamá',
  'America/Costa_Rica': 'Costa Rica',
  'America/Guatemala': 'Guatemala',
  'America/El_Salvador': 'El Salvador',
  'America/Tegucigalpa': 'Honduras',
  'America/Managua': 'Nicaragua',
  'America/Havana': 'Cuba',
  'America/Santo_Domingo': 'República Dominicana',
  'America/Port-au-Prince': 'Haití',
  'America/Puerto_Rico': 'Puerto Rico',
  'America/Jamaica': 'Jamaica',
  'America/Sao_Paulo': 'Brasil',
  'America/Rio_Branco': 'Brasil',
  'America/Noronha': 'Brasil',
  'America/Montevideo': 'Uruguay',
  'America/La_Paz': 'Bolivia',
  'America/Asuncion': 'Paraguay',
  'America/Argentina/Buenos_Aires': 'Argentina',
  'America/Argentina/Cordoba': 'Argentina',
  'America/Argentina/Mendoza': 'Argentina',
  'Europe/Madrid': 'España',
  'Atlantic/Canary': 'España',
  'Europe/London': 'Reino Unido',
  'Europe/Paris': 'Francia',
  'Europe/Berlin': 'Alemania',
  'Europe/Rome': 'Italia',
  'Europe/Lisbon': 'Portugal',
  'America/Toronto': 'Canadá',
  'America/Vancouver': 'Canadá',
}

/** Maps a browser language region subtag (e.g. the "CO" in "es-CO") to a country. */
const LANG_REGION_TO_COUNTRY: Record<string, string> = {
  co: 'Colombia',
  mx: 'México',
  ar: 'Argentina',
  cl: 'Chile',
  pe: 'Perú',
  ec: 'Ecuador',
  ve: 'Venezuela',
  do: 'República Dominicana',
  gt: 'Guatemala',
  cr: 'Costa Rica',
  pa: 'Panamá',
  uy: 'Uruguay',
  py: 'Paraguay',
  bo: 'Bolivia',
  hn: 'Honduras',
  ni: 'Nicaragua',
  sv: 'El Salvador',
  cu: 'Cuba',
  pr: 'Puerto Rico',
  us: 'Estados Unidos',
  ca: 'Canadá',
  gb: 'Reino Unido',
  es: 'España',
  br: 'Brasil',
}

export function countryFromTimezone(
  tz: string | undefined | null,
  lang?: string | undefined | null
): string | null {
  if (tz && typeof tz === 'string') {
    const byTz = TZ_TO_COUNTRY[tz.trim()]
    if (byTz) return byTz
  }
  // Fallback: browser languages like "es-CO,es;q=0.9" / "pt-BR"
  if (lang && typeof lang === 'string') {
    for (const part of lang.toLowerCase().split(',')) {
      const tag = part.split(';')[0].trim()
      const region = tag.split('-')[1]
      if (region && LANG_REGION_TO_COUNTRY[region]) {
        return LANG_REGION_TO_COUNTRY[region]
      }
    }
  }
  return null
}
