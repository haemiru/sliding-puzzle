import { useState, useEffect, useCallback, useRef } from 'react'
import PuzzleGrid from './components/PuzzleGrid'
import GameControls from './components/GameControls'
import GameStats from './components/GameStats'
import WinModal from './components/WinModal'
import { generateDogImage } from './services/geminiApi'

const DIFFICULTIES = [
  { label: '3×3', size: 3 },
  { label: '4×4', size: 4 },
  { label: '5×5', size: 5 },
]

function createSolvedTiles(size) {
  const total = size * size
  return Array.from({ length: total }, (_, i) => ({
    id: i === total - 1 ? 0 : i + 1,
    currentPosition: i,
    correctPosition: i,
  }))
}

function getAdjacentPositions(pos, size) {
  const row = Math.floor(pos / size)
  const col = pos % size
  const neighbors = []
  if (row > 0) neighbors.push(pos - size)
  if (row < size - 1) neighbors.push(pos + size)
  if (col > 0) neighbors.push(pos - 1)
  if (col < size - 1) neighbors.push(pos + 1)
  return neighbors
}

function shuffleTiles(tiles, size) {
  const shuffled = tiles.map((t) => ({ ...t }))
  const shuffleCount = 200 + Math.floor(Math.random() * 101)
  let prevEmptyPos = -1

  for (let i = 0; i < shuffleCount; i++) {
    const emptyTile = shuffled.find((t) => t.id === 0)
    const emptyPos = emptyTile.currentPosition
    const neighbors = getAdjacentPositions(emptyPos, size).filter(
      (p) => p !== prevEmptyPos
    )
    const randomNeighborPos =
      neighbors[Math.floor(Math.random() * neighbors.length)]
    const neighborTile = shuffled.find(
      (t) => t.currentPosition === randomNeighborPos
    )

    neighborTile.currentPosition = emptyPos
    prevEmptyPos = emptyPos
    emptyTile.currentPosition = randomNeighborPos
  }

  return shuffled
}

function checkComplete(tiles) {
  return tiles.every((t) => t.currentPosition === t.correctPosition)
}

