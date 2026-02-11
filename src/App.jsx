import React, { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { usePersistentState } from "./hooks/usePersistentState";

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
  deleteDoc,
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
  Circle,
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
  Scroll,
  Settings,
  AlertTriangle,
  ShoppingBag,
  Store,
  Home,
  History,
  Shield,
  BookOpen,
  Hammer,
  Gamepad2,
  Sparkles,
  Check,
  Copy,
  Loader,
} from "lucide-react";

// --- Firebase Config & Init ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const APP_ID = typeof __app_id !== "undefined" ? __app_id : "fruit-seller-game";
const GAME_ID = "6";

// --- Game Constants & Thematic Data ---
const FRUITS = {
  GRAPE: {
    name: "Grape",
    icon: Grape,
    color: "text-violet-400",
    bg: "bg-gray-900",
    border: "border-violet-500",
    desc: "Vine Ripened",
    value: 1,
  },
  APPLE: {
    name: "Apple",
    icon: Apple,
    color: "text-red-500",
    bg: "bg-gray-900",
    border: "border-red-600",
    desc: "Crisp & Crunchy",
    value: 2,
  },
  ORANGE: {
    name: "Orange",
    icon: Citrus,
    color: "text-orange-500",
    bg: "bg-gray-900",
    border: "border-orange-600",
    desc: "Citrus Energy",
    value: 3,
  },
  BANANA: {
    name: "Banana",
    icon: Banana,
    color: "text-yellow-400",
    bg: "bg-gray-900",
    border: "border-yellow-500",
    desc: "High Potassium",
    value: 4,
  },
  LEMON: {
    name: "Lemon",
    icon: Citrus,
    color: "text-lime-400",
    bg: "bg-gray-900",
    border: "border-lime-500",
    desc: "Sour Power",
    value: 5,
  },
  CHERRY: {
    name: "Cherry",
    icon: Cherry,
    color: "text-pink-500",
    bg: "bg-gray-900",
    border: "border-pink-600",
    desc: "Sweet & Tart",
    value: 6,
  },
};
const FRUIT_ORDER = ["GRAPE", "APPLE", "ORANGE", "BANANA", "LEMON", "CHERRY"];

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
  const counts = {};
  hand.forEach((card) => {
    counts[card.type] = (counts[card.type] || 0) + 1;
  });

  let targetFruit = null;
  let maxCount = -1;

  Object.entries(counts).forEach(([type, count]) => {
    if (count > maxCount) {
      maxCount = count;
      targetFruit = type;
    }
  });
  let candidates = hand
    .map((card, index) => ({ ...card, index }))
    .filter((c) => c.type !== targetFruit);
  if (candidates.length === 0) return 0;
  candidates.sort((a, b) => (counts[a.type] || 0) - (counts[b.type] || 0));
  return candidates[0].index;
};

// --- UI Components ---

