/**
 * Unit tests for AchievementsChecklist component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AchievementsChecklist from '../AchievementsChecklist.jsx';
import { ThemeContext } from '../../../contexts/ThemeContext';

// Mock theme context
const mockTheme = {
  colors: {
    surface: 'bg-white',
    surfaceSecondary: 'bg-gray-50',
    border: 'border-gray-200',
    text: {
      primary: 'text-gray-900',
      secondary: 'text-gray-600',
      muted: 'text-gray-500'
    }
  }
};

const ThemeProvider = ({ children }) => (
  <ThemeContext.Provider value={mockTheme}>
    {children}
  </ThemeContext.Provider>
);

describe('AchievementsChecklist', () => {
  const mockAchievements = [
    {
      key: 'first_debt_added',
      label: 'First Debt Added',
      desc: 'Started your debt-free journey',
      emoji: '🎯',
      unlocked: true,
      unlockedAt: '2025-01-01T12:00:00.000Z'
    },
    {
      key: 'first_500_paid',
      label: 'First £500 Paid',
      desc: 'Crushed £500 of principal',
      emoji: '💪',
      unlocked: true,
      unlockedAt: '2025-01-15T12:00:00.000Z'
    },
    {
      key: 'first_debt_cleared',
      label: 'First Victory',
      desc: 'Eliminated your first debt',
      emoji: '🎉',
      unlocked: false
    },
    {
      key: 'all_debts_cleared',
      label: 'Debt Free!',
      desc: 'Complete financial freedom',
      emoji: '🚀',
      unlocked: false
    }
  ];

  it('renders achievements checklist with correct title', () => {
    render(
      <ThemeProvider>
        <AchievementsChecklist achievements={mockAchievements} />
      </ThemeProvider>
    );

    expect(screen.getByText('Look What You\'ve Achieved')).toBeInTheDocument();
    expect(screen.getByText('2 of 4 milestones unlocked')).toBeInTheDocument();
  });

  it('shows unlocked achievements first', () => {
    render(
      <ThemeProvider>
        <AchievementsChecklist achievements={mockAchievements} />
      </ThemeProvider>
    );

    const achievementCards = screen.getAllByRole('generic').filter(el => 
      el.textContent.includes('First Debt Added') || 
      el.textContent.includes('First £500 Paid') ||
      el.textContent.includes('First Victory') ||
      el.textContent.includes('Debt Free!')
    );

    // Should show unlocked ones first
    expect(achievementCards[0]).toHaveTextContent('First Debt Added');
    expect(achievementCards[1]).toHaveTextContent('First £500 Paid');
  });

  it('displays unlock dates for completed achievements', () => {
    render(
      <ThemeProvider>
        <AchievementsChecklist achievements={mockAchievements} />
      </ThemeProvider>
    );

    expect(screen.getByText('✓ Jan 2025')).toBeInTheDocument(); // First achievement
    expect(screen.getByText('✓ Jan 2025')).toBeInTheDocument(); // Second achievement
  });

  it('calls onSeePlan when button is clicked', () => {
    const mockOnSeePlan = jest.fn();
    
    render(
      <ThemeProvider>
        <AchievementsChecklist achievements={mockAchievements} onSeePlan={mockOnSeePlan} />
      </ThemeProvider>
    );

    const seePlanButton = screen.getByText('See my plan');
    fireEvent.click(seePlanButton);

    expect(mockOnSeePlan).toHaveBeenCalledTimes(1);
  });

  it('shows progress bar with correct percentage', () => {
    render(
      <ThemeProvider>
        <AchievementsChecklist achievements={mockAchievements} />
      </ThemeProvider>
    );

    const progressBar = screen.getByRole('progressbar', { hidden: true });
    expect(progressBar).toHaveStyle('width: 50%'); // 2 of 4 achievements = 50%
  });

  it('displays motivational message for partial progress', () => {
    render(
      <ThemeProvider>
        <AchievementsChecklist achievements={mockAchievements} />
      </ThemeProvider>
    );

    expect(screen.getByText('Nice progress! 2 more achievements to unlock.')).toBeInTheDocument();
  });

  it('shows celebration message when all achievements unlocked', () => {
    const allUnlockedAchievements = mockAchievements.map(a => ({ ...a, unlocked: true }));
    
    render(
      <ThemeProvider>
        <AchievementsChecklist achievements={allUnlockedAchievements} />
      </ThemeProvider>
    );

    expect(screen.getByText(/🎉 Incredible! You've unlocked all achievements! 🎉/)).toBeInTheDocument();
  });

  it('shows encouraging message for first achievement', () => {
    const oneUnlockedAchievements = [
      { ...mockAchievements[0], unlocked: true },
      ...mockAchievements.slice(1).map(a => ({ ...a, unlocked: false }))
    ];
    
    render(
      <ThemeProvider>
        <AchievementsChecklist achievements={oneUnlockedAchievements} />
      </ThemeProvider>
    );

    expect(screen.getByText('Great start! Keep going to unlock more achievements.')).toBeInTheDocument();
  });

  it('shows almost done message when close to completion', () => {
    const almostDoneAchievements = [
      ...mockAchievements.slice(0, 3).map(a => ({ ...a, unlocked: true })),
      { ...mockAchievements[3], unlocked: false }
    ];
    
    render(
      <ThemeProvider>
        <AchievementsChecklist achievements={almostDoneAchievements} />
      </ThemeProvider>
    );

    expect(screen.getByText('You\'re almost there! One more achievement to go!')).toBeInTheDocument();
  });

  it('does not render when no achievements provided', () => {
    const { container } = render(
      <ThemeProvider>
        <AchievementsChecklist achievements={[]} />
      </ThemeProvider>
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('does not render when achievements is null', () => {
    const { container } = render(
      <ThemeProvider>
        <AchievementsChecklist achievements={null} />
      </ThemeProvider>
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders achievement emojis correctly', () => {
    render(
      <ThemeProvider>
        <AchievementsChecklist achievements={mockAchievements} />
      </ThemeProvider>
    );

    expect(screen.getByText('🎯')).toBeInTheDocument();
    expect(screen.getByText('💪')).toBeInTheDocument();
    expect(screen.getByText('🎉')).toBeInTheDocument();
    expect(screen.getByText('🚀')).toBeInTheDocument();
  });

  it('does not show See my plan button when onSeePlan not provided', () => {
    render(
      <ThemeProvider>
        <AchievementsChecklist achievements={mockAchievements} />
      </ThemeProvider>
    );

    expect(screen.queryByText('See my plan')).not.toBeInTheDocument();
  });

  it('handles achievements without unlockedAt dates', () => {
    const achievementsNoDate = [
      { ...mockAchievements[0], unlockedAt: undefined }
    ];
    
    render(
      <ThemeProvider>
        <AchievementsChecklist achievements={achievementsNoDate} />
      </ThemeProvider>
    );

    // Should still render the achievement without crashing
    expect(screen.getByText('First Debt Added')).toBeInTheDocument();
    expect(screen.queryByText(/✓/)).not.toBeInTheDocument();
  });
});