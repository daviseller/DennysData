// NBA Team Colors - Official hex codes
// Source: https://nbacolors.com/
// Used for accents on game cards and team-specific styling

export interface TeamColors {
	primary: string;
	secondary: string;
	tertiary?: string;
}

export const teamColors: Record<string, TeamColors> = {
	// Atlantic Division
	BOS: { primary: '#007A33', secondary: '#BA9653', tertiary: '#963821' }, // Boston Celtics
	BKN: { primary: '#000000', secondary: '#FFFFFF' }, // Brooklyn Nets
	NYK: { primary: '#006BB6', secondary: '#F58426' }, // New York Knicks
	PHI: { primary: '#006BB6', secondary: '#ED174C' }, // Philadelphia 76ers
	TOR: { primary: '#CE1141', secondary: '#000000' }, // Toronto Raptors

	// Central Division
	CHI: { primary: '#CE1141', secondary: '#000000' }, // Chicago Bulls
	CLE: { primary: '#860038', secondary: '#041E42', tertiary: '#FDBB30' }, // Cleveland Cavaliers
	DET: { primary: '#C8102E', secondary: '#1D42BA', tertiary: '#BEC0C2' }, // Detroit Pistons
	IND: { primary: '#002D62', secondary: '#FDBB30' }, // Indiana Pacers
	MIL: { primary: '#00471B', secondary: '#EEE1C6', tertiary: '#0077C0' }, // Milwaukee Bucks

	// Southeast Division
	ATL: { primary: '#E03A3E', secondary: '#C1D32F', tertiary: '#26282A' }, // Atlanta Hawks
	CHA: { primary: '#1D1160', secondary: '#00788C', tertiary: '#A1A1A4' }, // Charlotte Hornets
	MIA: { primary: '#98002E', secondary: '#F9A01B', tertiary: '#000000' }, // Miami Heat
	ORL: { primary: '#0077C0', secondary: '#C4CED4', tertiary: '#000000' }, // Orlando Magic
	WAS: { primary: '#002B5C', secondary: '#E31837', tertiary: '#C4CED4' }, // Washington Wizards

	// Northwest Division
	DEN: { primary: '#0E2240', secondary: '#FEC524', tertiary: '#8B2131' }, // Denver Nuggets
	MIN: { primary: '#0C2340', secondary: '#236192', tertiary: '#9EA2A2' }, // Minnesota Timberwolves
	OKC: { primary: '#007AC1', secondary: '#EF3B24', tertiary: '#002D62' }, // Oklahoma City Thunder
	POR: { primary: '#E03A3E', secondary: '#000000' }, // Portland Trail Blazers
	UTA: { primary: '#002B5C', secondary: '#00471B', tertiary: '#F9A01B' }, // Utah Jazz

	// Pacific Division
	GSW: { primary: '#1D428A', secondary: '#FFC72C' }, // Golden State Warriors
	LAC: { primary: '#C8102E', secondary: '#1D428A', tertiary: '#BEC0C2' }, // LA Clippers
	LAL: { primary: '#552583', secondary: '#F9A01B', tertiary: '#000000' }, // Los Angeles Lakers
	PHX: { primary: '#1D1160', secondary: '#E56020', tertiary: '#000000' }, // Phoenix Suns
	SAC: { primary: '#5A2D81', secondary: '#63727A', tertiary: '#000000' }, // Sacramento Kings

	// Southwest Division
	DAL: { primary: '#00538C', secondary: '#002B5E', tertiary: '#B8C4CA' }, // Dallas Mavericks
	HOU: { primary: '#CE1141', secondary: '#000000', tertiary: '#C4CED4' }, // Houston Rockets
	MEM: { primary: '#5D76A9', secondary: '#12173F', tertiary: '#F5B112' }, // Memphis Grizzlies
	NOP: { primary: '#0C2340', secondary: '#C8102E', tertiary: '#85714D' }, // New Orleans Pelicans
	SAS: { primary: '#C4CED4', secondary: '#000000' } // San Antonio Spurs
};

/**
 * Get colors for a team by abbreviation
 * Returns default colors if team not found
 */
export function getTeamColors(abbreviation: string): TeamColors {
	return (
		teamColors[abbreviation] || {
			primary: '#6B7280',
			secondary: '#374151'
		}
	);
}

/**
 * Get CSS custom properties for a team
 * Useful for inline styles or dynamic theming
 */
export function getTeamColorVars(abbreviation: string): string {
	const colors = getTeamColors(abbreviation);
	let vars = `--team-primary: ${colors.primary}; --team-secondary: ${colors.secondary};`;
	if (colors.tertiary) {
		vars += ` --team-tertiary: ${colors.tertiary};`;
	}
	return vars;
}
