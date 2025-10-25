// src/domain.ts

/**
 * 이 파일은 앱의 핵심 비즈니스 로직, 즉 '급여 계산'만을 담당하는 순수 함수들을 정의합니다.
 * UI나 데이터 저장과 완전히 분리되어 있어 테스트와 유지보수가 용이합니다.
 */

// --- 타입 정의 ---

// 급여 계산 방식 타입: '능력제' 또는 '시급제'
export type PayType = "piece" | "hourly";
// 능력제 계산 단위 타입: 'kg' 또는 'punnet'
export type PieceUnit = "kg" | "punnet";

// 급여 계산 함수(computePayV2)에 필요한 모든 입력값을 정의하는 인터페이스
export interface ComputePayInput {
  payType: PayType;
  rate: number;          // 단위(kg, punnet, 시간)당 단가
  taxPercent: number;    // 세금 비율 (0-100)
  
  // 능력제(piece)일 경우 필요한 값
  pieceUnit?: PieceUnit; // 계산 단위 ('kg'가 기본값)
  quantity?: number;     // 수확량 (kg 또는 punnet 개수)
  
  // 시급제(hourly)일 경우 필요한 값
  hours?: number;
}

// 급여 계산 함수의 결과값 구조를 정의하는 인터페이스
export interface ComputePayResult {
  gross: number;    // 세전 수입
  taxAmount: number; // 세금액
  net: number;      // 세후 수입 (실수령액)
}


// --- 헬퍼 함수 ---

/**
 * 주어진 숫자를 특정 범위(최소~최대) 안에 있도록 값을 조정하는 함수
 * @param v 원본 숫자
 * @param lo 최소값
 * @param hi 최대값
 */
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));


// --- 핵심 계산 함수 ---

/**
 * 모든 급여 계산을 처리하는 메인 함수 (버전 2)
 * @param input - ComputePayInput 객체
 * @returns ComputePayResult 객체 (세전, 세금, 세후 수입)
 */
export function computePayV2(input: ComputePayInput): ComputePayResult {
  // 0보다 작은 값이 들어오지 않도록 보정
  const rate = Math.max(0, input.rate || 0);
  // 세금 비율을 0~100 사이로 고정하고, 계산을 위해 100으로 나눔 (예: 15% -> 0.15)
  const tax = clamp(input.taxPercent ?? 0, 0, 100) / 100;

  let gross = 0; // 세전 수입 초기화
  
  if (input.payType === "piece") {
    // 능력제일 경우
    const qty = Math.max(0, input.quantity || 0);
    gross = rate * qty; // 단가 * 수량
  } else {
    // 시급제일 경우
    const hrs = Math.max(0, input.hours || 0);
    gross = rate * hrs; // 시급 * 시간
  }

  // 소수점 2자리까지 반올림하여 계산
  const taxAmount = +(gross * tax).toFixed(2);
  const net = +(gross - taxAmount).toFixed(2);
  return { gross: +gross.toFixed(2), taxAmount, net };
}