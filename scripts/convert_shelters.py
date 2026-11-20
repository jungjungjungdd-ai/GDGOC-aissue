"""공공데이터 민방위대피시설 CSV → data/shelters.json 변환

원본: data/raw/민방위대피시설현황(제공표준)- 경기 시흥시.csv (cp949)
좌표: 좌표정보(X, Y)는 UTM-K(EPSG:5179) → WGS84 위경도로 변환
실행: pip install pyproj && python scripts/convert_shelters.py
"""
import csv
import io
import json
import re
from pathlib import Path

from pyproj import Transformer

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data/raw/민방위대피시설현황(제공표준)- 경기 시흥시.csv"
OUT = ROOT / "data/shelters.json"

to_wgs84 = Transformer.from_crs("EPSG:5179", "EPSG:4326", always_xy=True)
rows = list(csv.DictReader(io.StringIO(SRC.read_bytes().decode("cp949"))))

items = []
for r in rows:
    if r["상세영업상태명"].strip() != "사용중" or r["해제일자"].strip():
        continue
    x, y = r["좌표정보(X)"].strip(), r["좌표정보(Y)"].strip()
    if not x or not y:
        continue
    lng, lat = to_wgs84.transform(float(x), float(y))
    address = re.sub(r"(\d)-0\b", r"\1", r["도로명전체주소"].strip()) or r["소재지전체주소"].strip()
    area = r["소재지면적(N/㎡)"].strip()
    items.append({
        "id": "shl_siheung_" + r["관리번호"].strip(),
        "name": r["비상시설위치"].strip() or address,
        "address": address,
        "latitude": round(lat, 6),
        "longitude": round(lng, 6),
        "facilityType": r["시설구분명"].strip(),
        "areaM2": float(area) if area else None,
        # 공공데이터에 없는 정보 → null (알 수 없음)
        "rampAvailable": None,
        "petAllowed": None,
    })

OUT.write_text(json.dumps(items, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
print(f"{len(rows)}건 중 {len(items)}건 저장 → {OUT.relative_to(ROOT)}")
