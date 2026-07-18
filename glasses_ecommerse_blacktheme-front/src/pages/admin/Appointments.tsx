import React, { useEffect, useState } from 'react'
import { appointments, getToken } from '@/lib/api'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Calendar, Clock, User, Phone, MapPin, Eye, Search, Filter, CheckCircle2, XCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { format } from 'date-fns'

const AppointmentsPage: React.FC = () => {
  const [appointmentList, setAppointmentList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const token = getToken()

  useEffect(() => {
    fetchAppointments()
  }, [])

  async function fetchAppointments() {
    try {
      setLoading(true)
      const data = await appointments.list({}, token)
      setAppointmentList(data)
    } catch (error) {
      console.error('Failed to fetch appointments:', error)
      toast.error('Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (id: string, newStatus: 'confirmed' | 'cancelled' | 'completed') => {
    try {
      await appointments.updateStatus(id, newStatus, token)
      toast.success(`Appointment successfully ${newStatus === 'confirmed' ? 'confirmed' : newStatus === 'cancelled' ? 'cancelled' : 'completed'}`)
      
      setAppointmentList(prev => prev.map(app => app._id === id ? { ...app, status: newStatus } : app))
      setSelectedAppointment(prev => prev && prev._id === id ? { ...prev, status: newStatus } : prev)
      setIsDetailsOpen(false)
    } catch (error: any) {
      console.error(`Failed to update appointment status to ${newStatus}:`, error)
      toast.error(error.message || 'Failed to update status')
    }
  }

  const filteredAppointments = appointmentList.filter(app => 
    app.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.customerPhone.includes(searchTerm) ||
    app.storeId?.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'completed': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      default: return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
    }
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-playfair">Store Appointments</h1>
          <p className="text-slate-500 text-sm mt-1">Manage customer bookings for all locations.</p>
        </div>
        
        <div className="flex w-full md:w-auto gap-3">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search by name, phone or store..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 bg-white border-slate-200"
            />
          </div>
          <Button variant="outline" onClick={fetchAppointments} className="h-10">
            Refresh
          </Button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-bold text-slate-700">Customer</TableHead>
              <TableHead className="font-bold text-slate-700">Store</TableHead>
              <TableHead className="font-bold text-slate-700">Date & Time</TableHead>
              <TableHead className="font-bold text-slate-700">Reason</TableHead>
              <TableHead className="font-bold text-slate-700">Status</TableHead>
              <TableHead className="text-right font-bold text-slate-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-slate-400">Loading appointments...</TableCell>
              </TableRow>
            ) : filteredAppointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-slate-400">No appointments found.</TableCell>
              </TableRow>
            ) : (
              filteredAppointments.map((app) => (
                <TableRow key={app._id} className="hover:bg-slate-50/80 transition-colors">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{app.customerName}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {app.customerPhone}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-slate-700 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {app.storeId?.name || 'Unknown Store'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{format(new Date(app.appointmentDate), 'dd MMM yyyy')}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {app.timeSlot}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-[10px] py-1 px-2 rounded-md bg-slate-100 text-slate-600 font-black uppercase tracking-widest border border-slate-200">
                      {app.reason || 'Eye Test'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${getStatusColor(app.status)} capitalize border px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-black`}>
                      {app.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => {
                        setSelectedAppointment(app)
                        setIsDetailsOpen(true)
                      }}
                      className="hover:bg-blue-50 text-blue-600"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-bold font-playfair">Appointment Details</DialogTitle>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Customer</p>
                  <p className="font-bold text-slate-900">{selectedAppointment.customerName}</p>
                  <p className="text-sm text-slate-500">{selectedAppointment.customerPhone}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Status</p>
                  <Badge className={`${getStatusColor(selectedAppointment.status)} border rounded-md uppercase text-[10px] px-2`}>
                    {selectedAppointment.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900">{format(new Date(selectedAppointment.appointmentDate), 'EEEE, dd MMMM yyyy')}</p>
                    <p className="text-sm text-slate-500 italic">Scheduled visit date</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900">{selectedAppointment.timeSlot}</p>
                    <p className="text-sm text-slate-500 italic">Preferred time slot</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900">{selectedAppointment.storeId?.name}</p>
                    <p className="text-sm text-slate-500 italic">Lenzora Outlet Store</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-amber-50 p-3 rounded-lg border border-amber-100">
                  <Eye className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-black text-amber-900 uppercase text-[10px] tracking-widest leading-none mb-1">Reason for Visit</p>
                    <p className="font-bold text-amber-700">{selectedAppointment.reason || 'Eye Test'}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={() => handleUpdateStatus(selectedAppointment._id, 'confirmed')}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-11"
                >
                  <CheckCircle2 className="w-4 h-4" /> Confirm Visit
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleUpdateStatus(selectedAppointment._id, 'cancelled')}
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50 gap-2 h-11"
                >
                  <XCircle className="w-4 h-4" /> Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AppointmentsPage
