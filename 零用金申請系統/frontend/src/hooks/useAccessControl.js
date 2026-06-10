import { useState, useCallback, useEffect, useMemo } from 'react';
import axios from 'axios';

export const useAccessControl = (API_BASE) => {
    const [personnel, setPersonnel] = useState([]);
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [activeRole, setActiveRole] = useState(null);

    const fetchAccessData = useCallback(async () => {
        setLoading(true);
        try {
            const [perRes, permRes] = await Promise.all([
                axios.get(`${API_BASE}/personnel`),
                axios.get(`${API_BASE}/permissions`)
            ]);
            setPersonnel(perRes.data);
            setPermissions(permRes.data);
        } catch (err) {
            console.error('Fetch Access Data Error:', err);
        } finally {
            setLoading(false);
        }
    }, [API_BASE]);

    useEffect(() => {
        fetchAccessData();
    }, [fetchAccessData]);

    const saveUser = async (userData) => {
        try {
            if (userData.id) {
                await axios.put(`${API_BASE}/personnel/${userData.id}`, userData);
            } else {
                await axios.post(`${API_BASE}/personnel`, userData);
            }
            fetchAccessData();
            return { success: true };
        } catch (err) {
            return { success: false, error: err.response?.data?.error || err.message };
        }
    };

    const deleteUser = async (id) => {
        if (!window.confirm('確定要刪除此人員嗎？')) return;
        try {
            await axios.delete(`${API_BASE}/personnel/${id}`);
            fetchAccessData();
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    const saveRolePermissions = async (role, perms) => {
        try {
            await axios.post(`${API_BASE}/permissions`, { role, permissions: perms });
            fetchAccessData();
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    return useMemo(() => ({
        personnel,
        permissions,
        loading,
        activeRole,
        setActiveRole,
        fetchAccessData,
        saveUser,
        deleteUser,
        saveRolePermissions
    }), [personnel, permissions, loading, activeRole, fetchAccessData]);
};
