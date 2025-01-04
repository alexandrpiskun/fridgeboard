import React, { useState, useEffect } from 'react';
import { Plus, GripVertical } from 'lucide-react';

const STORAGE_KEY = 'schedule-table-data';
const COLORS = ['black', 'red', 'green', 'blue'];

const ScheduleTable = () => {
  const days = ['M', 'Tu', 'W', 'Th', 'Fr', 'Sa', 'Su'];
  const [rows, setRows] = useState([]);
  const [draggedRowId, setDraggedRowId] = useState(null);

  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setRows(parsedData);
      } catch (error) {
        console.error('Error parsing saved data:', error);
        initializeFirstRow();
      }
    } else {
      initializeFirstRow();
    }
  }, []);

  useEffect(() => {
    if (rows.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    }
  }, [rows]);

  const initializeFirstRow = () => {
    const initialRow = {
      id: generateUniqueId(),
      text: '',
      cellStates: {}
    };
    setRows([initialRow]);
  };

  const generateUniqueId = () => {
    return `row_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleCellClick = (rowId, day, e) => {
    e.preventDefault();

    setRows(currentRows => {
      return currentRows.map(row => {
        if (row.id !== rowId) return row;

        const currentState = row.cellStates[day] || { 
          state: 'none', // none -> selected -> partial -> filled
          color: 'black'
        };

        let newState;

        if (e.button === 2 && currentState.state !== 'none') {
          // Right click - cycle colors if cell is in any active state
          const currentColorIndex = COLORS.indexOf(currentState.color);
          const nextColorIndex = (currentColorIndex + 1) % COLORS.length;
          newState = {
            ...currentState,
            color: COLORS[nextColorIndex]
          };
        } else if (e.button === 0) {
          // Left click - cycle through states
          const states = ['none', 'selected', 'partial', 'filled'];
          const currentStateIndex = states.indexOf(currentState.state);
          const nextStateIndex = (currentStateIndex + 1) % states.length;
          
          newState = {
            state: states[nextStateIndex],
            color: currentState.color || 'black'
          };

          if (newState.state === 'none') {
            newState.color = 'black'; // Reset color when returning to none state
          }
        } else {
          return row;
        }

        return {
          ...row,
          cellStates: {
            ...row.cellStates,
            [day]: newState
          }
        };
      });
    });
  };

  // Create diagonal line pattern for partial fill
  const getPartialFillStyle = (color) => {
    const canvas = document.createElement('canvas');
    canvas.width = 10;
    canvas.height = 10;
    const ctx = canvas.getContext('2d');
    
    // Clear background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 10, 10);
    
    // Draw diagonal line
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(10, 10);
    ctx.lineTo(0, 0);
    ctx.stroke();
    
    return `url(${canvas.toDataURL()})`;
  };

  const getCellStyle = (cellState) => {
    if (!cellState || cellState.state === 'none') {
      return {
        backgroundColor: 'white',
        border: '1px solid #D1D5DB'
      };
    }

    const color = cellState.color || 'black';
    
    switch (cellState.state) {
      case 'selected':
        return {
          backgroundColor: 'white',
          border: `2px solid ${color}`
        };
      case 'partial':
        return {
          backgroundColor: 'white',
          border: `2px solid ${color}`,
          backgroundImage: getPartialFillStyle(color)
        };
      case 'filled':
        return {
          backgroundColor: color,
          border: `2px solid ${color}`,
          color: 'white'
        };
      default:
        return {};
    }
  };

  const handleTextChange = (rowId, value) => {
    setRows(currentRows =>
      currentRows.map(row =>
        row.id === rowId ? { ...row, text: value } : row
      )
    );
  };

  const addNewRow = () => {
    const newRow = {
      id: generateUniqueId(),
      text: '',
      cellStates: {}
    };
    setRows(currentRows => [...currentRows, newRow]);
  };

  const handleDragStart = (e, rowId) => {
    setDraggedRowId(rowId);
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('opacity-50');
    setDraggedRowId(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetRowId) => {
    e.preventDefault();
    if (draggedRowId === targetRowId) return;

    setRows(currentRows => {
      const draggedRowIndex = currentRows.findIndex(row => row.id === draggedRowId);
      const targetRowIndex = currentRows.findIndex(row => row.id === targetRowId);
      
      const newRows = [...currentRows];
      const [draggedRow] = newRows.splice(draggedRowIndex, 1);
      newRows.splice(targetRowIndex, 0, draggedRow);
      
      return newRows;
    });
  };

  return (
    <div className="p-4">
      <table className="w-full border-collapse border border-gray-300">
        <colgroup>
          <col style={{ width: "30px" }} />
          {days.map((day) => (
            <col key={day} style={{ width: `${20/7}%` }} />
          ))}
          <col style={{ width: '80%' }} />
        </colgroup>
        <thead>
          <tr>
            <th className="border border-gray-300"></th>
            <th colSpan="7" className="border border-gray-300 text-center">When</th>
            <th className="border border-gray-300 text-center">What</th>
          </tr>
          <tr>
            <th className="border border-gray-300"></th>
            {days.map((day) => (
              <th key={day} className="border border-gray-300 text-center p-2">
                {day}
              </th>
            ))}
            <th className="border border-gray-300">
              <button 
                onClick={addNewRow}
                className="w-8 h-8 flex items-center justify-center mx-auto hover:bg-gray-100 rounded-full"
                aria-label="Add new row"
              >
                <Plus size={20} />
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr 
              key={row.id}
              draggable="true"
              onDragStart={(e) => handleDragStart(e, row.id)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, row.id)}
              className="hover:bg-gray-50"
              onContextMenu={(e) => e.preventDefault()}
            >
              <td className="border border-gray-300 cursor-move">
                <div className="flex justify-center items-center h-full">
                  <GripVertical size={16} className="text-gray-400" />
                </div>
              </td>
              {days.map((day) => (
                <td
                  key={day}
                  className="p-2 text-center cursor-pointer transition-all duration-200"
                  style={getCellStyle(row.cellStates[day])}
                  onMouseDown={(e) => handleCellClick(row.id, day, e)}
                >
                  &nbsp;
                </td>
              ))}
              <td className="border border-gray-300">
                <input
                  type="text"
                  className="w-full p-2 border-none focus:outline-none"
                  value={row.text || ''}
                  onChange={(e) => handleTextChange(row.id, e.target.value)}
                  placeholder="Enter text here..."
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ScheduleTable;