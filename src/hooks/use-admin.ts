
"use client";
import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';

// This is a placeholder for a real admin check.
// In a production app, this should be replaced with a check for a custom claim on the user's ID token.
// For now, we'll check if the user's email matches the admin email.
const ADMIN_EMAIL = "desireddit4us@private.local";

export function useAdmin() {
    const { user, loading: authLoading } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) {
            return;
        }

        if (user) {
            // In a real app, you would get the ID token and check for a custom claim:
            // user.getIdTokenResult().then(idTokenResult => {
            //     setIsAdmin(!!idTokenResult.claims.admin);
            // });
            setIsAdmin(user.email === ADMIN_EMAIL);
        } else {
            setIsAdmin(false);
        }
        setLoading(false);
    }, [user, authLoading]);

    return { isAdmin, loading };
}
