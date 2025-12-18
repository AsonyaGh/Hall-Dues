
import React, { useState, useEffect } from 'react';
import { getPrograms } from '../services/storageService';
import { AcademicProgram } from '../types';
import { Loader2, BookOpen } from 'lucide-react';

const ProgramsList = () => {
  const [programs, setPrograms] = useState<AcademicProgram[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
        const p = await getPrograms();
        setPrograms(p);
        setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-green-600"/></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800">Academic Programs</h1>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                    <th className="px-6 py-3">Code</th>
                    <th className="px-6 py-3">Program Name</th>
                    <th className="px-6 py-3">Duration</th>
                </tr>
            </thead>
            <tbody>
                {programs.map(prog => (
                    <tr key={prog.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-6 py-4 font-bold text-green-700">{prog.code}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{prog.name}</td>
                        <td className="px-6 py-4 text-gray-500">{prog.durationYears} Years</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProgramsList;
