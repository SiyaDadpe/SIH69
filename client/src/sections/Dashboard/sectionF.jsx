import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle2, TrendingUp, Award, BarChart3 } from 'lucide-react';

const SectionF = ({ benchmarks, summary }) => {
  const [animatedUserScore, setAnimatedUserScore] = useState(0);
  const [animatedIndustryScore, setAnimatedIndustryScore] = useState(0);

  const userScore = summary?.averageCircularityScore || benchmarks?.userAverageCircularity || 0;
  const industryScore = benchmarks?.industryMedianCircularity || 0;
  const percentile = benchmarks?.userPercentile || 0;

  useEffect(() => {
    const duration = 1200;
    const steps = 60;
    const userIncrement = userScore / steps;
    const industryIncrement = industryScore / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep <= steps) {
        setAnimatedUserScore(Math.min(userIncrement * currentStep, userScore));
        setAnimatedIndustryScore(Math.min(industryIncrement * currentStep, industryScore));
      } else {
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [userScore, industryScore]);

  const isOutperforming = userScore > industryScore;
  const scoreDifference = parseFloat(Math.abs(userScore - industryScore).toFixed(2));

  const getPerformanceMessage = () => {
    if (isOutperforming) {
      if (scoreDifference > 20) return "Exceptional performance!";
      if (scoreDifference > 10) return "Great work!";
      return "Doing well!";
    }
    if (scoreDifference > 20) return "Needs improvement";
    if (scoreDifference > 10) return "Close to industry average";
    return "Almost there!";
  };

  return (
    <Card className="p-6 bg-[#efefe8]">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-[#41531c]/10 rounded-lg">
          <BarChart3 className="w-5 h-5 text-[#41531c]" />
        </div>
        <h2 className="text-xl font-bold text-[#181814]">
          Industry Benchmarking
        </h2>
      </div>

      <div className="space-y-6">
        {/* Performance Summary */}
        <div className="text-center mb-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Award className={`w-5 h-5 ${isOutperforming ? 'text-green-600' : 'text-amber-600'}`} />
            <span className={`text-sm font-semibold ${isOutperforming ? 'text-green-700' : 'text-amber-700'}`}>
              {getPerformanceMessage()}
            </span>
          </div>
          {percentile > 0 && (
            <p className="text-xs text-gray-600">
              You're in the top <span className="font-semibold">{100 - percentile}%</span> of companies
            </p>
          )}
        </div>

        {/* User Score */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#41531c]"></div>
              <span className="text-sm font-medium text-gray-700">
                Your Average
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#41531c]" />
              <span className="text-lg font-bold text-[#181814]">
                {Math.round(animatedUserScore)}%
              </span>
            </div>
          </div>
          <Progress 
            value={animatedUserScore} 
            className="h-3 bg-gray-200"
            style={{ 
              '--progress-background': '#41531c'
            }}
          />
        </div>

        {/* Industry Score */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <span className="text-sm font-medium text-gray-700">
                Industry Median
              </span>
            </div>
            <span className="text-lg font-bold text-gray-600">
              {Math.round(animatedIndustryScore)}%
            </span>
          </div>
          <Progress 
            value={animatedIndustryScore} 
            className="h-3 bg-gray-200"
            style={{ 
              '--progress-background': '#6b7280'
            }}
          />
        </div>

        {/* Performance Insight */}
        {isOutperforming ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-900 mb-1">
                  Industry Leader
                </p>
                <p className="text-xs text-green-700">
                  You're performing {scoreDifference}% better than the industry average. 
                  {percentile > 75 && " Keep up the excellent work!"}
                </p>
              </div>
            </div>
          </div>
        ) : userScore < industryScore ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900 mb-1">
                  Growth Opportunity
                </p>
                <p className="text-xs text-amber-700">
                  You're {scoreDifference}% below industry average. Focus on improving circularity practices.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <Button 
          onClick={() => window.location.href = '/report'}
          className="w-full bg-[#41531c] hover:bg-[#354419] text-white font-semibold py-3 transition-colors"
        >
          View Detailed Benchmark Report
        </Button>
      </div>
    </Card>
  );
};

export default SectionF;