
"use client";

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface UserProfile {
    uid: string;
    displayName: string;
    email: string;
    status: 'pending' | 'verified' | 'blocked';
    uniqueId: string | null;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const q = query(collection(db, 'users'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const usersData: UserProfile[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                usersData.push({ uid: doc.id, ...data } as UserProfile);
            });
            setUsers(usersData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const getStatusBadgeVariant = (status: 'pending' | 'verified' | 'blocked') => {
        switch (status) {
            case 'verified':
                return 'default';
            case 'pending':
                return 'secondary';
            case 'blocked':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    const handleManageUser = (userId: string) => {
        router.push(`/admin/users/${userId}`);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Registered Users</CardTitle>
                    <CardDescription>Manage user verification, status, and content access.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p>Loading users...</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.uid}>
                                        <TableCell>{user.displayName}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(user.status)}>
                                                {user.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => handleManageUser(user.uid)}
                                            >
                                               Manage User
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
