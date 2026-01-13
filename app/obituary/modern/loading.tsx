export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center">
      {/* 로딩 애니메이션 */}
      <div className="relative mb-6">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin"></div>
      </div>

      {/* 로딩 텍스트 */}
      <p className="text-gray-600 text-lg font-medium">
        부고장을 불러오는 중입니다
      </p>
      <p className="text-gray-400 text-sm mt-2">
        잠시만 기다려 주세요
      </p>
    </div>
  );
}
