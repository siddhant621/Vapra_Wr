"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Ban, Loader2, User, Search, Plus, Trash2, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createMechanic, removeMechanic, updateBookingStatus } from "@/actions/admin";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function VerifiedMechanics({ mechanics }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newMechanic, setNewMechanic] = useState({
    name: "",
    email: "",
    phone: "",
    specialty: "",
    experience: "",
  });

  const { loading: createLoading, fn: submitCreateMechanic } = useFetch(createMechanic);
  const { loading: removeLoading, fn: submitRemoveMechanic } = useFetch(removeMechanic);
  const { loading: statusLoading, fn: submitStatusChange } = useFetch(updateBookingStatus);

  const filteredMechanics = mechanics.filter((mechanic) => {
    const query = searchTerm.toLowerCase();
    return (
      mechanic.name?.toLowerCase().includes(query) ||
      mechanic.specialty?.toLowerCase().includes(query) ||
      mechanic.email?.toLowerCase().includes(query)
    );
  });

  const handleAddMechanic = async () => {
    if (!newMechanic.name || !newMechanic.email || !newMechanic.phone || !newMechanic.specialty) {
      toast.error("Please fill in all required fields");
      return;
    }

    const formData = new FormData();
    formData.append("name", newMechanic.name);
    formData.append("email", newMechanic.email);
    formData.append("phone", newMechanic.phone);
    formData.append("specialty", newMechanic.specialty);
    if (newMechanic.experience) {
      formData.append("experience", newMechanic.experience);
    }

    await submitCreateMechanic(formData);
  };

  const handleRemoveMechanic = async (mechanic) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove ${mechanic.name}? This will remove their mechanic role.`
    );
    if (!confirmed) return;

    const formData = new FormData();
    formData.append("mechanicId", mechanic.id);
    await submitRemoveMechanic(formData);
  };

  useEffect(() => {
    if (submitCreateMechanic.data?.success) {
      toast.success("Mechanic added successfully!");
      setIsAddDialogOpen(false);
      setNewMechanic({ name: "", email: "", phone: "", specialty: "", experience: "" });
    }
  }, [submitCreateMechanic.data]);

  useEffect(() => {
    if (submitRemoveMechanic.data?.success) {
      toast.success("Mechanic removed successfully!");
    }
  }, [submitRemoveMechanic.data]);

  return (
    <div>
      <Card className="bg-muted/20 border-emerald-900/20">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-white">
                Mechanics Management
              </CardTitle>
              <CardDescription>Add, view and manage all mechanics</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search mechanics..."
                  className="pl-8 bg-background border-emerald-900/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Mechanic
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Mechanic</DialogTitle>
                    <DialogDescription>
                      Enter the mechanic details to add them to your team.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        placeholder="Enter mechanic name"
                        value={newMechanic.name}
                        onChange={(e) =>
                          setNewMechanic({ ...newMechanic, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="mechanic@example.com"
                        value={newMechanic.email}
                        onChange={(e) =>
                          setNewMechanic({ ...newMechanic, email: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        placeholder="Enter phone number"
                        value={newMechanic.phone}
                        onChange={(e) =>
                          setNewMechanic({ ...newMechanic, phone: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="specialty">Specialty *</Label>
                      <Select
                        value={newMechanic.specialty}
                        onValueChange={(value) =>
                          setNewMechanic({ ...newMechanic, specialty: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select specialty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="General Repair">General Repair</SelectItem>
                          <SelectItem value="Engine">Engine</SelectItem>
                          <SelectItem value="Transmission">Transmission</SelectItem>
                          <SelectItem value="Brakes">Brakes</SelectItem>
                          <SelectItem value="Electrical">Electrical</SelectItem>
                          <SelectItem value="AC/Heating">AC/Heating</SelectItem>
                          <SelectItem value="Body Work">Body Work</SelectItem>
                          <SelectItem value="Diagnostics">Diagnostics</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="experience">Experience (years)</Label>
                      <Input
                        id="experience"
                        type="number"
                        placeholder="Years of experience"
                        value={newMechanic.experience}
                        onChange={(e) =>
                          setNewMechanic({ ...newMechanic, experience: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddMechanic}
                      disabled={createLoading}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {createLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Add Mechanic
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredMechanics.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm
                ? "No mechanics match your search criteria."
                : "No mechanics available. Click 'Add Mechanic' to add one."}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMechanics.map((mechanic) => (
                <Card
                  key={mechanic.id}
                  className="bg-background border-emerald-900/20 hover:border-emerald-700/30 transition-all"
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-muted/20 rounded-full p-2">
                          <Wrench className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-white">{mechanic.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {mechanic.specialty} • {mechanic.experience || 0} years experience
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {mechanic.email}
                          </p>
                          {/* Work Status */}
                          <div className="mt-3 flex gap-4">
                            <Badge variant="outline" className="bg-blue-900/20 border-blue-900/30 text-blue-400">
                              {mechanic.scheduledCount || 0} Scheduled
                            </Badge>
                            <Badge variant="outline" className="bg-amber-900/20 border-amber-900/30 text-amber-400">
                              {mechanic.inProgressCount || 0} In Progress
                            </Badge>
                            <Badge variant="outline" className="bg-emerald-900/20 border-emerald-900/30 text-emerald-400">
                              {mechanic.credits || 0} Credits
                            </Badge>
                          </div>
                          {/* Active Jobs */}
                          {mechanic.mechanicBookings?.length > 0 && (
                            <div className="mt-3 p-3 bg-muted/20 rounded-lg">
                              <p className="text-sm font-medium text-white mb-2">Active Jobs:</p>
                              {mechanic.mechanicBookings.map((booking) => (
                                <div key={booking.id} className="text-xs text-muted-foreground flex justify-between py-1">
                                  <span>{booking.vehicle?.brand} {booking.vehicle?.model}</span>
                                  <Badge variant="outline" className={booking.status === "IN_PROGRESS" ? "bg-amber-900/20" : "bg-blue-900/20"}>
                                    {booking.status}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end md:self-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveMechanic(mechanic)}
                          disabled={removeLoading}
                          className="border-red-900/30 hover:bg-red-900/10 text-red-400"
                        >
                          {removeLoading ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-1" />
                          )}
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
