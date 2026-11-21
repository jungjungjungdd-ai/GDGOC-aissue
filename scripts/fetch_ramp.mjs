// 대피소별 경사로(접근성) 정보 받아오기
// 공공데이터포털 "한국사회보장정보원_장애인편의시설 현황" 오픈API
//
// 1) 받기:  node scripts/fetch_ramp.mjs fetch [최대 대피소 수, 기본 45]
//    - 대피소 주소로 목록조회 → 같은 주소의 시설ID → 기구표목록 조회
//    - 응답 원문은 data/raw/ramp/ 에 저장 (한 번 받은 건 다시 호출하지 않음)
//    - 일일 호출 한도: 기능별 100회 → 하루 약 45곳씩, 정왕동부터
// 2) 반영:  node scripts/fetch_ramp.mjs apply
//    - 저장된 원문을 읽어 data/shelters.json 에 접근성 정보를 채움 (호출 없음)
//
// .env 에 DATA_GO_KR_KEY=일반 인증키(Decoding) 필요
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHELTERS = path.join(ROOT, 'data/shelters.json');
const CACHE = path.join(ROOT, 'data/raw/ramp');
const BASE =
  process.env.DATA_GO_KR_BASE ||
  'https://apis.data.go.kr/B554287/DisabledPersonConvenientFacility';

