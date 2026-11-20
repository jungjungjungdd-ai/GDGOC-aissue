// 행동 카드 3단 구성 (카드 화면·데모 화면 공용)
export const SECTIONS = [
  { key: 'now', title: '지금 바로', icon: '🚨', className: 'sec-now' },
  { key: 'within10Minutes', title: '10분 안에', icon: '⏱️', className: 'sec-soon' },
  { key: 'doNot', title: '하지 마세요', icon: '❌', className: 'sec-dont' },
];

export function sortedItems(card, key) {
  return [...(card.sections[key] ?? [])].sort((a, b) => (a.priority ?? 9) - (b.priority ?? 9));
}
