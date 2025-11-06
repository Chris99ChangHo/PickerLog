// transform.js

const fs = require('fs');

// 1. 원본 파일 불러오기 (경로를 실제 파일 위치에 맞게 수정하세요)
// 예: assets/data 폴더 안에 australian_postcodes.json이 있다고 가정
const rawData = require('./assets/data/australian_postcodes.json');

console.log(`총 ${rawData.length}개의 데이터를 찾았습니다. 변환을 시작합니다...`);

// 2. 필요한 데이터만 뽑아내고, 기본값 추가하기
const cleanData = rawData.map(item => ({
  postcode: item.postcode,
  suburb: item.locality,      // locality를 suburb로 이름 변경
  state: item.state,
  eligible: false,            // 기본값 false 설정
  note: null                  // 기본값 null 설정
}));

// 3. 새로운 파일로 저장하기
// 같은 폴더에 postcodes.final.json 이름으로 저장됩니다.
fs.writeFileSync('./assets/data/postcodes.final.json', JSON.stringify(cleanData, null, 2));

console.log("완료! 'assets/data/postcodes.final.json' 파일이 생성되었습니다.");