import { useState, useCallback } from 'react'
import { Chess } from 'chess.js'

function getLegalTargets(game, square) {
  try {
    const moves = game.moves({ square, verbose: true })
    return Array.isArray(moves) ? moves.map((m) => m.to) : []
  } catch {
    return []
  }
}

const PIECE_SYMBOLS = {
  w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
}

function createGame() {
  try {
    return new Chess()
  } catch (e) {
    console.error('Chess init failed', e)
    return null
  }
}

function FocusChess() {
  const [game, setGame] = useState(createGame)
  const [selected, setSelected] = useState(null)
  const [legalMoves, setLegalMoves] = useState([])

  if (!game) {
    return (
      <div className="focus-chess focus-chess-error">
        <p>Chess couldn’t load. Check the console.</p>
      </div>
    )
  }

  const board = []
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const file = String.fromCharCode(97 + c)
      const rank = 8 - r
      const sq = file + rank
      const piece = game.get(sq)
      const isLight = (r + c) % 2 === 0
      const isSelected = selected === sq
      const isLegalTarget = legalMoves.includes(sq)
      board.push({
        sq,
        piece,
        isLight,
        isSelected,
        isLegalTarget,
      })
    }
  }

  const handleSquareClick = useCallback(
    (sq) => {
      const piece = game.get(sq)
      const turn = game.turn()

      if (selected) {
        if (legalMoves.includes(sq)) {
          const next = new Chess(game.fen())
          const move = next.move({ from: selected, to: sq })
          if (move) {
            setGame(next)
            setSelected(null)
            setLegalMoves([])
          }
          return
        }
        if (piece && piece.color === turn) {
          setSelected(sq)
          setLegalMoves(getLegalTargets(game, sq))
          return
        }
        setSelected(null)
        setLegalMoves([])
        return
      }

      if (piece && piece.color === turn) {
        setSelected(sq)
        setLegalMoves(getLegalTargets(game, sq))
      }
    },
    [game, selected, legalMoves]
  )

  const resetGame = useCallback(() => {
    const next = createGame()
    if (next) {
      setGame(next)
      setSelected(null)
      setLegalMoves([])
    }
  }, [])

  const gameOver = game.game_over()
  const inCheck = game.in_check()

  return (
    <div className="focus-chess">
      <div className="focus-chess-board">
        {board.map(({ sq, piece, isLight, isSelected, isLegalTarget }) => (
          <button
            key={sq}
            type="button"
            className={`focus-chess-square ${isLight ? 'light' : 'dark'} ${isSelected ? 'selected' : ''} ${isLegalTarget ? 'legal' : ''}`}
            onClick={() => handleSquareClick(sq)}
            aria-label={piece ? `${piece.color === 'w' ? 'White' : 'Black'} ${piece.type} on ${sq}` : `Square ${sq}`}
          >
            {piece && (
              <span className="focus-chess-piece">
                {PIECE_SYMBOLS[piece.color][piece.type]}
              </span>
            )}
            {isLegalTarget && !piece && <span className="focus-chess-dot" />}
            {isLegalTarget && piece && <span className="focus-chess-capture" />}
          </button>
        ))}
      </div>
      <div className="focus-chess-status">
        {gameOver ? (
          <span>
            {game.in_checkmate()
              ? `Checkmate — ${game.turn() === 'w' ? 'Black' : 'White'} wins`
              : 'Stalemate / draw'}
          </span>
        ) : inCheck ? (
          <span>Check</span>
        ) : (
          <span>{game.turn() === 'w' ? 'White' : 'Black'} to move</span>
        )}
        <button type="button" className="focus-chess-reset" onClick={resetGame}>
          New game
        </button>
      </div>
    </div>
  )
}

export default FocusChess
