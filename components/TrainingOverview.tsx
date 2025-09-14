import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Training, Member, Trainer, Attendance } from '../types';

// Helper component to render a table of trainings
const TrainingTable: React.FC<{
    trainings: Training[];
    onSelectTraining: (training: Training) => void;
    getTrainerName: (id?: number) => string;
}> = ({ trainings, onSelectTraining, getTrainerName }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-left">
            <thead className="border-b border-gray-600">
                <tr>
                    <th className="p-3">Datum</th>
                    <th className="p-3">Thema</th>
                    <th className="p-3">Trainer</th>
                    <th className="p-3 text-right">Aktion</th>
                </tr>
            </thead>
            <tbody>
                {trainings.map(training => (
                    <tr key={training.id} className="border-b border-gray-700 hover:bg-background">
                        <td className="p-3">{training.datum}</td>
                        <td className="p-3">{training.thema}</td>
                        <td className="p-3">{getTrainerName(training.trainer1_id)}{training.trainer2_id ? `, ${getTrainerName(training.trainer2_id)}` : ''}</td>
                        <td className="p-3 text-right">
                            <button onClick={() => onSelectTraining(training)} className="text-primary hover:text-opacity-80">
                                Anwesenheit
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);


const TrainingOverview: React.FC = () => {
    const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTrainer, setFilterTrainer] = useState<string>('');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');
    
    const allTrainers = useLiveQuery(() => db.trainers.toArray(), []);

    const trainingData = useLiveQuery(async () => {
        // We fetch all trainings and sort them in JS, because Dexie's orderBy
        // would sort the 'DD.MM.YYYY' date string lexicographically, which is incorrect.
        const trainingsArray = await db.trainings.toArray();
        
        const parseDate = (dateStr: string) => {
            const [day, month, year] = dateStr.split('.').map(Number);
            return new Date(year, month - 1, day);
        };
        
        // Sort by date ascending (oldest first)
        trainingsArray.sort((a, b) => parseDate(a.datum).getTime() - parseDate(b.datum).getTime());


        let filtered = trainingsArray;
        
        if (filterDateFrom) {
            const from = parseDate(filterDateFrom.split('-').reverse().join('.'));
            filtered = filtered.filter(t => parseDate(t.datum) >= from);
        }
        if (filterDateTo) {
            const to = parseDate(filterDateTo.split('-').reverse().join('.'));
            filtered = filtered.filter(t => parseDate(t.datum) <= to);
        }

        if(searchTerm) {
            filtered = filtered.filter(t => t.thema.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        if(filterTrainer) {
            const trainerId = parseInt(filterTrainer, 10);
            filtered = filtered.filter(t => t.trainer1_id === trainerId || t.trainer2_id === trainerId);
        }

        const incomplete: Training[] = [];
        const completed: Training[] = [];

        for (const training of filtered) {
            if (training.completed) {
                completed.push(training);
            } else {
                incomplete.push(training);
            }
        }

        return { incomplete, completed };

    }, [searchTerm, filterTrainer, filterDateFrom, filterDateTo]);

    const getTrainerName = (id?: number) => {
        if (!id || !allTrainers) return 'N/A';
        const trainer = allTrainers.find(t => t.id === id);
        return trainer ? `${trainer.vorname} ${trainer.nachname}` : 'Unbekannt';
    };

    const resetFilters = () => {
        setSearchTerm('');
        setFilterTrainer('');
        setFilterDateFrom('');
        setFilterDateTo('');
    };

    return (
        <div className="space-y-6">
            <div className="bg-surface p-4 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold mb-4 text-white">Filter & Suche</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <input
                        type="text"
                        placeholder="Thema suchen..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-background border border-gray-600 rounded-md px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                     <select
                        value={filterTrainer}
                        onChange={e => setFilterTrainer(e.target.value)}
                        className="w-full bg-background border border-gray-600 rounded-md px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                        <option value="">Alle Trainer</option>
                        {allTrainers?.map(t => <option key={t.id} value={t.id}>{t.vorname} {t.nachname}</option>)}
                    </select>
                    <input
                        type="date"
                        value={filterDateFrom}
                        onChange={e => setFilterDateFrom(e.target.value)}
                        className="w-full bg-background border border-gray-600 rounded-md px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                    <input
                        type="date"
                        value={filterDateTo}
                        onChange={e => setFilterDateTo(e.target.value)}
                        className="w-full bg-background border border-gray-600 rounded-md px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                </div>
                 <div className="mt-4 flex justify-end">
                    <button onClick={resetFilters} className="px-4 py-2 bg-secondary text-white rounded-md hover:bg-opacity-80 transition">Filter zurücksetzen</button>
                </div>
            </div>

            <div className="bg-surface p-4 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">Trainingseinheiten</h2>
                    <button onClick={() => setAddModalOpen(true)} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-80 transition flex items-center">
                        <i className="fa fa-plus mr-2"></i> Neues Training
                    </button>
                </div>
                
                <h3 className="text-lg font-semibold text-white mt-4 mb-2">Anstehende/Offene Trainings</h3>
                {trainingData?.incomplete && trainingData.incomplete.length > 0 ? (
                    <TrainingTable trainings={trainingData.incomplete} onSelectTraining={setSelectedTraining} getTrainerName={getTrainerName} />
                ) : (
                    <p className="text-on-surface/80 p-3 italic">Keine offenen Trainings gefunden.</p>
                )}

                <h3 className="text-lg font-semibold text-white mt-6 mb-2 border-t border-gray-600 pt-4">Abgeschlossene Trainings</h3>
                 {trainingData?.completed && trainingData.completed.length > 0 ? (
                    <TrainingTable trainings={trainingData.completed} onSelectTraining={setSelectedTraining} getTrainerName={getTrainerName} />
                ) : (
                    <p className="text-on-surface/80 p-3 italic">Keine abgeschlossenen Trainings im gefilterten Zeitraum.</p>
                )}
            </div>
            
            {selectedTraining && <AttendanceModal training={selectedTraining} onClose={() => setSelectedTraining(null)} allTrainers={allTrainers || []} />}
            {isAddModalOpen && <TrainingFormModal onClose={() => setAddModalOpen(null)} allTrainers={allTrainers || []} />}
        </div>
    );
};


const AttendanceModal: React.FC<{ training: Training; onClose: () => void; allTrainers: Trainer[] }> = ({ training, onClose, allTrainers }) => {
    const members = useLiveQuery(() => db.members.orderBy('nachname').toArray(), []);
    const [attendees, setAttendees] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (training.id) {
            db.attendances.where('training_id').equals(training.id).toArray().then(atts => {
                setAttendees(new Set(atts.map(a => a.member_id)));
            });
        }
    }, [training.id]);
    
    const getTrainerName = (id?: number) => {
        if (!id) return 'N/A';
        const trainer = allTrainers.find(t => t.id === id);
        return trainer ? `${trainer.vorname} ${trainer.nachname}` : 'Unbekannt';
    };

    const handleToggle = (memberId: number) => {
        const newAttendees = new Set(attendees);
        if (newAttendees.has(memberId)) {
            newAttendees.delete(memberId);
        } else {
            newAttendees.add(memberId);
        }
        setAttendees(newAttendees);
    };

    const handleSelectAll = () => {
        if (members) {
            const allMemberIds = members.map(m => m.id!);
            if (attendees.size === allMemberIds.length) {
                setAttendees(new Set());
            } else {
                setAttendees(new Set(allMemberIds));
            }
        }
    };
    
    const handleSave = async () => {
        if (!training.id) return;
        try {
            await db.transaction('rw', db.attendances, db.trainings, async () => {
                await db.attendances.where('training_id').equals(training.id!).delete();
                if (attendees.size > 0) {
                    const newAttendances: Attendance[] = Array.from(attendees).map((member_id: number) => ({
                        training_id: training.id!,
                        member_id
                    }));
                    await db.attendances.bulkAdd(newAttendances);
                }
                await db.trainings.update(training.id!, { completed: true });
            });
            onClose();
        } catch (error) {
            console.error("Fehler beim Speichern der Anwesenheit:", error);
            alert("Die Anwesenheit konnte nicht gespeichert werden.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-600">
                    <h3 className="text-2xl font-bold text-white">{training.thema}</h3>
                    <p className="text-on-surface/80">{training.datum}</p>
                    <p className="text-on-surface/80">Trainer: {getTrainerName(training.trainer1_id)}{training.trainer2_id ? `, ${getTrainerName(training.trainer2_id)}` : ''}</p>
                </div>
                <div className="p-6 overflow-y-auto flex-grow">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold">Anwesenheit</h4>
                        <button onClick={handleSelectAll} className="px-3 py-1 bg-secondary text-white rounded-md text-sm hover:bg-opacity-80">
                            {members && attendees.size === members.length ? 'Alle abwählen' : 'Alle auswählen'}
                        </button>
                    </div>
                    <ul className="space-y-2">
                        {members?.map(member => (
                            <li key={member.id} className="flex items-center justify-between p-2 rounded-md bg-background">
                                <span>{member.nachname}, {member.vorname}</span>
                                <input 
                                    type="checkbox"
                                    checked={attendees.has(member.id!)}
                                    onChange={() => handleToggle(member.id!)}
                                    className="w-6 h-6 rounded bg-gray-700 border-gray-600 text-primary focus:ring-primary"
                                />
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="p-6 border-t border-gray-600 flex justify-end space-x-4">
                    <button onClick={onClose} className="px-4 py-2 bg-secondary text-white rounded-md hover:bg-opacity-80">Abbrechen</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-80">Speichern</button>
                </div>
            </div>
        </div>
    );
};


const TrainingFormModal: React.FC<{ onClose: () => void; allTrainers: Trainer[] }> = ({ onClose, allTrainers }) => {
    const [datum, setDatum] = useState(new Date().toISOString().split('T')[0]);
    const [thema, setThema] = useState('');
    const [trainer1, setTrainer1] = useState<string>('');
    const [trainer2, setTrainer2] = useState<string>('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!thema || !trainer1) {
            alert('Bitte Thema und mindestens einen Trainer angeben.');
            return;
        }

        const formattedDate = new Date(datum).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        const newTraining: Omit<Training, 'id'> = {
            datum: formattedDate,
            thema,
            trainer1_id: parseInt(trainer1, 10),
            ...(trainer2 && { trainer2_id: parseInt(trainer2, 10) }),
            completed: false
        };
        await db.trainings.add(newTraining as Training);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSubmit} className="bg-surface rounded-lg shadow-2xl w-full max-w-md">
                <div className="p-6 border-b border-gray-600">
                    <h3 className="text-2xl font-bold text-white">Neues Training</h3>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block mb-1 font-medium">Datum</label>
                        <input type="date" value={datum} onChange={e => setDatum(e.target.value)} required className="w-full bg-background border border-gray-600 rounded-md px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"/>
                    </div>
                    <div>
                        <label className="block mb-1 font-medium">Thema</label>
                        <input type="text" value={thema} onChange={e => setThema(e.target.value)} required className="w-full bg-background border border-gray-600 rounded-md px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"/>
                    </div>
                    <div>
                        <label className="block mb-1 font-medium">Trainer 1</label>
                        <select value={trainer1} onChange={e => setTrainer1(e.target.value)} required className="w-full bg-background border border-gray-600 rounded-md px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none">
                            <option value="">Bitte wählen</option>
                            {allTrainers.map(t => <option key={t.id} value={t.id}>{t.vorname} {t.nachname}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block mb-1 font-medium">Trainer 2 (Optional)</label>
                        <select value={trainer2} onChange={e => setTrainer2(e.target.value)} className="w-full bg-background border border-gray-600 rounded-md px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none">
                            <option value="">Kein zweiter Trainer</option>
                            {allTrainers.filter(t => t.id?.toString() !== trainer1).map(t => <option key={t.id} value={t.id}>{t.vorname} {t.nachname}</option>)}
                        </select>
                    </div>
                </div>
                <div className="p-6 border-t border-gray-600 flex justify-end space-x-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-secondary text-white rounded-md hover:bg-opacity-80">Abbrechen</button>
                    <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-80">Speichern</button>
                </div>
            </form>
        </div>
    );
};

export default TrainingOverview;