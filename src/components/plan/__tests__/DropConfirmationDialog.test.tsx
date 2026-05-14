import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DropConfirmationDialog } from '../DropConfirmationDialog';
import type { Meal } from '../../../types/meal';

const sourceMeal: Meal = {
  id: 'source-meal',
  name: 'Chicken Tacos',
  tags: ['dinner'],
};

const targetMeal: Meal = {
  id: 'target-meal',
  name: 'Pasta Bake',
  tags: ['dinner'],
};

const defaultProps = {
  isOpen: true,
  sourceMeal,
  targetMeal,
  sourceSlotInfo: { date: '2026-05-18', mealType: 'Dinner' as const },
  targetSlotInfo: { date: '2026-05-19', mealType: 'Dinner' as const },
  onSwap: vi.fn(),
  onReplace: vi.fn(),
  onCancel: vi.fn(),
};

const renderDialog = (overrides: Partial<typeof defaultProps> = {}) => {
  const props = {
    ...defaultProps,
    onSwap: vi.fn(),
    onReplace: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  };

  render(<DropConfirmationDialog {...props} />);
  return props;
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('DropConfirmationDialog', () => {
  it('renders when isOpen=true', () => {
    renderDialog();

    const dialog = screen.getByTestId('drop-confirmation-dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('role', 'dialog');
    const descriptionId = dialog.getAttribute('aria-describedby');
    expect(descriptionId).toBeTruthy();
    expect(document.getElementById(descriptionId!)).toHaveTextContent(
      'Choose how to handle the meal slot conflict.',
    );
  });

  it('is hidden when isOpen=false', () => {
    renderDialog({ isOpen: false });

    expect(
      screen.queryByTestId('drop-confirmation-dialog'),
    ).not.toBeInTheDocument();
  });

  it('displays sourceMeal.name and targetMeal.name', () => {
    renderDialog();

    expect(screen.getByText('Chicken Tacos')).toBeInTheDocument();
    expect(screen.getByText('Pasta Bake')).toBeInTheDocument();
  });

  it('clicking Swap button calls onSwap', async () => {
    const user = userEvent.setup();
    const props = renderDialog();

    await user.click(screen.getByTestId('swap-button'));

    expect(props.onSwap).toHaveBeenCalledTimes(1);
  });

  it('clicking Replace button calls onReplace', async () => {
    const user = userEvent.setup();
    const props = renderDialog();

    await user.click(screen.getByTestId('replace-button'));

    expect(props.onReplace).toHaveBeenCalledTimes(1);
  });

  it('clicking Cancel button calls onCancel', async () => {
    const user = userEvent.setup();
    const props = renderDialog();

    await user.click(screen.getByTestId('cancel-button'));

    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });

  it('clicking overlay/backdrop calls onCancel and closes dialog', async () => {
    const user = userEvent.setup();
    const props = renderDialog();

    const overlay = document.querySelector('[data-state="open"]');
    expect(overlay).not.toBeNull();
    await user.click(overlay!);

    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });

  it('clicking Cancel button explicitly calls onCancel (not keyboard)', async () => {
    const user = userEvent.setup();
    const props = renderDialog();

    await user.click(screen.getByTestId('cancel-button'));

    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });

  it('keyboard S calls onSwap', async () => {
    const user = userEvent.setup();
    const props = renderDialog();

    await user.keyboard('S');

    expect(props.onSwap).toHaveBeenCalledTimes(1);
  });

  it('keyboard R calls onReplace', async () => {
    const user = userEvent.setup();
    const props = renderDialog();

    await user.keyboard('R');

    expect(props.onReplace).toHaveBeenCalledTimes(1);
  });

  it('keyboard Esc calls onCancel', async () => {
    const user = userEvent.setup();
    const props = renderDialog();

    await user.keyboard('{Escape}');

    expect(props.onCancel).toHaveBeenCalled();
  });
});
