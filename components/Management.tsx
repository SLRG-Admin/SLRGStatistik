
import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Member, Trainer, Training } from '../types';
import Papa from 'papaparse';


type ManagementView = 'members' | 'trainers' | 'import' | 'settings';

const Management: React.FC = () => {
    const [view, setView] = useState<ManagementView>('members');
    
    const ViewButton: React.FC<{ viewName: ManagementView; label: string; icon: string }> = ({ viewName, label, icon }) => (
        <button
            onClick={() => setView(viewName)}
            className={`px-4 py-2 rounded-md transition flex items-center space-x-2 ${
                view === viewName
                ? 'bg-primary text-white'
                : 'bg-surface hover:bg-opacity-80 text-on-surface'
            }`}
        >
           <i className={`fa ${icon}`}></i>
           <span>{label}</span>
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="bg-surface p-2 rounded-lg shadow-lg flex flex-wrap justify-center sm:justify-start gap-2">
                <ViewButton viewName="members" label="Mitglieder" icon="fa-users" />
                <ViewButton viewName="trainers" label="Trainer" icon="fa-user-tie" />
                <ViewButton viewName="import" label="CSV Import" icon="fa-file-import" />
                <ViewButton viewName="settings" label="Einstellungen" icon="fa-cog" />
            </div>

            {view === 'members' && <MemberManagement />}
            {view === 'trainers' && <TrainerManagement />}
            {view === 'import' && <CsvImport />}
            {view === 'settings' && <SettingsManagement />}
        </div>
    );
};


