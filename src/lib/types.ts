// balldontlie.io API Types

export interface Team {
	id: number;
	conference: string;
	division: string;
	city: string;
	name: string;
	full_name: string;
	abbreviation: string;
}

export interface Player {
	id: number;
	first_name: string;
	last_name: string;
	position: string;
	height: string | null;
	weight: string | null;
	jersey_number: string | null;
	college: string | null;
	country: string | null;
	draft_year: number | null;
	draft_round: number | null;
	draft_number: number | null;
	team: Team;
}

export interface Game {
	id: number;
	date: string;
	season: number;
	status: string;
	period: number;
	time: string;
	postseason: boolean;
	home_team: Team;
	home_team_score: number;
	visitor_team: Team;
	visitor_team_score: number;
}

export interface PlayerStats {
	id: number;
	min: string;
	fgm: number;
	fga: number;
	fg_pct: number;
	fg3m: number;
	fg3a: number;
	fg3_pct: number;
	ftm: number;
	fta: number;
	ft_pct: number;
	oreb: number;
	dreb: number;
	reb: number;
	ast: number;
	stl: number;
	blk: number;
	turnover: number;
	pf: number;
	pts: number;
	player: Player;
	team: Team;
	game: Game;
}

export interface BoxScore {
	game: Game;
	home_team: TeamBoxScore;
	visitor_team: TeamBoxScore;
}

export interface TeamBoxScore {
	team: Team;
	players: PlayerStats[];
	totals: TeamTotals;
}

export interface TeamTotals {
	min: string;
	fgm: number;
	fga: number;
	fg_pct: number;
	fg3m: number;
	fg3a: number;
	fg3_pct: number;
	ftm: number;
	fta: number;
	ft_pct: number;
	oreb: number;
	dreb: number;
	reb: number;
	ast: number;
	stl: number;
	blk: number;
	turnover: number;
	pf: number;
	pts: number;
}

// Standings types
export interface TeamStanding {
	team: Team;
	conference: string;
	conference_rank: number;
	division: string;
	division_rank: number;
	wins: number;
	losses: number;
	home_wins: number;
	home_losses: number;
	road_wins: number;
	road_losses: number;
	last_ten_wins: number;
	last_ten_losses: number;
	season: number;
}

export interface StandingsResponse {
	data: TeamStanding[];
}

// Map of team abbreviation to their record and conference rank
export type StandingsMap = Record<string, {
	wins: number;
	losses: number;
	conference: string;
	conference_rank: number;
}>;

// API Response wrappers
export interface GamesResponse {
	data: Game[];
	meta: PaginationMeta;
}

export interface StatsResponse {
	data: PlayerStats[];
	meta: PaginationMeta;
}

export interface PaginationMeta {
	next_cursor: number | null;
	per_page: number;
}

// Client-side types
export interface ApiError {
	message: string;
	status: number;
}

export type ApiResult<T> = { data: T; error: null } | { data: null; error: ApiError };