const FloatingBackground = ({ isShaking }) => (
  <div
    className={`absolute inset-0 overflow-hidden pointer-events-none z-0 ${
      isShaking ? "animate-shake bg-red-900/20" : ""
    }`}
  >
    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-yellow-900/20 via-gray-950 to-black" />
    <div className="absolute top-0 left-0 w-full h-full opacity-10">
      {[...Array(20)].map((_, i) => {
        const fruitKeys = Object.keys(FRUITS);
        const Icon = FRUITS[fruitKeys[i % fruitKeys.length]].icon;
        return (
          <div
            key={i}
            className="absolute animate-float text-white/60"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${10 + Math.random() * 20}s`,
              transform: `scale(${0.5 + Math.random()})`,
            }}
          >
            <Icon size={32} />
          </div>
        );
      })}
    </div>
    <style>{`
      @keyframes float {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-20px) rotate(10deg); }
      }
      .animate-float { animation: float infinite ease-in-out; }
      
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
      }
      .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
    `}</style>
  </div>
);

const FruitSellerLogo = () => (
  <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10">
    <Citrus size={12} className="text-orange-400" />
    <span className="text-[10px] font-black tracking-widest text-orange-400 uppercase">
      FRUIT SELLER
    </span>
  </div>
);

const FruitSellerLogoBig = () => (
  <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10">
    <Citrus size={22} className="text-orange-400" />
    <span className="text-[20px] font-black tracking-widest text-orange-400 uppercase">
      FRUIT SELLER
    </span>
  </div>
);

const LeaveConfirmModal = ({
  onConfirmLeave,
  onConfirmLobby,
  onCancel,
  isHost,
  inGame,
}) => (
  <div className="fixed inset-0 bg-black/90 z-200 flex items-center justify-center p-4 animate-in fade-in">
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 max-w-sm w-full text-center shadow-2xl">
      <h3 className="text-xl font-bold text-white mb-2">Close Stall?</h3>
      <p className="text-slate-400 mb-6 text-sm">
        {isHost
          ? "Closing the stall will end the game for everyone!"
          : "Leaving now will disconnect you from the market."}
      </p>
      <div className="flex flex-col gap-3">
        <button
          onClick={onCancel}
          className="bg-slate-700 hover:bg-slate-600 text-white py-3 rounded font-bold transition-colors"
        >
          Stay (Cancel)
        </button>

        {inGame && isHost && (
          <button
            onClick={onConfirmLobby}
            className="py-3 rounded font-bold transition-colors flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white"
          >
            <Home size={18} /> Return Traders to Lobby
          </button>
        )}

        <button
          onClick={onConfirmLeave}
          className="bg-red-600 hover:bg-red-500 text-white py-3 rounded font-bold transition-colors flex items-center justify-center gap-2"
        >
          <LogOut size={18} />{" "}
          {isHost ? "Close Market (End All)" : "Leave Market"}
        </button>
      </div>
    </div>
  </div>
);

const MarketButton = ({
  children,
  onClick,
  disabled,
  variant = "primary",
  className = "",
  icon: Icon,
}) => {
  const baseStyles =
    "relative px-6 py-3 rounded-lg font-serif font-bold transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2 text-base md:text-lg";
  const variants = {
    primary:
      "bg-orange-600 hover:bg-orange-500 text-white border-2 border-orange-800 shadow-orange-900/30",
    danger: "bg-red-700 hover:bg-red-600 text-white border-2 border-red-900",
    secondary:
      "bg-slate-700 hover:bg-slate-600 text-slate-200 border-2 border-slate-600",
    success:
      "bg-emerald-700 hover:bg-emerald-600 text-white border-2 border-emerald-900",
    ghost:
      "bg-transparent hover:bg-white/10 text-slate-300 border border-transparent",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

const CardDisplay = ({
  type,
  onClick,
  disabled,
  highlight,
  small,
  tiny,
  isFaceDown = false,
  isOpponent = false,
}) => {
  if (isFaceDown) {
    return (
      <div
        className={`
        ${
          tiny
            ? "w-6 h-8 rounded-sm"
            : small
              ? "w-10 h-14 rounded"
              : "w-20 h-32 md:w-24 md:h-36 rounded-xl"
        } 
        bg-gray-800 border-2 border-gray-600 flex items-center justify-center shadow-lg transition-transform
        ${isOpponent ? "" : "hover:border-gray-400"}
      `}
      >
        <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-gray-700 to-gray-900 opacity-50 flex items-center justify-center">
          <ShoppingBag
            className="text-gray-500 opacity-50"
            size={small ? 16 : 24}
          />
        </div>
      </div>
    );
  }

  const fruit = FRUITS[type];
  if (!fruit) return null;
  if (tiny) {
    return (
      <div
        className={`w-6 h-8 ${fruit.bg} border ${fruit.border} rounded-sm flex items-center justify-center shadow-sm`}
      >
        <fruit.icon className={`${fruit.color} w-3 h-3`} />
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative rounded-xl border-2 transition-all flex flex-col items-center justify-between shadow-lg
        ${small ? "w-10 h-14 p-1" : "w-20 h-32 md:w-28 md:h-40 p-2"}
        ${
          highlight
            ? "ring-4 ring-orange-500 -translate-y-6 z-50 shadow-[0_0_25px_rgba(249,115,22,0.5)]"
            : "border-gray-600"
        }
        ${fruit.bg} ${fruit.border}
        ${
          disabled
            ? "cursor-not-allowed brightness-75"
            : "hover:scale-105 cursor-pointer hover:border-white hover:-translate-y-2 hover:z-40"
        }
      `}
    >
      <div
        className={`absolute top-1 left-1.5 text-[10px] md:text-sm font-bold ${fruit.color} leading-none`}
      >
        {fruit.value}
      </div>

      <div
        className={`absolute bottom-1 right-1.5 text-[10px] md:text-sm font-bold ${fruit.color} leading-none rotate-180`}
      >
        {fruit.value}
      </div>

      <div className="flex-1 flex items-center justify-center w-full">
        <fruit.icon
          className={`${fruit.color} ${
            small ? "w-4 h-4" : "w-10 h-10 md:w-14 md:h-14"
          } drop-shadow-lg`}
        />
      </div>

      {!small && (
        <div className="w-full text-center pb-1">
          <div
            className={`font-bold text-[9px] md:text-xs ${fruit.color} tracking-wide uppercase truncate`}
          >
            {fruit.name}
          </div>
        </div>
      )}
    </button>
  );
};

const GameGuideModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/95 z-100 flex items-center justify-center p-0 md:p-4 backdrop-blur-md animate-in fade-in">
    <div className="bg-[#1e293b] md:rounded-2xl w-full max-w-5xl h-full md:h-[90vh] overflow-hidden border-none md:border-2 border-orange-500 shadow-2xl flex flex-col relative">
      <div className="p-4 md:p-6 border-b border-orange-500/30 flex justify-between items-center bg-black/40">
        <div className="flex flex-col">
          <h2 className="text-2xl md:text-4xl font-serif font-black text-orange-500 uppercase tracking-widest drop-shadow-md">
            Market Rules
          </h2>
          <span className="text-slate-400 text-xs md:text-sm font-medium tracking-wide font-serif italic">
            Trade, Collect, & Conquer
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full text-orange-500 transition-colors"
        >
          <X size={28} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 text-slate-300 scrollbar-thin scrollbar-thumb-orange-500 scrollbar-track-transparent">
        <div className="bg-[#0f172a] p-6 rounded-xl border border-slate-700 shadow-inner">
          <h3 className="text-xl md:text-2xl font-bold text-[#f1f5f9] mb-4 flex items-center gap-3 font-serif">
            <Trophy className="text-orange-500" size={24} /> The Objective
          </h3>
          <p className="text-sm md:text-lg leading-relaxed text-slate-400">
            You must corner the market! The first player to collect{" "}
            <strong className="text-white">5 cards of the same fruit</strong>{" "}
            wins the game instantly.
          </p>
        </div>

        <div>
          <h3 className="text-xl md:text-2xl font-bold text-[#f1f5f9] mb-6 flex items-center gap-3 font-serif">
            <ArrowRight className="text-emerald-400" size={24} /> How to Play
          </h3>
          <ul className="space-y-4 text-slate-300 text-lg">
            <li className="flex items-start gap-3">
              <div className="bg-orange-500 text-black w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 mt-1">
                1
              </div>
              <div>Everyone starts with a hand of 5 random fruit cards.</div>
            </li>
            <li className="flex items-start gap-3">
              <div className="bg-orange-500 text-black w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 mt-1">
                2
              </div>
              <div>
                On your turn, select <strong>ONE card</strong> to pass to the
                player on your left.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="bg-orange-500 text-black w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 mt-1">
                3
              </div>
              <div>
                The game continues in a circle until someone has a full set of 5
                matching fruits!
              </div>
            </li>
          </ul>
        </div>
      </div>
      <div className="p-6 bg-black/40 border-t border-orange-500/30 text-center">
        <MarketButton
          onClick={onClose}
          className="w-full md:w-auto px-12 text-lg"
        >
          Enter Market
        </MarketButton>
      </div>
    </div>
  </div>
);