const MemberManagement: React.FC = () => {
    const [isFormOpen, setFormOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const members = useLiveQuery(() => 
        db.members.filter(m => 
            m.vorname.toLowerCase().includes(searchTerm.toLowerCase()) || 
            m.nachname.toLowerCase().includes(searchTerm.toLowerCase())
        ).sortBy('nachname'), 
    [searchTerm]);

    const handleAdd = () => {
        setEditingMember(null);
        setFormOpen(true);
    };

    const handleEdit = (member: Member) => {
        setEditingMember(member);
        setFormOpen(true);
    };

    const handleDelete = async (id: number) => {
        if(window.confirm("Möchten Sie dieses Mitglied wirklich löschen? Alle zugehörigen Anwesenheitsdaten gehen verloren.")){
            await db.members.delete(id);
            await db.attendances.where('member_id').equals(id).delete();
        }
    };
    
    const handleSave = async (member: Member) => {
        if(member.id){
            await db.members.update(member.id, member);
        } else {
            await db.members.add(member);
        }
        setFormOpen(false);
    };

    return (
        <div className="bg-surface p-4 rounded-lg shadow-lg">
             <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <h2 className="text-xl font-bold text-white">Mitglieder verwalten</h2>
                 <input
                    type="text"
                    placeholder="Suchen..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full sm:w-64 bg-background border border-gray-600 rounded-md px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                />
                <button onClick={handleAdd} className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-80 transition flex items-center justify-center">
                    <i className="fa fa-plus mr-2"></i> Mitglied hinzufügen
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                     <thead className="border-b border-gray-600">
                        <tr>
                            <th className="p-3">Nachname</th>
                            <th className="p-3">Vorname</th>
                            <th className="p-3 text-right">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {members?.map(m => (
                            <tr key={m.id} className="border-b border-gray-700 hover:bg-background">
                                <td className="p-3">{m.nachname}</td>
                                <td className="p-3">{m.vorname}</td>
                                <td className="p-3 text-right space-x-2">
                                    <button onClick={() => handleEdit(m)} className="text-blue-400 hover:text-blue-300 p-1"><i className="fa fa-edit"></i></button>
                                    <button onClick={() => handleDelete(m.id!)} className="text-red-400 hover:text-red-300 p-1"><i className="fa fa-trash"></i></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             {isFormOpen && <PersonFormModal person={editingMember} onSave={handleSave} onClose={() => setFormOpen(false)} title={editingMember ? 'Mitglied bearbeiten' : 'Neues Mitglied'} />}
        </div>
    );
};


const TrainerManagement: React.FC = () => {
    const [isFormOpen, setFormOpen] = useState(false);
    const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const trainers = useLiveQuery(() => 
        db.trainers.filter(t => 
            t.vorname.toLowerCase().includes(searchTerm.toLowerCase()) || 
            t.nachname.toLowerCase().includes(searchTerm.toLowerCase())
        ).sortBy('nachname'), 
    [searchTerm]);
    
    const handleAdd = () => {
        setEditingTrainer(null);
        setFormOpen(true);
    };

    const handleEdit = (trainer: Trainer) => {
        setEditingTrainer(trainer);
        setFormOpen(true);
    };

    const handleDelete = async (id: number) => {
        if(window.confirm("Möchten Sie diesen Trainer wirklich löschen?")){
            await db.trainers.delete(id);
        }
    };
    
    const handleSave = async (trainer: Trainer) => {
        if(trainer.id){
            await db.trainers.update(trainer.id, trainer);
        } else {
            await db.trainers.add(trainer);
        }
        setFormOpen(false);
    };

    return (
        <div className="bg-surface p-4 rounded-lg shadow-lg">
             <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <h2 className="text-xl font-bold text-white">Trainer verwalten</h2>
                <input
                    type="text"
                    placeholder="Suchen..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full sm:w-64 bg-background border border-gray-600 rounded-md px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                />
                <button onClick={handleAdd} className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-80 transition flex items-center justify-center">
                    <i className="fa fa-plus mr-2"></i> Trainer hinzufügen
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                     <thead className="border-b border-gray-600">
                        <tr>
                            <th className="p-3">Nachname</th>
                            <th className="p-3">Vorname</th>
                            <th className="p-3 text-right">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trainers?.map(t => (
                            <tr key={t.id} className="border-b border-gray-700 hover:bg-background">
                                <td className="p-3">{t.nachname}</td>
                                <td className="p-3">{t.vorname}</td>
                                <td className="p-3 text-right space-x-2">
                                    <button onClick={() => handleEdit(t)} className="text-blue-400 hover:text-blue-300 p-1"><i className="fa fa-edit"></i></button>
                                    <button onClick={() => handleDelete(t.id!)} className="text-red-400 hover:text-red-300 p-1"><i className="fa fa-trash"></i></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isFormOpen && <PersonFormModal person={editingTrainer} onSave={handleSave} onClose={() => setFormOpen(false)} title={editingTrainer ? 'Trainer bearbeiten' : 'Neuer Trainer'} />}
        </div>
    );
};


const PersonFormModal: React.FC<{
    person: Member | Trainer | null;
    onSave: (person: Member | Trainer) => void;
    onClose: () => void;
    title: string;
}> = ({ person, onSave, onClose, title }) => {
    const [vorname, setVorname] = useState(person?.vorname || '');
    const [nachname, setNachname] = useState(person?.nachname || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...person, vorname, nachname });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSubmit} className="bg-surface rounded-lg shadow-2xl w-full max-w-md">
                <div className="p-6 border-b border-gray-600">
                    <h3 className="text-2xl font-bold text-white">{title}</h3>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block mb-1 font-medium">Vorname</label>
                        <input type="text" value={vorname} onChange={e => setVorname(e.target.value)} required className="w-full bg-background border border-gray-600 rounded-md px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"/>
                    </div>
                    <div>
                        <label className="block mb-1 font-medium">Nachname</label>
                        <input type="text" value={nachname} onChange={e => setNachname(e.target.value)} required className="w-full bg-background border border-gray-600 rounded-md px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"/>
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

const CsvImport = () => {
    const [report, setReport] = useState<string[]>([]);
    
    const handleFileUpload = <T,>(file: File, processor: (data: any[]) => Promise<string[]>) => {
        if (!file) return;
        setReport(['Verarbeite...']);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const importReport = await processor(results.data);
                setReport(importReport);
            },
            error: (err: any) => {
                setReport([`Fehler beim Parsen der Datei: ${err.message}`]);
            }
        });
    };

    const processMembers = async (data: any[]): Promise<string[]> => {
        let imported = 0, skipped = 0;
        const errors: string[] = [];
        for (const [index, row] of data.entries()) {
            if (!row.Vorname || !row.Nachname) {
                skipped++;
                errors.push(`Zeile ${index + 2}: Vor- oder Nachname fehlt.`);
                continue;
            }
            const existing = await db.members.where('external_id').equals(row.ID).first();
            if (existing) {
                 if (window.confirm(`Mitglied mit ID ${row.ID} existiert bereits. Überschreiben?`)) {
                    await db.members.update(existing.id!, { vorname: row.Vorname, nachname: row.Nachname, external_id: row.ID });
                    imported++;
                } else {
                    skipped++;
                }
            } else {
                await db.members.add({ vorname: row.Vorname, nachname: row.Nachname, external_id: row.ID });
                imported++;
            }
        }
        return [`Mitglieder: ${imported} importiert, ${skipped} übersprungen.`, ...errors];
    };
    
     const processTrainers = async (data: any[]): Promise<string[]> => {
        let imported = 0, skipped = 0;
        const errors: string[] = [];
        for (const [index, row] of data.entries()) {
            if (!row.Vorname || !row.Nachname) {
                skipped++;
                errors.push(`Zeile ${index + 2}: Vor- oder Nachname fehlt.`);
                continue;
            }
            const existing = await db.trainers.where('external_id').equals(row.ID).first();
            if (existing) {
                 if (window.confirm(`Trainer mit ID ${row.ID} existiert bereits. Überschreiben?`)) {
                    await db.trainers.update(existing.id!, { vorname: row.Vorname, nachname: row.Nachname, external_id: row.ID });
                    imported++;
                } else {
                    skipped++;
                }
            } else {
                await db.trainers.add({ vorname: row.Vorname, nachname: row.Nachname, external_id: row.ID });
                imported++;
            }
        }
        return [`Trainer: ${imported} importiert, ${skipped} übersprungen.`, ...errors];
    };

    const processTrainings = async (data: any[]): Promise<string[]> => {
        let imported = 0, skipped = 0;
        const errors: string[] = [];
        for (const [index, row] of data.entries()) {
            if (!row.Datum || !row.Thema || !row.Trainer1) {
                skipped++;
                errors.push(`Zeile ${index + 2}: Datum, Thema oder Trainer1 fehlt.`);
                continue;
            }

            const trainer1 = await db.trainers.where('external_id').equals(row.Trainer1).first();
            if (!trainer1) {
                skipped++;
                errors.push(`Zeile ${index + 2}: Trainer1 mit ID ${row.Trainer1} nicht gefunden.`);
                continue;
            }

            let trainer2: Trainer | undefined;
            if (row.Trainer2) {
                trainer2 = await db.trainers.where('external_id').equals(row.Trainer2).first();
                if (!trainer2) {
                    skipped++;
                    errors.push(`Zeile ${index + 2}: Trainer2 mit ID ${row.Trainer2} nicht gefunden.`);
                    continue;
                }
            }
            
            const trainingData: Training = {
                datum: row.Datum,
                thema: row.Thema,
                trainer1_id: trainer1.id!,
                trainer2_id: trainer2 ? trainer2.id : undefined,
                external_id: row.ID,
            }

            const existing = await db.trainings.where('external_id').equals(row.ID).first();
            if(existing) {
                if (window.confirm(`Training mit ID ${row.ID} existiert bereits. Überschreiben?`)) {
                     await db.trainings.update(existing.id!, trainingData);
                     imported++;
                } else {
                    skipped++;
                }
            } else {
                await db.trainings.add(trainingData);
                imported++;
            }
        }
        return [`Trainings: ${imported} importiert, ${skipped} übersprungen.`, ...errors];
    };


    const FileInput: React.FC<{label: string; onFileSelect: (file: File) => void}> = ({ label, onFileSelect }) => (
         <div className="flex flex-col space-y-2">
            <label className="font-medium">{label}</label>
            <input 
                type="file"
                accept=".csv"
                onChange={(e) => e.target.files && onFileSelect(e.target.files[0])}
                className="block w-full text-sm text-on-surface file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-opacity-80"
            />
        </div>
    );

    return (
        <div className="bg-surface p-4 rounded-lg shadow-lg space-y-6">
            <h2 className="text-xl font-bold text-white">CSV-Daten importieren</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FileInput label="Mitglieder (mitglieder.csv)" onFileSelect={(file) => handleFileUpload(file, processMembers)} />
                <FileInput label="Trainer (trainer.csv)" onFileSelect={(file) => handleFileUpload(file, processTrainers)} />
                <FileInput label="Trainings (trainings.csv)" onFileSelect={(file) => handleFileUpload(file, processTrainings)} />
            </div>
            {report.length > 0 && (
                 <div className="mt-6 bg-background p-4 rounded-md">
                    <h3 className="font-bold mb-2">Import-Bericht</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                        {report.map((msg, i) => <li key={i}>{msg}</li>)}
                    </ul>
                </div>
            )}
        </div>
    );
};

const SettingsManagement: React.FC = () => {
    const logoSetting = useLiveQuery(() => db.settings?.get('logo'), []);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    // Effect to sync preview with database value
    useEffect(() => {
        setLogoPreview(logoSetting?.value || null);
    }, [logoSetting]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 200 * 1024) { // 200 KB
                alert('Die Datei ist zu groß. Bitte wählen Sie eine Datei unter 200KB.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (logoPreview) {
            await db.settings.put({ key: 'logo', value: logoPreview });
            alert('Logo gespeichert!');
        } else {
            await db.settings.delete('logo');
            alert('Logo entfernt!');
        }
    };

    const handleRemove = async () => {
        if (window.confirm('Möchten Sie das Logo wirklich entfernen?')) {
            await db.settings.delete('logo');
        }
    };

    const hasChanges = logoPreview !== (logoSetting?.value || null);

    return (
        <div className="bg-surface p-4 rounded-lg shadow-lg space-y-6">
            <h2 className="text-xl font-bold text-white">Einstellungen</h2>
            
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-on-surface">Logo anpassen</h3>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-32 h-32 bg-background rounded-md flex items-center justify-center border-2 border-dashed border-gray-600 overflow-hidden">
                        {logoPreview ? (
                            <img src={logoPreview} alt="Logo Vorschau" className="max-w-full max-h-full object-contain" />
                        ) : (
                            <span className="text-xs text-gray-400 text-center p-2">Kein Logo festgelegt</span>
                        )}
                    </div>
                    <div className="flex-grow space-y-3">
                           <label htmlFor="logo-upload" className="font-medium">Neues Logo hochladen</label>
                           <p className="text-sm text-on-surface/80 mb-2">Empfohlen: transparentes PNG, max. 200KB</p>
                           <input 
                                id="logo-upload"
                                type="file"
                                accept="image/png, image/jpeg, image/svg+xml"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-on-surface file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-opacity-80"
                           />
                    </div>
                </div>
                 <div className="flex justify-end gap-4 mt-4">
                    <button onClick={handleRemove} disabled={!logoSetting} className="px-4 py-2 bg-secondary text-white rounded-md hover:bg-opacity-80 transition disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center">
                        <i className="fa fa-trash mr-2"></i> Entfernen
                    </button>
                    <button onClick={handleSave} disabled={!hasChanges} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-80 transition disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center">
                       <i className="fa fa-save mr-2"></i> Speichern
                    </button>
                </div>
            </div>
        </div>
    );
};


export default Management;
