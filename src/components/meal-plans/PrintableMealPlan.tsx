'use client';

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';

interface Meal {
  id: string;
  name: string;
  type: string;
  thumbnail?: string;
}

export interface PrintableMealPlanData {
  startDate: string;
  endDate: string;
  meals: {
    [date: string]: {
      breakfast?: Meal;
      lunch?: Meal;
      dinner?: Meal;
    };
  };
}

export function PrintableMealPlan({ mealPlan }: { mealPlan: PrintableMealPlanData }) {
  const sortedDates = Object.keys(mealPlan.meals || {}).sort();
  const weekRange = `${format(parseISO(mealPlan.startDate), 'MMM d')} - ${format(parseISO(mealPlan.endDate), 'MMM d, yyyy')}`;
  
  const [printedAt, setPrintedAt] = useState<string>('');
  
  useEffect(() => {
    const handleBeforePrint = () => {
      setPrintedAt(format(new Date(), "MMMM d, yyyy 'at' h:mm a"));
    };
    window.addEventListener('beforeprint', handleBeforePrint);
    return () => window.removeEventListener('beforeprint', handleBeforePrint);
  }, []);

  return (
    <div className="hidden print:block print:h-full">
      <div className="print:w-full print:min-h-[calc(100vh-40mm)] print:flex print:flex-col print:justify-between">
        {/* Header */}
        <div>
          <div className="text-center mb-8 pt-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Meal Plan</h1>
            <p className="text-xl text-gray-700">{weekRange}</p>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-lg" style={{ border: '2px solid #d1d5db' }}>
            <table className="w-full table-fixed" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th style={{ width: '18%', textAlign: 'left', fontSize: '1rem', fontWeight: 'bold', color: '#1f2937', padding: '0.75rem 1rem', borderBottom: '2px solid #d1d5db' }}>
                    Day
                  </th>
                  <th style={{ textAlign: 'left', fontSize: '1rem', fontWeight: 'bold', color: '#1f2937', padding: '0.75rem 1rem', borderBottom: '2px solid #d1d5db' }}>
                    Breakfast
                  </th>
                  <th style={{ textAlign: 'left', fontSize: '1rem', fontWeight: 'bold', color: '#1f2937', padding: '0.75rem 1rem', borderBottom: '2px solid #d1d5db' }}>
                    Lunch
                  </th>
                  <th style={{ textAlign: 'left', fontSize: '1rem', fontWeight: 'bold', color: '#1f2937', padding: '0.75rem 1rem', borderBottom: '2px solid #d1d5db' }}>
                    Dinner
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedDates.map((date, index) => {
                  const dayMeals = mealPlan.meals[date];
                  const dayLabel = format(parseISO(date), 'EEE, MMM d');
                  const isLast = index === sortedDates.length - 1;
                  const cellBorder = isLast ? {} : { borderBottom: '1px solid #e5e7eb' };

                  return (
                    <tr key={date} style={{ verticalAlign: 'top' }}>
                      <td style={{ fontSize: '1rem', fontWeight: 500, color: '#111827', padding: '1rem', whiteSpace: 'nowrap', ...cellBorder }}>
                        {dayLabel}
                      </td>
                      <td style={{ fontSize: '1rem', color: '#1f2937', padding: '1rem', ...cellBorder }}>
                        <MealName name={dayMeals?.breakfast?.name} />
                      </td>
                      <td style={{ fontSize: '1rem', color: '#1f2937', padding: '1rem', ...cellBorder }}>
                        <MealName name={dayMeals?.lunch?.name} />
                      </td>
                      <td style={{ fontSize: '1rem', color: '#1f2937', padding: '1rem', ...cellBorder }}>
                        <MealName name={dayMeals?.dinner?.name} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-8 pb-4">
          Printed on {printedAt || format(new Date(), "MMMM d, yyyy 'at' h:mm a")}
        </div>
      </div>
    </div>
  );
}

function MealName({ name }: { name?: string }) {
  return <span className="leading-relaxed">{name || '—'}</span>;
}
