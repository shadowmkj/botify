"use client";
import { useDeviceStore } from '@/store/device-store';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

const fetchDevicesFromDB = async (): Promise<string[]> => {
  const response = await fetch('/api/devices');
  const devices = await response.json();
  return devices.map((d: { id: string }) => d.id);
};

export default function DeviceInitializer() {
  const { setInitialState } = useDeviceStore();
  const { data: devices } = useQuery({
    queryKey: ['devices'],
    queryFn: fetchDevicesFromDB,
  });

  useEffect(() => {
    if (devices) {
      setInitialState(devices);
    }
  }, [devices, setInitialState]);

  return null;
}