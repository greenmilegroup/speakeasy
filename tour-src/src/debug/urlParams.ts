export type QualityParam = 'high' | 'med' | 'low'

export interface UrlParams {
  /** show stats + orbit fly camera */
  debug: boolean
  /** deterministic camera pose for screenshots */
  cam: string | null
  layout: string | null
  quality: QualityParam | null
  /** ui=0 hides all DOM overlays for clean scene shots */
  ui: boolean
  /** skip the intro overlay and start rendering immediately */
  autoenter: boolean
}

function parse(): UrlParams {
  const q = new URLSearchParams(window.location.search)
  const quality = q.get('quality')
  return {
    debug: q.has('debug'),
    cam: q.get('cam'),
    layout: q.get('layout'),
    quality: quality === 'high' || quality === 'med' || quality === 'low' ? quality : null,
    ui: q.get('ui') !== '0',
    // a fixed screenshot camera implies skipping the intro too
    autoenter: q.has('autoenter') || q.has('cam') || q.has('debug'),
  }
}

export const URL_PARAMS: UrlParams = parse()
