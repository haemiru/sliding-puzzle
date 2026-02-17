import { memo } from 'react'

const GameControls = memo(function GameControls({
  onNewGame,
  onReset,
  isLoading,
}) {
  return (
    <div className="flex justify-center gap-3 mt-6">
      <button
        onClick={onNewGame}
        disabled={isLoading}
        aria-label="새 게임 시작"
        className={`px-4 py-2.5 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 ${
          isLoading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-500 text-white hover:bg-blue-600 shadow-md cursor-pointer'
        }`}
      >
        {isLoading ? '생성 중...' : '🎨 새 게임'}
      </button>

      <button
        onClick={onReset}
        disabled={isLoading}
        aria-label="퍼즐 리셋"
        className={`px-4 py-2.5 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 ${
          isLoading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer'
        }`}
      >
        🔄 리셋
      </button>
    </div>
  )
})

export default GameControls
