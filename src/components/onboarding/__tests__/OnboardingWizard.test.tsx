import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OnboardingWizard from '../OnboardingWizard';
import DietaryPreferencesStep from '../DietaryPreferencesStep';
import DislikedIngredientsStep from '../DislikedIngredientsStep';
import MealTypeStep from '../MealTypeStep';
import OnboardingComplete from '../OnboardingComplete';

// ---------------------------------------------------------------------------
// DietaryPreferencesStep
// ---------------------------------------------------------------------------
describe('DietaryPreferencesStep', () => {
  it('renders all dietary option cards', () => {
    render(<DietaryPreferencesStep selected={[]} onChange={vi.fn()} />);
    expect(screen.getByText('Vegan')).toBeInTheDocument();
    expect(screen.getByText('Vegetarian')).toBeInTheDocument();
    expect(screen.getByText('Keto')).toBeInTheDocument();
    expect(screen.getByText('Paleo')).toBeInTheDocument();
    expect(screen.getByText('Gluten-Free')).toBeInTheDocument();
    expect(screen.getByText('Dairy-Free')).toBeInTheDocument();
  });

  it('calls onChange with added id when unselected card is clicked', async () => {
    const onChange = vi.fn();
    render(<DietaryPreferencesStep selected={[]} onChange={onChange} />);
    await userEvent.click(screen.getByText('Vegan'));
    expect(onChange).toHaveBeenCalledWith(['vegan']);
  });

  it('calls onChange with id removed when selected card is clicked', async () => {
    const onChange = vi.fn();
    render(<DietaryPreferencesStep selected={['vegan', 'keto']} onChange={onChange} />);
    await userEvent.click(screen.getByText('Vegan'));
    expect(onChange).toHaveBeenCalledWith(['keto']);
  });

  it('shows checkmark for selected options', () => {
    const { container } = render(
      <DietaryPreferencesStep selected={['vegan']} onChange={vi.fn()} />
    );
    // The vegan card should have a green border class
    const veganCard = screen.getByText('Vegan').closest('button');
    expect(veganCard?.className).toContain('border-green-500');
  });
});

// ---------------------------------------------------------------------------
// DislikedIngredientsStep
// ---------------------------------------------------------------------------
describe('DislikedIngredientsStep', () => {
  it('renders quick allergen buttons', () => {
    render(<DislikedIngredientsStep selected={[]} onChange={vi.fn()} />);
    expect(screen.getByText('+ peanuts')).toBeInTheDocument();
    expect(screen.getByText('+ shellfish')).toBeInTheDocument();
  });

  it('adds ingredient via quick-add button', async () => {
    const onChange = vi.fn();
    render(<DislikedIngredientsStep selected={[]} onChange={onChange} />);
    await userEvent.click(screen.getByText('+ peanuts'));
    expect(onChange).toHaveBeenCalledWith(['peanuts']);
  });

  it('does not show quick-add button for already-selected allergen', () => {
    render(<DislikedIngredientsStep selected={['peanuts']} onChange={vi.fn()} />);
    expect(screen.queryByText('+ peanuts')).not.toBeInTheDocument();
  });

  it('shows selected ingredients as tags', () => {
    render(<DislikedIngredientsStep selected={['mushrooms', 'tofu']} onChange={vi.fn()} />);
    expect(screen.getByText('mushrooms')).toBeInTheDocument();
    expect(screen.getByText('tofu')).toBeInTheDocument();
  });

  it('removes ingredient when x button is clicked', async () => {
    const onChange = vi.fn();
    render(<DislikedIngredientsStep selected={['mushrooms']} onChange={onChange} />);
    await userEvent.click(screen.getByLabelText('Remove mushrooms'));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('filters autocomplete suggestions as user types', async () => {
    render(<DislikedIngredientsStep selected={[]} onChange={vi.fn()} />);
    const input = screen.getByPlaceholderText(/type an ingredient/i);
    await userEvent.type(input, 'mush');
    expect(screen.getByText('mushrooms')).toBeInTheDocument();
  });

  it('adds ingredient from autocomplete on click', async () => {
    const onChange = vi.fn();
    render(<DislikedIngredientsStep selected={[]} onChange={onChange} />);
    const input = screen.getByPlaceholderText(/type an ingredient/i);
    await userEvent.type(input, 'mush');
    fireEvent.mouseDown(screen.getByText('mushrooms'));
    expect(onChange).toHaveBeenCalledWith(['mushrooms']);
  });

  it('adds ingredient from input on Enter key', async () => {
    const onChange = vi.fn();
    render(<DislikedIngredientsStep selected={[]} onChange={onChange} />);
    const input = screen.getByPlaceholderText(/type an ingredient/i);
    await userEvent.type(input, 'olives{Enter}');
    expect(onChange).toHaveBeenCalledWith(['olives']);
  });
});

// ---------------------------------------------------------------------------
// MealTypeStep
// ---------------------------------------------------------------------------
describe('MealTypeStep', () => {
  const emptySelected = { breakfast: [], lunch: [], dinner: [] };

  it('renders all three meal sections', () => {
    render(<MealTypeStep selected={emptySelected} onChange={vi.fn()} />);
    expect(screen.getByText(/Breakfast/i)).toBeInTheDocument();
    expect(screen.getByText(/Lunch/i)).toBeInTheDocument();
    expect(screen.getByText(/Dinner/i)).toBeInTheDocument();
  });

  it('renders options within each section', () => {
    render(<MealTypeStep selected={emptySelected} onChange={vi.fn()} />);
    expect(screen.getByText('Continental')).toBeInTheDocument();
    expect(screen.getByText('Salad')).toBeInTheDocument();
    expect(screen.getByText('Italian')).toBeInTheDocument();
  });

  it('calls onChange with toggled breakfast option', async () => {
    const onChange = vi.fn();
    render(<MealTypeStep selected={emptySelected} onChange={onChange} />);
    await userEvent.click(screen.getByText('Continental'));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ breakfast: ['continental'] })
    );
  });

  it('deselects already-selected option', async () => {
    const onChange = vi.fn();
    render(
      <MealTypeStep
        selected={{ breakfast: ['continental'], lunch: [], dinner: [] }}
        onChange={onChange}
      />
    );
    await userEvent.click(screen.getByText('Continental'));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ breakfast: [] })
    );
  });

  it('applies green styling to selected pills', () => {
    render(
      <MealTypeStep
        selected={{ breakfast: ['continental'], lunch: [], dinner: [] }}
        onChange={vi.fn()}
      />
    );
    const pill = screen.getByText('Continental');
    expect(pill.className).toContain('bg-green-600');
  });
});

