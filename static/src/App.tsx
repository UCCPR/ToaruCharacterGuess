import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GENDER_CODES, MAX_GUESSES } from '@toaru-character-guess/shared';
import { Award, BarChart3, CalendarCheck2, CalendarDays, Check, Crosshair, Gamepad2, Home, Layers3, Lightbulb, Medal, Play, RotateCcw, Sparkles, Target, Trash2, Trophy, WifiOff, Zap } from 'lucide-react';
import Page from '../../client/src/components/Page';
import Badge from '../../client/src/components/Badge';
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
import { useDifficultyCharacterCounts } from '../../client/src/hooks/useDifficultyCharacterCounts';
import type { GuessFeedback } from '../../client/src/types';
import { catalog } from './generated/catalog';
import {
  clearStaticGame,
  compare,
  dailyTarget,
  latestUnfinishedStaticGame,
  staticGameStorageKey,
  type Character,
  type Guess,
  type StaticSavedGame,
  type StaticGameMode,
} from './game';
import {
  addStaticGameRecord,
  clearStaticGameRecords,
  loadStaticGameRecords,
  summarizeStaticGameRecords,
} from './stats';
import {
  getStaticAchievementProgress,
  loadStaticAchievementUnlocks,
  saveStaticAchievementUnlocks,
  unlockEarnedStaticAchievements,
  type StaticAchievementId,
} from './achievements';

const characters = catalog as unknown as Character[];
const suggestions: PlayerSuggestion[] = characters.map((character) => ({
  id: character.id,
  nickname: character.name,
  localizedNames: character.names,
  searchTerms: [...character.aliases],
  difficulties: [...character.difficulties],
}));
setPlayerListSnapshot(suggestions);

function AchievementIcon({ id }: { id: StaticAchievementId }) {
  switch (id) {
    case 'firstGame': return <Sparkles size={20} />;
    case 'firstWin': return <Trophy size={20} />;
    case 'oneGuess': return <Crosshair size={20} />;
    case 'dailyWin': return <CalendarCheck2 size={20} />;
    case 'allDifficulties': return <Layers3 size={20} />;
    case 'threeWinStreak': return <Zap size={20} />;
    case 'tenGames': return <Award size={20} />;
    case 'twentyFiveWins': return <Medal size={20} />;
  }
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

function dateKey(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date());
}

function randomTarget(pool: Character[]): Character {
  return pool[Math.floor(Math.random() * pool.length)];
}

function createGameId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
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
        value: GENDER_CODES[String(guess.cells.gender.value)] ?? GENDER_CODES.unknown,
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
    majorChampionships: GENDER_CODES[character.gender] ?? GENDER_CODES.unknown,
    majorAppearances: character.debutYear,
    debutWork: character.debutWork,
    difficulties: [...character.difficulties],
  };
}

