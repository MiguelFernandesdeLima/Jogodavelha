// Constantes do jogo
const PLAYER = 'X';
const BOT = 'O';
const EMPTY = '';
const WINNING_COMBINATIONS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // linhas
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // colunas
    [0, 4, 8], [2, 4, 6]             // diagonais
];

// Estado do jogo
let board = Array(9).fill(EMPTY);
let currentPlayer = PLAYER;
let gameActive = true;
let playerScore = 0;
let botScore = 0;
let difficulty = 'easy'; // padrão: fácil
let monthlyWins = 0;
const monthlyGoal = 10;

// Elementos do DOM
const boardElement = document.getElementById('board');
const playerScoreElement = document.getElementById('player-score');
const botScoreElement = document.getElementById('bot-score');
const turnIndicatorElement = document.getElementById('turn-indicator');
const resetButton = document.getElementById('reset-btn');
const newGameButton = document.getElementById('new-game-btn');
const difficultyButtons = document.querySelectorAll('.difficulty-btn');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalButton = document.getElementById('modal-btn');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

// Inicialização do jogo
function initGame() {
    // Criar células do tabuleiro
    boardElement.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = i;
        cell.addEventListener('click', () => handleCellClick(i));
        boardElement.appendChild(cell);
    }
    
    // Carregar progresso salvo
    loadProgress();
    
    // Atualizar UI
    updateUI();
}

// Manipulador de clique na célula
function handleCellClick(index) {
    if (!gameActive || board[index] !== EMPTY || currentPlayer !== PLAYER) return;
    
    // Fazer jogada do jogador
    makeMove(index, PLAYER);
    
    // Verificar vitória/empate
    if (checkWin(PLAYER)) {
        endGame('player');
        return;
    } else if (isBoardFull()) {
        endGame('draw');
        return;
    }
    
    // Mudar turno para o bot
    currentPlayer = BOT;
    updateUI();
    
    // Adicionar pequeno atraso para a jogada do bot parecer mais natural
    setTimeout(() => {
        makeBotMove();
    }, 500);
}

// Realizar uma jogada
function makeMove(index, player) {
    board[index] = player;
    const cell = document.querySelector(`.cell[data-index="${index}"]`);
    cell.classList.add(player.toLowerCase());
}

// Movimento do bot
function makeBotMove() {
    if (!gameActive || currentPlayer !== BOT) return;
    
    let move;
    
    switch (difficulty) {
        case 'easy':
            move = getRandomMove();
            break;
        case 'medium':
            // 50% de chance de jogar aleatório, 50% de jogar inteligente
            move = Math.random() < 0.5 ? getRandomMove() : getBestMove();
            break;
        case 'hard':
            move = getBestMove();
            break;
        default:
            move = getRandomMove();
    }
    
    makeMove(move, BOT);
    
    // Verificar vitória/empate
    if (checkWin(BOT)) {
        endGame('bot');
    } else if (isBoardFull()) {
        endGame('draw');
    } else {
        currentPlayer = PLAYER;
        updateUI();
    }
}

