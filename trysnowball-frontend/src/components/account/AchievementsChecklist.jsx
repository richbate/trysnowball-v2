import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../ui/Button';
import { Check, Lock, Trophy } from 'lucide-react';

export default function AchievementsChecklist({ achievements, onSeePlan }) {
  const { colors } = useTheme();
  
  if (!achievements?.length) return null;
  
  // Sort: unlocked first, then locked
  const sorted = [...achievements].sort((a, b) => {
    if (a.unlocked && !b.unlocked) return -1;
    if (!a.unlocked && b.unlocked) return 1;
    return 0;
  });
  
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const progressPercent = Math.round((unlockedCount / totalCount) * 100);
  
  // Format date for display
  const formatDate = (isoDate) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${month} ${year}`;
  };
  
  return (
    <div className={`${colors.surface} rounded-xl shadow-lg border ${colors.border} p-6 mb-6`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Trophy className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${colors.text.primary}`}>
              Look What You've Achieved
            </h2>
            <p className={`text-sm ${colors.text.secondary} mt-1`}>
              {unlockedCount} of {totalCount} milestones unlocked
            </p>
          </div>
        </div>
        
        {onSeePlan && (
          <Button 
            onClick={onSeePlan}
            variant="secondary"
            size="sm"
          >
            See my plan
          </Button>
        )}
      </div>
      
      {/* Progress Bar */}
      <div className={`w-full h-3 ${colors.surfaceSecondary} rounded-full mb-6 overflow-hidden`}>
        <div 
          className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      
      {/* Achievements Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sorted.map((achievement) => (
          <div
            key={achievement.key}
            className={`relative p-4 rounded-lg border transition-all duration-200 ${
              achievement.unlocked 
                ? `${colors.surface} border-primary/30 bg-primary/5` 
                : `${colors.surfaceSecondary} ${colors.border} opacity-60`
            }`}
          >
            {/* Unlocked Badge */}
            {achievement.unlocked && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
            
            {/* Content */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                {achievement.emoji && (
                  <span className="text-2xl">{achievement.emoji}</span>
                )}
                {!achievement.unlocked && (
                  <Lock className={`w-5 h-5 ${colors.text.muted}`} />
                )}
              </div>
              
              <div>
                <h3 className={`font-semibold text-sm ${
                  achievement.unlocked ? colors.text.primary : colors.text.muted
                }`}>
                  {achievement.label}
                </h3>
                <p className={`text-xs mt-1 ${colors.text.secondary}`}>
                  {achievement.desc}
                </p>
                
                {achievement.unlocked && achievement.unlockedAt && (
                  <p className={`text-xs mt-2 ${colors.text.muted}`}>
                    ✓ {formatDate(achievement.unlockedAt)}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Motivational Footer */}
      {unlockedCount > 0 && unlockedCount < totalCount && (
        <div className={`mt-6 p-4 ${colors.surfaceSecondary} rounded-lg`}>
          <p className={`text-sm text-center ${colors.text.secondary}`}>
            {unlockedCount === 1 
              ? "Great start! Keep going to unlock more achievements."
              : unlockedCount >= totalCount - 1
              ? "You're almost there! One more achievement to go!"
              : `Nice progress! ${totalCount - unlockedCount} more achievements to unlock.`
            }
          </p>
        </div>
      )}
      
      {/* Celebration for all unlocked */}
      {unlockedCount === totalCount && (
        <div className="mt-6 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
          <p className="text-center font-semibold text-primary">
            🎉 Incredible! You've unlocked all achievements! 🎉
          </p>
        </div>
      )}
    </div>
  );
}