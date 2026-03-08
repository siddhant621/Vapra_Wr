import {
  Calendar,
  Video,
  CreditCard,
  User,
  FileText,
  ShieldCheck,
} from "lucide-react";

// JSON data for features
export const features = [
  {
    icon: <User className="h-6 w-6 text-emerald-400" />,
    title: "Create Your Profile",
    description:
      "Sign up and complete your profile so we can match you with mechanics and track your vehicle history.",
  },
  {
    icon: <Calendar className="h-6 w-6 text-emerald-400" />,
    title: "Book Appointments",
    description:
      "Browse certified mechanics, check availability, and schedule service appointments that work for you.",
  },
  {
    icon: <Video className="h-6 w-6 text-emerald-400" />,
    title: "Remote Consultations",
    description:
      "Connect with mechanics via secure video for diagnostics, estimates, and advice before you visit.",
  },
  {
    icon: <CreditCard className="h-6 w-6 text-emerald-400" />,
    title: "Credit-Based Payments",
    description:
      "Buy credit bundles to pay for services, parts, and consultations—all in one easy system.",
  },
  {
    icon: <ShieldCheck className="h-6 w-6 text-emerald-400" />,
    title: "Verified Mechanics",
    description:
      "All mechanics are vetted and verified so you can trust the quality of service.",
  },
  {
    icon: <FileText className="h-6 w-6 text-emerald-400" />,
    title: "Service History",
    description:
      "Access past appointments, invoices, and service notes anytime in your dashboard.",
  },
];

// JSON data for testimonials
export const testimonials = [
  {
    initials: "RK",
    name: "Ravi K.",
    role: "Customer",
    quote:
      "Booking a mechanic through Vapra was effortless. My car was repaired quickly, and I could track the service details right in the app.",
  },
  {
    initials: "AM",
    name: "Anita M.",
    role: "Mechanic",
    quote:
      "The platform makes it easy to manage my schedule and connect with customers who need reliable service.",
  },
  {
    initials: "SV",
    name: "Sanjay V.",
    role: "Customer",
    quote:
      "I love the credit system. It keeps billing simple and lets me book services without fumbling through invoices.",
  },
];

// JSON data for credit system benefits
export const creditBenefits = [
  "Each service booking uses <strong class='text-emerald-400'>2 credits</strong> so you know what each appointment costs.",
  "Credits <strong class='text-emerald-400'>never expire</strong>—use them whenever your vehicle needs work.",
  "Monthly subscriptions give you <strong class='text-emerald-400'>fresh credits every month</strong> for regular maintenance.",
  "Use credits for inspections, repairs, and video consultations with mechanics.",
];
