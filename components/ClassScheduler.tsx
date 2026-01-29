import React, { useState } from 'react';
import { Calendar as CalendarIcon, X, Plus } from 'lucide-react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from 'date-fns';

interface ClassSchedulerProps {
    onSchedule: (dates: Date[]) => void;
    onClose: () => void;
}

const ClassScheduler: React.FC<ClassSchedulerProps> = ({ onSchedule, onClose }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDates, setSelectedDates] = useState<Date[]>([]);

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const toggleDate = (date: Date) => {
        const isSelected = selectedDates.some(d => isSameDay(d, date));
        if (isSelected) {
            setSelectedDates(selectedDates.filter(d => !isSameDay(d, date)));
        } else {
            setSelectedDates([...selectedDates, date]);
        }
    };

    const handleSchedule = () => {
        onSchedule(selectedDates.sort((a, b) => a.getTime() - b.getTime()));
        onClose();
    };

    const nextMonth = () => setCurrentMonth(addDays(monthEnd, 1));
    const prevMonth = () => setCurrentMonth(addDays(monthStart, -1));

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 animate-apple-in">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-black/90">Schedule Classes</h2>
                        <p className="text-sm text-black/50 mt-1">Select dates when you have classes</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-black/5 rounded-full transition-all"
                    >
                        <X className="w-5 h-5 text-black/60" />
                    </button>
                </div>

                {/* Month Navigation */}
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={prevMonth}
                        className="px-3 py-1.5 text-sm font-semibold text-black/60 hover:bg-black/5 rounded-lg transition-all"
                    >
                        ← Prev
                    </button>
                    <h3 className="text-lg font-bold text-black/80">
                        {format(currentMonth, 'MMMM yyyy')}
                    </h3>
                    <button
                        onClick={nextMonth}
                        className="px-3 py-1.5 text-sm font-semibold text-black/60 hover:bg-black/5 rounded-lg transition-all"
                    >
                        Next →
                    </button>
                </div>

                {/* Calendar Grid */}
                <div className="mb-6">
                    {/* Day Headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-center text-xs font-bold text-black/40 py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, idx) => {
                            const isCurrentMonth = isSameMonth(day, currentMonth);
                            const isSelected = selectedDates.some(d => isSameDay(d, day));
                            const isToday = isSameDay(day, new Date());
                            const isPast = day < new Date() && !isToday;

                            return (
                                <button
                                    key={idx}
                                    onClick={() => isCurrentMonth && !isPast && toggleDate(day)}
                                    disabled={!isCurrentMonth || isPast}
                                    className={`
                                        aspect-square rounded-lg text-sm font-semibold transition-all
                                        ${!isCurrentMonth ? 'text-black/10 cursor-default' : ''}
                                        ${isPast ? 'text-black/20 cursor-not-allowed' : ''}
                                        ${isCurrentMonth && !isPast && !isSelected ? 'text-black/70 hover:bg-black/5' : ''}
                                        ${isSelected ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
                                        ${isToday && !isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                                    `}
                                >
                                    {format(day, 'd')}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Selected Count */}
                <div className="mb-4 p-3 bg-blue-50 rounded-xl">
                    <p className="text-sm text-blue-900">
                        <span className="font-bold">{selectedDates.length}</span> {selectedDates.length === 1 ? 'class' : 'classes'} selected
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 text-sm font-semibold text-black/60 hover:bg-black/5 rounded-xl transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSchedule}
                        disabled={selectedDates.length === 0}
                        className={`
                            flex-1 px-4 py-3 text-sm font-semibold rounded-xl transition-all
                            ${selectedDates.length > 0
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-black/10 text-black/30 cursor-not-allowed'
                            }
                        `}
                    >
                        Create {selectedDates.length} {selectedDates.length === 1 ? 'Session' : 'Sessions'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClassScheduler;
