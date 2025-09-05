"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useDeviceStore } from "@/store/device-store";

async function fetchGroups(device: string) {
  const res = await fetch(`/api/${device}/groups`);
  if (!res.ok) {
    throw new Error("Failed to fetch groups");
  }
  return res.json();
}

async function createContactGroup(data: { device: string, groupId: string, groupName: string }) {
  const res = await fetch(`/api/${data.device}/groups`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ groupId: data.groupId, groupName: data.groupName }),
  });
  if (!res.ok) {
    throw new Error("Failed to create contact group");
  }
  return res.json();
}

interface Group {
  id: string;
  subject: string;
}

export default function GroupExtraction() {
  const { device } = useDeviceStore();
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["groups", device],
    queryFn: () => fetchGroups(device!),
    enabled: !!device,
  });

  const mutation = useMutation({ mutationFn: createContactGroup });

  const handleCreateContactGroup = () => {
    if (selectedGroup) {
      mutation.mutate({ device: device!, groupId: selectedGroup.id, groupName: selectedGroup.subject });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Fetch Groups</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Your Groups</DialogTitle>
          <DialogDescription>
            Select a group to extract contacts from.
          </DialogDescription>
        </DialogHeader>
        <div>
          {isLoading && <p>Loading...</p>}
          {error && <p>Error fetching groups</p>}
          {data && (
            <ul>
              {data.groups.map((group: Group) => (
                <li key={group.id}>
                  <label>
                    <input
                      type="radio"
                      name="group"
                      value={group.id}
                      onChange={() => setSelectedGroup(group)}
                    />
                    {group.subject}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Button disabled={!selectedGroup || mutation.isPending} onClick={handleCreateContactGroup}>
          {mutation.isPending ? "Creating..." : "Create Contact Group"}
        </Button>
        {mutation.isSuccess && <p>Contact group created successfully!</p>}
        {mutation.isError && <p>Error creating contact group</p>}
      </DialogContent>
    </Dialog>
  );
}
