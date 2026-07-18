import React, { useEffect, useState } from 'react'
import { appointments, getToken, getUser } from '@/lib/api'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Calendar, Clock, Phone, MapPin, Eye, Search, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

const VendorAppointmentsPage: React.FC = () => {
  const [appointmentList, setAppointmentList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const token = getToken()
  const user = getUser()

  useEffect(() => {
    if (user?.id) {
      fetchAppointments()
    }
  }, [user?.id])

  async function fetchAppointments() {
    try {
      setLoading(true)
      // Fetch only appointments for this vendor
      const data = await appointments.list({ vendorId: user.id }, token)
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
      toast.success(`Appointment status updated to ${newStatus}`)
      
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
    <div className="p-4 lg:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Appointments</h1>
          <p className="text-slate-500 text-sm mt-1">Customers coming to your stores.</p>
        </div>
        
        <div className="flex w-full md:w-auto gap-3">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search appointments..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 bg-white border-slate-200"
            />
          </div>
          <Button variant="outline" onClick={fetchAppointments} className="h-11">
            Refresh
          </Button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-slate-200">
              <TableHead className="font-bold text-slate-700 py-4 px-6">Customer</TableHead>
              <TableHead className="font-bold text-slate-700 py-4 px-6">Assigned Store</TableHead>
              <TableHead className="font-bold text-slate-700 py-4 px-6">Schedule</TableHead>
              <TableHead className="font-bold text-slate-700 py-4 px-6">Reason</TableHead>
              <TableHead className="font-bold text-slate-700 py-4 px-6">Status</TableHead>
              <TableHead className="text-right font-bold text-slate-700 py-4 px-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-24 text-slate-400">Loading appointments...</TableCell>
              </TableRow>
            ) : filteredAppointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-24 text-slate-500">
                  <div className="flex flex-col items-center gap-2">
                    <Calendar className="w-8 h-8 opacity-20" />
                    <p className="font-medium">No appointments scheduled yet.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredAppointments.map((app) => (
                <TableRow key={app._id} className="hover:bg-slate-50/80 transition-colors border-slate-100">
                  <TableCell className="py-4 px-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{app.customerName}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {app.customerPhone}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]">
                      <MapPin className="w-3.5 h-3.5 text-blue-500" />
                      {app.storeId?.name || 'Unknown Store'}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">{format(new Date(app.appointmentDate), 'dd MMM yyyy')}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> {app.timeSlot}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest border border-blue-100">
                      {app.reason || 'Eye Test'}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <Badge variant="outline" className={`${getStatusColor(app.status)} capitalize border-none px-3 py-1 rounded-full text-[10px] tracking-widest font-black`}>
                      {app.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 px-6 text-right">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => {
                        setSelectedAppointment(app)
                        setIsDetailsOpen(true)
                      }}
                      className="hover:bg-blue-50 text-blue-600 rounded-xl w-10 h-10"
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
        <DialogContent className="max-w-md p-6 bg-white border border-slate-200">
          <div className="mb-4">
            <h2 className="text-2xl font-bold font-sans text-slate-900">Appointment</h2>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Details & Actions</p>
          </div>

          {selectedAppointment && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1.5 underline decoration-blue-500/30 decoration-2 underline-offset-2">Customer</p>
                  <p className="font-bold text-slate-900 text-lg leading-tight">{selectedAppointment.customerName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedAppointment.customerPhone}</p>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-center">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">Booking Status</p>
                  <Badge className={`${getStatusColor(selectedAppointment.status)} border-none rounded-full uppercase text-[9px] px-3 py-1 tracking-[2px] font-black w-fit`}>
                    {selectedAppointment.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4 bg-slate-900/5 p-5 rounded-2xl border border-slate-900/5">
                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center shrink-0 group-hover:border-blue-500/30 transition-colors shadow-sm">
                    <Calendar className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Planned Visit</p>
                    <p className="font-bold text-slate-900">{format(new Date(selectedAppointment.appointmentDate), 'EEEE, dd MMMM')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center shrink-0 group-hover:border-blue-500/30 transition-colors shadow-sm">
                    <Clock className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Visit Time</p>
                    <p className="font-bold text-slate-900">{selectedAppointment.timeSlot}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 group bg-blue-50 p-3 rounded-xl border border-blue-100">
                  <div className="w-8 h-8 bg-white rounded-lg border border-blue-200 flex items-center justify-center shrink-0 shadow-sm">
                    <Eye className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[9px] text-blue-400 uppercase tracking-[2px] font-black leading-none mb-1">Reason for Visit</p>
                    <p className="font-bold text-blue-700">{selectedAppointment.reason || 'Eye Test'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center shrink-0 group-hover:border-blue-500/30 transition-colors shadow-sm">
                    <MapPin className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Location</p>
                    <p className="font-bold text-slate-900 truncate">{selectedAppointment.storeId?.name}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <Button 
                  onClick={() => handleUpdateStatus(selectedAppointment._id, 'completed')}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 rounded-2xl gap-2 shadow-lg active:scale-[0.98] transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" /> Mark as Attended
                </Button>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => handleUpdateStatus(selectedAppointment._id, 'confirmed')}
                    className="flex-1 bg-white border-slate-200 text-slate-700 h-12 rounded-2xl font-bold hover:bg-slate-50 transition-all"
                  >
                    Confirm Visit
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => handleUpdateStatus(selectedAppointment._id, 'cancelled')}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white border-none h-12 rounded-2xl font-bold shadow-md active:scale-[0.98] transition-all"
                  >
                    No-Show
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default VendorAppointmentsPage
