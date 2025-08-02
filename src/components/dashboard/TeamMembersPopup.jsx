// src/components/dashboard/TeamMembersPopup.jsx
import { useState, useEffect } from 'react';
import { X, Users, Mail, Calendar, Crown, User } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';

export function TeamMembersPopup({ isOpen, onClose }) {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTeamMembers();
    }
  }, [isOpen]);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const token = Cookies.get('token');
      const response = await axios.get('/api/auth/team-members', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeamMembers(response.data?.teamMembers || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Team Members</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {teamMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    member.role === 'Admin' ? 'bg-purple-100' : 'bg-blue-100'
                  }`}>
                    <span className={`font-medium ${
                      member.role === 'Admin' ? 'text-purple-600' : 'text-blue-600'
                    }`}>
                      {member.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{member.name}</h3>
                      {member.role === 'Admin' && (
                        <Crown className="h-4 w-4 text-purple-600" />
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        member.role === 'Admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {member.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Mail className="h-3 w-3" />
                      {member.email}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    member.status === 'Active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {member.status}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <Calendar className="h-3 w-3" />
                    {member.joinedAt && !isNaN(new Date(member.joinedAt)) 
                      ? new Date(member.joinedAt).toLocaleDateString()
                      : 'N/A'
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
