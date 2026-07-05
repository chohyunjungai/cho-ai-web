// 슉슉이 — 상태·안내의 전달자 (DESIGN §2). 화면당 최대 1회, 콘텐츠 영역 진입 금지.
// 포즈 번호: 1 인사 2 전구 3 팔X자 4 돋보기 5 책 6 망토질주 7 고민 8 땀닦기 9 엄지 10 콘페티
export function Shuk({ pose, size = 96 }: { pose: number; size?: number }) {
  return (
    <img
      className="shuk"
      src={`/shukshuk/${pose}.webp`}
      alt=""
      aria-hidden
      style={{ height: size, width: 'auto' }}
    />
  );
}
