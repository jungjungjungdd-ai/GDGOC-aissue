# aissue - 맞춤형 재난문자 대응 웹앱

모두에게 똑같이 오는 재난문자를 '나는 지금 무엇부터 해야 하는지'로 바꿔 주는 모바일 웹앱(PWA)

## 실행 방법
```bash
npm install
npm install -g vercel   # 처음 한 번
cp .env.example .env    # 키는 팀장에게 받기
vercel dev              # 화면 + API 함께 실행
```
> `npm run dev`는 화면만 실행돼요. `api/`까지 확인하려면 `vercel dev`를 쓰세요.

## 폴더 구조
| 폴더 | 내용 |
|---|---|
| `src/pages` | 화면 |
| `src/components` | 공통 컴포넌트 |
| `src/lib` | 서버 호출 함수 |
| `api/` | 서버리스 API |
| `data/` | 목데이터, 국민행동요령 |

---

# 팀 규칙

## 브랜치
- `main`: 배포용. 팀장만 `develop` → `main` 머지
- `develop`: 개발 통합 브랜치. 직접 push 금지
- `feature/이슈번호-작업내용`: 각자 작업 브랜치 (예: `feature/7-profile`)

```bash
git switch develop
git pull
git switch -c feature/7-profile
```

## 이슈
- **제목:** `[영역] 내용`
  - 영역: `FE`, `BE`, `AI`, `Setup`, `Docs`
  - 예: `[FE] 프로필 입력·저장·수정`
- 본문에 **할 일**과 **완료 기준**을 체크리스트로 작성
- 작업을 시작하면 **Assignees**에 본인 지정
- 이슈 1개 = PR 1개가 기본

## 커밋 메시지
- **형식:** `타입: 내용`
- 예: `feat: 프로필 저장 기능 추가`, `fix: GPS 거부 시 멈추는 문제 수정`

| 타입 | 의미 |
|---|---|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `chore` | 설정, 데이터, 라이브러리 설치 등 |
| `docs` | 문서 |
| `refactor` | 동작은 그대로, 코드 정리 |
| `style` | 코드 포맷 (화면 디자인 아님) |

## PR
- **제목:** `[영역] 타입: 내용`
  - 예: `[FE] feat: 프로필 입력·저장·수정`
- **base 브랜치는 반드시 `develop`**
- 본문은 PR 템플릿에 맞춰 작성하고, 마지막에 `Closes #이슈번호` 적기
- 화면 작업은 스크린샷 첨부
- 올리기 전 체크
  - [ ] `develop` 최신 내용을 받은 뒤 작업했다
  - [ ] `vercel dev`로 실행해 확인했다
  - [ ] `.env`, `node_modules`가 포함되지 않았다
- 리뷰: 팀장 승인 후 머지
- 머지 방식: `feature` → `develop`은 **Squash and merge**
- 머지된 브랜치는 자동 삭제

## 기타
- `package.json`이 바뀌는 라이브러리 설치는 팀 채팅에 먼저 공유
- API 키는 코드나 채팅에 붙여넣지 않기 (`.env`에만)
- 막히거나 Git이 꼬이면 혼자 해결하려 하지 말고 바로 공유