const WinnerModal = ({
  winnerName,
  isMe,
  onRestart,
  isHost,
  onReturnToLobby,
  roomId,
  userId,
  players,
  readyPlayers = [],
}) => {
  const [isReady, setIsReady] = useState(false);

  // Check if this user has already voted ready
  useEffect(() => {
    if (readyPlayers.includes(userId)) {
      setIsReady(true);
    }
  }, [readyPlayers, userId]);

  const handleReady = async () => {
    setIsReady(true);
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        readyPlayers: arrayUnion(userId),
      },
    );
  };

  const guestCount = players.filter((p) => !p.isBot).length - 1; // All humans minus host
  const readyCount = readyPlayers.length; // Guests who clicked ready

  // Host can proceed if all GUESTS are ready (or everyone excluding themselves if logic varies)
  // Assuming 'readyPlayers' only gets populated by guests clicking the button.
  // If no guests, host can proceed immediately.
  const canProceed = guestCount <= 0 || readyCount >= guestCount;

  return (
    <div className="fixed inset-0 top-14 bg-black/90 z-150 flex items-center justify-center p-4 animate-in fade-in duration-500 backdrop-blur-sm">
      <div className="bg-[#1e293b] rounded-xl p-8 max-w-md w-full text-center relative overflow-hidden shadow-2xl border-2 border-orange-500">
        <div className="absolute inset-0 bg-linear-to-b from-orange-900/20 to-black opacity-50"></div>
        <Crown className="w-24 h-24 mx-auto text-orange-500 mb-4 animate-bounce drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
        <h2 className="text-4xl font-serif font-black text-white mb-2 tracking-wide">
          {isMe ? "YOU WON!" : `${winnerName} WINS!`}
        </h2>
        <p className="text-slate-300 mb-8 text-lg">
          Cornered the market with 5 matching fruits!
        </p>

        {isHost ? (
          <div className="flex flex-col gap-3 relative z-10">
            <div className="text-sm text-slate-400 mb-2 font-mono">
              {canProceed
                ? "All traders are ready!"
                : `Waiting for traders... (${readyCount}/${guestCount})`}
            </div>
            <MarketButton
              onClick={onRestart}
              disabled={!canProceed}
              variant="success"
              className="w-full text-lg"
            >
              <Play fill="currentColor" size={20} /> Play Again
            </MarketButton>
            <button
              onClick={onReturnToLobby}
              disabled={!canProceed}
              className="w-full py-3 rounded-lg font-bold transition-all bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Home size={20} /> Return to Lobby
            </button>
          </div>
        ) : (
          <div className="relative z-10 space-y-4">
            {!isReady ? (
              <button
                onClick={handleReady}
                className="w-full py-3 rounded-lg font-bold transition-all bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 animate-pulse"
              >
                <CheckCircle size={20} /> Ready for Next Game
              </button>
            ) : (
              <div className="flex flex-col items-center gap-2 text-emerald-500 font-bold bg-emerald-900/20 p-3 rounded-lg border border-emerald-500/30">
                <Check size={24} />
                <span>You are ready!</span>
                <span className="text-slate-400 text-xs font-normal">
                  Waiting for host...
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const LogViewer = ({ logs, onClose }) => (
  <div className="fixed top-16 right-4 w-64 max-h-60 bg-gray-900/95 border border-gray-700 rounded-xl z-155 overflow-y-auto p-2 shadow-2xl">
    <div className="bg-[#1e293b] w-full md:max-w-md h-[60vh] rounded-xl flex flex-col border border-orange-500 shadow-2xl overflow-hidden">
      <div className="p-4 border-b border-orange-500/30 flex justify-between items-center bg-black/20">
        <h3 className="text-orange-500 font-serif font-bold text-xl flex items-center gap-2">
          <History size={20} /> Market Ledger
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-slate-400"
        >
          <X size={20} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0f172a]">
        {[...logs].reverse().map((log, i) => (
          <div
            key={i}
            className={`text-xs md:text-sm p-3 rounded-lg border-l-4 shadow-sm ${
              log.type === "win"
                ? "bg-yellow-900/20 border-yellow-500 text-yellow-200"
                : log.type === "action"
                  ? "bg-slate-800 border-slate-500 text-slate-300"
                  : "bg-slate-800 border-slate-600 text-slate-400"
            }`}
          >
            {log.text}
          </div>
        ))}
      </div>
    </div>
  </div>
);

// --- Main Component ---
export default function FruitSellerGame() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("menu");
  // Initialize state from local storage to persist session on refresh
  const [roomId, setRoomId] = usePersistentState("fs_roomId", null);

  const [gameState, setGameState] = useState(null);
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [error, setError] = useState("");
  const [selectedCardIndex, setSelectedCardIndex] = useState(null);
  const [showRules, setShowRules] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  //read and fill global name
  const [playerName, setPlayerName] = useState(
    () => localStorage.getItem("gameHub_playerName") || "",
  );
  //set global name for all game
  useEffect(() => {
    if (playerName) localStorage.setItem("gameHub_playerName", playerName);
  }, [playerName]);

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

  // --- Persistence Logic ---
  // Save roomId and playerName to localStorage whenever they change
  useEffect(() => {
    if (roomId) localStorage.setItem("fs_roomId", roomId);
    else localStorage.removeItem("fs_roomId");
  }, [roomId]);

  // --- Room Listener ---
  useEffect(() => {
    if (!roomId || !user) return;
    const roomRef = doc(
      db,
      "artifacts",
      APP_ID,
      "public",
      "data",
      "rooms",
      roomId,
    );
    const unsubscribe = onSnapshot(roomRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();

        const isInRoom = data.players.some((p) => p.id === user.uid);
        if (!isInRoom) {
          setRoomId(null);
          setView("menu");
          setError("The Market has closed or you were removed.");
          return;
        }

        setGameState(data);
        if (data.status === "playing" || data.status === "finished")
          setView("game");
        else setView("lobby");
      } else {
        // Room deleted (Host left or forced close)
        setRoomId(null);
        setView("menu");
        setError("Market closed by the Master.");
      }
    });
    return () => unsubscribe();
  }, [roomId, user]);

  // --- Bot Turn Logic (Host Only) ---
  useEffect(() => {
    if (!gameState || gameState.status !== "playing" || !user) return;
    if (gameState.hostId !== user.uid) return;

    const currentPlayer = gameState.players[gameState.turnIndex];
    if (currentPlayer.isBot) {
      const timer = setTimeout(() => {
        const cardIndexToPass = getBotMove(currentPlayer.hand);
        performPass(cardIndexToPass);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState, user]);

  // --- Maintenance Check ---
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "game_hub_settings", "config"), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data[GAME_ID]?.maintenance) {
          setIsMaintenance(true);
        } else {
          setIsMaintenance(false);
        }
      }
    });
    return () => unsub();
  }, []);

  if (isMaintenance) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white p-4 text-center">
        <FruitSellerLogoBig />
        {/* First Box */}
        <div className="bg-orange-500/10 p-8 rounded-2xl border border-orange-500/30">
          <Hammer
            size={64}
            className="text-orange-500 mx-auto mb-4 animate-bounce"
          />
          <h1 className="text-3xl font-bold mb-2">Under Maintenance</h1>
          <p className="text-gray-400">
            Market closed for cleaning. Fresh shipment arriving soon.
          </p>
        </div>

        {/* Add Spacing Between Boxes */}
        <div className="h-8"></div>

        {/* Clickable Second Card */}
        <a href="https://rawfidkshuvo.github.io/gamehub/">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="text-center pb-12 animate-pulse">
              <div className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900/50 rounded-full border border-indigo-500/20 text-indigo-300 font-bold tracking-widest text-sm uppercase backdrop-blur-sm">
                <Sparkles size={16} /> Visit Gamehub...Try our other releases...{" "}
                <Sparkles size={16} />
              </div>
            </div>
          </div>
        </a>
        <FruitSellerLogo />
      </div>
    );
  }

  // --- Actions ---
  const createRoom = async () => {
    if (!playerName.trim()) return setError("Please enter your name.");
    const chars = "123456789ABCDEFGHIJKLMNPQRSTUVWXYZ";
    let newRoomId = "";
    for (let i = 0; i < 6; i++) {
      newRoomId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
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
        readyPlayers: [], // Track who is ready for rematch
      },
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
      rId,
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

  const copyToClipboard = () => {
    const textToCopy = roomId;

    // Logic to show the popup and hide it after 2 seconds
    const handleSuccess = () => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);

      // Keep your existing global feedback if needed
      if (triggerFeedback)
        triggerFeedback("neutral", "COPIED!", "", CheckCircle);
    };

    try {
      navigator.clipboard.writeText(textToCopy);
      handleSuccess();
    } catch (e) {
      // Fallback for older browsers
      const el = document.createElement("textarea");
      el.value = textToCopy;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      handleSuccess();
    }
  };

  const startGame = async () => {
    if (!gameState) return;
    let currentPlayers = [...gameState.players];
    const maxP = gameState.maxPlayers;
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
    currentPlayers = currentPlayers.map((p) => ({
      ...p,
      hand: deck.splice(0, 5),
    }));
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "playing",
        players: currentPlayers,
        turnIndex: 0,
        winnerId: null,
        logs: [{ text: "Market Opened!", type: "neutral" }],
        readyPlayers: [], // Reset for next game
      },
    );
  };

  const performPass = async (cardIndex) => {
    if (!gameState) return;
    const currentPlayerIdx = gameState.turnIndex;
    const nextPlayerIdx = (currentPlayerIdx + 1) % gameState.players.length;
    const updatedPlayers = JSON.parse(JSON.stringify(gameState.players));
    // Move card
    if (updatedPlayers[currentPlayerIdx].hand[cardIndex]) {
      const passedCard = updatedPlayers[currentPlayerIdx].hand.splice(
        cardIndex,
        1,
      )[0];
      updatedPlayers[nextPlayerIdx].hand.push(passedCard);
    } else {
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

    const updates = { players: updatedPlayers, selectedCardIndex: null };
    const currentName = updatedPlayers[currentPlayerIdx].name;
    const nextName = updatedPlayers[nextPlayerIdx].name;
    const logs = [
      ...gameState.logs,
      { text: `${currentName} passed to ${nextName}.`, type: "action" },
    ];
    if (winnerId) {
      updates.status = "finished";
      updates.winnerId = winnerId;
      logs.push({ text: `${winnerName} CORNERED THE MARKET!`, type: "win" });
    } else {
      updates.turnIndex = nextPlayerIdx;
    }
    updates.logs = logs.slice(-10);
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      updates,
    );
    setSelectedCardIndex(null);
  };

  const handleManualPass = () => {
    if (selectedCardIndex !== null) performPass(selectedCardIndex);
  };

  const leaveRoom = async () => {
    if (!roomId || !user) return;
    try {
      const roomRef = doc(
        db,
        "artifacts",
        APP_ID,
        "public",
        "data",
        "rooms",
        roomId,
      );
      const snap = await getDoc(roomRef);

      if (snap.exists()) {
        const data = snap.data();
        const isHost = data.hostId === user.uid;

        if (isHost) {
          // If Host leaves, ALWAYS destroy room to force all players home
          await deleteDoc(roomRef);
        } else {
          // Guest Logic
          if (data.status === "lobby") {
            const newPlayers = data.players.filter((p) => p.id !== user.uid);
            await updateDoc(roomRef, { players: newPlayers });
          } else {
            await handleGameAbandon(roomRef, data);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
    // Local cleanup
    setRoomId(null);
    setView("menu");
    setShowLeaveConfirm(false);
  };

  const handleGameAbandon = async (roomRef, data) => {
    // If a guest leaves during game, we just mark it as finished/botched for now
    // or we could let the game continue with a bot?
    // Current logic: Ends game.
    await updateDoc(roomRef, {
      status: "finished",
      players: data.players.filter((p) => p.id !== user.uid), // Remove the leaver
      logs: arrayUnion({
        text: `${
          data.players.find((p) => p.id === user.uid)?.name
        } left the market. Market Closed.`,
        type: "win",
      }),
    });
  };

  const resetToLobby = async () => {
    if (!gameState || gameState.hostId !== user.uid) return;
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "lobby",
        turnIndex: 0,
        winnerId: null,
        logs: [],
        readyPlayers: [], // Reset ready status
        players: gameState.players.map((p) => ({
          ...p,
          hand: [],
          ready: true,
        })),
      },
    );
    setShowLeaveConfirm(false);
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
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-orange-500 animate-pulse">
        Openning stall...
      </div>
    );

  // RECONNECTING STATE
  if (roomId && !gameState && !error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white p-4">
        <FloatingBackground />
        <div className="bg-zinc-900/80 backdrop-blur p-8 rounded-2xl border border-zinc-700 shadow-2xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
          <Loader size={48} className="text-orange-500 animate-spin" />
          <div className="text-center">
            <h2 className="text-xl font-bold">Reconnecting...</h2>
            <p className="text-zinc-400 text-sm">Resuming your session</p>
          </div>
        </div>
      </div>
    );
  }
  // --- VIEW: MENU ---
  if (view === "menu") {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col relative overflow-hidden font-sans selection:bg-orange-500 selection:text-black">
        {showRules && <GameGuideModal onClose={() => setShowRules(false)} />}
        <FloatingBackground />

        <div className="flex-1 flex flex-col items-center justify-center w-full z-10 px-4">
          <div className="text-center mb-10 animate-in fade-in zoom-in duration-700 w-full">
            <Citrus
              size={64}
              className="text-orange-500 mx-auto mb-4 animate-bounce drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]"
            />
            <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-linear-to-b from-orange-300 to-orange-600 font-serif tracking-widest drop-shadow-md">
              FRUIT SELLER
            </h1>
            <p className="text-gray-400 tracking-[0.3em] uppercase mt-2">
              The Juicy Trading Game
            </p>
          </div>

          <div className="bg-gray-900/80 backdrop-blur border border-gray-700 p-8 rounded-2xl w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-10 duration-700 delay-100">
            {error && (
              <div className="bg-red-900/50 text-red-200 p-2 mb-4 rounded text-center text-sm border border-red-800 flex items-center justify-center gap-2">
                <AlertTriangle size={16} /> {error}
              </div>
            )}

            <input
              className="w-full bg-black/50 border border-gray-600 p-3 rounded mb-4 text-white placeholder-gray-500 focus:border-orange-500 outline-none transition-colors"
              placeholder="Trader Name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />

            <button
              onClick={createRoom}
              className="w-full bg-linear-to-r from-orange-700 to-orange-600 hover:from-orange-600 hover:to-orange-500 p-4 rounded font-bold mb-4 flex items-center justify-center gap-2 border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.2)] transition-all"
            >
              <Store size={20} /> Open New Stall
            </button>

            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <input
                className="w-full sm:flex-1 bg-black/50 border border-gray-600 p-3 rounded text-white placeholder-gray-500 uppercase font-mono tracking-wider focus:border-orange-500 outline-none"
                placeholder="ROOM CODE"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
              />
              <button
                onClick={joinRoom}
                className="w-full sm:w-auto bg-gray-800 hover:bg-gray-700 border border-gray-600 px-6 py-3 rounded font-bold transition-colors"
              >
                Join
              </button>
            </div>

            <button
              onClick={() => setShowRules(true)}
              className="w-full text-sm text-gray-400 hover:text-white flex items-center justify-center gap-2 py-2"
            >
              <BookOpen size={16} /> Market Rules
            </button>
          </div>
        </div>
        <div className="z-10 w-full bg-transparent"></div>
        <div className="absolute bottom-4 w-full text-slate-600 text-xs text-center z-50">
          Developed by <strong>RAWFID K SHUVO</strong>. Visit{" "}
          <a
            href="https://rawfidkshuvo.github.io/gamehub/"
            target="_blank"
            rel="noopener noreferrer"
            // Added 'relative' and 'z-50' to the link itself just to be safe,
            // though the parent div change usually is enough.
            className="text-orange-500 underline hover:text-orange-600 relative z-50 cursor-pointer"
          >
            GAMEHUB
          </a>{" "}
          for more games.
        </div>
      </div>
    );
  }

  // --- VIEW: LOBBY ---
  if (view === "lobby" && gameState) {
    const isHost = gameState.hostId === user.uid;
    const missingPlayers = gameState.maxPlayers - gameState.players.length;

    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6 relative">
        <FloatingBackground />
        <FruitSellerLogoBig />

        {showRules && <GameGuideModal onClose={() => setShowRules(false)} />}
        {showLeaveConfirm && (
          <LeaveConfirmModal
            onCancel={() => setShowLeaveConfirm(false)}
            onConfirmLeave={leaveRoom}
            onConfirmLobby={() => {
              resetToLobby();
              setShowLeaveConfirm(false);
            }}
            isHost={isHost}
            inGame={false}
          />
        )}

        <div className="z-10 w-full max-w-lg bg-gray-800/90 p-8 rounded-2xl border border-gray-700 shadow-2xl mb-4">
          <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
            {/* Grouping Title and Copy Button together on the left */}
            <div>
              <h2 className="text-lg md:text-xl text-orange-500 font-bold uppercase">
                Fruit Stall
              </h2>

              {/* Flex container to align ID and Button side-by-side */}
              <div className="flex items-center gap-3 mt-1">
                <div className="text-2xl md:text-3xl font-mono text-white font-black">
                  {roomId}
                </div>

                {/* 2. Container set to relative for positioning the popup */}
                <div className="relative">
                  <button
                    onClick={copyToClipboard}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                  >
                    {/* Optional: Change icon to checkmark when copied */}
                    {isCopied ? (
                      <CheckCircle size={16} className="text-green-500" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>

                  {/* 3. The Copied Popup */}
                  {isCopied && (
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-orange-500 text-black text-xs font-bold px-2 py-1 rounded shadow-lg animate-fade-in-up whitespace-nowrap">
                      Copied!
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Users size={16} /> {gameState.players.length}/
                {gameState.maxPlayers}
              </div>
              <button
                onClick={() => setShowLeaveConfirm(true)}
                className="p-2 bg-red-900/50 hover:bg-red-900 rounded text-red-300"
                title="Leave Room"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>

          <div className="space-y-3 mb-8">
            {gameState.players.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-gray-900 p-4 rounded border border-gray-700"
              >
                <span className="font-bold text-orange-500 flex items-center gap-2">
                  {p.id === gameState.hostId && (
                    <Crown size={14} className="text-orange-500" />
                  )}{" "}
                  {p.name}
                </span>
                {p.id === user.uid && (
                  <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                    You
                  </span>
                )}
              </div>
            ))}
            {Array(missingPlayers)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="p-4 border border-dashed border-gray-700 rounded bg-gray-900/50 flex items-center gap-2 text-gray-500"
                >
                  <Bot size={16} />
                  <span className="italic text-sm">
                    Automated Trader will join...
                  </span>
                </div>
              ))}
          </div>

          {isHost && (
            <div className="flex justify-end items-center mb-4">
              <span className="text-sm text-gray-400 mr-2">Max Players:</span>
              <select
                className="bg-gray-700 border border-gray-600 rounded p-1 text-white font-bold outline-none text-sm"
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
                      roomId,
                    ),
                    { maxPlayers: parseInt(e.target.value) },
                  )
                }
              >
                <option value={4}>4</option>
                <option value={5}>5</option>
                <option value={6}>6</option>
              </select>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {isHost ? (
              <button
                onClick={startGame}
                className="w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all bg-emerald-700 hover:bg-emerald-600 text-white shadow-emerald-900/30"
              >
                Open Market {missingPlayers > 0 && "(+ Bots)"}
              </button>
            ) : (
              <div className="text-center text-orange-500/80 font-serif mb-2">
                Waiting for Host to start...
              </div>
            )}
          </div>
        </div>

        <FruitSellerLogo />
      </div>
    );
  }

  // --- VIEW: GAME ---
  if (view === "game" && me) {
    const opponents = getOpponents();
    const sortedHandIndices = me.hand
      .map((c, i) => ({ ...c, originalIndex: i }))
      .sort((a, b) => a.type.localeCompare(b.type));
    const isHost = gameState.hostId === user.uid;

    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col relative overflow-hidden select-none">
        <FloatingBackground />

        {/* Global Modals */}
        {showRules && <GameGuideModal onClose={() => setShowRules(false)} />}
        {showLogs && (
          <LogViewer logs={gameState.logs} onClose={() => setShowLogs(false)} />
        )}

        {showLeaveConfirm && (
          <LeaveConfirmModal
            onCancel={() => setShowLeaveConfirm(false)}
            onConfirmLeave={leaveRoom}
            onConfirmLobby={() => {
              resetToLobby();
              setShowLeaveConfirm(false);
            }}
            isHost={isHost}
            inGame={true}
          />
        )}

        {gameState.winnerId && (
          <WinnerModal
            winnerName={
              gameState.players.find((p) => p.id === gameState.winnerId)?.name
            }
            isMe={gameState.winnerId === user.uid}
            isHost={gameState.hostId === user.uid}
            onRestart={startGame}
            onReturnToLobby={resetToLobby}
            roomId={roomId}
            userId={user.uid}
            players={gameState.players}
            readyPlayers={gameState.readyPlayers || []}
          />
        )}

        {/* Top Bar - Fixed at Top */}
        <div className="fixed top-0 left-0 right-0 bg-[#1e293b] p-2 md:p-4 flex justify-between items-center z-160 shadow-md border-b border-orange-500/30 h-14 md:h-16">
          <div className="font-bold text-orange-500 flex items-center gap-2 text-sm md:text-base font-serif truncate">
            <Store size={18} /> Fruit Market
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowLogs(!showLogs)}
              className={`p-2 rounded-full ${
                showLogs
                  ? "bg-orange-900 text-orange-400"
                  : "text-gray-400 hover:bg-gray-800"
              }`}
            >
              <History size={20} />
            </button>
            <button
              onClick={() => setShowRules(true)}
              className="p-2 hover:bg-white/10 rounded transition-colors text-slate-300"
            >
              <BookOpen size={20} />
            </button>
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="p-2 hover:bg-white/10 rounded transition-colors text-slate-300"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* Main Content - Increased padding to push content down */}
        <div className="flex-1 flex flex-col pt-24 pb-4 h-screen">
          {/* Top Half: Marketplace (Opponents) & Trading Desk (Action) */}
          <div className="flex-1 flex flex-col relative">
            {/* Opponents: Top Grid/Flex */}
            <div className="flex justify-center flex-wrap gap-4 p-2 z-10 min-h-[120px]">
              {opponents.map((opp) => {
                const isOpponentTurn = gameState.turnIndex === opp.realIndex;
                return (
                  <div
                    key={opp.id}
                    className={`flex flex-col items-center transition-all duration-300 ${
                      isOpponentTurn
                        ? "scale-105 opacity-100"
                        : "opacity-70 scale-95"
                    }`}
                  >
                    <div
                      className={`relative rounded-lg bg-[#0f172a] border-2 p-2 flex flex-col items-center shadow-lg w-20 md:w-24
                            ${
                              isOpponentTurn
                                ? "border-orange-500 shadow-orange-500/30"
                                : "border-slate-700"
                            }`}
                    >
                      <div className="relative">
                        {opp.isBot ? (
                          <Bot className="text-slate-400" />
                        ) : (
                          <Users className="text-slate-400" />
                        )}
                        <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border border-white">
                          {opp.hand.length}
                        </div>
                      </div>
                      <div className="text-[10px] font-bold text-slate-300 mt-1 truncate w-full text-center">
                        {opp.name}
                      </div>
                      {isOpponentTurn && (
                        <div className="absolute -top-3 bg-orange-500 text-black text-[8px] font-bold px-2 py-0.5 rounded-full animate-bounce">
                          PLAYING
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Center Action Area - The "Table" */}
            <div className="flex-1 flex flex-col items-center justify-center z-0 relative min-h-[150px]">
              {/* Game Log / Status Notification */}
              {gameState.logs.length > 0 && (
                <div className="mb-4 px-4 py-1 rounded-full bg-black/40 backdrop-blur-sm text-orange-400 border border-orange-500/20 text-xs md:text-sm font-serif">
                  {gameState.logs[gameState.logs.length - 1].text}
                </div>
              )}

              {/* Turn Indicator / Action Button Placement */}
              <div className="h-16 flex items-center justify-center">
                {isMyTurn && selectedCardIndex !== null ? (
                  <MarketButton
                    onClick={handleManualPass}
                    className="animate-in zoom-in px-8 py-3 shadow-[0_0_30px_rgba(249,115,22,0.4)] text-lg"
                  >
                    Pass Card <ArrowRight size={20} className="ml-2" />
                  </MarketButton>
                ) : isMyTurn ? (
                  <div className="animate-pulse flex flex-col items-center">
                    <h2 className="text-3xl font-black text-orange-500 drop-shadow-md tracking-wider">
                      YOUR TURN
                    </h2>
                    <span className="text-slate-400 text-sm">
                      Select a card from your hand
                    </span>
                  </div>
                ) : (
                  <div className="text-slate-500 text-sm italic">
                    Waiting for trades...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Half: Player Inventory (Hand) */}
          <div className="mt-auto flex flex-col items-center w-full max-w-5xl mx-auto z-20">
            {/* Player Name Tag */}
            <div className="bg-[#1e293b] border border-orange-500/30 rounded-t-lg px-6 py-1 shadow-lg mb-[-10px] relative z-0">
              <span className="text-slate-400 text-[10px] font-bold uppercase mr-2">
                YOU
              </span>
              <span className="text-orange-500 font-serif font-bold">
                {me.name}
              </span>
            </div>

            {/* Cards Container - Improved Responsiveness */}
            <div className="w-full flex justify-center items-end h-48 md:h-64 pb-2 px-4 overflow-x-auto no-scrollbar">
              {" "}
              {/* Added overflow-x-auto */}
              <div
                className="flex justify-center items-end -space-x-8 md:-space-x-12 hover:-space-x-3 transition-all duration-300 w-auto" // Adjusted spacing and min-width
                style={{ paddingBottom: "10px" }} // Add padding for hover lift
              >
                {sortedHandIndices.map((cardData, visualIndex) => {
                  const isSelected =
                    isMyTurn && selectedCardIndex === cardData.originalIndex;
                  const totalCards = me.hand.length;
                  // Reduced rotation for mobile to keep cards more upright and readable
                  const rotateDeg =
                    (visualIndex - (totalCards - 1) / 2) *
                    (window.innerWidth < 768 ? 2 : 4);
                  const translateY = isSelected
                    ? -40
                    : Math.abs(visualIndex - (totalCards - 1) / 2) *
                      (window.innerWidth < 768 ? 2 : 5);
                  return (
                    <div
                      key={cardData.id}
                      style={{
                        zIndex: isSelected ? 50 : visualIndex,
                        transform: `rotate(${rotateDeg}deg) translateY(${translateY}px)`,
                        transformOrigin: "bottom center",
                      }}
                      className="transition-all duration-300 cursor-pointer hover:z-40 shrink-0" // Added shrink-0
                    >
                      <CardDisplay
                        type={cardData.type}
                        highlight={isSelected}
                        onClick={() =>
                          isMyTurn &&
                          setSelectedCardIndex(cardData.originalIndex)
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <FruitSellerLogo />
      </div>
    );
  }

  return null;
}