// ---------------------------------------------------------------------------
// OnboardingComplete
// ---------------------------------------------------------------------------
describe('OnboardingComplete', () => {
  it('renders success heading', () => {
    render(<OnboardingComplete onDone={vi.fn()} dietaryCount={2} ingredientCount={1} />);
    expect(screen.getByText(/you're all set/i)).toBeInTheDocument();
  });

  it('shows dietary count summary', () => {
    render(<OnboardingComplete onDone={vi.fn()} dietaryCount={3} ingredientCount={0} />);
    expect(screen.getByText(/3 dietary preferences saved/i)).toBeInTheDocument();
  });

  it('shows ingredient count summary', () => {
    render(<OnboardingComplete onDone={vi.fn()} dietaryCount={0} ingredientCount={2} />);
    expect(screen.getByText(/2 ingredients to avoid saved/i)).toBeInTheDocument();
  });

  it('shows fallback message when both counts are 0', () => {
    render(<OnboardingComplete onDone={vi.fn()} dietaryCount={0} ingredientCount={0} />);
    expect(screen.getByText(/update preferences anytime/i)).toBeInTheDocument();
  });

  it('calls onDone when button is clicked', async () => {
    const onDone = vi.fn();
    render(<OnboardingComplete onDone={onDone} dietaryCount={0} ingredientCount={0} />);
    await userEvent.click(screen.getByText(/start planning meals/i));
    expect(onDone).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// OnboardingWizard – navigation & integration
// ---------------------------------------------------------------------------
describe('OnboardingWizard', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
  });

  it('starts on step 1 (Dietary)', () => {
    render(<OnboardingWizard onComplete={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.getByText('Dietary Preferences')).toBeInTheDocument();
  });

  it('shows progress step labels', () => {
    render(<OnboardingWizard onComplete={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.getByText('Dietary')).toBeInTheDocument();
    expect(screen.getByText('Ingredients')).toBeInTheDocument();
    expect(screen.getByText('Meal Types')).toBeInTheDocument();
  });

  it('advances to step 2 on Next click', async () => {
    render(<OnboardingWizard onComplete={vi.fn()} onSkip={vi.fn()} />);
    await userEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Disliked Ingredients')).toBeInTheDocument();
  });

  it('goes back to step 1 from step 2', async () => {
    render(<OnboardingWizard onComplete={vi.fn()} onSkip={vi.fn()} />);
    await userEvent.click(screen.getByText('Next'));
    await userEvent.click(screen.getByText('Back'));
    expect(screen.getByText('Dietary Preferences')).toBeInTheDocument();
  });

  it('advances through all steps to completion', async () => {
    render(<OnboardingWizard onComplete={vi.fn()} onSkip={vi.fn()} />);
    await userEvent.click(screen.getByText('Next'));
    await userEvent.click(screen.getByText('Next'));
    await userEvent.click(screen.getByText('Finish'));
    await waitFor(() => {
      expect(screen.getByText(/you're all set/i)).toBeInTheDocument();
    });
  });

  it('calls PUT /api/profile/preferences with onboardingCompleted=true on Finish', async () => {
    render(<OnboardingWizard onComplete={vi.fn()} onSkip={vi.fn()} />);
    await userEvent.click(screen.getByText('Next'));
    await userEvent.click(screen.getByText('Next'));
    await userEvent.click(screen.getByText('Finish'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/profile/preferences',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"onboardingCompleted":true'),
        })
      );
    });
  });

  it('calls onSkip and PUT with onboardingCompleted=false when Skip is clicked', async () => {
    const onSkip = vi.fn();
    render(<OnboardingWizard onComplete={vi.fn()} onSkip={onSkip} />);
    await userEvent.click(screen.getByText('Skip for now'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/profile/preferences',
        expect.objectContaining({
          body: expect.stringContaining('"onboardingCompleted":false'),
        })
      );
      expect(onSkip).toHaveBeenCalled();
    });
  });

  it('shows Back button only from step 2 onwards', () => {
    render(<OnboardingWizard onComplete={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.queryByText('Back')).not.toBeInTheDocument();
  });

  it('shows Finish label on last step instead of Next', async () => {
    render(<OnboardingWizard onComplete={vi.fn()} onSkip={vi.fn()} />);
    await userEvent.click(screen.getByText('Next'));
    await userEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Finish')).toBeInTheDocument();
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
  });
});