export default function App() {
  const [gridSize, setGridSize] = useState(3)
  const [tiles, setTiles] = useState(() =>
    shuffleTiles(createSolvedTiles(3), 3)
  )
  const [moves, setMoves] = useState(0)
  const [time, setTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [showModal, setShowModal] = useState(false)

  // Image state
  const [puzzleImage, setPuzzleImage] = useState(null)
  const [isLoadingImage, setIsLoadingImage] = useState(false)
  const [imageError, setImageError] = useState(null)

  const timerRef = useRef(null)

  // Timer
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => setTime((t) => t + 1), 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [isRunning])

  // Completion detection
  useEffect(() => {
    if (moves > 0 && checkComplete(tiles)) {
      setIsRunning(false)
      setIsComplete(true)
      setTimeout(() => setShowModal(true), 600)
    }
  }, [tiles, moves])

  const fetchAndStartNewGame = useCallback(async (size) => {
    setIsLoadingImage(true)
    setImageError(null)
    clearInterval(timerRef.current)
    setMoves(0)
    setTime(0)
    setIsRunning(false)
    setIsComplete(false)
    setShowModal(false)

    try {
      const imageDataUrl = await generateDogImage()
      setPuzzleImage(imageDataUrl)
      setTiles(shuffleTiles(createSolvedTiles(size), size))
    } catch (err) {
      setImageError(err.message)
    } finally {
      setIsLoadingImage(false)
    }
  }, [])

  const reshuffleCurrentImage = useCallback((size) => {
    clearInterval(timerRef.current)
    setTiles(shuffleTiles(createSolvedTiles(size), size))
    setMoves(0)
    setTime(0)
    setIsRunning(false)
    setIsComplete(false)
    setShowModal(false)
  }, [])

  const handleDifficultyChange = useCallback(
    (size) => {
      if (size === gridSize) return
      if (isRunning) {
        const ok = confirm('Your current game will be reset. Continue?')
        if (!ok) return
      }
      setGridSize(size)
      if (puzzleImage) {
        reshuffleCurrentImage(size)
      } else {
        fetchAndStartNewGame(size)
      }
    },
    [gridSize, isRunning, puzzleImage, reshuffleCurrentImage, fetchAndStartNewGame]
  )

  const handleTileClick = useCallback(
    (clickedPosition) => {
      if (isComplete || isLoadingImage) return

      const emptyTile = tiles.find((t) => t.id === 0)
      const emptyPos = emptyTile.currentPosition
      const adjacent = getAdjacentPositions(emptyPos, gridSize)

      if (!adjacent.includes(clickedPosition)) return

      const clickedTile = tiles.find(
        (t) => t.currentPosition === clickedPosition
      )

      setTiles((prev) =>
        prev.map((t) => {
          if (t.id === clickedTile.id)
            return { ...t, currentPosition: emptyPos }
          if (t.id === 0)
            return { ...t, currentPosition: clickedPosition }
          return t
        })
      )

      if (!isRunning) setIsRunning(true)
      setMoves((m) => m + 1)
    },
    [tiles, gridSize, isRunning, isComplete, isLoadingImage]
  )

  const handleNewGame = useCallback(
    () => fetchAndStartNewGame(gridSize),
    [fetchAndStartNewGame, gridSize]
  )

  const handleReset = useCallback(
    () => reshuffleCurrentImage(gridSize),
    [reshuffleCurrentImage, gridSize]
  )

  const handleRetry = useCallback(
    () => reshuffleCurrentImage(gridSize),
    [reshuffleCurrentImage, gridSize]
  )

  const handleModalNewGame = useCallback(
    () => fetchAndStartNewGame(gridSize),
    [fetchAndStartNewGame, gridSize]
  )

  const emptyPos = tiles.find((t) => t.id === 0)?.currentPosition ?? -1
  const movablePositions = getAdjacentPositions(emptyPos, gridSize)

  // Auto-generate first image
  const hasInitRef = useRef(false)
  useEffect(() => {
    if (!hasInitRef.current) {
      hasInitRef.current = true
      fetchAndStartNewGame(3)
    }
  }, [fetchAndStartNewGame])

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-6 sm:py-8 px-3 sm:px-4">
      <div className="w-[92%] sm:w-[90%] max-w-2xl lg:max-w-4xl">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-gray-800 mb-4 sm:mb-6">
          🐶 Sliding Puzzle
        </h1>

        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 relative">
          {/* Original image preview (top-right) */}
          {puzzleImage && !isLoadingImage && !imageError && (
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
              <img
                src={puzzleImage}
                alt="Original image"
                className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-lg object-cover shadow-md border-2 border-white ring-1 ring-gray-200"
              />
            </div>
          )}

          {/* Difficulty selection */}
          <div
            className="flex justify-center gap-2 sm:gap-3 mb-4 sm:mb-6"
            role="group"
            aria-label="Difficulty selection"
          >
            {DIFFICULTIES.map((d) => (
              <button
                key={d.size}
                onClick={() => handleDifficultyChange(d.size)}
                disabled={isLoadingImage}
                aria-label={`Difficulty ${d.label}`}
                aria-pressed={gridSize === d.size}
                className={`px-4 sm:px-5 py-2 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 ${
                  isLoadingImage
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : gridSize === d.size
                      ? 'bg-blue-500 text-white shadow-md cursor-pointer'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <GameStats moves={moves} time={time} />

          {/* Loading / Error / Puzzle */}
          {isLoadingImage ? (
            <div className="flex flex-col items-center justify-center my-6 w-full max-w-[min(400px,85vw)] aspect-square mx-auto bg-gray-50 rounded-xl">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-500 font-medium">
                Generating puppy image...
              </p>
              <p className="text-gray-400 text-sm mt-1">Please wait a moment</p>
            </div>
          ) : imageError ? (
            <div className="flex flex-col items-center justify-center my-6 w-full max-w-[min(400px,85vw)] aspect-square mx-auto bg-red-50 rounded-xl p-4">
              <p className="text-red-500 font-medium mb-2">
                Failed to generate image
              </p>
              <p className="text-red-400 text-sm mb-4 text-center leading-relaxed">
                {imageError.includes('Failed to fetch') ||
                imageError.includes('NetworkError')
                  ? 'Please check your network connection.'
                  : imageError}
              </p>
              <button
                onClick={() => fetchAndStartNewGame(gridSize)}
                aria-label="Retry image generation"
                className="px-5 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
              >
                Try Again
              </button>
            </div>
          ) : (
            <PuzzleGrid
              gridSize={gridSize}
              tiles={tiles}
              movablePositions={movablePositions}
              onTileClick={handleTileClick}
              isComplete={isComplete}
              puzzleImage={puzzleImage}
            />
          )}

          <GameControls
            onNewGame={handleNewGame}
            onReset={handleReset}
            isLoading={isLoadingImage}
          />
        </div>
      </div>

      {/* Win modal */}
      {showModal && (
        <WinModal
          moves={moves}
          time={time}
          puzzleImage={puzzleImage}
          onRetry={handleRetry}
          onNewGame={handleModalNewGame}
          isLoading={isLoadingImage}
        />
      )}
    </div>
  )
}
