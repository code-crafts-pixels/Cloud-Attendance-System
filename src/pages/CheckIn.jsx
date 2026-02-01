import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Camera, CheckCircle, XCircle, RefreshCw, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GlassCard from '@/components/ui/GlassCard';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export default function CheckIn() {
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [checkedEmployee, setCheckedEmployee] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: todayRecords = [] } = useQuery({
    queryKey: ['attendance', today],
    queryFn: () => base44.entities.AttendanceRecord.filter({ date: today }),
  });

  const checkInMutation = useMutation({
    mutationFn: (data) => base44.entities.AttendanceRecord.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['attendance']);
    },
  });

  const activeEmployees = employees.filter(e => e.status === 'active');
  const checkedInIds = todayRecords.map(r => r.employee_id);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error('Camera error:', err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setCameraActive(false);
    }
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const handleCheckIn = async () => {
    if (!selectedEmployee) return;
    
    const employee = employees.find(e => e.id === selectedEmployee);
    if (!employee) return;

    setIsChecking(true);
    
    // Simulate face recognition delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const now = new Date();
    const checkInHour = now.getHours();
    const isLate = checkInHour >= 9;

    await checkInMutation.mutateAsync({
      employee_id: employee.id,
      employee_name: employee.full_name,
      date: today,
      check_in_time: now.toISOString(),
      status: isLate ? 'late' : 'present',
      verification_method: 'facial_recognition',
      confidence_score: 98.5,
    });

    setCheckedEmployee(employee);
    setShowSuccess(true);
    setIsChecking(false);
    setSelectedEmployee('');

    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Check In</h1>
        <p className="text-gray-600 mt-1">
          Facial recognition attendance system
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Camera Section */}
        <div className="lg:col-span-2">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Camera Feed</h3>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-sm text-gray-600">
                  {cameraActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden">
              {cameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Face detection overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-blue-400 rounded-2xl opacity-60" />
                  </div>
                  {/* Confidence badge */}
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-lg">
                    <span className="text-2xl font-bold">98.5%</span>
                    <span className="text-xs block text-gray-300">Confidence</span>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <Camera className="w-16 h-16 text-gray-500 mb-4" />
                  <p className="text-gray-400">Camera not active</p>
                </div>
              )}
            </div>

            <div className="flex gap-4 mt-6">
              {!cameraActive ? (
                <Button onClick={startCamera} className="flex-1 h-12 bg-blue-600 hover:bg-blue-700">
                  <Camera className="w-5 h-5 mr-2" />
                  Start Camera
                </Button>
              ) : (
                <>
                  <Button onClick={stopCamera} variant="outline" className="h-12">
                    <XCircle className="w-5 h-5 mr-2" />
                    Stop
                  </Button>
                  <Button 
                    onClick={handleCheckIn}
                    disabled={!selectedEmployee || isChecking}
                    className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isChecking ? (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Check In
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Employee Selection */}
        <div className="lg:col-span-1 space-y-6">
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Employee</h3>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Choose an employee" />
              </SelectTrigger>
              <SelectContent>
                {activeEmployees.map(emp => (
                  <SelectItem 
                    key={emp.id} 
                    value={emp.id}
                    disabled={checkedInIds.includes(emp.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{emp.full_name}</span>
                      {checkedInIds.includes(emp.id) && (
                        <span className="text-xs text-emerald-600">(Checked in)</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedEmployee && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                {(() => {
                  const emp = employees.find(e => e.id === selectedEmployee);
                  return emp ? (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                        {emp.full_name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{emp.full_name}</p>
                        <p className="text-sm text-gray-500">{emp.department}</p>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-gray-600">Checked In</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">{todayRecords.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-gray-600" />
                  </div>
                  <span className="text-gray-600">Pending</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {activeEmployees.length - todayRecords.length}
                </span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md text-center">
          <div className="py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Check-In Successful!</h2>
            <p className="text-gray-600 mb-1">{checkedEmployee?.full_name}</p>
            <p className="text-sm text-gray-500">
              {format(new Date(), 'h:mm a')} • Facial Recognition
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}