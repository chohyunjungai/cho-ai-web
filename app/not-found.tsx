import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="empty">
      <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>이 주소의 페이지는 없어요</p>
      <p style={{ marginBottom: 16 }}>주소가 바뀌었거나 잘못 입력된 것 같아요.</p>
      <Link href="/" className="btn">홈으로 가기</Link>
    </div>
  );
}
