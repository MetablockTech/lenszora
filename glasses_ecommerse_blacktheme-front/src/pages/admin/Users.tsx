import React, { useEffect, useState } from 'react'
import { users, getToken } from '@/lib/api'
import { toast } from '@/hooks/use-toast'
import {
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  Calendar,
  MoreVertical,
  Trash2,
  Loader2,
  Search,
  Filter,
  Store,
  Headphones,
  RotateCcw
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button'

interface User {
  _id: string
  name?: string
  email?: string
  phone?: string
  role: 'admin' | 'user' | 'vendor' | 'agent' | string
  createdAt: string
}

const UsersPage: React.FC = () => {
  const [userList, setUserList] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await users.getAll(getToken())
      setUserList(data || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch users',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await users.updateRole(userId, newRole, getToken())
      toast({
        title: 'Success',
        description: `User role updated to ${newRole}`,
      })
      fetchUsers()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update role',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteUserId) return
    try {
      await users.delete(deleteUserId, getToken())
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      })
      fetchUsers()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        variant: 'destructive'
      })
    } finally {
      setDeleteUserId(null)
    }
  }

  // Role Counts
  const roleCounts = {
    all: userList.length,
    user: userList.filter(u => u.role === 'user').length,
    vendor: userList.filter(u => u.role === 'vendor').length,
    agent: userList.filter(u => u.role === 'agent').length,
    admin: userList.filter(u => u.role === 'admin').length,
  }

  const filteredUsers = userList.filter(user => {
    const matchesSearch =
      (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.phone && user.phone.includes(searchTerm))

    const matchesRole = selectedRole === 'all' || user.role === selectedRole

    return matchesSearch && matchesRole
  })

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const paginatedList = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const renderRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Shield className="h-3.5 w-3.5" />
            Admin
          </span>
        )
      case 'vendor':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Store className="h-3.5 w-3.5" />
            Vendor
          </span>
        )
      case 'agent':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <Headphones className="h-3.5 w-3.5" />
            Agent
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <UserIcon className="h-3.5 w-3.5" />
            Customer
          </span>
        )
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Users</h1>
          <p className="text-slate-500 mt-1">Manage user accounts, filter by role (User, Vendor, Agent, Admin), and update permissions.</p>
        </div>
      </div>

      {/* Role Pill Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Role Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'All Users', count: roleCounts.all },
              { id: 'user', label: 'Customers', count: roleCounts.user },
              { id: 'vendor', label: 'Vendors', count: roleCounts.vendor },
              { id: 'agent', label: 'Agents', count: roleCounts.agent },
              { id: 'admin', label: 'Admins', count: roleCounts.admin },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setSelectedRole(tab.id); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${selectedRole === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedRole === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg w-full text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-4" />
            <p className="text-slate-500 text-sm">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <UserIcon className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-slate-700 font-semibold">No users found</p>
            <p className="text-slate-400 text-xs mt-1">Try adjusting your role filter or search term.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">User Details</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginatedList.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                          {user.name ? user.name[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : 'U')}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">{user.name || 'Unnamed User'}</div>
                          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 mt-0.5">
                            {user.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3 text-slate-400" />
                                {user.email}
                              </span>
                            )}
                            {user.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3 text-slate-400" />
                                {user.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {renderRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="p-2 hover:bg-slate-100 rounded-lg transition-colors outline-none cursor-pointer">
                          <MoreVertical className="h-5 w-5 text-slate-500" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 bg-white border border-slate-200 shadow-md">
                          <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Change Role
                          </DropdownMenuLabel>

                          {['user', 'vendor', 'agent', 'admin'].map((r) => (
                            <DropdownMenuItem
                              key={r}
                              disabled={user.role === r}
                              onClick={() => handleUpdateRole(user._id, r)}
                              className="cursor-pointer capitalize text-xs hover:bg-slate-100 flex items-center justify-between"
                            >
                              <span>Set as {r === 'user' ? 'Customer' : r}</span>
                              {user.role === r && <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded">Current</span>}
                            </DropdownMenuItem>
                          ))}

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => setDeleteUserId(user._id)}
                            className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50 hover:bg-red-50 text-xs"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {filteredUsers.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
                <div className="text-xs text-slate-500">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 text-xs"
                  >
                    Previous
                  </Button>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={`text-xs ${currentPage === page ? "bg-blue-600 text-white" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account
              and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default UsersPage
