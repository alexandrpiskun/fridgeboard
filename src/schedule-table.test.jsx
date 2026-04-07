import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import ScheduleTable from './schedule-table';

beforeEach(() => {
  localStorage.clear();
});

const getRows = () => screen.getAllByRole('row').filter(r => r.closest('tbody'));
const getDayCell = (row, dayIndex) => within(row).getAllByRole('cell')[dayIndex + 1]; // +1 for grip column

describe('initial render', () => {
  it('renders one empty row on first load', () => {
    render(<ScheduleTable />);
    expect(getRows()).toHaveLength(1);
  });

  it('shows week number in header', () => {
    render(<ScheduleTable />);
    expect(screen.getByText(/When \(\d+\)/)).toBeInTheDocument();
  });

  it('shows day headers', () => {
    render(<ScheduleTable />);
    ['M', 'Tu', 'W', 'Th', 'Fr', 'Sa', 'Su'].forEach(day => {
      expect(screen.getByText(day)).toBeInTheDocument();
    });
  });
});

describe('adding rows', () => {
  it('adds a new row when + button is clicked', async () => {
    render(<ScheduleTable />);
    await userEvent.click(screen.getByLabelText('Add new row'));
    expect(getRows()).toHaveLength(2);
  });

  it('new rows have an editable text field', async () => {
    render(<ScheduleTable />);
    await userEvent.click(screen.getByLabelText('Add new row'));
    const inputs = screen.getAllByPlaceholderText('Enter text here...');
    expect(inputs).toHaveLength(2);
  });
});

describe('task text input', () => {
  it('updates task text on input', async () => {
    render(<ScheduleTable />);
    const input = screen.getByPlaceholderText('Enter text here...');
    await userEvent.type(input, 'Buy groceries');
    expect(input).toHaveValue('Buy groceries');
  });
});

describe('cell state cycling', () => {
  it('cycles through none → selected → partial → filled → none on left click', () => {
    render(<ScheduleTable />);
    const row = getRows()[0];
    const cell = getDayCell(row, 0);

    // none → selected: thin border → thick border
    expect(cell.style.borderWidth).toBe('1px');
    fireEvent.mouseDown(cell, { button: 0 });
    expect(cell.style.borderWidth).toBe('2px');
    expect(cell.style.borderColor).toBe('black');

    // selected → partial: still thick border
    fireEvent.mouseDown(cell, { button: 0 });
    expect(cell.style.borderWidth).toBe('2px');

    // partial → filled: background becomes colored
    fireEvent.mouseDown(cell, { button: 0 });
    expect(cell.style.backgroundColor).toBe('black');

    // filled → none: border resets to thin
    fireEvent.mouseDown(cell, { button: 0 });
    expect(cell.style.borderWidth).toBe('1px');
  });
});

describe('color cycling on right click', () => {
  it('does not change color on right click when cell is none', () => {
    render(<ScheduleTable />);
    const row = getRows()[0];
    const cell = getDayCell(row, 0);
    fireEvent.mouseDown(cell, { button: 2 });
    // stays none — thin border unchanged
    expect(cell.style.borderWidth).toBe('1px');
  });

  it('cycles colors on right click when cell is active', () => {
    render(<ScheduleTable />);
    const row = getRows()[0];
    const cell = getDayCell(row, 0);

    fireEvent.mouseDown(cell, { button: 0 }); // → selected (black)
    expect(cell.style.borderColor).toBe('black');

    fireEvent.mouseDown(cell, { button: 2 }); // → red
    expect(cell.style.borderColor).toBe('red');

    fireEvent.mouseDown(cell, { button: 2 }); // → green
    expect(cell.style.borderColor).toBe('green');

    fireEvent.mouseDown(cell, { button: 2 }); // → blue
    expect(cell.style.borderColor).toBe('blue');

    fireEvent.mouseDown(cell, { button: 2 }); // → black (wraps)
    expect(cell.style.borderColor).toBe('black');
  });
});

describe('week navigation', () => {
  it('decrements week on prev click', async () => {
    render(<ScheduleTable />);
    const weekText = screen.getByText(/When \((\d+)\)/);
    const initialWeek = parseInt(weekText.textContent.match(/\d+/)[0]);
    await userEvent.click(screen.getByLabelText('Previous week'));
    expect(screen.getByText(`When (${initialWeek - 1})`)).toBeInTheDocument();
  });

  it('increments week on next click', async () => {
    render(<ScheduleTable />);
    const weekText = screen.getByText(/When \((\d+)\)/);
    const initialWeek = parseInt(weekText.textContent.match(/\d+/)[0]);
    await userEvent.click(screen.getByLabelText('Next week'));
    expect(screen.getByText(`When (${initialWeek + 1})`)).toBeInTheDocument();
  });

  it('cells reset to empty when navigating to a week with no data', async () => {
    render(<ScheduleTable />);
    const row = getRows()[0];
    const cell = getDayCell(row, 0);
    fireEvent.mouseDown(cell, { button: 0 }); // mark cell in current week

    await userEvent.click(screen.getByLabelText('Next week'));
    const newRow = getRows()[0];
    const newCell = getDayCell(newRow, 0);
    expect(newCell.style.borderWidth).toBe('1px'); // back to default thin border
  });
});

describe('localStorage persistence', () => {
  it('persists rows to localStorage', async () => {
    render(<ScheduleTable />);
    const input = screen.getByPlaceholderText('Enter text here...');
    await userEvent.type(input, 'persisted task');
    const saved = JSON.parse(localStorage.getItem('schedule-table-data'));
    expect(saved[0].text).toBe('persisted task');
  });

  it('restores rows from localStorage on mount', () => {
    const week = 1;
    localStorage.setItem('schedule-table-data', JSON.stringify([
      {
        id: 'row_1',
        text: 'restored task',
        status: 'A',
        weeks: [week],
        span: { from: week, to: week },
        cellStates: {
          M:  { week: {} }, Tu: { week: {} }, W:  { week: {} },
          Th: { week: {} }, Fr: { week: {} }, Sa: { week: {} }, Su: { week: {} },
        },
      },
    ]));
    render(<ScheduleTable />);
    expect(screen.getByDisplayValue('restored task')).toBeInTheDocument();
  });
});

describe('row drag and drop', () => {
  it('reorders rows via drag and drop', async () => {
    render(<ScheduleTable />);
    await userEvent.click(screen.getByLabelText('Add new row'));

    const inputs = screen.getAllByPlaceholderText('Enter text here...');
    await userEvent.type(inputs[0], 'first');
    await userEvent.type(inputs[1], 'second');

    const rows = getRows();

    fireEvent.dragStart(rows[0]);
    fireEvent.dragOver(rows[1]);
    fireEvent.drop(rows[1]);

    const reordered = screen.getAllByPlaceholderText('Enter text here...');
    expect(reordered[0]).toHaveValue('second');
    expect(reordered[1]).toHaveValue('first');
  });
});
