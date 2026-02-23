import { memo, useMemo } from 'react'

const PuzzleGrid = memo(function PuzzleGrid({
  gridSize,
  tiles,
  movablePositions,
  onTileClick,
  isComplete,
  puzzleImage,
}) {
  const sortedByPosition = useMemo(
    () =>
      Array.from({ length: gridSize * gridSize }).map((_, pos) =>
        tiles.find((t) => t.currentPosition === pos)
      ),
    [tiles, gridSize]
  )

  const hasImage = !!puzzleImage

  function getTileStyle(tile) {
    if (!puzzleImage) return {}
    const col = tile.correctPosition % gridSize
    const row = Math.floor(tile.correctPosition / gridSize)
    const pct = gridSize <= 1 ? 0 : 100 / (gridSize - 1)
    return {
      backgroundImage: `url(${puzzleImage})`,
      backgroundSize: `${gridSize * 100}%`,
      backgroundPosition: `${col * pct}% ${row * pct}%`,
    }
  }

  return (
    <div className="flex justify-center my-6">
      <div
        className={`grid gap-1.5 w-full max-w-[min(400px,85vw)] aspect-square ${
          isComplete ? 'animate-complete-bounce' : ''
        }`}
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`,
        }}
        role="grid"
        aria-label={`${gridSize}×${gridSize} sliding puzzle`}
      >
        {sortedByPosition.map((tile) => {
          const isEmpty = tile.id === 0
          const isMovable = movablePositions.includes(tile.currentPosition)

          if (isEmpty) {
            return (
              <div
                key="empty"
                className="rounded-lg bg-gray-200/60 border-2 border-dashed border-gray-300"
                role="gridcell"
                aria-label="Empty space"
              />
            )
          }

          return (
            <button
              key={tile.id}
              onClick={() => isMovable && onTileClick(tile.currentPosition)}
              disabled={!isMovable}
              role="gridcell"
              aria-label={`Tile ${tile.id}${isMovable ? ', movable' : ''}`}
              className={`flex items-center justify-center rounded-lg text-lg md:text-2xl font-bold select-none border-2 transition-all duration-300 overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 ${
                isComplete
                  ? hasImage
                    ? 'border-green-400 shadow-md'
                    : 'bg-green-500 text-white border-green-600 shadow-md'
                  : isMovable
                    ? hasImage
                      ? 'border-blue-400 shadow-md cursor-pointer hover:brightness-110 hover:scale-105 active:scale-95'
                      : 'bg-blue-500 text-white border-blue-600 shadow-md cursor-pointer hover:bg-blue-400 hover:scale-105 active:scale-95'
                    : hasImage
                      ? 'border-gray-300 shadow-sm cursor-not-allowed'
                      : 'bg-blue-500 text-white border-blue-600 shadow-md cursor-not-allowed opacity-80'
              }`}
              style={hasImage ? getTileStyle(tile) : {}}
            >
              {hasImage ? '' : tile.id}
            </button>
          )
        })}
      </div>
    </div>
  )
})

export default PuzzleGrid
