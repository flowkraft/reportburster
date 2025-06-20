"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface TestimonialProps {
  image: string
  name: string
  userName: string
  comment: string
}

const testimonials: TestimonialProps[] = [
  {
    image: "",
    name: "Michael B.",
    userName: "Finance Systems Team@English Heritage",
    comment:
      "DocumentBurster has saved 2+ hours a day of manual report running and emailing. The task takes minutes to complete from start to finish for 40-80 purchase orders per day. With the added variables we can email, cc and add different subject text/ paragraph in email body. On first use by user it was reported it took sub 16 seconds to burst and email.",
  },
  {
    image: "",
    name: "Dave P.",
    userName: "Director of IT@Human Services Management Corporation",
    comment:
      "DocumentBurster has allowed us to automate a 2+ hour process of hand sorting printed documents into a sub 5 second task. This added flexibility allows us to distribute the reports to our sites within minutes as opposed to incurring the additional cost, time and potential loss of sending them via postal service.",
  },
  {
    image: "",
    name: "Christian K.",
    userName: "IS Manager@Workers' Compensation Reinsurance Association",
    comment:
      "DocumentBurster was the missing piece that allowed us to connect our report generating system to our document imaging system. Now, reports can be generated and automatically burst and submitted to our document imaging system. The software has worked flawlessly and support for the software has been great.",
  },
  {
    image: "",
    name: "John F.",
    userName: "Systems Analyst@Lewis and Roca Law",
    comment:
      "DocumentBurster is a great product. I spent the last two years searching for a reasonably priced product to dynamic burst and distribute reports. It has the functionality desired and works exactly as advertised. The GUI is very user friendly and requires almost no training. I highly recommend the product",
  },
  {
    image: "",
    name: "François R.",
    userName: "Information Technology@Hallé Couture et associées Ltée",
    comment:
      "DocumentBurster has allowed us to distribute monthly production report to each representative in seconds. The variable flexibility allows us to split really the way we wanted and even drop it at the right place on the server. ",
  },
  {
    image: "",
    name: "Marylou G.",
    userName: "Chief Financial Officer@ParkTrent Properties Group",
    comment:
      "We are a Property Development and Investment Company with nearly 200 staff all around the country. We use LEWIS PAYPACK, and had to print payslips using the expensive continuous envelope paper (very expensive) for payslips. It was a manual process to separate the report, and our staff have to walk around the office to distribute them for head office. The interstate offices payslips had to be sent through express posts so they can have their payslips the next day. The manual process was expensive and unproductive. I found that I can supplement LEWIS PAY software with DocumentBurster, and be able to distribute payslips by email - WOW without leaving your desk. DocumentBurster saved us a lot of money through paper supply and man power productivity. I also had a great help from the Support Team of DocumentBurster, who stayed with me the entire installation and Test process.",
  },
  {
    image: "",
    name: "Barbara M.",
    userName: "Business Analyst@Morguard Investments Ltd",
    comment:
      "Morguard Investments Ltd recently purchased DocumentBurster to burst and distribute a JDEdward EnterpriseOne PDF employee attendance report. The manual process consumed a lot of paper and 1 or 2 days of head office labour and was a very monotonous process. The 568 page report would be printed and separated by location (50+) and supervisor (100+) and sent via courier or interoffice mail. The supervisors would then distribute the single pages to each employee. Using DocumentBurster we are able to split the 568 page PDF into 568 single PDF's and email them to individual employee's across the country. We are also able to group the single employee reports by supervisor and email them to each supervisor. We saved several trees and some employees sanity! The entire burst and email distribution process takes less than 20 minutes. DocumentBurster does everything they say it does and it really is simple to configure and use.",
  },
]

export const LandingTestimonials = () => {
  return (
    <section
      id="testimonials"
      className="container py-2 sm:py-3"
      aria-label="Testimonials"
    >
      <h2 className="text-3xl md:text-4xl font-bold">
        How
        <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
          {" "}
          Organizations Use{" "}
        </span>
        ReportBurster
      </h2>

      <p className="text-xl text-muted-foreground pt-4 pb-8"></p>

      <div
        className="grid md:grid-cols-2 lg:grid-cols-4 sm:block columns-2 lg:columns-3 lg:gap-6 mx-auto space-y-4  
 lg:space-y-6"
      >
        {testimonials.map(({ image, name, userName, comment }) => (
          <Card
            key={userName}
            className="max-w-md md:break-inside-avoid overflow-hidden"
          >
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <Avatar>
                <AvatarImage alt={`${name}'s avatar`} src={image} />
                <AvatarFallback>{name[0]}</AvatarFallback>
              </Avatar>

              <div className="flex flex-col">
                <CardTitle className="text-lg">{name}</CardTitle>
                <CardDescription>{userName}</CardDescription>
              </div>
            </CardHeader>

            <CardContent>{comment}</CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
