// Tile content. `right` is the small label phantom-style tiles carry in the
// bottom-right corner: a price for dishes, a year for rooms.
export const TILES = [
  { img: '1544025162-d76694265947', name: 'Smoked short rib', course: 'MAIN', tags: ['WOOD-FIRED', 'FOR TWO'], right: '38', desc: 'Twelve hours over oak, finished on the open grate. Carved at the table.' },
  { img: '1504674900247-0877df9cc836', name: 'Seared tri-tip, herbs', course: 'MAIN', tags: ['WOOD-FIRED', 'SEASONAL'], right: '29', desc: 'Sliced rare off the bone, buried in soft herbs and burnt onion.' },
  { img: '1525610553991-2bede1a236e2', name: 'The dining room', course: 'ROOM', tags: ['THE ROOM', '38 SEATS'], right: '2012', desc: 'One long room, one fire. Every table can see the oven.' },
  { img: '1490645935967-10de6ba17061', name: 'Garden bowl, soft egg', course: 'STARTER', tags: ['VEGETARIAN', 'SEASONAL'], right: '14', desc: 'Whatever the farm trucks brought, raw and embered, under a six-minute egg.' },
  { img: '1476224203421-9ac39bcb3327', name: 'Whole trout, brown butter', course: 'MAIN', tags: ['WOOD-FIRED', 'CLASSIC'], right: '27', desc: 'Crisp skin, soft herbs, a pan of brown butter poured over at the table.' },
  { img: '1493770348161-369560ae357d', name: 'Hearth brunch board', course: 'BRUNCH', tags: ['WEEKENDS', 'FOR TWO'], right: '24', desc: 'Hearth breads, soft eggs, smoked butter and preserves. Saturdays and Sundays only.' },
  { img: '1424847651672-bf20a4b0982b', name: 'Smoked waffle, ember syrup', course: 'BRUNCH', tags: ['WEEKENDS', 'SWEET'], right: '16', desc: 'Cast-iron waffle, syrup warmed over the coals, cultured cream.' },
  { img: '1550966871-3ed3cdb5ed0c', name: 'The window tables', course: 'ROOM', tags: ['THE ROOM', 'DAYLIGHT'], right: '2015', desc: 'Six tables in the morning sun. The quietest seats in the house.' },
  { img: '1574484284002-952d92456975', name: 'Cast-iron salmon, citrus', course: 'MAIN', tags: ['WOOD-FIRED', 'SPICED'], right: '31', desc: 'Blistered in the pan with charred lemon and chile butter.' },
  { img: '1606756790138-261d2b21cd75', name: 'Ember small plates', course: 'STARTER', tags: ['SHARED', 'ROTATING'], right: '12', desc: 'Three or four little things from the fire. Changes nightly.' },
  { img: '1559329007-40df8a9345d8', name: 'Service, from above', course: 'ROOM', tags: ['THE ROOM', 'EVENINGS'], right: '2019', desc: 'Full house on a Friday. The fire never gets a night off.' },
  { img: '1592861956120-e524fc739696', name: 'Long lunch', course: 'ROOM', tags: ['DAYLIGHT', 'THU TO SUN'], right: '2021', desc: 'Lunch runs slow here on purpose. Stay for the third coffee.' },
  { img: '1517248135467-4c7edcad34c4', name: 'The back room', course: 'ROOM', tags: ['PRIVATE', '12 SEATS'], right: '2017', desc: 'Twelve seats behind the kitchen wall. Yours for the night.' },
  { img: '1555396273-367ea4eb4db5', name: 'The corner room', course: 'ROOM', tags: ['THE ROOM', 'EST. 2012'], right: '2012', desc: 'Same corner, same oven, a few more scorch marks.' },
  { img: '1414235077428-338989a2e8c0', name: 'Chef’s plate, candlelight', course: 'SPECIAL', tags: ['TASTING', 'NIGHTLY'], right: '58', desc: 'Whatever the chef is proudest of tonight, plated at the pass.' },
  { img: '1466978913421-dad2ebd01d17', name: 'Shared plates, late', course: 'FEAST', tags: ['SHARED', 'AFTER 21:00'], right: '22', desc: 'The late menu: things to pass around when the room gets loud.' },
  { img: '1518843875459-f738682238a6', name: 'Market vegetables, ash oil', course: 'SIDE', tags: ['VEGETARIAN', 'SEASONAL'], right: '11', desc: 'Roasted whole in the dying fire, dressed with ash oil and salt.' },
  { img: '1542838132-92c53300491e', name: 'From the market', course: 'PANTRY', tags: ['SOURCING', 'DAILY'], right: '2025', desc: 'The chalkboard gets written at noon, after the market. Not before.' },
  { img: '1506976785307-8732e854ad03', name: 'Hen eggs, smoked salt', course: 'BRUNCH', tags: ['WEEKENDS', 'SIMPLE'], right: '9', desc: 'Soft-boiled over toast, smoked salt, nothing else.' },
  { img: '1573246123716-6b1782bfc499', name: 'Autumn squash, harvest', course: 'SIDE', tags: ['VEGETARIAN', 'AUTUMN'], right: '13', desc: 'Squash and late fruit, coal-roasted, honey and thyme.' },
]

export function imgUrl(id, w = 640) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`
}
