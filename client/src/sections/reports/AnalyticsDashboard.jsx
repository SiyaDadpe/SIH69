import React, { useMemo } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import {
    ResponsiveContainer,
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    CartesianGrid,
    XAxis,
    YAxis,
    Legend,
} from 'recharts';

const CATEGORY_COLORS = ['#BA7967', '#38788C', '#5C594F', '#D9B26F', '#8F9E6B', '#6C4A7D'];

const toTitleCase = (value) =>
	String(value || 'Other')
		.replace(/[_-]+/g, ' ')
		.replace(/\b\w/g, (char) => char.toUpperCase());

const formatNumber = (value, fractionDigits = 1) => {
	if (!Number.isFinite(value)) {
		return '—';
	}
	return value.toLocaleString('en-IN', { maximumFractionDigits: fractionDigits });
};

const formatMonthLabel = (input) => {
	if (!input) {
		return '—';
	}
	const [year, month] = input.split('-');
	const date = new Date(Number(year), Number(month) - 1, 1);
	if (Number.isNaN(date.getTime())) {
		return input;
	}
	return date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
};

const AnalyticsDashboard = ({ reports }) => {
	// Always use the passed-in reports prop (from backend), never fallback to static data
	const dataset = useMemo(() => (Array.isArray(reports) ? reports : []), [reports]);

	const {
		totalReports,
		averageCircularity,
		totalSavings,
		categoryDistribution,
		trendSeries,
		impactBreakdown,
		intensityAverages,
		scoreInsights,
	} = useMemo(() => {
		// Aggregate report-level metrics for the dashboard visualisations.
		const totalReports = dataset.length;
		let scoreSum = 0;
		let scoreCount = 0;
		let totalSavings = 0;
		let energyTotal = 0;
		let waterTotal = 0;
		let gwpTotal = 0;

		const categoryMap = new Map();
		const monthMap = new Map();
		const scoreValues = [];
		const scoreIndex = [];

		dataset.forEach((report) => {
			const score = Number(report?.summary?.circularityScore);
			if (Number.isFinite(score)) {
				scoreSum += score;
				scoreCount += 1;
				scoreValues.push(score);
				scoreIndex.push({
					id: report?.id || String(scoreIndex.length + 1),
					name: report?.name || `Report ${scoreIndex.length + 1}`,
					score,
				});
			}

			const categoryKey = toTitleCase(report?.category || report?.status || 'Other');
			categoryMap.set(categoryKey, (categoryMap.get(categoryKey) || 0) + 1);

			const updatedAt = report?.updatedAt || report?.createdAt;
			if (updatedAt) {
				const timestamp = new Date(updatedAt);
				if (!Number.isNaN(timestamp.getTime())) {
					const monthKey = `${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}`;
					if (!monthMap.has(monthKey)) {
						monthMap.set(monthKey, { total: 0, count: 0 });
					}
					if (Number.isFinite(score)) {
						const entry = monthMap.get(monthKey);
						entry.total += score;
						entry.count += 1;
					}
				}
			}

			const savings = Array.isArray(report?.rawData?.energySavingsStack)
				? report.rawData.energySavingsStack.reduce(
					  (acc, item) => acc + (Number(item?.value) || 0),
					  0
				  )
				: 0;
			totalSavings += savings;

			const energyDemand = Number(report?.summary?.energyDemand);
			if (Number.isFinite(energyDemand)) {
				energyTotal += energyDemand;
			}

			const waterConsumption = Number(report?.summary?.waterConsumption);
			if (Number.isFinite(waterConsumption)) {
				waterTotal += waterConsumption;
			}

			const gwp = Number(report?.summary?.gwp);
			if (Number.isFinite(gwp)) {
				gwpTotal += gwp;
			}
		});

		const categoryDistribution = Array.from(categoryMap.entries()).map(([name, value], index) => ({
			name,
			value,
			color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
		}));

		const trendSeries = Array.from(monthMap.entries())
			.map(([monthKey, entry]) => ({
				monthKey,
				label: formatMonthLabel(monthKey),
				score: entry.count > 0 ? entry.total / entry.count : 0,
			}))
			.sort((a, b) => (a.monthKey > b.monthKey ? 1 : -1));

		const impactBreakdown = [
			{ name: 'Energy demand', value: energyTotal },
			{ name: 'Water use', value: waterTotal },
			{ name: 'GWP', value: gwpTotal },
		].filter((item) => Number.isFinite(item.value) && item.value > 0);

		const averageCircularity = scoreCount > 0 ? scoreSum / scoreCount : 0;

		const scoreMean = averageCircularity;
		const scoreVariance = scoreValues.length > 1
			? scoreValues.reduce((acc, value) => acc + (value - scoreMean) ** 2, 0) / scoreValues.length
			: 0;
		const scoreStdDev = Math.sqrt(scoreVariance);
		const anomalies =
			scoreStdDev > 0
				? scoreIndex.filter((entry) => Math.abs((entry.score - scoreMean) / scoreStdDev) >= 2)
				: [];

		return {
			totalReports,
			averageCircularity,
			totalSavings,
			categoryDistribution,
			trendSeries,
			impactBreakdown,
			intensityAverages: {
				energy: totalReports > 0 ? energyTotal / totalReports : 0,
				water: totalReports > 0 ? waterTotal / totalReports : 0,
				gwp: totalReports > 0 ? gwpTotal / totalReports : 0,
			},
			scoreInsights: {
				standardDeviation: scoreStdDev,
				anomalies,
			},
		};
	}, [dataset]);

	const trendSummary = useMemo(() => {
		if (trendSeries.length < 2) {
			return 'Not enough history to evaluate the circularity trend.';
		}
		const first = trendSeries[0]?.score ?? 0;
		const last = trendSeries[trendSeries.length - 1]?.score ?? 0;
		const delta = last - first;
		if (Math.abs(delta) < 0.5) {
			return 'Circularity scores have remained relatively stable over the observed period.';
		}
		if (delta > 0) {
			return `Circularity is trending upward by ${formatNumber(delta, 1)} points since the first observation.`;
		}
		return `Circularity dipped by ${formatNumber(Math.abs(delta), 1)} points compared to the first observation.`;
	}, [trendSeries]);

	const industryBenchmarks = useMemo(
		() => [
			{ label: 'Industry circularity benchmark', value: 74 },
			{ label: 'Energy demand baseline (kWh/t)', value: 820 },
			{ label: 'Water consumption baseline (m³)', value: 120 },
		],
		[]
	);

	const opportunities = useMemo(() => {
		const items = [];
		if (Number.isFinite(averageCircularity) && averageCircularity < 70) {
			items.push('Circularity score is below the industry benchmark. Explore material recovery and reuse loops.');
		}
		if (Number.isFinite(intensityAverages.energy) && intensityAverages.energy > 900) {
			items.push('Energy intensity exceeds recommended thresholds. Consider heat recovery or process optimization.');
		}
		if (Number.isFinite(intensityAverages.water) && intensityAverages.water > 140) {
			items.push('Water consumption is elevated. Investigate closed-loop water systems or recycling steps.');
		}
		if (items.length === 0) {
			items.push('No immediate optimisation alerts. Continue monitoring for incremental improvements.');
		}
		return items;
	}, [averageCircularity, intensityAverages.energy, intensityAverages.water]);

	const anomalySummary = useMemo(() => {
		if (!scoreInsights.anomalies || scoreInsights.anomalies.length === 0) {
			return [];
		}
		return scoreInsights.anomalies.map((item) => `${item.name} (${formatNumber(item.score, 1)}%)`);
	}, [scoreInsights.anomalies]);

	return (
		<div className="space-y-4">
			<Card className="border-[#E6E1D7] bg-white">
				<CardHeader className="gap-2">
					<CardTitle className="flex items-center justify-between text-[#181814]">
						Analytics Overview
						<Badge variant="outline" className="border-[#BA7967]/40 text-[#6b5b59]">
							{new Date().toLocaleDateString('en-IN')}
						</Badge>
					</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-3 text-sm text-[#3d3635] sm:grid-cols-3">
					<div className="rounded-lg border border-[#BA7967]/30 bg-[#F8F6F2] p-4">
						<p className="text-xs font-semibold uppercase tracking-wide text-[#6b5b59]">Total reports</p>
						<p className="mt-2 text-2xl font-semibold text-[#181814]">{totalReports}</p>
					</div>
					<div className="rounded-lg border border-[#BA7967]/30 bg-[#F8F6F2] p-4">
						<p className="text-xs font-semibold uppercase tracking-wide text-[#6b5b59]">Avg. circularity</p>
						<p className="mt-2 text-2xl font-semibold text-[#181814]">
							{formatNumber(averageCircularity)}%
						</p>
					</div>
					<div className="rounded-lg border border-[#BA7967]/30 bg-[#F8F6F2] p-4">
						<p className="text-xs font-semibold uppercase tracking-wide text-[#6b5b59]">CO2 savings (kt)</p>
						<p className="mt-2 text-2xl font-semibold text-[#181814]">
							{formatNumber(totalSavings, 2)}
						</p>
					</div>
				</CardContent>
			</Card>

			<Card className="border-[#E6E1D7] bg-white">
				<CardHeader>
					<CardTitle className="text-[#181814]">Circularity Trend</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3 text-sm text-[#6b5b59]">
					<p>Average circularity score by month for the visible reports.</p>
					<div className="h-48">
						{trendSeries.length > 0 ? (
							<ResponsiveContainer>
								<LineChart data={trendSeries}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="label" tick={{ fill: '#6b5b59', fontSize: 11 }} />
									<YAxis domain={[0, 100]} tick={{ fill: '#6b5b59', fontSize: 11 }} />
									<Tooltip cursor={{ stroke: '#BA7967' }} />
									<Line
										type="monotone"
										dataKey="score"
										stroke="#BA7967"
										strokeWidth={2}
										dot={{ r: 3 }}
									/>
								</LineChart>
							</ResponsiveContainer>
						) : (
							<div className="grid h-full place-items-center rounded-lg border border-dashed border-[#BA7967]/30 text-xs text-[#6b5b59]">
								Trend data becomes available once reports are updated over time.
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			<Card className="border-[#E6E1D7] bg-white">
				<CardHeader>
					<CardTitle className="text-[#181814]">Category Distribution</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3 text-sm text-[#6b5b59]">
					<p>Share of reports by lifecycle category.</p>
					<div className="h-56">
						{categoryDistribution.length > 0 ? (
							<ResponsiveContainer>
								<PieChart>
									<Pie
										data={categoryDistribution}
										dataKey="value"
										nameKey="name"
										innerRadius={50}
										outerRadius={80}
										paddingAngle={4}
									>
										{categoryDistribution.map((entry) => (
											<Cell key={entry.name} fill={entry.color} />
										))}
									</Pie>
									<Tooltip />
									<Legend layout="horizontal" verticalAlign="bottom" height={32} />
								</PieChart>
							</ResponsiveContainer>
						) : (
							<div className="grid h-full place-items-center rounded-lg border border-dashed border-[#BA7967]/30 text-xs text-[#6b5b59]">
								Add reports to view category distribution.
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			<Card className="border-[#E6E1D7] bg-white">
				<CardHeader>
					<CardTitle className="text-[#181814]">Impact Breakdown</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3 text-sm text-[#6b5b59]">
					<p>Aggregated intensity metrics from the current selection.</p>
					<div className="h-48">
						{impactBreakdown.length > 0 ? (
							<ResponsiveContainer>
								<BarChart data={impactBreakdown}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="name" tick={{ fill: '#6b5b59', fontSize: 11 }} />
									<YAxis tick={{ fill: '#6b5b59', fontSize: 11 }} />
									<Tooltip cursor={{ fill: 'rgba(186, 121, 103, 0.08)' }} />
									<Bar dataKey="value" fill="#38788C" radius={[6, 6, 0, 0]} />
								</BarChart>
							</ResponsiveContainer>
						) : (
							<div className="grid h-full place-items-center rounded-lg border border-dashed border-[#BA7967]/30 text-xs text-[#6b5b59]">
								Impact metrics appear when energy or water data is available.
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			<Card className="border-[#E6E1D7] bg-white">
				<CardHeader>
					<CardTitle className="text-[#181814]">AI Insights</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4 text-sm text-[#3d3635]">
					<div className="space-y-2">
						<p className="text-xs font-semibold uppercase tracking-wide text-[#6b5b59]">Trend analysis</p>
						<p>{trendSummary}</p>
					</div>

					<div className="space-y-2">
						<p className="text-xs font-semibold uppercase tracking-wide text-[#6b5b59]">Benchmarks</p>
						<ul className="space-y-1">
							{industryBenchmarks.map((item) => (
								<li key={item.label} className="flex items-center justify-between rounded-lg bg-[#F8F6F2] px-3 py-2">
									<span>{item.label}</span>
									<span className="font-medium text-[#181814]">{formatNumber(item.value, 0)}</span>
								</li>
							))}
						</ul>
					</div>

					<div className="space-y-2">
						<p className="text-xs font-semibold uppercase tracking-wide text-[#6b5b59]">Opportunities</p>
						<ul className="list-disc space-y-1 pl-6">
							{opportunities.map((item, index) => (
								<li key={index}>{item}</li>
							))}
						</ul>
					</div>

					<div className="space-y-2">
						<p className="text-xs font-semibold uppercase tracking-wide text-[#6b5b59]">
							Anomaly detection
						</p>
						{anomalySummary.length > 0 ? (
							<ul className="list-disc space-y-1 pl-6">
								{anomalySummary.map((anomaly, index) => (
									<li key={index}>{anomaly}</li>
								))}
							</ul>
						) : (
							<p>No circularity outliers detected (±2σ threshold).</p>
						)}
						<p className="text-xs text-[#6b5b59]">
							Score standard deviation: {formatNumber(scoreInsights.standardDeviation, 2)}
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default AnalyticsDashboard;
