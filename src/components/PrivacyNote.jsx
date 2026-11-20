// 개인정보 안내 문구 (프로필·위치 화면 공용)
const TEXT = {
  profile: [
    '프로필은 이 폰에만 저장되고, 회원가입·로그인이 없어요.',
    '행동 카드를 만들 때만 프로필을 서버로 보내고, 서버에는 남기지 않아요.',
    '보호자 연락처는 서버로 보내지 않고, 내가 공유 버튼을 누를 때만 써요.',
  ],
  location: [
    '위치는 행동 카드와 가까운 대피소를 찾을 때만 써요.',
    '위치는 저장하지 않고, 화면을 닫으면 사라져요.',
  ],
};

export default function PrivacyNote({ variant = 'profile' }) {
  return (
    <aside className="privacy-note" aria-label="개인정보 안내">
      <strong>🔒 개인정보 안내</strong>
      <ul>
        {TEXT[variant].map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </aside>
  );
}