// Obter movimento aleatório
function getRandomMove() {
    const emptyCells = board.reduce((acc, cell, index) => {
        if (cell === EMPTY) acc.push(index);
        return acc;
    }, []);
    
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

// Obter melhor movimento (algoritmo minimax)
function getBestMove() {
    // Verificar se o bot pode vencer na próxima jogada
    for (let i = 0; i < board.length; i++) {
        if (board[i] === EMPTY) {
            board[i] = BOT;
            if (checkWin(BOT)) {
                board[i] = EMPTY;
                return i;
            }
            board[i] = EMPTY;
        }
    }
    
    // Verificar se o jogador pode vencer na próxima jogada e bloquear
    for (let i = 0; i < board.length; i++) {
        if (board[i] === EMPTY) {
            board[i] = PLAYER;
            if (checkWin(PLAYER)) {
                board[i] = EMPTY;
                return i;
            }
            board[i] = EMPTY;
        }
    }
    
    // Tentar ocupar o centro se estiver vazio
    if (board[4] === EMPTY) return 4;
    
    // Tentar ocupar um canto vazio
    const corners = [0, 2, 6, 8];
    const emptyCorners = corners.filter(index => board[index] === EMPTY);
    if (emptyCorners.length > 0) {
        return emptyCorners[Math.floor(Math.random() * emptyCorners.length)];
    }
    
    // Jogar em qualquer posição vazia
    return getRandomMove();
}

// Verificar vitória
function checkWin(player) {
    return WINNING_COMBINATIONS.some(combination => {
        return combination.every(index => {
            return board[index] === player;
        });
    });
}

// Verificar se o tabuleiro está cheio
function isBoardFull() {
    return board.every(cell => cell !== EMPTY);
}

// Finalizar o jogo
function endGame(result) {
    gameActive = false;
    
    // Destacar células vencedoras
    if (result !== 'draw') {
        const winner = result === 'player' ? PLAYER : BOT;
        const winningCombination = WINNING_COMBINATIONS.find(combination => {
            return combination.every(index => board[index] === winner);
        });
        
        winningCombination.forEach(index => {
            document.querySelector(`.cell[data-index="${index}"]`).classList.add('winner');
        });
    }
    
    // Atualizar placar
    if (result === 'player') {
        playerScore++;
        monthlyWins++;
        saveProgress();
        showModal('Vitória!', 'Parabéns, você venceu!');
    } else if (result === 'bot') {
        botScore++;
        showModal('Derrota', 'O bot venceu desta vez. Tente novamente!');
    } else {
        showModal('Empate', 'O jogo terminou em empate!');
    }
    
    updateUI();
}

// Reiniciar o jogo (mesmo placar)
function resetGame() {
    board = Array(9).fill(EMPTY);
    currentPlayer = PLAYER;
    gameActive = true;
    
    // Limpar classes das células
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('x', 'o', 'winner');
    });
    
    updateUI();
}

// Novo jogo (zerar placar)
function newGame() {
    playerScore = 0;
    botScore = 0;
    monthlyWins = 0;
    saveProgress();
    resetGame();
}

// Atualizar interface do usuário
function updateUI() {
    playerScoreElement.textContent = playerScore;
    botScoreElement.textContent = botScore;
    
    if (currentPlayer === PLAYER) {
        turnIndicatorElement.textContent = 'Sua vez!';
        turnIndicatorElement.style.backgroundColor = '#3498db';
    } else {
        turnIndicatorElement.textContent = 'Vez do bot...';
        turnIndicatorElement.style.backgroundColor = '#e74c3c';
    }
    
    // Atualizar barra de progresso
    const progressPercentage = (monthlyWins / monthlyGoal) * 100;
    progressBar.style.width = `${Math.min(progressPercentage, 100)}%`;
    progressText.textContent = `${monthlyWins}/${monthlyGoal} vitórias`;
}

// Mostrar modal
function showModal(title, message) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modal.style.display = 'flex';
}

// Fechar modal
function closeModal() {
    modal.style.display = 'none';
}

// Salvar progresso no localStorage
function saveProgress() {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    
    const progress = {
        monthlyWins,
        playerScore,
        botScore,
        month,
        year
    };
    
    localStorage.setItem('ticTacToeProgress', JSON.stringify(progress));
}

// Carregar progresso do localStorage
function loadProgress() {
    const savedProgress = localStorage.getItem('ticTacToeProgress');
    if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        const now = new Date();
        
        // Verificar se os dados são do mesmo mês/ano
        if (progress.month === now.getMonth() && progress.year === now.getFullYear()) {
            monthlyWins = progress.monthlyWins || 0;
            playerScore = progress.playerScore || 0;
            botScore = progress.botScore || 0;
        } else {
            // Se for um novo mês, resetar o progresso mensal
            monthlyWins = 0;
            playerScore = 0;
            botScore = 0;
            saveProgress();
        }
    }
}

// Event Listeners
resetButton.addEventListener('click', resetGame);
newGameButton.addEventListener('click', newGame);
modalButton.addEventListener('click', closeModal);

difficultyButtons.forEach(button => {
    button.addEventListener('click', () => {
        difficultyButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        difficulty = button.dataset.difficulty;
    });
});

// Iniciar o jogo quando a página carregar
window.addEventListener('DOMContentLoaded', initGame);