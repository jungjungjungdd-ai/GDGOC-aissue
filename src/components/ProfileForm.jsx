import { useState } from 'react';

// 선택지 (값은 API 명세서 2-2 프로필 구조와 같음)
const LANGUAGES = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' },
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'zh', label: '中文' },
];
const MOBILITY = [
  { value: 'none', label: '없음' },
  { value: 'wheelchair', label: '휠체어 사용' },
  { value: 'limited', label: '보행 보조 필요' },
];
const SENSORY = [
  { value: 'visual', label: '시각' },
  { value: 'hearing', label: '청각' },
];
const DEPENDENTS = [
  { value: 'infant', label: '영유아' },
  { value: 'elderly', label: '노인' },
];
const HOUSING = [
  { value: 'semi_basement', label: '반지하' },
  { value: 'low_floor', label: '저층 (1~3층)' },
  { value: 'high_floor', label: '고층 (4층 이상)' },
];

export const EMPTY_PROFILE = {
  language: 'ko',
  mobility: 'none',
  sensory: [],
  livesAlone: false,
  dependents: [],
  housingType: '',
  guardian: { name: '', phone: '' },
};

// 하나만 고르기
function SingleChoice({ options, value, onChange }) {
  return (
    <div className="chip-group" role="radiogroup">
      {options.map((o) => (
        <button
          type="button"
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          className={value === o.value ? 'chip selected' : 'chip'}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// 여러 개 고르기 + "해당 없음"
function MultiChoice({ options, values, onChange }) {
  const toggle = (v) =>
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  return (
    <div className="chip-group">
      <button
        type="button"
        aria-pressed={values.length === 0}
        className={values.length === 0 ? 'chip selected' : 'chip'}
        onClick={() => onChange([])}
      >
        해당 없음
      </button>
      {options.map((o) => (
        <button
          type="button"
          key={o.value}
          aria-pressed={values.includes(o.value)}
          className={values.includes(o.value) ? 'chip selected' : 'chip'}
          onClick={() => toggle(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function ProfileForm({ initial, submitLabel = '저장하기', onSubmit, showLanguage = false }) {
  const [p, setP] = useState({ ...EMPTY_PROFILE, ...initial, guardian: { ...EMPTY_PROFILE.guardian, ...initial?.guardian } });
  const [error, setError] = useState('');
  const set = (key) => (value) => setP((prev) => ({ ...prev, [key]: value }));

  const submit = (e) => {
    e.preventDefault();
    if (!p.housingType) {
      setError('사는 곳의 형태를 선택해 주세요.');
      return;
    }
    setError('');
    const guardian = p.guardian.name || p.guardian.phone ? p.guardian : undefined;
    onSubmit({ ...p, guardian });
  };

  return (
    <form onSubmit={submit} className="profile-form">
      {showLanguage && (
        <fieldset>
          <legend>언어</legend>
          <SingleChoice options={LANGUAGES} value={p.language} onChange={set('language')} />
        </fieldset>
      )}

      <fieldset>
        <legend>움직이는 데 도움이 필요한가요?</legend>
        <SingleChoice options={MOBILITY} value={p.mobility} onChange={set('mobility')} />
      </fieldset>

      <fieldset>
        <legend>보거나 듣는 데 어려움이 있나요?</legend>
        <MultiChoice options={SENSORY} values={p.sensory} onChange={set('sensory')} />
      </fieldset>

      <fieldset>
        <legend>혼자 사나요?</legend>
        <SingleChoice
          options={[
            { value: true, label: '네, 혼자 살아요' },
            { value: false, label: '아니요, 함께 살아요' },
          ]}
          value={p.livesAlone}
          onChange={set('livesAlone')}
        />
      </fieldset>

      <fieldset>
        <legend>함께 챙겨야 할 가족이 있나요?</legend>
        <MultiChoice options={DEPENDENTS} values={p.dependents} onChange={set('dependents')} />
      </fieldset>

      <fieldset>
        <legend>사는 곳은 어떤 형태인가요? *</legend>
        <SingleChoice options={HOUSING} value={p.housingType} onChange={set('housingType')} />
      </fieldset>

      <fieldset>
        <legend>보호자 연락처 (선택)</legend>
        <input
          className="input"
          placeholder="이름 (예: 엄마)"
          value={p.guardian.name}
          onChange={(e) => setP((prev) => ({ ...prev, guardian: { ...prev.guardian, name: e.target.value } }))}
        />
        <input
          className="input"
          type="tel"
          inputMode="tel"
          placeholder="연락처 (예: 010-1234-5678)"
          value={p.guardian.phone}
          onChange={(e) => setP((prev) => ({ ...prev, guardian: { ...prev.guardian, phone: e.target.value } }))}
        />
      </fieldset>

      {error && <p className="error" role="alert">{error}</p>}
      <button type="submit" className="btn-primary">{submitLabel}</button>
    </form>
  );
}
