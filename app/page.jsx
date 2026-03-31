import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { creditBenefits, features, testimonials, servicePlans } from "@/lib/data";
import { ArrowRight, Check, Wrench } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/actions/onboarding";
import TrackAppointmentButton from "@/components/track-appointment-button";

export default async function Home() {
  const user = await getCurrentUser();
  const isAdmin = user?.role === "ADMIN";
  const isCustomer = user?.role === "CUSTOMER";

  const primaryLabel = isAdmin ? "Dashboard" : "Book Service";
  const primaryHref = isAdmin ? "/admin" : "/onboarding";

  const secondaryLabel = "Appointments";
  const secondaryHref = isAdmin ? "/admin" : "/appointments";

  return (
    <div className="bg-background">
      <section className="relative overflow-hidden py-32">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Badge
                variant="outline"
                className="bg-orange-900/30 border-orange-700/30 px-4 py-2 text-orange-400 text-sm font-medium"
              >
                Services made simple
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Connect with Our Services <br />{" "}
                <span className="gradient-title">anytime, anywhere</span>
              </h1>
              <p className="text-muted-foreground text-lg md:text-xl max-w-md">
                A single platform to schedule services, monitor repairs, and
                maintain your vehicle's long-term health.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 ">
                {isAdmin ? (
                  <Button
                    asChild
                    size="lg"
                    className="bg-orange-600 text-white hover:bg-orange-700"
                  >
                    <Link href={primaryHref}>
                      {primaryLabel} <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <TrackAppointmentButton href={primaryHref} source="home-hero-primary">
                    {primaryLabel} <ArrowRight className="ml-2 h-4 w-4" />
                  </TrackAppointmentButton>
                )}

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="bg-orange-700/30 hover:bg-muted/80"
                >
                  <Link href={secondaryHref}>{secondaryLabel}</Link>
                </Button>
              </div>
            </div>
            <div className="relative h-[400px] lg:h-[500px] rounded-xl overflow-hidden">
              <Image
                src="/banner.jpg"
                alt="service appointment"
                fill
                priority
                className="object-cover md:pt-14 rounded-xl"
              />
            </div>
          </div>
        </div>
      </section>


      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Our platform makes vehicle repairs accessible with just a few clicks.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              return (
                <Card
                  key={index}
                  className="border-orange-900/20 hover:border-orange-800/40
                transition-all duration-300"
                >
                  <CardHeader className="pb-2">
                    <div className="bg-orange-900/20 p-3 rounded-lg w-fit mb-4">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl font-semibold text-white">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge
              className="bg-orange-900/30 border-orange-700/30 px-4 py-1
            text-orange-400 text-sm font-medium mb-4"
            >
              Affordable Repair and Maintenance
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Service Plans
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Choose the perfect service plan that fits your vehicle's needs.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {servicePlans.map((plan) => (
              <Card
                key={plan.name}
                className={`flex flex-col h-full border transition-all ${
                  plan.popular
                    ? "border-emerald-600/60 shadow-lg shadow-emerald-600/20 md:scale-105"
                    : "border-emerald-900/20 hover:border-emerald-900/40"
                }`}
              >
                {plan.popular && (
                  <Badge className="self-start bg-emerald-600 text-white px-3 py-1 mb-3">
                    Most Popular
                  </Badge>
                )}

                <CardHeader>
                  <CardTitle className="text-white">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <p className="text-3xl font-bold text-emerald-400">{plan.price}</p>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col justify-between space-y-6">
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="mt-1 h-4 w-4 text-emerald-400" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    asChild
                    size="sm"
                    className={`${
                      plan.popular
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-emerald-600/80 hover:bg-emerald-600"
                    }`}
                  >
                    <Link href="/onboarding">Pick Plan</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-10 bg-muted/20 border-orange-900/30">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-white flex items-center">
                <Wrench className="h-5 w-5 mr-2 text-orange-400" />
                How Our Credit System Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {creditBenefits.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <div className="mr-3 mt-1 bg-orange-900/20 p-1 rounded-full">
                      <Check className="h-4 w-4 text-orange-400" />
                    </div>
                    <p
                      className="text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: benefit }}
                    ></p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge
              variant="outline"
              className="bg-orange-900/30 border-orange-700/30 px-4 py-1 text-orange-400 text-sm
              font-medium mb-4"
            >
              Success Stories
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              What Our Users Say
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Hear from people who use our platform
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => {
              return (
                <Card
                  key={index}
                  className="border-orange-900/20 hover:border-orange-800/40
                transition-all duration-300"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center mb-4">
                      <div
                        className="w-12 h-12 rounded-full bg-orange-900/20 flex items-center
                      justify-center mr-4"
                      >
                        <span className="text-orange-400 font-bold">
                          {testimonial.initials}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">
                          {testimonial.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>

                    <p className="text-muted-foreground">
                      &quot;{testimonial.quote}&quot;
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-r from-orange-900/30 to-orange-950/20 border-orange-800/20">
            <CardContent className="p-8 md:p-12 lg:p-16 relative overflow-hidden">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Ready to take control of your vehicle's health?
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Join thousands of users who have simplified their car maintenance
                  journey with our platform. Get started today and experience
                  repair and maintenance the way it should be.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    className="bg-orange-600 text-white hover:bg-orange-700"
                    asChild
                  >
                    <Link href="/sign-up">Sign-up Now</Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-orange-700/30 hover:bg-muted/80"
                    asChild
                  >
                    <Link href="/pricing">View Pricing</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
