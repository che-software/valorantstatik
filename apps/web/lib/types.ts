export interface PlayerAccount {
  puuid: string;
  name: string;
  tag: string;
  level: number;
  region: string;
  card: { small: string; large: string; wide: string };
}

export interface RankData {
  currenttier: number;
  currenttierpatched: string;
  ranking_in_tier: number;
  mmr_change_to_last_game: number;
  elo: number;
  images: { small: string; large: string };
}

export interface MatchPlayerStats {
  score: number;
  kills: number;
  deaths: number;
  assists: number;
  bodyshots: number;
  headshots: number;
  legshots: number;
}

export interface MatchPlayer {
  puuid: string;
  name: string;
  tag: string;
  team: string;
  character: string;
  currenttier: number;
  currenttier_patched: string;
  stats: MatchPlayerStats;
  assets: {
    agent: { small: string; full: string; bust: string; killfeed: string };
  };
  damage_made: number;
  damage_received: number;
}

export interface MatchTeam {
  has_won: boolean;
  rounds_won: number;
  rounds_lost: number;
}

export interface Match {
  metadata: {
    matchid: string;
    map: string;
    game_length: number;
    game_start: number;
    mode: string;
    region: string;
  };
  players: {
    all_players: MatchPlayer[];
    red: MatchPlayer[];
    blue: MatchPlayer[];
  };
  teams: {
    red: MatchTeam;
    blue: MatchTeam;
  };
}
