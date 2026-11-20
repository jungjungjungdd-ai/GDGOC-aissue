import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { getProfile, getDraftLanguage, saveDraftLanguage } from '../lib/storage.js';

const LANGUAGES = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'zh', label: '中文' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState('intro'); // 'intro' → 'language'
  const [language, setLanguage] = useState(getDraftLanguage() ?? 'ko');

  // 프로필이 이미 있으면 온보딩을 건너뛰고 홈으로
  if (getProfile()) return <Navigate to="/" replace />;

  const goProfile = () => {
    saveDraftLanguage(language);
    navigate('/profile', { state: { language } });
  };

  if (step === 'intro') {
    return (
      <div className="screen onboarding">
        <div className="onboarding-icon" aria-hidden="true">⚠️</div>
        <h1>재난문자,<br />이제 나에게 맞게</h1>
        <p className="lead">
          모두에게 똑같이 오는 재난문자를
          <br />
          <strong>'나는 지금 무엇부터 해야 하는지'</strong>로 바꿔 드려요.
        </p>
        <ul className="feature-list">
          <li>🚨 내 상황에 맞는 행동 순서</li>
          <li>🏠 갈 수 있는 대피소 안내</li>
          <li>🌏 내 언어로 보기</li>
        </ul>
        <button className="btn-primary" onClick={() => setStep('language')}>
          시작하기
        </button>
      </div>
    );
  }

  return (
    <div className="screen onboarding">
      <h1>언어를 선택하세요</h1>
      <p className="muted">Choose your language · Chọn ngôn ngữ · 选择语言</p>

      <div className="option-list" role="radiogroup" aria-label="언어 선택">
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            role="radio"
            aria-checked={language === l.code}
            className={language === l.code ? 'option selected' : 'option'}
            onClick={() => setLanguage(l.code)}
          >
            {l.label}
          </button>
        ))}
      </div>

      <button className="btn-primary" onClick={goProfile}>
        다음
      </button>
      <button className="btn-text" onClick={() => setStep('intro')}>
        이전
      </button>
    </div>
  );
}
