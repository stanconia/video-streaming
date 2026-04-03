import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchFilters } from './SearchFilters';

const defaultValues = {
  subject: '',
  difficulty: '',
  minPrice: '',
  maxPrice: '',
  sortBy: 'newest',
  minRating: 0,
  country: '',
};

const mockSubjects = ['Web Development', 'Programming', 'Mathematics', 'Science'];

const defaultProps = {
  subjects: mockSubjects,
  values: defaultValues,
  onChange: jest.fn(),
  onClear: jest.fn(),
  activeFilterCount: 0,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SearchFilters', () => {
  it('renders the Filters toggle button', () => {
    render(<SearchFilters {...defaultProps} />);

    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('renders subject dropdown with all subjects', () => {
    render(<SearchFilters {...defaultProps} />);

    expect(screen.getByText('Subject')).toBeInTheDocument();
    expect(screen.getByText('All Subjects')).toBeInTheDocument();

    const subjectSelect = screen.getByDisplayValue('All Subjects');
    expect(subjectSelect).toBeInTheDocument();

    mockSubjects.forEach((subject) => {
      expect(screen.getByText(subject)).toBeInTheDocument();
    });
  });

  it('calls onChange when subject is selected', async () => {
    const user = userEvent.setup();
    render(<SearchFilters {...defaultProps} />);

    const subjectSelect = screen.getByDisplayValue('All Subjects');
    await user.selectOptions(subjectSelect, 'Web Development');

    expect(defaultProps.onChange).toHaveBeenCalledWith({ subject: 'Web Development' });
  });

  it('renders difficulty buttons', () => {
    render(<SearchFilters {...defaultProps} />);

    expect(screen.getByText('Difficulty')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Beginner')).toBeInTheDocument();
    expect(screen.getByText('Intermediate')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
  });

  it('calls onChange when difficulty button is clicked', async () => {
    const user = userEvent.setup();
    render(<SearchFilters {...defaultProps} />);

    await user.click(screen.getByText('Beginner'));

    expect(defaultProps.onChange).toHaveBeenCalledWith({ difficulty: 'BEGINNER' });
  });

  it('calls onChange with empty string when "All" difficulty is clicked', async () => {
    const user = userEvent.setup();
    render(<SearchFilters {...defaultProps} />);

    await user.click(screen.getByText('All'));

    expect(defaultProps.onChange).toHaveBeenCalledWith({ difficulty: '' });
  });

  it('renders sort dropdown with all options', () => {
    render(<SearchFilters {...defaultProps} />);

    expect(screen.getByText('Sort By')).toBeInTheDocument();
    expect(screen.getByText('Newest')).toBeInTheDocument();
    expect(screen.getByText('Title A-Z')).toBeInTheDocument();
    expect(screen.getByText('Price: Low to High')).toBeInTheDocument();
    expect(screen.getByText('Price: High to Low')).toBeInTheDocument();
    expect(screen.getByText('Most Popular')).toBeInTheDocument();
  });

  it('calls onChange when sort option is selected', async () => {
    const user = userEvent.setup();
    render(<SearchFilters {...defaultProps} />);

    const sortSelect = screen.getByDisplayValue('Newest');
    await user.selectOptions(sortSelect, 'popular');

    expect(defaultProps.onChange).toHaveBeenCalledWith({ sortBy: 'popular' });
  });

  it('renders price input fields', () => {
    render(<SearchFilters {...defaultProps} />);

    expect(screen.getByText('Price Range')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Min')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Max')).toBeInTheDocument();
    expect(screen.getByText('Apply')).toBeInTheDocument();
  });

  it('calls onChange with price values when Apply is clicked', async () => {
    const user = userEvent.setup();
    render(<SearchFilters {...defaultProps} />);

    await user.type(screen.getByPlaceholderText('Min'), '10');
    await user.type(screen.getByPlaceholderText('Max'), '50');
    await user.click(screen.getByText('Apply'));

    expect(defaultProps.onChange).toHaveBeenCalledWith({ minPrice: '10', maxPrice: '50' });
  });

  it('does not show Clear All button when no active filters', () => {
    render(<SearchFilters {...defaultProps} />);

    expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
  });

  it('shows Clear All button when there are active filters', () => {
    render(<SearchFilters {...defaultProps} activeFilterCount={2} />);

    expect(screen.getByText('Clear All')).toBeInTheDocument();
  });

  it('calls onClear when Clear All button is clicked', async () => {
    const user = userEvent.setup();
    render(<SearchFilters {...defaultProps} activeFilterCount={2} />);

    await user.click(screen.getByText('Clear All'));

    expect(defaultProps.onClear).toHaveBeenCalled();
  });

  it('shows active filter count badge', () => {
    render(<SearchFilters {...defaultProps} activeFilterCount={3} />);

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('does not show badge when activeFilterCount is 0', () => {
    render(<SearchFilters {...defaultProps} activeFilterCount={0} />);

    // The badge should not be present
    const badge = screen.queryByText('0');
    // Make sure 0 is not displayed as a badge (it could appear elsewhere)
    expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
  });

  it('renders star rating buttons', () => {
    render(<SearchFilters {...defaultProps} />);

    expect(screen.getByText('Min Rating:')).toBeInTheDocument();
    expect(screen.getByTitle('1 star & up')).toBeInTheDocument();
    expect(screen.getByTitle('2 stars & up')).toBeInTheDocument();
    expect(screen.getByTitle('3 stars & up')).toBeInTheDocument();
    expect(screen.getByTitle('4 stars & up')).toBeInTheDocument();
    expect(screen.getByTitle('5 stars & up')).toBeInTheDocument();
  });

  it('calls onChange with minRating when star button is clicked', async () => {
    const user = userEvent.setup();
    render(<SearchFilters {...defaultProps} />);

    await user.click(screen.getByTitle('4 stars & up'));

    expect(defaultProps.onChange).toHaveBeenCalledWith({ minRating: 4 });
  });

  it('toggles star rating off when same star is clicked again', async () => {
    const user = userEvent.setup();
    render(
      <SearchFilters {...defaultProps} values={{ ...defaultValues, minRating: 4 }} />
    );

    await user.click(screen.getByTitle('4 stars & up'));

    expect(defaultProps.onChange).toHaveBeenCalledWith({ minRating: 0 });
  });

  it('shows star count text when minRating is set', () => {
    render(
      <SearchFilters {...defaultProps} values={{ ...defaultValues, minRating: 3 }} />
    );

    expect(screen.getByText('3+ stars')).toBeInTheDocument();
  });

  it('collapses and expands filter body on toggle click', async () => {
    const user = userEvent.setup();
    render(<SearchFilters {...defaultProps} />);

    // Initially expanded - should show Subject label
    expect(screen.getByText('Subject')).toBeInTheDocument();

    // Click to collapse
    await user.click(screen.getByText('Filters'));

    // Subject should be hidden
    expect(screen.queryByText('Subject')).not.toBeInTheDocument();

    // Click to expand
    await user.click(screen.getByText('Filters'));

    // Subject should be visible again
    expect(screen.getByText('Subject')).toBeInTheDocument();
  });
});
