
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAnnouncements, addAnnouncement, getHalls } from '../services/storageService';
import { Announcement, UserRole, Hall } from '../types';
import { Loader2, Megaphone, Plus, X, Globe, Building2, User } from 'lucide-react';

const Announcements = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetHallId, setTargetHallId] = useState('ALL');

  const canCreate = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.HALL_MASTER;

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
        const [allAnnouncements, allHalls] = await Promise.all([
            getAnnouncements(),
            getHalls()
        ]);

        setHalls(allHalls);

        // Filter: Show Global (ALL) + Specific Hall for logged in user
        // Admins see everything.
        const filtered = allAnnouncements.filter(a => {
            if (user.role === UserRole.SUPER_ADMIN) return true;
            return a.targetHallId === 'ALL' || a.targetHallId === user.hallId;
        });

        // Sort by date descending
        const sorted = filtered.sort((a, b) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime());
        setAnnouncements(sorted);

    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Pre-select user's hall if they are a Hall Master
    if (user?.role === UserRole.HALL_MASTER && user.hallId) {
        setTargetHallId(user.hallId);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
        const newAnnouncement: Announcement = {
            id: '', // DB generates
            title,
            message,
            senderName: `${user.firstName} ${user.lastName}`,
            senderRole: user.role,
            targetHallId: user.role === UserRole.HALL_MASTER ? user.hallId! : targetHallId,
            datePosted: new Date().toISOString()
        };

        await addAnnouncement(newAnnouncement);
        setShowModal(false);
        setTitle('');
        setMessage('');
        // If admin, reset to ALL, if master keep as is
        if (user.role === UserRole.SUPER_ADMIN) setTargetHallId('ALL');
        
        await loadData();
    } catch (e) {
        alert("Failed to post announcement");
    } finally {
        setIsSubmitting(false);
    }
  };

  const getHallName = (id: string) => {
      if (id === 'ALL') return 'Global Announcement';
      return halls.find(h => h.id === id)?.name || 'Unknown Hall';
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-green-600"/></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Announcements</h1>
            <p className="text-sm text-gray-500">Updates from Administration and Hall Management</p>
        </div>
        {canCreate && (
            <button 
                onClick={() => setShowModal(true)}
                className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            >
                <Plus className="h-4 w-4" /> New Announcement
            </button>
        )}
      </div>

      <div className="grid gap-4">
          {announcements.length === 0 ? (
              <div className="text-center p-12 bg-white rounded-xl border border-dashed border-gray-300">
                  <Megaphone className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No announcements yet.</p>
              </div>
          ) : (
              announcements.map(ann => (
                  <div key={ann.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden">
                      {/* Badge for Scope */}
                      <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-bold uppercase rounded-bl-lg ${
                          ann.targetHallId === 'ALL' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
                      }`}>
                          {ann.targetHallId === 'ALL' ? 'Global' : 'Hall Specific'}
                      </div>

                      <div className="flex items-start gap-4 mb-3">
                          <div className={`p-3 rounded-full shrink-0 ${ann.targetHallId === 'ALL' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                              {ann.targetHallId === 'ALL' ? <Globe className="h-6 w-6" /> : <Building2 className="h-6 w-6" />}
                          </div>
                          <div>
                              <h3 className="text-lg font-bold text-gray-800">{ann.title}</h3>
                              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                  <span className="flex items-center gap-1"><User className="h-3 w-3" /> {ann.senderName} ({ann.senderRole.replace('_', ' ').toLowerCase()})</span>
                                  <span>•</span>
                                  <span>{new Date(ann.datePosted).toLocaleDateString()}</span>
                                  <span>•</span>
                                  <span className="font-medium text-gray-700">To: {getHallName(ann.targetHallId)}</span>
                              </div>
                          </div>
                      </div>
                      
                      <div className="pl-[60px]">
                          <p className="text-gray-600 whitespace-pre-wrap leading-relaxed text-sm">
                              {ann.message}
                          </p>
                      </div>
                  </div>
              ))
          )}
      </div>

      {/* Create Modal */}
      {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg text-gray-800">Post New Announcement</h3>
                      <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-gray-500 hover:text-red-500"/></button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
                          <input 
                            required 
                            type="text" 
                            className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none"
                            placeholder="e.g. End of Semester Meeting"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                          />
                      </div>

                      {user?.role === UserRole.SUPER_ADMIN && (
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target Audience</label>
                              <select 
                                className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none"
                                value={targetHallId}
                                onChange={e => setTargetHallId(e.target.value)}
                              >
                                  <option value="ALL">All Halls (Global)</option>
                                  {halls.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                              </select>
                          </div>
                      )}

                      {user?.role === UserRole.HALL_MASTER && (
                          <div className="p-2 bg-gray-50 text-xs text-gray-500 rounded border border-gray-200">
                              Posting to: <span className="font-bold text-gray-700">{getHallName(user.hallId!)}</span>
                          </div>
                      )}

                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Message</label>
                          <textarea 
                             required
                             className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none h-32"
                             placeholder="Write your announcement details here..."
                             value={message}
                             onChange={e => setMessage(e.target.value)}
                          ></textarea>
                      </div>

                      <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-2.5 rounded flex justify-center items-center"
                      >
                          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post Announcement'}
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Announcements;
