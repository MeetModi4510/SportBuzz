import { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Shield, User, UserCog, Trash2, Mail, MapPin } from "lucide-react";
import { adminApi } from "@/services/api";
import { toast } from "sonner";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserData {
  _id: string;
  fullName: string;
  email: string;
  role: 'user' | 'admin' | 'scorer';
  location?: string;
  createdAt: string;
}

export const UserManager = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response: any = await adminApi.getUsers();
      if (response.success) {
        setUsers(response.data.users);
      }
    } catch (error: any) {
      console.error("Failed to fetch users:", error);
      const message = error.response?.data?.message || error.message || "Failed to load users";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await adminApi.updateRole(userId, newRole);
      toast.success(`Role updated to ${newRole}`);
      fetchUsers();
    } catch (error) {
      toast.error("Failed to update role");
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteId) return;
    try {
      await adminApi.deleteUser(deleteId);
      toast.success("User deleted successfully");
      setDeleteId(null);
      fetchUsers();
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-500 hover:bg-red-600"><Shield className="w-3 h-3 mr-1" /> Admin</Badge>;
      case 'scorer':
        return <Badge className="bg-purple-500 hover:bg-purple-600"><UserCog className="w-3 h-3 mr-1" /> Scorer</Badge>;
      default:
        return <Badge variant="secondary"><User className="w-3 h-3 mr-1" /> User</Badge>;
    }
  };

  if (isLoading && users.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-800">
            <TableRow>
              <TableHead className="text-slate-300">Name</TableHead>
              <TableHead className="text-slate-300">Email</TableHead>
              <TableHead className="text-slate-300">Role</TableHead>
              <TableHead className="text-slate-300">Joined</TableHead>
              <TableHead className="text-right text-slate-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id} className="border-slate-800 hover:bg-slate-800/50">
                <TableCell>
                  <div className="font-medium text-white">{user.fullName}</div>
                  {user.location && (
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin size={10} /> {user.location}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-slate-400">
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-slate-500" />
                    {user.email}
                  </div>
                </TableCell>
                <TableCell>
                  {getRoleBadge(user.role)}
                </TableCell>
                <TableCell className="text-slate-400 text-sm">
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-white">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700 text-slate-300">
                      <DropdownMenuItem 
                        onClick={() => handleRoleChange(user._id, 'admin')}
                        className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer"
                      >
                        Make Admin
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleRoleChange(user._id, 'scorer')}
                        className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer"
                      >
                        Make Scorer
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleRoleChange(user._id, 'user')}
                        className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer"
                      >
                        Make Regular User
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-700" />
                      <DropdownMenuItem 
                        onClick={() => setDeleteId(user._id)}
                        className="text-red-400 hover:bg-red-900/20 focus:bg-red-900/20 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This action cannot be undone. This will permanently delete the user account
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
