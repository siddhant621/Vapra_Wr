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
import { Check, X, User, BadgeCheck, ExternalLink, FileText } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { updateDoctorStatus } from "@/actions/admin";
import useFetch from "@/hooks/use-fetch";

export function PendingMechanics({ mechanics }) {
  const [selectedMechanic, setSelectedMechanic] = useState(null);

  const { loading, data, fn: submitStatusUpdate } = useFetch(updateDoctorStatus);

  const handleViewDetails = (mechanic) => {
    setSelectedMechanic(mechanic);
  };

  const handleCloseDialog = () => {
    setSelectedMechanic(null);
  };

  const handleUpdateStatus = async (mechanicId, status) => {
    if (loading) return;

    const formData = new FormData();
    formData.append("doctorId", mechanicId);
    formData.append("status", status);

    await submitStatusUpdate(formData);
  };

  useEffect(() => {
    if (data?.success) {
      handleCloseDialog();
    }
  }, [data]);

  return (
    <div>
      <Card className="bg-muted/20 border-emerald-900/20">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">
            Pending Mechanic Verifications
          </CardTitle>
          <CardDescription>Review new mechanic applications</CardDescription>
        </CardHeader>
        <CardContent>
          {mechanics.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending verification requests at this time.
            </div>
          ) : (
            <div className="space-y-4">
              {mechanics.map((mechanic) => (
                <Card
                  key={mechanic.id}
                  className="bg-background border-emerald-900/20 hover:border-emerald-700/30 transition-all"
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-muted/20 rounded-full p-2">
                          <User className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-white">
                            {mechanic.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {mechanic.specialty} • {mechanic.experience} years
                            experience
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end md:self-auto">
                        <Badge
                          variant="outline"
                          className="bg-amber-900/20 border-amber-900/30 text-amber-400"
                        >
                          Pending
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(mechanic)}
                          className="border-emerald-900/30 hover:bg-muted/80"
                        >
                          View Details
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

      {selectedMechanic && (
        <Dialog open={!!selectedMechanic} onOpenChange={handleCloseDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">
                Mechanic Verification Details
              </DialogTitle>
              <DialogDescription>
                Review the mechanic&apos;s information before approving.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="space-y-1 flex-1">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Full Name
                  </h4>
                  <p className="text-base font-medium text-white">
                    {selectedMechanic.name}
                  </p>
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Email
                  </h4>
                  <p className="text-base font-medium text-white">
                    {selectedMechanic.email}
                  </p>
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Application Date
                  </h4>
                  <p className="text-base font-medium text-white">
                    {format(new Date(selectedMechanic.createdAt), "PPP")}
                  </p>
                </div>
              </div>

              <Separator className="bg-emerald-900/20" />

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-white font-medium">Professional Info</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Specialty
                    </h4>
                    <p className="text-white">{selectedMechanic.specialty}</p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Years of Experience
                    </h4>
                    <p className="text-white">
                      {selectedMechanic.experience} years
                    </p>
                  </div>

                  <div className="space-y-1 col-span-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Credentials
                    </h4>
                    <div className="flex items-center">
                      <a
                        href={selectedMechanic.credentialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 flex items-center"
                      >
                        View Credentials
                        <ExternalLink className="h-4 w-4 ml-1" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="bg-emerald-900/20" />

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-white font-medium">Service Description</h3>
                </div>
                <p className="text-muted-foreground whitespace-pre-line">
                  {selectedMechanic.description}
                </p>
              </div>
            </div>

            <DialogFooter className="flex sm:justify-between">
              <Button
                variant="destructive"
                onClick={() => handleUpdateStatus(selectedMechanic.id, "REJECTED")}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700"
              >
                <X className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button
                onClick={() => handleUpdateStatus(selectedMechanic.id, "VERIFIED")}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Check className="mr-2 h-4 w-4" />
                Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