export function App() {
  const { t, i18n } = useTranslation();
  const confirm = useConfirm();
  const characterCounts = useDifficultyCharacterCounts();
  const [screen, setScreen] = useState<'lobby' | 'game' | 'stats' | 'achievements'>('lobby');
  const [mode, setMode] = useState<StaticGameMode>('free');
  const [difficulty, setDifficulty] = useState('normal');
  const [target, setTarget] = useState<Character>(() => dailyTarget(characters, 'normal', dateKey()));
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [showAnswer, setShowAnswer] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [gameId, setGameId] = useState(createGameId);
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());
  const [statsDifficulty, setStatsDifficulty] = useState('all');
  const [statsVersion, setStatsVersion] = useState(0);
  const [achievementUnlocks, setAchievementUnlocks] = useState(loadStaticAchievementUnlocks);
  const boardEndRef = useRef<HTMLDivElement>(null);
  const resumePromptedRef = useRef(false);

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
    const saved: StaticSavedGame = {
      gameId,
      targetId: target.id,
      guessIds: guesses.map((guess) => guess.character.id),
      status,
      startedAt,
      updatedAt: Date.now(),
    };
    localStorage.setItem(staticGameStorageKey(mode, difficulty), JSON.stringify(saved));
  }, [difficulty, gameId, guesses, mode, screen, startedAt, status, target.id]);

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

  const restoreSavedGame = (
    saved: StaticSavedGame,
    nextMode: StaticGameMode,
    nextDifficulty: string,
    key: string,
  ) => {
    const savedTarget = characters.find((character) => character.id === saved.targetId);
    if (!savedTarget) {
      localStorage.removeItem(key);
      return false;
    }
    const restored = saved.guessIds
      .map((id) => characters.find((character) => character.id === id))
      .filter((character): character is Character => Boolean(character))
      .map((character) => compare(character, savedTarget));
    setGameId(saved.gameId ?? `legacy-${key}-${saved.targetId}`);
    setStartedAt(saved.startedAt ?? new Date().toISOString());
    setMode(nextMode);
    setDifficulty(nextDifficulty);
    setTarget(savedTarget);
    setGuesses(restored);
    setStatus(saved.status);
    setShowAnswer(saved.status !== 'playing');
    setScreen('game');
    return true;
  };

  const begin = (reset = false) => {
    const key = staticGameStorageKey(mode, difficulty);
    if (!reset) {
      try {
        const saved = JSON.parse(localStorage.getItem(key) ?? 'null') as StaticSavedGame | null;
        if (saved && restoreSavedGame(saved, mode, difficulty, key)) return;
      } catch {
        localStorage.removeItem(key);
      }
    }
    localStorage.removeItem(key);
    setGameId(createGameId());
    setStartedAt(new Date().toISOString());
    setTarget(createTarget(mode, difficulty));
    setGuesses([]);
    setStatus('playing');
    setShowAnswer(false);
    setScreen('game');
  };

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      if (resumePromptedRef.current) return;
      resumePromptedRef.current = true;
      const unfinished = latestUnfinishedStaticGame();
      if (!unfinished) return;
      if (!characters.some((character) => character.id === unfinished.game.targetId)) {
        localStorage.removeItem(unfinished.key);
        return;
      }
      const savedMode = unfinished.mode === 'daily'
        ? t('home.dailyChallenge')
        : t('home.singleMode');
      void confirm({
        title: t('singleLobby.resumeTitle'),
        message: t('singleLobby.resumeMessage', {
          mode: savedMode,
          difficulty: difficultyLabel(t, unfinished.difficulty),
          count: unfinished.game.guessIds.length,
          max: MAX_GUESSES,
        }),
        confirmLabel: t('singleLobby.resumeConfirm'),
        cancelLabel: t('singleLobby.resumeCancel'),
        tone: 'warning',
      }).then((confirmed) => {
        if (!active) return;
        if (!confirmed) {
          localStorage.removeItem(unfinished.key);
          return;
        }
        restoreSavedGame(
          unfinished.game,
          unfinished.mode,
          unfinished.difficulty,
          unfinished.key,
        );
      });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [confirm, t]);

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
    settleGame('lost', guesses);
    setShowAnswer(true);
  };

  const settleGame = (nextStatus: 'won' | 'lost', finalGuesses: Guess[]) => {
    addStaticGameRecord({
      id: gameId,
      mode,
      difficulty,
      status: nextStatus,
      answerId: target.id,
      guessIds: finalGuesses.map((guess) => guess.character.id),
      finishedAt: new Date().toISOString(),
    });
    setStatsVersion((version) => version + 1);
    setStatus(nextStatus);
  };

  const submitGuess = (player: PlayerSuggestion) => {
    if (status !== 'playing' || guesses.some((guess) => guess.character.id === player.id)) return false;
    const character = characters.find((item) => item.id === player.id);
    if (!character) return false;
    const result = compare(character, target);
    const next = [...guesses, result];
    setGuesses(next);
    if (result.correct) {
      settleGame('won', next);
      setShowAnswer(true);
    } else if (next.length >= MAX_GUESSES) {
      settleGame('lost', next);
      setShowAnswer(true);
    }
    return true;
  };

  const staticCopy = i18n.language.startsWith('en')
    ? 'Static edition · Progress stays in this browser'
    : i18n.language.startsWith('ja')
      ? '静的版 · 進行状況はこのブラウザに保存されます'
      : '静态版 · 进度仅保存在当前浏览器';

  const records = useMemo(() => loadStaticGameRecords(), [statsVersion]);
  const visibleRecords = statsDifficulty === 'all'
    ? records
    : records.filter((record) => record.difficulty === statsDifficulty);
  const personalStats = summarizeStaticGameRecords(visibleRecords);
  const achievements = useMemo(
    () => getStaticAchievementProgress(records, achievementUnlocks),
    [achievementUnlocks, records],
  );
  const unlockedAchievementCount = achievements.filter((achievement) => achievement.unlocked).length;

  useEffect(() => {
    const next = unlockEarnedStaticAchievements(records, achievementUnlocks);
    if (next === achievementUnlocks) return;
    saveStaticAchievementUnlocks(next);
    setAchievementUnlocks(next);
  }, [achievementUnlocks, records]);

  const clearRecords = async () => {
    if (!await confirm({
      title: t('staticStats.clearTitle'),
      message: t('staticStats.clearMessage'),
      confirmLabel: t('staticStats.clearConfirm'),
      tone: 'danger',
    })) return;
    clearStaticGameRecords();
    setStatsVersion((version) => version + 1);
  };

  if (screen === 'achievements') {
    return (
      <Page
        title={t('staticAchievements.title')}
        icon={<Trophy size={17} />}
        showHome={false}
        actions={(
          <>
            <LanguageSelect />
            <button className="btn btn-ghost btn-sm" onClick={() => setScreen('lobby')}>
              <Home size={15} /><span className="btn-text">{t('common.home')}</span>
            </button>
          </>
        )}
        statusBar={<><WifiOff size={14} /><span>{t('staticStats.localOnly')}</span></>}
      >
        <div className="static-achievements-page">
          <section className="card static-achievements-card">
            <div className="static-achievements-heading">
              <h3><Trophy size={16} />{t('staticAchievements.title')}</h3>
              <span>{t('staticAchievements.summary', {
                unlocked: unlockedAchievementCount,
                total: achievements.length,
              })}</span>
            </div>
            <div className="static-achievements-grid">
              {achievements.map((achievement) => (
                <article
                  className={`static-achievement${achievement.unlocked ? ' unlocked' : ''}`}
                  key={achievement.id}
                >
                  <span className="static-achievement-icon" aria-hidden="true">
                    <AchievementIcon id={achievement.id} />
                  </span>
                  <span className="static-achievement-copy">
                    <strong>{t(`staticAchievements.items.${achievement.id}.title`)}</strong>
                    <small>{t(`staticAchievements.items.${achievement.id}.description`)}</small>
                    <span className="static-achievement-progress" aria-hidden="true">
                      <i style={{ width: `${achievement.current / achievement.target * 100}%` }} />
                    </span>
                  </span>
                  <span className="static-achievement-status">
                    {achievement.unlocked
                      ? t('staticAchievements.unlocked')
                      : t('staticAchievements.progress', {
                        current: achievement.current,
                        target: achievement.target,
                      })}
                  </span>
                </article>
              ))}
            </div>
          </section>
        </div>
      </Page>
    );
  }

  if (screen === 'stats') {
    const firstGuessCharacter = personalStats.firstGuess
      ? characters.find((character) => character.id === personalStats.firstGuess?.characterId)
      : null;
    return (
      <Page
        title={t('staticStats.title')}
        icon={<BarChart3 size={17} />}
        showHome={false}
        actions={(
          <>
            <LanguageSelect />
            <button className="btn btn-ghost btn-sm" onClick={() => setScreen('lobby')}>
              <Home size={15} /><span className="btn-text">{t('common.home')}</span>
            </button>
          </>
        )}
        statusBar={<><WifiOff size={14} /><span>{t('staticStats.localOnly')}</span></>}
      >
        <div className="stats-content static-stats-content">
          <div className="static-stats-toolbar" role="group" aria-label={t('stats.difficultyLevels')}>
            <button
              type="button"
              className={`btn btn-sm${statsDifficulty === 'all' ? '' : ' btn-ghost'}`}
              onClick={() => setStatsDifficulty('all')}
            >
              {t('stats.allDifficulties')}
            </button>
            {AVAILABLE_DIFFICULTIES.map((item) => (
              <button
                type="button"
                className={`btn btn-sm${statsDifficulty === item.key ? '' : ' btn-ghost'}`}
                key={item.key}
                onClick={() => setStatsDifficulty(item.key)}
              >
                {difficultyLabel(t, item.key)}
              </button>
            ))}
          </div>
          <div className="stats-overview-grid static-stats-overview">
            <section className="card">
              <h3><BarChart3 size={16} />{t('stats.personal')}</h3>
              <table className="table stats-summary-table"><tbody>
                <tr><td>{t('stats.singleGames')}</td><td className="stat-value">{personalStats.totalGames}</td></tr>
                <tr><td>{t('stats.singleWins')}</td><td className="stat-value">{personalStats.wins}</td></tr>
                <tr><td>{t('staticStats.losses')}</td><td className="stat-value">{personalStats.losses}</td></tr>
                <tr><td>{t('stats.singleWinRate')}</td><td className="stat-value">{(personalStats.winRate * 100).toFixed(1)}%</td></tr>
              </tbody></table>
            </section>
            <section className="card">
              <h3><Target size={16} />{t('staticStats.guessPerformance')}</h3>
              <table className="table stats-summary-table"><tbody>
                <tr><td>{t('stats.avgWinningGuesses')}</td><td className="stat-value">{personalStats.avgWinningGuesses?.toFixed(2) ?? '-'}</td></tr>
                <tr><td>{t('stats.bestGuess')}</td><td className="stat-value">{personalStats.bestGuesses ?? '-'}</td></tr>
                <tr><td>{t('stats.topFirstGuess')}</td><td className="stat-value">{firstGuessCharacter && personalStats.firstGuess ? `${firstGuessCharacter.name} ${(personalStats.firstGuess.percentage * 100).toFixed(1)}%` : '-'}</td></tr>
              </tbody></table>
            </section>
          </div>
          <section className="card stats-recent-card">
            <div className="stats-replay-toolbar">
              <h3>{t('staticStats.recentGames')}</h3>
              {records.length > 0 && (
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => void clearRecords()}>
                  <Trash2 size={14} />{t('staticStats.clear')}
                </button>
              )}
            </div>
            {visibleRecords.length ? (
              <div className="stats-recent-table">
                <table className="table">
                  <thead><tr>
                    <th>{t('stats.mode')}</th><th>{t('stats.result')}</th><th>{t('stats.guesses')}</th><th>{t('stats.answer')}</th><th>{t('stats.time')}</th>
                  </tr></thead>
                  <tbody>{visibleRecords.map((record) => {
                    const answer = characters.find((character) => character.id === record.answerId);
                    return (
                      <tr key={record.id}>
                        <td>{record.mode === 'daily' ? t('home.dailyChallenge') : t('home.singleMode')} · {difficultyLabel(t, record.difficulty)}</td>
                        <td><Badge text={record.status === 'won' ? t('common.win') : t('common.loss')} color={record.status === 'won' ? 'green' : 'gray'} /></td>
                        <td>{record.guessIds.length}</td>
                        <td>{answer?.name ?? '-'}</td>
                        <td>{new Date(record.finishedAt).toLocaleString(i18n.language)}</td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>
            ) : <p className="muted static-stats-empty">{t('staticStats.noRecords')}</p>}
          </section>
        </div>
      </Page>
    );
  }

  if (screen === 'lobby') {
    return (
      <Page
        className="static-lobby-page"
        title={t('singleLobby.title')}
        icon={<Gamepad2 size={17} />}
        showHome={false}
        actions={<LanguageSelect />}
        statusBar={<><WifiOff size={14} /><span>{staticCopy}</span></>}
      >
        <section className="static-launch-panel">
          <span className="static-launch-code" aria-hidden="true">IDENTITY // {characters.length}</span>
          <div className="single-lobby-mode-actions">
            <button
              className={`btn${mode === 'free' ? '' : ' btn-ghost'}`}
              aria-pressed={mode === 'free'}
              onClick={() => setMode('free')}
            >
              <Gamepad2 size={16} />{t('home.singleMode')}
            </button>
            <button
              className={`btn${mode === 'daily' ? '' : ' btn-ghost'}`}
              aria-pressed={mode === 'daily'}
              onClick={() => setMode('daily')}
            >
              <CalendarDays size={16} />{t('home.dailyChallenge')}
            </button>
          </div>
          <div className="toaru-title-mark">
            <img
              src={`${import.meta.env.BASE_URL}toaru-character-title.webp`}
              alt={t('common.brand')}
              width={1100}
              height={622}
              loading="eager"
              decoding="async"
            />
          </div>
          <p className="muted single-lobby-subtitle">{t('singleLobby.subtitle')}</p>
          <div className="single-difficulty-grid">
            {AVAILABLE_DIFFICULTIES.map((item, index) => {
              const active = difficulty === item.key;
              const Icon = difficultyIcon(item.key);
              return (
                <button
                  type="button"
                  key={item.key}
                  className={`single-difficulty-option${active ? ' active' : ''}`}
                  style={{ ['--diff-color' as string]: difficultyColor(item.key) }}
                  aria-pressed={active}
                  onClick={() => setDifficulty(item.key)}
                >
                  <span className="single-difficulty-index" aria-hidden="true">0{index + 1}</span>
                  <span className="single-difficulty-icon"><Icon size={20} /></span>
                  <span className="single-difficulty-copy">
                    <strong>{difficultyLabel(t, item.key)}</strong>
                    <small>{difficultyDescription(t, item.key)}</small>
                    <small className="single-difficulty-count">
                      {characterCounts
                        ? t('singleLobby.characterCount', { count: characterCounts[item.key] ?? 0 })
                        : t('singleLobby.characterCountLoading')}
                    </small>
                  </span>
                  <span className="single-difficulty-check" aria-hidden="true">{active && <Check size={17} />}</span>
                  {item.recommended && <span className="single-difficulty-badge">{t('singleLobby.recommended')}</span>}
                </button>
              );
            })}
          </div>
          <div className="single-lobby-action">
            <button className="btn btn-lg static-start-button" onClick={() => begin(false)}>
              <Play size={17} /> {t('singleLobby.start')}
            </button>
          </div>
        </section>
        <GameRules />
        <div className="bottom-bar">
          <button className="btn" type="button" onClick={() => setScreen('achievements')}>
            <Trophy size={16} aria-hidden="true" />
            {t('staticAchievements.title')}
          </button>
          <button className="btn" type="button" onClick={() => setScreen('stats')}>
            <BarChart3 size={16} aria-hidden="true" />
            {t('staticStats.title')}
          </button>
          <a
            href="https://github.com/UCCPR/ToaruCharacterGuess"
            className="btn btn-github"
            target="_blank"
            rel="noopener noreferrer"
            data-umami-event="static-home-github"
          >
            <GitHubIcon />
            {t('home.github')}
          </a>
        </div>
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
