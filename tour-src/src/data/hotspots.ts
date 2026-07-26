import type { LayoutId } from './layouts'

export const BOOKING_URL = 'https://speakeasyottawa.com/host-your-event'

export const VENUE = {
  name: 'Speakeasy Tapas Lounge',
  address: '55 York St, ByWard Market, Ottawa',
  phone: '+1 613-241-6221',
  phoneHref: 'tel:+16132416221',
  website: 'https://speakeasyottawa.com',
} as const

export interface HotspotSpec {
  id: 'bar' | 'stage' | 'dining' | 'host'
  title: string
  /** marker position in the 3D scene */
  position: readonly [number, number, number]
  paragraphs: string[]
  facts?: { label: string; value: string }[]
  /** offer a "view in this layout" switch on the card */
  linkLayout?: LayoutId
}

export const HOTSPOTS: HotspotSpec[] = [
  {
    id: 'host',
    title: 'Host Your Event',
    position: [0, 1.75, 6.6],
    paragraphs: [
      'The whole room can be yours — exclusive use for your designated time, with a menu built around your vision.',
      'Choose an intimate dinner, a cocktail reception with open bar, or a gallery-style artistic showcase.',
    ],
    facts: [
      { label: 'Seated', value: '60 guests' },
      { label: 'Standing', value: '100 guests' },
      { label: 'Packages', value: 'Dining · Premium · Showcase' },
    ],
    linkLayout: 'cocktail',
  },
  {
    id: 'bar',
    title: 'The Bar',
    position: [-3.1, 1.55, 3],
    paragraphs: [
      'Expertly crafted cocktails, house wines and an impressive back bar under industrial pendants and exposed brick.',
      'Premium event packages include a welcome cocktail and open bar service.',
    ],
    facts: [
      { label: 'Signature', value: 'Craft cocktails & tapas pairings' },
      { label: 'Open bar', value: 'Available with Premium package' },
    ],
    linkLayout: 'cocktail',
  },
  {
    id: 'stage',
    title: 'The Stage',
    position: [0, 1.7, -7],
    paragraphs: [
      'Live jazz fills the room every Friday and Saturday night from this candlelit corner stage.',
      'Book your own performers, host speeches, or run an artist showcase — sound and stage lighting are in place.',
    ],
    facts: [
      { label: 'Live jazz', value: 'Fridays & Saturdays' },
      { label: 'Great for', value: 'Live music · toasts · showcases' },
    ],
    linkLayout: 'showcase',
  },
  {
    id: 'dining',
    title: 'The Dining Room',
    position: [1.7, 1.5, 0.4],
    paragraphs: [
      'Black-linen tables, candlelight and internationally inspired tapas — the room seats 60 for a full dinner service.',
      'The banquette wall and moody lighting keep even big nights feeling intimate.',
    ],
    facts: [
      { label: 'Seated dinner', value: 'Up to 60' },
      { label: 'Menu', value: 'Fully customizable' },
    ],
    linkLayout: 'dinner',
  },
]
