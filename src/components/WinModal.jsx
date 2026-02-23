import { memo } from 'react'

const WinModal = memo(function WinModal({
  moves,
  time,
  puzzleImage,
  onRetry,
  onNewGame,
  isLoading,
}) {
  const mins = Math.floor(time / 60)
  const secs = time % 60
  const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
      role="dialog"
      aria-label="Game complete"
    >
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative bg-white rounded-2xl shadow-2xl p-8 mx-4 w-full max-w-sm text-center animate-modal-in">
        {puzzleImage && (
          <div className="mb-4">
            <img
              src={puzzleImage}
              alt="Completed puzzle"
              className="w-32 h-32 rounded-xl mx-auto object-cover shadow-md"
            />
          </div>
        )}

        <h2 className="text-2xl font-bold text-gray-800 mb-2">Congratulations!</h2>
        <p className="text-gray-500 mb-6">You completed the puzzle!</p>

        <div className="flex justify-center gap-8 mb-8">
          <div className="text-center">
            <p className="text-sm text-gray-400 font-medium">Moves</p>
            <p className="text-3xl font-bold text-blue-500">{moves}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400 font-medium">Time</p>
            <p className="text-3xl font-bold text-blue-500 tabular-nums">
              {formatted}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onRetry}
            disabled={isLoading}
            aria-label="Play again with same image"
            className="w-full py-3 rounded-lg font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-colors cursor-pointer shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            🔄 Play Again
          </button>
          <button
            onClick={onNewGame}
            disabled={isLoading}
            aria-label="Start new game with new image"
            className="w-full py-3 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Generating...' : '🎨 New Game'}
          </button>
        </div>
      </div>
    </div>
  )
})

export default WinModal
