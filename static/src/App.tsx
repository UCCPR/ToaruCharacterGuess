import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Gamepad2, Home, Lightbulb, Play, RotateCcw, Target, WifiOff } from 'lucide-react';
import Page from '../../client/src/components/Page';
import GuessBoard from '../../client/src/components/GuessBoard';
import GuessInputBar from '../../client/src/components/GuessInputBar';
import AnswerOverlay, { type AnswerInfo } from '../../client/src/components/AnswerOverlay';
import LanguageSelect from '../../client/src/components/LanguageSelect';
import GameRules from '../../client/src/components/GameRules';
import { useConfirm } from '../../client/src/components/ConfirmDialog';
import { AVAILABLE_DIFFICULTIES } from '../../client/src/config/difficulties';
import {
  difficultyColor,
  difficultyDescription,
  difficultyIcon,
  difficultyLabel,
} from '../../client/src/utils/difficulty';
import { setPlayerListSnapshot, type PlayerSuggestion } from '../../client/src/api/playerList';
import type { GuessFeedback } from '../../client/src/types';
import { catalog } from './generated/catalog';
import {
  clearStaticGame,
  compare,
  dailyTarget,
  staticGameStorageKey,
  type Character,
  type Guess,
  type StaticGameMode,
} from './game';

const characters = catalog as unknown as Character[];
const suggestions: PlayerSuggestion[] = characters.map((character) => ({
  id: character.id,
  nickname: character.name,
  localizedNames: character.names,
  searchTerms: [...character.aliases],
}));
setPlayerListSnapshot(suggestions);

const MAX_GUESSES = 8;
const genderCode: Record<string, number> = { female: 0, male: 1, unknown: 2, none: 3 };

function dateKey(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date());
}

function randomTarget(pool: Character[]): Character {
  return pool[Math.floor(Math.random() * pool.length)];
}

function toFeedback(guess: Guess): GuessFeedback {
  return {
    playerId: guess.character.id,
    nickname: guess.character.name,
    correct: guess.correct,
    attributes: {
      nationality: guess.cells.side,
      region: guess.cells.location,
      team: guess.cells.organization,
      age: guess.cells.identity,
      role: guess.cells.identity,
      majorChampionships: {
        value: genderCode[String(guess.cells.gender.value)] ?? 2,
        level: guess.cells.gender.level,
      },
      majorAppearances: guess.cells.year,
      debutWork: guess.cells.work,
      isActive: { value: true, level: 'correct' },
    },
  };
}

function answerInfo(character: Character): AnswerInfo {
  return {
    id: character.id,
    nickname: character.name,
    localizedNames: character.names,
    nationality: character.side,
    region: character.location,
    team: character.organizations[0]?.name ?? '无所属',
    identities: character.identities.map((identity) => identity.name),
    majorChampionships: genderCode[character.gender] ?? 2,
    majorAppearances: character.debutYear,
    debutWork: character.debutWork,
    difficulties: [...character.difficulties],
  };
}

type SavedGame = {
  targetId: number;
  guessIds: number[];
  status: 'playing' | 'won' | 'lost';
};