function loadEnv() {
  for (const name of ['.env', '.env.local']) {
    const file = path.join(ROOT, name);
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}

// --- 아주 단순한 XML 읽기 (item 단위) ---
export function parseItems(xml) {
  const items = [];
  // 이 API는 목록 항목을 <servList> 로 줌 (일반 API는 <item>)
  for (const m of xml.matchAll(/<(item|servList)>([\s\S]*?)<\/\1>/g)) {
    const obj = {};
    for (const t of m[2].matchAll(/<([A-Za-z0-9_]+)>([\s\S]*?)<\/\1>/g)) obj[t[1]] = t[2].trim();
    items.push(obj);
  }
  return items;
}
function apiError(xml) {
  const code = xml.match(/<(?:resultCode|returnReasonCode)>([^<]*)</)?.[1];
  const msg = xml.match(/<(?:resultMsg|returnAuthMsg|errMsg)>([^<]*)</)?.[1];
  if (code && !/^0+$/.test(code)) return `${code} ${msg ?? ''}`.trim();
  if (/SERVICE_KEY|SERVICE ERROR|LIMITED_NUMBER/i.test(xml) && !/<item>/.test(xml)) return xml.slice(0, 200);
  return null;
}

// 대피소 이름에서 건물 이름만: "정왕3동 신호아파트 지하주차장 1층" → "신호아파트"
function buildingOf(name) {
  return name.replace(/\s*(지하\s*)?\d+\s*층.*$/, '').trim();
}

// 찾은 편의시설이 정말 그 대피소인지: 좌표 400m 이내 (좌표가 없으면 도로명이 같은지)
function distM(a1, o1, a2, o2) {
  const r = (d) => (d * Math.PI) / 180;
  const h = Math.sin(r(a2 - a1) / 2) ** 2 + Math.cos(r(a1)) * Math.cos(r(a2)) * Math.sin(r(o2 - o1) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}
function isSamePlace(shelter, f) {
  const lat = Number(f.faclLat), lng = Number(f.faclLng);
  if (lat && lng) return distM(shelter.latitude, shelter.longitude, lat, lng) <= 400;
  return (f.lcMnad ?? '').includes(roadOf(shelter.address).split(' ')[0]);
}

// "경기도 시흥시 중심상가로 248 (정왕동)" → "중심상가로 248"
function roadOf(address) {
  return address.replace(/\(.*\)/, '').replace(/^경기도\s+시흥시\s+/, '').trim();
}
const safe = (s) => s.replace(/[^A-Za-z0-9_-]/g, '_');

async function call(fn, params) {
  const url = new URL(`${BASE}/${fn}`);
  url.searchParams.set('serviceKey', process.env.DATA_GO_KR_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  const err = apiError(text);
  if (err) throw new Error(err);
  return text;
}

async function fetchAll(max) {
  loadEnv();
  if (!process.env.DATA_GO_KR_KEY) throw new Error('.env 에 DATA_GO_KR_KEY 가 없습니다.');
  fs.mkdirSync(path.join(CACHE, 'list'), { recursive: true });
  fs.mkdirSync(path.join(CACHE, 'detail'), { recursive: true });

  const shelters = JSON.parse(fs.readFileSync(SHELTERS, 'utf8'));
  // 정왕동 먼저
  const order = [...shelters].sort((a, b) => (b.address.includes('정왕') ? 1 : 0) - (a.address.includes('정왕') ? 1 : 0));
  let done = 0, calls = 0;
  for (const s of order) {
    if (done >= max) break;
    const listFile = path.join(CACHE, 'list', safe(s.id) + '.xml');
    let xml;
    if (fs.existsSync(listFile)) xml = fs.readFileSync(listFile, 'utf8');
    else {
      xml = await call('getDisConvFaclList', { pageNo: 1, numOfRows: 50, siDoNm: '경기도', cggNm: '시흥시', roadNm: roadOf(s.address) });
      fs.writeFileSync(listFile, xml);
      calls++;
      done++;
    }
    // 주소로 못 찾으면 건물 이름으로 한 번 더
    const nameFile = path.join(CACHE, 'list', safe(s.id) + '-name.xml');
    if (!parseItems(xml).length && buildingOf(s.name)) {
      if (fs.existsSync(nameFile)) xml = fs.readFileSync(nameFile, 'utf8');
      else {
        xml = await call('getDisConvFaclList', { pageNo: 1, numOfRows: 50, siDoNm: '경기도', cggNm: '시흥시', faclNm: buildingOf(s.name) });
        fs.writeFileSync(nameFile, xml);
        calls++;
      }
    }
    for (const it of parseItems(xml)) {
      const id = it.wfcltId;
      if (!id || !isSamePlace(s, it)) continue; // 다른 동네 같은 이름 시설은 건너뜀
      const detailFile = path.join(CACHE, 'detail', safe(id) + '.xml');
      if (fs.existsSync(detailFile)) continue;
      fs.writeFileSync(detailFile, await call('getFacInfoOpenApiJpEvalInfoList', { wfcltId: id }));
      calls++;
    }
    const matched = parseItems(xml).filter((f) => isSamePlace(s, f)).length;
    console.log(`✓ ${s.name} (${roadOf(s.address)}) - 일치 시설 ${matched}곳`);
  }
  console.log(`이번 실행 API 호출 ${calls}회. 다음: node scripts/fetch_ramp.mjs apply`);
}

// 경사로·접근로 관련 기구표 항목
// '주출입구 높이차이 제거' = 문턱·단차 없이 들어갈 수 있게 한 시설(경사로 등)
const RAMP_WORDS = /경사로|높이\s*차이\s*제거/;

function apply() {
  const shelters = JSON.parse(fs.readFileSync(SHELTERS, 'utf8'));
  let filled = 0;
  for (const s of shelters) {
    const listFile = path.join(CACHE, 'list', safe(s.id) + '.xml');
    if (!fs.existsSync(listFile)) continue;
    const nameFile = path.join(CACHE, 'list', safe(s.id) + '-name.xml');
    let facilities = parseItems(fs.readFileSync(listFile, 'utf8')).filter((f) => isSamePlace(s, f));
    if (!facilities.length && fs.existsSync(nameFile))
      facilities = parseItems(fs.readFileSync(nameFile, 'utf8')).filter((f) => isSamePlace(s, f));
    // 같은 주소의 시설 중 '대피소' 유형 우선, 없으면 공동주택
    const pick =
      facilities.find((f) => /대피소/.test(f.faclTyCd ?? '')) ||
      facilities.find((f) => /아파트|공동주택|연립|다세대/.test(f.faclTyCd ?? '')) ||
      facilities[0];
    if (!pick?.wfcltId) { s.accessibility = { matched: false }; continue; }
    const detailFile = path.join(CACHE, 'detail', safe(pick.wfcltId) + '.xml');
    const items = fs.existsSync(detailFile) ? parseItems(fs.readFileSync(detailFile, 'utf8')) : [];
    const features = [...new Set(items.flatMap((it) => (it.evalInfo ?? '').split(',').map((x) => x.trim()).filter(Boolean)))];
    const ramp = features.filter((f) => RAMP_WORDS.test(f));
    s.accessibility = {
      matched: true,
      source: '한국사회보장정보원 장애인편의시설 현황',
      facilityName: pick.faclNm ?? null,
      facilityId: pick.wfcltId,
      features, // 기구표에 등록된 편의시설 항목 (원문)
    };
    s.rampAvailable = ramp.length ? true : null; // 없다고 확정할 수 없어서 false는 쓰지 않음
    filled++;
  }
  fs.writeFileSync(SHELTERS, JSON.stringify(shelters, null, 1) + '\n');
  console.log(`접근성 정보 반영: ${filled}곳 / 경사로·접근로 확인: ${shelters.filter((s) => s.rampAvailable).length}곳`);
}

const [cmd = 'fetch', arg] = process.argv.slice(2);
if (cmd === 'apply') apply();
else fetchAll(Number(arg) || 45).catch((e) => {
  console.error("실패:", e.message);
  process.exitCode = 1;
});
