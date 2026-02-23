import { memo } from 'react'

const GameStats = memo(function GameStats({ moves, time }) {
  const mins = Math.floor(time / 60)
  const secs = time % 60
  const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  return (
    <div className="flex justify-center gap-8" aria-live="polite">
      <div className="text-center">
        <p className="text-sm text-gray-500 font-medium">Moves</p>
        <p className="text-2xl font-bold text-gray-800">{moves}</p>
      </div>
      <div className="text-center">
        <p className="text-sm text-gray-500 font-medium">Time</p>
        <p className="text-2xl font-bold text-gray-800 tabular-nums">{formatted}</p>
      </div>
    </div>
  )
})

export default GameStats