export function App() {
  const { t, i18n } = useTranslation();
  const confirm = useConfirm();
  const [screen, setScreen] = useState<'lobby' | 'game'>('lobby');
  const [mode, setMode] = useState<StaticGameMode>('free');
  const [difficulty, setDifficulty] = useState('normal');
  const [target, setTarget] = useState<Character>(() => dailyTarget(characters, 'normal', dateKey()));
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [showAnswer, setShowAnswer] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const boardEndRef = useRef<HTMLDivElement>(null);

  const pool = useMemo(
    () => characters.filter((character) => character.difficulties.includes(difficulty)),
    [difficulty],
  );
  const availableSuggestions = useMemo(
    () => suggestions.filter((item) => pool.some((character) => character.id === item.id)),
    [pool],
  );

  useEffect(() => {
    if (screen !== 'game') return;
    const saved: SavedGame = {
      targetId: target.id,
      guessIds: guesses.map((guess) => guess.character.id),
      status,
    };
    localStorage.setItem(staticGameStorageKey(mode, difficulty), JSON.stringify(saved));
  }, [difficulty, guesses, mode, screen, status, target.id]);

  useEffect(() => {
    if (!inputFocused || !window.matchMedia('(max-width: 640px)').matches) return;
    boardEndRef.current?.scrollIntoView({ block: 'end' });
  }, [guesses.length, inputFocused]);

  const createTarget = (nextMode: StaticGameMode, nextDifficulty: string) => {
    const nextPool = characters.filter((character) => character.difficulties.includes(nextDifficulty));
    return nextMode === 'daily'
      ? dailyTarget(characters, nextDifficulty, dateKey())
      : randomTarget(nextPool);
  };

  const begin = (reset = false) => {
    const key = staticGameStorageKey(mode, difficulty);
    if (!reset) {
      try {
        const saved = JSON.parse(localStorage.getItem(key) ?? 'null') as SavedGame | null;
        const savedTarget = characters.find((character) => character.id === saved?.targetId);
        if (saved && savedTarget) {
          const restored = saved.guessIds
            .map((id) => characters.find((character) => character.id === id))
            .filter((character): character is Character => Boolean(character))
            .map((character) => compare(character, savedTarget));
          setTarget(savedTarget);
          setGuesses(restored);
          setStatus(saved.status);
          setShowAnswer(saved.status !== 'playing');
          setScreen('game');
          return;
        }
      } catch {
        localStorage.removeItem(key);
      }
    }
    localStorage.removeItem(key);
    setTarget(createTarget(mode, difficulty));
    setGuesses([]);
    setStatus('playing');
    setShowAnswer(false);
    setScreen('game');
  };

  const restart = async () => {
    if (status === 'playing' && !await confirm({
      title: t('game.restartTitle'),
      message: t('game.restartMessage'),
      confirmLabel: t('game.restart'),
      tone: 'danger',
    })) return;
    begin(true);
  };

  const leave = async () => {
    if (status === 'playing' && guesses.length && !await confirm({
      title: t('game.leaveTitle'),
      message: t('game.leaveMessage'),
      confirmLabel: t('game.leaveConfirm'),
      tone: 'warning',
    })) return;
    clearStaticGame(mode, difficulty);
    setGuesses([]);
    setStatus('playing');
    setShowAnswer(false);
    setScreen('lobby');
  };

  const reveal = async () => {
    if (status !== 'playing' || !await confirm({
      title: t('game.revealTitle'),
      message: t('game.revealMessage'),
      confirmLabel: t('game.reveal'),
      tone: 'danger',
    })) return;
    setStatus('lost');
    setShowAnswer(true);
  };

  const submitGuess = (player: PlayerSuggestion) => {
    if (status !== 'playing' || guesses.some((guess) => guess.character.id === player.id)) return false;
    const character = characters.find((item) => item.id === player.id);
    if (!character) return false;
    const result = compare(character, target);
    const next = [...guesses, result];
    setGuesses(next);
    if (result.correct) {
      setStatus('won');
      setShowAnswer(true);
    } else if (next.length >= MAX_GUESSES) {
      setStatus('lost');
      setShowAnswer(true);
    }
    return true;
  };

  const staticCopy = i18n.language.startsWith('en')
    ? 'Static edition · Progress stays in this browser'
    : i18n.language.startsWith('ja')
      ? '静的版 · 進行状況はこのブラウザに保存されます'
      : '静态版 · 进度仅保存在当前浏览器';

  if (screen === 'lobby') {
    return (
      <Page
        title={t('singleLobby.title')}
        icon={<Gamepad2 size={17} />}
        showHome={false}
        actions={<LanguageSelect />}
        statusBar={<><WifiOff size={14} /><span>{staticCopy}</span></>}
      >
        <div className="single-lobby-mode-actions">
          <button className={`btn${mode === 'free' ? '' : ' btn-ghost'}`} onClick={() => setMode('free')}>
            {t('home.singleMode')}
          </button>
          <button className={`btn${mode === 'daily' ? '' : ' btn-ghost'}`} onClick={() => setMode('daily')}>
            {t('home.dailyChallenge')}
          </button>
        </div>
        <div className="toaru-title-mark">
          <img
            src={`${import.meta.env.BASE_URL}toaru-character-title.png`}
            alt={t('common.brand')}
          />
        </div>
        <p className="muted single-lobby-subtitle">{t('singleLobby.subtitle')}</p>
        <div className="single-difficulty-grid">
          {AVAILABLE_DIFFICULTIES.map((item) => {
            const active = difficulty === item.key;
            const Icon = difficultyIcon(item.key);
            return (
              <button
                type="button"
                key={item.key}
                className={`single-difficulty-option${active ? ' active' : ''}`}
                style={{ ['--diff-color' as string]: difficultyColor(item.key) }}
                onClick={() => setDifficulty(item.key)}
              >
                <span className="single-difficulty-icon"><Icon size={20} /></span>
                <span className="single-difficulty-copy">
                  <strong>{difficultyLabel(t, item.key)}</strong>
                  <small>{difficultyDescription(t, item.key)}</small>
                </span>
                <span className="single-difficulty-check" aria-hidden="true">{active && <Check size={17} />}</span>
                {item.recommended && <span className="single-difficulty-badge">{t('singleLobby.recommended')}</span>}
              </button>
            );
          })}
        </div>
        <div className="single-lobby-action">
          <button className="btn btn-lg btn-green" onClick={() => begin(false)}>
            <Play size={17} /> {t('singleLobby.start')}
          </button>
        </div>
        <GameRules />
      </Page>
    );
  }

  const feedback = guesses.map(toFeedback);
  const finished = status !== 'playing';
  const modeName = mode === 'daily' ? t('home.dailyChallenge') : t('home.singleMode');
  return (
    <Page
      className={`game-page single-game-page${inputFocused ? ' keyboard-active' : ''}`}
      title={`${modeName} · ${difficultyLabel(t, difficulty)}`}
      icon={<Target size={17} />}
      showHome={false}
      actions={
        <>
          <LanguageSelect />
          <button className="btn btn-ghost btn-sm" onClick={() => void restart()}>
            <RotateCcw size={15} /><span className="btn-text">{t('game.restart')}</span>
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => void leave()}>
            <Home size={15} /><span className="btn-text">{t('common.home')}</span>
          </button>
          <button className="btn btn-warning btn-sm" onClick={() => void reveal()} disabled={finished}>
            <Lightbulb size={15} /><span className="btn-text">{t('game.reveal')}</span>
          </button>
        </>
      }
      statusBar={
        <>
          <Target size={14} />
          <span className="guess-progress" aria-label={t('game.guesses', { current: guesses.length, max: MAX_GUESSES })}>
            {Array.from({ length: MAX_GUESSES }, (_, index) => <i key={index} className={index < guesses.length ? 'used' : ''} />)}
          </span>
          <span>{finished ? status === 'won' ? t('game.congratulations') : t('game.ended') : t('game.hint')}</span>
        </>
      }
      dock={
        finished ? (
          <div className="input-bar" style={{ justifyContent: 'center' }}>
            <button className="btn" onClick={() => void restart()}><RotateCcw size={15} />{t('game.again')}</button>
            <button className="btn btn-ghost" onClick={() => void leave()}><Home size={15} />{t('common.home')}</button>
          </div>
        ) : (
          <GuessInputBar
            playerList={availableSuggestions}
            onPick={submitGuess}
            onFocusChange={setInputFocused}
          />
        )
      }
    >
      {feedback.length ? (
        <div className="single-game-board">
          <GuessBoard guesses={feedback} />
          <div ref={boardEndRef} className="guess-board-end" aria-hidden="true" />
        </div>
      ) : (
        <div className="game-empty">
          <Target size={32} strokeWidth={1.5} />
          <p>{t('game.startHint')}</p>
          <p className="game-empty-sub">{difficultyDescription(t, difficulty)}</p>
          <div className="guess-legend" aria-label={t('rules.feedbackLabel')}>
            <span><i className="legend-correct" />{t('rules.greenTitle')}</span>
            <span><i className="legend-close" />{t('rules.yellowTitle')}</span>
            <span><i className="legend-wrong" />{t('rules.grayTitle')}</span>
            <span><i className="legend-arrow">↕</i>{t('rules.arrowTitle')}</span>
          </div>
        </div>
      )}
      <GameRules />
      {showAnswer && (
        <AnswerOverlay
          title={status === 'won' ? t('game.congratulations') : t('game.correctAnswer')}
          answer={answerInfo(target)}
          tone={status === 'won' ? 'win' : 'lose'}
          onClose={() => setShowAnswer(false)}
          extra={<p className="muted">{status === 'won' ? t('game.usedGuesses', { count: guesses.length }) : t('game.missed')}</p>}
          actions={
            <>
              <button className="btn" onClick={() => void restart()}><RotateCcw size={15} />{t('game.again')}</button>
              <button className="btn btn-ghost" onClick={() => setShowAnswer(false)}>{t('game.viewGame')}</button>
            </>
          }
        />
      )}
    </Page>
  );
}
