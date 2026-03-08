"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, MessageSquare, Phone, ArrowLeft, Loader2, Mic, MicOff } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";
import { sendContactMessage } from "@/actions/contact";

export default function ContactSupportPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [recording, setRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [transcriptionStatus, setTranscriptionStatus] = useState("idle");
  const recognitionRef = useRef(null);

  const { loading, fn: submitContactForm } = useFetch(sendContactMessage);

  useEffect(() => {
    const SpeechRecognition =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.lang = "en-IN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) {
          setFormData((prev) => ({
            ...prev,
            message: prev.message ? `${prev.message} ${transcript}` : transcript,
          }));
          setTranscriptionStatus("transcribed");
        }
      };

      recognition.onend = () => {
        setRecording(false);
        setTranscriptionStatus((prev) => (prev === "listening" ? "idle" : prev));
      };

      recognition.onerror = () => {
        setRecording(false);
        setTranscriptionStatus("error");
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const startRecording = () => {
    if (!recognitionRef.current || recording) return;
    setRecording(true);
    setTranscriptionStatus("listening");
    recognitionRef.current.start();
  };

  const stopRecording = () => {
    if (!recognitionRef.current || !recording) return;
    recognitionRef.current.stop();
    setRecording(false);
    setTranscriptionStatus("idle");
  };

  const handleCheckSystemStatus = () => {
    // Open a real system status page. Replace this URL with your actual status dashboard if needed.
    window.open("https://status.vapra.com", "_blank", "noopener,noreferrer");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!formData.email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      const result = await submitContactForm(formData);
      if (result?.success) {
        toast.success("Message sent successfully! We'll get back to you within 24 hours.");
        // Reset form
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: "",
        });
      }
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Contact Support</h1>
            <p className="text-muted-foreground mt-1">
              Need help? We're here to assist you with your Vapra Workshop account.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <Card className="border-emerald-900/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-emerald-400" />
                Send us a Message
              </CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you within 24 hours.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    name="subject"
                    placeholder="Brief description of your issue"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>

                  <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Please describe your issue in detail..."
                      rows={5}
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      className="flex-1"
                    />

                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant={recording ? "outline" : "secondary"}
                        onClick={recording ? stopRecording : startRecording}
                        disabled={!speechSupported}
                        className="min-w-[10rem] flex items-center justify-center gap-2"
                      >
                        {recording ? (
                          <>
                            <MicOff className="h-4 w-4" />
                            Stop Recording
                          </>
                        ) : (
                          <>
                            <Mic className="h-4 w-4" />
                            Record Voice
                          </>
                        )}
                      </Button>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            transcriptionStatus === "listening"
                              ? "default"
                              : transcriptionStatus === "transcribed"
                              ? "secondary"
                              : transcriptionStatus === "error"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {transcriptionStatus === "listening"
                            ? "Listening..."
                            : transcriptionStatus === "transcribed"
                            ? "Transcribed"
                            : transcriptionStatus === "error"
                            ? "Error"
                            : "Idle"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {speechSupported
                            ? "Speak to add text to the message."
                            : "Speech recognition not supported."}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Message"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-6">
            <Card className="border-emerald-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-emerald-400" />
                  Other Ways to Reach Us
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-emerald-400" />
                  <div>
                    <p className="font-medium">Email Support</p>
                    <p className="text-sm text-muted-foreground">support@vapra.com</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-emerald-400" />
                  <div>
                    <p className="font-medium">Phone Support</p>
                    <p className="text-sm text-muted-foreground">1-800-VAPRA</p>
                    <p className="text-xs text-muted-foreground">Mon-Fri 9AM-6PM EST</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-900/20">
              <CardHeader>
                <CardTitle>Common Issues</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-medium text-sm">Verification Taking Too Long?</h4>
                  <p className="text-xs text-muted-foreground">
                    Verification typically takes 1-2 business days.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-sm">Having Trouble with Video Calls?</h4>
                  <p className="text-xs text-muted-foreground">
                    Check your browser permissions and internet connection.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-sm">Billing Questions?</h4>
                  <p className="text-xs text-muted-foreground">
                    Contact us for help with credits and payments.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-900/20 bg-emerald-950/10">
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="font-semibold text-emerald-400 mb-2">Need Immediate Help?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    For urgent technical issues, check our status page or reach out to emergency support.
                  </p>
                  <Button variant="outline" size="sm" onClick={handleCheckSystemStatus}>
                    Check System Status
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
