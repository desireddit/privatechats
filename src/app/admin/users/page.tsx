// src/app/admin/users/page.tsx

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getAllUsers } from "@/app/actions"; // We will add this function next

// Define a type for our user data for type safety
export type User = {
  id: string;
  name: string;
  redditUsername: string;
  status: "pending" | "verified" | "blocked";
  createdAt: string;
};

export default async function AdminUsersPage() {
  const users: User[] = await getAllUsers();

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>
          A list of all users who have registered on the platform.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Display Name</TableHead>
              <TableHead>Reddit Username</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date Registered</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.redditUsername}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      user.status === "verified"
                        ? "default"
                        : user.status === "pending"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}