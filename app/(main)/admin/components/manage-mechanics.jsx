"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { createMechanic, setMechanicVerification, removeMechanic } from "@/actions/admin";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";

export function ManageMechanics({ mechanics = [] }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [experience, setExperience] = useState(0);
  const [slots, setSlots] = useState([]);
  const [slotDate, setSlotDate] = useState("");
  const [slotTime, setSlotTime] = useState("");
  const [selectedMechanicId, setSelectedMechanicId] = useState("");
  const [loading, setLoading] = useState(false);

  const [localMechanics, setLocalMechanics] = useState(mechanics);
  const { loading: statusLoading, fn: updateMechanicStatus } = useFetch(setMechanicVerification);
  const { loading: removeLoading, fn: deleteMechanic } = useFetch(removeMechanic);

  const selectedMechanic = useMemo(
    () => localMechanics.find((m) => m.id === selectedMechanicId),
    [localMechanics, selectedMechanicId]
  );

  const handleAddSlot = () => {
    if (!selectedMechanicId || !slotDate || !slotTime) {
      toast.error("Select a mechanic and provide date/time for slot.");
      return;
    }

    const slot = `${slotDate} ${slotTime}`;
    setSlots((prev) => [
      ...prev,
      {
        id: `${selectedMechanicId}-${slot}-${prev.length}`,
        mechanicId: selectedMechanicId,
        mechanicName: selectedMechanic?.name ?? "Unknown",
        date: slotDate,
        time: slotTime,
      },
    ]);

    setSlotTime("");
    setSlotDate("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !specialty.trim() || experience < 0) {
      toast.error("Please fill in all mechanic details correctly.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("email", email.trim());
      formData.append("specialty", specialty.trim());
      formData.append("experience", String(experience));

      const result = await createMechanic(formData);
      if (result?.mechanic) {
        setLocalMechanics((prev) => {
          const existingIndex = prev.findIndex((m) => m.id === result.mechanic.id);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = result.mechanic;
            return updated;
          }
          return [...prev, result.mechanic];
        });
      }

      toast.success("Mechanic created successfully.");
      setName("");
      setEmail("");
      setSpecialty("");
      setExperience(0);
    } catch (error) {
      console.error("Failed to create mechanic", error);
      toast.error("Failed to create mechanic");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="manage" className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-2xl font-bold text-white mb-3">Manage Mechanics</h2>
        <p className="text-sm text-slate-300 mb-4">
          Add new mechanics and allocate time slots dynamically.
        </p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mechanic@example.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="specialty">Specialty</Label>
            <Input
              id="specialty"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="Engine / AC / Bodywork"
              required
            />
          </div>
          <div>
            <Label htmlFor="experience">Experience (years)</Label>
            <Input
              id="experience"
              type="number"
              min={0}
              value={experience}
              onChange={(e) => setExperience(Number(e.target.value))}
              required
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="bio">Profile Notes</Label>
            <Textarea id="bio" placeholder="Optional notes" />
          </div>

          <div className="md:col-span-2 flex items-center gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Mechanic"}
            </Button>
            <span className="text-xs text-muted-foreground">After creation, the mechanic appears in the list below.</span>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Mechanic verification</h3>
        {localMechanics.length === 0 ? (
          <p className="text-slate-300">No mechanics available yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-white/10 bg-slate-950 p-3">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-2 pr-4 text-white">Name</th>
                  <th className="py-2 pr-4 text-white">Specialty</th>
                  <th className="py-2 pr-4 text-white">Status</th>
                  <th className="py-2 pr-4 text-white">Action</th>
                </tr>
              </thead>
              <tbody>
                {localMechanics.map((m) => (
                  <tr key={m.id} className="border-b border-white/10 hover:bg-white/5">
                    <td className="py-2 text-white">{m.name}</td>
                    <td className="py-2 text-slate-300">{m.specialty || "General"}</td>
                    <td className="py-2">
                      <Badge
                        className={
                          m.verificationStatus === "VERIFIED"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : m.verificationStatus === "REJECTED"
                            ? "bg-red-500/20 text-red-300 border-red-500/30"
                            : "bg-orange-500/20 text-orange-300 border-orange-500/30"
                        }
                      >
                        {m.verificationStatus || "PENDING"}
                      </Badge>
                    </td>
                    <td className="py-2">
                      {m.verificationStatus !== "VERIFIED" ? (
                        <Button
                          size="sm"
                          disabled={statusLoading}
                          onClick={async () => {
                            try {
                              const formData = new FormData();
                              formData.append("mechanicId", m.id);
                              formData.append("status", "VERIFIED");
                              await updateMechanicStatus(formData);
                              setLocalMechanics((prev) =>
                                prev.map((item) =>
                                  item.id === m.id ? { ...item, verificationStatus: "VERIFIED" } : item
                                )
                              );
                              toast.success("Mechanic approved successfully");
                            } catch (error) {
                              console.error("Mechanic approval failed", error);
                              toast.error("Could not approve mechanic");
                            }
                          }}
                        >
                          Approve
                        </Button>
                      ) : (
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Approved</Badge>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        className="ml-2"
                        disabled={removeLoading}
                        onClick={async () => {
                          try {
                            const formData = new FormData();
                            formData.append("mechanicId", m.id);
                            await deleteMechanic(formData);
                            setLocalMechanics((prev) => prev.filter((item) => item.id !== m.id));
                            toast.success("Mechanic removed successfully");
                          } catch (error) {
                            console.error("Mechanic removal failed", error);
                            toast.error("Could not remove mechanic");
                          }
                        }}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
