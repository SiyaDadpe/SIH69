import React from 'react';

export default function LinearCircularSummary({ selectedProject }) {
    if (!selectedProject) {
        return (
            <div className="text-center py-12 text-gray-500">
                Select a project to view linear vs circular summary
            </div>
        );
    }

    const circularityIndex = selectedProject.circularityIndex ?? 0;
    const linearityIndex = selectedProject.linearityIndex ?? (circularityIndex ? 1 - circularityIndex : 0);

    const totalGWP = selectedProject.totalGWP || 0;
    const gwpLinear = totalGWP;
    const gwpCircular = gwpLinear * (1 - circularityIndex);
    const gwpReduction = gwpLinear > 0 ? ((gwpLinear - gwpCircular) / gwpLinear) * 100 : 0;

    const totalEnergy = selectedProject.totalEnergy || 0;
    const energyLinear = totalEnergy;
    const energyCircular = energyLinear * (1 - circularityIndex * 0.5);
    const energyReduction = energyLinear > 0 ? ((energyLinear - energyCircular) / energyLinear) * 100 : 0;

    const totalWater = selectedProject.totalWater || 0;
    const waterLinear = totalWater;
    const waterCircular = waterLinear * (1 - circularityIndex * 0.4);
    const waterReduction = waterLinear > 0 ? ((waterLinear - waterCircular) / waterLinear) * 100 : 0;

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Linear vs Circular Summary</h2>
                <p className="text-sm text-gray-600 mb-4">
                    Comparison of key impact indicators between a baseline linear pathway and the current circularity level for this project.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border border-gray-100 rounded-lg p-4">
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Circularity</div>
                        <div className="text-2xl font-bold text-[#BA7967] mb-1">
                            {(circularityIndex * 100).toFixed(1)}% circular
                        </div>
                        <p className="text-xs text-gray-500 mb-2">
                            Linearity: {(linearityIndex * 100).toFixed(1)}%
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="h-2 rounded-full bg-green-500"
                                style={{ width: `${Math.min(100, Math.max(0, circularityIndex * 100))}%` }}
                            />
                        </div>
                    </div>

                    <div className="border border-gray-100 rounded-lg p-4">
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-1">GWP (CO₂e)</div>
                        <div className="text-sm text-gray-700 mb-1 flex justify-between">
                            <span>Linear:</span>
                            <span>{(gwpLinear / 1000).toFixed(2)}k kg</span>
                        </div>
                        <div className="text-sm text-gray-700 mb-1 flex justify-between">
                            <span>Circular:</span>
                            <span>{(gwpCircular / 1000).toFixed(2)}k kg</span>
                        </div>
                        <div className="text-xs text-green-700 mt-1">
                            ≈ {gwpReduction.toFixed(1)}% reduction
                        </div>
                    </div>

                    <div className="border border-gray-100 rounded-lg p-4">
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Energy & Water</div>
                        <div className="text-xs text-gray-700 mb-1 flex justify-between">
                            <span>Energy linear:</span>
                            <span>{(energyLinear / 1000).toFixed(1)}k</span>
                        </div>
                        <div className="text-xs text-gray-700 mb-1 flex justify-between">
                            <span>Energy circular:</span>
                            <span>{(energyCircular / 1000).toFixed(1)}k</span>
                        </div>
                        <div className="text-xs text-green-700 mb-2">
                            ≈ {energyReduction.toFixed(1)}% lower energy
                        </div>
                        <div className="text-xs text-gray-700 mb-1 flex justify-between">
                            <span>Water linear:</span>
                            <span>{waterLinear.toFixed(2)} m³</span>
                        </div>
                        <div className="text-xs text-gray-700 mb-1 flex justify-between">
                            <span>Water circular:</span>
                            <span>{waterCircular.toFixed(2)} m³</span>
                        </div>
                        <div className="text-xs text-green-700">
                            ≈ {waterReduction.toFixed(1)}% lower water
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-[#FAF7F6] rounded-lg border border-[#BA7967]/20 p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Narrative Summary</h3>
                <p className="text-sm text-gray-700">
                    With a circularity index of {(circularityIndex * 100).toFixed(1)}%, this project replaces a
                    portion of linear material flows with circular pathways. At this level of circularity, we estimate
                    around {gwpReduction.toFixed(1)}% lower greenhouse gas emissions and {energyReduction.toFixed(1)}%
                    lower energy use compared to a purely linear baseline, with additional reductions in water
                    consumption.
                </p>
            </div>
        </div>
    );
}
