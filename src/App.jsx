import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  arrayUnion,
  increment,
} from "firebase/firestore";
import {
  Apple,
  Banana,
  Cherry,
  Citrus,
  Grape,
  Circle, // Fallback for Mango
  Play,
  Users,
  Trophy,
  LogOut,
  Info,
  X,
  ArrowRight,
  CheckCircle,
  Crown,
  Bot,
} from "lucide-react";

// --- Firebase Config & Init ---
const firebaseConfig = {
  apiKey: "AIzaSyDf86JHBvY9Y1B1x8QDbJkASmlANouEvX0",
  authDomain: "card-games-28729.firebaseapp.com",
  projectId: "card-games-28729",
  storageBucket: "card-games-28729.firebasestorage.app",
  messagingSenderId: "466779458834",
  appId: "1:466779458834:web:4209d2fa804d48d06d37cb",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// App ID constant
const APP_ID = typeof __app_id !== "undefined" ? __app_id : "fruit-seller-v2";

// --- Game Constants ---
const FRUITS = {
  MANGO: {
    name: "Mango",
    color: "bg-amber-400",
    text: "text-amber-900",
    icon: Circle,
  },
  APPLE: {
    name: "Apple",
    color: "bg-red-500",
    text: "text-white",
    icon: Apple,
  },
  ORANGE: {
    name: "Orange",
    color: "bg-orange-500",
    text: "text-white",
    icon: Citrus,
  },
  BANANA: {
    name: "Banana",
    color: "bg-yellow-300",
    text: "text-yellow-900",
    icon: Banana,
  },
  LEMON: {
    name: "Lemon",
    color: "bg-lime-400",
    text: "text-lime-900",
    icon: Citrus,
  },
  BERRY: {
    name: "Berry",
    color: "bg-purple-600",
    text: "text-white",
    icon: Cherry,
  },
};

const FRUIT_ORDER = ["MANGO", "APPLE", "ORANGE", "BANANA", "LEMON", "BERRY"];

// --- Helper Functions ---
const shuffle = (array) => {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
};

const generateDeck = (numPlayers) => {
  const activeFruits = FRUIT_ORDER.slice(0, numPlayers);
  let deck = [];
  activeFruits.forEach((fruitKey) => {
    // 5 cards of each fruit
    for (let i = 0; i < 5; i++) {
      deck.push({
        type: fruitKey,
        id: `${fruitKey}-${i}-${Math.random().toString(36).substr(2, 5)}`,
      });
    }
  });
  return shuffle(deck);
};

// --- Bot Logic ---
const getBotMove = (hand) => {
  // Count frequencies
  const counts = {};
  hand.forEach((card) => {
    counts[card.type] = (counts[card.type] || 0) + 1;
  });

  // Identify target fruit (the one we have most of)
  let targetFruit = null;
  let maxCount = -1;

  Object.entries(counts).forEach(([type, count]) => {
    if (count > maxCount) {
      maxCount = count;
      targetFruit = type;
    }
  });

  // Find candidates to discard (anything NOT the target fruit)
  // If we only have target fruit, we just pick the first one (rare, usually means win)
  let candidates = hand
    .map((card, index) => ({ ...card, index }))
    .filter((c) => c.type !== targetFruit);

  if (candidates.length === 0) {
    // We have all same fruits (likely winning, but need to pass if we have 6)
    return 0; // Just pass the first one
  }

  // Smart discard: discard the one with the lowest count in hand (get rid of outliers)
  candidates.sort((a, b) => (counts[a.type] || 0) - (counts[b.type] || 0));

  return candidates[0].index;
};

// --- Sub-Components ---

const Card = ({ type, onClick, isSelected, size = "md" }) => {
  const fruit = FRUITS[type];
  if (!fruit) return <div className="bg-gray-700 w-16 h-24 rounded"></div>;

  const Icon = fruit.icon;
  const sizeClasses =
    size === "sm" ? "w-12 h-16 text-[10px]" : "w-24 h-36 text-sm";
  const iconSize = size === "sm" ? 16 : 32;

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-xl shadow-lg border-2 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer
        ${fruit.color} ${fruit.text} ${sizeClasses}
        ${
          isSelected
            ? "ring-4 ring-white scale-110 z-10 -translate-y-2 shadow-xl"
            : "border-black/10 hover:-translate-y-1"
        }
      `}
    >
      <span className="font-bold uppercase tracking-wider mb-1">
        {fruit.name}
      </span>
      <Icon size={iconSize} className="drop-shadow-sm" />
      <div className="absolute top-1 right-1 opacity-50">
        <Icon size={10} />
      </div>
      <div className="absolute bottom-1 left-1 opacity-50">
        <Icon size={10} />
      </div>
    </div>
  );
};

const CardBack = ({ count }) => (
  <div className="w-16 h-24 bg-gradient-to-br from-indigo-600 to-blue-800 rounded-lg border-2 border-indigo-400 shadow-md flex items-center justify-center relative transform rotate-1">
    <div className="absolute inset-2 border border-dashed border-indigo-400/50 rounded"></div>
    <span className="text-2xl font-bold text-white drop-shadow-md">
      {count}
    </span>
  </div>
);

const RulesModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4">
    <div className="bg-white text-gray-900 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-black"
      >
        <X size={24} />
      </button>
      <h2 className="text-3xl font-black text-orange-600 mb-4 flex items-center gap-2">
        <Citrus /> Fruit Seller
      </h2>
      <div className="space-y-4 text-lg">
        <p>
          <strong>Goal:</strong> Collect <strong>5 cards</strong> of the same
          fruit to win!
        </p>
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
          <h3 className="font-bold text-orange-800 mb-2">How to Play:</h3>
          <ul className="list-disc pl-5 space-y-2 text-gray-700">
            <li>
              Everyone starts with <strong>5 cards</strong>.
            </li>
            <li>
              On your turn, pick <strong>ONE card</strong> to pass to the player
              on your left.
            </li>
            <li>
              If players are missing, <strong>Bots</strong> will fill the spots!
            </li>
            <li>Bots are smart—watch out!</li>
          </ul>
        </div>
      </div>
      <button
        onClick={onClose}
        className="w-full mt-6 bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl shadow-lg transform transition active:scale-95"
      >
        Got it!
      </button>
    </div>
  </div>
);

const WinnerModal = ({ winnerName, isMe, onRestart, isHost }) => (
  <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-500">
    <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-b from-yellow-200/50 to-transparent pointer-events-none"></div>
      <Crown className="w-24 h-24 mx-auto text-yellow-500 mb-4 animate-bounce" />
      <h2 className="text-4xl font-black text-gray-800 mb-2">
        {isMe ? "YOU WON!" : `${winnerName} WINS!`}
      </h2>
      <p className="text-gray-600 mb-8 text-lg">Collected 5 matching fruits!</p>

      {isHost ? (
        <button
          onClick={onRestart}
          className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transform transition hover:scale-105"
        >
          <Play fill="currentColor" /> Play Again
        </button>
      ) : (
        <div className="text-gray-400 italic animate-pulse">
          Waiting for host to restart...
        </div>
      )}
    </div>
  </div>
);

// --- Main Component ---
export default function FruitSellerGame() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("menu");
  const [roomId, setRoomId] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [error, setError] = useState("");
  const [selectedCardIndex, setSelectedCardIndex] = useState(null);
  const [showRules, setShowRules] = useState(false);

  // --- Auth & Listener ---
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== "undefined" && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!roomId || !user) return;
    const roomRef = doc(
      db,
      "artifacts",
      APP_ID,
      "public",
      "data",
      "rooms",
      roomId
    );
    const unsubscribe = onSnapshot(roomRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setGameState(data);
        if (data.status === "playing" || data.status === "finished")
          setView("game");
        else setView("lobby");
      } else {
        setRoomId(null);
        setView("menu");
        setError("Room closed.");
      }
    });
    return () => unsubscribe();
  }, [roomId, user]);

  // --- Bot Turn Logic (Host Only) ---
  useEffect(() => {
    if (!gameState || gameState.status !== "playing" || !user) return;

    // Only the host runs bot logic to prevent race conditions
    if (gameState.hostId !== user.uid) return;

    const currentPlayer = gameState.players[gameState.turnIndex];
    if (currentPlayer.isBot) {
      // Small delay to simulate thinking/pacing
      const timer = setTimeout(() => {
        const cardIndexToPass = getBotMove(currentPlayer.hand);
        performPass(cardIndexToPass);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState, user]);

  // --- Actions ---
  const createRoom = async () => {
    if (!playerName.trim()) return setError("Please enter your name.");
    const newRoomId = Math.random().toString(36).substring(2, 6).toUpperCase();

    await setDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", newRoomId),
      {
        hostId: user.uid,
        status: "lobby",
        players: [
          {
            id: user.uid,
            name: playerName,
            hand: [],
            ready: true,
            isBot: false,
          },
        ],
        maxPlayers: 4,
        turnIndex: 0,
        logs: [],
      }
    );
    setRoomId(newRoomId);
  };

  const joinRoom = async () => {
    if (!playerName.trim() || !roomCodeInput.trim())
      return setError("Name and Room Code required.");
    const rId = roomCodeInput.toUpperCase();
    const roomRef = doc(
      db,
      "artifacts",
      APP_ID,
      "public",
      "data",
      "rooms",
      rId
    );

    try {
      const snap = await getDoc(roomRef);
      if (!snap.exists()) return setError("Room not found.");
      const data = snap.data();
      if (data.status !== "lobby") return setError("Game already started.");
      if (data.players.length >= data.maxPlayers) return setError("Room full.");

      const existing = data.players.find((p) => p.id === user.uid);
      if (!existing) {
        await updateDoc(roomRef, {
          players: arrayUnion({
            id: user.uid,
            name: playerName,
            hand: [],
            ready: true,
            isBot: false,
          }),
        });
      }
      setRoomId(rId);
    } catch (e) {
      console.error(e);
      setError("Error joining room.");
    }
  };

  const startGame = async () => {
    if (!gameState) return;

    let currentPlayers = [...gameState.players];
    const maxP = gameState.maxPlayers;

    // Fill with bots if needed
    if (currentPlayers.length < maxP) {
      const botsNeeded = maxP - currentPlayers.length;
      for (let i = 0; i < botsNeeded; i++) {
        currentPlayers.push({
          id: `BOT-${Math.random().toString(36).substr(2, 9)}`,
          name: `Bot ${i + 1}`,
          hand: [],
          ready: true,
          isBot: true,
        });
      }
    }

    const numPlayers = currentPlayers.length;
    const deck = generateDeck(numPlayers);

    // Deal cards
    currentPlayers = currentPlayers.map((p) => ({
      ...p,
      hand: deck.splice(0, 5), // Deal 5 cards
    }));

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "playing",
        players: currentPlayers,
        turnIndex: 0,
        winnerId: null,
        logs: [{ text: "Game Started!", type: "neutral" }],
      }
    );
  };

  // Centralized Pass Logic
  const performPass = async (cardIndex) => {
    if (!gameState) return;

    const currentPlayerIdx = gameState.turnIndex;
    const nextPlayerIdx = (currentPlayerIdx + 1) % gameState.players.length;

    const updatedPlayers = JSON.parse(JSON.stringify(gameState.players));

    // Move card
    if (updatedPlayers[currentPlayerIdx].hand[cardIndex]) {
      const passedCard = updatedPlayers[currentPlayerIdx].hand.splice(
        cardIndex,
        1
      )[0];
      updatedPlayers[nextPlayerIdx].hand.push(passedCard);
    } else {
      // Fallback for safety
      const passedCard = updatedPlayers[currentPlayerIdx].hand.pop();
      if (passedCard) updatedPlayers[nextPlayerIdx].hand.push(passedCard);
    }

    // Check Winner
    let winnerId = null;
    let winnerName = null;

    updatedPlayers.forEach((p) => {
      const counts = {};
      p.hand.forEach((c) => {
        counts[c.type] = (counts[c.type] || 0) + 1;
      });
      Object.values(counts).forEach((count) => {
        if (count >= 5) {
          winnerId = p.id;
          winnerName = p.name;
        }
      });
    });

    const updates = {
      players: updatedPlayers,
      selectedCardIndex: null,
    };

    const currentName = updatedPlayers[currentPlayerIdx].name;
    const nextName = updatedPlayers[nextPlayerIdx].name;
    const logs = [
      ...gameState.logs,
      { text: `${currentName} passed to ${nextName}.`, type: "action" },
    ];

    if (winnerId) {
      updates.status = "finished";
      updates.winnerId = winnerId;
      logs.push({ text: `${winnerName} WINS!`, type: "win" });
    } else {
      updates.turnIndex = nextPlayerIdx;
    }

    updates.logs = logs.slice(-5);

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      updates
    );
    setSelectedCardIndex(null);
  };

  const handleManualPass = () => {
    if (selectedCardIndex !== null) {
      performPass(selectedCardIndex);
    }
  };

  const leaveRoom = async () => {
    if (!roomId || !user) return;
    try {
      const newPlayers = gameState.players.filter((p) => p.id !== user.uid);
      if (newPlayers.length === 0) {
        // empty logic
      } else {
        await updateDoc(
          doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
          {
            players: newPlayers,
          }
        );
      }
    } catch (err) {
      console.error(err);
    }
    setRoomId(null);
    setView("menu");
  };

  const myPlayerIndex = gameState?.players.findIndex((p) => p.id === user?.uid);
  const me = myPlayerIndex >= 0 ? gameState.players[myPlayerIndex] : null;
  const isMyTurn = gameState?.turnIndex === myPlayerIndex;

  const getOpponents = () => {
    if (!gameState || myPlayerIndex === -1) return [];
    const count = gameState.players.length;
    const opponents = [];
    for (let i = 1; i < count; i++) {
      const idx = (myPlayerIndex + i) % count;
      opponents.push({ ...gameState.players[idx], realIndex: idx });
    }
    return opponents;
  };

  if (!user)
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center font-bold text-orange-800">
        Loading Fruit Market...
      </div>
    );

  if (view === "menu") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 to-yellow-200 p-4 flex flex-col items-center justify-center font-sans">
        {showRules && <RulesModal onClose={() => setShowRules(false)} />}

        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-orange-200">
          <div className="bg-orange-500 p-8 text-center relative overflow-hidden">
            <div className="absolute -top-10 -left-10 text-orange-400 opacity-20">
              <Citrus size={120} />
            </div>
            <div className="absolute top-10 -right-10 text-yellow-300 opacity-20">
              <Banana size={120} />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight relative z-10 drop-shadow-md">
              FRUIT SELLER
            </h1>
            <p className="text-orange-100 font-medium relative z-10 mt-2">
              The juicy trading card game
            </p>
          </div>

          <div className="p-8 space-y-6">
            {error && (
              <div className="bg-red-100 text-red-600 p-3 rounded-lg text-sm text-center font-bold">
                {error}
              </div>
            )}

            <div>
              <label className="block text-gray-500 text-xs font-bold uppercase mb-2 ml-1">
                Your Nickname
              </label>
              <input
                type="text"
                placeholder="e.g. Juicy Joe"
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-4 text-gray-800 font-bold focus:outline-none focus:border-orange-400 transition"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={createRoom}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/30 transition transform hover:-translate-y-1"
              >
                Create New Market
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-400 font-bold">
                    OR
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ROOM CODE"
                  className="flex-1 bg-gray-50 border-2 border-gray-200 rounded-xl p-4 text-gray-800 font-bold uppercase focus:outline-none focus:border-blue-400 transition"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value)}
                />
                <button
                  onClick={joinRoom}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-6 rounded-xl shadow-lg shadow-blue-500/30 transition transform hover:-translate-y-1"
                >
                  Join
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowRules(true)}
              className="w-full text-gray-400 hover:text-gray-600 text-sm font-bold flex items-center justify-center gap-1"
            >
              <Info size={16} /> How to Play
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "lobby" && gameState) {
    const isHost = gameState.hostId === user.uid;
    const missingPlayers = gameState.maxPlayers - gameState.players.length;

    return (
      <div className="min-h-screen bg-orange-50 p-6 flex flex-col items-center">
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl overflow-hidden border border-orange-100 flex-1 flex flex-col">
          <div className="bg-orange-600 p-6 flex justify-between items-center text-white">
            <div>
              <h2 className="text-2xl font-black">Lobby</h2>
              <p className="text-orange-200 text-sm font-mono tracking-widest">
                CODE: {roomId}
              </p>
            </div>
            <button
              onClick={leaveRoom}
              className="p-2 bg-orange-700/50 rounded-lg hover:bg-orange-700 transition"
            >
              <LogOut size={20} />
            </button>
          </div>

          <div className="p-6 flex-1">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-600 flex items-center gap-2">
                <Users size={20} /> Players ({gameState.players.length}/
                {gameState.maxPlayers})
              </h3>
              {isHost && (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400 font-bold">
                    Max Players:
                  </span>
                  <select
                    className="bg-gray-100 border rounded p-1 font-bold text-gray-700"
                    value={gameState.maxPlayers}
                    onChange={(e) =>
                      updateDoc(
                        doc(
                          db,
                          "artifacts",
                          APP_ID,
                          "public",
                          "data",
                          "rooms",
                          roomId
                        ),
                        { maxPlayers: parseInt(e.target.value) }
                      )
                    }
                  >
                    <option value={4}>4</option>
                    <option value={5}>5</option>
                    <option value={6}>6</option>
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-3 mb-8">
              {gameState.players.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold">
                      {p.name[0].toUpperCase()}
                    </div>
                    <span className="font-bold text-gray-800">
                      {p.name} {p.id === user.uid && "(You)"}
                    </span>
                  </div>
                  {p.id === gameState.hostId && (
                    <Crown size={20} className="text-yellow-500" />
                  )}
                </div>
              ))}

              {/* Preview Bots that will be added */}
              {Array(missingPlayers)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="p-4 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-start gap-3 text-gray-400"
                  >
                    <Bot size={20} />
                    <span className="font-bold">
                      Bot {i + 1} will join automatically...
                    </span>
                  </div>
                ))}
            </div>

            {isHost ? (
              <button
                onClick={startGame}
                className={`w-full py-4 rounded-xl font-black text-xl shadow-lg transition transform bg-green-500 hover:bg-green-600 text-white hover:scale-105`}
              >
                START GAME {missingPlayers > 0 && "(+ Bots)"}
              </button>
            ) : (
              <div className="text-center text-gray-400 font-bold animate-pulse">
                Waiting for host to start...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (view === "game" && me) {
    const opponents = getOpponents();

    // Sort hand by type for easier viewing
    const sortedHandIndices = me.hand
      .map((c, i) => ({ ...c, originalIndex: i }))
      .sort((a, b) => a.type.localeCompare(b.type));

    return (
      <div className="min-h-screen bg-green-900/90 relative flex flex-col overflow-hidden select-none">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#ffffff 2px, transparent 2px)",
            backgroundSize: "30px 30px",
          }}
        ></div>

        {gameState.winnerId && (
          <WinnerModal
            winnerName={
              gameState.players.find((p) => p.id === gameState.winnerId)?.name
            }
            isMe={gameState.winnerId === user.uid}
            isHost={gameState.hostId === user.uid}
            onRestart={startGame}
          />
        )}

        {/* Header */}
        <div className="relative z-10 bg-black/20 p-2 flex justify-between items-center text-white backdrop-blur-md">
          <div className="font-bold flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            Room: {roomId}
          </div>
          <div className="flex gap-4">
            <button onClick={() => setShowRules(true)}>
              <Info size={20} className="hover:text-orange-300" />
            </button>
            <button onClick={leaveRoom}>
              <LogOut size={20} className="hover:text-red-300" />
            </button>
          </div>
        </div>

        {/* Game Area */}
        <div className="flex-1 relative p-4 flex flex-col justify-between">
          {/* Opponents Top Row */}
          <div className="flex justify-center gap-4 md:gap-8 flex-wrap">
            {opponents.map((opp) => {
              const isOpponentTurn = gameState.turnIndex === opp.realIndex;
              return (
                <div
                  key={opp.id}
                  className={`relative flex flex-col items-center transition-all duration-300 ${
                    isOpponentTurn ? "scale-110" : "opacity-80 scale-90"
                  }`}
                >
                  {isOpponentTurn && (
                    <div className="absolute -top-8 animate-bounce text-yellow-400 font-bold text-sm tracking-widest uppercase">
                      {opp.isBot ? "Computing..." : "Thinking..."}
                    </div>
                  )}
                  <div
                    className={`
                                w-20 h-20 rounded-full border-4 flex items-center justify-center bg-gray-800 shadow-lg relative
                                ${
                                  isOpponentTurn
                                    ? "border-yellow-400 shadow-yellow-500/50"
                                    : "border-gray-600"
                                }
                            `}
                  >
                    {opp.isBot ? (
                      <Bot className="text-white" size={32} />
                    ) : (
                      <span className="text-2xl text-white font-bold">
                        {opp.name[0]}
                      </span>
                    )}
                    <div className="absolute -bottom-2 bg-gray-900 px-2 py-0.5 rounded text-[10px] text-white font-bold truncate max-w-full">
                      {opp.name}
                    </div>
                  </div>
                  <div className="mt-2 relative">
                    <CardBack count={opp.hand.length} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Center Area: Status & Logs */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm pointer-events-none text-center">
            {gameState.logs && gameState.logs.length > 0 && (
              <div className="mb-4 space-y-1">
                {gameState.logs.slice(-1).map((log, i) => (
                  <div
                    key={i}
                    className="inline-block bg-black/60 text-white px-4 py-2 rounded-full text-sm font-bold backdrop-blur-sm animate-in zoom-in slide-in-from-bottom-2 fade-in"
                  >
                    {log.text}
                  </div>
                ))}
              </div>
            )}

            {isMyTurn && !gameState.winnerId && (
              <div className="animate-pulse">
                <div className="text-3xl font-black text-white drop-shadow-lg stroke-black">
                  YOUR TURN
                </div>
                <div className="text-yellow-300 font-bold text-lg">
                  Pick a card to pass!
                </div>
              </div>
            )}
          </div>

          {/* Player Hand Area (Bottom) */}
          <div className="relative z-20 mt-auto">
            {/* Action Bar */}
            <div className="flex justify-center mb-4 min-h-[60px]">
              {isMyTurn && selectedCardIndex !== null && (
                <button
                  onClick={handleManualPass}
                  className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-8 py-3 rounded-full font-black text-lg shadow-xl hover:scale-105 active:scale-95 transition flex items-center gap-2 border-2 border-white/20"
                >
                  Pass Card <ArrowRight />
                </button>
              )}
            </div>

            {/* Cards */}
            <div className="flex justify-center items-end -space-x-4 pb-4">
              {sortedHandIndices.map((cardData, visualIndex) => (
                <div
                  key={cardData.id}
                  style={{
                    zIndex:
                      isMyTurn && selectedCardIndex === cardData.originalIndex
                        ? 50
                        : visualIndex,
                    transform: `rotate(${
                      (visualIndex - (me.hand.length - 1) / 2) * 5
                    }deg) translateY(${
                      isMyTurn && selectedCardIndex === cardData.originalIndex
                        ? "-20px"
                        : "0px"
                    })`,
                  }}
                  className="transition-all duration-300 hover:-translate-y-4"
                >
                  <Card
                    type={cardData.type}
                    isSelected={
                      isMyTurn && selectedCardIndex === cardData.originalIndex
                    }
                    onClick={() =>
                      isMyTurn && setSelectedCardIndex(cardData.originalIndex)
                    }
                  />
                </div>
              ))}
            </div>

            {/* Player Badge */}
            <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur rounded-lg px-4 py-2 text-white border border-white/10">
              <div className="text-xs text-gray-300 uppercase font-bold">
                You
              </div>
              <div className="font-bold flex items-center gap-2">
                {me.name}
                {me.hand.length > 5 && (
                  <span className="text-xs bg-red-500 px-1 rounded animate-pulse">
                    OVERFLOW
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
