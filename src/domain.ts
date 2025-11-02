// src/domain.ts

/**
 * ???뚯씪? ?깆쓽 ?듭떖 鍮꾩쫰?덉뒪 濡쒖쭅, 利?'湲됱뿬 怨꾩궛'留뚯쓣 ?대떦?섎뒗 ?쒖닔 ?⑥닔?ㅼ쓣 ?뺤쓽?⑸땲??
 * UI???곗씠????κ낵 ?꾩쟾??遺꾨━?섏뼱 ?덉뼱 ?뚯뒪?몄? ?좎?蹂댁닔媛 ?⑹씠?⑸땲??
 */

// --- ????뺤쓽 ---

// 湲됱뿬 怨꾩궛 諛⑹떇 ??? '?λ젰?? ?먮뒗 '?쒓툒??
export type PayType = "piece" | "hourly";
// ?λ젰??怨꾩궛 ?⑥쐞 ??? 'kg' ?먮뒗 'punnet'
export type PieceUnit = "kg" | "punnet" | "bucket";

// 湲됱뿬 怨꾩궛 ?⑥닔(computePayV2)???꾩슂??紐⑤뱺 ?낅젰媛믪쓣 ?뺤쓽?섎뒗 ?명꽣?섏씠??
export interface ComputePayInput {
  payType: PayType;
  rate: number;          // ?⑥쐞(kg, punnet, ?쒓컙)???④?
  taxPercent: number;    // ?멸툑 鍮꾩쑉 (0-100)
  
  // ?λ젰??piece)??寃쎌슦 ?꾩슂??媛?
  pieceUnit?: PieceUnit; // 怨꾩궛 ?⑥쐞 ('kg'媛 湲곕낯媛?
  quantity?: number;     // ?섑솗??(kg ?먮뒗 punnet 媛쒖닔)
  
  // ?쒓툒??hourly)??寃쎌슦 ?꾩슂??媛?
  hours?: number;
}

// 湲됱뿬 怨꾩궛 ?⑥닔??寃곌낵媛?援ъ“瑜??뺤쓽?섎뒗 ?명꽣?섏씠??
export interface ComputePayResult {
  gross: number;    // ?몄쟾 ?섏엯
  taxAmount: number; // ?멸툑??
  net: number;      // ?명썑 ?섏엯 (?ㅼ닔?뱀븸)
}


// --- ?ы띁 ?⑥닔 ---

/**
 * 二쇱뼱吏??レ옄瑜??뱀젙 踰붿쐞(理쒖냼~理쒕?) ?덉뿉 ?덈룄濡?媛믪쓣 議곗젙?섎뒗 ?⑥닔
 * @param v ?먮낯 ?レ옄
 * @param lo 理쒖냼媛?
 * @param hi 理쒕?媛?
 */
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));


// --- ?듭떖 怨꾩궛 ?⑥닔 ---

/**
 * 紐⑤뱺 湲됱뿬 怨꾩궛??泥섎━?섎뒗 硫붿씤 ?⑥닔 (踰꾩쟾 2)
 * @param input - ComputePayInput 媛앹껜
 * @returns ComputePayResult 媛앹껜 (?몄쟾, ?멸툑, ?명썑 ?섏엯)
 */
export function computePayV2(input: ComputePayInput): ComputePayResult {
  // 0蹂대떎 ?묒? 媛믪씠 ?ㅼ뼱?ㅼ? ?딅룄濡?蹂댁젙
  const rate = Math.max(0, input.rate || 0);
  // ?멸툑 鍮꾩쑉??0~100 ?ъ씠濡?怨좎젙?섍퀬, 怨꾩궛???꾪빐 100?쇰줈 ?섎닎 (?? 15% -> 0.15)
  const tax = clamp(input.taxPercent ?? 0, 0, 100) / 100;

  let gross = 0; // ?몄쟾 ?섏엯 珥덇린??
  
  if (input.payType === "piece") {
    // ?λ젰?쒖씪 寃쎌슦
    const qty = Math.max(0, input.quantity || 0);
    gross = rate * qty; // ?④? * ?섎웾
  } else {
    // ?쒓툒?쒖씪 寃쎌슦
    const hrs = Math.max(0, input.hours || 0);
    gross = rate * hrs; // ?쒓툒 * ?쒓컙
  }

  // ?뚯닔??2?먮━源뚯? 諛섏삱由쇳븯??怨꾩궛
  const taxAmount = +(gross * tax).toFixed(2);
  const net = +(gross - taxAmount).toFixed(2);
  return { gross: +gross.toFixed(2), taxAmount, net };
}
