
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';
import html2canvas from 'html2canvas';
import Papa from 'papaparse';
import type { Member } from '../types';

const Statistics: React.FC = () => {
    const today = new Date();
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
    const lastDayOfYear = new Date(today.getFullYear(), 11, 31);
    
    const [dateFrom, setDateFrom] = useState(firstDayOfYear.toISOString().split('T')[0]);
    const [dateTo, setDateTo] = useState(lastDayOfYear.toISOString().split('T')[0]);

    const allTrainers = useLiveQuery(() => db.trainers.toArray(), []);
    const allMembers = useLiveQuery(() => db.members.toArray(), []);
    
    const trainingsInRange = useLiveQuery(async () => {
        const parseDate = (dateStr: string) => {
            const [day, month, year] = dateStr.split('.').map(Number);
            return new Date(year, month - 1, day);
        };
        const from = new Date(dateFrom);
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999); // Include the whole day

        return db.trainings.filter(t => {
            const trainingDate = parseDate(t.datum);
            return trainingDate >= from && trainingDate <= to;
        }).toArray();

    }, [dateFrom, dateTo]);

    const attendances = useLiveQuery(async () => {
        if (!trainingsInRange) return [];
        const trainingIds = trainingsInRange.map(t => t.id!);
        return db.attendances.where('training_id').anyOf(trainingIds).toArray();
    }, [trainingsInRange]);

    const memberRanking = useMemo(() => {
        if (!attendances || !allMembers) return [];
        const attendanceCount = attendances.reduce((acc, curr) => {
            acc[curr.member_id] = (acc[curr.member_id] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);

        return Object.entries(attendanceCount)
            .map(([memberId, count]) => {
                const member = allMembers.find(m => m.id === Number(memberId));
                return {
                    member: member ? `${member.nachname}, ${member.vorname}` : 'Unbekannt',
                    count,
                };
            })
            // FIX: Explicitly type sort arguments to prevent type inference errors.
            .sort((a: { count: number; member: string }, b: { count: number; member: string }) => {
                if (b.count !== a.count) return b.count - a.count;
                return a.member.localeCompare(b.member);
            });
    }, [attendances, allMembers]);

    const topicStats = useMemo(() => {
        if (!trainingsInRange) return [];
        const topicCount = trainingsInRange.reduce((acc, curr) => {
            acc[curr.thema] = (acc[curr.thema] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(topicCount)
            .map(([name, value]) => ({ name, value }))
            // FIX: Explicitly type sort arguments to prevent type inference errors.
            .sort((a: {value: number}, b: {value: number}) => b.value - a.value);
    }, [trainingsInRange]);
    
    const trainerStats = useMemo(() => {
        if (!trainingsInRange || !allTrainers) return [];
        const trainerCount = trainingsInRange.reduce((acc, curr) => {
            if (curr.trainer1_id) acc[curr.trainer1_id] = (acc[curr.trainer1_id] || 0) + 1;
            if (curr.trainer2_id) acc[curr.trainer2_id] = (acc[curr.trainer2_id] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);

        return Object.entries(trainerCount)
            .map(([trainerId, value]) => {
                const trainer = allTrainers.find(t => t.id === Number(trainerId));
                return {
                    name: trainer ? `${trainer.vorname} ${trainer.nachname}` : 'Unbekannt',
                    value
                };
            })
             // FIX: Explicitly type sort arguments to prevent type inference errors.
             .sort((a: {value: number}, b: {value: number}) => b.value - a.value);
    }, [trainingsInRange, allTrainers]);

    const rankingChartRef = useRef(null);
    const topicChartRef = useRef(null);
    const trainerChartRef = useRef(null);
    
    const exportChart = (ref: React.RefObject<HTMLDivElement>, filename: string) => {
        if (ref.current) {
            html2canvas(ref.current, { backgroundColor: '#334155' }).then(canvas => {
                const link = document.createElement('a');
                link.download = `${filename}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            });
        }
    };

    const exportAttendanceCSV = () => {
        if (!attendances || !allMembers || !trainingsInRange) return;
        
        const data = attendances.map(att => {
            const member = allMembers.find(m => m.id === att.member_id);
            const training = trainingsInRange.find(t => t.id === att.training_id);
            return {
                Datum: training?.datum,
                Thema: training?.thema,
                Vorname: member?.vorname,
                Nachname: member?.nachname,
            }
        });

        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'anwesenheit.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const TrophyIcon = ({ rank }: { rank: number }) => {
        const colors: { [key: number]: string } = {
            1: 'text-yellow-400',
            2: 'text-gray-400',
            3: 'text-yellow-600'
        };
        if (rank > 3) return <span className="w-6 text-center">{rank}.</span>;
        return <i className={`fa-solid fa-trophy ${colors[rank]} w-6 text-center`}></i>;
    };
    
    const COLORS = ['#ef744f', '#d76947', '#bf5e3f', '#a75337', '#8f482f'];

    return (
        <div className="space-y-6">
             <div className="bg-surface p-4 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold mb-4 text-white">Zeitraum auswählen</h2>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full bg-background border border-gray-600 rounded-md px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"/>
                    <span className="text-on-surface/80">bis</span>
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full bg-background border border-gray-600 rounded-md px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"/>
                    <button onClick={exportAttendanceCSV} className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-80 transition flex items-center justify-center shrink-0">
                        <i className="fa fa-download mr-2"></i> CSV Export
                    </button>
                </div>
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-surface p-4 rounded-lg shadow-lg" ref={rankingChartRef}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-white">Rangliste Mitglieder</h2>
                        <button onClick={() => exportChart(rankingChartRef, 'rangliste')} className="text-primary hover:text-opacity-80"><i className="fa fa-camera"></i></button>
                    </div>
                    <ul className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {memberRanking.map((item, index) => (
                            <li key={item.member} className="flex items-center p-2 bg-background rounded-md">
                                <TrophyIcon rank={index + 1} />
                                <span className="flex-grow ml-2">{item.member}</span>
                                <span className="font-bold text-primary">{item.count}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                 <div className="bg-surface p-4 rounded-lg shadow-lg" ref={topicChartRef}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-white">Top Trainingsthemen</h2>
                        <button onClick={() => exportChart(topicChartRef, 'themen-statistik')} className="text-primary hover:text-opacity-80"><i className="fa fa-camera"></i></button>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={topicStats} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                             <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                            <XAxis type="number" stroke="#cbd5e1"/>
                            <YAxis type="category" dataKey="name" stroke="#cbd5e1" width={100} tick={{fontSize: 12}}/>
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}/>
                            <Bar dataKey="value" fill="#ef744f" name="Anzahl"/>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
             </div>
             <div className="bg-surface p-4 rounded-lg shadow-lg" ref={trainerChartRef}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">Trainer-Einsätze</h2>
                    <button onClick={() => exportChart(trainerChartRef, 'trainer-statistik')} className="text-primary hover:text-opacity-80"><i className="fa fa-camera"></i></button>
                </div>
                 <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                         <Pie data={trainerStats} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                            {trainerStats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}/>
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
             </div>
        </div>
    );
};

export default Statistics;