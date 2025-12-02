/**
 * WorkflowPredictionPanel Component
 * Displays real-time workflow predictions
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Zap, Droplet, Loader2, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WorkflowPredictionPanel = ({ predictions, isLoading, error, lastUpdate, onRefresh }) => {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState('total'); // 'total', 'stages', 'processes'
  
  if (!predictions && !isLoading && !error) {
    return null;
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute bottom-4 right-4 z-10 w-96"
    >
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-[#BA7967] to-[#3d3635] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            <h3 className="font-semibold">Workflow Predictions</h3>
          </div>
          
          <div className="flex items-center gap-2">
            {lastUpdate && (
              <span className="text-xs opacity-75">
                {new Date(lastUpdate).toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              {/* Loading State */}
              {isLoading && (
                <div className="p-6 flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 text-[#BA7967] animate-spin mb-3" />
                  <p className="text-sm text-gray-600">Calculating predictions...</p>
                </div>
              )}
              
              {/* Error State */}
              {error && !isLoading && (
                <div className="p-6">
                  <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-900 mb-1">Calculation Failed</p>
                      <p className="text-xs text-red-700">{error}</p>
                      <Button
                        size="sm"
                        onClick={onRefresh}
                        className="mt-2 bg-red-600 hover:bg-red-700 text-white"
                      >
                        Retry
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Success State */}
              {predictions && !isLoading && (
                <div className="p-4">
                  {/* Tabs */}
                  <div className="flex gap-2 mb-4 border-b border-gray-200">
                    {['total', 'stages', 'processes'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`
                          px-3 py-2 text-sm font-medium transition-colors border-b-2
                          ${activeTab === tab
                            ? 'border-[#BA7967] text-[#BA7967]'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                          }
                        `}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>
                  
                  {/* Total Tab */}
                  {activeTab === 'total' && (
                    <div className="space-y-3">
                      {/* GWP */}
                      <div className="p-3 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border border-orange-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-orange-600" />
                            <span className="text-sm font-semibold text-gray-900">Global Warming Potential</span>
                          </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-gray-900">{predictions.total.gwp}</span>
                          <span className="text-sm text-gray-600">{predictions.total.unit_gwp}</span>
                        </div>
                      </div>
                      
                      {/* Energy */}
                      <div className="p-3 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-yellow-600" />
                            <span className="text-sm font-semibold text-gray-900">Energy Consumption</span>
                          </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-gray-900">{predictions.total.energyConsumption}</span>
                          <span className="text-sm text-gray-600">{predictions.total.unit_energy}</span>
                        </div>
                      </div>
                      
                      {/* Water */}
                      <div className="p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Droplet className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-semibold text-gray-900">Water Usage</span>
                          </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-gray-900">{predictions.total.waterUsage}</span>
                          <span className="text-sm text-gray-600">{predictions.total.unit_water}</span>
                        </div>
                      </div>
                      
                      {/* Efficiency */}
                      <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-semibold text-gray-900">Workflow Efficiency</span>
                          </div>
                          <span className="text-xl font-bold text-green-700">{predictions.workflowEfficiency}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Stages Tab */}
                  {activeTab === 'stages' && predictions.stageBreakdown && (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {predictions.stageBreakdown.map((stage, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2 capitalize">
                            {stage.stage.replace(/_/g, ' ')}
                          </h4>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <span className="text-gray-500">GWP:</span>
                              <span className="ml-1 font-semibold text-gray-900">{stage.gwp}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Energy:</span>
                              <span className="ml-1 font-semibold text-gray-900">{stage.energyConsumption}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Water:</span>
                              <span className="ml-1 font-semibold text-gray-900">{stage.waterUsage}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Processes Tab */}
                  {activeTab === 'processes' && predictions.processBreakdown && (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {predictions.processBreakdown.map((process, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-900 mb-1">
                            {process.processName}
                          </h4>
                          <p className="text-xs text-gray-500 mb-2 capitalize">
                            {process.stage.replace(/_/g, ' ')}
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-gray-500">GWP:</span>
                              <span className="ml-1 font-semibold text-gray-900">{process.gwp}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Confidence:</span>
                              <span className="ml-1 font-semibold text-green-600">{process.confidence}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Recommendations */}
                  {predictions.recommendations && predictions.recommendations.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-xs font-semibold text-gray-700 mb-2">Recommendations</h4>
                      <div className="space-y-2">
                        {predictions.recommendations.slice(0, 2).map((rec, index) => (
                          <div
                            key={index}
                            className={`p-2 rounded text-xs ${
                              rec.type === 'warning' ? 'bg-amber-50 text-amber-900 border border-amber-200' :
                              rec.type === 'success' ? 'bg-green-50 text-green-900 border border-green-200' :
                              'bg-blue-50 text-blue-900 border border-blue-200'
                            }`}
                          >
                            {rec.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default WorkflowPredictionPanel;
