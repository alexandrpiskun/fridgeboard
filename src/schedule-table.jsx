import React, { useState, useEffect } from 'react';
import { Plus, GripVertical, ChevronLeft, ChevronRight } from 'lucide-react';

const STORAGE_KEY = 'schedule-table-data';
const COLORS = ['black', 'red', 'green', 'blue'];

const ScheduleTable = () => {
  const days = ['M', 'Tu', 'W', 'Th', 'Fr', 'Sa', 'Su'];
  const [currentWeek, setCurrentWeek] = useState(getDateWeek());
  const [rows, setRows] = useState([]);
  const [draggedRowId, setDraggedRowId] = useState(null);

  const lessThanAll = (v, arr) =>{
      var res = false;
      arr.forEach(e => {
          res = res?res:v>e;
      })
      return res;
  }

  const migrate = (data) => {
    data.forEach( element => {
        element.weeks = element.weeks || [currentWeek]
        element.status = element.status || "A"
        Object.keys(element.cellStates).forEach(
          wkDay => {
            element.cellStates[wkDay].weeks = element.cellStates[wkDay].weeks  ||  [currentWeek]
          }
        )
    });
  }

  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        migrate(parsedData);
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

  function getDateWeek(date) {
    const currentDate = 
        (typeof date === 'object') ? date : new Date();
    const januaryFirst = 
        new Date(currentDate.getFullYear(), 0, 1);
    const daysToNextMonday = 
        (januaryFirst.getDay() === 1) ? 0 : 
        (7 - januaryFirst.getDay()) % 7;
    const nextMonday = 
        new Date(currentDate.getFullYear(), 0, 
        januaryFirst.getDate() + daysToNextMonday);

    return (currentDate < nextMonday) ? 52 : 
    (currentDate > nextMonday ? Math.ceil(
    (currentDate - nextMonday) / (24 * 3600 * 1000) / 7) : 1);
  }

  const initializeFirstRow = () => {
    const initialRow = {
      id: generateUniqueId(),
      text: '',
      status: 'A',
      weeks:[ getDateWeek() ],
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
          row.status =  states[nextStateIndex] === "filled" ?'D' : 'A' ;
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

  const prewWeek = () => {
    setCurrentWeek(currentWeek-1)
  }
  
  const nextWeek = () => {
    setCurrentWeek(currentWeek+1)
  }

  const addNewRow = () => {
    const newRow = {
      id: generateUniqueId(),
      text: '',
      status: "A",
      weeks:[ getDateWeek() ],
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


  function getDaysOfWeek(currentWeek) {
    const now = new Date();
    now.setHours(0,0,0,0);
    
    
    var start = new Date(now.getFullYear(), 0, 0);
    start.setDate(start.getDate() + currentWeek * 7);
    console.log('-->')
    console.log(start)
    const currentDay = start.getDay(); // Sunday is 0, Monday is 1, etc.
  
    // Calculate the start of the week (Monday)
    const startDate = new Date(start);
    startDate.setDate(start.getDate() - currentDay + (currentDay === 0 ? -6 : 1)); // Adjust if today is Sunday
    console.log(startDate)

    const daysOfWeek = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      date.setHours(0,0,0,0)
      console.log("------")
      console.log(date)
      console.log(now)
      console.log(now.getTime() === date.getTime())
      daysOfWeek.push(
        { 
          dt: new Date(date),
          day : date.toLocaleDateString('en-US', { day: 'numeric' }),
          today: now.getTime() === date.getTime()
        }
      );
    }
    console.log(daysOfWeek)
    return daysOfWeek;
  }
  
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
            
            <th colSpan="7" className="border border-gray-300 text-center">
              <button 
                  onClick={prewWeek}
                  className="w-8 h-8 flex items-center justify-center mx-auto hover:bg-gray-100 rounded-full"
                  aria-label="Previous week"
                >
                  <ChevronLeft size={20} />
              </button>  
                
              When
              <button 
                onClick={nextWeek}
                className="w-8 h-8 flex items-center justify-center mx-auto hover:bg-gray-100 rounded-full"
                aria-label="Next week"
              >
                <ChevronRight size={20} />
              </button>
              </th>
            <th className="border border-gray-300 text-center">What</th>
          </tr>
          <tr>
            <th className="border border-gray-300"></th>
            {days.map((day) => (
              <th key={day} className="border border-gray-300 text-center p-2">
                <p>{day}</p>
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
          <tr>
            <th className="border border-gray-300"></th>
            {getDaysOfWeek(currentWeek).map((day) => (
              <th key={day.dt} className="border border-gray-300 text-center p-2">
                {day.today ? (
                                <p style={{color: 'green'}}>{day.day}</p>
                              ) : (
                                day.day
                              )}
              </th>
            ))}
            <th className="border border-gray-300">
            </th>
          </tr>
        </thead>
        <tbody>
          {rows
                .filter(r => r.weeks.includes(currentWeek) 
                              || (!r.weeks.includes(currentWeek) 
                                  && lessThanAll(currentWeek, r.weeks)
                                  && r.status === 'A'))
                .map(row => (
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