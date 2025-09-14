import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db.js';

// Generic form for adding/editing a person
const PersonForm = ({ person, onSave, onCancel, entityName }) => {
    const [vorname, setVorname] = useState(person?.vorname || '');
    const [nachname, setNachname] = useState(person?.nachname || '');
    const [externalId, setExternalId] = useState(person?.external_id || '');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!vorname || !nachname) {
            alert('Vorname und Nachname sind Pflichtfelder.');
            return;
        }
        onSave({ vorname, nachname, external_id: externalId });
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-background rounded-lg space-y-4 mt-4">
            <h3 className="text-lg font-bold text-white">{person ? `${entityName} bearbeiten` : `Neue/r ${entityName} hinzufügen`}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <label className="block mb-1 font-medium">Vorname</label>
                    <input type="text" value={vorname} onChange={e => setVorname(e.target.value)} required className="w-full bg-background border border-gray-600 rounded-md px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"/>
                </div>
                <div>
                    <label className="block mb-1 font-medium">Nachname</label>
                    <input type="text" value={nachname} onChange={e => setNachname(e.target.value)} required className="w-full bg-background border border-gray-600 rounded-md px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"/>
                </div>
            </div>
            <div>
                <label className="block mb-1 font-medium">Externe ID (Optional)</label>
                <input type="text" value={externalId} onChange={e => setExternalId(e.target.value)} className="w-full bg-background border border-gray-600 rounded-md px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"/>
            </div>
            <div className="flex justify-end space-x-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-secondary text-white rounded-md hover:bg-opacity-80">Abbrechen</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-80">Speichern</button>
            </div>
        </form>
    );
};


// Generic component to manage a list of persons
const PersonManager = ({ title, people, onAdd, onUpdate, onDelete, entityName }) => {
    const [editingPerson, setEditingPerson] = useState(null);
    const [isAdding, setIsAdding] = useState(false);

    const handleSave = async (personData) => {
        if (editingPerson && editingPerson.id) {
            await onUpdate(editingPerson.id, personData);
        } else {
            await onAdd(personData);
        }
        setEditingPerson(null);
        setIsAdding(false);
    };

    const handleDelete = async (id) => {
        if (window.confirm(`Sind Sie sicher, dass Sie diese/n ${entityName} löschen möchten? Dies kann nicht rückgängig gemacht werden.`)) {
            await onDelete(id);
        }
    };
    
    const openAddForm = () => {
        setEditingPerson(null);
        setIsAdding(true);
    };

    const openEditForm = (person) => {
        setIsAdding(false);
        setEditingPerson(person);
    };

    const closeForm = () => {
        setIsAdding(false);
        setEditingPerson(null);
    };


    return (
        <div className="bg-surface p-4 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">{title}</h2>
                <button onClick={openAddForm} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-80 transition flex items-center">
                    <i className="fa fa-plus mr-2"></i> Hinzufügen
                </button>
            </div>
            
            {(isAdding || editingPerson) && (
                <PersonForm
                    person={editingPerson}
                    onSave={handleSave}
                    onCancel={closeForm}
                    entityName={entityName}
                />
            )}
            
            <div className="overflow-x-auto mt-4">
                <table className="w-full text-left">
                    <thead className="border-b border-gray-600">
                        <tr>
                            <th className="p-3">Nachname</th>
                            <th className="p-3">Vorname</th>
                            <th className="p-3">Externe ID</th>
                            <th className="p-3 text-right">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {people?.map(p => (
                            <tr key={p.id} className="border-b border-gray-700 hover:bg-background">
                                <td className="p-3">{p.nachname}</td>
                                <td className="p-3">{p.vorname}</td>
                                <td className="p-3">{p.external_id || '-'}</td>
                                <td className="p-3 text-right space-x-2">
                                    <button onClick={() => openEditForm(p)} className="text-primary hover:text-opacity-80 p-1"><i className="fa fa-pencil"></i></button>
                                    <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-400 p-1"><i className="fa fa-trash"></i></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Main Management component
const Management = () => {
    const members = useLiveQuery(() => db.members.orderBy('nachname').toArray(), []);
    const trainers = useLiveQuery(() => db.trainers.orderBy('nachname').toArray(), []);

    const handleAddMember = async (member) => {
        await db.members.add(member);
    };
    const handleUpdateMember = async (id, updates) => {
        await db.members.update(id, updates);
    };
    const handleDeleteMember = async (id) => {
        // Also delete attendances for this member to keep data clean
        await db.transaction('rw', db.members, db.attendances, async () => {
            await db.attendances.where('member_id').equals(id).delete();
            await db.members.delete(id);
        });
    };

    const handleAddTrainer = async (trainer) => {
        await db.trainers.add(trainer);
    };
    const handleUpdateTrainer = async (id, updates) => {
        await db.trainers.update(id, updates);
    };
    const handleDeleteTrainer = async (id) => {
        const usage = await db.trainings.where('trainer1_id').equals(id).or('trainer2_id').equals(id).count();
        if (usage > 0) {
            alert('Dieser Trainer kann nicht gelöscht werden, da er noch Trainingseinheiten zugeordnet ist.');
            return;
        }
        await db.trainers.delete(id);
    };

    return (
        <div className="space-y-6">
            <PersonManager
                title="Mitglieder verwalten"
                people={members}
                onAdd={handleAddMember}
                onUpdate={handleUpdateMember}
                onDelete={handleDeleteMember}
                entityName="Mitglied"
            />
            <PersonManager
                title="Trainer verwalten"
                people={trainers}
                onAdd={handleAddTrainer}
                onUpdate={handleUpdateTrainer}
                onDelete={handleDeleteTrainer}
                entityName="Trainer"
            />
        </div>
    );
};

export default Management;